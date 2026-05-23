/**
 * MapPage — Full-screen SVG route map view with day selector, animated route,
 * clickable pins with popups, and right panel stop list.
 * Supports /map and /map/:id — loads trip by ID when present.
 */
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { resolveApiUrl } from "@/lib/api-contract";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  ArrowLeft, List, MessageSquare, Map as MapIcon, 
  Navigation, Clock, Ruler, CreditCard, Calendar,
  ChevronLeft, Plus, Minus, Target
} from "lucide-react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  :root {
    --bg: #050810;
    --bg2: #08091a;
    --bg3: #0d1220;
    --bg4: #111828;
    --b: rgba(255,255,255,.07);
    --b2: rgba(255,255,255,.15);
    --t: #f4efe8;
    --t2: #8492aa;
    --t3: #3a4a60;
    --aurora-cyan: #22d3ee;
    --aurora-violet: #a855f7;
    --aurora-fuchsia: #e879f9;
    --aurora-indigo: #6366f1;
    --ff: 'Outfit', sans-serif;
    --fb: 'Inter', sans-serif;
    --fm: 'JetBrains Mono', monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { background: var(--bg); color: var(--t); font-family: var(--fb); font-size: 14px; overflow: hidden; height: 100vh }
  @keyframes dash { to { stroke-dashoffset: -60 } }
  @keyframes ripple { 0% { transform: scale(1); opacity: .35 } 100% { transform: scale(2.4); opacity: 0 } }
  @keyframes flow { 0% { left: 0; opacity: .8 } 100% { left: 60%; opacity: 0 } }
  @keyframes routeglow { 0%, 100% { opacity: .08 } 50% { opacity: .15 } }
  @keyframes ambientPulse { 0%, 100% { opacity: .04 } 50% { opacity: .08 } }
  .mc-btn:hover { border-color: rgba(34,211,238,.4) !important; color: var(--aurora-cyan) !important; background: rgba(34,211,238,.1) !important; }
  .map-pin:hover { transform: translateY(-4px) scale(1.08) }
  .stop-row:hover { background: var(--bg3); padding-left: 10px; padding-right: 10px; margin-left: -10px; margin-right: -10px }
  .dsel:hover:not(.on) { background: var(--bg3); color: var(--t2) }
  .ptab:hover:not(.on) { background: rgba(255,255,255,.04) }
  .tbtn:hover { border-color: rgba(34,211,238,.3) !important; color: var(--t) !important; }
  .popup-btn:hover { opacity: .8 }
