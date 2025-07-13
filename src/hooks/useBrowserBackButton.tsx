'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function useBrowserBackButton() {
  const router = useRouter()
  const pathname = usePathname()
  const navigationStackRef = useRef<string[]>([])
  const isHandlingBackRef = useRef(false)

  useEffect(() => {
    // Initialize navigation stack
    if (navigationStackRef.current.length === 0) {
      navigationStackRef.current = [pathname]
    } else {
      // Add current path to stack if it's not already there
      const currentIndex = navigationStackRef.current.indexOf(pathname)
      if (currentIndex === -1) {
        navigationStackRef.current.push(pathname)
      } else {
        // If we're navigating to a previous page, trim the stack
        navigationStackRef.current = navigationStackRef.current.slice(0, currentIndex + 1)
      }
    }

    const handlePopState = (event: PopStateEvent) => {
      // Prevent infinite loops
      if (isHandlingBackRef.current) {
        return
      }

      const currentPath = window.location.pathname
      
      // Define logical parent relationships
      const parentRoutes: { [key: string]: string } = {
        '/dashboard/recent-properties': '/dashboard',
        '/dashboard/recent-clients': '/dashboard',
        '/dashboard/recent-activities': '/dashboard',
        '/properties/[id]': '/properties',
        '/clients/[id]': '/clients',
        '/properties': '/dashboard',
        '/clients': '/dashboard',
        '/tasks': '/dashboard',
        '/reports': '/dashboard',
      }

      // Check for dynamic routes (with [id])
      let parentRoute = parentRoutes[currentPath]
      if (!parentRoute) {
        // Check for dynamic routes
        for (const [pattern, parent] of Object.entries(parentRoutes)) {
          if (pattern.includes('[id]')) {
            const regex = new RegExp(pattern.replace('[id]', '[^/]+'))
            if (regex.test(currentPath)) {
              parentRoute = parent
              break
            }
          }
        }
      }

      // If we have a logical parent and we're not already there
      if (parentRoute && currentPath !== parentRoute) {
        isHandlingBackRef.current = true
        
        // Update our navigation stack
        const parentIndex = navigationStackRef.current.indexOf(parentRoute)
        if (parentIndex !== -1) {
          navigationStackRef.current = navigationStackRef.current.slice(0, parentIndex + 1)
        } else {
          navigationStackRef.current.push(parentRoute)
        }

        // Navigate to the logical parent
        router.push(parentRoute)
        
        // Reset the flag after navigation
        setTimeout(() => {
          isHandlingBackRef.current = false
        }, 100)
      }
    }

    // Add event listener for browser back button
    window.addEventListener('popstate', handlePopState)

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [pathname, router])

  return null
} 