'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface NavigationState {
  previousPath: string | null
  currentPath: string
  navigationStack: string[]
}

export function useNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [navigationState, setNavigationState] = useState<NavigationState>({
    previousPath: null,
    currentPath: pathname,
    navigationStack: [pathname]
  })

  useEffect(() => {
    setNavigationState(prev => {
      // Don't update if the path hasn't changed
      if (prev.currentPath === pathname) {
        return prev
      }

      const newStack = [...prev.navigationStack]
      
      // If we're going back to a previous page in the stack, remove the pages after it
      const existingIndex = newStack.indexOf(pathname)
      if (existingIndex !== -1) {
        newStack.splice(existingIndex + 1)
      } else {
        // Add new page to stack
        newStack.push(pathname)
      }

      return {
        previousPath: prev.currentPath,
        currentPath: pathname,
        navigationStack: newStack
      }
    })
  }, [pathname])

  const goBack = () => {
    const { navigationStack, currentPath } = navigationState
    const currentIndex = navigationStack.indexOf(currentPath)
    
    if (currentIndex > 0) {
      // Go to previous page in our stack
      const previousPath = navigationStack[currentIndex - 1]
      router.push(previousPath)
    } else {
      // Fallback to dashboard if no previous page
      router.push('/dashboard')
    }
  }

  const goBackToDashboard = () => {
    router.push('/dashboard')
  }

  const getBackButtonText = () => {
    const { navigationStack, currentPath } = navigationState
    const currentIndex = navigationStack.indexOf(currentPath)
    
    if (currentIndex > 0) {
      const previousPath = navigationStack[currentIndex - 1]
      
      // Map paths to readable names
      const pathNames: { [key: string]: string } = {
        '/dashboard': 'Dashboard',
        '/properties': 'Properties',
        '/clients': 'Clients',
        '/tasks': 'Tasks',
        '/reports': 'Reports',
        '/dashboard/recent-properties': 'Recent Properties',
        '/dashboard/recent-clients': 'Recent Clients',
        '/dashboard/recent-activities': 'Recent Activities'
      }
      
      return pathNames[previousPath] || 'Back'
    }
    
    return 'Dashboard'
  }

  const canGoBack = () => {
    const { navigationStack, currentPath } = navigationState
    const currentIndex = navigationStack.indexOf(currentPath)
    return currentIndex > 0
  }

  return {
    goBack,
    goBackToDashboard,
    getBackButtonText,
    canGoBack,
    navigationState
  }
} 