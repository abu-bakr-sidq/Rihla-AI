import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "./BrandLogo";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import {
  Plus, Search, LayoutDashboard, Globe, Compass,
  Wallet, Settings, ChevronDown, User, LogOut, Sparkles,
  Menu, X, Bell, ChevronRight, Plane, Wind, Map, PlaneTakeoff
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard",  path: "/dashboard", Icon: LayoutDashboard },
  { name: "Explore",    path: "/explore",   Icon: Compass },
  { name: "Packages",   path: "/packages",  Icon: Globe },
  { name: "My Trips",   path: "/my-trips",  Icon: Map },
  { name: "About",      path: "/about",     Icon: Globe },
];


export default function AppInnerLayout({ children, noPadding = false, transparent = false }) {
  const [location, nav] = useLocation();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled]       = useState(false);

  const { data: user } = useUser();
  const logoutMutation  = useLogout();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const shouldLock = mobileOpen || userMenuOpen;
    const prev = document.body.style.overflow;
    if (shouldLock) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen, userMenuOpen]);

  const handleLogout = async () => {
    try { await logoutMutation.mutateAsync(); } catch { /* ignore */ }
    setUserMenuOpen(false);
    nav("/auth", { replace: true });
  };

  const isActive = (path) =>
    location === path || (path !== "/dashboard" && location.startsWith(path));

  const initial = user?.username?.charAt(0)?.toUpperCase() || "T";

  return (
    <div className="inner-app-root relative">

      {/* ── TOP NAVBAR ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500`}
      >
        <div className={`w-full transition-all duration-700 border-b border-white/[0.05] ${
          scrolled
            ? "bg-[#040c1c]/90 backdrop-blur-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
            : "bg-transparent backdrop-blur-md"
        }`}>
        {/* COMMAND BAR */}
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 xl:px-10 h-16 relative z-50">
            
            {/* Left: Brand Branding - flex-1 to balance center nav */}
            <div className="flex items-center flex-1">
              <Link href="/dashboard">
                <div className="cursor-pointer group flex items-center gap-3">
                  <BrandLogo size={34} titleClassName="text-shimmer-prismatic font-black tracking-tight" />
                </div>
              </Link>
            </div>

            {/* Center: Desktop Nav - Absolute Center Group */}
            <nav className="hidden lg:flex items-center justify-center gap-8 xl:gap-12 2xl:gap-16 flex-shrink-0 px-4">
              {NAV_ITEMS.map((item) => (
                <Link key={item.path} href={item.path}>
                  <span className={`nav-link cursor-pointer flex items-center gap-1.5 text-xs font-black tracking-widest uppercase transition-all ${
                    isActive(item.path) ? "active text-shimmer-prismatic" : "text-white/40 hover:text-white"
                  }`}>
                    <item.Icon className="w-3.5 h-3.5" />
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Right side: Tools & Profile - flex-1 to balance center nav */}
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 flex-1 justify-end">
              
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-3 relative py-1 focus:outline-none group rounded-2xl px-2 -mx-2 hover:bg-white/[0.03] transition-all duration-300"
                  >
                    {/* Aura Badge Avatar */}
                    <div className="relative">
                      {/* Dual-Ring Glow */}
                      <div className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] opacity-20 blur-[6px] group-hover:opacity-70 transition-opacity duration-500" />
                      <div className="absolute inset-[-1px] rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center relative z-10 border border-white/20 shadow-2xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                        {user?.profilePicture && typeof user.profilePicture === 'string' && user.profilePicture.length > 4 ? (
                          <img 
                            src={user.profilePicture} 
                            alt={user.username} 
                            className="w-full h-full object-cover relative z-10 rounded-full"
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-white text-[12px] font-black drop-shadow-md relative z-10 select-none uppercase tracking-tight">{initial}</span>
                        )}
                      </div>
                    </div>

                    {/* Minimalist Name Plate */}
                    <div className="hidden xl:flex flex-col items-start gap-0 min-w-0">
                      <span className="text-[9px] font-black tracking-[0.2em] text-[#D4AF37] opacity-60 uppercase leading-none mb-1">Account</span>
                      <span className="text-[15px] font-black text-white group-hover:text-[#D4AF37] transition-colors duration-300 leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] max-w-[10rem] truncate">
                        {user?.username || "Traveler"}
                      </span>
                    </div>
                    
                    <ChevronDown className={`w-4 h-4 text-white/30 transition-all duration-500 ${userMenuOpen ? "rotate-180 text-[#D4AF37]" : "group-hover:text-white/70"}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 top-full mt-5 w-72 glass-premium rounded-3xl border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] z-50 overflow-hidden origin-top-right"
                      >
                        {/* Command Center Header */}
                        <div className="p-6 bg-gradient-to-br from-[#D4AF37]/[0.05] to-transparent border-b border-white/[0.08]">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] p-[1px]">
                              <div className="w-full h-full rounded-[14px] bg-zinc-900 flex items-center justify-center font-black text-white text-sm overflow-hidden relative">
                                <span className="absolute">{initial}</span>
                                {user?.profilePicture && (
                                  <img 
                                    src={user.profilePicture} 
                                    alt={user.username} 
                                    className="w-full h-full object-cover relative z-10" 
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <h4 className="text-base font-black text-white leading-tight">{user?.username || "Traveler"}</h4>
                            </div>
                          </div>
                        </div>

                        {/* Action Cards Grid */}
                        <div className="p-3 grid gap-2">
                          <Link href="/settings">
                            <button 
                              onClick={() => setUserMenuOpen(false)} 
                              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/20 transition-all group/card"
                            >
                              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] group-hover/card:scale-110 transition-transform">
                                <Plane className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-black text-white">Profile</span>
                                <span className="text-[10px] text-white/70 font-bold">Preferences & Discovery</span>
                              </div>
                              <ChevronRight className="ml-auto w-4 h-4 text-white/10 group-hover/card:text-[#D4AF37] group-hover/card:translate-x-1 transition-all" />
                            </button>
                          </Link>

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 transition-all group/logout"
                          >
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 group-hover/logout:scale-110 transition-transform">
                              <Wind className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-black text-red-500">Logout</span>
                              <span className="text-[10px] text-red-400/80 font-bold">Securely end this session</span>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/auth">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="hidden md:flex items-center gap-2 px-5 lg:px-6 py-2.5 bg-foreground text-background font-semibold text-sm rounded-full relative overflow-hidden group"
                  >
                    {/* Shimmer effect on button */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <User className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Initiate Rihla</span>
                  </motion.button>
                </Link>
              )}

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-zinc-400 hover:text-white transition-all"
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain bg-black/95 border-t border-white/[0.06] px-4 py-4 space-y-1 shadow-[0_22px_60px_rgba(0,0,0,0.5)]">
            {NAV_ITEMS.map((item) => (
              <Link key={item.path} href={item.path}>
                <div
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive(item.path)
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.Icon className="w-4 h-4" />
                  {item.name}
                </div>
              </Link>
            ))}
            <Link href="/planner">
              <div onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 cursor-pointer mt-2">
                <Sparkles className="w-4 h-4" /> Plan a New Trip
              </div>
            </Link>
            {user && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-3 px-2 pb-3 border-b border-white/8">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/15 bg-zinc-900 flex items-center justify-center shrink-0">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.username}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <span className="text-white text-xs font-black uppercase">{initial}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[#D4AF37]/70">Account</div>
                    <div className="text-sm font-black text-white truncate">{user?.username || "Traveler"}</div>
                  </div>
                </div>
                <div className="grid gap-2 pt-3">
                  <Link href="/settings">
                    <div onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/85 hover:bg-white/5 border border-white/8 cursor-pointer">
                      <Plane className="w-4 h-4 text-[#D4AF37]" />
                      Profile
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 border border-red-500/15"
                  >
                    <Wind className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Click-outside to close user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}

      {/* Page Content */}
      <main 
        className={cn("relative z-10 min-h-screen overflow-x-hidden", !transparent && "bg-background", !noPadding && "pt-16")}
        style={{ background: transparent ? 'transparent' : undefined }}
      >
        {children}
      </main>
    </div>
  );
}
