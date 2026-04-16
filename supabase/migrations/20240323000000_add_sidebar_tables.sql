-- Create shared_resources table
CREATE TABLE IF NOT EXISTS shared_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_connection_id UUID NOT NULL REFERENCES chat_connections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create shared_tasks table
CREATE TABLE IF NOT EXISTS shared_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_connection_id UUID NOT NULL REFERENCES chat_connections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create teaching_sessions table
CREATE TABLE IF NOT EXISTS teaching_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_connection_id UUID NOT NULL REFERENCES chat_connections(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    title TEXT NOT NULL,
    description TEXT,
    meeting_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create availability_slots table
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_shared_resources_chat ON shared_resources(chat_connection_id);
CREATE INDEX IF NOT EXISTS idx_shared_tasks_chat ON shared_tasks(chat_connection_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_chat ON teaching_sessions(chat_connection_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_scheduled ON teaching_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_availability_slots_profile ON availability_slots(profile_id);

-- Enable RLS
ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Shared resources policies
CREATE POLICY "Users can view shared resources in their chats"
    ON shared_resources FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM chat_connections
        WHERE id = shared_resources.chat_connection_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    ));

CREATE POLICY "Users can create shared resources in their chats"
    ON shared_resources FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM chat_connections
            WHERE id = chat_connection_id
            AND (user1_id = auth.uid() OR user2_id = auth.uid())
        )
    );

-- Shared tasks policies
CREATE POLICY "Users can view shared tasks in their chats"
    ON shared_tasks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM chat_connections
        WHERE id = shared_tasks.chat_connection_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    ));

CREATE POLICY "Users can create and update shared tasks in their chats"
    ON shared_tasks FOR ALL
    USING (EXISTS (
        SELECT 1 FROM chat_connections
        WHERE id = chat_connection_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM chat_connections
        WHERE id = chat_connection_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    ));

-- Teaching sessions policies
CREATE POLICY "Users can view teaching sessions in their chats"
    ON teaching_sessions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM chat_connections
        WHERE id = teaching_sessions.chat_connection_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    ));

CREATE POLICY "Users can create and update teaching sessions in their chats"
    ON teaching_sessions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM chat_connections
        WHERE id = chat_connection_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM chat_connections
        WHERE id = chat_connection_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    ));

-- Availability slots policies
CREATE POLICY "Users can view any profile's availability"
    ON availability_slots FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own availability"
    ON availability_slots FOR ALL
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());
