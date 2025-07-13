'use client'

import { useBrowserBackButton } from '@/hooks/useBrowserBackButton'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  // Handle browser back button globally
  useBrowserBackButton()

  return <>{children}</>
} 