-- Migration: Property-Client Relationship Tables
-- Purpose: Add support for client property interests and property interested clients

-- Create client_property_interests table for tracking properties that clients are interested in
CREATE TABLE client_property_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    interest_level VARCHAR(20) CHECK (interest_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
    notes TEXT,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'purchased', 'not_interested')) DEFAULT 'active',
    added_by UUID REFERENCES agents(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(client_id, property_id) -- Prevent duplicate entries
);

-- Create indexes for better performance
CREATE INDEX idx_client_interests_client ON client_property_interests(client_id);
CREATE INDEX idx_client_interests_property ON client_property_interests(property_id);
CREATE INDEX idx_client_interests_status ON client_property_interests(status);
CREATE INDEX idx_client_interests_level ON client_property_interests(interest_level);

-- Enable Row Level Security
ALTER TABLE client_property_interests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client_property_interests
-- Agents can view interests for their assigned clients and properties
CREATE POLICY "Agents can view client property interests" ON client_property_interests
    FOR SELECT USING (
        client_id IN (SELECT id FROM clients WHERE assigned_agent_id = auth.uid()) OR
        property_id IN (SELECT id FROM properties WHERE assigned_agent_id = auth.uid()) OR
        added_by = auth.uid()
    );

-- Agents can insert interests for their assigned clients and properties
CREATE POLICY "Agents can create client property interests" ON client_property_interests
    FOR INSERT WITH CHECK (
        client_id IN (SELECT id FROM clients WHERE assigned_agent_id = auth.uid()) OR
        property_id IN (SELECT id FROM properties WHERE assigned_agent_id = auth.uid())
    );

-- Agents can update interests they created or for their assigned clients/properties
CREATE POLICY "Agents can update client property interests" ON client_property_interests
    FOR UPDATE USING (
        client_id IN (SELECT id FROM clients WHERE assigned_agent_id = auth.uid()) OR
        property_id IN (SELECT id FROM properties WHERE assigned_agent_id = auth.uid()) OR
        added_by = auth.uid()
    );

-- Agents can delete interests they created or for their assigned clients/properties
CREATE POLICY "Agents can delete client property interests" ON client_property_interests
    FOR DELETE USING (
        client_id IN (SELECT id FROM clients WHERE assigned_agent_id = auth.uid()) OR
        property_id IN (SELECT id FROM properties WHERE assigned_agent_id = auth.uid()) OR
        added_by = auth.uid()
    );

-- Create trigger for updated_at
CREATE TRIGGER update_client_property_interests_updated_at BEFORE UPDATE ON client_property_interests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add activity logging for property-client relationships
-- Update activity_logs type enum to include new activities
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'property_interest_added';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'property_interest_updated';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'property_interest_removed';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'property_agent_assigned';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'agent_property_assigned';

-- Create function to log property-client relationship activities
CREATE OR REPLACE FUNCTION log_property_client_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_logs (agent_id, activity_type, entity_type, entity_id, description, metadata)
        VALUES (
            COALESCE(NEW.added_by, (SELECT assigned_agent_id FROM clients WHERE id = NEW.client_id)),
            'property_interest_added',
            'client',
            NEW.client_id,
            'Added property interest for client',
            jsonb_build_object(
                'property_id', NEW.property_id,
                'interest_level', NEW.interest_level,
                'property_address', (SELECT address FROM properties WHERE id = NEW.property_id),
                'client_name', (SELECT first_name || ' ' || last_name FROM clients WHERE id = NEW.client_id)
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO activity_logs (agent_id, activity_type, entity_type, entity_id, description, metadata)
        VALUES (
            COALESCE(NEW.added_by, (SELECT assigned_agent_id FROM clients WHERE id = NEW.client_id)),
            'property_interest_updated',
            'client',
            NEW.client_id,
            'Updated property interest for client',
            jsonb_build_object(
                'property_id', NEW.property_id,
                'old_interest_level', OLD.interest_level,
                'new_interest_level', NEW.interest_level,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'property_address', (SELECT address FROM properties WHERE id = NEW.property_id),
                'client_name', (SELECT first_name || ' ' || last_name FROM clients WHERE id = NEW.client_id)
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO activity_logs (agent_id, activity_type, entity_type, entity_id, description, metadata)
        VALUES (
            COALESCE(OLD.added_by, (SELECT assigned_agent_id FROM clients WHERE id = OLD.client_id)),
            'property_interest_removed',
            'client',
            OLD.client_id,
            'Removed property interest for client',
            jsonb_build_object(
                'property_id', OLD.property_id,
                'interest_level', OLD.interest_level,
                'property_address', (SELECT address FROM properties WHERE id = OLD.property_id),
                'client_name', (SELECT first_name || ' ' || last_name FROM clients WHERE id = OLD.client_id)
            )
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for activity logging
CREATE TRIGGER client_property_interests_activity_log
    AFTER INSERT OR UPDATE OR DELETE ON client_property_interests
    FOR EACH ROW EXECUTE FUNCTION log_property_client_activity();

-- Function to log property agent assignment changes
CREATE OR REPLACE FUNCTION log_property_agent_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id THEN
        -- Log the assignment change
        INSERT INTO activity_logs (agent_id, activity_type, entity_type, entity_id, description, metadata)
        VALUES (
            COALESCE(NEW.assigned_agent_id, NEW.created_by),
            'property_agent_assigned',
            'property',
            NEW.id,
            'Property assigned to agent',
            jsonb_build_object(
                'property_address', NEW.address,
                'old_agent_id', OLD.assigned_agent_id,
                'new_agent_id', NEW.assigned_agent_id,
                'old_agent_name', (SELECT agent_name FROM agents WHERE id = OLD.assigned_agent_id),
                'new_agent_name', (SELECT agent_name FROM agents WHERE id = NEW.assigned_agent_id)
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for property agent assignment logging
CREATE TRIGGER property_agent_assignment_log
    AFTER UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION log_property_agent_assignment();