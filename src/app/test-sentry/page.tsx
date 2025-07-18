"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bug, AlertTriangle, Database, User, FileText, CheckCircle, XCircle } from "lucide-react"
import { 
  reportError, 
  reportCRMError, 
  reportDatabaseError, 
  reportAuthError, 
  reportAPIError,
  addBreadcrumb,
  setSentryUser,
  clearSentryUser
} from "@/lib/sentry"

export default function TestSentryPage() {
  const [testResults, setTestResults] = useState<Array<{
    test: string
    status: 'success' | 'error'
    eventId?: string
    message: string
  }>>([])

  const addTestResult = (test: string, status: 'success' | 'error', eventId?: string, message?: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      eventId,
      message: message || (status === 'success' ? 'Test completed successfully' : 'Test failed')
    }])
  }

  const testGenericError = async () => {
    try {
      const eventId = reportError(new Error("Test generic error from Sentry test page"), {
        component: "TestSentryPage",
        action: "test_generic_error",
        testType: "generic"
      })
      addTestResult("Generic Error", "success", eventId, "Generic error reported successfully")
    } catch (error) {
      addTestResult("Generic Error", "error", undefined, `Failed to report error: ${error}`)
    }
  }

  const testCRMError = async () => {
    try {
      const eventId = reportCRMError(new Error("Test CRM operation error"), {
        entity: "property",
        entityId: "test-property-123",
        operation: "create",
        userId: "test-user-456",
        component: "TestSentryPage"
      })
      addTestResult("CRM Error", "success", eventId, "CRM error reported successfully")
    } catch (error) {
      addTestResult("CRM Error", "error", undefined, `Failed to report CRM error: ${error}`)
    }
  }

  const testDatabaseError = async () => {
    try {
      const eventId = reportDatabaseError(new Error("Test database connection error"), {
        table: "properties",
        operation: "insert",
        userId: "test-user-456",
        query: "INSERT INTO properties (name, price) VALUES ('Test Property', 500000)"
      })
      addTestResult("Database Error", "success", eventId, "Database error reported successfully")
    } catch (error) {
      addTestResult("Database Error", "error", undefined, `Failed to report database error: ${error}`)
    }
  }

  const testAuthError = async () => {
    try {
      const eventId = reportAuthError(new Error("Test authentication error"), {
        operation: "login",
        provider: "supabase",
        userId: "test-user-456"
      })
      addTestResult("Auth Error", "success", eventId, "Authentication error reported successfully")
    } catch (error) {
      addTestResult("Auth Error", "error", undefined, `Failed to report auth error: ${error}`)
    }
  }

  const testAPIError = async () => {
    try {
      const eventId = reportAPIError(new Error("Test API endpoint error"), {
        endpoint: "/api/test-endpoint",
        method: "POST",
        status: 500,
        userId: "test-user-456",
        requestId: "req-123-456"
      })
      addTestResult("API Error", "success", eventId, "API error reported successfully")
    } catch (error) {
      addTestResult("API Error", "error", undefined, `Failed to report API error: ${error}`)
    }
  }

  const testBreadcrumbs = async () => {
    try {
      addBreadcrumb("User navigated to test page", "navigation", "info", { page: "test-sentry" })
      addBreadcrumb("Test breadcrumb added", "test", "info", { testType: "breadcrumb" })
      addBreadcrumb("Warning: Test warning breadcrumb", "test", "warning", { level: "warning" })
      
      // Now trigger an error to see breadcrumbs
      const eventId = reportError(new Error("Test error with breadcrumbs"), {
        component: "TestSentryPage",
        action: "test_breadcrumbs"
      })
      addTestResult("Breadcrumbs", "success", eventId, "Breadcrumbs added and error reported")
    } catch (error) {
      addTestResult("Breadcrumbs", "error", undefined, `Failed to add breadcrumbs: ${error}`)
    }
  }

  const testUserContext = async () => {
    try {
      // Set user context
      setSentryUser({
        id: "test-user-123",
        email: "test@example.com",
        username: "testuser",
        role: "agent"
      })
      
      // Report an error with user context
      const eventId = reportError(new Error("Test error with user context"), {
        component: "TestSentryPage",
        action: "test_user_context"
      })
      
      addTestResult("User Context", "success", eventId, "User context set and error reported")
    } catch (error) {
      addTestResult("User Context", "error", undefined, `Failed to set user context: ${error}`)
    }
  }

  const testComponentError = () => {
    // This will trigger the error boundary
    throw new Error("Test component error that should be caught by ErrorBoundary")
  }

  const clearTests = () => {
    setTestResults([])
  }

  const clearUserContext = () => {
    try {
      clearSentryUser()
      addTestResult("Clear User", "success", undefined, "User context cleared")
    } catch (error) {
      addTestResult("Clear User", "error", undefined, `Failed to clear user context: ${error}`)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sentry Integration Test</h1>
        <p className="text-gray-600">
          Test various Sentry error reporting functions and verify they are working correctly.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Environment Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Environment Check
            </CardTitle>
            <CardDescription>
              Verify Sentry environment variables and configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Sentry DSN:</span>
                <Badge variant={process.env.NEXT_PUBLIC_SENTRY_DSN ? "default" : "destructive"}>
                  {process.env.NEXT_PUBLIC_SENTRY_DSN ? "✓ Configured" : "✗ Missing"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Environment:</span>
                <Badge variant="outline">{process.env.NODE_ENV || "unknown"}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Debug Mode:</span>
                <Badge variant={process.env.NODE_ENV === "development" ? "default" : "outline"}>
                  {process.env.NODE_ENV === "development" ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error Reporting Tests
            </CardTitle>
            <CardDescription>
              Click these buttons to test different types of error reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button onClick={testGenericError} variant="outline" className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Generic Error
              </Button>
              
              <Button onClick={testCRMError} variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                CRM Error
              </Button>
              
              <Button onClick={testDatabaseError} variant="outline" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database Error
              </Button>
              
              <Button onClick={testAuthError} variant="outline" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Auth Error
              </Button>
              
              <Button onClick={testAPIError} variant="outline" className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                API Error
              </Button>
              
              <Button onClick={testBreadcrumbs} variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Breadcrumbs
              </Button>
              
              <Button onClick={testUserContext} variant="outline" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                User Context
              </Button>
              
              <Button onClick={testComponentError} variant="destructive" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Component Error
              </Button>
              
              <Button onClick={clearUserContext} variant="outline" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Clear User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Test Results
            </CardTitle>
            <CardDescription>
              Results of Sentry error reporting tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No tests have been run yet. Click the buttons above to test error reporting.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {testResults.length} test{testResults.length !== 1 ? 's' : ''} completed
                    </span>
                    <Button onClick={clearTests} variant="outline" size="sm">
                      Clear Results
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                        <div className="flex-shrink-0 mt-1">
                          {result.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{result.test}</span>
                            <Badge variant={result.status === 'success' ? "default" : "destructive"}>
                              {result.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{result.message}</p>
                          {result.eventId && (
                            <p className="text-xs text-gray-500 font-mono">
                              Event ID: {result.eventId}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">How to verify Sentry is working:</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Click the test buttons above to generate different types of errors</li>
                  <li>Check the console for debug output (in development mode)</li>
                  <li>Check your Sentry dashboard for the reported errors</li>
                  <li>Look for the Event IDs in the test results to find specific errors</li>
                  <li>The "Component Error" button will trigger the ErrorBoundary</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Expected behavior:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>All tests should show "success" status</li>
                  <li>Event IDs should be generated for each error</li>
                  <li>Errors should appear in your Sentry dashboard</li>
                  <li>Component errors should show the ErrorBoundary fallback</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}