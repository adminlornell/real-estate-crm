'use client'

import { useEffect, useState } from 'react'
import { useBrowserBackButton } from '@/hooks/useBrowserBackButton'
import { useAuth } from '@/contexts/AuthContext'
import ConnectionMonitor from './ConnectionMonitor'
import { ConnectionError } from '@/components/auth/ConnectionError'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  // Handle browser back button globally
  useBrowserBackButton()
  
  const { loading, connectionError } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Simple initialization without complex session recovery
    const timer = setTimeout(() => {
      setIsInitialized(true)
    }, 1000) // Give auth context time to initialize
    
    return () => clearTimeout(timer)
  }, [])

  // Show connection error if there's an issue
  if (connectionError) {
    return <ConnectionError error={connectionError} />
  }

  // Show loading screen while auth is initializing
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <ConnectionMonitor />
      {children}
    </>
  )
} 