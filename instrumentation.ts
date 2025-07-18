export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
  
  // Client-side initialization
  if (typeof window !== 'undefined') {
    await import('./instrumentation-client')
  }
}

export const onRequestError = (err: unknown, request: Request) => {
  const { reportAPIError } = require('./src/lib/sentry')
  
  if (err instanceof Error) {
    reportAPIError(err, {
      endpoint: request.url,
      method: request.method,
      requestId: request.headers.get('x-request-id') || undefined,
    })
  }
}