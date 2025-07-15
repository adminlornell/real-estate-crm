'use client'

import { useEffect, useState } from 'react'
import { useBrowserBackButton } from '@/hooks/useBrowserBackButton'
import { supabase } from '@/lib/supabase'
import ConnectionMonitor from './ConnectionMonitor'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  // Handle browser back button globally
  useBrowserBackButton()
  
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize session recovery
    const initializeSession = async () => {
      try {
        // Attempt to recover existing session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session recovery error:', error)
        }
        
        if (session) {
          console.log('Session recovered successfully')
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize session:', error)
        setIsInitialized(true)
      }
    }

    initializeSession()

    // Handle page visibility changes to refresh session when tab becomes active
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) {
            console.warn('Session check failed on visibility change:', error)
          }
        } catch (error) {
          console.warn('Failed to check session on visibility change:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {children}
      <ConnectionMonitor />
    </>
  )
} 