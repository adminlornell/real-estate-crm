'use client'

import ErrorBoundary from '@/components/layout/ErrorBoundary'
import NoSSR from '@/components/layout/NoSSR'
import { AuthProvider } from '@/contexts/AuthContext'
import ClientLayout from '@/components/layout/ClientLayout'

interface SafeRootLayoutProps {
  children: React.ReactNode
}

export default function SafeRootLayout({ children }: SafeRootLayoutProps) {
  return (
    <ErrorBoundary>
      <NoSSR>
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </NoSSR>
    </ErrorBoundary>
  )
}