import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import AppInnerLayout from "@/components/AppInnerLayout";
import { Calendar, Clock, Sun, Cloud, Sunset, Moon, MapPin, Sparkles, X, ChevronDown, ChevronUp, Wind, Compass, Utensils, Bed, Landmark, Plus, Coffee, Users, Download, Loader2 } from "lucide-react";
import { getPlaceImage } from "@/services/placeImageService";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { exportTripPDF } from "@/services/exportTripPDF";

function fmtCur(amount, currency = 'INR') {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount); } catch { return '₹' + amount; }
}

function normalise(raw) {
  if (!raw?.days?.length) return null;
  if (Array.isArray(raw.days[0]?.plans)) {
    return {
      destination: raw.destination || "Your Trip",
      totalDays: raw.days.length,
      totalBudget: null,
      tips: null,
      days: raw.days.map(d => ({
        day: d.day,
        title: d.title || `Day ${d.day}`,
        plans: (d.plans || []).map(p => ({
          time: p.time || "morning", place: p.place || "", city: p.city || raw.destination || "", description: p.description || "", cost: p.cost || 0, duration: p.duration || "",
        })),
      })),
    };
  }
  const SLOTS = ["morning", "morningActivity", "afternoon", "afternoonActivity", "evening", "eveningActivity", "night", "nightActivity"];
  return {
    destination: raw.trip_overview?.destination || raw.destination || "Your Trip",
    totalDays: raw.trip_overview?.total_days || raw.days.length,
    totalBudget: raw.total_budget || null,
    tips: raw.ai_suggestions || null,
    days: raw.days.map(d => ({
      day: d.day,
      title: d.theme || d.title || `Day ${d.day}`,
      plans: SLOTS.filter(s => d[s]?.place).map(s => ({
        time: s, place: d[s].place, city: raw.trip_overview?.destination || "", description: d[s].activity || d[s].description || "", cost: d[s].cost || 0, duration: d[s].duration || "",
      })),
    })),
  };
}

const SLOT_META = {
  morning: { label: "Morning", Icon: Coffee, timeStr: "08:00 AM" },
  morningActivity: { label: "Activity", Icon: MapPin, timeStr: "10:00 AM" },
  afternoon: { label: "Afternoon", Icon: Cloud, timeStr: "12:30 PM" },
  afternoonActivity: { label: "Activity", Icon: Compass, timeStr: "2:30 PM" },
  evening: { label: "Evening", Icon: Sunset, timeStr: "5:00 PM" },
  eveningActivity: { label: "Activity", Icon: MapPin, timeStr: "7:30 PM" },
  night: { label: "Night", Icon: Moon, timeStr: "9:00 PM" },
  nightActivity: { label: "Activity", Icon: Utensils, timeStr: "10:30 PM" },
};
// Wait, Lucide doesnt import Coffee implicitly above. I will just rely on mapped icons.

