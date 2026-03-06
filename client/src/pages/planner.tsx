import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/use-auth";
import { useGenerateTrip, useCreateTrip } from "@/hooks/use-trips";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, ArrowLeft, Plane, Map, Wallet, Heart, Calendar, Sparkles } from "lucide-react";
import { addDays, format } from "date-fns";

const INTERESTS = [
  "Culture & History", "Food & Culinary", "Nature & Outdoors", 
  "Art & Museums", "Nightlife", "Shopping", "Relaxation", "Adventure Sports"
];

export default function TripPlanner() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const generateTrip = useGenerateTrip();
  const createTrip = useCreateTrip();

  const [step, setStep] = useState(1);
  
  // Form State
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState("moderate");
  const [travelStyle, setTravelStyle] = useState("balanced");
  const [interests, setInterests] = useState<string[]>([]);

  if (isUserLoading) return null;
  if (!user) {
    setLocation("/auth");
    return null;
  }

  const handleNext = () => {
    if (step === 1 && (!destination || !startDate)) {
      toast({ title: "Incomplete", description: "Please provide a destination and start date.", variant: "destructive" });
      return;
    }
    if (step === 3 && interests.length === 0) {
      toast({ title: "Select interests", description: "Please select at least one interest.", variant: "destructive" });
      return;
    }
    setStep(s => Math.min(4, s + 1));
  };

  const handleGenerate = async () => {
    try {
      // 1. Ask AI to generate itinerary
      const result = await generateTrip.mutateAsync({
        destination,
        days,
        budget,
        travelStyle,
        interests
      });

      // Calculate end date
      const end = addDays(new Date(startDate), days - 1);

      // 2. Save it to DB
      const trip = await createTrip.mutateAsync({
        destination,
        startDate: new Date(startDate).toISOString(),
        endDate: end.toISOString(),
        days,
        budget,
        travelStyle,
        interests,
        itinerary: result.itinerary,
        costBreakdown: result.costBreakdown,
      });

      toast({ title: "Success!", description: "Your AI itinerary has been crafted." });
      setLocation(`/trips/${trip.id}`);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    }
  };

    const end = new Date(startDate);
    end.setDate(end.getDate() + days - 1);
    const endDateStr = end.toISOString().split('T')[0];

    return (
      <div className="flex-1 space-y-4">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Trip Dates</p>
              <p className="font-bold text-foreground">{format(new Date(startDate), "MMM d")} - {format(end, "MMM d, yyyy")}</p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-lg">{days} Days</Badge>
        </div>
        
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-bold font-display text-foreground mb-4">Ready to Generate!</h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
          We'll create a {days}-day {budget} itinerary for {destination}, focusing on {interests.join(', ')}.
        </p>
      </div>
    );
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl"><Map className="w-6 h-6 text-primary" /></div>
              <h2 className="text-2xl font-bold font-display text-foreground">Where and When?</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination (City, Country)</Label>
                <Input 
                  id="destination" 
                  value={destination} 
                  onChange={e => setDestination(e.target.value)} 
                  placeholder="e.g. Tokyo, Japan" 
                  className="h-14 text-lg rounded-xl"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Start Date</Label>
                  <Input 
                    id="start" 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    min={new Date().toISOString().split('T')[0]}
                    className="h-14 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Duration (Days)</Label>
                  <Input 
                    id="days" 
                    type="number" 
                    min={1} max={14} 
                    value={days} 
                    onChange={e => setDays(Number(e.target.value))} 
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
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl"><Wallet className="w-6 h-6 text-primary" /></div>
              <h2 className="text-2xl font-bold font-display text-foreground">How do you travel?</h2>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="text-base">Budget Level</Label>
                <RadioGroup value={budget} onValueChange={setBudget} className="grid grid-cols-3 gap-4">
                  {['budget', 'moderate', 'luxury'].map(b => (
                    <div key={b}>
                      <RadioGroupItem value={b} id={`b-${b}`} className="peer sr-only" />
                      <Label htmlFor={`b-${b}`} className="flex flex-col items-center justify-between rounded-xl border-2 border-border bg-transparent p-4 hover:bg-secondary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                        <span className="capitalize font-semibold">{b}</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {b === 'budget' && '$'}
                          {b === 'moderate' && '$$'}
                          {b === 'luxury' && '$$$'}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Travel Pace</Label>
                <RadioGroup value={travelStyle} onValueChange={setTravelStyle} className="grid grid-cols-3 gap-4">
                  {['relaxed', 'balanced', 'packed'].map(p => (
                    <div key={p}>
                      <RadioGroupItem value={p} id={`p-${p}`} className="peer sr-only" />
                      <Label htmlFor={`p-${p}`} className="flex flex-col items-center justify-between rounded-xl border-2 border-border bg-transparent p-4 hover:bg-secondary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                        <span className="capitalize font-semibold">{p}</span>
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
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl"><Heart className="w-6 h-6 text-primary" /></div>
              <h2 className="text-2xl font-bold font-display text-foreground">What interests you?</h2>
            </div>
            <p className="text-muted-foreground mb-6">Select all that apply. We'll tailor activities to your tastes.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              {INTERESTS.map(interest => (
                <label key={interest} className={`flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${interests.includes(interest) ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}>
                  <Checkbox 
                    checked={interests.includes(interest)}
                    onCheckedChange={(checked) => {
                      if (checked) setInterests([...interests, interest]);
                      else setInterests(interests.filter(i => i !== interest));
                    }}
                    className="mt-0.5"
                  />
                  <span className="font-medium text-sm leading-tight">{interest}</span>
                </label>
              ))}
            </div>
          </motion.div>
        );
      case 4:
        const end = new Date(startDate);
        end.setDate(end.getDate() + days - 1);
        return (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 text-center py-4">
            <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Trip Duration</p>
                  <p className="font-bold text-foreground text-sm">
                    {format(new Date(startDate), "MMM d")} — {format(end, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="rounded-lg h-7">{days} Days</Badge>
            </div>
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold font-display text-foreground mb-4">Ready to Generate!</h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
              We'll create a {days}-day {budget} itinerary for <span className="text-foreground font-bold">{destination}</span>, focusing on your interests.
            </p>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4 sm:px-6">
        <div className="w-full max-w-2xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Step {step} of 4</span>
              <span className="text-sm font-medium text-primary">
                {step === 1 && "Destination & Dates"}
                {step === 2 && "Budget & Style"}
                {step === 3 && "Interests"}
                {step === 4 && "Confirmation"}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: "25%" }}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <div className="bg-card border border-border shadow-xl rounded-3xl p-6 sm:p-10 min-h-[400px] flex flex-col relative overflow-hidden">
            {isPending && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 relative">
                  <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                  <Plane className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold font-display mt-6 mb-2 text-foreground text-center">Crafting Your Journey</h3>
                <p className="text-muted-foreground text-center max-w-xs animate-pulse">
                  Our AI is scouring the globe to build your perfect day-by-day itinerary...
                </p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-auto pt-6 border-t border-border flex justify-between">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-xl hover-elevate h-12 px-6">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              ) : <div></div>}
              
              {step < 4 ? (
                <Button onClick={handleNext} className="rounded-xl hover-elevate h-12 px-8">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleGenerate} className="rounded-xl hover-elevate h-12 px-10 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white font-bold">
                  Generate Trip <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
