'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export interface AuthUser extends User {
  role?: 'agent' | 'team_lead' | 'manager' | 'admin' | 'client'
}

type Agent = Database['public']['Tables']['agents']['Row']

interface AuthContextType {
  user: AuthUser | null
  agent: Agent | null
  loading: boolean
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

  const fetchAgentData = async (userId: string) => {
    try {
      console.log('AuthContext: Fetching agent data for user ID:', userId)
      
      const { data: agentData, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code === 'PGRST116') {
        console.log('AuthContext: No agent record found, creating new one')
        // Get user data for email
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        // No agent record exists, create one
        const { data: newAgent, error: createError } = await supabase
          .from('agents')
          .insert({
            user_id: userId,
            agent_name: 'New Agent',
            email: currentUser?.email || '',
            phone: null,
            status: 'active',
            hire_date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single()
        
        if (!createError && newAgent) {
          console.log('AuthContext: Created new agent:', newAgent)
          setAgent(newAgent)
        } else {
          console.error('AuthContext: Error creating agent:', createError)
        }
      } else if (!error && agentData) {
        console.log('AuthContext: Found existing agent:', agentData)
        setAgent(agentData)
      } else {
        console.error('AuthContext: Error fetching agent:', error)
      }
    } catch (error) {
      console.error('Error fetching agent data:', error)
    }
  }

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        // First check if there's an existing session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setLoading(false)
          }
          return
        }

        if (mounted) {
          const currentUser = session?.user as AuthUser || null
          setUser(currentUser)
          
          // Fetch agent data if user exists
          if (currentUser) {
            await fetchAgentData(currentUser.id)
          }
          
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.log('AuthContext: Timeout reached, setting loading to false')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      
      if (mounted) {
        const currentUser = session?.user as AuthUser || null
        setUser(currentUser)
        
        if (event === 'SIGNED_IN' && currentUser) {
          await fetchAgentData(currentUser.id)
        } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (currentUser) {
            // User is still authenticated after token refresh
            await fetchAgentData(currentUser.id)
          } else {
            // User is signed out
            setAgent(null)
          }
        }
        
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setAgent(null)
    }
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        agent,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}