# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on localhost:3000 with hot reload
- `npm run build` - Build for production with webpack optimization
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

ESLint configuration includes Next.js TypeScript rules with warnings for:
- Unused variables, explicit any, unescaped entities
- React hooks dependencies and img elements
- Prefer const declarations
- Custom rules for React 19 and Next.js 15 compatibility

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

- **TypeScript**: Strict mode enabled with Next.js plugin and generated Supabase types
- **Tailwind CSS v4**: Custom design system with CSS variables for theming and HSL color values
- **Next.js 15**: App router with React 19, optimized package imports, webpack bundle splitting
- **Package Optimization**: Optimized imports for Supabase, Lucide, React Hook Form
- **Bundle Splitting**: Vendor chunking and lazy loading for performance

## MCP (Model Context Protocol) Setup

This project is configured with multiple MCP servers to enhance Claude Code's capabilities:

### Configured MCP Servers

1. **Git Server** (`@modelcontextprotocol/server-git`)
   - Provides version control operations and repository management
   - Environment: `GIT_REPOSITORY_PATH` set to project root
   - Usage: Enhanced git operations, commit analysis, branch management

2. **File System Server** (`@modelcontextprotocol/server-filesystem`)
   - Enables advanced file operations for document management
   - Environment: `FILESYSTEM_ALLOWED_DIRECTORIES` restricted to project directory
   - Usage: Document processing, file manipulation, content analysis

3. **TypeScript Server** (`@modelcontextprotocol/server-typescript`)
   - Enhanced TypeScript support and type checking
   - Environment: `TS_CONFIG_PATH` points to project tsconfig.json
   - Usage: Advanced code analysis, type inference, refactoring

4. **PostgreSQL Server** (`@modelcontextprotocol/server-postgres`)
   - Direct database integration with Supabase
   - Environment: `POSTGRES_CONNECTION_STRING` configured for Supabase connection
   - Usage: Database operations, schema analysis, query optimization

5. **PDF Server** (`@modelcontextprotocol/server-pdf`)
   - Enhanced PDF generation and manipulation for document management
   - Environment: `PDF_WORKSPACE` set to public directory
   - Usage: Document processing, PDF generation improvements

6. **Search Server** (`@modelcontextprotocol/server-search`)
   - Advanced search capabilities across the CRM
   - Environment: `SEARCH_INDEX_PATH` set to project search index
   - Usage: Content search, document indexing, data discovery

### MCP Configuration File

The MCP servers are configured in `.mcp.json` at the project root. This configuration:
- Uses project scope for team sharing
- Configures proper environment variables for each server
- Restricts file system access to project directory for security

### Managing MCP Servers

- **List servers**: `claude mcp list`
- **Get server details**: `claude mcp get <server-name>`
- **Add new server**: `claude mcp add -s project <name> <command> [args...]`
- **Remove server**: `claude mcp remove <server-name> -s project`

### Benefits for Development

- **Enhanced Database Operations**: Direct Supabase/PostgreSQL integration
- **Advanced File Management**: Improved document processing capabilities
- **Better Code Analysis**: TypeScript server for enhanced development
- **Version Control Integration**: Git operations and repository insights
- **Document Management**: PDF processing for the signature system
- **Search Enhancement**: Improved search across documents and data

## Architecture Overview

This is a Next.js 15 real estate CRM with the following key architectural patterns:

### Authentication & Authorization
- Uses Supabase Auth with Row Level Security (RLS)
- Agent profiles are automatically created in `agents` table on first login
- Auth context (`src/contexts/AuthContext.tsx`) manages user state
- Auth service (`src/lib/auth.ts`) handles authentication operations with caching

### Database Schema (15+ Tables)
Core tables with comprehensive relationships:
- `agents` - Agent profiles linked to auth users via `user_id` with automatic creation
- `properties` - Property listings with JSONB metadata, photos, virtual tours
- `clients` - Client records with preferences, budget tracking, lead scoring
- `inquiries` - Lead capture with source tracking and conversion analytics
- `showings` - Property showing scheduling with feedback and outcome tracking
- `communications` - Client interaction timeline with multiple communication types
- `tasks` - Task management with priority levels, due dates, and template support
- `task_comments` - Task collaboration system with activity integration
- `activity_logs` - Comprehensive audit trail with automatic trigger-based logging
- `task_templates` - Pre-defined workflow templates for process automation
- `documents` - Generated documents with field values, status tracking, and signatures
- `document_templates` - Reusable templates with configurable field definitions
- `document_signatures` - Enhanced signature records with metadata and verification
- `signature_requests` - Multi-party signing workflow management
- `signature_audit_log` - Complete signature audit trail with timestamps and device info

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
- `src/components/documents/` - Document management and print preview components
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

### Print Preview System
- **World-class print preview** with professional document formatting (`src/components/documents/PrintPreview.tsx`)
- **Real-time zoom controls** (25% to 200%) with keyboard shortcuts (Ctrl/Cmd + +/-)
- **Paper size selection** (A4, Letter, Legal) with orientation toggle (Portrait/Landscape)
- **Custom margin controls** for precise print formatting
- **Print-optimized CSS** with proper media queries and professional typography
- **Modal and standalone modes** - accessible via button or direct URL (`/documents/[id]/print-preview`)
- **Keyboard navigation** support (Escape to close, Ctrl/Cmd+P to print)
- **Settings panel** with live preview updates and reset functionality
- **Print simulation** with accurate paper dimensions and shadow effects
- **Mobile responsive** design that works across all screen sizes

## Testing & Quality

- Run `npm run lint` before committing changes
- Test authentication flows with different user roles
- Verify RLS policies work correctly in different scenarios
- Test activity logging triggers with database operations
- Validate form inputs and error handling
- Test print preview functionality across different browsers and devices
- Verify print output matches preview expectations

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

## Important Instructions

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User