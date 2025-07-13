-- Updated Document Management Templates - Lornell Style
-- This migration replaces the document templates with exact replicas of the Lornell forms

-- First, clear existing templates
DELETE FROM document_templates WHERE document_type IN ('listing_agreement_sale', 'listing_agreement_lease', 'listing_agreement_sale_lease');

-- Insert the exact Lornell templates
INSERT INTO document_templates (name, description, document_type, template_fields, template_content) VALUES 
(
    'Exclusive Right to Sell Listing Agreement - Lornell',
    'Professional Lornell exclusive right to sell listing agreement',
    'listing_agreement_sale',
    '[
        {"name": "property_address", "label": "Property Address", "type": "text", "required": true},
        {"name": "city", "label": "City", "type": "text", "required": true},
        {"name": "state", "label": "State", "type": "text", "required": true, "default": "NY"},
        {"name": "zip_code", "label": "Zip Code", "type": "text", "required": true},
        {"name": "mls_number", "label": "MLS Number", "type": "text", "required": false},
        {"name": "listing_price", "label": "Listing Price", "type": "currency", "required": true},
        {"name": "listing_period_start", "label": "Listing Period Start", "type": "date", "required": true},
        {"name": "listing_period_end", "label": "Listing Period End", "type": "date", "required": true},
        {"name": "commission_rate", "label": "Commission Rate (%)", "type": "number", "required": true, "default": 6},
        {"name": "seller_name", "label": "Seller Full Name", "type": "text", "required": true},
        {"name": "seller_address", "label": "Seller Address", "type": "text", "required": true},
        {"name": "seller_city_state_zip", "label": "Seller City, State, Zip", "type": "text", "required": true},
        {"name": "seller_phone", "label": "Seller Phone", "type": "phone", "required": true},
        {"name": "seller_email", "label": "Seller Email", "type": "email", "required": true},
        {"name": "agent_name", "label": "Listing Agent Name", "type": "text", "required": true},
        {"name": "agent_license", "label": "Agent License Number", "type": "text", "required": true},
        {"name": "broker_name", "label": "Broker Name", "type": "text", "required": true, "default": "LORNELL"},
        {"name": "broker_address", "label": "Broker Address", "type": "text", "required": true},
        {"name": "broker_phone", "label": "Broker Phone", "type": "phone", "required": true},
        {"name": "date_signed", "label": "Date Signed", "type": "date", "required": true}
    ]'::jsonb,
    '<div style="font-family: Times, serif; max-width: 8.5in; margin: 0 auto; padding: 0.5in; line-height: 1.2; font-size: 11pt;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 16pt; font-weight: bold; margin: 0; letter-spacing: 2px;">LORNELL</h1>
        </div>
        
        <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="font-size: 14pt; font-weight: bold; margin: 0; text-decoration: underline;">EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT</h2>
        </div>
        
        <div style="margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>Property Address:</strong> {{property_address}}, {{city}}, {{state}} {{zip_code}}</p>
            <p style="margin: 5px 0;"><strong>MLS Number:</strong> {{mls_number}} &nbsp;&nbsp;&nbsp; <strong>Date:</strong> {{date_signed}}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>1. EXCLUSIVE RIGHT TO SELL:</strong> The undersigned Seller(s) hereby grant(s) to {{broker_name}} ("Broker"), 
                the exclusive right to sell the above described real property ("Property") for the period from {{listing_period_start}} 
                to {{listing_period_end}} ("Listing Period") at the price of ${{listing_price}} or such other price and terms as 
                Seller may accept.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>2. LISTING PRICE AND TERMS:</strong> The listing price is ${{listing_price}}. Seller agrees that if during 
                the listing period or any extension thereof, a buyer is procured who is ready, willing, and able to purchase the 
                Property at the listed price and terms, or at any other price and terms acceptable to Seller, Broker will have 
                earned the commission specified herein.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 5px;">
                <strong>3. COMMISSION:</strong> In consideration of Broker''s services, Seller agrees to pay Broker a commission of 
                {{commission_rate}}% of the gross sale price. This commission is earned when:
            </p>
            <div style="margin-left: 20px;">
                <p>(a) A buyer is procured during the listing period who is ready, willing and able to purchase at the listing price and terms;</p>
                <p>(b) A sale is consummated at any price acceptable to Seller during the listing period;</p>
                <p>(c) A sale is consummated within 90 days after expiration of this agreement to anyone with whom Broker negotiated during the listing period.</p>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>4. MARKETING AND PROMOTION:</strong> Broker is authorized to place appropriate signage on the Property, 
                advertise the Property in any medium deemed appropriate by Broker, enter the Property into the Multiple Listing Service, 
                and show the Property to prospective buyers at reasonable times.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>5. SELLER REPRESENTATIONS:</strong> Seller represents that Seller has the authority to execute this agreement 
                and warrants that all information provided to Broker regarding the Property is accurate to the best of Seller''s knowledge.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>6. COOPERATION WITH OTHER BROKERS:</strong> Broker may cooperate with other licensed real estate brokers 
                and may share the commission with such cooperating brokers. Seller consents to such cooperation and commission sharing.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>7. DEFAULT:</strong> If Seller breaches this agreement, Seller agrees to pay Broker the commission that 
                would have been due if the Property had been sold at the listing price.
            </p>
        </div>
        
        <div style="margin-bottom: 30px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>8. MISCELLANEOUS:</strong> This agreement shall be binding upon the heirs, successors, and assigns of the parties. 
                Time is of the essence. This agreement shall be construed in accordance with the laws of New York State.
            </p>
        </div>
        
        <div style="margin-top: 40px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 50%; vertical-align: top; padding-right: 20px;">
                        <p style="margin: 0; font-weight: bold;">SELLER:</p>
                        <br><br>
                        <div style="border-bottom: 1px solid black; width: 200px; margin-bottom: 5px;"></div>
                        <p style="margin: 0; font-size: 9pt;">{{seller_name}}</p>
                        <p style="margin: 0; font-size: 9pt;">{{seller_address}}</p>
                        <p style="margin: 0; font-size: 9pt;">{{seller_city_state_zip}}</p>
                        <p style="margin: 0; font-size: 9pt;">Phone: {{seller_phone}}</p>
                        <p style="margin: 0; font-size: 9pt;">Email: {{seller_email}}</p>
                        <br>
                        <p style="margin: 0; font-size: 9pt;">Date: _____________</p>
                    </td>
                    <td style="width: 50%; vertical-align: top;">
                        <p style="margin: 0; font-weight: bold;">{{broker_name}} REAL ESTATE, LLC</p>
                        <p style="margin: 0; font-size: 9pt;">LICENSED REAL ESTATE BROKER</p>
                        <br><br>
                        <div style="border-bottom: 1px solid black; width: 200px; margin-bottom: 5px;"></div>
                        <p style="margin: 0; font-size: 9pt;">{{agent_name}}</p>
                        <p style="margin: 0; font-size: 9pt;">Licensed Associate Real Estate Broker</p>
                        <p style="margin: 0; font-size: 9pt;">License No: {{agent_license}}</p>
                        <p style="margin: 0; font-size: 9pt;">{{broker_address}}</p>
                        <p style="margin: 0; font-size: 9pt;">Phone: {{broker_phone}}</p>
                        <br>
                        <p style="margin: 0; font-size: 9pt;">Date: _____________</p>
                    </td>
                </tr>
            </table>
        </div>
    </div>'
),
(
    'Exclusive Right to Lease Listing Agreement - Lornell',
    'Professional Lornell exclusive right to lease listing agreement',
    'listing_agreement_lease',
    '[
        {"name": "property_address", "label": "Property Address", "type": "text", "required": true},
        {"name": "city", "label": "City", "type": "text", "required": true},
        {"name": "state", "label": "State", "type": "text", "required": true, "default": "NY"},
        {"name": "zip_code", "label": "Zip Code", "type": "text", "required": true},
        {"name": "monthly_rent", "label": "Monthly Rent", "type": "currency", "required": true},
        {"name": "security_deposit", "label": "Security Deposit", "type": "currency", "required": true},
        {"name": "lease_term", "label": "Lease Term (months)", "type": "number", "required": true},
        {"name": "listing_period_start", "label": "Listing Period Start", "type": "date", "required": true},
        {"name": "listing_period_end", "label": "Listing Period End", "type": "date", "required": true},
        {"name": "commission_rate", "label": "Commission Rate (%)", "type": "number", "required": true, "default": 8},
        {"name": "owner_name", "label": "Property Owner Name", "type": "text", "required": true},
        {"name": "owner_address", "label": "Owner Address", "type": "text", "required": true},
        {"name": "owner_city_state_zip", "label": "Owner City, State, Zip", "type": "text", "required": true},
        {"name": "owner_phone", "label": "Owner Phone", "type": "phone", "required": true},
        {"name": "owner_email", "label": "Owner Email", "type": "email", "required": true},
        {"name": "agent_name", "label": "Listing Agent Name", "type": "text", "required": true},
        {"name": "agent_license", "label": "Agent License Number", "type": "text", "required": true},
        {"name": "broker_name", "label": "Broker Name", "type": "text", "required": true, "default": "LORNELL"},
        {"name": "broker_address", "label": "Broker Address", "type": "text", "required": true},
        {"name": "broker_phone", "label": "Broker Phone", "type": "phone", "required": true},
        {"name": "date_signed", "label": "Date Signed", "type": "date", "required": true},
        {"name": "pet_policy", "label": "Pet Policy", "type": "select", "options": ["No Pets", "Cats Only", "Dogs Only", "Cats and Dogs", "Case by Case"], "required": false},
        {"name": "utilities_included", "label": "Utilities Included", "type": "textarea", "required": false}
    ]'::jsonb,
    '<div style="font-family: Times, serif; max-width: 8.5in; margin: 0 auto; padding: 0.5in; line-height: 1.2; font-size: 11pt;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 16pt; font-weight: bold; margin: 0; letter-spacing: 2px;">LORNELL</h1>
        </div>
        
        <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="font-size: 14pt; font-weight: bold; margin: 0; text-decoration: underline;">EXCLUSIVE LEASING AGENCY AGREEMENT</h2>
        </div>
        
        <div style="margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>Property Address:</strong> {{property_address}}, {{city}}, {{state}} {{zip_code}}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {{date_signed}}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>1. EXCLUSIVE RIGHT TO LEASE:</strong> The undersigned Owner(s) hereby grant(s) to {{broker_name}} ("Agent"), 
                the exclusive right to lease the above described real property ("Property") for the period from {{listing_period_start}} 
                to {{listing_period_end}} ("Agency Period") at a monthly rent of ${{monthly_rent}} with a security deposit of 
                ${{security_deposit}} for a lease term of {{lease_term}} months, or such other terms as Owner may accept.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>2. RENTAL TERMS:</strong> The monthly rent is ${{monthly_rent}} with a security deposit of ${{security_deposit}}. 
                Owner agrees that if during the agency period or any extension thereof, a tenant is procured who is ready, willing, 
                and able to lease the Property at the stated rent and terms, or at any other rent and terms acceptable to Owner, 
                Agent will have earned the commission specified herein.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 5px;">
                <strong>3. COMMISSION:</strong> In consideration of Agent''s services, Owner agrees to pay Agent a commission equal to 
                {{commission_rate}}% of the annual rent or one month''s rent, whichever is greater. This commission is earned when:
            </p>
            <div style="margin-left: 20px;">
                <p>(a) A tenant is procured during the agency period who executes a lease acceptable to Owner;</p>
                <p>(b) A lease is executed with any prospective tenant with whom Agent negotiated during the agency period;</p>
                <p>(c) Owner leases to a tenant procured by Agent within 90 days after expiration of this agreement.</p>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>4. PROPERTY CONDITION AND POLICIES:</strong>
            </p>
            <div style="margin-left: 20px;">
                <p><strong>Pet Policy:</strong> {{pet_policy}}</p>
                <p><strong>Utilities Included:</strong> {{utilities_included}}</p>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>5. MARKETING AND SHOWING:</strong> Agent is authorized to place appropriate signage on the Property, 
                advertise the Property in any medium deemed appropriate by Agent, enter the Property into rental listing services, 
                and show the Property to prospective tenants at reasonable times with prior notice to Owner.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>6. OWNER REPRESENTATIONS:</strong> Owner represents that Owner has the authority to execute this agreement 
                and to lease the Property, and warrants that all information provided to Agent regarding the Property is accurate 
                to the best of Owner''s knowledge.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>7. COOPERATION WITH OTHER AGENTS:</strong> Agent may cooperate with other licensed real estate agents 
                and may share the commission with such cooperating agents. Owner consents to such cooperation and commission sharing.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>8. TENANT SCREENING:</strong> Agent will use reasonable efforts to screen prospective tenants, including 
                verification of income, employment, credit history, and references. Final approval of any tenant remains with Owner.
            </p>
        </div>
        
        <div style="margin-bottom: 30px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>9. MISCELLANEOUS:</strong> This agreement shall be binding upon the heirs, successors, and assigns of the parties. 
                Time is of the essence. This agreement shall be construed in accordance with the laws of New York State.
            </p>
        </div>
        
        <div style="margin-top: 40px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 50%; vertical-align: top; padding-right: 20px;">
                        <p style="margin: 0; font-weight: bold;">OWNER:</p>
                        <br><br>
                        <div style="border-bottom: 1px solid black; width: 200px; margin-bottom: 5px;"></div>
                        <p style="margin: 0; font-size: 9pt;">{{owner_name}}</p>
                        <p style="margin: 0; font-size: 9pt;">{{owner_address}}</p>
                        <p style="margin: 0; font-size: 9pt;">{{owner_city_state_zip}}</p>
                        <p style="margin: 0; font-size: 9pt;">Phone: {{owner_phone}}</p>
                        <p style="margin: 0; font-size: 9pt;">Email: {{owner_email}}</p>
                        <br>
                        <p style="margin: 0; font-size: 9pt;">Date: _____________</p>
                    </td>
                    <td style="width: 50%; vertical-align: top;">
                        <p style="margin: 0; font-weight: bold;">{{broker_name}} REAL ESTATE, LLC</p>
                        <p style="margin: 0; font-size: 9pt;">LICENSED REAL ESTATE BROKER</p>
                        <br><br>
                        <div style="border-bottom: 1px solid black; width: 200px; margin-bottom: 5px;"></div>
                        <p style="margin: 0; font-size: 9pt;">{{agent_name}}</p>
                        <p style="margin: 0; font-size: 9pt;">Licensed Associate Real Estate Broker</p>
                        <p style="margin: 0; font-size: 9pt;">License No: {{agent_license}}</p>
                        <p style="margin: 0; font-size: 9pt;">{{broker_address}}</p>
                        <p style="margin: 0; font-size: 9pt;">Phone: {{broker_phone}}</p>
                        <br>
                        <p style="margin: 0; font-size: 9pt;">Date: _____________</p>
                    </td>
                </tr>
            </table>
        </div>
    </div>'
),
(
    'Exclusive Right to Sell and Lease Agreement - Lornell',
    'Professional Lornell combined sell and lease listing agreement',
    'listing_agreement_sale_lease',
    '[
        {"name": "property_address", "label": "Property Address", "type": "text", "required": true},
        {"name": "city", "label": "City", "type": "text", "required": true},
        {"name": "state", "label": "State", "type": "text", "required": true, "default": "NY"},
        {"name": "zip_code", "label": "Zip Code", "type": "text", "required": true},
        {"name": "sale_price", "label": "Sale Price", "type": "currency", "required": true},
        {"name": "monthly_rent", "label": "Monthly Rent", "type": "currency", "required": true},
        {"name": "security_deposit", "label": "Security Deposit", "type": "currency", "required": true},
        {"name": "lease_term", "label": "Lease Term (months)", "type": "number", "required": true},
        {"name": "listing_period_start", "label": "Listing Period Start", "type": "date", "required": true},
        {"name": "listing_period_end", "label": "Listing Period End", "type": "date", "required": true},
        {"name": "sale_commission_rate", "label": "Sale Commission Rate (%)", "type": "number", "required": true, "default": 6},
        {"name": "lease_commission_rate", "label": "Lease Commission Rate (%)", "type": "number", "required": true, "default": 8},
        {"name": "owner_name", "label": "Property Owner Name", "type": "text", "required": true},
        {"name": "owner_address", "label": "Owner Address", "type": "text", "required": true},
        {"name": "owner_city_state_zip", "label": "Owner City, State, Zip", "type": "text", "required": true},
        {"name": "owner_phone", "label": "Owner Phone", "type": "phone", "required": true},
        {"name": "owner_email", "label": "Owner Email", "type": "email", "required": true},
        {"name": "agent_name", "label": "Listing Agent Name", "type": "text", "required": true},
        {"name": "agent_license", "label": "Agent License Number", "type": "text", "required": true},
        {"name": "broker_name", "label": "Broker Name", "type": "text", "required": true, "default": "LORNELL"},
        {"name": "broker_address", "label": "Broker Address", "type": "text", "required": true},
        {"name": "broker_phone", "label": "Broker Phone", "type": "phone", "required": true},
        {"name": "date_signed", "label": "Date Signed", "type": "date", "required": true}
    ]'::jsonb,
    '<div style="font-family: Times, serif; max-width: 8.5in; margin: 0 auto; padding: 0.5in; line-height: 1.2; font-size: 11pt;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 16pt; font-weight: bold; margin: 0; letter-spacing: 2px;">LORNELL</h1>
        </div>
        
        <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="font-size: 14pt; font-weight: bold; margin: 0; text-decoration: underline;">DUAL LISTING</h2>
            <h3 style="font-size: 12pt; font-weight: bold; margin: 5px 0; background-color: yellow; padding: 2px;">SALE/LEASE</h3>
        </div>
        
        <div style="margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>Property Address:</strong> {{property_address}}, {{city}}, {{state}} {{zip_code}}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {{date_signed}}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>1. DUAL AUTHORIZATION:</strong> The undersigned Owner(s) hereby grant(s) to {{broker_name}} ("Broker"), 
                the exclusive right to either SELL or LEASE the above described real property ("Property") for the period from 
                {{listing_period_start}} to {{listing_period_end}} ("Listing Period") at a sale price of ${{sale_price}} OR 
                a monthly rental of ${{monthly_rent}} with security deposit of ${{security_deposit}} for a {{lease_term}} month lease, 
                or such other terms as Owner may accept.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>2. PRICING AND TERMS:</strong>
            </p>
            <div style="margin-left: 20px;">
                <p><strong>SALE:</strong> ${{sale_price}}</p>
                <p><strong>LEASE:</strong> ${{monthly_rent}}/month, ${{security_deposit}} security deposit, {{lease_term}} month term</p>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 5px;">
                <strong>3. COMMISSION STRUCTURE:</strong>
            </p>
            <div style="margin-left: 20px;">
                <p><strong>For SALE:</strong> {{sale_commission_rate}}% of gross sale price</p>
                <p><strong>For LEASE:</strong> {{lease_commission_rate}}% of annual rent or one month''s rent, whichever is greater</p>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>4. COMMISSION EARNED:</strong> The applicable commission is earned when:
            </p>
            <div style="margin-left: 20px;">
                <p>(a) A buyer or tenant is procured who is ready, willing and able to purchase or lease at the listed terms;</p>
                <p>(b) A sale or lease is consummated at any terms acceptable to Owner during the listing period;</p>
                <p>(c) A transaction is completed within 90 days after expiration with anyone Broker negotiated with during the listing period.</p>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>5. MARKETING AUTHORIZATION:</strong> Broker is authorized to market the Property for both sale and lease 
                simultaneously, place appropriate signage, advertise in any medium, enter into MLS and rental services, and show 
                to prospects at reasonable times.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>6. OWNER ELECTION:</strong> Owner may elect to pursue either sale or lease opportunities as they arise. 
                Once a binding contract is executed (sale or lease), this agreement terminates as to the other option.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>7. COOPERATION:</strong> Broker may cooperate with other licensed brokers and share commissions. 
                Owner consents to such cooperation and commission sharing arrangements.
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>8. OWNER REPRESENTATIONS:</strong> Owner warrants authority to execute this agreement and accuracy 
                of all information provided regarding the Property.
            </p>
        </div>
        
        <div style="margin-bottom: 30px;">
            <p style="text-align: justify; margin-bottom: 10px;">
                <strong>9. BINDING AGREEMENT:</strong> This agreement shall be binding upon heirs, successors, and assigns. 
                Time is of the essence. Governed by New York State law.
            </p>
        </div>
        
        <div style="margin-top: 40px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 50%; vertical-align: top; padding-right: 20px;">
                        <p style="margin: 0; font-weight: bold;">PROPERTY OWNER:</p>
                        <br><br>
                        <div style="border-bottom: 1px solid black; width: 200px; margin-bottom: 5px;"></div>
                        <p style="margin: 0; font-size: 9pt;">{{owner_name}}</p>
                        <p style="margin: 0; font-size: 9pt;">{{owner_address}}</p>
                        <p style="margin: 0; font-size: 9pt;">{{owner_city_state_zip}}</p>
                        <p style="margin: 0; font-size: 9pt;">Phone: {{owner_phone}}</p>
                        <p style="margin: 0; font-size: 9pt;">Email: {{owner_email}}</p>
                        <br>
                        <p style="margin: 0; font-size: 9pt;">Date: _____________</p>
                    </td>
                    <td style="width: 50%; vertical-align: top;">
                        <p style="margin: 0; font-weight: bold;">{{broker_name}} REAL ESTATE, LLC</p>
                        <p style="margin: 0; font-size: 9pt;">LICENSED REAL ESTATE BROKER</p>
                        <br><br>
                        <div style="border-bottom: 1px solid black; width: 200px; margin-bottom: 5px;"></div>
                        <p style="margin: 0; font-size: 9pt;">{{agent_name}}</p>
                        <p style="margin: 0; font-size: 9pt;">Licensed Associate Real Estate Broker</p>
                        <p style="margin: 0; font-size: 9pt;">License No: {{agent_license}}</p>
                        <p style="margin: 0; font-size: 9pt;">{{broker_address}}</p>
                        <p style="margin: 0; font-size: 9pt;">Phone: {{broker_phone}}</p>
                        <br>
                        <p style="margin: 0; font-size: 9pt;">Date: _____________</p>
                    </td>
                </tr>
            </table>
        </div>
    </div>'
);