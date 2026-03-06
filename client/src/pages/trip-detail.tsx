import { useRoute } from "wouter";
import { useTrip } from "@/hooks/use-trips";
import { Navbar } from "@/components/navbar";
import { MapExplorer } from "@/components/map-explorer";
import { Calendar, Clock, MapPin, Wallet, Sparkles, Navigation, DollarSign, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TripDetail() {
  const [, params] = useRoute("/trips/:id");
  const tripId = params ? parseInt(params.id) : 0;
  
  const { data: trip, isLoading } = useTrip(tripId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading itinerary...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background pt-32 px-4 text-center">
        <Navbar />
        <h1 className="text-3xl font-bold mb-4">Trip not found</h1>
        <p className="text-muted-foreground">This itinerary may have been deleted.</p>
      </div>
    );
  }

  // Parse itinerary. Fallback if it's stringified.
  let itineraryData = trip.itinerary;
  if (typeof itineraryData === 'string') {
    try { itineraryData = JSON.parse(itineraryData); } catch (e) {}
  }
  
  // Safe extraction of days. We expect an array of day objects.
  const days = Array.isArray(itineraryData?.itinerary) ? itineraryData.itinerary : (Array.isArray(itineraryData) ? itineraryData : []);
  
  // Extract map points from itinerary if possible
  const mapPoints: any[] = [];
  days.forEach((day: any) => {
    if (Array.isArray(day.activities)) {
      day.activities.forEach((act: any) => {
        const lat = Number(act.lat);
        const lng = Number(act.lng);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0) {
          mapPoints.push({
            lat,
            lng,
            title: act.title || 'Activity',
            description: act.description || ''
          });
        }
      });
    }
  });
          });
        }
      });
    }
  });

  // Parse cost Breakdown
  let costs = trip.costBreakdown;
  if (typeof costs === 'string') {
    try { costs = JSON.parse(costs); } catch (e) {}
  }
  const costCategories = costs ? Object.entries(costs).filter(([k]) => k !== 'total') : [];

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      {/* Hero Header */}
      <div className="bg-card border-b border-border pt-32 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="px-3 py-1 font-medium capitalize border border-border">
                  <Wallet className="w-3 h-3 mr-1" /> {trip.budget}
                </Badge>
                <Badge variant="secondary" className="px-3 py-1 font-medium capitalize border border-border">
                  <Clock className="w-3 h-3 mr-1" /> {trip.travelStyle}
                </Badge>
                <Badge className="px-3 py-1 font-medium bg-primary/10 text-primary hover:bg-primary/20">
                  <Sparkles className="w-3 h-3 mr-1" /> AI Generated
                </Badge>
              </div>
              <h1 className="text-4xl sm:text-6xl font-display font-bold text-foreground mb-4">
                {trip.destination}
              </h1>
              <div className="flex items-center text-muted-foreground text-lg font-medium">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                {format(new Date(trip.startDate), "MMMM d")} — {format(new Date(trip.endDate), "MMMM d, yyyy")}
                <span className="mx-3 text-border">•</span>
                <span>{trip.days} Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="itinerary" className="w-full">
          <div className="flex justify-center md:justify-start mb-8 overflow-x-auto pb-2">
            <TabsList className="bg-card border border-border h-14 p-1 rounded-xl shadow-sm">
              <TabsTrigger value="itinerary" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 h-full text-base">
                <Navigation className="w-4 h-4 mr-2" /> Itinerary
              </TabsTrigger>
              <TabsTrigger value="map" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 h-full text-base">
                <MapPin className="w-4 h-4 mr-2" /> Interactive Map
              </TabsTrigger>
              <TabsTrigger value="budget" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 h-full text-base">
                <DollarSign className="w-4 h-4 mr-2" /> Budget
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="itinerary" className="mt-0 outline-none">
            <div className="space-y-8">
              {days.length > 0 ? days.map((day: any, idx: number) => (
                <div key={idx} className="bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary/20" />
                  <h3 className="text-2xl font-bold font-display text-foreground mb-6 flex items-center">
                    <span className="text-primary mr-3">Day {idx + 1}</span> 
                    {day.theme || day.title || "Exploration"}
                  </h3>
                  
                  <div className="space-y-6 ml-4 border-l-2 border-secondary pl-6">
                    {Array.isArray(day.activities) ? day.activities.map((activity: any, actIdx: number) => (
                      <div key={actIdx} className="relative">
                        <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary z-10" />
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          {activity.time && (
                            <div className="sm:w-24 shrink-0 pt-0.5">
                              <span className="font-semibold text-sm text-muted-foreground">{activity.time}</span>
                            </div>
                          )}
                          <div className="flex-1 bg-secondary/30 rounded-2xl p-5 border border-border/50 hover:bg-secondary/50 transition-colors">
                            <h4 className="font-bold text-lg text-foreground mb-2 flex items-center">
                              {activity.name || activity.title}
                            </h4>
                            <p className="text-muted-foreground leading-relaxed">
                              {activity.description}
                            </p>
                            {(activity.location || activity.cost) && (
                              <div className="mt-4 flex flex-wrap gap-3">
                                {activity.location && (
                                  <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-background px-2.5 py-1 rounded-md border border-border">
                                    <MapPin className="w-3 h-3 mr-1" /> {activity.location}
                                  </span>
                                )}
                                {activity.cost && (
                                  <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    <Wallet className="w-3 h-3 mr-1" /> {activity.cost}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="text-muted-foreground italic">No activities structured for this day.</p>
                    )}
                  </div>
                </div>
              )) : (
                <div className="bg-card rounded-2xl p-8 border border-border text-center">
                  <p className="text-muted-foreground">Itinerary details could not be parsed properly.</p>
                  <pre className="mt-4 text-left bg-secondary p-4 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(itineraryData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="map" className="mt-0 outline-none h-[600px]">
            <MapExplorer 
              points={mapPoints} 
              center={mapPoints.length > 0 ? [mapPoints[0].lat, mapPoints[0].lng] : [0,0]} 
            />
          </TabsContent>

          <TabsContent value="budget" className="mt-0 outline-none">
            <div className="bg-card rounded-3xl border border-border p-6 sm:p-10 shadow-sm max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold font-display text-foreground">Estimated Costs</h3>
                {costs?.total && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Estimate</p>
                    <p className="text-3xl font-bold text-primary">{costs.total}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {costCategories.length > 0 ? costCategories.map(([category, amount]: [string, any]) => (
                  <div key={category} className="flex items-center justify-between p-4 rounded-xl bg-secondary/40 border border-border hover:bg-secondary/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border border-border shadow-sm">
                        <DollarSign className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="font-semibold text-foreground capitalize">{category}</span>
                    </div>
                    <span className="font-bold text-lg">{amount}</span>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-8">Detailed budget breakdown not available.</p>
                )}
              </div>
              
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  * Note: These are AI-estimated costs and do not include flights unless specified. Prices vary by season.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
