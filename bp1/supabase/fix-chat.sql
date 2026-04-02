-- Fix Chat Table (Run this)
-- This will create the table and set up permissions

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone logged in to view all messages
DROP POLICY IF EXISTS "Anyone can view chat" ON chat_messages;
CREATE POLICY "Anyone can view chat" ON chat_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow anyone logged in to insert messages
DROP POLICY IF EXISTS "Users can insert messages" ON chat_messages;
CREATE POLICY "Users can insert messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Done! The table is now ready
