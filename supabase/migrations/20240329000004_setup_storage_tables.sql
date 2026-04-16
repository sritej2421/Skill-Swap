-- Set the correct role
SET ROLE postgres;

-- Create policies for the storage API
-- Note: The storage tables are automatically created by Supabase

-- Enable RLS on buckets table
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Enable RLS on objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public access to the chat-files bucket
CREATE POLICY "Public Access to chat-files bucket"
ON storage.buckets FOR SELECT TO public
USING (name = 'chat-files');

-- Create a policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'chat-files' 
    AND (LOWER(name) LIKE 'voice-messages/%' OR LOWER(name) LIKE 'chat-files/%')
);

-- Create a policy to allow public to read files
CREATE POLICY "Allow public to read files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-files');

-- Create a policy to allow users to update their own files
CREATE POLICY "Allow users to update own files"
ON storage.objects FOR UPDATE TO authenticated
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

-- Create a policy to allow users to delete their own files
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (auth.uid() = owner);

-- Reset role
RESET ROLE;
