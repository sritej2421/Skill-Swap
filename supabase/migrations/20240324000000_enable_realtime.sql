-- Enable real-time for the messages and other tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE shared_resources;
ALTER PUBLICATION supabase_realtime ADD TABLE shared_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE teaching_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE availability_slots;

-- Set up real-time replication
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE shared_resources REPLICA IDENTITY FULL;
ALTER TABLE shared_tasks REPLICA IDENTITY FULL;
ALTER TABLE teaching_sessions REPLICA IDENTITY FULL;
ALTER TABLE availability_slots REPLICA IDENTITY FULL;
