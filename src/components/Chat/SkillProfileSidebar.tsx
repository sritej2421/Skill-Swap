import React, { useState, useEffect } from 'react';
import { Square, CheckSquare, Brain, Pin, ListTodo, CalendarDays, User, Star, Clock, Plus, ExternalLink, Calendar, ChevronDown, ChevronUp, X, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { format, parse } from 'date-fns';
import { type Profile, SharedResource, SharedTask, TeachingSession, AvailabilitySlot } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SelectedUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface SkillProfileSidebarProps {
  selectedUser: SelectedUser | null;
  chatConnectionId: string | null;
}

const SkillProfileSidebar: React.FC<SkillProfileSidebarProps> = ({ selectedUser, chatConnectionId }) => {
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [resources, setResources] = useState<SharedResource[]>([]);
  const [tasks, setTasks] = useState<SharedTask[]>([]);
  const [nextSession, setNextSession] = useState<TeachingSession | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  
  // Dialog states
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);

  // Form states
  const [newResource, setNewResource] = useState({ title: '', url: '', description: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' });
  const [newSession, setNewSession] = useState({ title: '', description: '', scheduled_at: '', duration: 60, meeting_link: '' });
  const [newAvailability, setNewAvailability] = useState({ day_of_week: 1, start_time: '09:00', end_time: '17:00' });

  useEffect(() => {
    if (selectedUser) {
      loadProfile();
    }
  }, [selectedUser]);

  useEffect(() => {
    if (chatConnectionId) {
      loadResources();
      loadTasks();
      loadNextSession();
    }
  }, [chatConnectionId]);

  useEffect(() => {
    if (selectedUser) {
      loadAvailability();
    }
  }, [selectedUser]);

  const loadProfile = async () => {
    if (!selectedUser) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', selectedUser.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadResources = async () => {
    if (!chatConnectionId) return;

    try {
      const { data, error } = await supabase
        .from('shared_resources')
        .select('*')
        .eq('chat_connection_id', chatConnectionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const loadTasks = async () => {
    if (!chatConnectionId) return;

    try {
      const { data, error } = await supabase
        .from('shared_tasks')
        .select('*')
        .eq('chat_connection_id', chatConnectionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadNextSession = async () => {
    if (!chatConnectionId) return;

    try {      const { data, error } = await supabase
        .from('teaching_sessions')
        .select('*')
        .eq('chat_connection_id', chatConnectionId)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Teaching sessions error:', error);
        throw error;
      }
      setNextSession(data || null);
    } catch (error) {
      console.error('Error loading next session:', error);
    }
  };

  const loadAvailability = async () => {
    if (!selectedUser) return;

    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('profile_id', selectedUser.id)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const addResource = async () => {
    if (!chatConnectionId || !user) return;

    try {
      const { error } = await supabase
        .from('shared_resources')
        .insert({
          chat_connection_id: chatConnectionId,
          title: newResource.title,
          url: newResource.url,
          description: newResource.description,
          created_by: user.id
        });

      if (error) throw error;
      setIsResourceDialogOpen(false);
      setNewResource({ title: '', url: '', description: '' });
      loadResources();
    } catch (error) {
      console.error('Error adding resource:', error);
    }
  };

  const addTask = async () => {
    if (!chatConnectionId || !user) return;

    try {
      const { error } = await supabase
        .from('shared_tasks')
        .insert({
          chat_connection_id: chatConnectionId,
          title: newTask.title,
          description: newTask.description,
          due_date: newTask.due_date || null,
          completed: false,
          created_by: user.id
        });

      if (error) throw error;
      setIsTaskDialogOpen(false);
      setNewTask({ title: '', description: '', due_date: '' });
      loadTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('shared_tasks')
        .update({ completed })
        .eq('id', taskId);

      if (error) throw error;
      loadTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const addSession = async () => {
    if (!chatConnectionId || !user) return;

    try {
      const { error } = await supabase
        .from('teaching_sessions')
        .insert({
          chat_connection_id: chatConnectionId,
          title: newSession.title,
          description: newSession.description,
          scheduled_at: newSession.scheduled_at,
          duration: newSession.duration,
          meeting_link: newSession.meeting_link,
          created_by: user.id
        });

      if (error) throw error;
      setIsSessionDialogOpen(false);
      setNewSession({ title: '', description: '', scheduled_at: '', duration: 60, meeting_link: '' });
      loadNextSession();
    } catch (error) {
      console.error('Error adding session:', error);
    }
  };

  const addAvailability = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('availability_slots')
        .insert({
          profile_id: user.id,
          day_of_week: newAvailability.day_of_week,
          start_time: newAvailability.start_time,
          end_time: newAvailability.end_time
        });

      if (error) throw error;
      setIsAvailabilityDialogOpen(false);
      setNewAvailability({ day_of_week: 1, start_time: '09:00', end_time: '17:00' });
      loadAvailability();
    } catch (error) {
      console.error('Error adding availability:', error);
    }
  };

  const formatDay = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gray-50 dark:bg-gray-800 space-y-4">
        <User className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold text-foreground">No User Selected</h3>
        <p className="text-sm text-muted-foreground">Select a chat to view their profile and shared content.</p>
      </div>
    );
  }

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-full p-6 bg-gray-50 dark:bg-gray-800">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Skill Profile</h2>
      {selectedUser ? (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Skill Profile Section */}
          <Card className="shadow-sm">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <Brain className="h-5 w-5 text-purple-600" />
                Skill Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={profile?.avatar_url || '/placeholder.svg'}
                  alt={profile?.full_name || 'Profile'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-border"
                />
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{profile?.full_name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {profile?.bio || 'No bio provided'}
                  </p>
                </div>
              </div>
              
              {profile?.skills_teach && profile.skills_teach.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Can Teach:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills_teach.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-900 dark:bg-purple-800 dark:text-purple-100">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile?.skills_learn && profile.skills_learn.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Wants to Learn:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills_learn.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-900 dark:bg-blue-800 dark:text-blue-100">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile?.location && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {profile.location}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shared Resources Section */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <LinkIcon className="h-5 w-5 text-green-600" />
                Resources
              </CardTitle>
              {chatConnectionId && (
                <Button
                  onClick={() => setIsResourceDialogOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {resources.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No resources shared yet
                </p>
              ) : (
                <div className="space-y-2">
                  {resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <LinkIcon className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{resource.title}</p>
                          {resource.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {resource.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks Section */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <ListTodo className="h-5 w-5 text-orange-600" />
                Tasks
              </CardTitle>
              {chatConnectionId && (
                <Button
                  onClick={() => setIsTaskDialogOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No tasks yet
                </p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) => toggleTask(task.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          "text-sm font-medium",
                          task.completed && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.due_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Session Section */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                Next Session
              </CardTitle>
              {chatConnectionId && (
                <Button
                  onClick={() => setIsSessionDialogOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {nextSession ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    {format(new Date(nextSession.scheduled_at), 'MMMM d, yyyy')}
                  </div>
                  <div className="p-3 rounded-lg bg-accent/50 space-y-2">
                    <h4 className="font-medium">{nextSession.title}</h4>
                    {nextSession.description && (
                      <p className="text-sm text-muted-foreground">
                        {nextSession.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(nextSession.scheduled_at), 'h:mm a')}
                      </span>
                      <span>•</span>
                      <span>{nextSession.duration} minutes</span>
                    </div>
                    {nextSession.meeting_link && (
                      <a
                        href={nextSession.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                      >
                        Join Meeting
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No upcoming sessions
                </p>
              )}
            </CardContent>
          </Card>

          {/* Availability Section */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <Clock className="h-5 w-5 text-teal-600" />
                Availability
              </CardTitle>
              {user?.id === selectedUser?.id && (
                <Button
                  onClick={() => setIsAvailabilityDialogOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {availability.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No availability set
                </p>
              ) : (
                <div className="space-y-2">
                  {availability
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-accent/50"
                      >
                        <div className="w-20 text-sm font-medium">
                          {formatDay(slot.day_of_week)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(parse(slot.start_time, 'HH:mm', new Date()), 'h:mm a')}
                          {' - '}
                          {format(parse(slot.end_time, 'HH:mm', new Date()), 'h:mm a')}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-muted-foreground">
            Select a user to view their skill profile
          </p>
        </div>
      )}

      {/* Dialogs */}
      {/* Resource Dialog */}
      <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newResource.title}
                onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="Resource title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={newResource.url}
                onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newResource.description}
                onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="Briefly describe this resource..."
                rows={3}
              />
            </div>
            <Button 
              onClick={addResource} 
              className="w-full"
              disabled={!newResource.title || !newResource.url}
            >
              Add Resource
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="taskTitle">Title</Label>
              <Input
                id="taskTitle"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="Task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskDescription">Description (optional)</Label>
              <Textarea
                id="taskDescription"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="Task description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (optional)</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={newTask.due_date}
                onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))
                }
              />
            </div>
            <Button 
              onClick={addTask} 
              className="w-full"
              disabled={!newTask.title}
            >
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Dialog */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule New Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTitle">Title</Label>
              <Input
                id="sessionTitle"
                value={newSession.title}
                onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="Session title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionDescription">Description (optional)</Label>
              <Textarea
                id="sessionDescription"
                value={newSession.description}
                onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="What will you cover in this session?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Date and Time</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={newSession.scheduled_at}
                onChange={(e) => setNewSession(prev => ({ ...prev, scheduled_at: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select
                value={newSession.duration.toString()}
                onValueChange={(value) => setNewSession(prev => ({ ...prev, duration: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Meeting Link (optional)</Label>
              <Input
                id="meetingLink"
                value={newSession.meeting_link || ''}
                onChange={(e) => setNewSession(prev => ({ ...prev, meeting_link: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
            <Button 
              onClick={addSession} 
              className="w-full"
              disabled={!newSession.title || !newSession.scheduled_at}
            >
              Schedule Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <Select
                value={newAvailability.day_of_week.toString()}
                onValueChange={(value) => setNewAvailability(prev => ({ ...prev, day_of_week: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {formatDay(day)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newAvailability.start_time}
                  onChange={(e) => setNewAvailability(prev => ({ ...prev, start_time: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newAvailability.end_time}
                  onChange={(e) => setNewAvailability(prev => ({ ...prev, end_time: e.target.value }))
                  }
                />
              </div>
            </div>
            <Button 
              onClick={addAvailability} 
              className="w-full"
              disabled={!newAvailability.start_time || !newAvailability.end_time}
            >
              Add Time Slot
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkillProfileSidebar;