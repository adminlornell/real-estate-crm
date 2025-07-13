'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AgentDashboard from '@/components/dashboard/AgentDashboard'
import { useHydration } from '@/hooks/useHydration'
import MainNavigation from '@/components/navigation/MainNavigation'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const isHydrated = useHydration()

  useEffect(() => {
    console.log('Dashboard: Auth state changed', { user: !!user, loading, isHydrated })
    if (!loading && !user) {
      console.log('Dashboard: Redirecting to login')
      router.push('/login')
    }
  }, [user, loading, router, isHydrated])

  // Show loading state until hydrated and auth is resolved
  if (!isHydrated || loading) {
    console.log('Dashboard: Showing loading state', { isHydrated, loading })
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">
            Hydrated: {isHydrated ? 'Yes' : 'No'}, Auth: {loading ? 'Loading' : 'Ready'}
          </p>
        </div>
      </div>
    )
  }

  // If not authenticated after hydration, show loading while redirecting
  if (!user) {
    console.log('Dashboard: No user, redirecting to login')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  console.log('Dashboard: Rendering dashboard for user:', user.email)

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation title="Dashboard" />
      <main>
        <AgentDashboard />
      </main>
    </div>
  )
}