-- IMMEDIATE FIX for Property Creation Issue
-- Run this in your Supabase SQL Editor

-- First, let's check if the issue is with RLS policies
-- Drop and recreate the property creation policy with proper agent lookup

DROP POLICY IF EXISTS "Agents can create properties" ON properties;

CREATE POLICY "Agents can create properties" ON properties
    FOR INSERT WITH CHECK (
        created_by IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Also fix the select policy to be consistent
DROP POLICY IF EXISTS "Agents can view their assigned properties" ON properties;

CREATE POLICY "Agents can view their assigned properties" ON properties
    FOR SELECT USING (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Fix update policy
DROP POLICY IF EXISTS "Agents can update their assigned properties" ON properties;

CREATE POLICY "Agents can update their assigned properties" ON properties
    FOR UPDATE USING (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Fix delete policy
DROP POLICY IF EXISTS "Agents can delete their assigned properties" ON properties;

CREATE POLICY "Agents can delete their assigned properties" ON properties
    FOR DELETE USING (
        assigned_agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- DEBUGGING: Check if there are any agents without proper user_id links
SELECT 
    a.id as agent_id,
    a.user_id,
    a.agent_name,
    a.email,
    u.id as auth_user_id,
    u.email as auth_email
FROM agents a
LEFT JOIN auth.users u ON a.user_id = u.id
WHERE a.user_id IS NULL OR u.id IS NULL;

-- DEBUGGING: Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'properties';

-- If you see any agents without proper user_id links, you may need to fix them
-- Example fix (replace with actual IDs):
-- UPDATE agents SET user_id = 'actual-auth-user-id' WHERE id = 'agent-id-without-user-id'; 