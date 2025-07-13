-- Migration: Add activity logs table
-- This table will track all agent activities for the recent activities dashboard section

-- Create activity_logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'property_created', 'property_updated', 'property_deleted',
        'client_created', 'client_updated', 'client_deleted',
        'task_created', 'task_updated', 'task_completed', 'task_cancelled',
        'task_comment_added', 'communication_logged', 'showing_scheduled',
        'showing_completed', 'document_uploaded', 'template_applied'
    )),
    entity_type VARCHAR(20) CHECK (entity_type IN ('property', 'client', 'task', 'communication', 'showing', 'document', 'template')),
    entity_id UUID,
    description TEXT NOT NULL,
    metadata JSONB, -- Store additional context like property address, client name, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_activity_logs_agent_id ON activity_logs(agent_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for activity logs
CREATE POLICY "Agents can view their own activity logs" ON activity_logs
    FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Agents can create their own activity logs" ON activity_logs
    FOR INSERT WITH CHECK (agent_id = auth.uid());

-- Create a function to log activities
CREATE OR REPLACE FUNCTION log_activity(
    p_agent_id UUID,
    p_activity_type VARCHAR(50),
    p_entity_type VARCHAR(20),
    p_entity_id UUID,
    p_description TEXT,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO activity_logs (agent_id, activity_type, entity_type, entity_id, description, metadata)
    VALUES (p_agent_id, p_activity_type, p_entity_type, p_entity_id, p_description, p_metadata)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic activity logging

-- Properties trigger
CREATE OR REPLACE FUNCTION trigger_log_property_activity() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_activity(
            NEW.assigned_agent_id,
            'property_created',
            'property',
            NEW.id,
            'Created property at ' || NEW.address,
            jsonb_build_object('address', NEW.address, 'price', NEW.price, 'property_type', NEW.property_type)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_activity(
            NEW.assigned_agent_id,
            'property_updated',
            'property',
            NEW.id,
            'Updated property at ' || NEW.address,
            jsonb_build_object('address', NEW.address, 'price', NEW.price, 'property_type', NEW.property_type)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_activity(
            OLD.assigned_agent_id,
            'property_deleted',
            'property',
            OLD.id,
            'Deleted property at ' || OLD.address,
            jsonb_build_object('address', OLD.address, 'price', OLD.price, 'property_type', OLD.property_type)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON properties
    FOR EACH ROW EXECUTE FUNCTION trigger_log_property_activity();

-- Clients trigger
CREATE OR REPLACE FUNCTION trigger_log_client_activity() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_activity(
            NEW.assigned_agent_id,
            'client_created',
            'client',
            NEW.id,
            'Added new client ' || NEW.first_name || ' ' || NEW.last_name,
            jsonb_build_object('name', NEW.first_name || ' ' || NEW.last_name, 'email', NEW.email, 'client_type', NEW.client_type)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_activity(
            NEW.assigned_agent_id,
            'client_updated',
            'client',
            NEW.id,
            'Updated client ' || NEW.first_name || ' ' || NEW.last_name,
            jsonb_build_object('name', NEW.first_name || ' ' || NEW.last_name, 'email', NEW.email, 'client_type', NEW.client_type)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_activity(
            OLD.assigned_agent_id,
            'client_deleted',
            'client',
            OLD.id,
            'Deleted client ' || OLD.first_name || ' ' || OLD.last_name,
            jsonb_build_object('name', OLD.first_name || ' ' || OLD.last_name, 'email', OLD.email, 'client_type', OLD.client_type)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION trigger_log_client_activity();

-- Tasks trigger
CREATE OR REPLACE FUNCTION trigger_log_task_activity() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_activity(
            NEW.assigned_to,
            'task_created',
            'task',
            NEW.id,
            'Created task: ' || NEW.title,
            jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'task_type', NEW.task_type)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            IF NEW.status = 'completed' THEN
                PERFORM log_activity(
                    NEW.assigned_to,
                    'task_completed',
                    'task',
                    NEW.id,
                    'Completed task: ' || NEW.title,
                    jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'task_type', NEW.task_type)
                );
            ELSIF NEW.status = 'cancelled' THEN
                PERFORM log_activity(
                    NEW.assigned_to,
                    'task_cancelled',
                    'task',
                    NEW.id,
                    'Cancelled task: ' || NEW.title,
                    jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'task_type', NEW.task_type)
                );
            ELSE
                PERFORM log_activity(
                    NEW.assigned_to,
                    'task_updated',
                    'task',
                    NEW.id,
                    'Updated task: ' || NEW.title,
                    jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'task_type', NEW.task_type, 'status', NEW.status)
                );
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_activity_trigger
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION trigger_log_task_activity();

-- Task comments trigger
CREATE OR REPLACE FUNCTION trigger_log_task_comment_activity() RETURNS TRIGGER AS $$
DECLARE
    task_title TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get task title for the activity description
        SELECT title INTO task_title FROM tasks WHERE id = NEW.task_id;
        
        PERFORM log_activity(
            NEW.agent_id,
            'task_comment_added',
            'task',
            NEW.task_id,
            'Added comment to task: ' || COALESCE(task_title, 'Unknown Task'),
            jsonb_build_object('task_title', task_title, 'comment_preview', LEFT(NEW.comment, 100))
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_comments_activity_trigger
    AFTER INSERT ON task_comments
    FOR EACH ROW EXECUTE FUNCTION trigger_log_task_comment_activity();

-- Communications trigger
CREATE OR REPLACE FUNCTION trigger_log_communication_activity() RETURNS TRIGGER AS $$
DECLARE
    client_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get client name for the activity description
        SELECT first_name || ' ' || last_name INTO client_name 
        FROM clients WHERE id = NEW.client_id;
        
        PERFORM log_activity(
            NEW.agent_id,
            'communication_logged',
            'communication',
            NEW.id,
            'Logged ' || COALESCE(NEW.type, 'communication') || ' with ' || COALESCE(client_name, 'client'),
            jsonb_build_object('client_name', client_name, 'type', NEW.type, 'subject', NEW.subject)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER communications_activity_trigger
    AFTER INSERT ON communications
    FOR EACH ROW EXECUTE FUNCTION trigger_log_communication_activity();

-- Showings trigger
CREATE OR REPLACE FUNCTION trigger_log_showing_activity() RETURNS TRIGGER AS $$
DECLARE
    property_address TEXT;
    client_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get property address and client name
        SELECT address INTO property_address FROM properties WHERE id = NEW.property_id;
        SELECT first_name || ' ' || last_name INTO client_name FROM clients WHERE id = NEW.client_id;
        
        PERFORM log_activity(
            NEW.agent_id,
            'showing_scheduled',
            'showing',
            NEW.id,
            'Scheduled showing at ' || COALESCE(property_address, 'property') || ' for ' || COALESCE(client_name, 'client'),
            jsonb_build_object('property_address', property_address, 'client_name', client_name, 'showing_date', NEW.showing_date)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status AND NEW.status = 'completed' THEN
            -- Get property address and client name
            SELECT address INTO property_address FROM properties WHERE id = NEW.property_id;
            SELECT first_name || ' ' || last_name INTO client_name FROM clients WHERE id = NEW.client_id;
            
            PERFORM log_activity(
                NEW.agent_id,
                'showing_completed',
                'showing',
                NEW.id,
                'Completed showing at ' || COALESCE(property_address, 'property') || ' for ' || COALESCE(client_name, 'client'),
                jsonb_build_object('property_address', property_address, 'client_name', client_name, 'showing_date', NEW.showing_date)
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER showings_activity_trigger
    AFTER INSERT OR UPDATE ON showings
    FOR EACH ROW EXECUTE FUNCTION trigger_log_showing_activity(); 