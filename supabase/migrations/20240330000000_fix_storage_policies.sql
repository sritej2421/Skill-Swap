-- Update storage policies for voice messages

-- First, ensure chat-files bucket exists and has correct public settings
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('chat-files', 'chat-files', true)
    ON CONFLICT (id) DO UPDATE
    SET public = true;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to voice messages" ON storage.objects;

-- Create upload policy for voice messages
CREATE POLICY "Allow authenticated users to upload audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-files' 
    AND (name LIKE 'voice-messages/%')
    AND (storage.foldername(name))[1] = 'voice-messages'
    AND LOWER(storage.extension(name)) = 'webm'
    AND octet_length(file) <= 10485760  -- Max 10MB
);

-- Create read policy for voice messages
CREATE POLICY "Allow public read access to voice messages"
ON storage.objects FOR SELECT
TO public
USING (
    bucket_id = 'chat-files'
    AND (name LIKE 'voice-messages/%')
    AND (storage.foldername(name))[1] = 'voice-messages'
);

-- Create policy for deleting own voice messages
CREATE POLICY "Allow users to delete their own voice messages"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-files'
    AND (name LIKE 'voice-messages/%')
    AND auth.uid() = owner
);
