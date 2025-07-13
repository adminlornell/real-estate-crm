-- Document Management Tables
-- This migration adds document templates and generated documents functionality

-- Document templates table
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    document_type VARCHAR(100) NOT NULL, -- 'listing_agreement_sale', 'listing_agreement_lease', 'purchase_agreement', etc.
    template_fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of field definitions
    template_content TEXT NOT NULL, -- HTML template with placeholders
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    field_values JSONB NOT NULL DEFAULT '{}'::jsonb, -- Filled form data
    pdf_url TEXT, -- URL to generated PDF file
    document_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'finalized', 'signed', 'executed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finalized_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE
);

-- Document signatures table
CREATE TABLE IF NOT EXISTS document_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    signer_name VARCHAR(255) NOT NULL,
    signer_email VARCHAR(255),
    signer_type VARCHAR(50) NOT NULL, -- 'agent', 'client', 'witness'
    signature_data TEXT, -- Base64 encoded signature or digital signature info
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_agent_id ON documents(agent_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_status ON documents(document_status);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(document_type);
CREATE INDEX IF NOT EXISTS idx_document_signatures_document_id ON document_signatures(document_id);

-- RLS Policies
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;

-- Document templates are accessible to all authenticated agents
DROP POLICY IF EXISTS "Agents can view document templates" ON document_templates;
CREATE POLICY "Agents can view document templates" ON document_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Agents can only access their own documents
DROP POLICY IF EXISTS "Agents can manage their own documents" ON documents;
CREATE POLICY "Agents can manage their own documents" ON documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM agents 
            WHERE agents.id = documents.agent_id 
            AND agents.user_id = auth.uid()
        )
    );

-- Agents can manage signatures on their documents
DROP POLICY IF EXISTS "Agents can manage signatures on their documents" ON document_signatures;
CREATE POLICY "Agents can manage signatures on their documents" ON document_signatures
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM documents 
            JOIN agents ON agents.id = documents.agent_id
            WHERE documents.id = document_signatures.document_id 
            AND agents.user_id = auth.uid()
        )
    );

-- Insert default document templates (only if they don't exist)
INSERT INTO document_templates (name, description, document_type, template_fields, template_content) 
SELECT 
    'Listing Agreement - Sale',
    'Standard listing agreement for property sales',
    'listing_agreement_sale',
    '[
        {"name": "property_address", "label": "Property Address", "type": "text", "required": true},
        {"name": "listing_price", "label": "Listing Price", "type": "currency", "required": true},
        {"name": "commission_rate", "label": "Commission Rate (%)", "type": "number", "required": true, "default": 6},
        {"name": "listing_period_start", "label": "Listing Period Start", "type": "date", "required": true},
        {"name": "listing_period_end", "label": "Listing Period End", "type": "date", "required": true},
        {"name": "client_name", "label": "Client Name", "type": "text", "required": true},
        {"name": "client_address", "label": "Client Address", "type": "text", "required": true},
        {"name": "client_phone", "label": "Client Phone", "type": "phone", "required": true},
        {"name": "client_email", "label": "Client Email", "type": "email", "required": true},
        {"name": "agent_name", "label": "Agent Name", "type": "text", "required": true},
        {"name": "agent_license", "label": "Agent License Number", "type": "text", "required": true},
        {"name": "brokerage_name", "label": "Brokerage Name", "type": "text", "required": true},
        {"name": "special_terms", "label": "Special Terms & Conditions", "type": "textarea", "required": false}
    ]'::jsonb,
    '<div class="document-container">
        <h1>EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT</h1>
        
        <div class="property-section">
            <h2>PROPERTY INFORMATION</h2>
            <p><strong>Property Address:</strong> {{property_address}}</p>
            <p><strong>Listing Price:</strong> {{listing_price}}</p>
        </div>
        
        <div class="parties-section">
            <h2>PARTIES</h2>
            <p><strong>Seller:</strong> {{client_name}}</p>
            <p><strong>Address:</strong> {{client_address}}</p>
            <p><strong>Phone:</strong> {{client_phone}}</p>
            <p><strong>Email:</strong> {{client_email}}</p>
            
            <p><strong>Listing Agent:</strong> {{agent_name}}</p>
            <p><strong>License Number:</strong> {{agent_license}}</p>
            <p><strong>Brokerage:</strong> {{brokerage_name}}</p>
        </div>
        
        <div class="terms-section">
            <h2>TERMS</h2>
            <p><strong>Listing Period:</strong> From {{listing_period_start}} to {{listing_period_end}}</p>
            <p><strong>Commission Rate:</strong> {{commission_rate}}% of sale price</p>
            
            <div class="special-terms">
                <h3>Special Terms & Conditions</h3>
                <p>{{special_terms}}</p>
            </div>
        </div>
        
        <div class="signatures-section">
            <h2>SIGNATURES</h2>
            <div class="signature-block">
                <p>___________________________ Date: ___________</p>
                <p>Seller Signature</p>
            </div>
            
            <div class="signature-block">
                <p>___________________________ Date: ___________</p>
                <p>Agent Signature</p>
            </div>
        </div>
    </div>'
