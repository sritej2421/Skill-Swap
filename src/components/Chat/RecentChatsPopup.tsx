import React from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRecentChats } from '@/hooks/useRecentChats';
import { useAuth } from '@/hooks/useAuth';

interface RecentChatsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const RecentChatsPopup: React.FC<RecentChatsPopupProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recentChats, loading, error } = useRecentChats();

  if (!isOpen) return null;

  const handleOpenFullChat = () => {
    onClose();
    navigate('/chat');
  };

  // Extract the chat list content to avoid nested ternary
  let chatListContent;  if (!user) {
    chatListContent = (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please log in to view your chats</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Log in
        </button>
      </div>
    );
  } else if (error) {
    chatListContent = (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading chats</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  } else if (loading) {
    chatListContent = (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  } else if (recentChats.length === 0) {
    chatListContent = (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No recent chats</p>
        <button
          onClick={() => navigate('/marketplace')}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Find someone to chat with
        </button>
      </div>
    );
  } else {chatListContent = (
      <div className="space-y-1">
        {recentChats.map(chat => {
          const otherUser = chat.user_details;
          if (!otherUser) return null; // Skip if no user details
          
          return (
            <button
              key={chat.id}
              onClick={() => {
                navigate(`/chat?id=${chat.id}`);
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-accent/50 transition-colors text-left"
            >
              <div className="relative">
                <img
                  src={otherUser.avatar_url || '/placeholder.svg'}
                  alt={otherUser.full_name || 'User'}
                  className="w-10 h-10 rounded-full object-cover bg-muted"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {otherUser.full_name || 'Anonymous User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {chat.last_message || 'No messages yet'}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {new Date(chat.updated_at).toLocaleDateString()}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex justify-center items-center animate-in fade-in">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-sm mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-xl font-bold">Recent Chats</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-2">
          {chatListContent}
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleOpenFullChat}
            className="w-full bg-primary text-primary-foreground p-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Open Full Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentChatsPopup;