export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  skills_teach: string[];
  skills_learn: string[];
  skill_level: string;
  rating: number;
  sessions_completed: number;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  pinned: boolean;
  owner_id: string;
  shared_with_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  owner_id: string;
  shared_with_id: string;
  created_at: string;
  completed_at: string | null;
}

export interface Session {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  owner_id: string;
  participant_id: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface AvailabilitySlot {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
}
