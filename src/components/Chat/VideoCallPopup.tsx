import React, { useEffect, useState } from 'react';
import { Video, Phone, PhoneOff, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VideoCallPopupProps {
  isOpen: boolean;
  onClose: () => void;
  callData: {
    id: string;
    caller_id: string;
    receiver_id: string;
    link: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed';
    created_at: string;
  } | null;
  callerProfile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  isIncoming: boolean;
}

const VideoCallPopup: React.FC<VideoCallPopupProps> = ({
  isOpen,
  onClose,
  callData,
  callerProfile,
  isIncoming
}) => {
  const { user } = useAuth();
  const [isRinging, setIsRinging] = useState(false);
  const [callStatus, setCallStatus] = useState<'pending' | 'accepted' | 'rejected' | 'completed'>('pending');

  useEffect(() => {
    if (callData) {
      setCallStatus(callData.status);
    }
  }, [callData]);

  useEffect(() => {
    if (isOpen && isIncoming) {
      // Start ringing animation for incoming calls
      setIsRinging(true);
      
      // Auto-reject after 30 seconds if not answered
      const timeout = setTimeout(() => {
        handleRejectCall();
      }, 30000);

      return () => clearTimeout(timeout);
    }
  }, [isOpen, isIncoming]);

  const handleAcceptCall = async () => {
    if (!callData) return;

    try {
      // Update call status to accepted
      const { error } = await supabase
        .from('calls')
        .update({ 
          status: 'accepted',
          receiver_accepted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', callData.id);

      if (error) throw error;

      setCallStatus('accepted');
      setIsRinging(false);
      
      // Show success message
      toast.success('Call accepted!', {
        description: 'Redirecting to video call...'
      });

      // Redirect both users to the video call
      window.open(callData.link, '_blank', 'noopener');
      
      // Close popup after a short delay
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error accepting call:', error);
      toast.error('Failed to accept call');
    }
  };

  const handleRejectCall = async () => {
    if (!callData) return;

    try {
      // Update call status to rejected
      const { error } = await supabase
        .from('calls')
        .update({ 
          status: 'rejected',
          receiver_accepted: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', callData.id);

      if (error) throw error;

      setCallStatus('rejected');
      setIsRinging(false);
      
      toast.info('Call rejected');
      
      // Close popup after a short delay
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error rejecting call:', error);
      toast.error('Failed to reject call');
    }
  };

  const handleCancelCall = async () => {
    if (!callData) return;

    try {
      // Update call status to rejected (cancelled)
      const { error } = await supabase
        .from('calls')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', callData.id);

      if (error) throw error;

      setCallStatus('rejected');
      toast.info('Call cancelled');
      
      // Close popup immediately
      onClose();

    } catch (error) {
      console.error('Error cancelling call:', error);
      toast.error('Failed to cancel call');
    }
  };

  if (!isOpen || !callData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={cn(
        "bg-background border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl",
        "transform transition-all duration-300",
        isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
      )}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className={cn(
            "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
            isRinging ? "animate-pulse" : "",
            isIncoming ? "bg-green-500/20 text-green-500" : "bg-blue-500/20 text-blue-500"
          )}>
            {isIncoming ? (
              <Phone className="w-8 h-8" />
            ) : (
              <Video className="w-8 h-8" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {isIncoming ? 'Incoming Call' : 'Calling...'}
          </h3>
          
          <p className="text-muted-foreground">
            {callerProfile?.full_name || 'Unknown User'}
          </p>
        </div>

        {/* Caller Info */}
        <div className="flex items-center justify-center mb-6">
          {callerProfile?.avatar_url ? (
            <img
              src={callerProfile.avatar_url}
              alt={callerProfile.full_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center border-2 border-border">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground">
            {callStatus === 'pending' && isIncoming && 'Tap to answer'}
            {callStatus === 'pending' && !isIncoming && 'Waiting for answer...'}
            {callStatus === 'accepted' && 'Connecting...'}
            {callStatus === 'rejected' && 'Call ended'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isIncoming && callStatus === 'pending' ? (
            <>
              <button
                onClick={handleRejectCall}
                className="flex-1 bg-destructive text-destructive-foreground py-3 px-4 rounded-lg font-semibold hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                Decline
              </button>
              <button
                onClick={handleAcceptCall}
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Answer
              </button>
            </>
          ) : !isIncoming && callStatus === 'pending' ? (
            <button
              onClick={handleCancelCall}
              className="flex-1 bg-destructive text-destructive-foreground py-3 px-4 rounded-lg font-semibold hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              Cancel Call
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 bg-accent text-accent-foreground py-3 px-4 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallPopup; 