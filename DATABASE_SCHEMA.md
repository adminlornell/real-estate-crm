# Real Estate CRM Database Schema

This document provides a comprehensive overview of all database components required for the Real Estate CRM project.

## Database Overview

The Real Estate CRM uses PostgreSQL with Supabase as the backend, implementing Row Level Security (RLS) for multi-tenant data access control.

## Tables

### Core Entity Tables

#### 1. **agents**
**Purpose**: Stores real estate agent information linked to auth users
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `user_id` - UUID (FK to auth.users)
  - `agent_name` - VARCHAR(255) NOT NULL
  - `email` - VARCHAR(255) UNIQUE NOT NULL
  - `phone` - VARCHAR(20)
  - `license_number` - VARCHAR(100)
  - `hire_date` - DATE
  - `territory` - JSONB
  - `specialties` - TEXT[]
  - `commission_rate` - NUMERIC
  - `performance_metrics` - JSONB
  - `profile_photo_url` - TEXT
  - `bio` - TEXT
  - `social_media` - JSONB
  - `status` - VARCHAR(20) CHECK (status IN ('active', 'inactive', 'vacation'))
  - `manager_id` - UUID (FK to agents.id)
  - `created_at`, `updated_at` - TIMESTAMP
- **Relationships**: Self-referencing for manager hierarchy, references auth.users

#### 2. **clients**
**Purpose**: Stores client/customer information
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `first_name`, `last_name` - VARCHAR(100) NOT NULL
  - `email` - VARCHAR(255) NOT NULL
  - `phone` - VARCHAR(20)
  - `address` - TEXT
  - `client_type` - VARCHAR(20) CHECK (client_type IN ('buyer', 'seller', 'renter', 'landlord'))
  - `preferred_contact_method` - VARCHAR(10) CHECK (preferred_contact_method IN ('email', 'phone', 'text'))
  - `budget_range` - JSONB
  - `preferences` - JSONB
  - `source` - VARCHAR(100)
  - `assigned_agent_id` - UUID (FK to agents.id)
  - `status` - VARCHAR(20) CHECK (status IN ('active', 'inactive', 'converted', 'lost'))
  - `tags` - TEXT[]
  - `created_at`, `updated_at` - TIMESTAMP
- **Relationships**: Belongs to agent

#### 3. **properties**
**Purpose**: Stores property listings and details
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `property_id` - VARCHAR(50) UNIQUE NOT NULL (business identifier)
  - `address` - TEXT NOT NULL
  - `city`, `state`, `zip_code` - VARCHAR NOT NULL
  - `price` - NUMERIC(12,2)
  - `bedrooms` - INTEGER
  - `bathrooms` - NUMERIC(3,1)
  - `square_feet` - INTEGER
  - `lot_size` - NUMERIC(10,2)
  - `year_built` - INTEGER
  - `property_type` - VARCHAR(20) CHECK (property_type IN ('single_family', 'condo', 'townhouse', 'multi_family'))
  - `listing_status` - VARCHAR(20) CHECK (listing_status IN ('active', 'pending', 'sold', 'withdrawn', 'expired'))
  - `listing_date`, `sold_date` - TIMESTAMP
  - `assigned_agent_id` - UUID (FK to agents.id)
  - `mls_number` - VARCHAR(50)
  - `description` - TEXT
  - `features` - JSONB
  - `photos` - JSONB
  - `virtual_tour_url` - TEXT
  - `created_by` - UUID (FK to agents.id) NOT NULL
  - `created_at`, `updated_at` - TIMESTAMP
- **Relationships**: Belongs to agent (assigned and creator)

### Relationship Tables

#### 4. **client_property_interests**
**Purpose**: Tracks which properties clients are interested in
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `client_id` - UUID (FK to clients.id) NOT NULL
  - `property_id` - UUID (FK to properties.id) NOT NULL
  - `interest_level` - VARCHAR(20) CHECK (interest_level IN ('high', 'medium', 'low')) DEFAULT 'medium'
  - `notes` - TEXT
  - `status` - VARCHAR(20) CHECK (status IN ('active', 'inactive', 'purchased', 'not_interested')) DEFAULT 'active'
  - `added_by` - UUID (FK to agents.id)
  - `created_at`, `updated_at` - TIMESTAMP
