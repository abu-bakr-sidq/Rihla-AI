// step7_inject.cjs — CommonJS, safe to run with node directly
const fs = require('fs');
const FILE = 'src/pages/planner.jsx';

const lines = fs.readFileSync(FILE, 'utf8').split('\n');

// Find exact boundaries
const START = lines.findIndex(l => l.includes('step === 7') && l.includes('generatedResult'));
let depth = 0, END = -1;
for (let i = START; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > START) { END = i; break; }
}
console.log(`Replacing lines ${START+1}–${END+1} (${END-START+1} lines)`);

const NEW = `            {step === 7 && generatedResult && (() => {
              const res = generatedResult;
              if (!res?.days?.length) {
                return (
                  <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                    <Globe className="w-12 h-12 text-white/10 animate-pulse" />
                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Building Your Journey...</p>
                  </div>
                );
              }

              const overview  = res.trip_overview || {};
              const SLOTS     = ["morning", "afternoon", "evening", "night"];
              const SLOT_COLOR = {
                morning:   "text-amber-400",
                afternoon: "text-orange-400",
                evening:   "text-indigo-400",
                night:     "text-blue-300",
              };
              const SLOT_PILL = {
                morning:   "bg-amber-400/10 border-amber-400/25",
                afternoon: "bg-orange-400/10 border-orange-400/25",
                evening:   "bg-indigo-400/10 border-indigo-400/25",
                night:     "bg-blue-400/10   border-blue-400/25",
              };

              // Reliable Unsplash URL from photo ID
              const slotImg = (slot) => {
                const id = slot?.image;
                const fb = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=900";
                if (!id) return fb;
                if (id.length >= 10 && !id.includes(" "))
                  return "https://images.unsplash.com/photo-" + id.replace("photo-","") + "?auto=format&fit=crop&q=80&w=900";
                return fb;
              };

              const heroId  = getDestinationImage(overview.destination || formData.destination || "");
              const heroSrc = heroId
                ? "https://images.unsplash.com/photo-" + heroId.replace("photo-","") + "?auto=format&fit=crop&q=80&w=1600"
                : "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1600";

              return (
                <motion.div key="scroll-plan" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.6 }} className="w-full pb-32">

                  {/* ══ HERO ══════════════════════════════════════════════════ */}
                  <div className="relative w-screen left-1/2 -ml-[50vw] overflow-hidden" style={{ height:"70vh", minHeight:"480px" }}>
                    <img
                      src={heroSrc}
                      onError={(e) => { e.target.src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1600"; }}
                      className="w-full h-full object-cover"
                      style={{ objectPosition:"center 30%" }}
                      alt=""
                    />
                    <div className="absolute inset-0" style={{ background:"linear-gradient(to bottom, rgba(4,12,28,0.3) 0%, rgba(4,12,28,0.95) 100%)" }} />
                    <div className="absolute bottom-0 left-0 right-0 px-8 md:px-20 pb-14 max-w-[1400px] mx-auto">
                      <p className="text-[10px] font-black uppercase tracking-[0.55em] text-[#D4AF37] mb-4">Rihla AI — Your Travel Plan</p>
                      <h1 className="text-6xl md:text-8xl font-display font-black text-white tracking-tight uppercase leading-none mb-6 drop-shadow-2xl">
                        {overview.destination || formData.destination}
                      </h1>
                      <div className="flex flex-wrap gap-4 items-center mb-6">
                        <span className="flex items-center gap-2 text-[11px] font-bold text-white/65 uppercase tracking-[0.25em]">
                          <Calendar className="w-3.5 h-3.5" /> {overview.dates}
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="flex items-center gap-2 text-[11px] font-bold text-white/65 uppercase tracking-[0.25em]">
                          <Clock className="w-3.5 h-3.5" /> {overview.total_days} Days
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="flex items-center gap-2 text-[11px] font-bold text-white/65 uppercase tracking-[0.25em]">
                          <Users className="w-3.5 h-3.5" /> {overview.passengers || formData.travelers} Travellers
                        </span>
                        <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[11px] font-black uppercase tracking-[0.2em]">
                          <Wallet className="w-3.5 h-3.5" /> {overview.budget}
                        </span>
                      </div>
                      <p className="text-sm text-white/50 max-w-xl leading-relaxed font-serif italic">
                        &ldquo;AI curated a {overview.travel_style || formData.travelStyle || "personalised"} experience tailored to your {formData.preferences?.length ? formData.preferences.slice(0,3).join(", ") : "preferences"}.&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* ══ MAIN CONTENT ══════════════════════════════════════════ */}
                  <div className="max-w-[1100px] mx-auto px-6 md:px-10 mt-16">

                    {/* Quick Overview Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                      {[
                        { icon: Bed,      label: "Stay",      val: fmtCur(res.total_budget?.stay  || 0, formData.currency) },
                        { icon: Utensils, label: "Food",      val: fmtCur(res.total_budget?.food  || 0, formData.currency) },
                        { icon: Car,      label: "Transport", val: fmtCur(res.total_budget?.transport || 0, formData.currency) },
                        { icon: Zap,      label: "Activities",val: fmtCur(res.total_budget?.activities || 0, formData.currency) },
                      ].map(({ icon: Icon, label, val }) => (
                        <div key={label} className="p-5 rounded-2xl border border-white/8 space-y-3" style={{ background:"rgba(8,14,26,0.7)", backdropFilter:"blur(20px)" }}>
                          <div className="flex items-center gap-2 text-white/30">
                            <Icon className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase tracking-[0.4em]">{label}</span>
                          </div>
                          <p className="text-lg font-display font-black text-white tracking-tight">{val}</p>
                        </div>
                      ))}
                    </div>

                    {/* ── All Day Sections ──────────────────────────────────── */}
                    <div className="space-y-24">
                      {res.days.map((day, di) => (
                        <motion.div
                          key={day.day}
                          initial={{ opacity:0, y:28 }}
                          whileInView={{ opacity:1, y:0 }}
                          viewport={{ once:true, margin:"-80px" }}
                          transition={{ duration:0.5, delay: Math.min(di*0.06, 0.3) }}
                          className="space-y-8"
                        >
                          {/* Day Header */}
                          <div className="flex items-center gap-5 pb-6 border-b border-white/8">
                            <div className="w-14 h-14 rounded-xl bg-[#D4AF37] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#D4AF37]/25">
                              <span className="text-xl font-display font-black text-black">{day.day}</span>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.55em] mb-0.5">{day.date}</p>
                              <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-wide leading-tight">
                                {day.theme}
                              </h2>
                            </div>
                          </div>

                          {/* Activity Cards  */}
                          <div className="space-y-5">
                            {SLOTS.map((sk) => {
                              const act = day[sk];
                              if (!act?.place) return null;
                              const meta = SLOT_META[sk];
                              return (
                                <div
                                  key={sk}
                                  className="grid grid-cols-1 md:grid-cols-[260px_1fr] rounded-2xl border border-white/8 overflow-hidden"
                                  style={{ background:"rgba(8,14,26,0.78)", backdropFilter:"blur(20px)" }}
                                >
                                  {/* Image side */}
                                  <div className="relative overflow-hidden" style={{ minHeight:"200px" }}>
                                    <img
                                      src={slotImg(act)}
                                      onError={(e) => { e.target.src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=900"; }}
                                      className="w-full h-full object-cover transition-transform duration-[2500ms] hover:scale-105"
                                      style={{ minHeight:"200px" }}
                                      alt={act.place}
                                    />
                                    {/* Slot badge */}
                                    <div className={"absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest " + SLOT_PILL[sk] + " " + SLOT_COLOR[sk]}>
                                      <meta.Icon className="w-3 h-3" />{sk}
                                    </div>
                                    {/* Time badge */}
                                    <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white/85 uppercase tracking-wide">
                                      {meta.time}
                                    </div>
                                  </div>

                                  {/* Info side */}
                                  <div className="p-6 flex flex-col gap-4">
                                    <div>
                                      <h3 className="text-lg font-display font-black text-white uppercase tracking-wide leading-tight mb-2">
                                        {act.place}
                                      </h3>
                                      <p className="text-sm text-white/65 leading-relaxed font-serif">&ldquo;{act.activity}&rdquo;</p>
                                    </div>

                                    {/* Stat pills */}
                                    <div className="flex flex-wrap gap-2">
                                      {act.duration && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/8 text-[10px] font-black text-white uppercase tracking-wide">
                                          <Clock className="w-3 h-3 text-white/30" />{act.duration}
                                        </span>
                                      )}
                                      {act.travel && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/8 text-[10px] font-black text-white uppercase tracking-wide">
                                          <Car className="w-3 h-3 text-white/30" />{act.travel}
                                        </span>
                                      )}
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37]/12 border border-[#D4AF37]/30 text-[10px] font-black text-[#D4AF37] uppercase tracking-wide">
                                        <Wallet className="w-3 h-3" />{fmtCur(act.cost || 0, formData.currency)}
                                      </span>
                                    </div>

                                    {/* AI reason */}
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/18 mt-auto">
                                      <Brain className="w-3.5 h-3.5 text-indigo-400/80 flex-shrink-0 mt-0.5" />
                                      <p className="text-[11px] text-white/48 leading-relaxed">{act.reason}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Daily total bar */}
                          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 rounded-2xl border border-white/6"
                            style={{ background:"rgba(8,14,26,0.45)" }}>
                            <div className="flex flex-wrap gap-5">
                              {[
                                { Icon: Bed,      label: "Stay",       val: day.budget?.stay },
                                { Icon: Utensils, label: "Food",       val: day.budget?.food },
                                { Icon: Car,      label: "Transport",  val: day.budget?.transport },
                                { Icon: Zap,      label: "Activities", val: day.budget?.activities },
                              ].map(({ Icon, label, val }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                  <Icon className="w-3 h-3 text-white/18" />
                                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{label}</span>
                                  <span className="text-[11px] font-black text-white/75 ml-1">{fmtCur(val || 0, formData.currency)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-baseline gap-2 flex-shrink-0">
                              <span className="text-[9px] font-black text-[#D4AF37]/60 uppercase tracking-[0.4em]">Day Total</span>
                              <span className="text-xl font-display font-black text-[#D4AF37]">{fmtCur(day.budget?.total || 0, formData.currency)}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* ── AI Insights ───────────────────────────────────────── */}
                    {res.ai_suggestions && (
                      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-5">
                        {[
                          { label:"Hidden Gems",  items:res.ai_suggestions.hidden_gems, col:"text-amber-400",   pill:"bg-amber-400/8 border-amber-400/20",   Icon:Gem },
                          { label:"Photo Spots",  items:res.ai_suggestions.photo_spots, col:"text-indigo-400",  pill:"bg-indigo-400/8 border-indigo-400/20",  Icon:Camera },
                          { label:"Local Tips",   items:res.ai_suggestions.tips,        col:"text-emerald-400", pill:"bg-emerald-400/8 border-emerald-400/20", Icon:Lightbulb },
                          { label:"Things to Avoid", items:res.ai_suggestions.avoid,   col:"text-red-400",     pill:"bg-red-400/8 border-red-400/20",         Icon:AlertTriangle },
                        ].map(({ label, items, col, pill, Icon }) => (
                          <div key={label} className={"p-5 rounded-2xl border space-y-3 " + pill}>
                            <div className={"flex items-center gap-2 " + col}>
                              <Icon className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-black uppercase tracking-[0.5em]">{label}</span>
                            </div>
                            {(items || []).map((tip, idx) => (
                              <p key={idx} className="text-[11px] text-white/52 leading-relaxed italic border-l-2 border-white/10 pl-3">&ldquo;{tip}&rdquo;</p>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Finalize Card ─────────────────────────────────────── */}
                    <div className="mt-16 rounded-[28px] bg-[#D4AF37] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-[#D4AF37]/18">
                      <div>
                        <p className="text-black/45 text-[9px] font-black uppercase tracking-[0.55em] mb-2">Total Trip Investment</p>
                        <p className="text-5xl font-display font-black text-black tracking-tighter leading-none">
                          {fmtCur(res.total_budget?.total || 0, formData.currency)}
                        </p>
                        <p className="text-black/45 text-[10px] font-bold mt-2 uppercase tracking-widest">
                          {overview.total_days} days · {overview.passengers || formData.travelers} travellers
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={handleSave}
                          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-black text-[#D4AF37] font-black text-[11px] uppercase tracking-[0.3em] hover:scale-[1.03] transition-all shadow-xl whitespace-nowrap"
                        >
                          <ShieldCheck className="w-4 h-4" /> Finalize & Save Trip
                        </button>
                        <button
                          onClick={() => setStep(5)}
                          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-black/20 border border-black/30 text-black font-black text-[11px] uppercase tracking-[0.3em] hover:bg-black/30 transition-all whitespace-nowrap"
                        >
                          <PenLine className="w-4 h-4" /> Customize Plan
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })()}`;

const result = [...lines.slice(0, START), NEW, ...lines.slice(END + 1)];
fs.writeFileSync(FILE, result.join('\n'), 'utf8');
console.log('Done. Total lines:', result.length, '| Replaced lines', START+1, 'to', END+1);
