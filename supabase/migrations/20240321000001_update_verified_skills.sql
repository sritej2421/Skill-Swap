-- Update verified_skills column to JSONB type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'verified_skills'
    ) THEN
        ALTER TABLE profiles
        ADD COLUMN verified_skills JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Add comment to explain the column structure
COMMENT ON COLUMN profiles.verified_skills IS 'Stores verified skills with their levels and scores. Format: {
    "skill_name": {
        "level": "Expert|Advanced|Proficient",
        "score": number,
        "completedOn": "ISO date string"
    }
}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_verified_skills ON profiles USING gin (verified_skills);

-- Add constraint to ensure valid data structure
ALTER TABLE profiles
ADD CONSTRAINT verified_skills_structure CHECK (
    jsonb_typeof(verified_skills) = 'object' AND
    NOT EXISTS (
        SELECT 1
        FROM jsonb_each(verified_skills) AS skills(key, value)
        WHERE NOT (
            jsonb_typeof(value) = 'object' AND
            value ? 'level' AND
            value ? 'score' AND
            value ? 'completedOn' AND
            value->>'level' IN ('Expert', 'Advanced', 'Proficient') AND
            (value->>'score')::numeric BETWEEN 0 AND 100
        )
    )
); 