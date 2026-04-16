-- Add verified_skills column to profiles table
ALTER TABLE profiles
ADD COLUMN verified_skills JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.verified_skills IS 'Stores verified skills with their levels and scores. Format: {"skill_name": {"level": "Expert|Advanced|Proficient", "score": number, "completedOn": "ISO date"}}';

-- Create index for faster queries on verified skills
CREATE INDEX idx_profiles_verified_skills ON profiles USING gin (verified_skills); 