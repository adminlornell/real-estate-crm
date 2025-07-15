# Real Estate CRM

A comprehensive, enterprise-grade real estate Customer Relationship Management (CRM) system built with Next.js 15, TypeScript, and Supabase. Features advanced document management, multi-party signature workflows, task automation, and world-class print preview capabilities.

## Features

### Core CRM Functionality
- **Property Management**: Advanced property listings with multi-criteria filtering, photo galleries, and virtual tour integration
- **Client Management**: Complete client profiles with lead scoring, preferences tracking, and relationship management
- **Agent Dashboard**: Real-time analytics with performance metrics, revenue tracking, and activity feeds
- **Communication Tracking**: Timeline-based client interaction logging with multiple communication types
- **Inquiry Management**: Lead capture with automatic scoring and conversion tracking
- **Showing Scheduler**: Property showing management with feedback collection

### Advanced Document Management
- **Document Templates**: Pre-built templates for listing agreements, leases, purchase contracts, and disclosures
- **Dynamic Field System**: Configurable template fields with validation and automatic population
- **PDF Generation**: Server-side PDF creation with professional formatting
- **Multi-party Signatures**: Sequential signature workflows with audit trails
- **Enhanced Security**: Digital signature verification with session tracking and device logging
- **Document Storage**: Supabase Storage integration with secure file management

### World-Class Print Preview
- **Professional Formatting**: Print-optimized CSS with enterprise-grade document styling
- **Real-time Zoom Controls**: 25%-200% zoom with keyboard shortcuts (Ctrl/Cmd +/-)
- **Paper Size Selection**: A4, Letter, Legal with portrait/landscape orientation
- **Custom Margin Controls**: Precise print formatting with live preview
- **Modal & Standalone Modes**: Accessible via button or direct URL navigation
- **Mobile Responsive**: Works seamlessly across all device sizes

### Task Management & Automation
- **Task Templates**: Pre-defined workflows for common real estate processes
- **Workflow Automation**: Apply standardized processes to new clients and properties
- **Task Collaboration**: Comments system with activity tracking
- **Priority Management**: Organized task management with due dates and assignments

### Analytics & Reporting
- **Advanced Analytics**: Performance tracking with visual charts and metrics
- **Lead Scoring**: Automated client scoring based on interactions and preferences
- **Activity Monitoring**: Real-time activity feeds with comprehensive audit trails
- **Revenue Tracking**: Commission and transaction analytics

### Security & Authentication
- **Row Level Security**: Comprehensive RLS policies ensuring data isolation
- **Role-based Access**: Multi-tier agent permissions with proper authorization
- **Audit Logging**: Complete activity tracking with metadata and timestamps
- **Session Management**: Secure authentication with proper error handling

## Tech Stack

### Core Technologies
- **Frontend**: Next.js 15 with React 19 and TypeScript (strict mode)
- **Backend**: Supabase (PostgreSQL with RLS, Auth, Storage)
- **Styling**: Tailwind CSS v4 with custom CSS variables and design system
- **State Management**: Zustand with optimistic updates and error handling
- **Database**: PostgreSQL with 15+ tables, triggers, and comprehensive indexing

### Key Libraries
- **Forms**: React Hook Form with Zod validation schemas
- **PDF Generation**: jsPDF and React PDF for document creation
- **Charts**: Recharts for analytics and reporting
- **Icons**: Lucide React (optimized imports)
- **Utilities**: date-fns, uuid, clsx, tailwind-merge
- **Canvas**: html2canvas for screenshot and print functionality

### Architecture Patterns
- **Component Design**: Atomic design with composition-based UI components
- **Type Safety**: Generated TypeScript types from Supabase schema
- **Error Handling**: Global error boundaries with user-friendly messages
- **Performance**: Webpack optimization, lazy loading, and bundle splitting
- **Security**: Multi-layer RLS policies with comprehensive audit logging

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase project set up
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd real-estate-crm
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Add your Supabase credentials to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

5. Set up the database:
   - Run the SQL script in `database.sql` in your Supabase SQL editor
   - This will create all necessary tables, triggers, and security policies

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses a comprehensive database schema with 15+ tables:

### Core Tables
- **agents**: Agent profiles linked to auth users with automatic creation
- **properties**: Property listings with JSONB metadata, photos, and virtual tours
- **clients**: Client records with preferences, budget tracking, and lead scoring
- **inquiries**: Lead capture with source tracking and conversion analytics
- **showings**: Property showing scheduling with feedback and outcome tracking
- **communications**: Client interaction timeline with multiple communication types
- **tasks**: Task management with priority levels and due date tracking
- **activity_logs**: Comprehensive audit trail with automatic trigger-based logging

