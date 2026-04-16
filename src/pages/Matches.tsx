import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { MessageCircle, Video, Clock, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';

// Sample data (will be replaced)
const matchesData = [
  {
    id: "1",
    full_name: "Alex Johnson",
    avatar_url: "/avatars/01.png", // Replace with actual image path if available
    skills_teach: ["JavaScript", "React", "Node.js"],
    skills_learn: ["Python", "Machine Learning"],
    matchScore: 92,
    lastActive: "2 hours ago",
    status: "online",
  },
  {
    id: "2",
    full_name: "Jamie Smith",
    avatar_url: "/avatars/02.png", // Replace with actual image path if available
    skills_teach: ["UX Design", "Figma", "Adobe XD"],
    skills_learn: ["Frontend Development", "React"],
    matchScore: 87,
    lastActive: "1 day ago",
    status: "away",
  },
  {
    id: "3",
    full_name: "Taylor Davis",
    avatar_url: "/avatars/03.png", // Replace with actual image path if available
    skills_teach: ["Python", "Data Science", "SQL"],
    skills_learn: ["JavaScript", "React Native"],
    matchScore: 83,
    lastActive: "Just now",
    status: "online",
  },
  {
    id: "4",
    full_name: "Morgan Williams",
    avatar_url: "/avatars/04.png", // Replace with actual image path if available
    skills_teach: ["Marketing", "Content Creation"],
    skills_learn: ["SEO", "Social Media Strategy"],
    matchScore: 79,
    lastActive: "3 days ago",
    status: "offline",
  },
  {
    id: "5",
    full_name: "Riley Brown",
    avatar_url: "/avatars/05.png", // Replace with actual image path if available
    skills_teach: ["Graphic Design", "Illustration"],
    skills_learn: ["UI Design", "Animation"],
    matchScore: 75,
    lastActive: "5 hours ago",
    status: "online",
  },
];

// type MatchProfile = Tables<'profiles'> & { matchScore?: number }; // Augment profile type with matchScore

type SkillBadgeProps = {
  name: string;
  // level: string; // Assuming level isn't available for matched users in this fetch
  variant?: "sharing" | "learning";
}

// Updated SkillBadge props
const SkillBadge = ({ name, variant = "sharing" }: SkillBadgeProps) => {
  const isSharing = variant === "sharing";

  // Removing HoverCard logic and level display as we don't have level here
  return (
    <Badge
      variant="outline"
      className={cn(
        "transition-all duration-300 hover:scale-105 cursor-default",
        isSharing
          ? "bg-primary/10 hover:bg-primary/20" // Skills they teach (you can learn)
          : "bg-secondary/20 hover:bg-secondary/30" // Skills they want to learn (you can teach)
      )}
    >
      {name}
    </Badge>
  );
};

type StatusBadgeProps = {
  // Assuming status comes from elsewhere or is hardcoded for now
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
        status === "online" ? "bg-green-500" :
        status === "away" ? "bg-yellow-500" : "bg-muted"
      )}
    />
  );
};
// Updated MatchCard props
const MatchCard = ({ match }: { match: { 
  id: string;
  skills_teach?: string[];
  skills_learn?: string[];
  avatar_url?: string;
  full_name?: string;
  matchScore?: number;
} }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Provide default values for optional columns if null
  const skillsTeach = match.skills_teach || [];
  const skillsLearn = match.skills_learn || [];
  const avatarUrl = match.avatar_url || '/placeholder.svg';
  const fullName = match.full_name || 'No Name';
  const matchScore = match.matchScore || 0;

  const handleChatClick = () => {
    navigate(`/chat?user=${match.id}`);
  };

  // Assuming status and lastActive are not fetched, using placeholders
  const status = 'offline'; // Placeholder status
  const lastActive = 'unknown'; // Placeholder last active


  return (
    <Card
      className={cn(
        "transition-all duration-300 group backdrop-blur-sm",
        isHovered
          ? "shadow-lg ring-1 ring-primary/20 translate-y-[-4px]"
          : "hover:shadow-md",
        "overflow-hidden"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500",
        isHovered ? "opacity-10" : "opacity-0",
        "from-primary/20 to-accent/20"
      )} />

      <div className="absolute top-3 right-3 z-10">
        <Badge
          className={cn(
            "bg-primary/80 text-primary-foreground font-medium",
            "shadow-sm transition-all duration-300",
          )}
        >
          {matchScore}% Match {/* Display calculated matchScore */}
        </Badge>
      </div>

      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
            <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
            <AvatarFallback>{fullName.charAt(0)}</AvatarFallback>
          </Avatar>
          <StatusBadge status={status} />
        </div>

        <div>
          <h3 className="text-xl font-semibold">{fullName}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3 opacity-70" />
            {lastActive}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-3">
        <div className="animate-fade-in">
          <p className="text-sm font-medium mb-1.5 text-muted-foreground">Skills to share:</p>
          <div className="flex flex-wrap gap-1.5">
            {skillsTeach.map((skillName) => (
              <SkillBadge
                key={skillName} // Use skillName as key
                name={skillName}
                variant="sharing"
              />
            ))}
          </div>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <p className="text-sm font-medium mb-1.5 text-muted-foreground">Wants to learn:</p>
          <div className="flex flex-wrap gap-1.5">
            {skillsLearn.map((skillName) => (
              <SkillBadge
                key={skillName} // Use skillName as key
                name={skillName}
                variant="learning"
              />
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1 transition-all hover:bg-primary/10 hover:text-primary"
          onClick={handleChatClick}
        >
          <MessageCircle className="h-4 w-4" />
          <span>Chat Now</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1 transition-all hover:bg-primary/10 hover:text-primary"
        >
          <Video className="h-4 w-4" />
          <span>Video Chat</span>
        </Button>

        <div className="flex gap-1.5 ml-auto">
          <Button
            size="sm"
            variant="ghost"
            className="w-auto px-2 h-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            <span className="sr-only md:not-sr-only md:inline">Ignore</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="w-auto px-2 h-8 rounded-full text-green-500 hover:bg-green-500/10 hover:text-green-600"
          >
            <Check className="h-4 w-4 mr-1" />
            <span className="sr-only md:not-sr-only md:inline">Accept</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// Function to find skill swap matches based on reciprocal overlap
// export async function findSkillSwapMatches(
// ... existing code ...
//     return [];
// }

const Matches = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchRequests() {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('requests')
          .select(`
            *,
            from_user:profiles!requests_from_user_fkey(
              id,
              full_name,
              avatar_url,
              skills_teach,
              skills_learn
            )
          `)
          .eq('to_user', user.id)
          .eq('status', 'pending');
        
        if (error) throw error;
        setRequests(data || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setError('Failed to load requests. Please try again.');
        toast.error('Failed to load requests');
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [user]);

  // Accept request
  const handleAccept = async (id, fromUserId) => {
    try {
      setLoading(true);
      
      // Start a transaction
      const { error: updateError } = await supabase
        .from('requests')
        .update({ status: 'accepted' })
        .eq('id', id);

      if (updateError) throw updateError;

      // Create chat connection
      const { error: connectionError } = await supabase
        .from('chat_connections')
        .insert([
          {
            user1_id: user.id,
            user2_id: fromUserId
          }
        ]);

      if (connectionError) throw connectionError;

      // Remove the request from the list
      setRequests(requests.filter(req => req.id !== id));
      
      toast.success('Request accepted! Starting chat...');
      
      // Navigate to chat with the user
      navigate(`/chat?user=${fromUserId}`);
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request. Please try again.');
      setError('Failed to accept request');
    } finally {
      setLoading(false);
    }
  };

  // Reject request
  const handleReject = async (id) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('requests')
        .update({ status: 'rejected' })
        .eq('id', id);
        
      if (error) throw error;
      
      setRequests(requests.filter(req => req.id !== id));
      toast.success('Request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request. Please try again.');
      setError('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  // Send a new request
  const handleSendRequest = async (person1_id, person2_id, skill) => {
    const { error } = await supabase.from('requests').insert([
      {
        from_user: person1_id,
        to_user: person2_id, // must be Person2's ID
        skill,
        status: 'pending'
      }
    ]);
    if (error) {
      console.error("Error sending request:", error);
    } else {
      console.log("Request sent successfully!");
      // Optionally: update UI, show notification, etc.
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Incoming Skill Swap Requests</h2>
          
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : requests.length === 0 ? (
            <p className="text-muted-foreground">No new requests.</p>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="bg-[#181828] rounded-xl p-6 mb-6 shadow-lg relative text-white max-w-lg"
              >
                {/* Match Score Badge */}
                <div className="absolute top-4 right-4 bg-[#6C47FF] text-white text-xs px-3 py-1 rounded-full font-semibold">
                  92% Match
                </div>

                {/* Avatar and Name */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="relative">
                    <div className="bg-[#232336] rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                      {req.from_user?.full_name?.[0] || "A"}
                    </div>
                    {/* Status dot (optional) */}
                    <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-[#181828] bg-green-500"></span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{req.from_user?.full_name || "Unknown"}</div>
                    <div className="text-xs text-gray-400">unknown</div>
                  </div>
                </div>

                {/* Skills to share */}
                <div className="mt-4">
                  <div className="text-sm text-gray-400 mb-1">Skills to share:</div>
                  <div className="flex gap-2 flex-wrap">
                    {(req.from_user?.skills_teach || []).map((skill) => (
                      <span
                        key={skill}
                        className="bg-[#232336] text-[#B3B3C6] px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Wants to learn */}
                <div className="mt-3">
                  <div className="text-sm text-gray-400 mb-1">Wants to learn:</div>
                  <div className="flex gap-2 flex-wrap">
                    {(req.from_user?.skills_learn || []).map((skill) => (
                      <span
                        key={skill}
                        className="bg-[#232336] text-[#B3B3C6] px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button 
                    className="flex-1 bg-[#232336] hover:bg-[#232346] text-white py-2 rounded-lg flex items-center justify-center gap-2 border border-[#232336] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => navigate(`/chat?user=${req.from_user.id}`)}
                    disabled={loading}
                  >
                    <span>💬</span> Chat Now
                  </button>
                  <button 
                    className="flex-1 bg-[#232336] hover:bg-[#232346] text-white py-2 rounded-lg flex items-center justify-center gap-2 border border-[#232336] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <span>🎥</span> Video Chat
                  </button>
                </div>
                <div className="flex gap-6 mt-4 justify-end">
                  <button
                    className="text-red-500 flex items-center gap-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleReject(req.id)}
                    disabled={loading}
                  >
                    <span>✗</span> Ignore
                  </button>
                  <button
                    className="text-green-400 flex items-center gap-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleAccept(req.id, req.from_user.id)}
                    disabled={loading}
                  >
                    <span>✓</span> Accept
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Matches;
