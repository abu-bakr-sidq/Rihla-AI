import { Link } from "wouter";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Map, Sparkles, Clock, Wallet, CheckCircle2, ArrowRight, PlaneTakeoff, Globe2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] mix-blend-multiply" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-multiply" />
      </div>

      <Navbar />

      <main className="relative z-10 pt-32 pb-16 sm:pt-40 sm:pb-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border/50 text-sm font-medium text-secondary-foreground mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI-Powered Travel Planning</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-bold font-display tracking-tight text-foreground mb-8 max-w-4xl mx-auto leading-tight"
          >
            Your Dream Trip, <br/>
            <span className="text-gradient">Designed in Seconds</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Tell us where you want to go, what you love, and your budget. Our AI crafts a deeply personalized day-by-day itinerary instantly.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/planner">
              <Button size="lg" className="w-full sm:w-auto text-lg rounded-2xl px-8 h-14 shadow-xl shadow-primary/25 hover-elevate">
                Start Planning Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg rounded-2xl px-8 h-14 bg-background/50 hover-elevate">
                Sign In
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Feature Cards Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-card p-8 rounded-3xl border border-border shadow-lg shadow-black/5 hover-elevate"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3 text-foreground">Save 40+ Hours</h3>
              <p className="text-muted-foreground leading-relaxed">No more infinite browser tabs. Get a complete, realistic itinerary mapped out instantly.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-card p-8 rounded-3xl border border-border shadow-lg shadow-black/5 hover-elevate"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Map className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3 text-foreground">Hyper-Personalized</h3>
              <p className="text-muted-foreground leading-relaxed">From hidden cafes to major landmarks, tailored perfectly to your unique travel style.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-card p-8 rounded-3xl border border-border shadow-lg shadow-black/5 hover-elevate"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Wallet className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3 text-foreground">Smart Budgeting</h3>
              <p className="text-muted-foreground leading-relaxed">Know exactly what your trip will cost with AI-estimated breakdowns for food, stays, and fun.</p>
            </motion.div>
          </div>
        </section>

        {/* Destination Inspiration */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold font-display tracking-tight text-foreground mb-2">Popular Destinations</h2>
              <p className="text-muted-foreground text-lg">Where our AI has taken travelers recently</p>
            </div>
            <Link href="/planner" className="hidden md:flex items-center text-primary font-medium hover:underline">
              Plan your own <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* landing page popular destination kyoto japan */}
            <div className="group relative rounded-3xl overflow-hidden aspect-[4/5] hover-elevate cursor-pointer">
              <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop" alt="Kyoto" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="text-white font-display font-bold text-2xl mb-1">Kyoto, Japan</h3>
                <p className="text-white/80 font-medium flex items-center"><Globe2 className="w-4 h-4 mr-1" /> Culture & History</p>
              </div>
            </div>
            
            {/* landing page popular destination santorini italy */}
            <div className="group relative rounded-3xl overflow-hidden aspect-[4/5] hover-elevate cursor-pointer">
              <img src="https://images.unsplash.com/photo-1469827160215-9d29e96e72f4?q=80&w=800&auto=format&fit=crop" alt="Santorini" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="text-white font-display font-bold text-2xl mb-1">Santorini, Greece</h3>
                <p className="text-white/80 font-medium flex items-center"><Globe2 className="w-4 h-4 mr-1" /> Relaxation & Views</p>
              </div>
            </div>

            {/* landing page popular destination banff canada */}
            <div className="group relative rounded-3xl overflow-hidden aspect-[4/5] hover-elevate cursor-pointer hidden lg:block">
              <img src="https://pixabay.com/get/g4d62a1df201c9378e507a8914db2ccac79a5aee7564285019c2195cdd207d60001b1dbecb90ae28d5c0aa7fe49168a534e481e9fb41105548f1e82952256a63a_1280.jpg" alt="Banff" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="text-white font-display font-bold text-2xl mb-1">Banff, Canada</h3>
                <p className="text-white/80 font-medium flex items-center"><Globe2 className="w-4 h-4 mr-1" /> Nature & Adventure</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-32 text-center">
          <div className="bg-primary p-12 rounded-[2.5rem] relative overflow-hidden text-primary-foreground shadow-2xl shadow-primary/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[80px]" />
            <PlaneTakeoff className="w-16 h-16 mx-auto mb-6 text-primary-foreground/90" />
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 tracking-tight">Ready to pack your bags?</h2>
            <p className="text-primary-foreground/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Join thousands of travelers who have discovered the fastest way to build their perfect itinerary.
            </p>
            <Link href="/auth">
              <Button size="lg" variant="secondary" className="text-lg rounded-2xl px-10 h-14 text-primary font-bold hover-elevate">
                Create Your Account
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
