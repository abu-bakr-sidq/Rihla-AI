import { useMemo } from "react";
import { useRoute } from "wouter";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Navigation,
  Shield,
  Sparkles,
  TrainFront,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { MapExplorer } from "@/components/map-explorer";
import { useTrip } from "@/hooks/use-trips";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Activity = {
  time?: string;
  title?: string;
  description?: string;
  location?: string;
  lat?: number;
  lng?: number;
  cost?: number | string;
  imageUrl?: string | null;
  imageAlternatives?: string[];
  tips?: string;
  nearbyHighlights?: string[];
  travelSuggestion?: string;
  localFood?: string;
  transportationTip?: string;
  safetyTip?: string;
  culturalInsight?: string;
  category?: string;
};

type DayPlan = {
  day?: number;
  title?: string;
  theme?: string;
  activities?: Activity[];
};

function formatMoney(amount: unknown, currency = "USD") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return String(amount || "N/A");
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function parseTripDays(rawItinerary: unknown): DayPlan[] {
  if (typeof rawItinerary === "string") {
    try {
      return parseTripDays(JSON.parse(rawItinerary));
    } catch {
      return [];
    }
  }

  if (Array.isArray(rawItinerary)) return rawItinerary as DayPlan[];
  if (rawItinerary && typeof rawItinerary === "object" && Array.isArray((rawItinerary as any).itinerary)) {
    return (rawItinerary as any).itinerary as DayPlan[];
  }

  return [];
}

function parseCosts(rawCosts: unknown) {
  if (typeof rawCosts === "string") {
    try {
      return parseCosts(JSON.parse(rawCosts));
    } catch {
      return {};
    }
  }
  return rawCosts && typeof rawCosts === "object" ? rawCosts as Record<string, any> : {};
}

