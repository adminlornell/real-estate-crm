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
            <h2>AGREED AND ACCEPTED</h2>
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
            <h2>AGREED AND ACCEPTED</h2>
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

INSERT INTO document_templates (name, description, document_type, template_fields, template_content)
SELECT
    'Exclusive Leasing Agency Agreement',
    'Exclusive leasing agency agreement for commercial properties',
    'exclusive_leasing_agency',
    '[
        {"name": "effective_date", "label": "Effective Date", "type": "date", "required": true},
        {"name": "landlord_name", "label": "Landlord Name", "type": "text", "required": true},
        {"name": "landlord_address", "label": "Landlord Address", "type": "text", "required": true},
        {"name": "agreement_expiration_date", "label": "Agreement Expiration Date", "type": "date", "required": true},
        {"name": "property_address", "label": "Property Address", "type": "text", "required": true},
        {"name": "sole_broker_commission", "label": "Sole Broker Commission (%)", "type": "number", "required": true, "default": 5},
        {"name": "co_broker_commission", "label": "Co-Broker Commission (%)", "type": "number", "required": true, "default": 6},
        {"name": "subsequent_term_commission", "label": "Subsequent Term Commission (%)", "type": "number", "required": true, "default": 1.5},
        {"name": "sale_commission_co_broker", "label": "Sale Commission - Co-Broker (%)", "type": "number", "required": true, "default": 6},
        {"name": "sale_commission_unrepresented", "label": "Sale Commission - Unrepresented (%)", "type": "number", "required": true, "default": 5},
        {"name": "broker_name", "label": "Broker Name", "type": "text", "required": true, "default": "LORNELL REAL ESTATE, LLC"},
        {"name": "broker_address", "label": "Broker Address", "type": "text", "required": true, "default": "22 CHERRY STREET, SPENCER, MA 01562"}
    ]'::jsonb,
    '<div class="document-container" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 30px;">
            <p><strong>DATE: {{effective_date}}</strong></p>
            <h1 style="margin-top: 20px;">EXCLUSIVE LEASING AGENCY AGREEMENT</h1>
        </div>
        
        <p>This Exclusive Leasing Agency Agreement (the "Agreement") is made as of <strong>{{effective_date}}</strong> (the "Effective Date") by and between <strong>{{landlord_name}}</strong> of <strong>{{landlord_address}}</strong> ("LANDLORD") and <strong>{{broker_name}}</strong>, of <strong>{{broker_address}}</strong> ("BROKER"). In consideration of the mutual covenants set forth below, LANDLORD and BROKER agree as follows:</p>
        
        <h2>1. Term of Agency.</h2>
        <p>This Agreement begins on the Effective Date and expires on <strong>{{agreement_expiration_date}}</strong> (the "Term").</p>
        
        <h2>2. Exclusive Leasing Agency.</h2>
        <p>LANDLORD grants to BROKER the exclusive right to procure residential and/or commercial tenants for the commercial suites at <strong>{{property_address}}</strong> (the "Property"). LANDLORD further agrees to refer all potentially acceptable tenants to BROKER during the Term of this Agreement and agrees to notify all other real estate agents or brokers who communicate with LANDLORD of BROKER''s exclusive agency relationship with LANDLORD. The final decision whether or not a tenant is acceptable for leasing the Property shall be solely within the discretion of LANDLORD.</p>
        
        <h2>3. Broker''s Representations and Duties.</h2>
        <p style="margin-bottom: 16px;"><strong>(a)</strong> BROKER represents that it is duly licensed as a real estate broker by the State of Massachusetts.</p>
        <p style="margin-bottom: 16px;"><strong>(b)</strong> BROKER agrees to use reasonable efforts to locate tenants acceptable to LANDLORD and to assist LANDLORD to negotiate terms and conditions of a lease acceptable to LANDLORD. BROKER agrees to assist in locating tenants, arrange showings, give advice concerning real estate practices and procedures, assist in negotiations, and coordinate activities throughout the process.</p>
        
        <h2>4. Landlord''s Representations and Duties.</h2>
        <p style="margin-bottom: 16px;"><strong>(a)</strong> LANDLORD agrees to work exclusively with BROKER for the leasing of the Property during the Term of this Agreement, conduct all negotiations with the knowledge and assistance of BROKER, refer all inquiries concerning leasing the Property to BROKER, and cooperate in marketing the Property for lease.</p>
        <p style="margin-bottom: 16px;"><strong>(b)</strong> LANDLORD represents that LANDLORD is not subject to any earlier agency agreement with any other broker or any protection period with respect to the leasing of the Property.</p>
        <p style="margin-bottom: 16px;"><strong>(c)</strong> LANDLORD agrees to advise BROKER of any potential tenant interested in leasing the Property about which LANDLORD was previously advised by any other person and advises each potential tenant or broker of LANDLORD''s exclusive agency relationship with BROKER as established herein.</p>
        <p style="margin-bottom: 16px;"><strong>(d)</strong> LANDLORD understands that this Agreement does not relieve LANDLORD of the duty to exercise due diligence for LANDLORD''s own protection, including the duty to investigate any information of importance to the LANDLORD.</p>
        <p style="margin-bottom: 16px;"><strong>(e)</strong> LANDLORD agrees that BROKER''s services as set forth herein do not constitute a guarantee or warranty concerning the leasing of the Property. LANDLORD agrees that BROKER has not been retained as an attorney, investment advisor, inspector, home inspector, pest/termite inspector, septic inspector, surveyor, or to otherwise determine the condition of the Property, and has not been retained to provide legal advice, to provide an opinion concerning lawfulness of current or anticipated uses, to perform a title search, or to act as a mortgage broker. LANDLORD agrees that BROKER shall have no duty to disclose any matter or condition outside the boundaries of the Property, including, but not limited to, present conditions and anticipated changes in the neighborhood where the Property is located. BROKER recommends that an attorney and other professionals be hired for such services as LANDLORD deems appropriate and that LANDLORD personally investigate particular matters which may be of importance, including, but not limited to, neighborhood composition, the level of crime and presence of sex offenders.</p>
        <p style="margin-bottom: 16px;"><strong>(f)</strong> LANDLORD acknowledges that the BROKER represents other landlords who may be interested in the same or similar tenants as LANDLORD. LANDLORD consents to such representation and agrees that it will not constitute a breach of duty or breach of contract for the BROKER to introduce other landlords to prospective tenants or to assist them with the leasing of such property.</p>
        <p style="margin-bottom: 16px;"><strong>(g)</strong> BROKER is authorized to disclose LANDLORD''s identity and to cooperate with and pay compensation to other brokers in connection with the performance of BROKER''s services.</p>
        
        <h2>5. Broker''s Compensation.</h2>
        <p style="margin-bottom: 16px;"><strong>(a)</strong> LANDLORD agrees to pay BROKER as follows:</p>
        <p style="margin-bottom: 16px;"><strong>(i)</strong> If during the Term of this Agreement, the Property is leased to a tenant for a term of more than one (1) month, then LANDLORD agrees to pay BROKER (i) {{sole_broker_commission}}%, if sole brokered, or {{co_broker_commission}}% if Co-Brokered, of the gross rent due in the initial term of any such lease agreement between the LANDLORD and tenant and (ii) {{subsequent_term_commission}}% of the gross rent due in each subsequent term of any such lease agreement (the "Subsequent Payments").</p>
        <p style="margin-bottom: 16px;"><strong>(ii)</strong> If within the term of this Agreement or any extension the PROPERTY is sold or the BROKER procures a buyer who is ready, willing and able to buy at a price and on the terms set forth herein or on such other price and terms as the LANDLORD may agree, the BROKER shall be due a fee of {{sale_commission_co_broker}}% of the gross selling price if a co-brokerage represents the buyer and {{sale_commission_unrepresented}}% if the buyer is unrepresented, whether or not the transaction closes or title passes. Said fee shall be paid at the time set for closing and may be deducted from amounts held by BROKER as escrow agent. The aforesaid fee shall also be due upon sale within 6 months after expiration of this Agreement or any extension to any person who is introduced to the PROPERTY during the aforesaid term or any extension, except if the LANDLORD has entered into an exclusive agreement with another broker in good faith. The BROKER shall also be entitled to reimbursement from the LANDLORD for each of the expenses identified in the attached Addendum A which shall be payable within 30 days of the billing date.</p>
        <p style="margin-bottom: 16px;"><strong>(iii)</strong> LANDLORD agrees that the First Payment shall be due the BROKER upon the tenant''s signing of such lease agreement. In the event that, within 90 days following the expiration of this Agreement, LANDLORD or any person acting for or with LANDLORD successfully leases the Property to a tenant after becoming aware of said tenant or receiving information about said tenant during the term of this Agreement, BROKER''s compensation shall be due as set forth here.</p>
        <p style="margin-bottom: 16px;"><strong>(iv)</strong> LANDLORD agrees that BROKER''s compensation due hereunder is not contingent on any payment by the tenant, or any cooperating broker, and in the event that the tenant, or any cooperating broker, does not pay compensation to BROKER, LANDLORD shall be responsible for payment in full of any compensation due hereunder.</p>
        
        <h2>6. No Joint Venture.</h2>
        <p>This Agreement does not create a partnership or joint venture relationship. This Agreement shall not be construed to create any obligation to enter into any other contract between or among the Parties or to support any claim for reimbursement of costs for efforts expended by either Party.</p>
        
        <h2>7. Entire Agreement/Governing Law.</h2>
        <p>This Agreement is the entire agreement between the parties. It is binding upon the parties'' heirs, successors, and personal representatives. Assignment shall not limit the rights of BROKER. This Agreement shall be governed by the laws of the Commonwealth of Massachusetts. Unless otherwise stated, this Agreement may not be modified, except in writing signed by both parties.</p>
        
        <div style="margin-top: 60px;">
            <h2>AGREED AND ACCEPTED:</h2>
            
            <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                <div style="width: 45%;">
                    <p>____________________________</p>
                    <p>{{landlord_name}}</p>
                    <p>SELLER/LANDLORD</p>
                    <p style="margin-top: 20px;">Date: _______________</p>
                </div>
                
                <div style="width: 45%;">
                    <p>____________________________</p>
                    <p>{{broker_name}}</p>
                    <p>BROKER</p>
                    <p style="margin-top: 20px;">Date: _______________</p>
                </div>
            </div>
        </div>
    </div>'
WHERE NOT EXISTS (
    SELECT 1 FROM document_templates WHERE document_type = 'exclusive_leasing_agency'
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