import { Route, Switch, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { TripProvider } from "@/context/TripContext";
import { useUser } from "@/hooks/use-auth";
import FloatingBackground from "@/components/FloatingBackground";
import { DottedSurface } from "@/components/ui/dotted-surface";
import { ChatButton } from "@/components/ChatBot/ChatButton";

// Pages
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import TripPlanner from "@/pages/planner";
import MyTrips from "@/pages/MyTrips";
import Explore from "@/pages/explore";
import Budget from "@/pages/Budget";
import MapPage from "@/pages/MapPage";
import Settings from "@/pages/Settings";
import TripDetail from "@/pages/trip-detail";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import ChatPage from "@/pages/chat";
import ItineraryPage from "@/pages/itinerary";
import TourPackages from "@/pages/TourPackages";
import Navbar from "@/components/navbar";

/* ── Protected / Admin route guards ── */
const ProtectedRoute = ({ children }) => {
  const { data: user, isLoading, isFetching } = useUser();
  const [location, navigate] = useLocation();
  const hasStoredToken = typeof window !== "undefined" && Boolean(localStorage.getItem("auth_token"));
  const authPending = isLoading || (hasStoredToken && isFetching && !user);

  useEffect(() => {
    if (!authPending && !user) {
      // Save where the user wanted to go before redirecting to auth
      sessionStorage.setItem('rihla_redirect', location);
      // Replace the current history entry so browser Back works correctly
      navigate('/auth', { replace: true });
    }
  }, [user, authPending, location, navigate]);

  if (authPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
      </div>
    );
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { data: user, isLoading, isFetching } = useUser();
  const [, navigate] = useLocation();
  const hasStoredToken = typeof window !== "undefined" && Boolean(localStorage.getItem("auth_token"));
  const authPending = isLoading || (hasStoredToken && isFetching && !user);

  useEffect(() => {
    if (!authPending && !user) navigate('/auth', { replace: true });
    if (!authPending && user && user.role !== 'admin') navigate('/dashboard', { replace: true });
  }, [user, authPending, navigate]);

  if (authPending || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
      </div>
    );
  }
  return children;
};

/* ── Page routes with AnimatePresence transition ── */
function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="min-h-dvh w-full overflow-x-hidden"
      >
        <Switch>
          <Route path="/"><Redirect to="/dashboard" /></Route>
          <Route path="/about"><Home /></Route>
          <Route path="/auth"><Auth /></Route>
          <Route path="/dashboard"><Dashboard /></Route>
          <Route path="/packages"><TourPackages /></Route>
          <Route path="/planner"><TripPlanner /></Route>
          <Route path="/my-trips"><ProtectedRoute><MyTrips /></ProtectedRoute></Route>
          <Route path="/explore"><Explore /></Route>
          <Route path="/budget"><ProtectedRoute><Budget /></ProtectedRoute></Route>
          <Route path="/map"><ProtectedRoute><MapPage /></ProtectedRoute></Route>
          <Route path="/map/:id"><ProtectedRoute><MapPage /></ProtectedRoute></Route>
          <Route path="/settings"><ProtectedRoute><Settings /></ProtectedRoute></Route>
          <Route path="/trips/:id"><ProtectedRoute><TripDetail /></ProtectedRoute></Route>
          <Route path="/admin"><AdminRoute><Admin /></AdminRoute></Route>
          <Route path="/admin/dashboard"><AdminRoute><Admin /></AdminRoute></Route>
          <Route path="/chat"><ProtectedRoute><ChatPage /></ProtectedRoute></Route>
          <Route path="/itinerary"><ItineraryPage /></Route>
          <Route><NotFound /></Route>
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Global floating chat button (authenticated pages only) ── */
function GlobalChat() {
  const { data: user } = useUser();
  const [location] = useLocation();
  // Hide on public pages, auth, dedicated chat page, planner (has its own)
  const hide = ["/", "/auth", "/about", "/chat", "/planner", "/itinerary"].includes(location)
    || location.startsWith("/admin");
  if (!user || hide) return null;
  return <ChatButton />;
}

/* ── Route-conditional backgrounds (only on landing page) ── */
function GlobalBackground() {
  return (
    <>
      <DottedSurface className="opacity-80" />
      <FloatingBackground />
    </>
  );
}

/* ── Main App ── */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" forcedTheme="dark" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <TripProvider>
            <div className="min-h-dvh w-full overflow-x-hidden bg-transparent text-foreground antialiased selection:bg-primary/30 relative">
              {/* Background layers — conditional per route */}
              <GlobalBackground />

              {/* Navbar is handled internally by each page/layout */}

              <AppRoutes />

              {/* Floating AI Chat — visible on every authenticated page */}
              <GlobalChat />

              <Toaster />
            </div>
          </TripProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
