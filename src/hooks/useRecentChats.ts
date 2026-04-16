import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface ChatConnection {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string | null;
  updated_at: string;
  user1: UserProfile;
  user2: UserProfile;
}

interface Chat {
  id: string;
  participants: string[];
  last_message: string | null;
  updated_at: string;
  user_details?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export function useRecentChats() {
  const { user } = useAuth();
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchRecentChats = async () => {
      if (!user?.id) {
        setLoading(false);
        setRecentChats([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('chat_connections')
          .select(`
            id,
            user1_id,
            user2_id,
            last_message,
            updated_at,
            user1:profiles!chat_connections_user1_id_fkey(id, full_name, avatar_url),
            user2:profiles!chat_connections_user2_id_fkey(id, full_name, avatar_url)
          `)
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('updated_at', { ascending: false })
          .limit(3);

        if (error) throw error;

        // Ensure data is not null and type cast
        const chats = data || [];

        // Transform data to match expected format, handling potential null values
        const formattedChats = chats
          .filter(chat => {
            // Only include chats where we can determine the other user
            const isUser1 = chat.user1_id === user.id;
            const otherUser = isUser1 ? chat.user2 : chat.user1;
            return otherUser && Array.isArray(otherUser) && otherUser.length > 0;
          })
          .map(chat => {
            const isUser1 = chat.user1_id === user.id;
            const otherUserArray = isUser1 ? chat.user2 : chat.user1;
            const otherUser = Array.isArray(otherUserArray) && otherUserArray.length > 0
              ? otherUserArray[0]
              : null;
            const otherUserId = isUser1 ? chat.user2_id : chat.user1_id;

            // Provide fallback values if user profile is missing
            const userDetails = otherUser ? {
              id: otherUser.id || otherUserId,
              full_name: otherUser.full_name || 'Unknown User',
              avatar_url: otherUser.avatar_url
            } : {
              id: otherUserId,
              full_name: 'Unknown User',
              avatar_url: null
            };

            return {
              id: chat.id,
              participants: [chat.user1_id, chat.user2_id],
              last_message: chat.last_message || '',
              updated_at: chat.updated_at,
              user_details: userDetails
            };
          });

        if (isSubscribed) {
          setRecentChats(formattedChats);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch recent chats', err);
        if (isSubscribed) {
          setError(err instanceof Error ? err : new Error('Failed to fetch recent chats'));
          setRecentChats([]); // Reset to empty array on error
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    const setupSubscription = () => {
      if (!user?.id) return null;

      return supabase
        .channel('recent-chats')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'chat_connections',
          filter: `user1_id=eq.${user.id}`,
        }, fetchRecentChats)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'chat_connections',
          filter: `user2_id=eq.${user.id}`,
        }, fetchRecentChats)
        .subscribe();
    };

    // Initial fetch
    fetchRecentChats();

    // Setup subscription
    channel = setupSubscription();

    return () => {
      isSubscribed = false;
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user?.id]); // Only re-run if user ID changes

  return { recentChats, loading, error };
}
