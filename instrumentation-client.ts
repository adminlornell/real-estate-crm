import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring - environment specific
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Debug mode in development
  debug: process.env.NODE_ENV === "development",
  
  // Enhanced error reporting with client-specific integrations
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Capture replays for errors
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Session replay configuration
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0.1,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Set environment
  environment: process.env.NODE_ENV,
  
  // Configure release
  release: process.env.VERCEL_GIT_COMMIT_SHA || `development-${Date.now()}`,
  
  // Enhanced filtering for client-side errors
  beforeSend(event, hint) {
    // Skip errors in development console
    if (process.env.NODE_ENV === "development" && event.logger === "console") {
      return null;
    }
    
    // Filter out known non-critical client errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string') {
        const message = error.message;
        
        // Skip non-error promise rejections
        if (message.includes("Non-Error promise rejection")) {
          return null;
        }
        
        // Skip React DevTools errors
        if (message.includes("React DevTools") || message.includes("__REACT_DEVTOOLS__")) {
          return null;
        }
        
        // Skip ad blocker errors
        if (message.includes("AdBlock") || message.includes("uBlock")) {
          return null;
        }
        
        // Skip extension errors
        if (message.includes("extension") || message.includes("chrome-extension")) {
          return null;
        }
        
        // Skip hydration errors (handled by error boundaries)
        if (message.includes("Hydration") || message.includes("hydration")) {
          return null;
        }
        
        // Skip non-critical network errors but keep Supabase errors
        if (message.includes("NetworkError") && !message.includes("supabase")) {
          return null;
        }
      }
    }
    
    // Add client-specific context
    if (event.exception) {
      event.contexts = {
        ...event.contexts,
        client: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
      };
    }
    
    return event;
  },
});

// Export router transition hook for navigation tracking
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;