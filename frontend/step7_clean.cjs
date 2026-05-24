// step7_clean.cjs — Compact functional itinerary
const fs = require('fs');
const FILE = 'src/pages/planner.jsx';
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

const START = lines.findIndex(l => l.includes('step === 7') && l.includes('generatedResult'));
let depth = 0, END = -1;
for (let i = START; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > START) { END = i; break; }
}
console.log(`Replacing lines ${START + 1}–${END + 1}`);

const NEW = `            {step === 7 && generatedResult && (() => {
              const res = generatedResult;
              if (!res?.days?.length) return (
                <div className="flex items-center justify-center py-24 text-white/30 text-sm">Generating itinerary…</div>
              );

              const ov    = res.trip_overview || {};
              const SLOTS = ["morning","afternoon","evening","night"];
              const SLOT_ICON = { morning:"🌅", afternoon:"🌇", evening:"🌃", night:"🌙" };
              const SLOT_TIME = { morning:"08:00–12:00", afternoon:"12:00–17:00", evening:"17:00–21:00", night:"21:00–23:30" };

              const thumb = (act) => {
                if (act?.knownId && act?.image && act.image.length >= 10 && !act.image.includes(' '))
                  return "https://images.unsplash.com/photo-" + act.image.replace("photo-","") + "?auto=format&fit=crop&q=75&w=160&h=160";
                const q = encodeURIComponent((act?.imageQuery || act?.place || "travel") + " landmark");
                return "https://source.unsplash.com/160x160/?" + q;
              };

              const fb = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=75&w=160&h=160";

              return (
                <motion.div key="clean-plan" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }} className="w-full pb-24">
                  <div className="max-w-[900px] mx-auto px-4 md:px-6">

                    {/* ── TRIP HEADER ──────────────────────────────────────────── */}
                    <div className="pt-2 pb-8 border-b border-white/10">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <h1 className="text-3xl font-display font-black text-white uppercase tracking-wide mb-1">
                            {ov.destination || formData.destination}
                          </h1>
                          <p className="text-sm text-white/40 font-mono">{ov.dates} · {ov.total_days} days · {ov.passengers || formData.travelers} {(ov.passengers || formData.travelers) === 1 ? "traveller" : "travellers"}</p>
                          {formData.preferences?.length > 0 && (
                            <p className="text-xs text-white/25 mt-1">{formData.preferences.slice(0,4).join(" · ")}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-display font-black text-[#D4AF37] tracking-tight">{fmtCur(res.total_budget?.total || 0, formData.currency)}</p>
                          <p className="text-xs text-white/30 uppercase tracking-widest mt-0.5">Total Budget</p>
                        </div>
                      </div>

                      {/* Cost breakdown bar */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5">
                        {[
                          { l:"Stay",       v: res.total_budget?.stay },
                          { l:"Food",       v: res.total_budget?.food },
                          { l:"Transport",  v: res.total_budget?.transport },
                          { l:"Activities", v: res.total_budget?.activities },
                        ].map(({ l, v }) => (
                          <div key={l} className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{l}</span>
                            <span className="text-xs font-black text-white/70">{fmtCur(v || 0, formData.currency)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── TIMELINE ─────────────────────────────────────────────── */}
                    <div className="mt-8 space-y-10">
                      {res.days.map((day) => (
                        <div key={day.day}>

                          {/* Day label */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-[#D4AF37] flex items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-black text-black">{day.day}</span>
                            </div>
                            <div>
                              <span className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mr-3">Day {day.day}</span>
                              <span className="text-xs text-white/35 font-mono">{day.date}</span>
                            </div>
                            <div className="flex-1 h-px bg-white/6 ml-2" />
                            <span className="text-xs font-black text-white/40 flex-shrink-0">{fmtCur(day.budget?.total || 0, formData.currency)}</span>
                          </div>
                          <p className="text-[13px] font-black text-white/60 uppercase tracking-widest mb-5 pl-10">{day.theme}</p>

                          {/* Activity items */}
                          <div className="pl-10 space-y-4">
                            {SLOTS.map((sk) => {
                              const act = day[sk];
                              if (!act?.place) return null;
                              return (
                                <div key={sk} className="flex gap-4 group">

                                  {/* Thumbnail */}
                                  <div className="w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                                    <img
                                      src={thumb(act)}
                                      onError={(e) => { e.target.src = fb; }}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      alt={act.place}
                                    />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0 py-0.5">
                                    <div className="flex items-start justify-between gap-3 mb-1">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm">{SLOT_ICON[sk]}</span>
                                        <h3 className="text-sm font-black text-white uppercase tracking-wide truncate">{act.place}</h3>
                                      </div>
                                      <span className="text-sm font-black text-[#D4AF37] flex-shrink-0">{fmtCur(act.cost || 0, formData.currency)}</span>
                                    </div>

                                    <p className="text-xs text-white/45 leading-relaxed mb-1.5 line-clamp-1">{act.activity}</p>

                                    <p className="text-[10px] text-white/25 font-mono tracking-wide">
                                      {SLOT_TIME[sk]} · {act.duration} · {act.travel}
                                    </p>

                                    <p className="text-[10px] text-white/20 italic mt-1 line-clamp-1">{act.reason}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Day cost mini-row */}
                          <div className="pl-10 mt-4 flex flex-wrap gap-4 text-[10px] text-white/20 font-mono border-t border-white/5 pt-4">
                            {[
                              { l:"Stay", v: day.budget?.stay },
                              { l:"Food", v: day.budget?.food },
                              { l:"Transport", v: day.budget?.transport },
                              { l:"Activities", v: day.budget?.activities },
                            ].map(({ l, v }) => (
                              <span key={l}>{l} <span className="text-white/35">{fmtCur(v || 0, formData.currency)}</span></span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── AI TIPS ───────────────────────────────────────────────── */}
                    {res.ai_suggestions && (
                      <div className="mt-12 pt-8 border-t border-white/8 grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                          { label:"Hidden Gems",  items: res.ai_suggestions.hidden_gems, col:"#D4AF37" },
                          { label:"Photo Spots",  items: res.ai_suggestions.photo_spots, col:"#818CF8" },
                          { label:"Local Tips",   items: res.ai_suggestions.tips,        col:"#34D399" },
                          { label:"Avoid",        items: res.ai_suggestions.avoid,       col:"#F87171" },
                        ].map(({ label, items, col }) => (
                          <div key={label}>
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] mb-3" style={{ color: col }}>{label}</p>
                            <ul className="space-y-1.5">
                              {(items || []).slice(0,3).map((tip, i) => (
                                <li key={i} className="text-[11px] text-white/35 leading-relaxed">{tip}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── FINAL ACTIONS ─────────────────────────────────────────── */}
                    <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Total Trip Cost</p>
                        <p className="text-3xl font-display font-black text-white tracking-tight">{fmtCur(res.total_budget?.total || 0, formData.currency)}</p>
                        <p className="text-xs text-white/25 mt-0.5 uppercase tracking-widest">{ov.total_days} days · {ov.passengers || formData.travelers} travellers</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setStep(5)}
                          className="px-5 py-2.5 rounded-xl border border-white/15 text-white/60 text-xs font-black uppercase tracking-widest hover:border-white/30 hover:text-white transition-all"
                        >
                          Customize
                        </button>
                        <button
                          onClick={handleSave}
                          className="px-6 py-2.5 rounded-xl bg-[#D4AF37] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e4c040] transition-all"
                        >
                          Finalize Trip
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })()}`;

const result = [...lines.slice(0, START), NEW, ...lines.slice(END + 1)];
fs.writeFileSync(FILE, result.join('\n'), 'utf8');
console.log('Done. Total lines:', result.length, '| Replaced:', START + 1, '–', END + 1);
