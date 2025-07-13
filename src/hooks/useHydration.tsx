'use client'

import { useState, useEffect, ReactNode } from 'react'

export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    
    // Fallback timeout in case hydration detection fails
    const timeout = setTimeout(() => {
      setIsHydrated(true)
    }, 1000)
    
    return () => clearTimeout(timeout)
  }, [])

  return isHydrated
}

interface HydrationGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function HydrationGuard({ children, fallback }: HydrationGuardProps) {
  const isHydrated = useHydration()

  // Always render children to avoid hydration mismatches
  // The isHydrated check can be used by children components if needed
  return <>{children}</>
} 