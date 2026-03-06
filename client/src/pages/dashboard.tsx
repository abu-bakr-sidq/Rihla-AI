import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useTrips, useDeleteTrip } from "@/hooks/use-trips";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Plus, Loader2, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: trips, isLoading: isTripsLoading } = useTrips();
  const deleteTrip = useDeleteTrip();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteTrip.mutateAsync(id);
      toast({ title: "Trip deleted", description: "Your itinerary has been removed." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-2">
              Welcome back, <span className="text-primary">{user.username}</span>
            </h1>
            <p className="text-muted-foreground text-lg">Manage your upcoming adventures.</p>
          </div>
          <Link href="/planner">
            <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover-elevate">
              <Plus className="w-5 h-5 mr-2" /> Plan New Trip
            </Button>
          </Link>
        </div>

        {isTripsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-3xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : trips && trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div 
                key={trip.id} 
                className="bg-card rounded-3xl border border-border overflow-hidden shadow-lg shadow-black/5 hover-elevate transition-all group flex flex-col"
              >
                <div className="h-40 bg-secondary relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <h3 className="text-white font-display font-bold text-2xl truncate">{trip.destination}</h3>
                    <p className="text-white/80 text-sm flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" /> {trip.days} Days • {trip.travelStyle}
                    </p>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    <span>
                      {format(new Date(trip.startDate), "MMM d, yyyy")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {trip.interests.slice(0, 3).map((interest, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                        {interest}
                      </span>
                    ))}
                    {trip.interests.length > 3 && (
                      <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                        +{trip.interests.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex gap-2">
                    <Link href={`/trips/${trip.id}`} className="flex-1">
                      <Button className="w-full rounded-xl" variant="secondary">View Itinerary</Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your itinerary for {trip.destination}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(trip.id)} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-3xl border border-border border-dashed p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold font-display text-foreground mb-2">No trips planned yet</h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Your dashboard is empty. Let our AI craft the perfect personalized itinerary for your next adventure.
            </p>
            <Link href="/planner">
              <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover-elevate">
                Start Planning
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
