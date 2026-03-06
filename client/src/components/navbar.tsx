import { Link, useLocation } from "wouter";
import { Compass, User, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useUser();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Compass className="w-6 h-6 text-primary group-hover:-rotate-12 transition-transform duration-300" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-foreground">
                Odyssey<span className="text-primary">AI</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden md:block">
                      My Trips
                    </Link>
                    <Link href="/planner" className="hidden md:block">
                      <Button className="rounded-xl shadow-lg shadow-primary/20 hover-elevate">
                        Plan a Trip
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full bg-secondary w-10 h-10 hover-elevate">
                          <User className="w-5 h-5 text-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                        <DropdownMenuLabel className="font-display">
                          <p className="font-semibold text-foreground">{user.username}</p>
                          <p className="text-xs font-normal text-muted-foreground capitalize">{user.role}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setLocation("/dashboard")} className="cursor-pointer rounded-lg p-2">
                          <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                        </DropdownMenuItem>
                        {user.role === "admin" && (
                          <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer rounded-lg p-2">
                            <Settings className="w-4 h-4 mr-2" /> Admin Panel
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg p-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <LogOut className="w-4 h-4 mr-2" /> Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <Link href="/auth" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                      Sign In
                    </Link>
                    <Link href="/auth">
                      <Button className="rounded-xl shadow-lg shadow-primary/20 hover-elevate">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
