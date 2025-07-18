"use client"

import React from "react"
import * as Sentry from "@sentry/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, AlertCircle, Bug, Home } from "lucide-react"
import { useRouter } from "next/navigation"

interface SentryErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<SentryErrorBoundaryState>
  showDialog?: boolean
}

interface SentryErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorId: string | null
  eventId: string | null
}

class SentryErrorBoundary extends React.Component<
  SentryErrorBoundaryProps,
  SentryErrorBoundaryState
> {
  constructor(props: SentryErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      eventId: null,
    }
  }

  static getDerivedStateFromError(error: Error): SentryErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9),
      eventId: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to Sentry
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        component: "ErrorBoundary",
      },
    })

    this.setState({ eventId })

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by ErrorBoundary:", error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      eventId: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return <this.props.fallback {...this.state} />
      }

      return <DefaultErrorFallback {...this.state} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps extends SentryErrorBoundaryState {
  onRetry: () => void
}

function DefaultErrorFallback({
  error,
  errorId,
  eventId,
  onRetry,
}: DefaultErrorFallbackProps) {
  const router = useRouter()

  const handleReportFeedback = () => {
    if (eventId) {
      Sentry.showReportDialog({ eventId })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-gray-600">
            We encountered an unexpected error. Our team has been notified.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Bug className="h-4 w-4" />
            <AlertDescription>
              <strong>Error ID:</strong> {errorId}
              {eventId && (
                <div className="mt-1">
                  <strong>Event ID:</strong> {eventId}
                </div>
              )}
            </AlertDescription>
          </Alert>

          {process.env.NODE_ENV === "development" && error && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error Details:</strong>
                <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
                  {error.message}
                </pre>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
            
            {eventId && (
              <Button
                variant="outline"
                onClick={handleReportFeedback}
                className="w-full"
              >
                <Bug className="mr-2 h-4 w-4" />
                Report Feedback
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SentryErrorBoundary
export { SentryErrorBoundary }