import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate } from "react-router-dom";
import { 
  CheckCircle, 
  BookOpen, 
  BookText, 
  Award, 
  Clock, 
  BarChart, 
  TestTube, 
  Calendar, 
  Search, 
  AlertCircle,
  Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";



// Sample test data
export const allTests = [
  {
    id: 1,
    title: "JavaScript Fundamentals",
    description: "Test your knowledge of JavaScript basics including variables, functions, and control flow",
    questionCount: 30,
    estimatedTime: "25 min",
    level: "Beginner"
  },
  {
    id: 2,
    title: "React Development",
    description: "Assess your React skills including components, hooks, and state management",
    questionCount: 25,
    estimatedTime: "30 min",
    level: "Intermediate"
  },
  {
    id: 3,
    title: "UX Design Principles",
    description: "Evaluate your understanding of user experience design concepts and best practices",
    questionCount: 20,
    estimatedTime: "20 min",
    level: "Beginner"
  },
  {
    id: 4,
    title: "Advanced Data Structures",
    description: "Challenge yourself with complex algorithms and data structure problems",
    questionCount: 15,
    estimatedTime: "40 min",
    level: "Advanced"
  }
];

const inProgressTests = [
  {
    id: 5,
    title: "Python for Data Science",
    description: "Learn essential Python libraries for data analysis and visualization",
    progress: 35,
    remainingQuestions: 18,
    totalQuestions: 25,
    lastAttempted: "2 days ago"
  }
];

const completedTests = [
  {
    id: 6,
    title: "HTML & CSS Basics",
    description: "Test your knowledge of web fundamentals",
    score: 92,
    completedOn: "May 15, 2025",
    badge: "Expert"
  },
  {
    id: 7,
    title: "SQL Database Design",
    description: "Demonstrate your SQL and database modeling skills",
    score: 78,
    completedOn: "May 10, 2025",
    badge: "Proficient"
  }
];

const Test = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [showNotFoundDialog, setShowNotFoundDialog] = useState(false);
  const [requestedSkill, setRequestedSkill] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completedTests, setCompletedTests] = useState([]);

  // Function to determine badge level based on score
  const getBadgeLevel = (score: number) => {
    if (score >= 90) return "Expert";
    if (score >= 80) return "Advanced";
    if (score >= 75) return "Proficient";
    return null;
  };

  // Load user's completed tests
  useEffect(() => {
    async function loadUserTests() {
      if (!user) {
        console.log('No user found, skipping loadUserTests');
        return;
      }

      try {
        console.log('Loading tests for user:', user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('verified_skills, completed_tests')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }

        console.log('Profile data received:', profile);
        console.log('Completed tests:', profile?.completed_tests);
        console.log('Verified skills:', profile?.verified_skills);

        // Convert completed tests to display format
        const completed = Object.entries(profile?.completed_tests || {}).map(([title, data]: [string, any]) => {
          console.log('Processing completed test:', title, data);
          return {
            id: Math.random(), // Generate a unique ID
            title,
            description: `Completed test in ${title}`,
            score: data.score,
            completedOn: data.completedOn,
            // Only add badge if the skill is verified
            badge: profile?.verified_skills?.[title]?.level || null
          };
        });

        console.log('Processed completed tests:', completed);
        setCompletedTests(completed);
      } catch (error) {
        console.error('Error loading user tests:', error);
      }
    }

    loadUserTests();
  }, [user]);

  // Function to handle test completion and badge creation
  const handleTestCompletion = async (test: any, score: number) => {
    if (!user) return;

    const badgeLevel = getBadgeLevel(score);
    if (!badgeLevel) return;

    try {
      // Get current profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('verified_skills')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Create or update verified skills
      const verifiedSkills = profile?.verified_skills || {};
      verifiedSkills[test.title] = {
        level: badgeLevel,
        score: score,
        completedOn: new Date().toISOString()
      };

      // Update profile with new verified skill
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ verified_skills: verifiedSkills })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setCompletedTests(prev => [...prev, {
        id: Math.random(),
        title: test.title,
        description: `Verified skill in ${test.title}`,
        score,
        completedOn: new Date().toISOString(),
        badge: badgeLevel
      }]);

      toast({
        title: "Skill Verified! 🎉",
        description: `You've earned a ${badgeLevel} badge in ${test.title}`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error updating verified skills:', error);
      toast({
        title: "Error",
        description: "Failed to update verified skills",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const filteredTests = allTests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          test.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || test.level === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && !filteredTests.length) {
      setRequestedSkill(searchQuery);
      setShowNotFoundDialog(true);
    }
  };

  const handleRequestTest = () => {
    // This would connect to an API to log the request
    toast({
      title: "Test Requested",
      description: `We've logged your request for a ${requestedSkill} skill test.`,
      duration: 5000,
    });
    setShowNotFoundDialog(false);
  };

  const handleAddUnverified = () => {
    // This would connect to an API to add the skill as unverified
    toast({
      title: "Skill Added",
      description: `${requestedSkill} has been added as an unverified skill to your profile.`,
      duration: 5000,
    });
    setShowNotFoundDialog(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Skill Assessment Tests</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Take tests to verify your skills and showcase your expertise to potential skill matches
          </p>
        </div>

        <Tabs defaultValue="explore">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="explore">Explore Tests</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="explore">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTests.length > 0 ? (
                filteredTests.map((test) => (
                  <Card key={test.id} className="transition-all duration-300 hover:shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center gap-2">
                          <TestTube className="h-5 w-5 text-primary" />
                          {test.title}
                        </CardTitle>
                        <Badge variant={
                          test.level === "Beginner" ? "outline" : 
                          test.level === "Intermediate" ? "secondary" : 
                          "default"
                        }>
                          {test.level}
                        </Badge>
                      </div>
                      <CardDescription>{test.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <BookText className="h-4 w-4 text-muted-foreground" />
                          <span>{test.questionCount} questions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{test.estimatedTime}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link 
                        to="/testing" 
                        state={{
                          title: test.title,
                          description: test.description,
                          level: test.level,
                          estimatedTime: test.estimatedTime,
                          questionCount: test.questionCount
                        }}
                      >
                        <Button>Start Test</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-1 md:col-span-2 text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tests found for "{searchQuery}"</h3>
                  <p className="text-muted-foreground mb-6">
                    We don't have a test for this skill yet. Would you like to request one?
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button 
                      onClick={() => setShowNotFoundDialog(true)} 
                      className="bg-[#9b87f5] hover:bg-[#8B5CF6] text-white"
                    >
                      Request Test
                    </Button>
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Clear Search
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="completed">
            {completedTests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedTests.map((test) => (
                  <Card key={test.id} className="transition-all duration-300 hover:shadow-md border-t-4 border-t-primary">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{test.title}</CardTitle>
                        {test.badge && (
                          <Badge className="bg-primary/20 text-primary border-primary">
                            {test.badge}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{test.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Your Score</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{test.score}%</span>
                          {test.badge && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </div>
                      </div>
                      
                      <Progress 
                        value={test.score} 
                        className={
                          test.score >= 90 ? "h-2 bg-green-500/20" : 
                          test.score >= 80 ? "h-2 bg-blue-500/20" :
                          test.score >= 75 ? "h-2 bg-amber-500/20" : "h-2 bg-red-500/20"
                        }
                      />
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span>{test.badge ? "Certificate Earned" : "Test Completed"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Completed on {new Date(test.completedOn).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <BarChart className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          // Find the original test data from allTests
                          const originalTest = allTests.find(t => t.title === test.title);
                          if (originalTest) {
                            navigate('/testing', { 
                              state: { 
                                title: originalTest.title,
                                description: originalTest.description,
                                level: originalTest.level,
                                estimatedTime: originalTest.estimatedTime,
                                questionCount: originalTest.questionCount
                              }
                            });
                          } else {
                            toast({
                              title: "Error",
                              description: "Could not find test details. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <TestTube className="mr-2 h-4 w-4" />
                        Retake Test
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No completed tests yet</h3>
                <p className="text-muted-foreground mb-6">
                  Complete tests to track your progress and earn skill badges.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => document.querySelector('button[value="explore"]')?.dispatchEvent(new Event('click'))}
                >
                  Browse Available Tests
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      {/* Dialog for "No Test Found" scenario */}
      <Dialog open={showNotFoundDialog} onOpenChange={setShowNotFoundDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Test Not Available</DialogTitle>
            <DialogDescription>
              We don't have a test for "{requestedSkill}" yet. You can request this test to be created or add it as an unverified skill to your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <Badge variant="outline" className="bg-[#F1F0FB] text-[#8E9196] border-[#D6BCFA]">
              Unverified Skill
            </Badge>
            <Popover>
              <PopoverTrigger>
                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">About Unverified Skills</h4>
                  <p className="text-sm text-muted-foreground">
                    Unverified skills will appear on your profile with an "Unverified" tag.
                    This indicates that your proficiency has not yet been assessed through our verification system.
                    These skills are still visible to potential matches but may rank lower in search results.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-4">
            <Button 
              variant="outline" 
              onClick={handleAddUnverified} 
              className="w-full sm:w-auto"
            >
              Add as Unverified Skill
            </Button>
            <Button 
              onClick={handleRequestTest} 
              className="w-full sm:w-auto bg-[#9b87f5] hover:bg-[#8B5CF6] text-white"
            >
              Request Test Creation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Test;