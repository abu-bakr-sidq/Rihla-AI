import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, Mail, User, ArrowRight, Loader2, Eye, EyeOff, PlaneTakeoff } from "lucide-react";
import { useUser, useLogin, useRegister } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import BrandLogo from "@/components/BrandLogo";
import { api } from "@/lib/api-contract";
const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const BACKEND_BASE_URL = API_BASE_URL.endsWith("/api") ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

/* ── Travel background images for auth page ── */
const AUTH_TRAVEL_IMAGES = [
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=1400",
];

function TravelAuthBackground() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % AUTH_TRAVEL_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.img
          key={idx}
          src={AUTH_TRAVEL_IMAGES[idx]}
          alt="Travel"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const QUOTES = [
  {
    text: "He it is Who has made the earth subservient to you, so traverse its paths.",
    author: "AL-MULK 15",
  },
  {
    text: "Travel through the earth and see how He originated creation.",
    author: "AL-ANKABUT 20",
  },
  {
    text: "Do they not travel through the land, so that their hearts may understand?",
    author: "AL-HAJJ 46",
  },
  {
    text: "The world is a book, and those who do not travel read only one page.",
    author: "IBN BATTUTA",
  },
];

const letterVariants = {
  initial: { opacity: 0, scale: 0.8, filter: "blur(10px)", letterSpacing: "-0.5em" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)", letterSpacing: "0.4em" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * SandRevealAlert Component
 * A premium desert-themed notification that "gathers like sand" to form text.
 */
function SandRevealAlert({ message }) {
  const characters = message.split("");
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-8 p-4 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/20 relative overflow-hidden group"
    >
      {/* Grainy Background Texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />
      
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
          <div className="flex flex-wrap">
            {characters.map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 2, filter: "blur(12px)", x: Math.random() * 20 - 10, y: Math.random() * 20 - 10 }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)", x: 0, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.03,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className="text-xs text-[#D4AF37] font-bold tracking-wide inline-block"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default function Auth() {
  // steps: 'login' | 'register' | 'success' | 'forgot-password' | 'verify-otp' | 'reset-password' | 'reset-success'
  const [step, setStep] = useState("login");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOTP, setResetOTP] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [, setLocation] = useLocation();
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const { toast } = useToast();

  const isLogin = step === "login";
  const schema = isLogin ? loginSchema : registerSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: "", email: "", password: "" },
  });

  useEffect(() => {
    if (user) {
      // Go back to where the user was before being sent to /auth
      const savedRedirect = sessionStorage.getItem('rihla_redirect');
      sessionStorage.removeItem('rihla_redirect'); // clear after use
      const redirectPath = user.role === 'admin'
        ? '/admin'
        : (savedRedirect && savedRedirect !== '/auth' ? savedRedirect : '/dashboard');
      setLocation(redirectPath);
    }
  }, [user, setLocation]);

  useEffect(() => {
    const t = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // Reset form when switching between major modes
  useEffect(() => {
    if (step === "login" || step === "register") {
      form.reset({ username: "", email: "", password: "" });
    }
  }, [step]);

  // Handle Google Auth Token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("auth_token", token);
      setIsGoogleSigningIn(true);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      queryClient.removeQueries({ queryKey: [api.auth.me.path] });
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: "Welcome!", description: "Successfully authenticated with Google." });
    }
  }, [toast, queryClient]);

  const onSubmit = async (data) => {
    try {
      if (step === "login") {
        await loginMutation.mutateAsync(data);
      } else if (step === "register") {
        await registerMutation.mutateAsync(data);
        setStep("success");
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-black">
      {/* Full-page travel photo background */}
      <TravelAuthBackground />
      {isGoogleSigningIn && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative overflow-hidden rounded-[28px] border border-[#D4AF37]/20 bg-[linear-gradient(135deg,rgba(8,12,20,0.96),rgba(18,28,40,0.94))] px-6 py-5 text-[#D4AF37] shadow-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_50%)]" />
            <div className="relative flex items-center gap-4">
              <div className="relative flex h-11 w-11 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-[#D4AF37]/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
                <motion.div
                  animate={{ x: [-10, 10, -10], y: [4, -4, 4], rotate: [-8, 8, -8] }}
                  transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  <PlaneTakeoff className="h-4 w-4" />
                </motion.div>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#D4AF37]/70">Boarding Pass</p>
                <span className="mt-1 block text-sm font-bold tracking-wide text-white">Signing you in...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Left Panel: Cinematic Quote Carousel over travel background ── */}
      <div
        className="hidden lg:flex w-1/2 relative z-10"
        style={{ minHeight: '100vh' }}
      >
        {/* Quote content — vertically centered */}
        <div className="absolute inset-0 z-10 flex flex-col justify-center px-14">
          {/* Top brand */}
          <div className="mb-12 select-none">
            <motion.div 
              className="flex items-center gap-2 mb-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <div className="w-6 h-px bg-foreground/30" />
              <motion.span 
                className="text-[10px] font-black uppercase tracking-[0.4em] text-shimmer-prismatic inline-block"
                variants={letterVariants}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                RIHLA AI
              </motion.span>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-xs text-foreground/50 leading-relaxed max-w-xs font-medium"
            >
              Your intelligent companion for premium halal travel planning.
            </motion.p>
          </div>

          {/* Separator */}
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 1.5, ease: "circOut" }}
            className="w-12 h-px bg-muted-foreground/30 mb-10 origin-left" 
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              exit={{ opacity: 0, filter: "blur(10px)", scale: 1.02 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-3xl md:text-4xl font-bold text-foreground leading-[1.25] tracking-tight italic mb-6 max-w-md" style={{ textWrap: 'balance' }}>
                "{QUOTES[quoteIndex].text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-4 h-px bg-muted-foreground/50" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/80">
                  {QUOTES[quoteIndex].author}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slide dots */}
          <div className="flex items-center gap-2 mt-8">
            {QUOTES.map((_, i) => (
              <button
                key={i}
                onClick={() => setQuoteIndex(i)}
                className="transition-all duration-300"
                style={{
                  width: i === quoteIndex ? 28 : 8,
                  height: 4,
                  borderRadius: 2,
                  background: i === quoteIndex ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground) / 0.3)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Auth Form State Machine ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-14 relative z-10">
        <AnimatePresence mode="wait">
          {step === "success" ? (
            <motion.div
              key="success-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-[420px] p-10 rounded-3xl text-center flex flex-col items-center justify-center backdrop-blur-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/40 shadow-2xl"
            >
              <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mb-8 animate-pulse">
                <PlaneTakeoff size={40} className="drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white mb-4">Ready for Takeoff!</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-10 max-w-[280px]">
                Your digital passport is ready. Welcome to the Rihla AI travel based experience.
              </p>
              <button
                onClick={() => setStep("login")}
                className="w-full h-14 rounded-xl bg-white text-black font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Enter the Terminal <ArrowRight size={18} />
              </button>
            </motion.div>
          ) : step === "forgot-password" ? (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-[420px] p-8 rounded-3xl backdrop-blur-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/40 shadow-2xl"
            >
              <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Lost your way?</h2>
              <p className="text-white/60 text-sm mb-8">Enter your registered email to receive a recovery code.</p>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const email = e.target.email.value;
                  try {
                    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message);
                    setResetEmail(email);
                    setPreviewUrl(data.previewUrl || "");
                    setStep("verify-otp");
                  } catch (err) {
                    toast({ title: "Error", description: err.message, variant: "destructive" });
                  }
                }} 
                className="space-y-4"
              >
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input name="email" type="email" required placeholder="Email Address" className="w-full h-14 pl-12 pr-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-black/20 dark:focus:border-white/20 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none transition-colors" />
                </div>
                <button type="submit" className="w-full h-14 rounded-xl bg-white text-black font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all">
                  Send Recovery Code
                </button>
                <button type="button" onClick={() => setStep("login")} className="w-full text-sm text-white/50 hover:text-white transition-colors py-2">
                  Back to Login
                </button>
              </form>
            </motion.div>
          ) : step === "verify-otp" ? (
            <VerifyOTPStep 
              email={resetEmail} 
              previewUrl={previewUrl}
              setPreviewUrl={setPreviewUrl}
              onVerify={(code) => {
                setResetOTP(code);
                setStep("reset-password");
              }} 
              onBack={() => {
                setStep("forgot-password");
                setPreviewUrl("");
              }}
              toast={toast}
            />
          ) : step === "reset-password" ? (
            <motion.div
              key="reset-password"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-[420px] p-8 rounded-3xl backdrop-blur-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/40 shadow-2xl"
            >
              <h2 className="text-3xl font-bold tracking-tight text-white mb-2">New Password</h2>
              <p className="text-white/60 text-sm mb-8">Set a strong password to secure your account.</p>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const newPassword = e.target.password.value;
                  const confirmPassword = e.target.confirmPassword.value;
                  if (newPassword !== confirmPassword) {
                    toast({ title: "Passwords Mismatch", description: "The passwords you entered do not match.", variant: "destructive" });
                    return;
                  }
                  try {
                    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: resetEmail, otp: resetOTP, newPassword }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message);
                    setResetOTP("");
                    setPreviewUrl("");
                    setStep("reset-success");
                  } catch (err) {
                    toast({ title: "Error", description: err.message, variant: "destructive" });
                  }
                }} 
                className="space-y-4"
              >
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    name="password" 
                    type={showResetPassword ? "text" : "password"} 
                    required 
                    placeholder="New Password" 
                    className="w-full h-14 pl-12 pr-12 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-black/20 dark:focus:border-white/20 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none transition-colors" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    name="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    required 
                    placeholder="Confirm New Password" 
                    className="w-full h-14 pl-12 pr-12 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-black/20 dark:focus:border-white/20 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none transition-colors" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button type="submit" className="w-full h-14 rounded-xl bg-white text-black font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all">
                  Reset Password
                </button>
              </form>
            </motion.div>
          ) : step === "reset-success" ? (
            <motion.div
              key="reset-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-[420px] p-10 rounded-3xl text-center backdrop-blur-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/40 shadow-2xl"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-8 mx-auto">
                <Lock size={40} />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white mb-4">Password Reset!</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-10">
                Your credentials have been updated. You can now log in with your new password.
              </p>
              <button
                onClick={() => setStep("login")}
                className="w-full h-14 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Back to Login
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(10px)", y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[420px] p-8 rounded-3xl backdrop-blur-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/40 shadow-2xl"
            >
              {/* Mobile logo */}
              <div className="lg:hidden mb-8">
                <Link href="/">
                  <BrandLogo size={32} titleClassName="text-shimmer-prismatic font-black tracking-tight" />
                </Link>
              </div>

              {/* Heading */}
              <div className="mb-8 select-none">
                <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </h1>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                  {isLogin
                    ? "Welcome back to your Rihla AI travel based experience."
                    : "Create your account to start planning your next journey."}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Username — register only */}
                {!isLogin && (
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <User size={18} />
                    </div>
                    <input
                      {...form.register("username")}
                      placeholder="Username"
                      className="w-full h-14 pl-12 pr-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-black/20 dark:focus:border-white/20 focus:outline-none text-foreground placeholder:text-muted-foreground text-sm font-medium transition-all"
                    />
                    {form.formState.errors.username && (
                      <p className="text-xs text-red-500 mt-1">{form.formState.errors.username.message}</p>
                    )}
                  </div>
                )}

                {/* Email */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail size={18} />
                  </div>
                  <input
                    {...form.register("email")}
                    type="email"
                    placeholder="Email Address"
                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-black/20 dark:focus:border-white/20 focus:outline-none text-foreground placeholder:text-muted-foreground text-sm font-medium transition-all"
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock size={18} />
                  </div>
                  <input
                    {...form.register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full h-14 pl-12 pr-12 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-black/20 dark:focus:border-white/20 focus:outline-none text-foreground placeholder:text-muted-foreground text-sm font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1">{form.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Forgot Password (login only) */}
                {isLogin && (
                  <div className="flex justify-end pr-1">
                    <button 
                      type="button" 
                      onClick={() => setStep("forgot-password")}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-14 rounded-xl bg-foreground text-background font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? "Login" : "Create Account"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* External Auth Divider */}
              <div className="mt-8 flex items-center gap-4 px-2">
                <div className="flex-1 h-[1px] bg-black/10 dark:bg-white/10" />
                <span className="text-[10px] font-black tracking-[0.2em] text-black/30 dark:text-white/30 select-none">OR</span>
                <div className="flex-1 h-[1px] bg-black/10 dark:bg-white/10" />
              </div>

              {/* Google Login */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => (window.location.href = `${BACKEND_BASE_URL}/api/auth/google`)}
                  className="w-full h-14 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-center gap-3 font-semibold text-sm text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Login with Google
                </button>
              </div>

              {/* Toggle login/register */}
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setStep(isLogin ? "register" : "login")}
                  className="text-sm font-bold text-foreground/80 hover:text-foreground transition-all hover:underline underline-offset-4"
                >
                  {isLogin ? "Create account" : "Sign in"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


function VerifyOTPStep({ email, previewUrl, setPreviewUrl, onVerify, onBack, toast }) {
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [status, setStatus] = useState("Code dispatched to your inbox.");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setCountdown(60);
      setCanResend(false);
      setStatus("New code has been sent.");
      setPreviewUrl(data.previewUrl || "");
      toast({ title: "OTP Resent", description: "Please check your email for the fresh code." });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = () => {
    const otp = [...Array(6)].map((_, i) => document.getElementById(`otp-${i}`).value).join("");
    if (otp.length === 6) {
      onVerify(otp);
    } else {
      toast({ title: "Incomplete Code", description: "Please enter all 6 digits.", variant: "destructive" });
    }
  };

  return (
    <motion.div
      key="verify-otp"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-[420px] p-8 rounded-3xl backdrop-blur-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/40 shadow-2xl"
    >
      <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Verify Code</h2>
      <p className="text-white/60 text-sm mb-6">Enter the 6-digit verification code sent to <span className="text-white font-medium">{email}</span></p>
      
      <SandRevealAlert message={status} />
      {previewUrl ? (
        <div className="mb-6 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-4 py-3 text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-1">Email Preview</p>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-white/80 underline underline-offset-4 break-all hover:text-white"
          >
            Open the OTP email preview
          </a>
        </div>
      ) : null}

      <div className="space-y-8">
        <div className="flex justify-between gap-2.5">
          {[...Array(6)].map((_, i) => (
            <input 
              key={i} 
              id={`otp-${i}`}
              type="text" 
              maxLength={1} 
              className="w-11 h-14 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-center text-xl font-bold text-foreground focus:border-[#D4AF37]/50 focus:bg-black/10 dark:focus:bg-white/10 focus:outline-none transition-all"
              onInput={(e) => {
                if (e.target.value && i < 5) document.getElementById(`otp-${i + 1}`).focus();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !e.target.value && i > 0) document.getElementById(`otp-${i - 1}`).focus();
              }}
            />
          ))}
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleVerify}
            className="w-full h-14 rounded-xl bg-white text-black font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Verify Code
          </button>
          
          <div className="text-center">
            {canResend ? (
              <button 
                onClick={handleResend}
                disabled={isResending}
                className="text-sm font-bold text-[#D4AF37] hover:underline underline-offset-4 disabled:opacity-50"
              >
                {isResending ? "Sending..." : "Resend Code"}
              </button>
            ) : (
              <p className="text-xs text-white/40 font-medium">
                Resend code in <span className="text-white font-bold">{countdown}s</span>
              </p>
            )}
          </div>
        </div>

        <button type="button" onClick={onBack} className="w-full text-sm text-white/50 hover:text-white transition-colors pt-2">
          Change Email
        </button>
      </div>
    </motion.div>
  );
}

// v restore 03/17/2026 00:47:18
