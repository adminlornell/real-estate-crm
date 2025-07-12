# Real Estate CRM

A comprehensive real estate Customer Relationship Management (CRM) system built with Next.js 14, TypeScript, and Supabase.

## Features

- **Property Management**: Manage property listings with photos, pricing, and detailed information
- **Agent Dashboard**: Comprehensive dashboard with performance metrics and analytics
- **Client Management**: Track client interactions and manage relationships
- **Authentication**: Secure login system with role-based access control
- **Real-time Updates**: Live data synchronization across all users
- **Responsive Design**: Mobile-first design that works on all devices

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React

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

The application uses the following main tables:

- **properties**: Property listings with location, pricing, and details
- **agents**: Agent profiles and performance metrics
- **clients**: Client information and preferences
- **inquiries**: Lead capture and tracking
- **showings**: Property showing scheduling and feedback
- **documents**: Document management and e-signatures
- **communications**: Client communication tracking
- **tasks**: Task management and follow-ups

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   ├── auth/           # Authentication components
│   ├── properties/     # Property-related components
│   └── dashboard/      # Dashboard components
├── contexts/           # React contexts
├── lib/                # Utility functions and configurations
├── stores/             # Zustand state management
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## Authentication

The application uses Supabase Auth with the following user roles:

- **Agent**: Can manage their assigned properties and clients
- **Team Lead**: Can view their team's performance
- **Manager**: Can access office-wide data
- **Admin**: Full system access

## Security

- Row Level Security (RLS) policies ensure data isolation
- Agents can only access their assigned data
- All database operations are secured with proper authentication
- Input validation and sanitization throughout the application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
