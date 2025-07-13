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
  className = "group inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-4 transition-all duration-200 hover:scale-105"
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
      <ChevronLeft className="w-4 h-4 mr-1 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-x-1" />
      Back to {displayText}
    </button>
  )
} 