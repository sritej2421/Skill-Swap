-- Add completed_tests column to profiles table
ALTER TABLE profiles
ADD COLUMN completed_tests JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.completed_tests IS 'Stores all completed tests with their scores and completion dates. Format: {"test_title": {"score": number, "completedOn": "ISO date string"}}';

-- Create index for better query performance
CREATE INDEX idx_profiles_completed_tests ON profiles USING gin (completed_tests); 