-- BlackPill Grooming Database Setup
-- Run these commands in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles (for chat)
CREATE POLICY "Anyone can view profiles" ON profiles
    FOR SELECT USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Table 2: users_access (controls vault access)
CREATE TABLE IF NOT EXISTS users_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    paid_access BOOLEAN DEFAULT FALSE,
    vault_pin_verified BOOLEAN DEFAULT FALSE,
    purchase_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for users_access
ALTER TABLE users_access ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own access status
CREATE POLICY "Users can view own access" ON users_access
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own access (for PIN verification)
CREATE POLICY "Users can update own access" ON users_access
    FOR UPDATE USING (auth.uid() = user_id);

-- Table 3: payments (tracks payment submissions)
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT,
    transaction_ref TEXT NOT NULL,
    amount DECIMAL(10, 2) DEFAULT 20.00,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own payments
CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Table 4: messages (for contact form)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert messages (for contact form)
CREATE POLICY "Anyone can insert messages" ON messages
    FOR INSERT WITH CHECK (true);

-- Policy: Only authenticated users can view messages (for admin)
CREATE POLICY "Users can view messages" ON messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Table 5: chat_messages (community chat)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view all messages
CREATE POLICY "Anyone can view chat" ON chat_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Users can insert their own messages
CREATE POLICY "Users can insert messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Function to handle new user registration (auto-create profile and access record)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email
    );
    
    INSERT INTO public.users_access (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to manually grant access (run this after payment verification)
-- Usage: SELECT grant_vault_access('user-uuid-here');
CREATE OR REPLACE FUNCTION grant_vault_access(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users_access 
    SET paid_access = TRUE, 
        purchase_date = NOW()
    WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample queries for admin:

-- Get all pending payments
-- SELECT * FROM payments WHERE status = 'pending';

-- Approve payment and grant access
-- UPDATE payments SET status = 'approved' WHERE id = 'payment-uuid';
-- UPDATE users_access SET paid_access = TRUE, purchase_date = NOW() WHERE user_id = 'user-uuid';

-- Get user access status
-- SELECT u.email, ua.paid_access, ua.purchase_date 
-- FROM users_access ua 
-- JOIN profiles p ON p.id = ua.user_id 
-- JOIN auth.users u ON u.id = ua.user_id;

-- Get recent chat messages
-- SELECT cm.*, p.full_name, p.avatar_url 
-- FROM chat_messages cm 
-- JOIN profiles p ON p.id = cm.user_id 
-- ORDER BY cm.created_at DESC LIMIT 50;
