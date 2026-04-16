-- Drop and recreate the message_type constraint to ensure it's properly set
ALTER TABLE messages DROP CONSTRAINT IF EXISTS valid_message_type;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;

-- Add the constraint with all valid message types
ALTER TABLE messages ADD CONSTRAINT valid_message_type 
  CHECK (message_type::text = ANY (ARRAY['text'::text, 'file'::text, 'image'::text, 'emoji'::text, 'audio'::text]));
