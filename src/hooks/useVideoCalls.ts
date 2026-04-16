import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CallData {
  id: string;
  caller_id: string;
  receiver_id: string;
  link: string;
  caller_accepted: boolean | null;
  receiver_accepted: boolean | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CallerProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export function useVideoCalls() {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<CallData | null>(null);
  const [callerProfile, setCallerProfile] = useState<CallerProfile | null>(null);
  const [isIncomingCallOpen, setIsIncomingCallOpen] = useState(false);
  const [isOutgoingCallOpen, setIsOutgoingCallOpen] = useState(false);

  // Fetch caller profile
  const fetchCallerProfile = useCallback(async (callerId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', callerId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching caller profile:', error);
      return null;
    }
  }, []);

  // Initiate a video call
  const initiateCall = useCallback(async (receiverId: string) => {
    if (!user) {
      toast.error('You must be logged in to make calls');
      return;
    }

    try {
      const timestamp = Date.now();
      const link = `https://meet.jit.si/skillswap-${user.id}-${receiverId}-${timestamp}`;

      const { data, error } = await supabase
        .from('calls')
        .insert({
          caller_id: user.id,
          receiver_id: receiverId,
          link: link,
          caller_accepted: true,
          receiver_accepted: false,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setOutgoingCall(data);
      setIsOutgoingCallOpen(true);

      toast.success('Call initiated', {
        description: 'Waiting for the other person to answer...'
      });

    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Failed to initiate call');
    }
  }, [user]);

  // Set up real-time subscriptions for calls
  useEffect(() => {
    if (!user) return;

    // Subscribe to incoming calls (where current user is receiver)
    const incomingChannel = supabase
      .channel('incoming_calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload: { new: CallData }) => {
          const newCall = payload.new;
          if (newCall.status === 'pending') {
            setIncomingCall(newCall);
            
            // Fetch caller profile
            const profile = await fetchCallerProfile(newCall.caller_id);
            setCallerProfile(profile);
            
            setIsIncomingCallOpen(true);
            
            // Play notification sound (optional)
            // You can add audio notification here
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload: { new: CallData }) => {
          const updatedCall = payload.new;
          
          // Update incoming call if it exists
          if (incomingCall && incomingCall.id === updatedCall.id) {
            setIncomingCall(updatedCall);
            
            if (updatedCall.status === 'accepted') {
              // Call was accepted, redirect to video call
              window.open(updatedCall.link, '_blank', 'noopener');
              setIsIncomingCallOpen(false);
              setIncomingCall(null);
            } else if (updatedCall.status === 'rejected') {
              // Call was rejected
              setIsIncomingCallOpen(false);
              setIncomingCall(null);
              toast.info('Call was declined');
            }
          }
        }
      )
      .subscribe();

    // Subscribe to outgoing calls (where current user is caller)
    const outgoingChannel = supabase
      .channel('outgoing_calls')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `caller_id=eq.${user.id}`,
        },
        (payload: { new: CallData }) => {
          const updatedCall = payload.new;
          
          // Update outgoing call if it exists
          if (outgoingCall && outgoingCall.id === updatedCall.id) {
            setOutgoingCall(updatedCall);
            
            if (updatedCall.status === 'accepted') {
              // Call was accepted, redirect to video call
              window.open(updatedCall.link, '_blank', 'noopener');
              setIsOutgoingCallOpen(false);
              setOutgoingCall(null);
            } else if (updatedCall.status === 'rejected') {
              // Call was rejected
              setIsOutgoingCallOpen(false);
              setOutgoingCall(null);
              toast.info('Call was declined');
            }
          }
        }
      )
      .subscribe();

    return () => {
      incomingChannel.unsubscribe();
      outgoingChannel.unsubscribe();
    };
  }, [user, incomingCall, outgoingCall, fetchCallerProfile]);

  // Close incoming call popup
  const closeIncomingCall = useCallback(() => {
    setIsIncomingCallOpen(false);
    setIncomingCall(null);
    setCallerProfile(null);
  }, []);

  // Close outgoing call popup
  const closeOutgoingCall = useCallback(() => {
    setIsOutgoingCallOpen(false);
    setOutgoingCall(null);
  }, []);

  return {
    initiateCall,
    incomingCall,
    outgoingCall,
    callerProfile,
    isIncomingCallOpen,
    isOutgoingCallOpen,
    closeIncomingCall,
    closeOutgoingCall
  };
} 