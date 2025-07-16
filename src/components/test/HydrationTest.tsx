'use client'

import { useEffect, useState } from 'react'

export default function HydrationTest() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1>Hydration Test</h1>
        <p>If you see this, hydration is working correctly.</p>
      </div>
    </div>
  )
}