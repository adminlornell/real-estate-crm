-- Migration: Add Property RLS Policies
-- Run this in your Supabase SQL Editor

-- Add RLS policies for properties table
CREATE POLICY IF NOT EXISTS "Agents can create properties" ON properties
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can update their assigned properties" ON properties
    FOR UPDATE USING (assigned_agent_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can delete their assigned properties" ON properties
    FOR DELETE USING (assigned_agent_id = auth.uid());

-- Add RLS policies for clients table
CREATE POLICY IF NOT EXISTS "Agents can create clients" ON clients
    FOR INSERT WITH CHECK (assigned_agent_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can update their assigned clients" ON clients
    FOR UPDATE USING (assigned_agent_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can delete their assigned clients" ON clients
    FOR DELETE USING (assigned_agent_id = auth.uid());

-- Add RLS policies for inquiries table
CREATE POLICY IF NOT EXISTS "Agents can create inquiries" ON inquiries
    FOR INSERT WITH CHECK (assigned_agent_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can update their assigned inquiries" ON inquiries
    FOR UPDATE USING (assigned_agent_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can delete their assigned inquiries" ON inquiries
    FOR DELETE USING (assigned_agent_id = auth.uid());

-- Add RLS policies for showings table
CREATE POLICY IF NOT EXISTS "Agents can create showings" ON showings
    FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can update their showings" ON showings
    FOR UPDATE USING (agent_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can delete their showings" ON showings
    FOR DELETE USING (agent_id = auth.uid());

-- Add RLS policies for tasks table
CREATE POLICY IF NOT EXISTS "Agents can create tasks" ON tasks
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can update their assigned tasks" ON tasks
    FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can delete their created tasks" ON tasks
    FOR DELETE USING (created_by = auth.uid());

-- Add RLS policies for communications table
CREATE POLICY IF NOT EXISTS "Agents can create communications" ON communications
    FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can update their communications" ON communications
    FOR UPDATE USING (agent_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can delete their communications" ON communications
    FOR DELETE USING (agent_id = auth.uid());

-- Add RLS policy for viewing communications
CREATE POLICY IF NOT EXISTS "Agents can view their communications" ON communications
    FOR SELECT USING (agent_id = auth.uid());

-- Add RLS policies for documents table
CREATE POLICY IF NOT EXISTS "Agents can create documents" ON documents
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can update their documents" ON documents
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can delete their documents" ON documents
    FOR DELETE USING (created_by = auth.uid());

-- Add RLS policy for viewing documents
CREATE POLICY IF NOT EXISTS "Agents can view their documents" ON documents
    FOR SELECT USING (created_by = auth.uid()); 