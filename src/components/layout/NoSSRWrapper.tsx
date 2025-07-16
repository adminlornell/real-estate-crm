'use client'

import { useEffect, useState } from 'react'

interface NoSSRWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function NoSSRWrapper({ children, fallback }: NoSSRWrapperProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}