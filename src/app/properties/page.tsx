'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import PropertyList from '@/components/properties/PropertyList'
import { HydrationGuard } from '@/hooks/useHydration'
import MainNavigation from '@/components/navigation/MainNavigation'

export default function PropertiesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  return (
    <HydrationGuard>
      {loading || !user ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50">
          <MainNavigation title="Properties" />
          <main>
            <PropertyList />
          </main>
        </div>
      )}
    </HydrationGuard>
  )
}