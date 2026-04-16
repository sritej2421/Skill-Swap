-- Add missing columns and proper constraints to messages table
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Update message_type constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_message_type_check 
  CHECK (message_type IN ('text', 'file', 'image', 'emoji', 'audio'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

-- Update RLS policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow users to insert messages
CREATE POLICY "Users can insert messages"
ON messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
);

-- Allow users to view messages they're part of
CREATE POLICY "Users can view their messages"
ON messages FOR SELECT TO authenticated
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);
