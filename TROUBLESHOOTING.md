# Troubleshooting Guide

Common issues and solutions when working with the Real Estate CRM.

## Development Issues

### Environment Setup Problems

#### Database Connection Issues
**Problem:** "Error connecting to Supabase"
**Solutions:**
1. Check `.env.local` file exists and has correct variables
2. Verify Supabase URL and keys are correct
3. Ensure Supabase project is running
4. Check network connectivity

**Problem:** "Row Level Security error"
**Solutions:**
1. Verify user is authenticated
2. Check RLS policies in Supabase dashboard
3. Ensure user has proper permissions
4. Test with different user roles

#### Authentication Problems
**Problem:** "User not authenticated" errors
**Solutions:**
1. Check if user session is valid
2. Clear browser localStorage and cookies
3. Verify auth context is properly wrapped
4. Check Supabase auth configuration

#### Build and Development Issues
**Problem:** TypeScript compilation errors
**Solutions:**
1. Run `npm install` to ensure dependencies are up to date
2. Check for missing type definitions
3. Verify imports are correct
4. Generate fresh database types if schema changed

**Problem:** ESLint errors
**Solutions:**
1. Run `npm run lint` to see all issues
2. Fix unused imports and variables
3. Check for missing dependencies in useEffect hooks
4. Follow established code patterns

## Database Issues

### Migration Problems
**Problem:** Migration fails to apply
**Solutions:**
1. Check if migration was already applied
2. Verify migration SQL syntax
3. Check for conflicting data
4. Run migrations in correct order

**Problem:** Data not showing up
**Solutions:**
1. Check RLS policies allow data access
2. Verify user has correct permissions
3. Check database queries in browser network tab
4. Test queries directly in Supabase SQL editor

### Performance Issues
**Problem:** Slow database queries
**Solutions:**
1. Add indexes for frequently queried columns
2. Use selective queries (only needed columns)
3. Implement pagination for large datasets
4. Check query execution plan in Supabase

## UI/UX Issues

### Component Rendering Problems
**Problem:** Components not rendering
**Solutions:**
1. Check for JavaScript errors in browser console
2. Verify component imports are correct
3. Check if required props are passed
4. Ensure proper error boundaries are in place

**Problem:** Styling issues
**Solutions:**
1. Check Tailwind CSS classes are correct
2. Verify custom CSS doesn't conflict
3. Check responsive design breakpoints
4. Ensure CSS variables are defined

### State Management Issues
**Problem:** State not updating
**Solutions:**
1. Check if Zustand store is properly connected
2. Verify state updates are immutable
3. Check for async operation completion
4. Debug store state with browser dev tools

## API Issues

### Route Handler Problems
**Problem:** API routes returning 500 errors
**Solutions:**
1. Check server logs for detailed error messages
2. Verify request body format
3. Check authentication in API routes
4. Ensure proper error handling

**Problem:** CORS issues
**Solutions:**
1. Check Next.js API route configuration
2. Verify request headers
3. Check if running on correct port
4. Ensure proper origin configuration

## Common Error Messages

### "Cannot read property of undefined"
**Cause:** Trying to access property on null/undefined object
**Solutions:**
1. Add null checks: `object?.property`
2. Use default values: `object || {}`
3. Check if data has loaded before accessing
4. Add proper loading states

### "Hydration failed"
**Cause:** Server and client rendered content mismatch
**Solutions:**
1. Use `useHydration` hook for client-only content
2. Avoid using browser-only APIs during SSR
3. Check for different data on server vs client
4. Use `suppressHydrationWarning` sparingly

### "Permission denied" in database operations
**Cause:** RLS policies blocking access
**Solutions:**
1. Verify user is authenticated
2. Check if user has required permissions
3. Review RLS policies in Supabase
4. Test with different user roles

## Performance Troubleshooting

### Slow Page Loading
**Diagnostics:**
1. Use browser dev tools Performance tab
2. Check network requests for slow queries
3. Analyze bundle size with Next.js analyzer
4. Monitor Core Web Vitals

**Solutions:**
1. Implement code splitting
2. Optimize images with Next.js Image
3. Add loading states for async operations
4. Cache frequently accessed data

### Memory Leaks
**Diagnostics:**
1. Use browser Memory tab in dev tools
2. Check for growing heap size
3. Monitor component unmounting
4. Check for uncleaned event listeners

**Solutions:**
1. Clean up subscriptions in useEffect cleanup
2. Remove event listeners on unmount
3. Clear timers and intervals
4. Properly dispose of refs

## Testing Issues

### Test Failures
**Problem:** Tests failing unexpectedly
**Solutions:**
1. Mock external dependencies properly
2. Check for async operation completion
3. Verify test data setup
4. Clear test database between tests

### Coverage Issues
**Problem:** Low test coverage
**Solutions:**
1. Add tests for error conditions
2. Test loading states
3. Cover edge cases
4. Test user interactions

## Debug Tools and Commands

### Development Commands
```bash
# Check linting issues
npm run lint

# Build for production
npm run build

# Start development server
npm run dev

# Generate Supabase types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### Database Debug Commands
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'properties';

-- Check user permissions
SELECT * FROM auth.users;

-- Check agent records
SELECT * FROM agents;
```

### Browser Debug Tools
1. **React Developer Tools** - Component state inspection
2. **Network tab** - API request monitoring
3. **Console** - Error messages and logging
4. **Application tab** - LocalStorage and session data

## Getting Help

### Internal Resources
1. Check existing code patterns in similar components
2. Review CLAUDE.md for architectural guidance
3. Use debug pages: `/debug` and `/debug/database`
4. Check migration files for schema examples

### External Resources
1. [Next.js Documentation](https://nextjs.org/docs)
2. [Supabase Documentation](https://supabase.io/docs)
3. [Tailwind CSS Documentation](https://tailwindcss.com/docs)
4. [React Hook Form Documentation](https://react-hook-form.com)

### Emergency Procedures

#### Database Issues
1. Take database backup before making changes
2. Test changes on development environment first
3. Have rollback plan ready
4. Monitor application after changes

#### Production Issues
1. Check error monitoring dashboards
2. Review recent deployments
3. Check database performance metrics
4. Implement hotfixes on separate branch

Remember: When in doubt, check existing patterns in the codebase first. Most issues have been solved before in similar contexts.