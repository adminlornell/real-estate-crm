'use client'

import { useEffect, useRef } from 'react'
import { showToast } from '@/lib/toast'

interface UseAutoSaveOptions {
  key: string
  data: any
  enabled?: boolean
  delay?: number
  onSave?: (data: any) => void
  onRestore?: (data: any) => void
}

export function useAutoSave({
  key,
  data,
  enabled = true,
  delay = 2000,
  onSave,
  onRestore,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const isFirstRender = useRef(true)
  const lastSavedData = useRef<string>('')

  // Auto-save when data changes
  useEffect(() => {
    if (!enabled || !data) return

    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      const serializedData = JSON.stringify(data)
      
      // Only save if data has changed
      if (serializedData !== lastSavedData.current) {
        try {
          localStorage.setItem(`autosave_${key}`, serializedData)
          lastSavedData.current = serializedData
          onSave?.(data)
          
          // Show subtle save indication
          showToast.success('Draft saved')
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, enabled, delay, key, onSave])

  // Restore saved data on mount
  useEffect(() => {
    if (!enabled) return

    try {
      const savedData = localStorage.getItem(`autosave_${key}`)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        onRestore?.(parsedData)
      }
    } catch (error) {
      console.error('Failed to restore auto-saved data:', error)
    }
  }, [key, enabled, onRestore])

  // Clear saved data
  const clearSavedData = () => {
    try {
      localStorage.removeItem(`autosave_${key}`)
      lastSavedData.current = ''
      showToast.success('Draft cleared')
    } catch (error) {
      console.error('Failed to clear saved data:', error)
    }
  }

  // Check if there's saved data
  const hasSavedData = () => {
    try {
      return !!localStorage.getItem(`autosave_${key}`)
    } catch {
      return false
    }
  }

  return {
    clearSavedData,
    hasSavedData,
  }
}