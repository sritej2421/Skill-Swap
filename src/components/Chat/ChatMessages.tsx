import React, { useRef, useEffect, useState } from 'react';
import MessageBubble from './MessageBubble';
import { History, UserCircle, MessageSquare } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import type { MessageType } from '@/integrations/supabase/types';
import ChatInputBar from './ChatInputBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatMessagesProps {
  selectedUser: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  chatConnectionId: string | null;
  isProfileOpen: boolean;
  onToggleProfile: () => void;
}

const WelcomeScreen = () => (
  <div className="flex flex-col items-center justify-center h-full animate-fade-in">
    <div className="w-24 h-24 mb-6 text-primary/20">
      <MessageSquare className="w-full h-full" />
    </div>
    <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to SkillSwap!</h2>
    <p className="text-muted-foreground text-center max-w-md">
      Connect. Share. Grow. Select a chat to start your skill-sharing journey.
    </p>
  </div>
);

export default function ChatMessages({ 
  selectedUser, 
  chatConnectionId,
  isProfileOpen,
  onToggleProfile 
}: Readonly<ChatMessagesProps>) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendMessage } = useMessages(user?.id || '', selectedUser?.id || '');

  // --- Call History State and Logic ---
  const [calls, setCalls] = useState<{ id: string; link: string; created_at: string }[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Fetch previous calls for this chat connection
  useEffect(() => {
    const fetchCalls = async () => {
      if (!user?.id || !selectedUser?.id) return;
      setLoadingCalls(true);
      setCallError(null);
      try {
        const { data, error } = await supabase
          .from('calls')
          .select('id, link, created_at')
          .or(`and(caller_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(caller_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setCalls(data || []);
      } catch (err: any) {
        setCallError('Failed to load previous calls');
        toast.error('Could not load call history', {
          description: 'Please try refreshing the page.'
        });
      } finally {
        setLoadingCalls(false);
      }
    };
    fetchCalls();
  }, [user?.id, selectedUser?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only scroll if there are messages to scroll to, and after the messages have settled
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]); // Dependency on messages array

  const handleSendMessage = async (
    content: string,
    messageType: MessageType = 'text',
    fileUrl?: string,
    fileName?: string
  ) => {
    if (!user || !selectedUser) {
      console.warn("Attempted to send message without a user or selected user.");
      return;
    }

    try {
      await sendMessage(content, messageType, fileUrl, fileName);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const renderActionButton = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    variant: 'primary' | 'accent' | 'muted' = 'primary',
    disabled = false
  ) => {
    const baseClasses = "flex items-center justify-center rounded-lg font-semibold shadow transition-all duration-200";
    const variantClasses = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      accent: "bg-accent text-accent-foreground hover:bg-accent/90",
      muted: "text-muted-foreground hover:text-primary hover:bg-accent"
    };

    const buttonContent = isProfileOpen ? (
      <div className={cn(
        "p-2 rounded-lg transition-all duration-200",
        variantClasses[variant]
      )}>
        {icon}
      </div>
    ) : (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
        variantClasses[variant]
      )}>
        {icon}
        <span className="text-base">{label}</span>
      </div>
    );

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClick}
              disabled={disabled}
              className={cn(
                baseClasses,
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label={label}
            >
              {buttonContent}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      {selectedUser ? (
        <div className={cn(
          "flex items-center justify-between px-6 border-b border-border bg-background/95 shadow-sm",
          "transition-all duration-200 ease-in-out",
          isProfileOpen ? "py-2" : "py-4"
        )}>
          {/* User Info Section */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={selectedUser.avatar_url || '/placeholder.svg'}
              alt={selectedUser.full_name}
              className={cn(
                "rounded-full object-cover flex-shrink-0 transition-all duration-200",
                isProfileOpen ? "w-8 h-8" : "w-10 h-10"
              )}
            />
            <div className="min-w-0">
              <h3 className={cn(
                "font-semibold truncate transition-all duration-200",
                isProfileOpen ? "text-sm" : "text-base"
              )}>
                {selectedUser.full_name}
              </h3>
              <p className={cn(
                "text-muted-foreground transition-all duration-200",
                isProfileOpen ? "text-[10px]" : "text-xs"
              )}>
                Active now
              </p>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {renderActionButton(
              <UserCircle className={cn(
                "transition-all duration-200",
                isProfileOpen ? "h-5 w-5" : "h-5 w-5"
              )} />,
              "Skill Profile",
              onToggleProfile,
              isProfileOpen ? 'accent' : 'primary'
            )}
            {renderActionButton(
              <History className={cn(
                "transition-all duration-200",
                isProfileOpen ? "h-5 w-5" : "h-5 w-5"
              )} />,
              "Call History",
              () => setIsHistoryOpen(true),
              'muted',
              !selectedUser
            )}
          </div>
        </div>
      ) : (
        <div className={cn(
          "px-6 border-b border-border bg-background/95 shadow-sm",
          "transition-all duration-200 ease-in-out",
          isProfileOpen ? "py-2" : "py-4"
        )}>
          <p className={cn(
            "text-center text-muted-foreground transition-all duration-200",
            isProfileOpen ? "text-sm" : "text-base"
          )}>
            Select a user to start chatting
          </p>
        </div>
      )}

      {/* Call History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Call History</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] overflow-y-auto px-1">
            {loadingCalls ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : callError ? (
              <div className="text-center py-8">
                <p className="text-destructive">{callError}</p>
              </div>
            ) : calls.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No call history yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start a video call to connect with {selectedUser?.full_name}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {calls.map(call => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors">
                        📞
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          Video Call
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(call.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <a
                      href={call.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Join Again
                    </a>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-background/50 scrollbar-thin">
        {(() => {
          if (!selectedUser) {
            return <WelcomeScreen />;
          }

          let messagesContent;
          if (loading) {
            messagesContent = (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            );
          } else if (messages.length > 0) {
            messagesContent = (
              <div className="space-y-4 max-w-full">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender_id === user?.id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            );
          } else {
            messagesContent = (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground">Start a conversation!</p>
              </div>
            );
          }
          return messagesContent;
        })()}
      </div>

      {/* Chat Input */}
      <div className="border-t border-border bg-background/95">
        <div className="px-6 py-4">
          <ChatInputBar
            onSendMessage={handleSendMessage}
            disabled={!selectedUser}
          />
        </div>
      </div>
    </div>
  );
}