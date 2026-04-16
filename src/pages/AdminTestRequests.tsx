
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Plus, 
  TestTube, 
  Settings
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mock data for requested skills
const requestedSkills = [
  { id: 1, skill: "Figma", requests: 42, lastRequested: "May 17, 2025" },
  { id: 2, skill: "Vue.js", requests: 38, lastRequested: "May 16, 2025" },
  { id: 3, skill: "TypeScript", requests: 36, lastRequested: "May 17, 2025" },
  { id: 4, skill: "Blender", requests: 29, lastRequested: "May 15, 2025" },
  { id: 5, skill: "Adobe After Effects", requests: 24, lastRequested: "May 14, 2025" },
];

const pendingTests = [
  { id: 1, skill: "Vue.js", status: "Draft", questions: 12, author: "System" },
  { id: 2, skill: "TypeScript", status: "Review", questions: 20, author: "Admin" },
];

const AdminTestRequests = () => {
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("");
  const { toast } = useToast();

  const handleCreateManually = (skill) => {
    // Navigate to test creation page
    toast({
      title: "Test Creation Started",
      description: `You're now creating a test for ${skill}`,
    });
  };

  const handleGenerateWithAI = () => {
    // This would connect to an API to generate questions
    toast({
      title: "AI Generation Started",
      description: `We're generating test questions for ${selectedSkill}. This may take a few moments.`,
      duration: 5000,
    });
    setShowAIDialog(false);
  };

  const handleNotifyUsers = (skill) => {
    // This would connect to an API to send notifications
    toast({
      title: "Users Notified",
      description: `All users who requested ${skill} tests have been notified.`,
      duration: 3000,
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3">Admin Test Management</h1>
          <p className="text-muted-foreground max-w-3xl">
            Create and manage skill assessment tests for the SkillSwap platform
          </p>
        </div>

        <Tabs defaultValue="requests">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="requests">Most Requested Skills</TabsTrigger>
            <TabsTrigger value="pending">Pending Tests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-primary" />
                    Most Requested Tests
                  </span>
                </CardTitle>
                <CardDescription>
                  Skills that users have requested for verification but don't have tests yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Skill</TableHead>
                      <TableHead className="text-center">Requests</TableHead>
                      <TableHead>Last Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestedSkills.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.skill}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{item.requests}</Badge>
                        </TableCell>
                        <TableCell>{item.lastRequested}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleCreateManually(item.skill)}>
                              <Plus className="h-4 w-4 mr-1" />
                              Create Manually
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-[#9b87f5] hover:bg-[#8B5CF6] text-white"
                              onClick={() => {
                                setSelectedSkill(item.skill);
                                setShowAIDialog(true);
                              }}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Generate with AI
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-primary" />
                  Pending Test Creation
                </CardTitle>
                <CardDescription>
                  Tests that are currently being created or reviewed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingTests.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.skill}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === "Review" ? "outline" : "secondary"}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.questions}</TableCell>
                          <TableCell>{item.author}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleNotifyUsers(item.skill)}
                              >
                                Publish
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending tests at the moment
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <Alert>
            <AlertTitle className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Mentor Contributions
            </AlertTitle>
            <AlertDescription>
              Top-rated mentors can now submit question banks for review. Enable this feature in the settings.
            </AlertDescription>
          </Alert>
        </div>
      </main>
      <Footer />

      {/* Dialog for AI Test Generation */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Test with AI</DialogTitle>
            <DialogDescription>
              Our AI can generate relevant questions for "{selectedSkill}" based on industry standards and best practices.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="flex flex-col items-center justify-center p-4 h-auto">
                <span className="text-lg font-medium mb-1">15</span>
                <span className="text-xs text-muted-foreground">Questions</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center justify-center p-4 h-auto">
                <span className="text-lg font-medium mb-1">30</span>
                <span className="text-xs text-muted-foreground">Questions</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center justify-center p-4 h-auto" defaultChecked>
                <span className="text-lg font-medium mb-1">Beginner</span>
                <span className="text-xs text-muted-foreground">Level</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center justify-center p-4 h-auto">
                <span className="text-lg font-medium mb-1">Advanced</span>
                <span className="text-xs text-muted-foreground">Level</span>
              </Button>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowAIDialog(false)} 
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateWithAI} 
              className="w-full sm:w-auto bg-[#9b87f5] hover:bg-[#8B5CF6] text-white"
            >
              Generate Questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTestRequests;
