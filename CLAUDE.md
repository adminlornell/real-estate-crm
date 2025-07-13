# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

ESLint configuration includes Next.js TypeScript rules with warnings for:
- Unused variables, explicit any, unescaped entities
- React hooks dependencies and img elements
- Prefer const declarations

## Environment Setup

Before development, ensure you have:
1. `.env.local` file with Supabase credentials (copy from `.env.example`)
2. Supabase project configured with the database schema from `database.sql`
3. Node.js 18+ installed

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Project Configuration

- **TypeScript**: Strict mode enabled with Next.js plugin
- **Tailwind CSS**: Custom design system with CSS variables for theming
- **Next.js 15**: App router with optimized package imports for Supabase, Lucide, React Hook Form

## Architecture Overview

This is a Next.js 15 real estate CRM with the following key architectural patterns:

### Authentication & Authorization
- Uses Supabase Auth with Row Level Security (RLS)
- Agent profiles are automatically created in `agents` table on first login
- Auth context (`src/contexts/AuthContext.tsx`) manages user state
- Auth service (`src/lib/auth.ts`) handles authentication operations with caching

### Database Schema
Core tables with relationships:
- `agents` - Agent profiles linked to auth users via `user_id`
- `properties` - Property listings assigned to agents
- `clients` - Client records assigned to agents
- `inquiries` - Lead capture and tracking
- `showings` - Property showing scheduling
- `tasks` - Task management with comments support via `task_comments` table
- `communications` - Client interaction tracking
- `activity_logs` - Audit trail for all activities
- `task_templates` - Workflow templates for task automation
- `documents` - Document records with template references and field values
- `document_templates` - Reusable document templates with configurable fields

All tables use RLS policies to ensure agents only access their assigned data.

**Important Database Features:**
- Automatic activity logging via database triggers
- UUID primary keys with auto-generation
- JSONB fields for flexible metadata storage
- Custom ENUM types for status values
- Comprehensive indexes for performance

### State Management
- **Zustand** for global state management
- **Primary stores:**
  - `usePropertyStore` (`src/stores/usePropertyStore.ts`) - Property data with filtering
  - `useClientStore` (`src/stores/useClientStore.ts`) - Client management
  - `useDocumentStore` (`src/stores/useDocumentStore.ts`) - Document and template management
- Stores include built-in filtering, CRUD operations, and error handling
- Optimistic updates with proper error rollback
- Debug logging for property operations

### UI Components & Design System
Component structure follows atomic design:
- `src/components/ui/` - Basic UI components (Button, Card, Input)
- `src/components/auth/` - Authentication components
- `src/components/properties/` - Property-specific components
- `src/components/dashboard/` - Dashboard components
- `src/components/clients/` - Client management components
- `src/components/tasks/` - Task management components
- `src/components/reports/` - Analytics and reporting
- `src/components/documents/` - Document management components
- `src/components/layout/` - Layout components
- `src/components/navigation/` - Navigation components

**Design System:**
- CSS variables for theming with HSL color values
- 5 button variants, 3 sizes with loading states
- Composition-based Card components (Header, Content, Footer)
- `cn()` utility for class merging with `clsx` and `tailwind-merge`
- Consistent spacing, typography hierarchy, and accessibility features

### Form Handling
- **React Hook Form** with **Zod** validation
- Forms follow consistent patterns for validation and error handling

### Database Operations
- All database calls go through Supabase client (`src/lib/supabase.ts`)
- Type-safe operations using generated types (`src/types/database.ts`)
- Stores handle caching and optimistic updates
- Activity logging service (`src/lib/activityLogger.ts`) for manual activity tracking
- Automatic activity logging via database triggers for CRUD operations

## Key Development Patterns

### Data Fetching
- Use Zustand stores for complex state management
- Direct Supabase queries for simple operations
- Always handle loading and error states

### Authentication
- Check user authentication status before protected operations
- Use `useAuth()` hook for auth state in components
- Agent records are automatically created for new users
- Caching layer in auth service to avoid repeated DB calls

### Navigation & Routing
- Custom navigation hook (`src/hooks/useNavigation.tsx`) for back button functionality
- Navigation stack tracking for better UX
- Hydration guard (`src/hooks/useHydration.tsx`) to prevent SSR mismatches
- Browser back button handling (`src/hooks/useBrowserBackButton.tsx`)

### Error Handling
- Display user-friendly error messages
- Log detailed errors to console for debugging
- Clear error states after successful operations
- Global error boundaries for graceful fallbacks

### Type Safety
- All database operations use generated TypeScript types
- Form validation with Zod schemas
- Proper typing for component props and state
- Utility functions with proper typing (`src/lib/utils.ts`)

## Database Considerations

- Property creation requires proper `created_by` field mapping to agent ID
- All modifications should respect RLS policies
- Use proper foreign key relationships when linking entities
- Activity logging is handled automatically via database triggers
- Migration files available for schema updates:
  - `migration_activity_logs.sql` - Activity logging system
  - `migration_task_comments.sql` - Task comments functionality
  - `migration_fix_agent_creation.sql` - Agent creation fixes
  - `migration_documents.sql` / `migration_documents_fixed.sql` - Document management system
  - `migration_property_*.sql` - Property-related schema updates

## Advanced Features

### Task Management System
- Task templates for workflow automation (`src/components/tasks/TaskTemplateManager.tsx`)
- Template applicator for applying workflows to entities
- Task comments system with activity tracking
- Priority-based task organization

### Lead Scoring & Analytics
- Lead scoring system (`src/components/clients/LeadScoringSystem.tsx`)
- Advanced analytics dashboard (`src/components/reports/AdvancedAnalytics.tsx`)
- Recent activities tracking with real-time updates

### Communication Tracking
- Communication timeline for client interactions
- Multiple communication types (email, phone, meeting, notes)
- Activity logging for all client touchpoints

### Document Management System
- Document templates with customizable fields (`document_templates` table)
- Document creation and editing with template-based workflows
- PDF generation using jsPDF library (`/api/documents/generate-pdf`)
- Supabase Storage integration for document file management
- Document status tracking (draft, finalized) with timestamp tracking
- Template field replacement with dynamic content rendering

## Testing & Quality

- Run `npm run lint` before committing changes
- Test authentication flows with different user roles
- Verify RLS policies work correctly in different scenarios
- Test activity logging triggers with database operations
- Validate form inputs and error handling

## Debugging & Development Tools

- Debug page available at `/debug` for testing
- Property creation test page at `/test-property-creation`
- Console logging in property store for debugging
- Activity logger with metadata for detailed tracking
- Error boundaries for graceful error handling

## Common Utilities

- `cn()` - Class name merging utility for Tailwind CSS
- `formatCurrency()` - US currency formatting
- `formatDate()` - Localized date formatting
- `formatPhoneNumber()` - US phone number formatting
- Activity logging helpers for common operations