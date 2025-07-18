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
  
  // Enhanced error filtering and context
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
        
        // Skip hydration errors (Next.js specific)
        if (message.includes("Hydration") || message.includes("hydration")) {
          return null;
        }
      }
    }
    
    // Add custom context for server errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string') {
        // Add context for database errors
        if (error.message.includes("supabase")) {
          event.contexts = {
            ...event.contexts,
            database: {
              type: "supabase",
              operation: "query",
            },
          };
        }
        
        // Add context for authentication errors
        if (error.message.includes("auth")) {
          event.contexts = {
            ...event.contexts,
            auth: {
              type: "authentication",
              service: "supabase",
            },
          };
        }
      }
    }
    
    return event;
  },
});