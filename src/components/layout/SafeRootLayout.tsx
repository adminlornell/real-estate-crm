'use client'

import ErrorBoundary from '@/components/layout/ErrorBoundary'
import SentryErrorBoundary from '@/components/error/SentryErrorBoundary'
import NoSSR from '@/components/layout/NoSSR'
import { AuthProvider } from '@/contexts/AuthContext'
import ClientLayout from '@/components/layout/ClientLayout'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/hooks/useTheme'

interface SafeRootLayoutProps {
  children: React.ReactNode
}

export default function SafeRootLayout({ children }: SafeRootLayoutProps) {
  return (
    <SentryErrorBoundary>
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
    </SentryErrorBoundary>
  )
}