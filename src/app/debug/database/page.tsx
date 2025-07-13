'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useHydration } from '@/hooks/useHydration'
import MainNavigation from '@/components/navigation/MainNavigation'
import BackNavigation from '@/components/navigation/BackNavigation'
import DatabaseChecker from '@/components/debug/DatabaseChecker'
import MigrationRunner from '@/components/debug/MigrationRunner'

export default function DatabaseDebugPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const isHydrated = useHydration()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Show loading state until hydrated and auth is resolved
  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If not authenticated after hydration, show loading while redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation title="Database Debug" />
      <main className="container mx-auto px-4 py-8">
        <BackNavigation fallbackPath="/dashboard" fallbackText="Dashboard" />
        
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Database Debug Tools
            </h1>
            <p className="text-gray-600">
              Use these tools to check database connectivity and table status.
            </p>
          </div>

          <div className="space-y-6">
            <DatabaseChecker />
            <MigrationRunner />
          </div>
        </div>
      </main>
    </div>
  )
}