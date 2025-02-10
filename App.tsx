import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "../utils/store";
import { Icons } from "../components/Icons";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/utils/auth";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Import images
import lapiskaLogo from "/public/12ac1aa0-a8f5-44bb-a5de-c008c32afaf7/lapiska logo.jpg";

const VOICE_COMMANDS = [
  { command: "schedule meeting", action: "meetings", description: "Schedule a new meeting" },
  { command: "make call", action: "call", description: "Make or schedule a call" },
  { command: "send email", action: "communications", description: "Compose and send an email" },
  { command: "send message", action: "sms", description: "Send an SMS" },
  { command: "post update", action: "social-media", description: "Post to social media" },
  { command: "show contacts", action: "contacts", description: "View and manage contacts" },
  { command: "help", action: "help", description: "Show available commands" },
] as const;

const MENU_ITEMS = [
  { title: "Meetings", icon: "calendar", route: "/meetings", bgClass: "from-blue-500 to-blue-600" },
  { title: "Communication", icon: "messageSquare", route: "/communication-hub", bgClass: "from-purple-500 to-purple-600" },
  { title: "Social", icon: "share2", route: "/social-media", bgClass: "from-pink-500 to-pink-600" },
  { title: "Contacts", icon: "users", route: "/contacts", bgClass: "from-green-500 to-green-600" },
  { title: "Settings", icon: "settings", route: "/settings", bgClass: "from-gray-500 to-gray-600" },
] as const;

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function App() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showLogin, setShowLogin] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([
    {
      id: '1',
      title: 'Welcome to Lapiska',
      message: 'Get started by connecting your accounts',
      time: new Date().toISOString(),
      read: false
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const [isListening, setIsListening] = React.useState(false);
  const [showCommands, setShowCommands] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState<{
    show: boolean;
    action: string;
    description: string;
    onConfirm: () => void;
  }>({ show: false, action: "", description: "", onConfirm: () => {} });

  const processVoiceCommand = (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    
    if (lowerTranscript.includes("help")) {
      setShowCommands(true);
      return;
    }

    const matchedCommand = VOICE_COMMANDS.find(cmd => 
      lowerTranscript.includes(cmd.command)
    );

    if (matchedCommand) {
      setConfirmation({
        show: true,
        action: matchedCommand.command,
        description: `Would you like to ${matchedCommand.description}?`,
        onConfirm: () => {
          navigate(matchedCommand.action);
          setConfirmation(prev => ({ ...prev, show: false }));
        }
      });
    } else {
      toast.error("Command not recognized. Say 'help' to see available commands.");
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error("Speech recognition is not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      processVoiceCommand(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Error occurred while listening");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const { meetings } = useStore();
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const todaysMeetings = meetings.filter(
    (m) => format(new Date(m.startTime), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${lapiskaLogo})` }}
    >
      <div className="bg-black/70 backdrop-blur-sm min-h-screen">
        <nav className="bg-black/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <img 
                  src={lapiskaLogo} 
                  alt="Lapiska" 
                  className="w-10 h-10 rounded-full"
                />
                <h1 className="text-2xl font-bold text-white">Lapiska Personal Assistant</h1>
              </div>
              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="relative">
                          <Icons.bell className="w-5 h-5 text-white" />
                          {unreadCount > 0 && (
                            <Badge 
                              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
                            >
                              {unreadCount}
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4">
                          <h3 className="font-semibold">Notifications</h3>
                          {notifications.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No notifications</p>
                          ) : (
                            <div className="space-y-2">
                              {notifications.map((notification) => (
                                <div 
                                  key={notification.id} 
                                  onClick={() => markAsRead(notification.id)}
                                  className={cn(
                                    "relative overflow-hidden",
                                    "before:absolute before:inset-0 before:bg-black/20 before:z-10",
                                    "p-3 rounded-lg",
                                    notification.read ? "bg-gray-50" : "bg-blue-50"
                                  )}
                                >
                                  <h4 className="font-medium">{notification.title}</h4>
                                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(notification.time).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <img 
                      src={user.photoURL || undefined} 
                      alt={user.displayName || 'User'} 
                      className="w-8 h-8 rounded-full"
                    />
                    <Button variant="ghost" onClick={signOut} className="text-white">
                      <Icons.logout className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setShowLogin(true)} className="text-white bg-blue-600 hover:bg-blue-700">
                    Login
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => navigate("/meetings")}
                >
                  <Icons.calendar className="w-4 h-4 mr-2" />
                  Meetings
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/communication-hub")}
                >
                  <Icons.messageSquare className="w-4 h-4 mr-2" />
                  Communication
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/social-media")}
                >
                  <Icons.share2 className="w-4 h-4 mr-2" />
                  Social
                </Button>
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.title}
                onClick={() => navigate(item.route)}
                className={cn(
                  "p-8 rounded-xl shadow-lg text-white transition-all hover:scale-105 hover:before:bg-black/40",
                  "bg-gradient-to-br",
                  item.bgClass
                )}
              >
                {React.createElement(Icons[item.icon as keyof typeof Icons] || Icons.settings, {
                  className: "w-12 h-12 mb-4 mx-auto",
                })}
                <h2 className="text-lg font-semibold text-center relative z-20">{item.title}</h2>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Today's Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                {todaysMeetings.length === 0 ? (
                  <p className="text-muted-foreground">No meetings scheduled for today</p>
                ) : (
                  <div className="space-y-4">
                    {todaysMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="flex justify-between items-center p-4 rounded-lg border"
                      >
                        <div>
                          <h3 className="font-medium">{meeting.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(meeting.startTime), 'HH:mm')} -{' '}
                            {format(new Date(meeting.endTime), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        <Button
          size="lg"
          className={`fixed bottom-8 left-8 rounded-full w-12 h-12 shadow-lg ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          onClick={startListening}
        >
          <Icons.mic className="w-6 h-6 text-white" />
        </Button>

        <Dialog open={confirmation.show} onOpenChange={(open) => setConfirmation(prev => ({ ...prev, show: open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>{confirmation.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmation(prev => ({ ...prev, show: false }))}>Cancel</Button>
              <Button onClick={confirmation.onConfirm}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}