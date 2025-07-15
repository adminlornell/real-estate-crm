# API Documentation

This document outlines the API endpoints available in the Real Estate CRM application.

## Overview

The application uses a combination of Supabase client-side operations and custom Next.js API routes for specific functionality that requires server-side processing.

## API Routes

### Document Management

#### POST `/api/documents/generate-pdf`

Generates a PDF document from a document template with filled field values.

**Request Body:**
```json
{
  "documentId": "uuid-of-document"
}
```

**Response:**
```json
{
  "pdfUrl": "https://supabase-storage-url/document.pdf"
}
```

**Features:**
- Fetches document and template data from Supabase
- Generates PDF using jsPDF library
- Replaces template placeholders with actual field values
- Uploads generated PDF to Supabase Storage
- Updates document record with PDF URL
- Includes signature lines for client and agent

**Error Responses:**
- `400` - Document ID is required
- `404` - Document not found
- `500` - PDF generation or upload failed

#### GET `/api/test-agent`

Development endpoint for testing agent creation and authentication flows.

**Response:**
```json
{
  "message": "Agent test endpoint",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Supabase Database Operations

The majority of CRUD operations are handled directly through the Supabase client using Row Level Security (RLS) policies. These operations include:

### Properties
- `GET` - List properties with filtering
- `POST` - Create new property
- `PUT` - Update property details
- `DELETE` - Remove property (soft delete)

### Clients
- `GET` - List clients with lead scoring
- `POST` - Create new client
- `PUT` - Update client information
- `DELETE` - Remove client

### Documents
- `GET` - List documents and templates
- `POST` - Create document from template
- `PUT` - Update document field values
- `DELETE` - Remove document

### Tasks
- `GET` - List tasks with filtering
- `POST` - Create task (manual or from template)
- `PUT` - Update task status and details
- `DELETE` - Remove task

### Communications
- `GET` - List client communications
- `POST` - Log new communication
- `PUT` - Update communication details

### Signatures
- `GET` - List signature requests and status
- `POST` - Create signature request
- `PUT` - Update signature status
- `DELETE` - Cancel signature request

## Authentication

All API operations require authentication through Supabase Auth. The authentication flow includes:

1. **User Authentication** - Supabase Auth handles user login/registration
2. **Agent Profile Creation** - Automatic agent profile creation via database triggers
3. **RLS Enforcement** - All database operations respect Row Level Security policies
4. **Session Management** - Auth context manages user state with caching

## Error Handling

The API follows consistent error handling patterns:

- **Client Errors (4xx)**: Invalid requests, missing parameters, authentication failures
- **Server Errors (5xx)**: Database errors, external service failures, unexpected exceptions

All errors include descriptive messages and appropriate HTTP status codes.

## Rate Limiting

Currently, no explicit rate limiting is implemented. Rate limiting is handled by Supabase's built-in protections and Vercel's platform limits.

## Development Notes

- Use the `/debug` page for testing API operations
- Check browser console for detailed error logging
- Activity logging is automatic for all database operations
- PDF generation may take 2-3 seconds for complex documents
- All file uploads go through Supabase Storage with proper security policies