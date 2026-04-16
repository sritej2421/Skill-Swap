-- Add message_type column if it doesn't exist
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text';

-- Add constraint for message types
ALTER TABLE public.messages
ADD CONSTRAINT messages_message_type_check
CHECK (message_type IN ('text', 'file', 'image', 'emoji'));

-- Add file related columns if they don't exist
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS file_name text;