export default function TripDetail() {
  const [, params] = useRoute("/trips/:id");
  const tripId = params?.id || "";
  const { data: trip, isLoading } = useTrip(tripId);

  const days = useMemo(() => parseTripDays(trip?.itinerary), [trip?.itinerary]);
  const costs = useMemo(() => parseCosts(trip?.costBreakdown), [trip?.costBreakdown]);
  const dailyBudgets = Array.isArray(costs.daily) ? costs.daily : [];
  const currency = costs.currency || "USD";

  const mapPoints = useMemo(() => {
    return days.flatMap((day) =>
      Array.isArray(day.activities)
        ? day.activities
            .filter((activity) => Number(activity?.lat) && Number(activity?.lng))
            .map((activity) => ({
              lat: Number(activity.lat),
              lng: Number(activity.lng),
              title: activity.title || "Activity",
              description: activity.description || "",
            }))
        : []
    );
  }, [days]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 pt-24">
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="font-medium text-muted-foreground">Loading itinerary...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 pt-32 text-center">
          <h1 className="mb-4 text-3xl font-bold">Trip not found</h1>
          <p className="text-muted-foreground">This itinerary may have been deleted or is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />

      <div className="relative overflow-hidden border-b border-border bg-card px-4 pb-12 pt-32">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-primary/5 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="border border-border px-3 py-1 font-medium capitalize">
                  <Wallet className="mr-1 h-3 w-3" /> {trip.budget}
                </Badge>
                <Badge variant="secondary" className="border border-border px-3 py-1 font-medium capitalize">
                  <Clock className="mr-1 h-3 w-3" /> {trip.travelStyle}
                </Badge>
                <Badge className="bg-primary/10 px-3 py-1 font-medium text-primary hover:bg-primary/20">
                  <Sparkles className="mr-1 h-3 w-3" /> AI Generated
                </Badge>
              </div>

              <h1 className="mb-4 text-4xl font-bold text-foreground sm:text-6xl">{trip.destination}</h1>
              <div className="flex flex-wrap items-center gap-3 text-lg font-medium text-muted-foreground">
                <span className="inline-flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  {format(new Date(trip.startDate), "MMMM d")} - {format(new Date(trip.endDate), "MMMM d, yyyy")}
                </span>
                <span className="hidden text-border sm:inline">•</span>
                <span>{trip.days} Days</span>
                {costs.perDayBudget ? (
                  <>
                    <span className="hidden text-border sm:inline">•</span>
                    <span>{formatMoney(costs.perDayBudget, currency)} / day</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-3xl border border-border bg-background/70 p-5 backdrop-blur sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Total Budget</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{formatMoney(costs.total, currency)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Per Day</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{formatMoney(costs.perDayBudget, currency)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Cards Per Day</p>
                <p className="mt-2 text-2xl font-bold text-foreground">8</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Tabs defaultValue="itinerary" className="w-full">
          <div className="mb-8 flex justify-center overflow-x-auto pb-2 md:justify-start">
            <TabsList className="h-14 rounded-xl border border-border bg-card p-1 shadow-sm">
              <TabsTrigger value="itinerary" className="h-full rounded-lg px-6 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Navigation className="mr-2 h-4 w-4" /> Itinerary
              </TabsTrigger>
              <TabsTrigger value="map" className="h-full rounded-lg px-6 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MapPin className="mr-2 h-4 w-4" /> Interactive Map
              </TabsTrigger>
              <TabsTrigger value="budget" className="h-full rounded-lg px-6 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <DollarSign className="mr-2 h-4 w-4" /> Budget
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="itinerary" className="mt-0 space-y-8 outline-none">
            {days.length > 0 ? (
              days.map((day, index) => {
                const dayBudget = dailyBudgets[index];
                return (
                  <section key={`${day.day || index}-${day.title || "day"}`} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-gradient-to-r from-primary/10 via-background to-background px-6 py-6 sm:px-8">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Day {day.day || index + 1}</p>
                          <h2 className="mt-2 text-3xl font-bold text-foreground">{day.theme || day.title || "Exploration"}</h2>
                          <p className="mt-2 text-muted-foreground">{day.title || `A full day in ${trip.destination}`}</p>
                        </div>

                        {dayBudget ? (
                          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-background/80 p-4 sm:grid-cols-3">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Day Total</p>
                              <p className="mt-1 text-lg font-bold text-foreground">{formatMoney(dayBudget.total, currency)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Stay</p>
                              <p className="mt-1 text-lg font-semibold text-foreground">{formatMoney(dayBudget.stay, currency)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Food</p>
                              <p className="mt-1 text-lg font-semibold text-foreground">{formatMoney(dayBudget.food, currency)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Transport</p>
                              <p className="mt-1 text-lg font-semibold text-foreground">{formatMoney(dayBudget.transport, currency)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Activities</p>
                              <p className="mt-1 text-lg font-semibold text-foreground">{formatMoney(dayBudget.activities, currency)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Buffer</p>
                              <p className="mt-1 text-lg font-semibold text-foreground">{formatMoney(dayBudget.buffer, currency)}</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8 xl:grid-cols-4">
                      {(day.activities || []).map((activity, activityIndex) => {
                        const image = activity.imageUrl || activity.imageAlternatives?.[0] || null;
                        return (
                          <article key={`${activity.time || "slot"}-${activityIndex}-${activity.title || "activity"}`} className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                            {image ? (
                              <div className="h-44 w-full overflow-hidden bg-secondary">
                                <img src={image} alt={activity.title || "Trip activity"} className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <div className="flex h-44 items-center justify-center bg-gradient-to-br from-primary/10 via-secondary to-background">
                                <Sparkles className="h-10 w-10 text-primary/60" />
                              </div>
                            )}

                            <div className="space-y-4 p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{activity.time || "Anytime"}</p>
                                  <h3 className="mt-2 text-lg font-bold text-foreground">{activity.title || "Activity"}</h3>
                                </div>
                                <Badge variant="secondary" className="capitalize">
                                  {activity.category || "activity"}
                                </Badge>
                              </div>

                              <p className="text-sm leading-6 text-muted-foreground">{activity.description}</p>

                              <div className="space-y-2 text-sm">
                                {activity.location ? (
                                  <div className="inline-flex items-center rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-muted-foreground">
                                    <MapPin className="mr-1 h-3 w-3" /> {activity.location}
                                  </div>
                                ) : null}
                                {activity.cost !== undefined && activity.cost !== null ? (
                                  <div className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                                    <Wallet className="mr-1 h-3 w-3" /> {formatMoney(activity.cost, currency)}
                                  </div>
                                ) : null}
                              </div>

                              <div className="space-y-2 text-sm text-muted-foreground">
                                {activity.localFood ? (
                                  <p className="flex items-start gap-2">
                                    <UtensilsCrossed className="mt-0.5 h-4 w-4 text-primary" />
                                    <span>{activity.localFood}</span>
                                  </p>
                                ) : null}
                                {activity.transportationTip ? (
                                  <p className="flex items-start gap-2">
                                    <TrainFront className="mt-0.5 h-4 w-4 text-primary" />
                                    <span>{activity.transportationTip}</span>
                                  </p>
                                ) : null}
                                {activity.safetyTip ? (
                                  <p className="flex items-start gap-2">
                                    <Shield className="mt-0.5 h-4 w-4 text-primary" />
                                    <span>{activity.safetyTip}</span>
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">Itinerary details could not be parsed properly.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="map" className="mt-0 h-[600px] outline-none">
            <MapExplorer points={mapPoints} center={mapPoints.length > 0 ? [mapPoints[0].lat, mapPoints[0].lng] : [0, 0]} />
          </TabsContent>

          <TabsContent value="budget" className="mt-0 outline-none">
            <div className="mx-auto max-w-5xl space-y-6">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Trip Budget Breakdown</h3>
                    <p className="mt-2 text-muted-foreground">Overall spend plus daily cost splits for stay, food, transport, activities, and safety buffer.</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium text-muted-foreground">Total Estimate</p>
                    <p className="text-3xl font-bold text-primary">{formatMoney(costs.total, currency)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatMoney(costs.perDayBudget, currency)} per day</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {["stay", "food", "transport", "activities", "buffer"].map((key) => (
                    <div key={key} className="rounded-2xl border border-border bg-secondary/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{key}</p>
                      <p className="mt-2 text-2xl font-bold text-foreground">{formatMoney(costs[key], currency)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
                <h3 className="mb-6 text-2xl font-bold text-foreground">Per-Day Cost Plan</h3>
                <div className="space-y-4">
                  {dailyBudgets.length > 0 ? (
                    dailyBudgets.map((dayBudget: any) => (
                      <div key={dayBudget.day} className="rounded-2xl border border-border bg-secondary/20 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Day {dayBudget.day}</p>
                            <p className="mt-2 text-xl font-bold text-foreground">{formatMoney(dayBudget.total, currency)}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Stay: {dayBudget.hotelSuggestion || "Recommended hotel area"} • Meal: {dayBudget.mealSuggestion || "Local dining suggestion"}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                            <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                              <p className="text-muted-foreground">Stay</p>
                              <p className="font-semibold text-foreground">{formatMoney(dayBudget.stay, currency)}</p>
                            </div>
                            <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                              <p className="text-muted-foreground">Food</p>
                              <p className="font-semibold text-foreground">{formatMoney(dayBudget.food, currency)}</p>
                            </div>
                            <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                              <p className="text-muted-foreground">Transport</p>
                              <p className="font-semibold text-foreground">{formatMoney(dayBudget.transport, currency)}</p>
                            </div>
                            <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                              <p className="text-muted-foreground">Activities</p>
                              <p className="font-semibold text-foreground">{formatMoney(dayBudget.activities, currency)}</p>
                            </div>
                            <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                              <p className="text-muted-foreground">Buffer</p>
                              <p className="font-semibold text-foreground">{formatMoney(dayBudget.buffer, currency)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-muted-foreground">Detailed budget breakdown not available.</p>
                  )}
                </div>
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