WHERE NOT EXISTS (
    SELECT 1 FROM document_templates WHERE document_type = 'listing_agreement_sale'
);

INSERT INTO document_templates (name, description, document_type, template_fields, template_content)
SELECT
    'Listing Agreement - Lease',
    'Standard listing agreement for property leases',
    'listing_agreement_lease',
    '[
        {"name": "property_address", "label": "Property Address", "type": "text", "required": true},
        {"name": "monthly_rent", "label": "Monthly Rent", "type": "currency", "required": true},
        {"name": "security_deposit", "label": "Security Deposit", "type": "currency", "required": true},
        {"name": "lease_term", "label": "Lease Term (months)", "type": "number", "required": true},
        {"name": "commission_rate", "label": "Commission Rate (%)", "type": "number", "required": true, "default": 8},
        {"name": "listing_period_start", "label": "Listing Period Start", "type": "date", "required": true},
        {"name": "listing_period_end", "label": "Listing Period End", "type": "date", "required": true},
        {"name": "client_name", "label": "Property Owner Name", "type": "text", "required": true},
        {"name": "client_address", "label": "Owner Address", "type": "text", "required": true},
        {"name": "client_phone", "label": "Owner Phone", "type": "phone", "required": true},
        {"name": "client_email", "label": "Owner Email", "type": "email", "required": true},
        {"name": "agent_name", "label": "Agent Name", "type": "text", "required": true},
        {"name": "agent_license", "label": "Agent License Number", "type": "text", "required": true},
        {"name": "brokerage_name", "label": "Brokerage Name", "type": "text", "required": true},
        {"name": "pet_policy", "label": "Pet Policy", "type": "select", "options": ["No Pets", "Cats Only", "Dogs Only", "Cats and Dogs", "Case by Case"], "required": false},
        {"name": "utilities_included", "label": "Utilities Included", "type": "textarea", "required": false}
    ]'::jsonb,
    '<div class="document-container">
        <h1>EXCLUSIVE RENTAL LISTING AGREEMENT</h1>
        
        <div class="property-section">
            <h2>PROPERTY INFORMATION</h2>
            <p><strong>Property Address:</strong> {{property_address}}</p>
            <p><strong>Monthly Rent:</strong> {{monthly_rent}}</p>
            <p><strong>Security Deposit:</strong> {{security_deposit}}</p>
            <p><strong>Lease Term:</strong> {{lease_term}} months</p>
        </div>
        
        <div class="parties-section">
            <h2>PARTIES</h2>
            <p><strong>Property Owner:</strong> {{client_name}}</p>
            <p><strong>Address:</strong> {{client_address}}</p>
            <p><strong>Phone:</strong> {{client_phone}}</p>
            <p><strong>Email:</strong> {{client_email}}</p>
            
            <p><strong>Listing Agent:</strong> {{agent_name}}</p>
            <p><strong>License Number:</strong> {{agent_license}}</p>
            <p><strong>Brokerage:</strong> {{brokerage_name}}</p>
        </div>
        
        <div class="terms-section">
            <h2>TERMS</h2>
            <p><strong>Listing Period:</strong> From {{listing_period_start}} to {{listing_period_end}}</p>
            <p><strong>Commission Rate:</strong> {{commission_rate}}% of first month rent</p>
            
            <div class="property-details">
                <h3>Property Details</h3>
                <p><strong>Pet Policy:</strong> {{pet_policy}}</p>
                <p><strong>Utilities Included:</strong> {{utilities_included}}</p>
            </div>
        </div>
        
        <div class="signatures-section">
            <h2>SIGNATURES</h2>
            <div class="signature-block">
                <p>___________________________ Date: ___________</p>
                <p>Property Owner Signature</p>
            </div>
            
            <div class="signature-block">
                <p>___________________________ Date: ___________</p>
                <p>Agent Signature</p>
            </div>
        </div>
    </div>'
WHERE NOT EXISTS (
    SELECT 1 FROM document_templates WHERE document_type = 'listing_agreement_lease'
);

-- Update timestamps trigger (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist, then create them
DROP TRIGGER IF EXISTS update_document_templates_updated_at ON document_templates;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;

CREATE TRIGGER update_document_templates_updated_at 
    BEFORE UPDATE ON document_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();