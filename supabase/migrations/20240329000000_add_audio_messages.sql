-- Add 'audio' to valid message types
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_message_type_check 
  CHECK (message_type IN ('text', 'file', 'image', 'emoji', 'audio'));

-- Create voice-messages storage bucket if it doesn't exist
-- Note: This needs to be done manually in Supabase dashboarad or via API
-- as SQL migrations don't handle storage buckets
