import React, { useEffect, useState } from 'react'

/**
 * Custom hook to prevent hydration mismatches
 * Returns true only after the component has mounted on the client
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

/**
 * Component wrapper to prevent hydration mismatches
 * Only renders children after hydration is complete
 */
interface HydrationGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function HydrationGuard({ children, fallback }: HydrationGuardProps) {
  const isHydrated = useHydration()
  
  if (!isHydrated) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return <>{children}</>
} 