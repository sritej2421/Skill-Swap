import { PostgrestError } from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          location: string | null
          role: string | null
          skills_teach: string[] | null
          skills_learn: string[] | null
          bio: string | null
          language: string | null
          portfolio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          location?: string | null
          role?: string | null
          skills_teach?: string[] | null
          skills_learn?: string[] | null
          bio?: string | null
          language?: string | null
          portfolio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          location?: string | null
          role?: string | null
          skills_teach?: string[] | null
          skills_learn?: string[] | null
          bio?: string | null
          language?: string | null
          portfolio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      calls: {
        Row: {
          id: string
          caller_id: string
          receiver_id: string
          link: string
          caller_accepted: boolean | null
          receiver_accepted: boolean | null
          status: 'pending' | 'accepted' | 'rejected' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          caller_id: string
          receiver_id: string
          link: string
          caller_accepted?: boolean | null
          receiver_accepted?: boolean | null
          status?: 'pending' | 'accepted' | 'rejected' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          caller_id?: string
          receiver_id?: string
          link?: string
          caller_accepted?: boolean | null
          receiver_accepted?: boolean | null
          status?: 'pending' | 'accepted' | 'rejected' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      chat_connections: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          timestamp: string
          created_at: string
          message_type: MessageType
          file_url?: string
          file_name?: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          timestamp?: string
          created_at?: string
          message_type?: MessageType
          file_url?: string
          file_name?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          timestamp?: string
          created_at?: string
          message_type?: MessageType
          file_url?: string
          file_name?: string
        }
      }
      shared_resources: {
        Row: {
          id: string
          chat_connection_id: string
          title: string
          url: string
          description: string | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          chat_connection_id: string
          title: string
          url: string
          description?: string | null
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          chat_connection_id?: string
          title?: string
          url?: string
          description?: string | null
          created_at?: string
          created_by?: string
        }
      }
      shared_tasks: {
        Row: {
          id: string
          chat_connection_id: string
          title: string
          description: string | null
          due_date: string | null
          completed: boolean
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          chat_connection_id: string
          title: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          chat_connection_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          created_at?: string
          created_by?: string
        }
      }
      teaching_sessions: {
        Row: {
          id: string
          chat_connection_id: string
          scheduled_at: string
          duration: number
          title: string
          description: string | null
          meeting_link: string | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          chat_connection_id: string
          scheduled_at: string
          duration: number
          title: string
          description?: string | null
          meeting_link?: string | null
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          chat_connection_id?: string
          scheduled_at?: string
          duration?: number
          title?: string
          description?: string | null
          meeting_link?: string | null
          created_at?: string
          created_by?: string
        }
      }
      availability_slots: {
        Row: {
          id: string
          profile_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never
export type DbResultErr = PostgrestError

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Call = Database['public']['Tables']['calls']['Row']
export type ChatConnection = Database['public']['Tables']['chat_connections']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type SharedResource = Database['public']['Tables']['shared_resources']['Row']
export type SharedTask = Database['public']['Tables']['shared_tasks']['Row']
export type TeachingSession = Database['public']['Tables']['teaching_sessions']['Row']
export type AvailabilitySlot = Database['public']['Tables']['availability_slots']['Row']

export type MessageType = 'text' | 'file' | 'image' | 'emoji' | 'audio';

export interface MessageDetails {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: MessageType;
  created_at: string;
  timestamp: string;
  file_url?: string | null;
  file_name?: string | null;
}
