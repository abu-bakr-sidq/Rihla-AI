// step7_cinematic.cjs — replace step 7 with cinematic storytelling layout
const fs = require('fs');
const FILE = 'src/pages/planner.jsx';
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

const START = lines.findIndex(l => l.includes('step === 7') && l.includes('generatedResult'));
let depth = 0, END = -1;
for (let i = START; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > START) { END = i; break; }
}
console.log(`Replacing lines ${START+1}–${END+1}`);

const NEW = `            {step === 7 && generatedResult && (() => {
              const res = generatedResult;
              if (!res?.days?.length) {
                return (
                  <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                    <Globe className="w-12 h-12 text-white/10 animate-pulse" />
                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Composing Your Journey...</p>
                  </div>
                );
              }

              const overview = res.trip_overview || {};
              const SLOTS    = ["morning", "afternoon", "evening", "night"];

              // Smart image URL — curated ID for known destinations, keyword fallback for others
              const usedSigs = new Set();
              const actImg = (act, w = 900, h = 600) => {
                if (act?.knownId && act?.image && act.image.length >= 10 && !act.image.includes(' ')) {
                  return "https://images.unsplash.com/photo-" + act.image.replace("photo-","") + "?auto=format&fit=crop&q=80&w=" + w;
                }
                const q   = encodeURIComponent((act?.imageQuery || act?.place || "travel destination") + " landmark");
                let  sig  = 1;
                while (usedSigs.has(q + sig)) sig++;
                usedSigs.add(q + sig);
                return "https://source.unsplash.com/" + w + "x" + h + "/?" + q + "&sig=" + sig;
              };

              const heroId  = getDestinationImage(overview.destination || formData.destination || "");
              const heroSrc = heroId
                ? "https://images.unsplash.com/photo-" + heroId.replace("photo-","") + "?auto=format&fit=crop&q=80&w=1920"
                : "https://source.unsplash.com/1920x900/?" + encodeURIComponent((overview.destination || "travel") + " city landmark");

              const fallback = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=900";

              // Alternating day-intro images (different from hero)
              const dayBannerImg = (day) => {
                const firstAct = day.morning || day.afternoon || {};
                return actImg(firstAct, 1400, 600);
              };

              // Slot layout variants (0=morning,1=afternoon,2=evening,3=night)
              const SLOT_ACCENT = {
                morning:   "#F59E0B",
                afternoon: "#F97316",
                evening:   "#818CF8",
                night:     "#60A5FA",
              };
              const SLOT_LABEL = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", night: "Night" };
              const SLOT_TIME  = { morning: "08:00 – 12:00", afternoon: "12:00 – 17:00", evening: "17:00 – 21:00", night: "21:00 – 23:30" };

              return (
                <motion.div key="cinematic" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.7 }} className="w-full pb-40">

                  {/* ══ CINEMATIC HERO ══════════════════════════════════════════ */}
                  <div className="relative w-screen left-1/2 -ml-[50vw] overflow-hidden" style={{ height:"80vh", minHeight:"520px" }}>
                    <img
                      src={heroSrc}
                      onError={(e) => { e.target.src=fallback; }}
                      className="w-full h-full object-cover"
                      style={{ objectPosition:"center 35%" }}
                      alt=""
                    />
                    {/* cinematic letterbox bars */}
                    <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-[#040c1c] to-transparent" />
                    <div className="absolute inset-0" style={{ background:"linear-gradient(160deg, rgba(4,12,28,0.1) 30%, rgba(4,12,28,0.92) 100%)" }} />

                    <div className="absolute bottom-0 left-0 right-0 px-8 md:px-20 pb-16 max-w-[1400px] mx-auto">
                      <div className="max-w-[680px]">
                        <p className="text-[9px] font-black uppercase tracking-[0.7em] text-[#D4AF37] mb-5 opacity-80">Rihla AI · Personalised Travel Story</p>
                        <h1 className="text-7xl md:text-9xl font-display font-black text-white uppercase leading-none tracking-tight drop-shadow-2xl mb-5">
                          {overview.destination || formData.destination}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/60 font-serif italic leading-relaxed mb-6">
                          &ldquo;{overview.total_days}-{overview.total_days === 1 ? "Day" : "Day"} {overview.travel_style || formData.travelStyle || "Curated"} Experience&rdquo;
                        </p>
                        <div className="flex flex-wrap gap-4 items-center">
                          <span className="text-[11px] font-bold text-white/50 uppercase tracking-[0.3em]">
                            {overview.dates}
                          </span>
                          <div className="w-1 h-1 rounded-full bg-white/20" />
                          <span className="text-[11px] font-bold text-white/50 uppercase tracking-[0.3em]">
                            {overview.passengers || formData.travelers} {(overview.passengers || formData.travelers) === 1 ? "Traveller" : "Travellers"}
                          </span>
                          <div className="w-1 h-1 rounded-full bg-white/20" />
                          <span className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">
                            {overview.budget}
                          </span>
                        </div>
                        {formData.preferences?.length > 0 && (
                          <p className="text-xs text-white/35 mt-4 italic">
                            Designed around: {formData.preferences.slice(0, 4).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ══ BUDGET OVERVIEW BAR ══════════════════════════════════════ */}
                  <div className="max-w-[1100px] mx-auto px-6 md:px-10 mt-12">
                    <div className="flex flex-wrap gap-8 items-center justify-between px-8 py-5 rounded-2xl border border-white/6"
                      style={{ background:"rgba(255,255,255,0.02)" }}>
                      <div className="flex flex-wrap gap-8">
                        {[
                          { Icon: Bed,      label: "Stay",       v: res.total_budget?.stay },
                          { Icon: Utensils, label: "Food",       v: res.total_budget?.food },
                          { Icon: Car,      label: "Transport",  v: res.total_budget?.transport },
                          { Icon: Zap,      label: "Activities", v: res.total_budget?.activities },
                        ].map(({ Icon, label, v }) => (
                          <div key={label} className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-white/20" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{label}</span>
                            <span className="text-sm font-display font-black text-white/80 ml-1 tracking-tight">{fmtCur(v || 0, formData.currency)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[9px] font-black text-[#D4AF37]/50 uppercase tracking-[0.4em]">Total Budget</span>
                        <span className="text-2xl font-display font-black text-[#D4AF37] tracking-tighter">{fmtCur(res.total_budget?.total || 0, formData.currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* ══ CINEMATIC DAY SECTIONS ══════════════════════════════════ */}
                  <div className="max-w-[1100px] mx-auto px-6 md:px-10 mt-20 space-y-32">
                    {res.days.map((day, di) => (
                      <motion.section
                        key={day.day}
                        initial={{ opacity:0 }}
                        whileInView={{ opacity:1 }}
                        viewport={{ once:true, margin:"-100px" }}
                        transition={{ duration:0.8, ease:"easeOut" }}
                      >
                        {/* Day Banner Image */}
                        <div className="relative h-[320px] md:h-[400px] rounded-3xl overflow-hidden mb-10">
                          <img
                            src={dayBannerImg(day)}
                            onError={(e) => { e.target.src=fallback; }}
                            className="w-full h-full object-cover"
                            style={{ objectPosition:"center 40%" }}
                            alt=""
                          />
                          <div className="absolute inset-0" style={{ background:"linear-gradient(to right, rgba(4,12,28,0.85) 30%, rgba(4,12,28,0.1))" }} />
                          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center flex-shrink-0">
                                <span className="text-base font-display font-black text-black">{day.day}</span>
                              </div>
                              <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.6em]">{day.date}</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-wide leading-tight max-w-[500px]">
                              {day.theme}
                            </h2>
                          </div>
                        </div>

                        {/* Activities — alternating layout */}
                        <div className="space-y-16">
                          {SLOTS.map((sk, si) => {
                            const act = day[sk];
                            if (!act?.place) return null;
                            const accent = SLOT_ACCENT[sk];
                            const img    = actImg(act, 900, 600);

                            if (si === 2) {
                              // EVENING — full-width banner
                              return (
                                <motion.div key={sk}
                                  initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                                  viewport={{ once:true, margin:"-60px" }} transition={{ duration:0.6 }}>
                                  <div className="relative h-[280px] rounded-2xl overflow-hidden">
                                    <img src={img} onError={(e)=>{e.target.src=fallback;}}
                                      className="w-full h-full object-cover" alt={act.place} />
                                    <div className="absolute inset-0" style={{ background:"linear-gradient(to top, rgba(4,12,28,0.9) 0%, rgba(4,12,28,0.2) 60%)" }} />
                                    <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-between gap-6">
                                      <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-[0.6em]" style={{ color: accent }}>✦ {SLOT_LABEL[sk]}</p>
                                        <h3 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-wide">{act.place}</h3>
                                        <p className="text-sm text-white/60 font-serif leading-relaxed max-w-md">&ldquo;{act.activity}&rdquo;</p>
                                      </div>
                                      <div className="flex-shrink-0 text-right space-y-1">
                                        <p className="text-xs text-white/40 font-mono tracking-wide">{SLOT_TIME[sk]}</p>
                                        <p className="text-xl font-display font-black text-[#D4AF37]">{fmtCur(act.cost||0, formData.currency)}</p>
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest">{act.travel}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-white/30 italic mt-4 pl-2 border-l border-white/10 max-w-lg">{act.reason}</p>
                                </motion.div>
                              );
                            }

                            if (si === 3) {
                              // NIGHT — compact strip
                              return (
                                <motion.div key={sk}
                                  initial={{ opacity:0 }} whileInView={{ opacity:1 }}
                                  viewport={{ once:true }} transition={{ duration:0.5 }}>
                                  <div className="flex gap-5 items-center">
                                    <div className="w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0">
                                      <img src={img} onError={(e)=>{e.target.src=fallback;}}
                                        className="w-full h-full object-cover" alt={act.place} />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <p className="text-[8px] font-black uppercase tracking-[0.6em]" style={{ color: accent }}>✦ {SLOT_LABEL[sk]}</p>
                                      <h3 className="text-base font-display font-black text-white uppercase tracking-wide">{act.place}</h3>
                                      <p className="text-xs text-white/50 leading-relaxed">{act.activity}</p>
                                    </div>
                                    <div className="flex-shrink-0 text-right space-y-1">
                                      <p className="text-xs text-white/35 font-mono">{SLOT_TIME[sk]}</p>
                                      <p className="text-lg font-display font-black text-[#D4AF37]">{fmtCur(act.cost||0, formData.currency)}</p>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            }

                            // MORNING & AFTERNOON — alternating side layout
                            const imgLeft = si === 0;
                            return (
                              <motion.div key={sk}
                                initial={{ opacity:0, x: imgLeft ? -20 : 20 }}
                                whileInView={{ opacity:1, x:0 }}
                                viewport={{ once:true, margin:"-60px" }}
                                transition={{ duration:0.6 }}>
                                <div className={cn("grid grid-cols-1 md:grid-cols-[50%_50%] gap-0 rounded-3xl overflow-hidden", !imgLeft && "md:direction-rtl")}>

                                  {/* Image panel */}
                                  <div className={cn("relative h-[280px] md:h-[360px] overflow-hidden", !imgLeft && "md:order-last")}>
                                    <img src={img} onError={(e)=>{e.target.src=fallback;}}
                                      className="w-full h-full object-cover transition-transform duration-[3000ms] hover:scale-105" alt={act.place} />
                                    <div className="absolute top-4 left-4 text-[9px] font-black uppercase tracking-[0.5em] px-3 py-1.5 rounded-lg"
                                      style={{ color: accent, background: accent + "18", border: "1px solid " + accent + "40" }}>
                                      ✦ {SLOT_LABEL[sk]}
                                    </div>
                                  </div>

                                  {/* Text panel */}
                                  <div className={cn(
                                    "px-8 md:px-10 py-8 flex flex-col justify-center gap-4",
                                    imgLeft ? "md:pl-10 md:pr-4" : "md:pr-10 md:pl-4"
                                  )} style={{ background:"rgba(8,14,26,0.80)", backdropFilter:"blur(20px)" }}>
                                    <div>
                                      <h3 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-wide leading-tight mb-3">
                                        {act.place}
                                      </h3>
                                      <p className="text-base text-white/60 font-serif leading-relaxed">&ldquo;{act.activity}&rdquo;</p>
                                    </div>

                                    {/* Inline meta */}
                                    <p className="text-[11px] text-white/35 font-mono tracking-widest">
                                      {SLOT_TIME[sk]} &nbsp;·&nbsp; {act.duration} &nbsp;·&nbsp; {act.travel}
                                    </p>

                                    {/* Cost */}
                                    <p className="text-2xl font-display font-black tracking-tighter" style={{ color: "#D4AF37" }}>
                                      {fmtCur(act.cost||0, formData.currency)}
                                    </p>

                                    {/* AI insight */}
                                    <div className="pt-2 border-t border-white/6">
                                      <p className="text-[10px] text-white/35 italic leading-relaxed">{act.reason}</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Day total — subtle inline */}
                        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-white/5">
                          <div className="flex flex-wrap gap-5 text-[10px] text-white/25 uppercase tracking-widest font-black">
                            {[
                              { l:"Stay", v: day.budget?.stay },
                              { l:"Food", v: day.budget?.food },
                              { l:"Transport", v: day.budget?.transport },
                              { l:"Activities", v: day.budget?.activities },
                            ].map(({ l, v }) => (
                              <span key={l}>{l} <span className="text-white/50">{fmtCur(v||0, formData.currency)}</span></span>
                            ))}
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-[9px] font-black text-[#D4AF37]/50 uppercase tracking-widest">Day {day.day} Total</span>
                            <span className="text-xl font-display font-black text-[#D4AF37]">{fmtCur(day.budget?.total||0, formData.currency)}</span>
                          </div>
                        </div>
                      </motion.section>
                    ))}
                  </div>

                  {/* ══ AI INSIGHTS — minimal 2-col ═════════════════════════════ */}
                  {res.ai_suggestions && (
                    <div className="max-w-[1100px] mx-auto px-6 md:px-10 mt-28">
                      <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/25 mb-10 text-center">AI Insider Intelligence</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { label:"Hidden Gems",     items:res.ai_suggestions.hidden_gems, col:"#F59E0B", Icon: Gem },
                          { label:"Best Photo Spots",items:res.ai_suggestions.photo_spots, col:"#818CF8", Icon: Camera },
                          { label:"Local Tips",      items:res.ai_suggestions.tips,        col:"#34D399", Icon: Lightbulb },
                          { label:"Things to Avoid", items:res.ai_suggestions.avoid,       col:"#F87171", Icon: AlertTriangle },
                        ].map(({ label, items, col, Icon }) => (
                          <div key={label} className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5" style={{ color: col }} />
                              <span className="text-[9px] font-black uppercase tracking-[0.5em]" style={{ color: col }}>{label}</span>
                            </div>
                            <div className="space-y-2 pl-5 border-l" style={{ borderColor: col + "30" }}>
                              {(items||[]).map((tip, idx) => (
                                <p key={idx} className="text-[11px] text-white/40 italic leading-relaxed">&ldquo;{tip}&rdquo;</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ══ FINALIZE ═════════════════════════════════════════════════ */}
                  <div className="max-w-[1100px] mx-auto px-6 md:px-10 mt-24">
                    <div className="relative overflow-hidden rounded-[32px] bg-[#D4AF37] p-10 md:p-14">
                      {/* texture */}
                      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-[0.08]"
                        style={{ background:"radial-gradient(circle, white, transparent 70%)", transform:"translate(30%, -30%)" }} />
                      <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
                        <div>
                          <p className="text-black/40 text-[9px] font-black uppercase tracking-[0.6em] mb-3">Your Complete Journey</p>
                          <p className="text-6xl md:text-7xl font-display font-black text-black tracking-tighter leading-none mb-3">
                            {fmtCur(res.total_budget?.total || 0, formData.currency)}
                          </p>
                          <p className="text-black/40 text-xs tracking-widest uppercase">
                            {overview.total_days} Days · {overview.passengers || formData.travelers} {(overview.passengers || formData.travelers) === 1 ? "Traveller" : "Travellers"} · {overview.travel_style || formData.travelStyle}
                          </p>
                        </div>
                        <div className="flex flex-col gap-3">
                          <button onClick={handleSave}
                            className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-black text-[#D4AF37] font-black text-[11px] uppercase tracking-[0.3em] hover:scale-[1.03] transition-all shadow-xl whitespace-nowrap">
                            <ShieldCheck className="w-4 h-4" /> Finalize & Save Trip
                          </button>
                          <button onClick={() => setStep(5)}
                            className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-black/15 border border-black/25 text-black font-black text-[11px] uppercase tracking-[0.3em] hover:bg-black/25 transition-all whitespace-nowrap">
                            <PenLine className="w-4 h-4" /> Customize Plan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </motion.div>
              );
            })()}`;

const result = [...lines.slice(0, START), NEW, ...lines.slice(END + 1)];
fs.writeFileSync(FILE, result.join('\n'), 'utf8');
console.log('Done. Total lines:', result.length, '| Step 7 replaced:', START+1, '–', END+1);
