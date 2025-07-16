'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import ClientLayout from '@/components/layout/ClientLayout'
import ErrorBoundary from '@/components/layout/ErrorBoundary'

interface ClientOnlyAppProps {
  children: React.ReactNode
}

export default function ClientOnlyApp({ children }: ClientOnlyAppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ClientLayout>
          {children}
        </ClientLayout>
      </AuthProvider>
    </ErrorBoundary>
  )
}