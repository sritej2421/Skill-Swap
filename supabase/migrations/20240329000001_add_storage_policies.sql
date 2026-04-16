-- Enable Storage policies for voice messages
-- Allow users to upload audio files
CREATE POLICY "Allow authenticated users to upload audio files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-files' AND 
  (LOWER(name) LIKE 'voice-messages/%')
);

-- Allow everyone to read audio files
CREATE POLICY "Allow public read access to audio files"
ON storage.objects FOR SELECT TO public
USING (
  bucket_id = 'chat-files' AND 
  (LOWER(name) LIKE 'voice-messages/%')
);

-- Ensure users can only delete their own uploads
CREATE POLICY "Users can delete own audio files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-files' AND 
  (auth.uid() = owner) AND
  (LOWER(name) LIKE 'voice-messages/%')
);
