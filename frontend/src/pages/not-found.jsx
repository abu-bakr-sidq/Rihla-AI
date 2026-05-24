import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import BrandLogo from "@/components/BrandLogo";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Background Orbs */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-violet-500/20 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass-aurora border-white/10 overflow-hidden">
          <CardContent className="pt-12 pb-10 flex flex-col items-center text-center">
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
              <BrandLogo size={64} className="relative z-10" />
            </div>
            
            <h1 className="text-4xl font-black mb-3 tracking-tight">404</h1>
            <p className="text-xl font-bold text-foreground/80 mb-6">Lost in the Universe?</p>
            
            <p className="text-sm text-muted-foreground/70 mb-10 max-w-[280px]">
              The page you're searching for has vanished into the aurora. Let's get you back on track.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full px-4">
              <Link href="/dashboard" className="flex-1">
                <button className="btn-aurora w-full py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" />
                  Dashboard
                </button>
              </Link>
              <button 
                onClick={() => window.history.back()}
                className="flex-1 px-6 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
