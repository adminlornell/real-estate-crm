# Claude Instructions

Additional instructions for Claude Code when working with this Real Estate CRM codebase.

## Code Generation Guidelines

### Component Creation Patterns
When creating new components, always:
1. Use the existing design system components from `src/components/ui/`
2. Follow the atomic design pattern (atoms → molecules → organisms)
3. Include proper TypeScript interfaces for props
4. Implement loading and error states
5. Add proper accessibility attributes

### Database Operations
When working with database operations:
1. Always use the existing Supabase client from `src/lib/supabase.ts`
2. Respect RLS policies - never bypass security
3. Use the Zustand stores for state management
4. Implement optimistic updates with error rollback
5. Generate proper TypeScript types from database schema

### Form Implementation
For any form-related work:
1. Use React Hook Form with Zod validation
2. Follow existing form patterns in the codebase
3. Implement proper error handling and display
4. Use the existing Input and Button components
5. Include loading states during submission

## Task-Specific Instructions

### Adding New Features
1. Check existing components first - avoid duplication
2. Update the relevant Zustand store if needed
3. Add proper error boundaries
4. Include proper loading states
5. Update CLAUDE.md if new patterns are introduced

### Bug Fixes
1. Identify the root cause before implementing fixes
2. Check if the issue affects other parts of the codebase
3. Test with different user roles and permissions
4. Verify RLS policies are working correctly
5. Run `npm run lint` after changes

### Database Schema Changes
1. Create migration files for any schema changes
2. Update TypeScript types after schema changes
3. Test with existing data
4. Update RLS policies if needed
5. Document changes in migration comments

## Testing Requirements

### Component Testing
- Test user interactions and state changes
- Mock Supabase operations
- Test loading and error states
- Verify accessibility requirements

### Integration Testing
- Test authentication flows
- Verify database operations with proper permissions
- Test form submissions and validation
- Ensure proper error handling

## Security Requirements

### Authentication
- Always verify user authentication before operations
- Use the `useAuth()` hook for authentication state
- Implement proper session management
- Handle authentication errors gracefully

### Data Access
- Respect RLS policies at all times
- Validate user permissions before operations
- Sanitize user inputs
- Never expose sensitive data in logs

## Performance Guidelines

### Frontend Optimization
- Use React.memo() for expensive re-renders
- Implement proper loading states
- Use Next.js Image component for images
- Lazy load non-critical components

### Database Optimization
- Use selective queries (specific columns)
- Implement pagination for large datasets
- Use proper indexes for queries
- Cache frequently accessed data

## Error Handling Standards

### Client-Side Errors
```typescript
try {
  const result = await operation();
  // Handle success
} catch (error) {
  console.error('Operation failed:', error);
  setError(error instanceof Error ? error.message : 'Operation failed');
}
```

### API Route Errors
```typescript
try {
  // API operation
  return NextResponse.json({ data });
} catch (error) {
  console.error('API Error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Communication Guidelines

### Code Comments
- Only add comments when code intent is not clear
- Focus on "why" rather than "what"
- Update comments when code changes
- Remove obsolete comments

### Commit Messages
- Use conventional commit format
- Include scope when relevant: `feat(client): add new feature`
- Keep messages concise but descriptive
- Reference issues when applicable

## Common Pitfalls to Avoid

1. **Don't bypass RLS policies** - Always work within security constraints
2. **Don't duplicate components** - Check existing UI library first
3. **Don't ignore error states** - Always handle loading and error conditions
4. **Don't hardcode values** - Use environment variables for configuration
5. **Don't skip type checking** - Maintain strict TypeScript compliance

## File Organization

### New Files
- Place components in appropriate subdirectories under `src/components/`
- Use descriptive, PascalCase names for components
- Group related components in feature folders
- Export components from index files when appropriate

### Imports
- Use absolute imports with `@/` prefix
- Group imports: external libraries, internal modules, relative imports
- Sort imports alphabetically within groups
- Remove unused imports

## Quality Checklist

Before considering any task complete:
- [ ] Code follows existing patterns and conventions
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Loading states are included
- [ ] RLS policies are respected
- [ ] Components are accessible
- [ ] `npm run lint` passes without errors
- [ ] No console.log statements in production code
- [ ] Proper imports are used
- [ ] Documentation is updated if needed