// Safarix Dark Blue Accordion Widget
function AccordionWidget({ title, icon: Icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-[16px] overflow-hidden mb-3 transition-all duration-300 shadow-lg" style={{ background: '#0F1623', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03]" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-[#0ea5e9]" />
          <h3 className="text-[15px] font-bold text-white font-serif tracking-wide">{title}</h3>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronUp size={18} className="text-white/50" /></motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Light Safarix Card
function ActivityCard({ plan, cardIndex }) {
  const [imgSrc, setImgSrc] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  
  let label = "Activity";
  let timeStr = "8:30 AM";
  let Icon = Compass;
  if(plan.time === 'morning') { label= "Breakfast"; timeStr="8:30 AM"; Icon=Utensils; }
  else if(plan.time === 'afternoon') { label= "Activity"; timeStr="1:00 PM"; Icon=MapPin; }
  else if(plan.time === 'evening') { label= "Activity"; timeStr="5:00 PM"; Icon=MapPin; }
  else if(plan.time === 'night') { label= "Dinner"; timeStr="8:30 PM"; Icon=Utensils; }

  useEffect(() => {
    let alive = true;
    setImgLoaded(false);
    getPlaceImage(plan.place, plan.city, plan.time, plan.description).then(url => { if (alive && url) setImgSrc(url); });
    return () => { alive = false; };
  }, [plan.place, plan.city, plan.time, plan.description]);

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      {/* Top Image Portion */}
      <div className="relative w-full h-[150px] bg-gray-100 overflow-hidden">
        {imgSrc ? (
          <img src={imgSrc} onError={e => { e.target.onerror = null; e.target.src = 'https://picsum.photos/seed/600/400'; }} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={plan.place} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100"><Landmark className="text-gray-300" size={32}/></div>
        )}
        
        <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-gray-100/50">
          <Icon size={12} className="text-gray-700" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-800">{label}</span>
        </div>
        
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-gray-100/50">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-800">{plan.cost > 0 ? fmtCur(plan.cost) : 'Free Entry'}</span>
        </div>
        
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-[10px]">
          <Clock size={11} className="text-white" />
          <span className="text-[10px] font-bold text-white">{timeStr}</span>
        </div>
      </div>
      
      {/* Bottom Text Portion */}
      <div className="p-4 bg-white flex-1 flex flex-col">
        <h3 className="text-[16px] font-bold font-serif text-gray-900 mb-1.5 leading-tight">{plan.place}</h3>
        <p className="text-[12px] text-gray-500 leading-relaxed font-medium line-clamp-2">{plan.description}</p>
      </div>
    </div>
  );
}

function RihlaLoginPopup({ onClose }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} className="relative bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-3 leading-tight">Let's Start with<br />Rihla AI</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-xs mx-auto">To access all the functionalities and services, please log in to your account first.</p>
          <a href="/auth" className="block w-full"><button className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-[#0ea5e9] text-white font-semibold text-sm shadow-sm transition-transform hover:scale-105">Continue with Account</button></a>
          <button onClick={onClose} className="mt-4 text-sm text-gray-400 hover:text-gray-900 transition-colors font-bold">Cancel</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ItineraryPage() {
  const [, nav] = useLocation();
  const [plan, setPlan] = useState(null);
  const [raw, setRaw] = useState(null);
  const [err, setErr] = useState(false);
  const [heroImage, setHeroImage] = useState('');
  const [selectedDay, setSelectedDay] = useState(1);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { data: user } = useUser();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("rihla_chat_plan");
      if (!stored) { setErr(true); return; }
      const parsed = JSON.parse(stored);
      const norm = normalise(parsed);
      if (!norm) { setErr(true); return; }
      setRaw(parsed);
      setPlan(norm);
    } catch { setErr(true); }
  }, []);

  useEffect(() => {
    if (!plan?.destination) return;
    let alive = true;
    getPlaceImage(plan.destination + ' majestic view landmark', plan.destination, 'morning', '').then(url => { if (alive && url) setHeroImage(url); });
    return () => { alive = false; };
  }, [plan]);

  if (err) return <div className="min-h-screen bg-white flex items-center justify-center text-gray-800">Error: No active plan found in session.</div>;
  if (!plan) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-[#0ea5e9]/20 border-t-[#0ea5e9] animate-spin" /></div>;

  const activeDayIdx = Math.min(Math.max((selectedDay || 1), 1), plan.days.length) - 1;
  const activeDay = plan.days[activeDayIdx];
  const budget = plan.totalBudget;
  const DEST_SHORT = plan.destination.split(',')[0].trim();
  const tips = plan.tips;
  const AI_GEMS = tips?.hidden_gems || [];

  // Live prayer times for today (no specific day date since this is a chatbot plan)
  const { times: prayerTimes, hijriDate } = usePrayerTimes(DEST_SHORT, new Date().toISOString().split('T')[0]);

  return (
    <AppInnerLayout hideSidebar>
      {/* Light Background wrapper */}
      <div className="w-full min-h-screen bg-white text-gray-900 pb-20">
        {showLoginPopup && <RihlaLoginPopup onClose={() => setShowLoginPopup(false)} />}
        
        {/* HERO BANNER - Dark Text overlaid */}
        <div className="relative w-full h-[400px]">
          {heroImage ? (<img src={heroImage} alt={DEST_SHORT} className="absolute inset-0 w-full h-full object-cover" />) : (<div className="absolute inset-0 bg-gray-900" />)}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 max-w-[1240px] mx-auto px-6 pb-10 flex flex-col md:flex-row items-end justify-between gap-6 relative z-10">
            <div className="w-full md:w-auto text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-serif text-white tracking-tight mb-4">{DEST_SHORT}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Calendar size={14} /> <span>{plan.totalDays} Days</span>
                </div>
                <div className="w-1 h-1 bg-white/50 rounded-full" />
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Users size={14} /> <span>1 Solo guest</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              {budget && (
                <div className="text-left md:text-right text-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#0ea5e9] mb-1">Estimated Budget</p>
                  <p className="text-2xl font-black flex items-center md:justify-end gap-2">
                    ₹{budget.total?.toLocaleString() || budget.toLocaleString()} <span className="text-sm font-medium text-white/70">for {plan.totalDays} days</span>
                  </p>
                </div>
              )}
              {/* PDF Export Button */}
              <button
                onClick={async () => {
                  if (exporting) return;
                  setExporting(true);
                  try {
                    // Build a trip-like object from the plan for PDF export
                    const tripLike = {
                      destination: plan.destination,
                      days: plan.totalDays,
                      travelers: 1,
                      budget: 'moderate',
                      travelStyle: 'balanced',
                      costBreakdown: budget || {},
                      itinerary: raw?.days || [],
                    };
                    await exportTripPDF(tripLike, prayerTimes, hijriDate);
                  } catch(e) { console.error('PDF export failed:', e); }
                  finally { setExporting(false); }
                }}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: exporting ? 'rgba(14,165,233,0.15)' : 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                  color: '#fff',
                  boxShadow: exporting ? 'none' : '0 4px 18px rgba(14,165,233,0.4)',
                }}
              >
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {exporting ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT BODY */}
        <div className="max-w-[1240px] mx-auto px-6 pt-10">
          
          {/* Day Tabs (Light pills) */}
          <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-4 no-scrollbar mb-8">
            {plan.days.map((d, i) => {
              const isActive = i === activeDayIdx;
              const isLocked = !user && i > 0;
              return (
                <button 
                  key={i} 
                  onClick={() => { if(isLocked) setShowLoginPopup(true); else setSelectedDay(d.day); }} 
                  className={`flex flex-shrink-0 items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] transition-all border shadow-sm ${isActive ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] shadow-[#0ea5e9]/20' : 'bg-white text-gray-500 border-gray-200 hover:border-[#0ea5e9]/30 hover:text-gray-800'}`}
                  style={{ opacity: isLocked ? 0.3 : 1 }}
                >
                  <Calendar size={14} className={isActive ? 'text-white' : 'text-gray-400'} /> Day {d.day}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left Column: Timeline */}
            <div className="flex-1 min-w-0">
              {activeDay && (
                <AnimatePresence mode="wait">
                  <motion.div key={activeDay.day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 flex-shrink-0 rounded-[14px] bg-[#E0F2FE] flex items-center justify-center text-[#0ea5e9] font-black text-lg">{activeDay.day}</div>
                      <h2 className="text-[26px] font-bold font-serif text-gray-900 tracking-tight">{activeDay.title || "Daily Excursions"}</h2>
                    </div>
                    {/* Safarix 2-column wide layout for cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                      {activeDay.plans.map((plan, cardIdx) => (
                        <ActivityCard key={cardIdx} plan={plan} cardIndex={cardIdx} />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Right Column: Sticky Widgets */}
            <div className="w-full lg:w-[350px] flex-shrink-0">
              <div className="sticky top-24 self-start flex flex-col gap-4">
                
                {/* Safarix Weather Widget (Light Blue) */}
                <div className="bg-[#E0F2FE] rounded-2xl p-4 flex items-center justify-between text-gray-900 border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Sun size={28} className="text-yellow-500" />
                    <div><h3 className="text-2xl font-black leading-none">27°C</h3><p className="text-[13px] font-medium text-gray-600 mt-1">Clear</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-end gap-1"><Wind size={10}/> Forecast</p>
                    <p className="text-[11px] font-bold text-gray-700 mt-1">4 km/h</p>
                  </div>
                </div>

                {/* Map Widget Mock (Light theme) */}
                <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
                  <div className="h-[120px] bg-blue-50 relative overflow-hidden flex items-center justify-center">
                    <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400" className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Map View" />
                    <div className="absolute inset-0 bg-[#0ea5e9]/10" />
                    <div className="absolute top-1/2 left-1/2 shadow-xl bg-white w-6 h-6 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2"><div className="w-2 h-2 bg-[#0ea5e9] rounded-full" /></div>
                    <div className="absolute top-2 right-2 flex flex-col gap-1 bg-white shadow-sm rounded-lg p-1">
                      <div className="w-6 h-6 flex items-center justify-center text-gray-500 font-black">+</div>
                      <div className="w-4 mx-auto border-t border-gray-100" />
                      <div className="w-6 h-6 flex items-center justify-center text-gray-500 font-black">-</div>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-[10px] text-gray-500"><MapPin size={12} className="text-[#0ea5e9]"/>{DEST_SHORT}</div>
                     <span className="text-[10px] font-bold text-[#0ea5e9] cursor-pointer hover:underline">Open full map</span>
                  </div>
                </div>

                {/* DARK Accordions Container (Safarix Style) */}
                <div className="mt-2 space-y-3">
                  <AccordionWidget title="Islamic Prayer Times" icon={Moon} defaultOpen={true}>
                     {prayerTimes && !prayerTimes.error ? (
                       <div>
                         <div className="p-3 rounded-lg mb-3" style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-2"><Moon size={11}/> Prayer Times</p>
                           <p className="text-[11px] mt-1.5 text-white/80">{hijriDate || ''}<br/>{DEST_SHORT}</p>
                         </div>
                         <div className="space-y-2 text-white font-medium text-[13px]">
                           {[
                             { name: 'Fajr',    time: prayerTimes.Fajr,    dot: '#818CF8' },
                             { name: 'Sunrise', time: prayerTimes.Sunrise, dot: '#FCD34D', dim: true },
                             { name: 'Dhuhr',   time: prayerTimes.Dhuhr,   dot: '#FBBF24' },
                             { name: 'Asr',     time: prayerTimes.Asr,     dot: '#FB923C' },
                             { name: 'Maghrib', time: prayerTimes.Maghrib, dot: '#F87171' },
                             { name: 'Isha',    time: prayerTimes.Isha,    dot: '#8B5CF6' },
                           ].map(p => (
                             <div key={p.name} className={`flex justify-between items-center ${p.dim ? 'opacity-30' : ''}`}>
                               <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: p.dot }}/> {p.name}</span>
                               <span>{p.time}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     ) : (
                       <div className="py-4 text-center text-xs text-white/30">
                         <Loader2 size={14} className="animate-spin mx-auto mb-2 text-[#10B981]" />
                         Loading prayer times for {DEST_SHORT}...
                       </div>
                     )}
                  </AccordionWidget>

                  <AccordionWidget title="Top & Hidden Spots" icon={Landmark} defaultOpen={true}>
                    <div className="space-y-4 pt-1">
                      {AI_GEMS.length > 0 ? AI_GEMS.map((gem, idx) => (
                        <div key={idx} className="flex gap-3 items-start group cursor-pointer">
                          <div className="w-[52px] h-[52px] rounded-[12px] bg-black/40 overflow-hidden flex-shrink-0 relative border border-white/5 shadow-md">
                             <img src={`https://picsum.photos/seed/${gem.split(' ')[0]}/100/100`} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" alt="gem" />
                          </div>
                          <div className="flex-1 mt-0.5">
                            <h4 className="text-[13px] font-bold text-white mb-0.5">{gem}</h4>
                            <p className="text-[11px] text-[#0ea5e9]/70 leading-snug line-clamp-2">A historic gem known for its beautiful architecture.</p>
                          </div>
                        </div>
                      )) : <p className="text-[12px] text-white/40">No curated spots found.</p>}
                    </div>
                  </AccordionWidget>

                  <AccordionWidget title="Popular Food Places" icon={Utensils}>
                     <div className="space-y-3 pt-1">
                        <p className="text-[12px] text-white/60">Savor the authentic local cuisine. Refer to itinerary tags for specifics.</p>
                     </div>
                  </AccordionWidget>

                  <AccordionWidget title="Lodging Options" icon={Bed}>
                     <div className="space-y-3 pt-1">
                        <p className="text-[12px] text-white/60">Premium selections based on your style metadata.</p>
                     </div>
                  </AccordionWidget>
                </div>
              </div>
            </div>
            {/* End Right Column */}
          </div>
        </div>
      </div>
    </AppInnerLayout>
  );
}
