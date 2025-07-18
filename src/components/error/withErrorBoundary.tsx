"use client"

import React from 'react'
import { SentryErrorBoundary } from './SentryErrorBoundary'

interface WithErrorBoundaryProps {
  children: React.ReactNode
}

// Higher-order component to wrap page components with error boundary
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  displayName?: string
) {
  const WrappedComponent = (props: T) => {
    return (
      <SentryErrorBoundary>
        <Component {...props} />
      </SentryErrorBoundary>
    )
  }
  
  WrappedComponent.displayName = displayName || `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`
  
  return WrappedComponent
}

// Simple wrapper component for cases where HOC isn't suitable
export function PageErrorBoundary({ children }: WithErrorBoundaryProps) {
  return (
    <SentryErrorBoundary>
      {children}
    </SentryErrorBoundary>
  )
}