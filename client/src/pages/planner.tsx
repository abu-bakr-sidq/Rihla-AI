import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { addDays, format } from "date-fns";
import { ArrowLeft, ArrowRight, Calendar, Heart, Map, Plane, Sparkles, Wallet } from "lucide-react";
import { useUser } from "@/hooks/use-auth";
import { useCreateTrip, useGenerateTrip } from "@/hooks/use-trips";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const TRAVEL_STYLES = [
  {
    value: "luxury",
    label: "Luxury",
    description: "Elite stays, fine dining, private comfort",
  },
  {
    value: "history",
    label: "History",
    description: "Ancient monuments, museums, sacred heritage",
  },
  {
    value: "adventure",
    label: "Adventure",
    description: "Treks, outdoor thrills, active exploration",
  },
  {
    value: "scenery",
    label: "Scenery",
    description: "Viewpoints, landscapes, photography spots",
  },
  {
    value: "urban",
    label: "Urban",
    description: "Modern districts, skyline, premium shopping",
  },
  {
    value: "wellness",
    label: "Wellness",
    description: "Spas, calm rituals, restorative pacing",
  },
  {
    value: "halal-friendly",
    label: "Halal Friendly",
    description: "Halal dining and prayer-aware routing",
  },
  {
    value: "coastal",
    label: "Coastal",
    description: "Beaches, promenades, marine experiences",
  },
] as const;

function getTravelStyleLabel(value: string) {
  return TRAVEL_STYLES.find((style) => style.value === value)?.label || value;
}

const INTERESTS = [
  "Culture & History",
  "Food & Culinary",
  "Nature & Outdoors",
  "Art & Museums",
  "Nightlife",
  "Shopping",
  "Relaxation",
  "Adventure Sports",
];

