-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE inquiry_source AS ENUM (
    'website', 'referral', 'walk_in', 'social_media', 
    'advertisement', 'cold_call', 'open_house'
);

CREATE TYPE property_status AS ENUM (
    'active', 'pending', 'sold', 'withdrawn', 'expired', 'coming_soon'
);

CREATE TYPE user_role AS ENUM (
    'agent', 'team_lead', 'manager', 'admin', 'client'
);

-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    price DECIMAL(12,2),
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    square_feet INTEGER,
    lot_size DECIMAL(10,2),
    year_built INTEGER,
    property_type VARCHAR(20) CHECK (property_type IN ('single_family', 'condo', 'townhouse', 'multi_family')),
    listing_status VARCHAR(20) CHECK (listing_status IN ('active', 'pending', 'sold', 'withdrawn', 'expired')),
    listing_date TIMESTAMP,
    sold_date TIMESTAMP,
    assigned_agent_id UUID,
    mls_number VARCHAR(50),
    description TEXT,
    features JSONB,
    photos JSONB,
    virtual_tour_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    license_number VARCHAR(50),
    hire_date DATE,
    territory JSONB,
    specialties TEXT[],
    commission_rate DECIMAL(5,4),
    performance_metrics JSONB,
    profile_photo_url TEXT,
    bio TEXT,
    social_media JSONB,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'vacation')),
    manager_id UUID REFERENCES agents(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    client_type VARCHAR(20) CHECK (client_type IN ('buyer', 'seller', 'renter', 'landlord')),
    preferred_contact_method VARCHAR(10) CHECK (preferred_contact_method IN ('email', 'phone', 'text')),
    budget_range JSONB,
    preferences JSONB,
    source VARCHAR(50),
    assigned_agent_id UUID REFERENCES agents(id),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'converted', 'lost')),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Inquiries table
CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquirer_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    inquiry_date TIMESTAMP DEFAULT NOW(),
    inquiry_source inquiry_source,
    property_of_interest UUID REFERENCES properties(id),
    inquiry_type VARCHAR(20) CHECK (inquiry_type IN ('buying', 'selling', 'renting')),
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    preferred_locations TEXT[],
    timeline VARCHAR(20) CHECK (timeline IN ('immediate', '1_month', '3_months', '6_months', '1_year')),
    contact_preference VARCHAR(10) CHECK (contact_preference IN ('email', 'phone', 'text')),
    lead_score INTEGER CHECK (lead_score >= 0 AND lead_score <= 100),
    follow_up_status VARCHAR(20) CHECK (follow_up_status IN ('pending', 'in_progress', 'completed', 'closed')),
    assigned_agent_id UUID REFERENCES agents(id),
    notes TEXT,
    client_id UUID REFERENCES clients(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Showings table
CREATE TABLE showings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) NOT NULL,
    client_id UUID REFERENCES clients(id) NOT NULL,
    agent_id UUID REFERENCES agents(id) NOT NULL,
    showing_date TIMESTAMP NOT NULL,
    showing_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    showing_type VARCHAR(20) CHECK (showing_type IN ('in_person', 'virtual', 'drive_by')),
    status VARCHAR(20) CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    feedback TEXT,
    interest_level VARCHAR(20) CHECK (interest_level IN ('high', 'medium', 'low', 'not_interested')),
    follow_up_required BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) CHECK (document_type IN ('contract', 'disclosure', 'inspection', 'financial', 'marketing')),
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    property_id UUID REFERENCES properties(id),
    client_id UUID REFERENCES clients(id),
    agent_id UUID REFERENCES agents(id),
    document_status VARCHAR(20) CHECK (document_status IN ('draft', 'pending_review', 'approved', 'executed')),
    signature_required BOOLEAN DEFAULT FALSE,
    signature_status VARCHAR(20) CHECK (signature_status IN ('pending', 'completed')),
    expiration_date DATE,
    tags TEXT[],
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Communications table
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id),
    agent_id UUID REFERENCES agents(id),
    communication_type VARCHAR(20) CHECK (communication_type IN ('email', 'phone', 'text', 'meeting', 'note')),
    subject VARCHAR(255),
    content TEXT,
    direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
    status VARCHAR(20) CHECK (status IN ('sent', 'delivered', 'read', 'responded')),
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES agents(id),
    created_by UUID REFERENCES agents(id),
    due_date TIMESTAMP,
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    task_type VARCHAR(20) CHECK (task_type IN ('follow_up', 'showing', 'document', 'administrative')),
    related_entity_type VARCHAR(20) CHECK (related_entity_type IN ('property', 'client', 'inquiry', 'showing')),
    related_entity_id UUID,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE properties ADD CONSTRAINT fk_properties_agent FOREIGN KEY (assigned_agent_id) REFERENCES agents(id);
ALTER TABLE properties ADD CONSTRAINT fk_properties_creator FOREIGN KEY (created_by) REFERENCES agents(id);
ALTER TABLE documents ADD CONSTRAINT fk_documents_creator FOREIGN KEY (created_by) REFERENCES agents(id);

-- Create indexes for better performance
CREATE INDEX idx_properties_status ON properties(listing_status);
CREATE INDEX idx_properties_agent ON properties(assigned_agent_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_inquiries_agent ON inquiries(assigned_agent_id);
CREATE INDEX idx_inquiries_source ON inquiries(inquiry_source);
CREATE INDEX idx_inquiries_date ON inquiries(inquiry_date);
CREATE INDEX idx_showings_agent ON showings(agent_id);
CREATE INDEX idx_showings_date ON showings(showing_date);
CREATE INDEX idx_clients_agent ON clients(assigned_agent_id);
CREATE INDEX idx_clients_status ON clients(status);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE showings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Properties: Agents can only see their assigned properties
CREATE POLICY "Agents can view their assigned properties" ON properties
    FOR SELECT USING (assigned_agent_id = auth.uid());

-- Agents: Can view their own profile and team members
CREATE POLICY "Agents can view their own profile" ON agents
    FOR SELECT USING (user_id = auth.uid());

-- Allow agents to insert their own profile
CREATE POLICY "Agents can create their own profile" ON agents
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow agents to update their own profile
CREATE POLICY "Agents can update their own profile" ON agents
    FOR UPDATE USING (user_id = auth.uid());

-- Clients: Agents can view their assigned clients
CREATE POLICY "Agents can view their assigned clients" ON clients
    FOR SELECT USING (assigned_agent_id = auth.uid());

-- Inquiries: Agents can view their assigned inquiries
CREATE POLICY "Agents can view their assigned inquiries" ON inquiries
    FOR SELECT USING (assigned_agent_id = auth.uid());

-- Showings: Agents can view their showings
CREATE POLICY "Agents can view their showings" ON showings
    FOR SELECT USING (agent_id = auth.uid());

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.agents (user_id, agent_name, email, status, hire_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'agent_name', 'New Agent'),
    NEW.email,
    'active',
    CURRENT_DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create agent profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_showings_updated_at BEFORE UPDATE ON showings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();