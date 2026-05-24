// step7_split.cjs — 2-column split layout with sticky right panel
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
              const SLOT_ICON  = { morning:"🌅", afternoon:"🌇", evening:"🌃", night:"🌙" };
              const SLOT_TIME  = { morning:"08:00–12:00", afternoon:"12:00–17:00", evening:"17:00–21:00", night:"21:00–23:30" };
              const SLOT_LABEL = { morning:"Morning", afternoon:"Afternoon", evening:"Evening", night:"Night" };

              // Inline destination hero photo map (Unsplash photo IDs)
              const DEST_PHOTOS = {
                dubai:"1512453979798-5ea266f8880c", kyoto:"1493976040374-85c8e12f0c0e",
                istanbul:"1524231757912-21f4fe3a7200", paris:"1499856871958-5b9627545d1a",
                bangkok:"1563492065599-dc10d315cc3d", bali:"1537953773345-d172ccf13cf4",
                london:"1513635269975-59663e0ac1ad", tokyo:"1540959733332-eab4deabeeaf",
                rome:"1552832230-c0197dd311b5", singapore:"1565967511849-76a60a516170",
                maldives:"1514282401047-d79a71a590e8", new_york:"1485871981521-5b1fd3805eee",
                sydney:"1524820801166-3d2c9cca8f27", dubai:"1512453979798-5ea266f8880c",
                goa:"1512343937131-43a62a5c5ba7", kerala:"1596895111956-bf1cf0599c2f",
                ooty:"1589308078059-be1415eab4c3", kodaikanal:"1589308078059-be1415eab4c3",
                chennai:"1587474260584-136574297316", mumbai:"1529253355930-ddbe423a2ac7",
                delhi:"1587474260584-136574297316", rajasthan:"1524492412937-b28074a5d7da",
                jaipur:"1524492412937-b28074a5d7da", agra:"1564507592333-c60657eea523",
              };
              const destKey = (ov.destination||formData.destination||"").toLowerCase().replace(/\s+/g,'_');
              const heroPhotoId = DEST_PHOTOS[destKey] || DEST_PHOTOS[destKey.split('_')[0]];
              const heroSrc = heroPhotoId
                ? "https://images.unsplash.com/photo-" + heroPhotoId + "?auto=format&fit=crop&q=80&w=600"
                : "https://source.unsplash.com/600x400/?" + encodeURIComponent((ov.destination||"travel destination") + " city landscape");

              const usedSigs = new Set();
              const thumb = (act, w=200, h=200) => {
                if (act?.knownId && act?.image && act.image.length >= 10 && !act.image.includes(' '))
                  return "https://images.unsplash.com/photo-" + act.image.replace("photo-","") + "?auto=format&fit=crop&q=75&w=" + w + "&h=" + h;
                const base = (act?.imageQuery || act?.place || "travel");
                const q = encodeURIComponent(base + " landmark");
                let sig = 1;
                while(usedSigs.has(q + sig)) sig++;
                usedSigs.add(q + sig);
                return "https://source.unsplash.com/" + w + "x" + h + "/?" + q + "&sig=" + sig;
              };
              const fb = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=75&w=200&h=200";

              // Day preview data for right panel
              const dayPreviews = res.days.map(d => {
                const first = d.morning || d.afternoon || {};
                return { day: d.day, date: d.date, theme: d.theme, total: d.budget?.total };
              });

              return (
                <motion.div key="split-plan" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }} className="w-full min-h-screen relative z-10 pb-24" style={{ background:'#060f1c' }}>
                  <div className="max-w-[1200px] ml-[clamp(16px,4vw,80px)] mr-auto pt-10 px-4">

                    {/* ── HEADER ─────────────────────────────────────────── */}
                    <div className="mb-10 pb-8 border-b border-white/10 flex items-end justify-between gap-6 flex-wrap">
                      <div>
                        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.6em] mb-3">Rihla AI · Your Journey</p>
                        <h1 className="text-5xl md:text-7xl font-display font-black text-white uppercase tracking-tight leading-none mb-3">
                          {ov.destination || formData.destination}
                        </h1>
                        <p className="text-sm text-white/55 font-mono">{ov.dates} · {ov.total_days} days · {ov.passengers || formData.travelers} {(ov.passengers||formData.travelers)===1?'traveller':'travellers'}</p>
                        {formData.preferences?.length > 0 && (
                          <p className="text-xs text-white/30 mt-1">{formData.preferences.slice(0,4).join(' · ')}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-4xl font-display font-black text-[#D4AF37] tracking-tight">{fmtCur(res.total_budget?.total||0, formData.currency)}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Total Budget</p>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 justify-end">
                          {[
                            {l:'Stay', v:res.total_budget?.stay},
                            {l:'Food', v:res.total_budget?.food},
                            {l:'Transport', v:res.total_budget?.transport},
                            {l:'Activities', v:res.total_budget?.activities},
                          ].map(({l,v}) => (
                            <div key={l} className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/30 uppercase tracking-widest">{l}</span>
                              <span className="text-xs font-black text-white/75">{fmtCur(v||0, formData.currency)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ── 2-COLUMN BODY ─────────────────────────────────── */}
                    <div className="flex gap-8 items-start">

                      {/* LEFT — Timeline ────────────────────────────────── */}
                      <div className="flex-1 min-w-0 space-y-16">
                        {res.days.map((day, di) => (
                          <div key={day.day}>

                            {/* Day chapter header */}
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#D4AF37]/25">
                                <span className="text-base font-black text-black">{day.day}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-3">
                                  <span className="text-2xl font-display font-black text-white uppercase tracking-wide">Day {day.day}</span>
                                  <span className="text-sm text-white/45 font-mono">{day.date}</span>
                                </div>
                                <p className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.4em] mt-0.5">{day.theme}</p>
                              </div>
                              <span className="text-lg font-display font-black text-white/75 flex-shrink-0">{fmtCur(day.budget?.total||0, formData.currency)}</span>
                            </div>

                            {/* Activity timeline — left border connector */}
                            <div className="relative ml-5 pl-6 border-l border-white/8 space-y-3">
                              {SLOTS.map((sk, si) => {
                                const act = day[sk];
                                if (!act?.place) return null;
                                const isFirst = si === 0;
                                const img = thumb(act, 200, 200);
                                return (
                                  <div key={sk} className="relative group">
                                    {/* Timeline dot */}
                                    <div className={"absolute -left-[33px] top-4 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all duration-200 " + (isFirst ? "bg-[#D4AF37] border-[#D4AF37] shadow-md" : "bg-[#0d1927] border-white/20")} />

                                    {/* Card */}
                                    <div
                                      className={"flex gap-4 rounded-xl p-3.5 transition-all duration-200 cursor-default " + (isFirst ? "" : "")}
                                      style={{
                                        background: isFirst ? 'rgba(212,175,55,0.06)' : '#0d1927',
                                        border: '1px solid ' + (isFirst ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.07)'),
                                        borderLeft: isFirst ? '3px solid #D4AF37' : '1px solid rgba(255,255,255,0.07)',
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                                      }}
                                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)'; e.currentTarget.style.transform = ''; }}
                                    >
                                      {/* Image */}
                                      <div className="w-[88px] h-[88px] rounded-xl overflow-hidden flex-shrink-0" style={{ background:'#111f30' }}>
                                        <img
                                          src={img}
                                          onError={e => { e.target.src = fb; }}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                          alt={act.place}
                                        />
                                      </div>

                                      {/* Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm flex-shrink-0">{SLOT_ICON[sk]}</span>
                                            <h3 className="text-[14px] font-black text-white leading-tight">{act.place}</h3>
                                          </div>
                                          <span className="text-[14px] font-black text-[#D4AF37] flex-shrink-0">{fmtCur(act.cost||0, formData.currency)}</span>
                                        </div>
                                        <p className="text-[12px] text-white/50 leading-relaxed mb-2 line-clamp-2">{act.activity}</p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-white/35 uppercase tracking-wider px-2 py-0.5 rounded-md" style={{background:'rgba(255,255,255,0.05)'}}>
                                            {SLOT_LABEL[sk]}
                                          </span>
                                          <span className="text-[10px] text-white/30 font-mono">{SLOT_TIME[sk]}</span>
                                          <span className="text-[10px] text-white/25 font-mono">{act.duration}</span>
                                          <span className="text-[10px] text-white/25 font-mono">{act.travel}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Day cost footer */}
                            <div className="ml-5 mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-mono text-white/25">
                              {[
                                {l:'Stay', v:day.budget?.stay},
                                {l:'Food', v:day.budget?.food},
                                {l:'Transport', v:day.budget?.transport},
                                {l:'Activities', v:day.budget?.activities},
                              ].map(({l,v}) => (
                                <span key={l}>{l} <span className="text-white/50 font-black">{fmtCur(v||0, formData.currency)}</span></span>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* AI Tips */}
                        {res.ai_suggestions && (
                          <div className="pt-10 border-t border-white/8 grid grid-cols-2 gap-8">
                            {[
                              {label:'Hidden Gems', items:res.ai_suggestions.hidden_gems, col:'#D4AF37'},
                              {label:'Photo Spots', items:res.ai_suggestions.photo_spots,  col:'#818CF8'},
                              {label:'Local Tips',  items:res.ai_suggestions.tips,         col:'#34D399'},
                              {label:'Avoid',       items:res.ai_suggestions.avoid,        col:'#F87171'},
                            ].map(({label, items, col}) => (
                              <div key={label}>
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-3" style={{color:col}}>{label}</p>
                                <ul className="space-y-2">
                                  {(items||[]).slice(0,3).map((tip,i) => (
                                    <li key={i} className="text-xs text-white/50 leading-relaxed">{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Finalize */}
                        <div className="pt-10 border-t border-white/10 flex items-center justify-between gap-6 flex-wrap">
                          <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Total Trip Cost</p>
                            <p className="text-4xl font-display font-black text-white tracking-tight">{fmtCur(res.total_budget?.total||0, formData.currency)}</p>
                            <p className="text-xs text-white/35 mt-1 uppercase tracking-widest">{ov.total_days} days · {ov.passengers||formData.travelers} travellers</p>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => setStep(5)} className="px-6 py-3 rounded-xl border border-white/15 text-white/60 text-xs font-black uppercase tracking-widest hover:border-white/30 hover:text-white transition-all">
                              Customize
                            </button>
                            <button onClick={handleSave} className="px-7 py-3 rounded-xl bg-[#D4AF37] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e4c040] transition-all shadow-lg shadow-[#D4AF37]/20">
                              Finalize Trip
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT — Sticky Panel ─────────────────────────── */}
                      <div className="w-[268px] flex-shrink-0 sticky top-6 self-start space-y-4 hidden lg:block">

                        {/* Destination image card */}
                        <div className="rounded-2xl overflow-hidden" style={{background:'#0d1927', border:'1px solid rgba(255,255,255,0.08)'}}>
                          <div className="relative h-[156px]">
                            <img
                              src={heroSrc}
                              onError={e => { e.target.src = fb; }}
                              className="w-full h-full object-cover"
                              style={{objectPosition:'center 40%'}}
                              alt={ov.destination}
                            />
                            <div className="absolute inset-0" style={{background:'linear-gradient(to top, rgba(13,25,39,0.95) 0%, rgba(13,25,39,0.2) 60%, transparent 100%)'}} />
                            <div className="absolute bottom-3 left-4">
                              <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.5em] mb-0.5">Destination</p>
                              <p className="text-sm font-black text-white uppercase tracking-wide">{ov.destination||formData.destination}</p>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                {l:'Duration', v: (ov.total_days||'—') + ' days'},
                                {l:'Travellers', v: (ov.passengers||formData.travelers||1) + (+(ov.passengers||formData.travelers)===1?' person':' people')},
                                {l:'Style', v: formData.travelStyle||'—'},
                                {l:'Budget', v: fmtCur(res.total_budget?.total||0, formData.currency)},
                              ].map(({l,v}) => (
                                <div key={l} className="p-2 rounded-lg" style={{background:'rgba(255,255,255,0.03)'}}>
                                  <p className="text-[8px] font-black text-white/25 uppercase tracking-widest mb-0.5">{l}</p>
                                  <p className="text-[11px] font-black text-white/80 truncate">{v}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Journey overview (day nav) */}
                        <div className="rounded-2xl p-4" style={{background:'#0d1927', border:'1px solid rgba(255,255,255,0.08)'}}>
                          <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.5em] mb-4">Journey Overview</p>
                          <div className="space-y-3">
                            {dayPreviews.map(dp => (
                              <div key={dp.day} className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/12 flex items-center justify-center flex-shrink-0 border border-[#D4AF37]/20">
                                  <span className="text-[10px] font-black text-[#D4AF37]">{dp.day}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-black text-white/75 uppercase tracking-wide truncate">{dp.theme||('Day ' + dp.day)}</p>
                                  <p className="text-[9px] text-white/30 font-mono">{dp.date}</p>
                                </div>
                                <span className="text-[10px] font-black text-[#D4AF37]/65 flex-shrink-0">{fmtCur(dp.total||0, formData.currency)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Hidden gem box */}
                        {res.ai_suggestions?.hidden_gems?.[0] && (
                          <div className="rounded-2xl p-4" style={{background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.15)'}}>
                            <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.5em] mb-2">✦ Hidden Gem</p>
                            <p className="text-[12px] text-white/60 leading-relaxed">"{res.ai_suggestions.hidden_gems[0]}"</p>
                          </div>
                        )}

                        {/* Photo spots */}
                        {res.ai_suggestions?.photo_spots?.length > 0 && (
                          <div className="rounded-2xl p-4" style={{background:'#0d1927', border:'1px solid rgba(255,255,255,0.08)'}}>
                            <p className="text-[8px] font-black text-[#818CF8] uppercase tracking-[0.5em] mb-3">📸 Photo Spots</p>
                            <ul className="space-y-2">
                              {res.ai_suggestions.photo_spots.slice(0,3).map((s,i) => (
                                <li key={i} className="text-[11px] text-white/50 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#818CF8]/40 flex-shrink-0" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </motion.div>
              );
            })()}`;

const result = [...lines.slice(0, START), NEW, ...lines.slice(END + 1)];
fs.writeFileSync(FILE, result.join('\n'), 'utf8');
console.log('Done. Total lines:', result.length, '| Replaced:', START + 1, '–', END + 1);
