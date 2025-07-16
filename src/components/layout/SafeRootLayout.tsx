'use client'

import ErrorBoundary from '@/components/layout/ErrorBoundary'
import NoSSR from '@/components/layout/NoSSR'
import { AuthProvider } from '@/contexts/AuthContext'
import ClientLayout from '@/components/layout/ClientLayout'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/hooks/useTheme'

interface SafeRootLayoutProps {
  children: React.ReactNode
}

export default function SafeRootLayout({ children }: SafeRootLayoutProps) {
  return (
    <ErrorBoundary>
      <NoSSR>
        <ThemeProvider>
          <AuthProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </NoSSR>
    </ErrorBoundary>
  )
}