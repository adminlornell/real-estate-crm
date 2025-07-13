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
      <MainNavigation title="Dashboard" />
      <main>
        <AgentDashboard />
      </main>
    </div>
  )
}