- **Constraints**: UNIQUE(client_id, property_id)
- **Relationships**: Links clients to properties

### Communication & Activity Tables

#### 5. **communications**
**Purpose**: Logs all communications between agents and clients
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `client_id` - UUID (FK to clients.id)
  - `agent_id` - UUID (FK to agents.id)
  - `communication_type` - VARCHAR(20) CHECK (communication_type IN ('email', 'phone', 'text', 'meeting', 'note'))
  - `subject` - VARCHAR(255)
  - `content` - TEXT
  - `direction` - VARCHAR(10) CHECK (direction IN ('inbound', 'outbound'))
  - `status` - VARCHAR(20) CHECK (status IN ('sent', 'delivered', 'read', 'responded'))
  - `scheduled_at`, `completed_at` - TIMESTAMP
  - `follow_up_required` - BOOLEAN DEFAULT FALSE
  - `follow_up_date` - TIMESTAMP
  - `created_at` - TIMESTAMP
- **Relationships**: Links agents and clients

#### 6. **activity_logs**
**Purpose**: Comprehensive audit trail for all system activities
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `agent_id` - UUID (FK to agents.id) NOT NULL
  - `activity_type` - VARCHAR(50) NOT NULL (extensive CHECK constraint with 21+ activity types)
  - `entity_type` - VARCHAR(20) CHECK (entity_type IN ('property', 'client', 'task', 'communication', 'showing', 'document', 'template'))
  - `entity_id` - UUID
  - `description` - TEXT NOT NULL
  - `metadata` - JSONB
  - `created_at` - TIMESTAMP
- **Purpose**: Central logging for analytics and audit trails

### Task Management Tables

#### 7. **tasks**
**Purpose**: Task management system for agents
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `title` - VARCHAR(255) NOT NULL
  - `description` - TEXT
  - `assigned_to` - UUID (FK to agents.id)
  - `created_by` - UUID (FK to agents.id)
  - `due_date` - TIMESTAMP
  - `priority` - VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
  - `status` - VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
  - `task_type` - VARCHAR(20) CHECK (task_type IN ('follow_up', 'showing', 'document', 'administrative'))
  - `related_entity_type` - VARCHAR(20) CHECK (related_entity_type IN ('property', 'client', 'inquiry', 'showing'))
  - `related_entity_id` - UUID
  - `template_id` - UUID (FK to task_templates.id)
  - `completed_at` - TIMESTAMP
  - `comments` - TEXT
  - `created_at` - TIMESTAMP
- **Relationships**: Links to agents, can reference templates

#### 8. **task_templates**
**Purpose**: Predefined task workflows for automation
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `name` - VARCHAR(255) NOT NULL
  - `description` - TEXT
  - `workflow_type` - VARCHAR(50) CHECK (workflow_type IN ('new_client_onboarding', 'property_listing', 'buyer_process', 'seller_process', 'closing_process', 'follow_up_sequence'))
  - `tasks` - JSONB NOT NULL (array of task objects)
  - `is_active` - BOOLEAN DEFAULT TRUE
  - `created_by` - UUID (FK to agents.id)
  - `created_at`, `updated_at` - TIMESTAMP
- **Purpose**: Workflow automation and standardization

#### 9. **task_comments**
**Purpose**: Comments and notes on tasks
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `task_id` - UUID (FK to tasks.id) NOT NULL
  - `agent_id` - UUID (FK to agents.id) NOT NULL
  - `comment` - TEXT NOT NULL
  - `created_at` - TIMESTAMP
- **Relationships**: Links tasks to agent comments

### Document Management Tables

