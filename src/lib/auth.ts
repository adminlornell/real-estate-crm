import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  role?: 'agent' | 'team_lead' | 'manager' | 'admin' | 'client'
}

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  },

  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({
      password,
    })
    return { data, error }
  },

  async createAgentProfile(userId: string, agentData: any) {
    try {
      const { data, error } = await supabase
        .from('agents')
        .insert({
          user_id: userId,
          agent_name: agentData.agent_name || 'New Agent',
          email: agentData.email,
          phone: agentData.phone || null,
          status: 'active',
          hire_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating agent profile:', error)
      return { data: null, error }
    }
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // Fetch user role from agents table
          let { data: agent, error } = await supabase
            .from('agents')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          
          // If no agent record exists, create one
          if (error && error.code === 'PGRST116') {
            const agentData = {
              agent_name: session.user.user_metadata?.agent_name || 'New Agent',
              email: session.user.email,
              phone: session.user.user_metadata?.phone || null,
            }
            
            const { data: newAgent } = await authService.createAgentProfile(session.user.id, agentData)
            agent = newAgent
          }
          
          const userWithRole = {
            ...session.user,
            role: agent?.status || 'agent',
          } as AuthUser

          callback(userWithRole)
        } catch (error) {
          console.error('Error in auth state change:', error)
          // Fallback: return user without role
          const userWithRole = {
            ...session.user,
            role: 'agent',
          } as AuthUser
          callback(userWithRole)
        }
      } else {
        callback(null)
      }
    })
  },
}