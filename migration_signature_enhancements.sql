-- Migration: Enhance Document Signatures System
-- This migration adds enhanced fields to document_signatures table for better tracking and security

-- Add new columns to document_signatures table
ALTER TABLE document_signatures 
ADD COLUMN IF NOT EXISTS signature_image_url TEXT, -- URL to stored signature image
ADD COLUMN IF NOT EXISTS signature_coordinates JSONB, -- Canvas coordinates for signature
ADD COLUMN IF NOT EXISTS signing_session_id UUID DEFAULT gen_random_uuid(), -- Unique session ID
ADD COLUMN IF NOT EXISTS signature_status VARCHAR(20) DEFAULT 'pending' CHECK (signature_status IN ('pending', 'completed', 'rejected', 'expired')),
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE, -- When signature request expires
ADD COLUMN IF NOT EXISTS signing_method VARCHAR(20) DEFAULT 'digital' CHECK (signing_method IN ('digital', 'electronic', 'wet_signature')),
ADD COLUMN IF NOT EXISTS device_info JSONB, -- Device information for security
ADD COLUMN IF NOT EXISTS location_data JSONB, -- Optional location data
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10), -- Optional verification code
ADD COLUMN IF NOT EXISTS notifications_sent INTEGER DEFAULT 0, -- Track notification count
ADD COLUMN IF NOT EXISTS last_notification_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE, -- When signature was completed
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE, -- When signature was rejected
ADD COLUMN IF NOT EXISTS rejection_reason TEXT; -- Reason for rejection

-- Create signature requests table for managing signing workflows
CREATE TABLE IF NOT EXISTS signature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    request_title VARCHAR(255) NOT NULL,
    request_message TEXT,
    signing_order INTEGER DEFAULT 1, -- For multi-party signing
    required_signers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of required signer objects
    current_signer_index INTEGER DEFAULT 0,
    request_status VARCHAR(20) DEFAULT 'pending' CHECK (request_status IN ('pending', 'in_progress', 'completed', 'cancelled', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    reminder_frequency_hours INTEGER DEFAULT 24, -- How often to send reminders
    max_reminders INTEGER DEFAULT 3, -- Maximum number of reminders
    signing_url_token VARCHAR(255) UNIQUE NOT NULL, -- Unique token for signing URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Create signature audit log for comprehensive tracking
CREATE TABLE IF NOT EXISTS signature_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signature_request_id UUID REFERENCES signature_requests(id) ON DELETE CASCADE,
    document_signature_id UUID REFERENCES document_signatures(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'request_sent', 'document_viewed', 'signature_started', 'signature_completed', 'reminder_sent', etc.
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('agent', 'client', 'system')),
    actor_id UUID, -- ID of the person who performed the action
    actor_name VARCHAR(255),
    details JSONB, -- Additional details about the action
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_signature_requests_document_id ON signature_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_agent_id ON signature_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_client_id ON signature_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_status ON signature_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_signature_requests_token ON signature_requests(signing_url_token);
CREATE INDEX IF NOT EXISTS idx_signature_audit_log_request_id ON signature_audit_log(signature_request_id);
CREATE INDEX IF NOT EXISTS idx_signature_audit_log_action ON signature_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_document_signatures_session_id ON document_signatures(signing_session_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_status ON document_signatures(signature_status);

-- Enable RLS for new tables
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for signature_requests
CREATE POLICY "Agents can manage their signature requests" ON signature_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM agents 
            WHERE agents.id = signature_requests.agent_id 
            AND agents.user_id = auth.uid()
        )
    );

-- RLS Policies for signature_audit_log
CREATE POLICY "Agents can view audit logs for their signature requests" ON signature_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM signature_requests sr
            JOIN agents a ON a.id = sr.agent_id
            WHERE sr.id = signature_audit_log.signature_request_id 
            AND a.user_id = auth.uid()
        )
    );

-- Function to generate unique signing URL tokens
CREATE OR REPLACE FUNCTION generate_signing_token()
RETURNS VARCHAR(255) AS $$
DECLARE
    token VARCHAR(255);
BEGIN
    -- Generate a URL-safe token
    token := encode(gen_random_bytes(32), 'base64');
    -- Remove URL-unsafe characters
    token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Function to log signature activities
CREATE OR REPLACE FUNCTION log_signature_activity(
    p_signature_request_id UUID,
    p_document_signature_id UUID,
    p_action VARCHAR(50),
    p_actor_type VARCHAR(20),
    p_actor_id UUID DEFAULT NULL,
    p_actor_name VARCHAR(255) DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO signature_audit_log (
        signature_request_id,
        document_signature_id,
        action,
        actor_type,
        actor_id,
        actor_name,
        details,
        ip_address,
        user_agent
    ) VALUES (
        p_signature_request_id,
        p_document_signature_id,
        p_action,
        p_actor_type,
        p_actor_id,
        p_actor_name,
        p_details,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps trigger for signature_requests
CREATE TRIGGER update_signature_requests_updated_at 
    BEFORE UPDATE ON signature_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample signature request statuses for testing
COMMENT ON TABLE signature_requests IS 'Manages document signing workflows and multi-party signing processes';
COMMENT ON TABLE signature_audit_log IS 'Comprehensive audit trail for all signature-related activities';
COMMENT ON COLUMN signature_requests.required_signers IS 'JSON array of signer objects with name, email, type, and order';
COMMENT ON COLUMN signature_requests.signing_url_token IS 'Unique token used to generate secure signing URLs';
COMMENT ON COLUMN document_signatures.signature_coordinates IS 'Canvas coordinates and stroke data for signature recreation';
COMMENT ON COLUMN document_signatures.device_info IS 'Browser, OS, and device information for security tracking'; 