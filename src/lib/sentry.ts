import * as Sentry from "@sentry/nextjs"

// User context helpers
export const setSentryUser = (user: {
  id: string
  email?: string
  username?: string
  role?: string
}) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  })
}

export const clearSentryUser = () => {
  Sentry.setUser(null)
}

// Custom error reporting
export const reportError = (
  error: Error,
  context?: {
    component?: string
    action?: string
    userId?: string
    propertyId?: string
    clientId?: string
    documentId?: string
    [key: string]: any
  }
) => {
  return Sentry.captureException(error, {
    tags: {
      component: context?.component || "unknown",
      action: context?.action || "unknown",
    },
    extra: {
      ...context,
      timestamp: new Date().toISOString(),
    },
    level: "error",
  })
}

// Performance monitoring
export const startTransaction = (
  name: string,
  op: string,
  data?: Record<string, any>
) => {
  return Sentry.startSpan({
    name,
    op,
    data,
  }, () => {
    // Return a simple span object for compatibility
    return {
      setStatus: (status: string) => {},
      finish: () => {}
    }
  })
}

// Custom breadcrumbs
export const addBreadcrumb = (
  message: string,
  category: string,
  level: "info" | "warning" | "error" | "debug" = "info",
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  })
}

// CRM-specific error reporting
export const reportCRMError = (
  error: Error,
  context: {
    entity: "property" | "client" | "document" | "task" | "agent"
    entityId?: string
    operation: "create" | "read" | "update" | "delete" | "search" | "export"
    userId?: string
    component?: string
  }
) => {
  addBreadcrumb(
    `CRM ${context.operation} operation failed`,
    "crm",
    "error",
    {
      entity: context.entity,
      entityId: context.entityId,
      operation: context.operation,
    }
  )

  return reportError(error, {
    component: context.component || `${context.entity}-${context.operation}`,
    action: context.operation,
    userId: context.userId,
    [`${context.entity}Id`]: context.entityId,
    entity: context.entity,
    operation: context.operation,
  })
}

// Database error reporting
export const reportDatabaseError = (
  error: Error,
  context: {
    table: string
    operation: "select" | "insert" | "update" | "delete" | "upsert"
    userId?: string
    query?: string
  }
) => {
  addBreadcrumb(
    `Database ${context.operation} failed on ${context.table}`,
    "database",
    "error",
    {
      table: context.table,
      operation: context.operation,
    }
  )

  return reportError(error, {
    component: "database",
    action: context.operation,
    userId: context.userId,
    table: context.table,
    operation: context.operation,
    query: context.query,
  })
}

// Authentication error reporting
export const reportAuthError = (
  error: Error,
  context: {
    operation: "login" | "logout" | "signup" | "refresh" | "reset"
    provider?: string
    userId?: string
  }
) => {
  addBreadcrumb(
    `Authentication ${context.operation} failed`,
    "auth",
    "error",
    {
      operation: context.operation,
      provider: context.provider,
    }
  )

  return reportError(error, {
    component: "auth",
    action: context.operation,
    userId: context.userId,
    operation: context.operation,
    provider: context.provider,
  })
}

// API error reporting
export const reportAPIError = (
  error: Error,
  context: {
    endpoint: string
    method: string
    status?: number
    userId?: string
    requestId?: string
  }
) => {
  addBreadcrumb(
    `API ${context.method} ${context.endpoint} failed`,
    "api",
    "error",
    {
      endpoint: context.endpoint,
      method: context.method,
      status: context.status,
    }
  )

  return reportError(error, {
    component: "api",
    action: context.method,
    userId: context.userId,
    endpoint: context.endpoint,
    method: context.method,
    status: context.status,
    requestId: context.requestId,
  })
}

// Performance monitoring helpers
export const measurePerformance = <T>(
  name: string,
  operation: string,
  fn: () => Promise<T>,
  data?: Record<string, any>
): Promise<T> => {
  return Sentry.startSpan({
    name,
    op: operation,
    data,
  }, async () => {
    try {
      const result = await fn()
      return result
    } catch (error) {
      throw error
    }
  })
}

// Export Sentry for direct access if needed
export { Sentry }