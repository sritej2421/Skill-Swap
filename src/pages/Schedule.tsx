import { useState, useEffect, useRef, useCallback } from "react";
// Import your UI components
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import Lucide React icons
import {
  VideoIcon,
  MessageSquare,
  Clock,
  Calendar as CalendarIcon,
  X,
  PlusCircle,
  UserSearch,
  UserCheck,
} from "lucide-react";

// Import Supabase client and Auth context
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Schedule = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // States for the new event form fields
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState<Date | undefined>(
    new Date()
  );
  const [newEventStartTime, setNewEventStartTime] = useState("");
  const [newEventEndTime, setNewEventEndTime] = useState("");
  const [newSessionMode, setNewSessionMode] = useState("video");
  const [newEventType, setNewEventType] = useState("teaching"); // 'teaching' or 'learning'

  // State to hold the event being edited/rescheduled
  const [editingEventId, setEditingEventId] = useState(null);

  // States for participant search
  const [participantSearchTerm, setParticipantSearchTerm] = useState("");
  const [searchedParticipants, setSearchedParticipants] = useState([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [selectedParticipantName, setSelectedParticipantName] = useState("");
  const searchTimeoutRef = useRef(null); // Ref for debouncing the search

  // Function to fetch schedule data from Supabase
  const fetchSchedule = useCallback(async () => {
    console.log("Fetching schedule...");
    console.log("Current User:", user);

    if (!user) {
      setLoading(false);
      setError("Please log in to view your schedule.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          scheduled_by_profile:profiles!events_scheduled_by_user_id_fkey(full_name, avatar_url),
          participant_profile:profiles!events_participant_user_id_fkey(full_name, avatar_url)
          `
        )
        .or(
          `scheduled_by_user_id.eq.${user.id},participant_user_id.eq.${user.id}`
        )
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        throw error;
      }

      console.log("Fetched Data from Supabase:", data);

      const now = new Date();
      const upcoming = [];
      const past = [];

      data.forEach((event) => {
        // Determine the "other" participant based on who the current user is
        const otherParticipant =
          event.scheduled_by_user_id === user.id
            ? event.participant_profile // If current user scheduled, participant_profile is the other
            : event.scheduled_by_profile; // If current user is participant, scheduled_by_profile is the other

        const formattedEvent = {
          id: event.id,
          title: event.title,
          // Determine if the session is teaching or learning from the current user's perspective
          type:
            event.scheduled_by_user_id === user.id
              ? event.type // If user scheduled, use the event's type
              : event.type === "teaching"
              ? "learning" // If user is participant and it's a teaching event, they are learning
              : "teaching", // If user is participant and it's a learning event, they are teaching
          participant: otherParticipant?.full_name || "Unknown User",
          date: new Date(event.event_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          time: `${event.start_time.substring(
            0,
            5
          )} - ${event.end_time.substring(0, 5)}`,
          avatar: otherParticipant?.avatar_url || "/placeholder.svg",
          sessionType: event.session_mode,
          rawEvent: event, // Keep raw event data for rescheduling
        };

        const eventDateTime = new Date(
          `${event.event_date}T${event.start_time}`
        );
        console.log(
          `Event: ${
            event.title
          }, Event Date/Time: ${eventDateTime}, Current Time: ${now}, Is Upcoming: ${
            eventDateTime > now
          }`
        );

        if (eventDateTime > now) {
          upcoming.push(formattedEvent);
        } else {
          past.push(formattedEvent);
        }
      });

      setUpcomingEvents(upcoming);
      setPastEvents(past);

      console.log("Final Upcoming Events:", upcoming);
      console.log("Final Past Events:", past);
    } catch (err) {
      console.error("Error fetching schedule:", err.message);
      setError("Failed to load schedule. Please try again: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]); // Re-create fetchSchedule if user changes

  // Effect hook to call fetchSchedule on component mount or user change
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Function to handle deleting an event
  const handleDeleteEvent = async (eventId) => {
    if (
      !confirm(
        "Are you sure you want to delete this session? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("scheduled_by_user_id", user.id); // Ensure only the scheduler can delete

      if (error) {
        throw error;
      }

      alert("Session deleted successfully!");
      fetchSchedule(); // Re-fetch to update the lists
    } catch (err) {
      console.error("Error deleting session:", err.message);
      alert("Failed to delete session: " + err.message);
    }
  };

  // Function to handle opening the new session modal for scheduling
  const handleScheduleNewSession = () => {
    if (!user) {
      alert("Please log in to schedule a new session.");
      return;
    }
    // Reset all form fields and participant search/selection states
    setEditingEventId(null); // Not editing
    setNewEventTitle("");
    setNewEventDate(new Date());
    setNewEventStartTime("");
    setNewEventEndTime("");
    setNewSessionMode("video");
    setNewEventType("teaching");
    setParticipantSearchTerm("");
    setSearchedParticipants([]);
    setSelectedParticipantId("");
    setSelectedParticipantName("");
    setIsScheduleModalOpen(true);
  };

  // Function to handle opening the modal for rescheduling
  const handleRescheduleEvent = (event) => {
    if (!user) {
      alert("Please log in to reschedule a session.");
      return;
    }
    setEditingEventId(event.id); // Set the ID of the event being edited
    setNewEventTitle(event.title);
    setNewEventDate(new Date(event.rawEvent.event_date)); // Use raw date for accurate Date object
    setNewEventStartTime(event.rawEvent.start_time.substring(0, 5));
    setNewEventEndTime(event.rawEvent.end_time.substring(0, 5));
    setNewSessionMode(event.rawEvent.session_mode);
    setNewEventType(event.type); // Use the type from formatted event (teaching/learning from user's perspective)

    // Pre-fill participant for rescheduling
    setSelectedParticipantId(event.rawEvent.participant_user_id);
    // Find the actual other participant's full name from the rawEvent or profiles data
    const otherParticipantProfile =
      event.rawEvent.scheduled_by_user_id === user.id
        ? event.rawEvent.participant_profile
        : event.rawEvent.scheduled_by_profile;

    setSelectedParticipantName(otherParticipantProfile?.full_name || "Unknown User");
    setParticipantSearchTerm(otherParticipantProfile?.full_name || "Unknown User");
    setSearchedParticipants([]); // Clear search results

    setIsScheduleModalOpen(true);
  };


  // Debounced participant search handler
  const handleParticipantSearch = (e) => {
    const term = e.target.value;
    setParticipantSearchTerm(term);
    setSearchedParticipants([]); // Clear previous results when typing

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (term.length < 2) {
      // Only search if term is 2 characters or more
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .ilike("full_name", `%${term}%`) // Case-insensitive search
          .neq("id", user.id) // Exclude current user from results
          .limit(10); // Limit results

        if (error) throw error;

        setSearchedParticipants(data || []);
      } catch (err) {
        console.error("Error searching participants:", err.message);
        // Optionally display an error message in the UI
      }
    }, 300); // Debounce for 300ms
  };

  // Handle selection of a participant from search results
  const selectParticipant = (participant) => {
    setSelectedParticipantId(participant.id);
    setSelectedParticipantName(participant.full_name);
    setParticipantSearchTerm(participant.full_name); // Set search term to selected name
    setSearchedParticipants([]); // Clear search results
  };

  // Handle clearing the selected participant
  const clearSelectedParticipant = () => {
    setSelectedParticipantId("");
    setSelectedParticipantName("");
    setParticipantSearchTerm("");
    setSearchedParticipants([]);
  };

  // Function to handle submitting the new session form
  const handleNewSessionSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to schedule a session.");
      return;
    }

    if (
      !newEventTitle ||
      !selectedParticipantId ||
      !newEventDate ||
      !newEventStartTime ||
      !newEventEndTime
    ) {
      alert("Please fill in all required fields and select a participant.");
      return;
    }

    // Basic time validation: end time must be after start time
    const startTime = new Date(`1970-01-01T${newEventStartTime}:00`);
    const endTime = new Date(`1970-01-01T${newEventEndTime}:00`);
    if (endTime <= startTime) {
      alert("End time must be after start time.");
      return;
    }

    setLoading(true); // Set main loading state while submitting
    try {
      const eventData = {
        title: newEventTitle,
        type: newEventType,
        scheduled_by_user_id: user.id, // The current user is always the scheduler for new/rescheduled events
        participant_user_id: selectedParticipantId,
        event_date: newEventDate.toISOString().split("T")[0],
        start_time: newEventStartTime,
        end_time: newEventEndTime,
        session_mode: newSessionMode,
      };

      let result;
      if (editingEventId) {
        // Update existing event
        result = await supabase
          .from("events")
          .update(eventData)
          .eq("id", editingEventId)
          .eq("scheduled_by_user_id", user.id) // Ensure only the scheduler can update
          .select();
      } else {
        // Insert new event
        result = await supabase.from("events").insert([eventData]).select();
      }

      const { data, error } = result;

      if (error) {
        throw error;
      }

      console.log(editingEventId ? "Event updated:" : "New event inserted:", data);
      alert(editingEventId ? "Session rescheduled successfully!" : "Session scheduled successfully!");
      setIsScheduleModalOpen(false); // Close the modal
      fetchSchedule(); // Re-fetch to update the schedule lists
    } catch (err) {
      console.error(editingEventId ? "Error rescheduling session:" : "Error scheduling session:", err.message);
      alert(editingEventId ? "Failed to reschedule session: " + err.message : "Failed to schedule session: " + err.message);
    } finally {
      setLoading(false); // Reset main loading state
      setEditingEventId(null); // Clear editing state
    }
  };

  // --- Conditional Rendering for Loading and Error States ---
  if (loading && !error) {
    // Only show loading if no explicit error
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-lg text-muted-foreground">
          Loading your schedule...
        </p>
      </div>
    );
  }

  // Display error message if there's an error
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-red-500 p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Error Loading Schedule</h2>
        <p className="text-xl font-semibold">{error}</p>
        {user ? (
          <Button onClick={() => window.location.reload()} className="mt-6">
            Try Reloading
          </Button>
        ) : (
          <p className="mt-4 text-muted-foreground">
            If you're not logged in, please proceed to the login page.
          </p>
        )}
      </div>
    );
  }

  // --- Main Component Render ---
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Your Learning Schedule</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage your upcoming and past skill exchange sessions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>
                Select a date to view or schedule sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="border rounded-md"
              />
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleScheduleNewSession}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Schedule New Session
              </Button>
            </CardFooter>
          </Card>

          {/* Sessions Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="upcoming">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="upcoming">
                  Upcoming Sessions ({upcomingEvents.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past Sessions ({pastEvents.length})
                </TabsTrigger>
              </TabsList>

              {/* Upcoming Sessions Content */}
              <TabsContent value="upcoming" className="space-y-4">
                {upcomingEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    {user
                      ? "No upcoming sessions. Time to schedule some!"
                      : "Please log in to see your upcoming sessions."}
                  </p>
                ) : (
                  upcomingEvents.map((event) => (
                    <Card key={event.id} className="overflow-hidden">
                      <div
                        className={`h-1 ${
                          event.type === "teaching"
                            ? "bg-primary"
                            : "bg-secondary"
                        }`}
                      ></div>
                      <CardHeader className="flex flex-row items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={event.avatar}
                            alt={event.participant}
                          />
                          <AvatarFallback>
                            {event.participant?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="flex items-center justify-between">
                            {event.title}
                            <Badge
                              variant={
                                event.type === "teaching"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {event.type === "teaching"
                                ? "Teaching"
                                : "Learning"}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            with {event.participant}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm mb-2">
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="mr-2 h-4 w-4 opacity-70" />
                          <span>{event.time}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between gap-2 border-t bg-muted/40 px-6 py-3">
                        <Button size="sm" variant="outline" className="flex-1">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                        {event.sessionType === "video" ? (
                          <Button size="sm" className="flex-1">
                            <VideoIcon className="mr-2 h-4 w-4" />
                            Join Session
                          </Button>
                        ) : (
                          <Button size="sm" className="flex-1">
                            <UserSearch className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        )}
                        {/* Only allow scheduler to delete upcoming events */}
                        {user && event.rawEvent.scheduled_by_user_id === user.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full w-8 h-8 p-0"
                            onClick={() => handleDeleteEvent(event.id)}
                            title="Cancel Session"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Past Sessions Content */}
              <TabsContent value="past" className="space-y-4">
                {pastEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    {user
                      ? "No past sessions."
                      : "Please log in to see your past sessions."}
                  </p>
                ) : (
                  pastEvents.map((event) => (
                    <Card key={event.id} className="overflow-hidden opacity-80">
                      <div
                        className={`h-1 ${
                          event.type === "teaching"
                            ? "bg-primary"
                            : "bg-secondary"
                        }`}
                      ></div>
                      <CardHeader className="flex flex-row items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={event.avatar}
                            alt={event.participant}
                          />
                          <AvatarFallback>
                            {event.participant?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="flex items-center justify-between">
                            {event.title}
                            <Badge
                              variant={
                                event.type === "teaching"
                                  ? "default"
                                  : "secondary"
                              }
                              className="opacity-70"
                            >
                              {event.type === "teaching"
                                ? "Teaching"
                                : "Learning"}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            with {event.participant}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm mb-2">
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="mr-2 h-4 w-4 opacity-70" />
                          <span>{event.time}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between gap-2 border-t bg-muted/40 px-6 py-3">
                        <Button size="sm" variant="outline" className="flex-1">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                        {/* Reschedule button for past events */}
                        <Button size="sm" variant="outline" className="flex-1"
                          onClick={() => handleRescheduleEvent(event)} // Call handler
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Reschedule
                        </Button>
                        {/* Optionally allow deleting past event records, or adjust logic */}
                        {user && event.rawEvent.scheduled_by_user_id === user.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full w-8 h-8 p-0"
                            onClick={() => handleDeleteEvent(event.id)}
                            title="Delete Record"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />

      {/* New Schedule Session Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingEventId ? "Reschedule Session" : "Schedule New Session"}</DialogTitle>
            <DialogDescription>
              {editingEventId ? "Update the details to reschedule your session." : "Fill in the details for your new skill exchange session."}
            </DialogDescription>
          </DialogHeader>
          {/* Apply max-height and overflow-y-auto for scrollability */}
          <form
            onSubmit={handleNewSessionSubmit}
            className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto"
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Python Basics, Guitar Chords"
                required
              />
            </div>

            {/* Participant Search Field */}
            <div className="grid grid-cols-4 items-center gap-4 relative">
              <Label htmlFor="participantSearch" className="text-right">
                Participant
              </Label>
              <div className="col-span-3 flex flex-col">
                {selectedParticipantName ? (
                  <div className="flex items-center justify-between p-2 border rounded-md bg-green-50 text-green-700">
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />{" "}
                      {selectedParticipantName}
                    </span>
                    {/* Allow clearing participant only if creating a new event */}
                    {!editingEventId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={clearSelectedParticipant}
                        className="h-auto p-1 text-black"
                      >
                        <X className="h-4 w-4 text-black" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <Input
                      id="participantSearch"
                      type="text"
                      value={participantSearchTerm}
                      onChange={handleParticipantSearch}
                      className="w-full"
                      placeholder="Search participant by name"
                      autoComplete="off" // Prevent browser autocomplete
                      required // Make sure a participant is selected
                      disabled={!!editingEventId} // Disable search if editing
                    />
                    {/* Display search results below the input */}
                    {searchedParticipants.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg top-full max-h-48 overflow-y-auto">
                        {searchedParticipants.map((p) => (
                          <Button
                            key={p.id}
                            variant="ghost"
                            className="w-full justify-start text-black text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100"
                            onClick={() => selectParticipant(p)}
                            type="button" // Important to prevent form submission
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                className="text-white"
                                src={p.avatar_url}
                                alt={p.full_name}
                              />
                              <AvatarFallback className="text-white">
                                {p.full_name?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            {p.full_name}
                          </Button>
                        ))}
                      </div>
                    )}
                    {!selectedParticipantId &&
                      participantSearchTerm.length >= 2 &&
                      searchedParticipants.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          No users found.
                        </p>
                      )}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={newEventType} onValueChange={setNewEventType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teaching">Teaching</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calendar for Date Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Calendar
                mode="single"
                selected={newEventDate}
                onSelect={setNewEventDate} // Allow changing date for rescheduling
                className="col-span-3 border rounded-md"
                initialFocus
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start_time" className="text-right">
                Start Time
              </Label>
              <Input
                id="start_time"
                type="time"
                value={newEventStartTime}
                onChange={(e) => setNewEventStartTime(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end_time" className="text-right">
                End Time
              </Label>
              <Input
                id="end_time"
                type="time"
                value={newEventEndTime}
                onChange={(e) => setNewEventEndTime(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mode" className="text-right">
                Mode
              </Label>
              <Select value={newSessionMode} onValueChange={setNewSessionMode}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video Call</SelectItem>
                  <SelectItem value="in-person">In-person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={loading || !selectedParticipantId}
              >
                {loading ? (editingEventId ? "Rescheduling..." : "Scheduling...") : (editingEventId ? "Reschedule Session" : "Schedule Session")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;