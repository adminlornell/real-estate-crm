-- Migration: Add task comments functionality
-- Add comments field to tasks table and create task_comments table for multiple comments

-- Add comments field to existing tasks table
ALTER TABLE tasks ADD COLUMN comments TEXT;

-- Create task_comments table for multiple comments per task
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    agent_id UUID REFERENCES agents(id) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at); 