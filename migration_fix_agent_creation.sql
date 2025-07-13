-- Migration: Fix Agent Creation Issue
-- Run this in your Supabase SQL Editor

-- Add missing RLS policies for agents table
CREATE POLICY IF NOT EXISTS "Agents can create their own profile" ON agents
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Agents can update their own profile" ON agents
    FOR UPDATE USING (user_id = auth.uid());

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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create agent profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- If you have an existing user without an agent record, create one manually:
-- (Replace 'your-user-id' and 'Your Name' with actual values)
-- INSERT INTO agents (user_id, agent_name, email, status, hire_date)
-- SELECT id, 'Your Name', email, 'active', CURRENT_DATE
-- FROM auth.users 
-- WHERE id = 'your-user-id'
-- AND NOT EXISTS (SELECT 1 FROM agents WHERE user_id = auth.users.id); 

-- Migration: Fix Property Creation RLS Policy
-- The issue is that created_by stores agent.id but RLS checks auth.uid()
-- We need to update the policy to check if the user owns the agent record

-- Drop the existing incorrect policy
DROP POLICY IF EXISTS "Agents can create properties" ON properties;

-- Create the correct policy that checks if the user owns the agent record
CREATE POLICY "Agents can create properties" ON properties
    FOR INSERT WITH CHECK (
        created_by IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Also fix the update policy to be consistent
DROP POLICY IF EXISTS "Agents can update their assigned properties" ON properties;

CREATE POLICY "Agents can update their assigned properties" ON properties
    FOR UPDATE USING (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Fix the delete policy to be consistent
DROP POLICY IF EXISTS "Agents can delete their assigned properties" ON properties;

CREATE POLICY "Agents can delete their assigned properties" ON properties
    FOR DELETE USING (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Also fix the existing select policy to be consistent
DROP POLICY IF EXISTS "Agents can view their assigned properties" ON properties;

CREATE POLICY "Agents can view their assigned properties" ON properties
    FOR SELECT USING (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Fix similar issues in other tables
-- Clients table
DROP POLICY IF EXISTS "Agents can create clients" ON clients;
CREATE POLICY "Agents can create clients" ON clients
    FOR INSERT WITH CHECK (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can update their assigned clients" ON clients;
CREATE POLICY "Agents can update their assigned clients" ON clients
    FOR UPDATE USING (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can delete their assigned clients" ON clients;
CREATE POLICY "Agents can delete their assigned clients" ON clients
    FOR DELETE USING (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can view their assigned clients" ON clients;
CREATE POLICY "Agents can view their assigned clients" ON clients
    FOR SELECT USING (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Inquiries table
DROP POLICY IF EXISTS "Agents can create inquiries" ON inquiries;
CREATE POLICY "Agents can create inquiries" ON inquiries
    FOR INSERT WITH CHECK (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can update their assigned inquiries" ON inquiries;
CREATE POLICY "Agents can update their assigned inquiries" ON inquiries
    FOR UPDATE USING (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can delete their assigned inquiries" ON inquiries;
CREATE POLICY "Agents can delete their assigned inquiries" ON inquiries
    FOR DELETE USING (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can view their assigned inquiries" ON inquiries;
CREATE POLICY "Agents can view their assigned inquiries" ON inquiries
    FOR SELECT USING (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Showings table
DROP POLICY IF EXISTS "Agents can create showings" ON showings;
CREATE POLICY "Agents can create showings" ON showings
    FOR INSERT WITH CHECK (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can update their showings" ON showings;
CREATE POLICY "Agents can update their showings" ON showings
    FOR UPDATE USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can delete their showings" ON showings;
CREATE POLICY "Agents can delete their showings" ON showings
    FOR DELETE USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can view their showings" ON showings;
CREATE POLICY "Agents can view their showings" ON showings
    FOR SELECT USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Tasks table
DROP POLICY IF EXISTS "Agents can create tasks" ON tasks;
CREATE POLICY "Agents can create tasks" ON tasks
    FOR INSERT WITH CHECK (
        created_by IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can update their assigned tasks" ON tasks;
CREATE POLICY "Agents can update their assigned tasks" ON tasks
    FOR UPDATE USING (
        assigned_to IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can delete their created tasks" ON tasks;
CREATE POLICY "Agents can delete their created tasks" ON tasks
    FOR DELETE USING (
        created_by IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can view their assigned tasks" ON tasks;
CREATE POLICY "Agents can view their assigned tasks" ON tasks
    FOR SELECT USING (
        assigned_to IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Communications table
DROP POLICY IF EXISTS "Agents can create communications" ON communications;
CREATE POLICY "Agents can create communications" ON communications
    FOR INSERT WITH CHECK (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can update their communications" ON communications;
CREATE POLICY "Agents can update their communications" ON communications
    FOR UPDATE USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can delete their communications" ON communications;
CREATE POLICY "Agents can delete their communications" ON communications
    FOR DELETE USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can view their communications" ON communications;
CREATE POLICY "Agents can view their communications" ON communications
    FOR SELECT USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Documents table
DROP POLICY IF EXISTS "Agents can create documents" ON documents;
CREATE POLICY "Agents can create documents" ON documents
    FOR INSERT WITH CHECK (
        created_by IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can update their documents" ON documents;
CREATE POLICY "Agents can update their documents" ON documents
    FOR UPDATE USING (
        created_by IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can delete their documents" ON documents;
CREATE POLICY "Agents can delete their documents" ON documents
    FOR DELETE USING (
        created_by IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Agents can view their documents" ON documents;
CREATE POLICY "Agents can view their documents" ON documents
    FOR SELECT USING (
        created_by IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    ); 