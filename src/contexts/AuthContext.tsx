'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { setSentryUser, clearSentryUser, reportAuthError, addBreadcrumb } from '@/lib/sentry'

export interface AuthUser extends User {
  role?: 'agent' | 'team_lead' | 'manager' | 'admin' | 'client'
}

type Agent = Database['public']['Tables']['agents']['Row']

interface AuthContextType {
  user: AuthUser | null
  agent: Agent | null
  loading: boolean
  connectionError: string | null
  retryAuth: () => Promise<void>
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, metadata?: any) => Promise<any>
  signOut: () => Promise<any>
  resetPassword: (email: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const fetchAgentData = async (userId: string) => {
    try {
      addBreadcrumb('Fetching agent data', 'auth', 'info', { userId })
      
      const { data: agentData, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code === 'PGRST116') {
        addBreadcrumb('No agent record found, creating new one', 'auth', 'info')
        // Get user data for email
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        // No agent record exists, create one
        const { data: newAgent, error: createError } = await supabase
          .from('agents')
          .insert({
            user_id: userId,
            agent_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Agent',
            email: currentUser?.email || '',
            status: 'active'
          })
          .select()
          .single()
        
        if (createError) {
          reportAuthError(createError as Error, {
            operation: 'signup',
            userId
          })
          throw createError
        }
        
        addBreadcrumb('Agent record created successfully', 'auth', 'info', {
          agentId: newAgent.id,
          agentName: newAgent.agent_name
        })
        setAgent(newAgent)
      } else if (error) {
        reportAuthError(error as Error, {
          operation: 'login',
          userId
        })
        throw error
      } else {
        addBreadcrumb('Agent data fetched successfully', 'auth', 'info', {
          agentId: agentData.id,
          agentName: agentData.agent_name
        })
        setAgent(agentData)
      }
    } catch (error) {
      reportAuthError(error as Error, {
        operation: 'login',
        userId
      })
      // Don't throw here - we can continue without agent data
      setAgent(null)
    }
  }

  const initAuth = async (retryCount = 0) => {
    try {
      console.log('AuthContext: Initializing authentication...', retryCount > 0 ? `(retry ${retryCount})` : '')
      
      // Clear any previous connection errors
      setConnectionError(null)
      
      // Set a reasonable timeout for the session check
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Authentication timed out')), 10000) // 10 seconds
      )
      
      const sessionPromise = supabase.auth.getSession()
      
      // Race between session check and timeout
      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any

      if (error) {
        console.error('AuthContext: Error getting session:', error)
        
        // Only retry on network/timeout errors, max 1 retry
        if (retryCount < 1 && (
          error.message.includes('timeout') || 
          error.message.includes('network') || 
          error.message.includes('fetch')
        )) {
          console.log('AuthContext: Retrying authentication in 2 seconds...')
          setTimeout(() => initAuth(retryCount + 1), 2000)
          return
        }
        
        // Set connection error for user feedback
        setConnectionError(`Authentication timed out. Please check your connection and try again.`)
        setUser(null)
        setAgent(null)
        setLoading(false)
        return
      }

      const currentUser = session?.user as AuthUser || null
      addBreadcrumb('Session check complete', 'auth', 'info', {
        userFound: !!currentUser,
        userId: currentUser?.id
      })
      
      setUser(currentUser)
      
      // Set Sentry user context
      if (currentUser) {
        setSentryUser({
          id: currentUser.id,
          email: currentUser.email,
          username: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
          role: 'agent'
        })
        
        fetchAgentData(currentUser.id).catch(error => {
          reportAuthError(error as Error, {
            operation: 'login',
            userId: currentUser.id
          })
          // Continue without agent data
        })
      } else {
        clearSentryUser()
        setAgent(null)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('AuthContext: Unexpected error during auth initialization:', error)
      
      // Only retry on timeout/network errors, max 1 retry
      if (retryCount < 1 && error instanceof Error && 
          (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('fetch'))) {
        console.log('AuthContext: Retrying authentication in 2 seconds...')
        setTimeout(() => initAuth(retryCount + 1), 2000)
        return
      }
      
      // Set connection error for user feedback
      const errorMessage = error instanceof Error ? error.message : 'Authentication initialization failed'
      setConnectionError(errorMessage.includes('timeout') 
        ? 'Authentication timed out. Please check your connection and try again.'
        : `Connection error: ${errorMessage}`
      )
      setUser(null)
      setAgent(null)
      setLoading(false)
    }
  }

  const retryAuth = async () => {
    setLoading(true)
    setConnectionError(null)
    await initAuth()
  }

  useEffect(() => {
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const user = session?.user as AuthUser || null
          setUser(user)
          
          if (user) {
            addBreadcrumb('User signed in', 'auth', 'info', {
              userId: user.id,
              email: user.email
            })
            
            setSentryUser({
              id: user.id,
              email: user.email,
              username: user.user_metadata?.full_name || user.email?.split('@')[0],
              role: 'agent'
            })
            
            fetchAgentData(user.id).catch(error => {
              reportAuthError(error as Error, {
                operation: 'login',
                userId: user.id
              })
            })
          }
        } else if (event === 'SIGNED_OUT') {
          addBreadcrumb('User signed out', 'auth', 'info')
          clearSentryUser()
          setUser(null)
          setAgent(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setConnectionError(null)
    
    try {
      addBreadcrumb('Attempting user sign in', 'auth', 'info', { email })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        reportAuthError(error as Error, {
          operation: 'login',
          provider: 'email'
        })
        
        if (error.message.includes('timeout') || error.message.includes('network')) {
          setConnectionError('Authentication timed out. Please check your connection and try again.')
        }
        throw error
      }
      
      addBreadcrumb('User sign in successful', 'auth', 'info', {
        userId: data.user?.id,
        email: data.user?.email
      })
      
      return data
    } catch (error) {
      reportAuthError(error as Error, {
        operation: 'login',
        provider: 'email'
      })
      throw error
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    setConnectionError(null)
    
    try {
      addBreadcrumb('Attempting user sign up', 'auth', 'info', { email })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })
      
      if (error) {
        reportAuthError(error as Error, {
          operation: 'signup',
          provider: 'email'
        })
        throw error
      }
      
      addBreadcrumb('User sign up successful', 'auth', 'info', {
        userId: data.user?.id,
        email: data.user?.email
      })
      
      return data
    } catch (error) {
      reportAuthError(error as Error, {
        operation: 'signup',
        provider: 'email'
      })
      throw error
    }
  }

  const signOut = async () => {
    setConnectionError(null)
    
    try {
      addBreadcrumb('Attempting user sign out', 'auth', 'info')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        reportAuthError(error as Error, {
          operation: 'logout',
          userId: user?.id
        })
        throw error
      }
      
      addBreadcrumb('User sign out successful', 'auth', 'info')
      clearSentryUser()
      setUser(null)
      setAgent(null)
    } catch (error) {
      reportAuthError(error as Error, {
        operation: 'logout',
        userId: user?.id
      })
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    setConnectionError(null)
    
    try {
      addBreadcrumb('Attempting password reset', 'auth', 'info', { email })
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email)
      
      if (error) {
        reportAuthError(error as Error, {
          operation: 'reset',
          provider: 'email'
        })
        throw error
      }
      
      addBreadcrumb('Password reset successful', 'auth', 'info', { email })
      
      return data
    } catch (error) {
      reportAuthError(error as Error, {
        operation: 'reset',
        provider: 'email'
      })
      throw error
    }
  }

  const value = {
    user,
    agent,
    loading,
    connectionError,
    retryAuth,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}