### Advanced Document Management
- **document_templates**: Reusable templates with configurable field definitions
- **documents**: Generated documents with field values and status tracking
- **document_signatures**: Enhanced signature records with metadata and verification
- **signature_requests**: Multi-party signing workflow management
- **signature_audit_log**: Complete signature audit trail with timestamps

### Automation & Workflow
- **task_templates**: Pre-defined workflow templates for process automation
- **task_comments**: Task collaboration system with activity integration

### Key Features
- **UUID Primary Keys**: Auto-generation with proper indexing
- **JSONB Fields**: Flexible metadata storage for properties and preferences
- **Custom ENUM Types**: Status values, inquiry sources, communication types
- **Automatic Triggers**: Activity logging and timestamp management
- **RLS Policies**: Agent-specific data access control
- **Comprehensive Indexes**: Performance optimization for complex queries

## Project Structure

```
src/
├── app/                 # Next.js 15 app router with API routes
│   ├── api/            # Server-side API endpoints
│   │   ├── agents/     # Agent management endpoints
│   │   └── documents/  # PDF generation and document APIs
│   ├── documents/      # Document management pages
│   │   └── [id]/       # Dynamic document routes with print preview
│   ├── debug/          # Development and testing pages
│   └── test-*/         # Test pages for development
├── components/          # Comprehensive component library
│   ├── ui/             # Design system components (Button, Card, Input)
│   ├── auth/           # Authentication and user management
│   ├── properties/     # Property management and filtering
│   ├── clients/        # Client management and lead scoring
│   ├── documents/      # Document templates and print preview
│   ├── tasks/          # Task management and templates
│   ├── reports/        # Analytics and reporting components
│   ├── dashboard/      # Dashboard and metrics
│   ├── layout/         # Layout and navigation components
│   └── navigation/     # Navigation and routing components
├── contexts/           # React contexts (Auth, Navigation)
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication hook
│   ├── useNavigation.tsx # Navigation stack management
│   └── useHydration.tsx # SSR hydration guard
├── lib/                # Utility functions and services
│   ├── supabase.ts     # Supabase client configuration
│   ├── auth.ts         # Authentication service with caching
│   ├── activityLogger.ts # Activity logging service
│   └── utils.ts        # Utility functions (formatting, validation)
├── stores/             # Zustand state management
│   ├── usePropertyStore.ts # Property management with filtering
│   ├── useClientStore.ts   # Client relationship management
│   └── useDocumentStore.ts # Document and template management
├── types/              # TypeScript definitions
│   └── database.ts     # Generated Supabase types
└── styles/             # Global styles and CSS variables
```

## Available Scripts

- `npm run dev` - Start development server on localhost:3000 with hot reload
- `npm run build` - Build for production with webpack optimization
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with Next.js TypeScript rules and custom warnings

## Authentication & Authorization

The application uses Supabase Auth with automatic agent profile creation:

### User Flow
1. **Registration/Login**: Users authenticate via Supabase Auth
2. **Profile Creation**: Agent profiles are automatically created via database triggers
3. **Session Management**: Auth context manages user state with caching layer
4. **Data Access**: RLS policies ensure agents only access their assigned data

### Security Features
- **Row Level Security**: Comprehensive RLS policies on all tables
- **Automatic Logging**: Database triggers log all CRUD operations
- **Session Caching**: Auth service prevents repeated database calls
- **Error Handling**: Graceful authentication error management
- **Agent Assignment**: Automatic data assignment to authenticated agents

## Security & Compliance

### Database Security
- **Row Level Security**: Multi-layer RLS policies on all tables
- **Data Isolation**: Agents can only access their assigned properties and clients
- **Audit Logging**: Comprehensive activity tracking with metadata
- **Automatic Triggers**: Database-level logging for all CRUD operations

### Application Security
- **Input Validation**: Zod schemas for all form inputs
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **XSS Protection**: Proper input sanitization and encoding
- **CSRF Protection**: Built-in Next.js security features

### Document Security
- **Signature Verification**: Enhanced signature tracking with device info
- **Session Logging**: Complete audit trail for document access
- **File Security**: Supabase Storage with proper access controls
- **Version Control**: Document status tracking with timestamps

### Privacy & Compliance
- **Data Minimization**: Only collect necessary client information
- **Access Controls**: Role-based permissions with proper authorization
- **Activity Monitoring**: Real-time activity feeds for compliance tracking
- **Error Handling**: No sensitive data exposed in error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
