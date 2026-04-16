import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Message, MessageType } from '@/integrations/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useMessages(senderId: string, receiverId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!senderId || !receiverId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [senderId, receiverId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!senderId || !receiverId) return;

    fetchMessages();

    // Create a unique channel name for this chat
    const channelName = `chat_${[senderId, receiverId].sort().join('_')}`;
    
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId}))`,
        },
        (payload: { new: Message }) => {
          const newMessage = payload.new;
          setMessages(currentMessages => {
            // Check if message already exists
            if (currentMessages.some(msg => msg.id === newMessage.id)) {
              return currentMessages;
            }
            return [...currentMessages, newMessage];
          });
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      channel.unsubscribe();
    };
  }, [senderId, receiverId, fetchMessages]);  const sendMessage = async (
    content: string,
    messageType: MessageType = 'text',
    fileUrl?: string,
    fileName?: string
  ): Promise<void> => {
    // Input validation
    if (!senderId || !receiverId) {
      console.error('Missing sender or receiver ID:', { senderId, receiverId });
      throw new Error('Cannot send message: Missing user IDs');
    }

    try {
      const timestamp = new Date().toISOString();
      let messageContent = content.trim();
      
      if (messageType === 'text' && !messageContent) {
        throw new Error('Cannot send empty message');
      }
      
      if ((messageType === 'file' || messageType === 'image' || messageType === 'audio') && !fileUrl) {
        throw new Error(`Cannot send ${messageType} message without file URL`);
      }
      
      // For file-based messages, use a default content if none provided
      if (messageType !== 'text' && !messageContent) {
        messageContent = `Sent ${messageType === 'audio' ? 'a voice message' : 
                         messageType === 'image' ? 'an image' : 'a file'}`;
      }
      
      const messageData = {
        sender_id: senderId,
        receiver_id: receiverId,
        content: messageContent,
        message_type: messageType,
        created_at: timestamp,
        timestamp: timestamp,
        file_url: fileUrl || null,
        file_name: fileName || null
      };
      
      console.log('Sending message data:', messageData);

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);

      // Add the message to local state
      if (data?.[0]) {
        setMessages(current => [...current, data[0]]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    refreshMessages: fetchMessages
  };
}