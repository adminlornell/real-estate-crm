import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring - environment specific
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Debug mode in development
  debug: process.env.NODE_ENV === "development",
  
  // Set environment
  environment: process.env.NODE_ENV,
  
  // Configure release
  release: process.env.VERCEL_GIT_COMMIT_SHA || `development-${Date.now()}`,
  
  // Edge runtime specific configuration with enhanced filtering
  beforeSend(event, hint) {
    // Skip errors in development console
    if (process.env.NODE_ENV === "development" && event.logger === "console") {
      return null;
    }
    
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;
        
        // Skip network errors that are temporary
        if (message.includes("NetworkError") || message.includes("fetch")) {
          return null;
        }
        
        // Skip edge runtime specific errors that are not critical
        if (message.includes("AbortError") || message.includes("timeout")) {
          return null;
        }
      }
    }
    
    // Add edge-specific context
    if (event.exception) {
      event.contexts = {
        ...event.contexts,
        runtime: {
          type: "edge",
          environment: "vercel",
        },
      };
    }
    
    return event;
  },
});