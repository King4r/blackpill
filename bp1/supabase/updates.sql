-- BlackPill Grooming Database Updates
-- Run these commands in your Supabase SQL Editor

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate policies for profiles
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop and recreate chat policies
DROP POLICY IF EXISTS "Anyone can view chat" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON chat_messages;

CREATE POLICY "Anyone can view chat" ON chat_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Make sure RLS is enabled on chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