#### 10. **documents**
**Purpose**: Document storage and management
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `document_name` - VARCHAR(255) NOT NULL
  - `document_type` - VARCHAR(20) CHECK (document_type IN ('contract', 'disclosure', 'inspection', 'financial', 'marketing'))
  - `file_url` - TEXT NOT NULL
  - `file_size` - INTEGER
  - `mime_type` - VARCHAR(100)
  - `property_id` - UUID (FK to properties.id)
  - `client_id` - UUID (FK to clients.id)
  - `agent_id` - UUID (FK to agents.id)
  - `document_status` - VARCHAR(20) CHECK (document_status IN ('draft', 'pending_review', 'approved', 'executed'))
  - `signature_required` - BOOLEAN DEFAULT FALSE
  - `signature_status` - VARCHAR(20) CHECK (signature_status IN ('pending', 'completed'))
  - `expiration_date` - DATE
  - `tags` - TEXT[]
  - `version` - INTEGER DEFAULT 1
  - `template_id` - UUID (FK to document_templates.id)
  - `title` - VARCHAR(255)
  - `field_values` - JSONB DEFAULT '{}'
  - `finalized_at` - TIMESTAMP
  - `pdf_url` - TEXT
  - `created_by` - UUID (FK to agents.id) NOT NULL
  - `created_at`, `updated_at` - TIMESTAMP
- **Relationships**: Links to properties, clients, agents, templates

#### 11. **document_templates**
**Purpose**: Reusable document templates with field definitions
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `name` - VARCHAR(255) NOT NULL
  - `description` - TEXT
  - `document_type` - VARCHAR(50) NOT NULL
  - `template_fields` - JSONB NOT NULL DEFAULT '[]'
  - `template_content` - TEXT NOT NULL
  - `is_active` - BOOLEAN DEFAULT TRUE
  - `created_at`, `updated_at` - TIMESTAMP
- **Purpose**: Template-based document generation

### Signature Management Tables

#### 12. **signature_requests**
**Purpose**: Manages document signing workflows
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `document_id` - UUID (FK to documents.id)
  - `agent_id` - UUID (FK to agents.id)
  - `client_id` - UUID (FK to clients.id)
  - `request_title` - VARCHAR(255) NOT NULL
  - `request_message` - TEXT
  - `signing_order` - INTEGER DEFAULT 1
  - `required_signers` - JSONB NOT NULL DEFAULT '[]'
  - `current_signer_index` - INTEGER DEFAULT 0
  - `request_status` - VARCHAR(20) CHECK (request_status IN ('pending', 'in_progress', 'completed', 'cancelled', 'expired')) DEFAULT 'pending'
  - `expires_at` - TIMESTAMPTZ
  - `reminder_frequency_hours` - INTEGER DEFAULT 24
  - `max_reminders` - INTEGER DEFAULT 3
  - `signing_url_token` - VARCHAR(255) UNIQUE NOT NULL
  - `created_at`, `updated_at`, `completed_at`, `cancelled_at` - TIMESTAMPTZ
- **Purpose**: Multi-party document signing coordination

#### 13. **document_signatures**
**Purpose**: Individual signature records
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `document_id` - UUID (FK to documents.id)
  - `signer_name` - VARCHAR(255) NOT NULL
  - `signer_email` - VARCHAR(255)
  - `signer_type` - VARCHAR(50) NOT NULL
  - `signature_data` - TEXT
  - `signed_at` - TIMESTAMPTZ DEFAULT NOW()
  - `ip_address` - INET
  - `user_agent` - TEXT
  - `signature_image_url` - TEXT
  - `signature_coordinates` - JSONB
  - `signing_session_id` - UUID DEFAULT gen_random_uuid()
  - `signature_status` - VARCHAR(20) CHECK (signature_status IN ('pending', 'completed', 'rejected', 'expired')) DEFAULT 'pending'
  - `expiry_date` - TIMESTAMPTZ
  - `signing_method` - VARCHAR(20) CHECK (signing_method IN ('digital', 'electronic', 'wet_signature')) DEFAULT 'digital'
  - `device_info` - JSONB
  - `location_data` - JSONB
  - `verification_code` - VARCHAR(50)
  - `notifications_sent` - INTEGER DEFAULT 0
  - `last_notification_sent` - TIMESTAMPTZ
  - `completed_at`, `rejected_at` - TIMESTAMPTZ
  - `rejection_reason` - TEXT
