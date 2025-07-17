'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

interface ConnectionErrorProps {
  error: string
  onRetry?: () => void
}

export function ConnectionError({ error, onRetry }: ConnectionErrorProps) {
  const { retryAuth } = useAuth()

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      retryAuth()
    }
  }

  const getErrorMessage = (error: string) => {
    if (error.includes('network') || error.includes('fetch')) {
      return {
        title: 'Network Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact support if the problem persists'
        ]
      }
    }
    
    if (error.includes('timeout')) {
      return {
        title: 'Connection Timeout',
        message: 'The connection is taking too long to respond.',
        suggestions: [
          'Check your internet connection speed',
          'Try again in a few moments',
          'Contact support if timeouts persist'
        ]
      }
    }
    
    if (error.includes('Authentication failed')) {
      return {
        title: 'Authentication Error',
        message: 'There was a problem verifying your credentials.',
        suggestions: [
          'Try signing in again',
          'Check your credentials',
          'Contact support if the problem persists'
        ]
      }
    }
    
    return {
      title: 'Connection Error',
      message: 'There was a problem connecting to the service.',
      suggestions: [
        'Try refreshing the page',
        'Check your internet connection',
        'Contact support if the problem persists'
      ]
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">{errorInfo.title}</h2>
            <p className="text-muted-foreground mb-4">{errorInfo.message}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Error details:</p>
              <code className="text-xs bg-background px-2 py-1 rounded text-red-600 block">
                {error}
              </code>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Try these steps:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {errorInfo.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleRetry} className="flex-1">
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="flex-1"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}