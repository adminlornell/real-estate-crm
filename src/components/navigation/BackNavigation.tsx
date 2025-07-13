'use client'

import { ChevronLeft } from 'lucide-react'
import { useNavigation } from '@/hooks/useNavigation'

interface BackNavigationProps {
  fallbackPath?: string
  fallbackText?: string
  className?: string
}

export default function BackNavigation({ 
  fallbackPath = '/dashboard', 
  fallbackText = 'Dashboard',
  className = "inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
}: BackNavigationProps) {
  const { goBack, getBackButtonText, canGoBack } = useNavigation()

  const handleBackClick = () => {
    if (canGoBack()) {
      goBack()
    } else {
      // Fallback navigation
      window.location.href = fallbackPath
    }
  }

  const displayText = canGoBack() ? getBackButtonText() : fallbackText

  return (
    <button
      onClick={handleBackClick}
      className={className}
    >
      <ChevronLeft className="w-4 h-4 mr-1" />
      Back to {displayText}
    </button>
  )
} 