`;

const ACTIVITY_IMAGES = {
  hotel:   "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=88",
  culture: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=88",
  food:    "https://images.unsplash.com/photo-1565098772267-60af42b81ef2?w=400&q=88",
  art:     "https://images.unsplash.com/photo-1554797589-7241bb691973?w=400&q=88",
  dinner:  "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400&q=88",
  morning: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=88",
  default: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&q=88",
};

const TYPE_COLORS = {
  hotel:   { border:"#a855f7", bg:"rgba(168,85,247,.18)",  glow:"rgba(168,85,247,.45)", text:"#a855f7" }, // Violet
  culture: { border:"#22d3ee", bg:"rgba(34,211,238,.18)",  glow:"rgba(34,211,238,.45)", text:"#22d3ee" }, // Cyan
  food:    { border:"#e879f9", bg:"rgba(232,121,249,.18)", glow:"rgba(232,121,249,.45)", text:"#e879f9" }, // Fuchsia
  art:     { border:"#6366f1", bg:"rgba(99,102,241,.18)",  glow:"rgba(99,102,241,.45)", text:"#6366f1" }, // Indigo
  transit: { border:"#34d399", bg:"rgba(52,211,153,.18)",  glow:"rgba(52,211,153,.45)", text:"#34d399" }, // Emerald
};

/* Generate pin positions for stops — spread across the map */
const PIN_POSITIONS = [
  { x:"200px", y:"460px" }, { x:"326px", y:"244px" }, { x:"456px", y:"175px" },
  { x:"696px", y:"170px" }, { x:"808px", y:"320px" }, { x:"550px", y:"350px" },
  { x:"410px", y:"420px" }, { x:"640px", y:"280px" },
];

function getActivityImg(act) {
  const t = ((act?.title)||"").toLowerCase();
  if (t.includes("hotel")||t.includes("check")) return ACTIVITY_IMAGES.hotel;
  if (t.includes("temple")||t.includes("museum")||t.includes("culture")) return ACTIVITY_IMAGES.culture;
  if (t.includes("lunch")||t.includes("market")||t.includes("food")) return ACTIVITY_IMAGES.food;
  if (t.includes("art")||t.includes("team")) return ACTIVITY_IMAGES.art;
  if (t.includes("dinner")||t.includes("ramen")) return ACTIVITY_IMAGES.dinner;
  if (t.includes("morning")) return ACTIVITY_IMAGES.morning;
  return ACTIVITY_IMAGES.default;
}

function getStopType(act) {
  const t = ((act?.title)||"").toLowerCase();
  if (t.includes("hotel")||t.includes("check")) return "hotel";
  if (t.includes("temple")||t.includes("museum")||t.includes("culture")) return "culture";
  if (t.includes("food")||t.includes("lunch")||t.includes("market")) return "food";
  if (t.includes("art")) return "art";
  if (t.includes("transit")||t.includes("metro")||t.includes("bus")) return "transit";
  return "culture";
}

/* Build SVG route path through pin positions */
function buildPath(count) {
  const pts = PIN_POSITIONS.slice(0, count).map(p => ({
    x: parseInt(p.x), y: parseInt(p.y)
  }));
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i=1; i<pts.length; i++) {
    const prev = pts[i-1], curr = pts[i];
    const cx = (prev.x + curr.x)/2;
    d += ` Q ${cx} ${prev.y} ${curr.x} ${curr.y}`;
  }
  return d;
}

/* Fallback demo stops when no trip loaded */
const DEMO_STOPS = [
  { title:"Hotel Check-in", time:"Morning", location:"City Centre", description:"Arrive and settle in at your hotel.", cost:"₹15,000/night" },
  { title:"Senso-ji Temple", time:"Morning", location:"Old Quarter", description:"Visit the iconic ancient temple.", cost:"Free" },
  { title:"Local Food Market", time:"Afternoon", location:"Market District", description:"Taste fresh local cuisine.", cost:"₹1,500" },
  { title:"Art Museum", time:"Afternoon", location:"Arts District", description:"Immersive digital art experience.", cost:"₹2,300" },
  { title:"Dinner & Nightlife", time:"Evening", location:"Downtown", description:"Fine dining and evening walk.", cost:"₹1,800" },
];

export default function MapPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useUser();
  const { toast } = useToast();

  const [trip,       setTrip]       = useState(null);
  const [loading,    setLoading]    = useState(!!id);
  const [activeDay,  setActiveDay]  = useState(0);
  const [activeStop, setActiveStop] = useState(null); // index of stop
  const [panelTab,   setPanelTab]   = useState("Stops");

  useEffect(() => {
    if (!userLoading && !user) { setLocation("/auth"); return; }
    if (!id) { setLoading(false); return; }
    fetch(resolveApiUrl(`/api/trips/${id}`), { credentials:"include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { setTrip(data); setLoading(false); })
      .catch(e => {
        toast({ title:"Could not load trip", variant:"destructive" });
        setLoading(false);
      });
  }, [id, user, userLoading]);

  const itinerary = Array.isArray(trip?.itinerary) ? trip.itinerary : [];
  const totalDays = trip?.days || itinerary.length || 7;
  const dayLabels = Array.from({length:totalDays}, (_,i) => ({ n:i+1, label:`Day ${i+1}` }));

  const activeDayPlan = itinerary[activeDay] || null;
  const stops = activeDayPlan?.activities || DEMO_STOPS;
  const destination = trip?.destination || "Your Journey";

  const routePath = buildPath(Math.min(stops.length, PIN_POSITIONS.length));
  const stopCount = stops.length;

  const activeStopData = activeStop !== null ? stops[activeStop] : stops[1] || stops[0];
  const activeStopImg  = getActivityImg(activeStopData);
  const activeStopType = getStopType(activeStopData);
  const activeStopColors = TYPE_COLORS[activeStopType] || TYPE_COLORS.culture;

  /* Compute total distance & cost per day */
  const dayCost = stops.reduce((acc,s) => {
    const m = String(s?.cost||"").match(/[\d,]+/);
    return acc + (m ? parseInt(m[0].replace(/,/g,"")) : 0);
  }, 0);

  if (loading) {
    return (
      <div style={{ height:"100vh", background:"#050810", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <style>{CSS}</style>
        <div style={{ width:44, height:44, borderRadius:"50%", border:"2px solid rgba(34,211,238,.3)", borderTopColor:"#22d3ee", animation:"sp 1s linear infinite" }} />
        <style>{"@keyframes sp{to{transform:rotate(360deg)}}"}</style>
        <p style={{ fontFamily: "var(--fm)", fontSize: 10, color: "var(--t3)", letterSpacing: ".2em" }}>ANALYZING GLOBE...</p>
      </div>
    );
  }

  return (
    <div style={{ height:"100vh", background:"#04060c", color:"#f4efe8", fontFamily:"'Inter',sans-serif", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{CSS}</style>

      {/* ── TOPBAR ── */}
      <div style={{ flexShrink:0, height:64, background:"rgba(5,8,16,.96)", borderBottom:"1px solid rgba(255,255,255,.08)", backdropFilter:"blur(24px)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", zIndex:300, position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          <BrandLogo size={32} className="cursor-pointer" onClick={() => setLocation("/dashboard")} />
          <div style={{ width:1, height:20, background:"rgba(255,255,255,.12)" }} />
          <button onClick={()=>id ? setLocation(`/trips/${id}`) : setLocation("/my-trips")}
            style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, fontWeight:600, color:"var(--t2)", cursor:"pointer", transition:"all .2s", padding:"8px 12px", borderRadius:10, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", fontFamily:"var(--fb)" }}
            className="tbtn">
            <ArrowLeft size={14} /> Back to Itinerary
          </button>
          <div style={{ width:1, height:20, background:"rgba(255,255,255,.12)" }} />
          <div>
            <div style={{ fontFamily:"var(--ff)", fontSize:16, fontWeight:600, color:"#fff", letterSpacing:"-0.02em" }}>{destination}</div>
            <div style={{ fontSize:10, color:"var(--t3)", fontFamily:"var(--fm)", letterSpacing:".04em", marginTop:2 }}>
              {trip?.startDate ? new Date(trip.startDate).toLocaleDateString("en",{month:"short",day:"numeric"}) : "PLANNING"} · DAY {activeDay+1} · {stopCount} STOPS
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <ThemeToggle size={20} className="scale-75" />
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer", border:"1px solid rgba(34,211,238,.4)", background:"rgba(34,211,238,.12)", color:"var(--aurora-cyan)", boxShadow:"0 0 20px rgba(34,211,238,.15)" }}>
            <MapIcon size={14} /> Map View
          </div>
          {id && (
            <button onClick={()=>setLocation(`/trips/${id}`)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:12, fontSize:12, fontWeight:600, cursor:"pointer", border:"1px solid rgba(255,255,255,.08)", background:"rgba(255,255,255,0.03)", color:"var(--t2)", fontFamily:"var(--fb)" }}
              className="tbtn">
              <List size={14} /> Timeline
            </button>
          )}
          <button style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 20px", borderRadius:12, fontSize:12, cursor:"pointer", border:"1px solid rgba(168,85,247,.4)", background:"linear-gradient(135deg,rgba(34,211,238,.2),rgba(168,85,247,.2))", color:"#fff", fontFamily:"var(--fb)", fontWeight:700, boxShadow:"0 4px 15px rgba(0,0,0,.2)" }}
            className="tbtn">
            <MessageSquare size={14} /> Ask AI
          </button>
        </div>
      </div>

      {/* ── LAYOUT ── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>

        {/* ── MAP CANVAS ── */}
        <div style={{ flex:1, position:"relative", overflow:"hidden", background:"#06080f" }}>
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="250" cy="350" rx="200" ry="150" fill="rgba(34,211,238,.03)" style={{ animation:"ambientPulse 8s ease-in-out infinite" }} />
            <ellipse cx="700" cy="250" rx="180" ry="130" fill="rgba(168,85,247,.03)" style={{ animation:"ambientPulse 8s ease-in-out infinite 2s" }} />

            <line x1="0" y1="200" x2="1000" y2="200" stroke="rgba(255,255,255,0.03)" strokeWidth="12"/>
            <line x1="0" y1="420" x2="1000" y2="420" stroke="rgba(255,255,255,0.03)" strokeWidth="12"/>
            <line x1="0" y1="560" x2="1000" y2="560" stroke="rgba(255,255,255,0.03)" strokeWidth="8"/>
            <line x1="180" y1="0" x2="180" y2="700" stroke="rgba(255,255,255,0.03)" strokeWidth="10"/>
            <line x1="380" y1="0" x2="380" y2="700" stroke="rgba(255,255,255,0.03)" strokeWidth="12"/>
            <line x1="620" y1="0" x2="620" y2="700" stroke="rgba(255,255,255,0.03)" strokeWidth="8"/>
            <line x1="820" y1="0" x2="820" y2="700" stroke="rgba(255,255,255,0.03)" strokeWidth="6"/>
            {/* Minor roads */}
            <line x1="0" y1="310" x2="600" y2="310" stroke="rgba(255,255,255,0.025)" strokeWidth="4"/>
            <line x1="400" y1="310" x2="1000" y2="480" stroke="rgba(255,255,255,0.025)" strokeWidth="4"/>
            <line x1="280" y1="0" x2="280" y2="700" stroke="rgba(255,255,255,0.025)" strokeWidth="4"/>
            <line x1="500" y1="0" x2="500" y2="700" stroke="rgba(255,255,255,0.025)" strokeWidth="4"/>
            <line x1="720" y1="0" x2="720" y2="700" stroke="rgba(255,255,255,0.025)" strokeWidth="4"/>
            {/* Block fills */}
            {[[185,205,90,90],[285,205,90,100],[385,205,130,100],[185,315,90,100],[285,315,90,100],[625,205,90,210],[725,205,90,100],[725,315,90,100],[185,425,195,130],[385,425,230,130]].map(([x,y,w,h],i)=>(
              <rect key={i} x={x} y={y} width={w} height={h} rx="6" fill="rgba(255,255,255,0.012)"/>
            ))}

            {/* Route glow (thick, low opacity) */}
            {routePath && (
              <path d={routePath} fill="none" stroke="var(--aurora-cyan)" strokeWidth="12" strokeLinecap="round" opacity="0.08" style={{ animation:"routeglow 3s ease-in-out infinite" }} />
            )}
            {/* Animated dashed route */}
            {routePath && (
              <path d={routePath} fill="none" stroke="var(--aurora-cyan)" strokeWidth="3"
                strokeDasharray="12 10" strokeLinecap="round" opacity="0.8"
                style={{ animation:"dash 3s linear infinite" }} />
            )}

            {/* Stop connector dots */}
            {stops.slice(0, PIN_POSITIONS.length).map((_,i) => {
              const pos = PIN_POSITIONS[i];
              const tc  = TYPE_COLORS[getStopType(stops[i])] || TYPE_COLORS.culture;
              return <circle key={i} cx={parseInt(pos.x)} cy={parseInt(pos.y)} r="5" fill={tc.border} opacity="0.6" />;
            })}
          </svg>

          {/* Day selector */}
          <div style={{ position:"absolute", top:20, left:"50%", transform:"translateX(-50%)", display:"flex", gap:6, background:"rgba(8,9,26,.92)", border:"1px solid rgba(255,255,255,.12)", borderRadius:16, padding:6, backdropFilter:"blur(20px)", zIndex:100, boxShadow:"0 10px 30px rgba(0,0,0,.3)" }}>
            {dayLabels.slice(0,7).map((dl,i) => (
              <div key={i} className={`dsel ${i===activeDay?"on":""}`}
                onClick={()=>{ setActiveDay(i); setActiveStop(null); }}
                style={{ padding:"8px 18px", borderRadius:12, fontFamily:"var(--fm)", fontSize:10, cursor:"pointer", color:i===activeDay?"#000":"var(--t3)", background:i===activeDay?"var(--aurora-cyan)":"transparent", fontWeight:i===activeDay?800:500, transition:"all .3s", letterSpacing:".04em" }}>
                DAY {dl.n}
              </div>
            ))}
          </div>

          {/* Pins */}
          {stops.slice(0, PIN_POSITIONS.length).map((stop, i) => {
            const pos = PIN_POSITIONS[i];
            const tc  = TYPE_COLORS[getStopType(stop)] || TYPE_COLORS.culture;
            const isActive = activeStop === i || (activeStop === null && i === 1);
            return (
              <div key={i} className="map-pin"
                onClick={()=>setActiveStop(i)}
                style={{ position:"absolute", left:pos.x, top:pos.y, display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", transition:"transform .4s cubic-bezier(.34,1.56,.64,1)", zIndex:isActive?150:100, transform:isActive?"translateY(-6px) scale(1.1)":"none" }}>
                <div style={{ width:40, height:40, borderRadius:"14px", border:`2px solid ${tc.border}`, background:tc.bg, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", backdropFilter:"blur(12px)", boxShadow:isActive?`0 0 30px ${tc.glow}`:undefined, rotate: "45deg" }}>
                  <div style={{ rotate: "-45deg", fontFamily:"var(--fm)", fontSize:12, fontWeight:800, color:"#fff" }}>
                    {i===0 ? "H" : i}
                  </div>
                  <div style={{ position:"absolute", inset:-8, borderRadius:"18px", border:`1.5px solid ${tc.border}`, opacity:0, animation:isActive?"ripple 2.5s ease-out infinite":"none" }} />
                </div>
                <div style={{ marginTop:14, fontSize:10, fontFamily:"var(--fb)", fontWeight:600, padding:"4px 10px", borderRadius:8, background:"rgba(8,9,26,.95)", border:"1px solid rgba(255,255,255,.12)", whiteSpace:"nowrap", backdropFilter:"blur(12px)", color:"#fff", boxShadow:"0 4px 15px rgba(0,0,0,.4)" }}>
                  {stop.title || "Stop"}
                </div>
              </div>
            );
          })}

          {/* Active popup */}
          {activeStopData && (() => {
            const pinPos = PIN_POSITIONS[activeStop !== null ? activeStop : 1];
            const pinX   = parseInt(pinPos?.x||"360");
            const pinY   = parseInt(pinPos?.y||"80");
            const popLeft = Math.max(20, Math.min(pinX - 120, 660));
            const popTop  = Math.max(20, pinY - 260);
            return (
              <div style={{ position:"absolute", left:popLeft, top:popTop, background:"var(--bg2)", border:"1px solid rgba(255,255,255,.12)", borderRadius:24, padding:20, width:240, zIndex:200, backdropFilter:"blur(32px)", boxShadow:"0 30px 100px rgba(0,0,0,.8)", transition:"all .3s" }}>
                <img src={activeStopImg} alt={activeStopData.title} style={{ width:"100%", height:120, borderRadius:16, objectFit:"cover", display:"block", marginBottom:16 }} />
                <div style={{ fontFamily:"var(--fm)", fontSize:8, letterSpacing:".15em", color:"var(--aurora-cyan)", marginBottom:6, textTransform:"uppercase", fontWeight:700 }}>
                  STOP {activeStop !== null ? activeStop+1 : 2} · {activeStopType}
                </div>
                <div style={{ fontFamily:"var(--ff)", fontSize:18, fontWeight:700, color:"#fff", marginBottom:8, lineHeight:1.2 }}>{activeStopData.title}</div>
                <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
                  <span style={{ fontSize:11, color:"var(--t2)", display:"flex", alignItems:"center", gap:5 }}>
                    <Navigation size={12} className="text-zinc-600" />
                    {activeStopData.location || "City Centre"}
                  </span>
                  {activeStopData.cost && (
                    <span style={{ fontFamily:"var(--fm)", fontSize:10, color:"#34d399", background:"rgba(52,211,153,.1)", border:"1px solid rgba(52,211,153,.2)", borderRadius:8, padding:"3px 10px" }}>{activeStopData.cost}</span>
                  )}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="popup-btn" style={{ flex:1, padding:10, borderRadius:12, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"var(--fb)", background:"rgba(34,211,238,.12)", border:"1px solid rgba(34,211,238,.3)", color:"var(--aurora-cyan)" }}>
                    DIRECTIONS
                  </button>
                  <button onClick={()=>setActiveStop(null)} className="popup-btn" style={{ padding:10, borderRadius:12, fontSize:11, cursor:"pointer", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.1)", color:"var(--t2)" }}>
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Map Controls */}
          <div style={{ position:"absolute", right:24, top:"50%", transform:"translateY(-50%)", display:"flex", flexDirection:"column", gap:10, zIndex:150 }}>
            {[
              { icon: <Plus size={18} />, key: "+" },
              { icon: <Minus size={18} />, key: "-" },
              { icon: null, key: "sep" },
              { icon: <Target size={18} />, key: "c" },
              { icon: <Navigation size={18} />, key: "n" },
            ].map((node,i) => node.key === "sep"
              ? <div key="sep" style={{ height:1, background:"rgba(255,255,255,.1)", margin:"4px 0" }} />
              : (
                <div key={i} className="mc-btn" style={{ width:42, height:42, background:"rgba(5,8,16,.85)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--t2)", transition:"all .3s", backdropFilter:"blur(16px)" }}>
                  {node.icon}
                </div>
              )
            )}
          </div>

          {/* Legend */}
          <div style={{ position:"absolute", bottom:24, left:24, background:"rgba(5,8,16,.88)", border:"1px solid rgba(255,255,255,.12)", borderRadius:16, padding:"16px 20px", backdropFilter:"blur(24px)", zIndex:150, boxShadow:"0 10px 40px rgba(0,0,0,.5)" }}>
            <div style={{ fontFamily:"var(--fm)", fontSize:9, letterSpacing:".2em", color:"var(--t3)", marginBottom:12, textTransform:"uppercase", fontWeight:700 }}>LEGEND</div>
            {[{c:"#a855f7",l:"Hotel"},{c:"#22d3ee",l:"Culture"},{c:"#e879f9",l:"Food"},{c:"#6366f1",l:"Art"},{c:"#34d399",l:"Transit"}].map(({c,l})=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, fontSize:11, fontWeight:600, color:"var(--t2)" }}>
                <div style={{ width:8, height:8, borderRadius:3, background:c, boxShadow:`0 0 10px ${c}55` }} />
                {l}
              </div>
            ))}
          </div>

          {/* Route info bar */}
          <div style={{ position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)", background:"rgba(5,8,16,.94)", border:"1px solid rgba(255,255,255,.12)", borderRadius:20, padding:"14px 28px", backdropFilter:"blur(32px)", display:"flex", gap:32, alignItems:"center", zIndex:150, boxShadow:"0 20px 60px rgba(0,0,0,.6)" }}>
            {[
              { icon:<Clock size={16} className="text-cyan-400" />, v:`${stopCount*1.5} hrs`, l:"TOTAL TIME" },
              { icon:<Ruler size={16} className="text-violet-400" />, v:`${(stopCount*1.2).toFixed(1)} km`, l:"TOTAL DIST" },
              { icon:<CreditCard size={16} className="text-emerald-400" />, v:dayCost > 0 ? `$${dayCost.toFixed(0)}` : "—", l:"DAY BUDGET" },
              { icon:<Calendar size={16} className="text-fuchsia-400" />, v:`${stopCount} Stops`, l:`DAY ${activeDay+1}` },
            ].map(({icon,v,l}, i, arr) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                {icon}
                <div>
                  <div style={{ fontFamily:"var(--ff)", fontSize:17, fontWeight:700, color:"#fff", lineHeight:1.1 }}>{v}</div>
                  <div style={{ fontSize:9, color:"var(--t3)", fontFamily:"var(--fm)", marginTop:3, letterSpacing:".1em", fontWeight:600 }}>{l}</div>
                </div>
                {i < arr.length-1 && <div style={{ width:1, height:32, background:"rgba(255,255,255,.15)", marginLeft:12 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ width:340, flexShrink:0, background:"var(--bg2)", borderLeft:"1px solid rgba(255,255,255,.08)", display:"flex", flexDirection:"column", overflow:"hidden", zIndex:200 }}>
          <div style={{ padding:"24px", borderBottom:"1px solid rgba(255,255,255,.08)", flexShrink:0 }}>
            <div style={{ fontFamily:"var(--ff)", fontSize:20, fontWeight:700, color:"#fff", letterSpacing:"-0.02em" }}>Day {activeDay+1} Timeline</div>
            <div style={{ fontSize:11, color:"var(--t3)", marginTop:6, display:"flex", alignItems:"center", gap:8, fontWeight:500 }}>
              <Clock size={12} />
              {stopCount} Activities · {(stopCount*1.2).toFixed(1)} km mapped
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,.08)", flexShrink:0, padding:"0 12px" }}>
            {["Stops","Directions","Insights"].map(tab => (
              <div key={tab} className="ptab" onClick={()=>setPanelTab(tab)}
                style={{ flex:1, padding:"16px 0", textAlign:"center", fontSize:11, fontWeight:700, color:panelTab===tab?"var(--aurora-cyan)":"var(--t3)", cursor:"pointer", borderBottom:`2.5px solid ${panelTab===tab?"var(--aurora-cyan)":"transparent"}`, transition:"all .3s", letterSpacing:".05em", textTransform:"uppercase" }}>
                {tab}
              </div>
            ))}
          </div>

          {/* Panel body */}
          <div style={{ flex:1, overflowY:"auto", padding:16 }} className="custom-scrollbar">
            {panelTab === "Stops" && stops.map((stop, i) => {
              const tc  = TYPE_COLORS[getStopType(stop)] || TYPE_COLORS.culture;
              const img = getActivityImg(stop);
              const isActive = activeStop === i;
              return (
                <div key={i}>
                  <div className="stop-row" onClick={()=>setActiveStop(i)}
                    style={{ display:"flex", gap:14, padding:14, borderBottom:i<stops.length-1?"1px solid rgba(255,255,255,.05)":"none", cursor:"pointer", transition:"all .3s", borderRadius:16, background:isActive?"rgba(34,211,238,.08)":undefined }}>
                    <div style={{ width:30, height:30, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--fm)", fontSize:11, fontWeight:800, flexShrink:0, background:tc.bg, color:tc.text, border:`1.5px solid ${tc.border}44` }}>{i===0?"H":i}</div>
                    <img src={img} alt={stop.title} style={{ width:56, height:50, borderRadius:12, objectFit:"cover", flexShrink:0, boxShadow:"0 4px 12px rgba(0,0,0,.3)" }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"#fff", marginBottom:4, truncate:true }}>{stop.title}</div>
                      <div style={{ fontSize:10, color:"var(--t3)", display:"flex", gap:10, alignItems:"center", fontWeight:500 }}>
                        <span>{stop.time||"Plan"}</span>
                        {stop.cost && <span style={{ color:"#34d399", fontWeight:700 }}>{stop.cost}</span>}
                      </div>
                    </div>
                  </div>
                  {i < stops.length-1 && (
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0 8px 45px", fontSize:10, color:"var(--t3)", fontFamily:"var(--fm)", fontWeight:600 }}>
                      <Navigation size={12} />
                      ~20 MIN
                      <div style={{ flex:1, height:1, background:"rgba(255,255,255,.08)", position:"relative", overflow:"hidden" }}>
                        <div style={{ position:"absolute", left:0, top:-2, width:"40%", height:5, borderRadius:4, background:"linear-gradient(90deg,var(--aurora-cyan),transparent)", animation:"flow 2s linear infinite" }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {panelTab === "Directions" && (
              <div style={{ padding:8 }}>
                {stops.map((stop, i) => i < stops.length-1 && (
                  <div key={i} style={{ marginBottom:12, padding:20, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.08)", borderRadius:20 }}>
                    <div style={{ fontSize:12, color:"#fff", fontWeight:700, marginBottom:8 }}>
                      {stop.title} → {stops[i+1]?.title}
                    </div>
                    <div style={{ fontSize:10, color:"var(--t3)", fontFamily:"var(--fm)", display:"flex", gap:12, fontWeight:600 }}>
                      <span style={{ color:"var(--aurora-cyan)" }}>🚇 PUBLIC TRANSIT</span>
                      <span>~25 MIN</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {panelTab === "Insights" && (
              <div style={{ padding:8 }}>
                <div style={{ padding:20, background:"rgba(168,85,247,.08)", border:"1px solid rgba(168,85,247,.2)", borderRadius:20, marginBottom:16 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
                    <Target size={14} className="text-violet-400" /> AI Optimization
                  </div>
                  <div style={{ fontSize:11, color:"var(--t2)", lineHeight:1.6 }}>Stops have been grouped geographically to minimize travel fatigue. Recommend starting before 9:00 AM.</div>
                </div>
                <div style={{ padding:20, background:"rgba(34,211,238,.08)", border:"1px solid rgba(34,211,238,.2)", borderRadius:20 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
                    <Navigation size={14} className="text-cyan-400" /> Transit Tips
                  </div>
                  <div style={{ fontSize:11, color:"var(--t2)", lineHeight:1.6 }}>IC Card or digital pass recommended for seamless metro transfers. Estimated daily transit cost: $12–18.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