export default function TripPlanner() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const generateTrip = useGenerateTrip();
  const createTrip = useCreateTrip();

  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState("moderate");
  const [travelStyle, setTravelStyle] = useState("luxury");
  const [interests, setInterests] = useState<string[]>([]);

  const isPending = generateTrip.isPending || createTrip.isPending;

  if (isUserLoading) return null;
  if (!user) {
    setLocation("/auth");
    return null;
  }

  const tripStart = startDate ? new Date(startDate) : null;
  const tripEnd = tripStart ? addDays(tripStart, Math.max(1, days) - 1) : null;

  const handleNext = () => {
    if (step === 1 && (!destination || !startDate)) {
      toast({
        title: "Incomplete",
        description: "Please provide a destination and start date.",
        variant: "destructive",
      });
      return;
    }

    if (step === 3 && interests.length === 0) {
      toast({
        title: "Select interests",
        description: "Please select at least one interest.",
        variant: "destructive",
      });
      return;
    }

    setStep((current) => Math.min(4, current + 1));
  };

  const handleGenerate = async () => {
    if (!tripStart || !tripEnd) return;

    try {
      const result = await generateTrip.mutateAsync({
        destination,
        days,
        budget,
        travelStyle,
        interests,
      });

      const trip = await createTrip.mutateAsync({
        destination,
        startDate: tripStart.toISOString(),
        endDate: tripEnd.toISOString(),
        days,
        budget,
        travelStyle,
        interests,
        itinerary: result.itinerary,
        costBreakdown: result.costBreakdown,
      });

      toast({
        title: "Success!",
        description: "Your AI itinerary has been crafted.",
      });
      setLocation(`/trips/${trip.id}`);
    } catch (err: any) {
      toast({
        title: "Generation failed",
        description: err?.message || "Unable to generate your itinerary right now.",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <Map className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">Where and When?</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination (City, Country)</Label>
                <Input
                  id="destination"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="e.g. Tokyo, Japan"
                  className="h-14 rounded-xl text-lg"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start">Start Date</Label>
                  <Input
                    id="start"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="h-14 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days">Duration (Days)</Label>
                  <Input
                    id="days"
                    type="number"
                    min={1}
                    max={14}
                    value={days}
                    onChange={(event) => setDays(Math.max(1, Number(event.target.value) || 1))}
                    className="h-14 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">How do you travel?</h2>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="text-base">Budget Level</Label>
                <RadioGroup value={budget} onValueChange={setBudget} className="grid grid-cols-3 gap-4">
                  {["budget", "moderate", "luxury"].map((value) => (
                    <div key={value}>
                      <RadioGroupItem value={value} id={`budget-${value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`budget-${value}`}
                        className="flex cursor-pointer flex-col items-center justify-between rounded-xl border-2 border-border bg-transparent p-4 transition-all hover:bg-secondary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <span className="font-semibold capitalize">{value}</span>
                        <span className="mt-1 text-xs text-muted-foreground">
                          {value === "budget" && "$"}
                          {value === "moderate" && "$$"}
                          {value === "luxury" && "$$$"}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Travel Style</Label>
                <RadioGroup value={travelStyle} onValueChange={setTravelStyle} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {TRAVEL_STYLES.map((style) => (
                    <div key={style.value}>
                      <RadioGroupItem value={style.value} id={`style-${style.value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`style-${style.value}`}
                        className="flex min-h-28 cursor-pointer flex-col items-start justify-between rounded-xl border-2 border-border bg-transparent p-4 text-left transition-all hover:bg-secondary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <span className="font-semibold">{style.label}</span>
                        <span className="mt-2 text-sm leading-relaxed text-muted-foreground">{style.description}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">What interests you?</h2>
            </div>

            <p className="mb-6 text-muted-foreground">Select all that apply. We'll tailor activities to your tastes.</p>

            <div className="grid grid-cols-2 gap-4">
              {INTERESTS.map((interest) => {
                const isChecked = interests.includes(interest);
                return (
                  <label
                    key={interest}
                    className={`flex cursor-pointer items-start space-x-3 rounded-xl border-2 p-4 transition-all ${isChecked ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"}`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setInterests((current) => [...current, interest]);
                          return;
                        }
                        setInterests((current) => current.filter((item) => item !== interest));
                      }}
                      className="mt-0.5"
                    />
                    <span className="text-sm font-medium leading-tight">{interest}</span>
                  </label>
                );
              })}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 py-4 text-center">
            {tripStart && tripEnd && (
              <div className="mx-auto mb-6 flex max-w-md items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trip Duration</p>
                    <p className="text-sm font-bold text-foreground">
                      {format(tripStart, "MMM d")} - {format(tripEnd, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="h-7 rounded-lg">
                  {days} Days
                </Badge>
              </div>
            )}

            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>

            <h2 className="mb-4 font-display text-3xl font-bold text-foreground">Ready to Generate!</h2>
            <p className="mx-auto mb-8 max-w-md text-lg leading-relaxed text-muted-foreground">
              We'll create a {days}-day {budget} itinerary for <span className="font-bold text-foreground">{destination}</span> shaped around your <span className="font-bold text-foreground">{getTravelStyleLabel(travelStyle)}</span> travel style and interests.
            </p>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex min-h-screen items-center justify-center px-4 pb-12 pt-24 sm:px-6">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium text-muted-foreground">Step {step} of 4</span>
              <span className="text-sm font-medium text-primary">
                {step === 1 && "Destination & Dates"}
                {step === 2 && "Budget & Style"}
                {step === 3 && "Interests"}
                {step === 4 && "Confirmation"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "25%" }}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-10">
            {isPending && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 p-8 backdrop-blur-sm">
                <div className="relative h-20 w-20">
                  <div className="absolute inset-0 animate-spin rounded-full border-t-2 border-primary" />
                  <Plane className="absolute inset-0 m-auto h-8 w-8 animate-pulse text-primary" />
                </div>
                <h3 className="mt-6 mb-2 text-center font-display text-2xl font-bold text-foreground">Crafting Your Journey</h3>
                <p className="max-w-xs text-center text-muted-foreground">
                  Our planner is building unique day-by-day cards, routing, and daily cost splits for your trip.
                </p>
              </div>
            )}

            <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

            <div className="mt-auto flex justify-between border-t border-border pt-6">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep((current) => current - 1)} className="h-12 rounded-xl px-6">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button onClick={handleNext} className="h-12 rounded-xl px-8">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleGenerate} disabled={isPending} className="h-12 rounded-xl bg-primary px-10 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90">
                  Generate Trip <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
