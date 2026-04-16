import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Sun, ShoppingBag, Users, Calendar, TestTube, User, MessageCircle } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (email: string) => {
    if (!email) return '';
    return email.split('@')[0].charAt(0).toUpperCase();
  };

  return (
    <header className="w-full z-50 flex justify-center">
      <nav
        className={cn(
          "flex items-center",
          "bg-white/[0.98] dark:bg-[#151320]/[0.98] backdrop-blur-3xl",
          "rounded-full",
          "relative",
          "before:content-[''] before:absolute before:inset-0 before:rounded-full",
          "before:p-[3px]",
          "before:bg-gradient-to-r from-primary via-purple-500 to-primary",
          "before:blur-[20px]",
          "before:opacity-100 dark:before:opacity-95",
          "before:-z-10",
          "border border-primary/80 dark:border-[#3a2e5a]/90",
          "shadow-2xl dark:shadow-3xl dark:shadow-primary/30",
          "px-4 py-2",
          "mt-4",
          "transition-all duration-300 ease-in-out",
          "hover:bg-white dark:hover:bg-[#151320]",
          "hover:border-primary dark:hover:border-[#3a2e5a]",
          "hover:shadow-3xl dark:hover:shadow-primary/40"
        )}
        style={{ minHeight: 56 }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group select-none relative z-10 pr-4">
          <span className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md border border-white/20 transition-transform group-hover:scale-110">
            S
          </span>
          <span className="font-playfair text-lg font-semibold text-foreground group-hover:text-primary transition-colors tracking-wide">
            SkillSwap
          </span>
        </Link>

        {/* Central Nav Links and Right Section - combined to control overall width */}
        <div className="flex items-center gap-4 relative z-10">
          {/* Center: Nav Links with icons */}
          <div className="flex items-center gap-2 mr-4">
             <Link 
              to="/marketplace" 
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-foreground/90 hover:bg-accent/50 hover:text-foreground transition-all duration-300 ease-in-out whitespace-nowrap"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Marketplace</span>
            </Link>
            <Link 
              to="/matches" 
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-foreground/90 hover:bg-accent/50 hover:text-foreground transition-all duration-300 ease-in-out whitespace-nowrap"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Matches</span>
            </Link>
            <Link 
              to="/chat" 
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-foreground/90 hover:bg-accent/50 hover:text-foreground transition-all duration-300 ease-in-out whitespace-nowrap"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </Link>
            <Link 
              to="/schedule" 
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-foreground/90 hover:bg-accent/50 hover:text-foreground transition-all duration-300 ease-in-out whitespace-nowrap"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Schedule</span>
            </Link>
            <Link 
              to="/test" 
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-foreground/90 hover:bg-accent/50 hover:text-foreground transition-all duration-300 ease-in-out whitespace-nowrap"
            >
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">Take Test</span>
            </Link>
          </div>

          {/* Right: Theme toggle & Profile */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-300 ease-in-out"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative h-9 w-9 rounded-full cursor-pointer">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-9 w-9 border-2 border-primary/80 dark:border-border/40 transition-all duration-300 hover:border-primary hover:shadow-md">
                            <AvatarImage src={user?.avatar_url} alt={user?.email} />
                            <AvatarFallback className="bg-primary/50 text-primary font-bold text-base">
                              {user?.email ? getInitials(user.email) : ''}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user?.email}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border border-border/40 mt-2 bg-background/95 backdrop-blur-xl">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.email?.split('@')[0]}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="ghost" className="rounded-full px-4 py-2 text-base font-medium hover:bg-accent/50 transition-all duration-300 ease-in-out">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="rounded-full px-4 py-2 text-base font-medium bg-gradient-to-r from-primary to-purple-500 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 ease-in-out">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
