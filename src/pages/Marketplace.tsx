import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Skill categories for filter
const categories = [
  "All Categories",
  "Technology",
  "Design",
  "Languages",
  "Music",
  "Art",
  "Business",
  "Finance",
  "Marketing",
  "Health & Fitness",
  "Academic"
];

// Levels for filter
const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

// Modes for filter
const modes = ["All Modes", "Online", "In-Person", "Both"];

const SkillCard = ({ profile }) => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRequestSwap = async (skill) => {
    setSending(true);
    const { error } = await supabase.from('requests').insert([
      {
        from_user: user.id,
        to_user: profile.id,
        skill,
        status: 'pending'
      }
    ]);
    setSending(false);
    if (!error) setSent(true);
    // Optionally handle error
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{profile.full_name}</p>
              <Badge variant="outline" className="h-5 text-xs border-primary/30 text-primary">
                {profile.role}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>{profile.location}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid gap-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Teaching</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills_teach?.map((skill, index) => {
                const verifiedSkill = profile.verified_skills?.[skill];
                return (
                  <div key={index} className="relative group">
                    <Badge 
                      className={`${
                        verifiedSkill 
                          ? "bg-primary/20 text-primary border-primary" 
                          : "bg-skill-beginner"
                      }`}
                    >
                      {skill}
                      {verifiedSkill && (
                        <span className="ml-1 text-xs">
                          ({verifiedSkill.level})
                        </span>
                      )}
                    </Badge>
                    {verifiedSkill && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Score: {verifiedSkill.score}%
                        <br />
                        Completed: {new Date(verifiedSkill.completedOn).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Learning</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills_learn?.map((skill, index) => (
                <Badge key={index} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{profile.location}</span>
            </div>
          </div>
          
          <Button
            className="w-full mt-4"
            disabled={sending || sent}
            onClick={() => handleRequestSwap(profile.skills_teach[0])} // or let user pick skill
          >
            {sent ? "Request Sent" : sending ? "Sending..." : "Request Swap"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Marketplace = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [selectedMode, setSelectedMode] = useState("All Modes");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const { data: userProfileData, error: userError } = await supabase
          .from('profiles')
          .select('skills_learn')
          .eq('id', user?.id)
          .single();

        if (userError) throw userError;
        setUserProfile(userProfileData);

        // Get all profiles except the current user's
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user?.id);

        if (profilesError) throw profilesError;

        // Filter profiles that have matching skills
        const matchingProfiles = allProfiles.filter(profile => {
          const userSkillsToLearn = userProfileData?.skills_learn || [];
          const profileSkillsToTeach = profile.skills_teach || [];
          
          // Check if there's any overlap between skills user wants to learn and what profile can teach
          return userSkillsToLearn.some(skill => profileSkillsToTeach.includes(skill));
        });

        setProfiles(matchingProfiles);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchProfiles();
    }
  }, [user]);

  // Filter listings based on search and filters
  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.skills_teach?.some(skill => 
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory =
      selectedCategory === "All Categories" ||
      profile.skills_teach?.some(skill => 
        categories.includes(skill)
      );
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Skill Marketplace</h1>
            <p className="text-muted-foreground">
              Browse through the skills offered by our community members and find your perfect match
            </p>
          </div>
          
          <Tabs defaultValue="all" className="mb-8">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <TabsList>
                <TabsTrigger value="all">All Skills</TabsTrigger>
                <TabsTrigger value="verified">Verified Only</TabsTrigger>
                <TabsTrigger value="recommended">Recommended</TabsTrigger>
              </TabsList>
              
              <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search skills or users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="category" className="text-sm">Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="level" className="text-sm">Skill Level</Label>
                <Select
                  value={selectedLevel}
                  onValueChange={setSelectedLevel}
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="mode" className="text-sm">Teaching Mode</Label>
                <Select
                  value={selectedMode}
                  onValueChange={setSelectedMode}
                >
                  <SelectTrigger id="mode">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {modes.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.map((profile) => (
                  <SkillCard key={profile.id} profile={profile} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="verified">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles
                  .filter((profile) => {
                    // Check if profile has any verified skills
                    return Object.keys(profile.verified_skills || {}).length > 0;
                  })
                  .map((profile) => (
                    <SkillCard key={profile.id} profile={profile} />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="recommended">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles
                  .filter((profile) => {
                    const userSkillsToLearn = userProfile?.skills_learn || [];
                    const profileSkillsToTeach = profile.skills_teach || [];
                    // Calculate match score based on number of matching skills
                    const matchScore = userSkillsToLearn.filter(skill => 
                      profileSkillsToTeach.includes(skill)
                    ).length;
                    return matchScore >= 2; // Show profiles with 2 or more matching skills
                  })
                  .map((profile) => (
                    <SkillCard key={profile.id} profile={profile} />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;
