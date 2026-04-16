import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatSidebar from '@/components/Chat/ChatSidebar';
import ChatMessages from '@/components/Chat/ChatMessages';
import SkillProfileSidebar from '@/components/Chat/SkillProfileSidebar';
import { cn } from '@/lib/utils';

interface SelectedUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [chatConnectionId, setChatConnectionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Handle responsive layout
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  const isTablet = typeof window !== 'undefined' ? window.innerWidth <= 1024 : false;

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
    // Don't auto-hide profile on tablet, let user control it
    if (isMobile) {
      setIsProfileOpen(false);
    }
  }, [isMobile, isTablet]);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (user && selectedUser) {
          await loadChatConnection();
        } else {
          setChatConnectionId(null);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        // Handle the error appropriately
      }
    };

    initializeChat();
  }, [user, selectedUser]);

  const loadChatConnection = async () => {
    if (!user || !selectedUser) return;

    try {
      const { data, error } = await supabase
        .from('chat_connections')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .or(`user1_id.eq.${selectedUser.id},user2_id.eq.${selectedUser.id}`)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setChatConnectionId(data.id);
      } else {
        const { data: newConnection, error: createError } = await supabase
          .from('chat_connections')
          .insert({
            user1_id: user.id,
            user2_id: selectedUser.id
          })
          .select('id')
          .single();

        if (createError) throw createError;
        setChatConnectionId(newConnection.id);
      }
    } catch (error) {
      console.error('Error managing chat connection:', error);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-row bg-background overflow-hidden">
      {/* Left Sidebar */}
      <aside className={cn(
        "w-[240px] h-full border-r border-border flex-shrink-0 bg-white/50 dark:bg-accent/5",
        "transition-all duration-300 ease-in-out",
        isMobile && !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="h-full p-4">
          <ChatSidebar 
            onSelectUser={(user) => {
              setSelectedUser(user);
              if (isMobile) setIsSidebarOpen(false);
            }}
            selectedUserId={selectedUser?.id}
          />
        </div>
      </aside>

      {/* Center Chat Area */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 h-full bg-background/80",
        "transition-all duration-300 ease-in-out",
        isProfileOpen && "lg:w-1/2"
      )}>
        <ChatMessages
          selectedUser={selectedUser}
          chatConnectionId={chatConnectionId}
          isProfileOpen={isProfileOpen}
          onToggleProfile={() => setIsProfileOpen(!isProfileOpen)}
        />
      </main>

      {/* Right Sidebar - Skill Profile */}
      <aside className={cn(
        "w-[240px] lg:w-1/2 h-full border-l border-border flex-shrink-0 bg-white/50 dark:bg-accent/5",
        "transition-all duration-300 ease-in-out",
        "fixed lg:relative right-0 top-0",
        isProfileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:pointer-events-none"
      )}>
        <div className="h-full p-4 relative">
          <button
            onClick={() => setIsProfileOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent/50 transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          <SkillProfileSidebar
            selectedUser={selectedUser}
            chatConnectionId={chatConnectionId}
          />
        </div>
      </aside>
    </div>
  );
};

export default Chat;