- **Purpose**: Detailed signature tracking with audit trail

#### 14. **signature_audit_log**
**Purpose**: Comprehensive audit trail for signature activities
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `signature_request_id` - UUID (FK to signature_requests.id)
  - `document_signature_id` - UUID (FK to document_signatures.id)
  - `action` - VARCHAR(100) NOT NULL
  - `actor_type` - VARCHAR(20) CHECK (actor_type IN ('agent', 'client', 'system')) NOT NULL
  - `actor_id` - UUID
  - `actor_name` - VARCHAR(255)
  - `details` - JSONB
  - `ip_address` - INET
  - `user_agent` - TEXT
  - `created_at` - TIMESTAMPTZ DEFAULT NOW()
- **Purpose**: Security and compliance audit trail

### Supporting Tables

#### 15. **inquiries**
**Purpose**: Leads and initial customer inquiries
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `inquirer_name` - VARCHAR(100) NOT NULL
  - `email` - VARCHAR(255) NOT NULL
  - `phone` - VARCHAR(20)
  - `inquiry_date` - TIMESTAMP DEFAULT NOW()
  - `inquiry_source` - inquiry_source ENUM ('website', 'referral', 'walk_in', 'social_media', 'advertisement', 'cold_call', 'open_house')
  - `property_of_interest` - UUID (FK to properties.id)
  - `inquiry_type` - VARCHAR(20) CHECK (inquiry_type IN ('buying', 'selling', 'renting'))
  - `budget_min`, `budget_max` - NUMERIC(12,2)
  - `preferred_locations` - TEXT[]
  - `timeline` - VARCHAR(20) CHECK (timeline IN ('immediate', '1_month', '3_months', '6_months', '1_year'))
  - `contact_preference` - VARCHAR(10) CHECK (contact_preference IN ('email', 'phone', 'text'))
  - `lead_score` - INTEGER CHECK (lead_score >= 0 AND lead_score <= 100)
  - `follow_up_status` - VARCHAR(20) CHECK (follow_up_status IN ('pending', 'in_progress', 'completed', 'closed'))
  - `assigned_agent_id` - UUID (FK to agents.id)
  - `notes` - TEXT
  - `client_id` - UUID (FK to clients.id)
  - `created_at`, `updated_at` - TIMESTAMP
- **Relationships**: Can be converted to clients

#### 16. **showings**
**Purpose**: Property showing appointments
- **Primary Key**: `id` (UUID)
- **Columns**:
  - `id` - UUID primary key
  - `property_id` - UUID (FK to properties.id) NOT NULL
  - `client_id` - UUID (FK to clients.id) NOT NULL
  - `agent_id` - UUID (FK to agents.id) NOT NULL
  - `showing_date` - TIMESTAMP NOT NULL
  - `showing_time` - TIME NOT NULL
  - `duration_minutes` - INTEGER DEFAULT 30
  - `showing_type` - VARCHAR(20) CHECK (showing_type IN ('in_person', 'virtual', 'drive_by'))
  - `status` - VARCHAR(20) CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'))
  - `feedback` - TEXT
  - `interest_level` - VARCHAR(20) CHECK (interest_level IN ('high', 'medium', 'low', 'not_interested'))
  - `follow_up_required` - BOOLEAN DEFAULT FALSE
  - `notes` - TEXT
  - `created_at`, `updated_at` - TIMESTAMP
- **Relationships**: Links properties, clients, and agents

## Extensions

### Installed Extensions
- **uuid-ossp**: UUID generation (version 1.1)
- **pgcrypto**: Cryptographic functions (version 1.3)
- **pg_stat_statements**: Query performance tracking (version 1.11)
- **pg_graphql**: GraphQL support (version 1.5.11)
- **supabase_vault**: Secure secrets management (version 0.3.1)
- **wrappers**: Foreign data wrappers (version 0.5.3)

### Available Extensions
Key extensions available for future use:
- **postgis**: Geospatial data support
- **pg_cron**: Job scheduling
- **vector**: Vector/AI embeddings
- **pgjwt**: JWT token handling
- **http**: HTTP client functionality

## Row Level Security (RLS) Policies

All tables have RLS enabled with agent-based access control:

### Agent-Based Access Pattern
```sql
-- Standard pattern for agent access
auth.uid() IN (SELECT agents.user_id FROM agents WHERE agents.id = [agent_field])
```

### Key Policy Examples

#### Tasks Table Policies
- **INSERT**: `created_by IN (SELECT id FROM agents WHERE user_id = auth.uid())`
- **SELECT**: `assigned_to IN (SELECT id FROM agents WHERE user_id = auth.uid())`
- **UPDATE/DELETE**: Agent can modify tasks they created or are assigned to

#### Client Property Interests Policies
- **All Operations**: `client_id IN (SELECT id FROM clients WHERE assigned_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()))`

#### Document Signature Policies
- **Multi-table checks**: Verifies agent access through document ownership or client assignment

## Functions and Triggers

### Utility Functions
- **update_updated_at_column()**: Automatically updates `updated_at` timestamps
- **log_property_client_activity()**: Activity logging for property-client relationships
- **validate_signature_request()**: Signature request validation

### Triggers
- **Updated At Triggers**: All tables with `updated_at` columns
- **Activity Logging Triggers**: Automatic activity log creation
- **Signature Audit Triggers**: Comprehensive signature activity tracking

## Indexes

### Performance Indexes
- Primary key indexes (automatic)
- Foreign key indexes for all relationships
- Specialized indexes:
  - `idx_client_interests_client` on `client_property_interests(client_id)`
  - `idx_client_interests_property` on `client_property_interests(property_id)`
  - `idx_client_interests_status` on `client_property_interests(status)`
  - `idx_properties_status` on `properties(listing_status)`

## Custom Types and Enums

### inquiry_source ENUM
```sql
CREATE TYPE inquiry_source AS ENUM (
  'website', 'referral', 'walk_in', 'social_media', 
  'advertisement', 'cold_call', 'open_house'
);
```

## Migration History

The database has been built through 61 migrations covering:
1. **Core Schema Setup** (agents, clients, properties)
2. **Task Management System** (tasks, templates, comments)
3. **Document Management** (documents, templates, signatures)
4. **Activity Logging** (comprehensive audit trails)
5. **RLS Policy Fixes** (security and access control)
6. **Property-Client Relationships** (interest tracking)
7. **Signature System Enhancement** (multi-party signing)

## Data Relationships Summary

```
agents (1) ←→ (M) clients
agents (1) ←→ (M) properties  
agents (1) ←→ (M) tasks
agents (1) ←→ (M) documents
clients (M) ←→ (M) properties (via client_property_interests)
clients (1) ←→ (M) showings ←→ (M) properties
documents (1) ←→ (M) signature_requests
documents (1) ←→ (M) document_signatures
tasks (M) ←→ (1) task_templates
```

## Security Features

1. **Row Level Security**: Comprehensive multi-tenant isolation
2. **Agent-Based Access Control**: All data scoped to agent relationships
3. **Audit Trails**: Complete activity and signature logging
4. **Signature Security**: IP tracking, device fingerprinting, audit logs
5. **Data Validation**: Extensive CHECK constraints and foreign keys

## Performance Considerations

1. **Optimized Queries**: Proper indexing for common query patterns
2. **RLS Efficiency**: Policies designed for index usage
3. **JSONB Usage**: Flexible schema for metadata while maintaining performance
4. **Activity Logging**: Asynchronous logging to prevent performance impact

This schema supports a comprehensive real estate CRM with document management, task automation, client relationship tracking, and a complete signature workflow system. 