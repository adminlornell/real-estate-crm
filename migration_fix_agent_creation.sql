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