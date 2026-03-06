import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useLogin, useRegister, useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Compass, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user } = useUser();
  const login = useLogin();
  const register = useRegister();

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    try {
      if (isLogin) {
        await login.mutateAsync({ username, password });
        toast({ title: "Welcome back!", description: "Successfully logged in." });
      } else {
        await register.mutateAsync({ username, password });
        toast({ title: "Account created!", description: "Welcome to OdysseyAI." });
      }
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const isPending = login.isPending || register.isPending;

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      {/* Visual Side */}
      <div className="hidden md:block relative overflow-hidden bg-primary">
        {/* auth page scenic travel background */}
        <img 
          src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop" 
          alt="Travel landscape" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-start justify-end p-16">
          <Link href="/" className="absolute top-10 left-10 flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Compass className="w-6 h-6 text-white group-hover:-rotate-12 transition-transform duration-300" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white">
              OdysseyAI
            </span>
          </Link>
          <h2 className="text-4xl font-display font-bold text-white mb-4 leading-tight">
            Stop searching.<br/>Start exploring.
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Our AI analyzes millions of data points to craft the perfect itinerary tailored to your exact tastes.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-8 sm:p-16 relative">
        <Link href="/" className="absolute top-8 left-8 md:hidden flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Compass className="w-6 h-6 text-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Odyssey<span className="text-primary">AI</span>
          </span>
        </Link>

        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                {isLogin ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-muted-foreground mb-8">
                {isLogin ? "Enter your details to access your trips." : "Sign up to start planning your dream journey."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="traveler123"
                    className="h-12 px-4 rounded-xl bg-secondary/50 border-transparent focus:border-primary focus:bg-background transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 px-4 rounded-xl bg-secondary/50 border-transparent focus:border-primary focus:bg-background transition-colors"
                  />
                </div>

                <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl text-md font-semibold hover-elevate shadow-lg shadow-primary/20">
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? "Sign In" : "Sign Up"}
                </Button>
              </form>

              <div className="mt-8 text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-semibold hover:underline transition-all"
                >
                  {isLogin ? "Create one" : "Sign in"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
