// step7_grid.cjs — 2-col grid layout, all cards uniform full-image overlay
const fs = require('fs');
const FILE = 'src/pages/planner.jsx';
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

const START = lines.findIndex(l => l.includes('step === 7') && l.includes('generatedResult'));
let depth = 0, END = -1;
for (let i = START; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > START) { END = i; break; }
}
console.log(`Replacing step 7: lines ${START + 1}–${END + 1}`);

const NEW = `            {step === 7 && generatedResult && (() => {
              const res = generatedResult;
              if (!res?.days?.length) return (
                <div className="flex items-center justify-center py-24 text-white/30 text-sm">Generating itinerary…</div>
              );

              const ov = res.trip_overview || {};
              const DEST       = ov.destination || formData.destination || "";
              const SLOTS      = ["morning","afternoon","evening","night"];
              const SLOT_ICON  = { morning:"🌅", afternoon:"🌇", evening:"🌃", night:"🌙" };
              const SLOT_TIME  = { morning:"08:00–12:00", afternoon:"12:00–17:00", evening:"17:00–21:00", night:"21:00–23:30" };
              const SLOT_LABEL = { morning:"Morning", afternoon:"Afternoon", evening:"Evening", night:"Night" };

              const SAFE_FB = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80";

              // Destination hero
              const DEST_PHOTOS = {
                dubai:"1512453979798-5ea266f8880c", kyoto:"1493976040374-85c8e2238c0e",
                istanbul:"1524231757912-21f4fe3a7200", paris:"1502602228474-5084ce11ef2d",
                london:"1513635269973-35364416f34a", rome:"1552832230-c0197dd311b5",
                singapore:"1523906834658-6e24ef2386f9", pondicherry:"1772633634752-7b7611e839fc",
                chennai:"1587474260584-136574297316", mumbai:"1529253355930-ddbe423a2ac7",
                goa:"1507525428034-b723cf961d3e", kerala:"1596895111956-bf1cf0599c2f",
                mahabalipuram:"1668766158906-9bffd77d67a0", kanyakumari:"1653675838191-2f17f0cdf278",
                tokyo:"1540959733332-eab4deabeeaf", venice:"1523906834658-6e24ef2386f9",
              };
              const destKey = DEST.toLowerCase().replace(/[^a-z]/g,'');
              const matchKey = Object.keys(DEST_PHOTOS).find(k => destKey.includes(k));
              const heroSrc  = matchKey
                ? "https://images.unsplash.com/photo-" + DEST_PHOTOS[matchKey] + "?auto=format&fit=crop&q=80&w=800&h=500"
                : SAFE_FB + "&w=800&h=500";

              // Keyword → curated ID
              const KW = [
                ["burj khalifa","1512453979798-5ea266f8880c"],["al fahidi","1546412414-803b9a4d429d"],
                ["museum of the future","1609121838589-9407384ed880"],["palm jumeirah","1546190255-451a91afc548"],
                ["desert safari","1528659550302-53b006932e65"],["fushimi inari","1640546088631-fd6e3e88dec0"],
                ["golden pavilion","1493976040374-85c8e2238c0e"],["arashiyama","1475938476802-32a7e851adb1"],
                ["eiffel","1502602228474-5084ce11ef2d"],["louvre","1499119643444-245f7bd04899"],
                ["colosseum","1552832230-c0197dd311b5"],["vatican","1431274172761-fca41d930114"],
                ["tower of london","1513635269973-35364416f34a"],["british museum","1505761671924-054936d34b43"],
                ["gardens by the bay","1523906834658-6e24ef2386f9"],["shore temple","1668766158906-9bffd77d67a0"],
                ["vivekananda","1653675838191-2f17f0cdf278"],["matrimandir","1591007823521-7f3bc7a12bc2"],
                ["auroville","1518998053574-53ee7535d644"],["marina beach","1616212176465-4f358316f731"],
                ["promenade","1616212176465-4f358316f731"],["backwater","1547847055-7977a419c836"],
                ["mosque","1518684079105-3132793108c9"],["shrine","1640546088631-fd6e3e88dec0"],
                ["temple","1564507592333-c60657eea523"],["church","1509439581-299f24796675"],
                ["palace","1546412414-803b9a4d429d"],["fort","1546412414-803b9a4d429d"],
                ["heritage","1603766806347-54cdf3745953"],["monument","1668766158906-9bffd77d67a0"],
                ["museum","1505761671924-054936d34b43"],["gallery","1475440197467-ed5019d75831"],
                ["market","1526129314478-200a3add6d97"],["food","1501147233959-1fec69e2189d"],
                ["dining","1559339352-11d035aa65de"],["restaurant","1559339352-11d035aa65de"],
                ["michelin","1586221147501-14e365022e37"],["cafe","1501147233959-1fec69e2189d"],
                ["tea","1528360983277-13d401cdc186"],["yoga","1540660290370-8af2f64177d6"],
                ["meditation","1591007823521-7f3bc7a12bc2"],["safari","1528659550302-53b006932e65"],
                ["desert","1528659550302-53b006932e65"],["beach","1616212176465-4f358316f731"],
                ["sea","1507525428034-b723cf961d3e"],["cruise","1436491865332-7a61a109cc05"],
                ["boat","1547847055-7977a419c836"],["river","1436491865332-7a61a109cc05"],
                ["waterfall","1475938476802-32a7e851adb1"],["hill","1591007823521-7f3bc7a12bc2"],
                ["mountain","1475938476802-32a7e851adb1"],["forest","1475938476802-32a7e851adb1"],
                ["garden","1583395838374-e4e4fc57d6f4"],["park","1523906834658-6e24ef2386f9"],
                ["sunset","1616212176465-4f358316f731"],["sunrise","1653675838191-2f17f0cdf278"],
                ["night","1477959858617-67f85cf4f1df"],["skyline","1512453979798-5ea266f8880c"],
                ["walk","1772633634752-7b7611e839fc"],["suite","1542314831-068cd1dbfeeb"],
                ["hotel","1607316041696-6d634be942d5"],["resort","1542314831-068cd1dbfeeb"],
                ["art","1475440197467-ed5019d75831"],["shopping","1526129314478-200a3add6d97"],
              ];
              const FB_POOL = [
                "1616212176465-4f358316f731","1591007823521-7f3bc7a12bc2","1528360983277-13d401cdc186",
                "1540660290370-8af2f64177d6","1547847055-7977a419c836","1603766806347-54cdf3745953",
                "1518998053574-53ee7535d644","1561006289-4fe1a09bf743","1526129314478-200a3add6d97",
                "1475440197467-ed5019d75831","1501147233959-1fec69e2189d","1559339352-11d035aa65de",
                "1528659550302-53b006932e65","1546190255-451a91afc548","1436491865332-7a61a109cc05",
                "1523906834658-6e24ef2386f9","1640546088631-fd6e3e88dec0","1475938476802-32a7e851adb1",
                "1583395838374-e4e4fc57d6f4","1772633634752-7b7611e839fc",
              ];
              const usedIds = new Set();
              const buildSrcs = (act, idx) => {
                if (act?.knownId && act?.image?.length >= 10 && !act.image.includes(' ')) {
                  const b = "https://images.unsplash.com/photo-" + act.image + "?auto=format&fit=crop&q=80";
                  return { card: b+"&w=600&h=440", panel: b+"&w=640&h=420" };
                }
                const text = ((act?.imageQuery||"")+" "+(act?.place||"")).toLowerCase();
                for (const [kw, id] of KW) {
                  if (text.includes(kw)) {
                    const b = "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&q=80";
                    return { card: b+"&w=600&h=440", panel: b+"&w=640&h=420" };
                  }
                }
                // loremflickr real-photo fallback
                const terms = (act?.imageQuery||act?.place||"travel destination")
                  .toLowerCase().replace(/[^a-z0-9 ]/g,'').trim()
                  .split(' ').filter(t=>t.length>2).slice(0,3).join(',');
                const q = terms || "travel";
                return {
                  card:  "https://loremflickr.com/600/440/" + q + "?random=" + idx,
                  panel: "https://loremflickr.com/640/420/" + q + "?random=" + idx,
                };
              };

              // Build all days with pre-resolved images
              let ci = 0;
              const daysData = res.days.map(day => ({
                ...day,
                slots: SLOTS.map((sk, si) => {
                  const act = day[sk];
                  if (!act?.place) return null;
                  const srcs = buildSrcs(act, ci++);
                  return { sk, act, srcs };
                }).filter(Boolean)
              }));

              // SLOT accent colours for subtle visual variation
              const SLOT_ACCENT = {
                morning:   { badge:'rgba(212,175,55,0.9)', dot:'#D4AF37' },
                afternoon: { badge:'rgba(251,191,36,0.85)', dot:'#FBBF24' },
                evening:   { badge:'rgba(129,140,248,0.85)', dot:'#818CF8' },
                night:     { badge:'rgba(52,211,153,0.15)', dot:'#34D399' },
              };

              return (
                <motion.div key="grid-plan" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5}} className="w-full min-h-screen relative z-10 pb-28" style={{background:'#060f1c'}}>
                  <div className="max-w-[1260px] ml-[clamp(12px,3vw,60px)] mr-auto pt-10 px-4">

                    {/* ── HEADER ─────────────────────────────────────── */}
                    <div className="mb-12 pb-8 border-b border-white/8 flex items-end justify-between gap-6 flex-wrap">
                      <div>
                        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.6em] mb-3">Rihla AI · Your Journey</p>
                        <h1 className="text-5xl md:text-[76px] font-display font-black text-white uppercase tracking-tight leading-none mb-4" style={{letterSpacing:'-0.03em'}}>{DEST}</h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="text-sm text-white/50 font-mono">{ov.dates}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0" />
                          <span className="text-sm text-white/50 font-mono">{ov.total_days} days</span>
                          <span className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0" />
                          <span className="text-sm text-white/50 font-mono">{ov.passengers||formData.travelers} {+(ov.passengers||formData.travelers)===1?'traveller':'travellers'}</span>
                          {formData.travelStyle && <><span className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0" /><span className="text-sm text-white/50 font-mono capitalize">{formData.travelStyle}</span></>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Total Budget</p>
                        <p className="text-5xl font-display font-black text-[#D4AF37] tracking-tight">{fmtCur(res.total_budget?.total||0, formData.currency)}</p>
                        <div className="flex gap-5 mt-3 justify-end">
                          {[{l:'Stay',v:res.total_budget?.stay},{l:'Food',v:res.total_budget?.food},{l:'Travel',v:res.total_budget?.transport}].map(({l,v}) => (
                            <div key={l}>
                              <p className="text-[9px] text-white/25 uppercase tracking-widest">{l}</p>
                              <p className="text-xs font-black text-white/65">{fmtCur(v||0, formData.currency)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ── 2-COLUMN BODY ──────────────────────────────── */}
                    <div className="flex gap-7 items-start">

                      {/* LEFT — Day grid ─────────────────────────────── */}
                      <div className="flex-1 min-w-0 space-y-14">
                        {daysData.map((day) => (
                          <div key={day.day}>

                            {/* Day header */}
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-9 h-9 rounded-xl bg-[#D4AF37] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#D4AF37]/30">
                                <span className="text-sm font-black text-black">{day.day}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-3">
                                  <span className="text-xl font-display font-black text-white uppercase tracking-wide">{day.theme}</span>
                                  <span className="text-xs text-white/35 font-mono">{day.date}</span>
                                </div>
                              </div>
                              <span className="text-sm font-black text-white/50 flex-shrink-0">{fmtCur(day.budget?.total||0, formData.currency)}</span>
                            </div>

                            {/* 2×2 card grid */}
                            <div className="grid grid-cols-2 gap-3">
                              {day.slots.map(({ sk, act, srcs }) => {
                                const accent = SLOT_ACCENT[sk] || SLOT_ACCENT.morning;
                                const isSelected = planFocusAct?.place === act.place;
                                return (
                                  <div
                                    key={sk}
                                    className="relative rounded-2xl overflow-hidden cursor-pointer group"
                                    style={{
                                      height: '210px',
                                      background: '#0d1927',
                                      boxShadow: isSelected
                                        ? '0 0 0 2px rgba(212,175,55,0.8), 0 12px 40px rgba(0,0,0,0.6)'
                                        : '0 2px 16px rgba(0,0,0,0.4)',
                                    }}
                                    onClick={() => setPlanFocusAct(isSelected ? null : {...act, srcs, sk})}
                                  >
                                    {/* Background image */}
                                    <img
                                      src={srcs.card}
                                      onError={e => { e.target.onerror=null; e.target.src=SAFE_FB+"&w=600&h=440"; }}
                                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                      alt={act.place}
                                    />
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0" style={{background:'linear-gradient(to top, rgba(6,15,28,0.98) 0%, rgba(6,15,28,0.55) 45%, rgba(6,15,28,0.08) 100%)'}} />

                                    {/* Top row: slot badge + price */}
                                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                      <span className="flex items-center gap-1.5 text-[9px] font-black text-white/85 uppercase tracking-[0.4em] bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full">
                                        <span className="text-sm leading-none">{SLOT_ICON[sk]}</span>
                                        {SLOT_LABEL[sk]}
                                      </span>
                                      <span className="text-[11px] font-black text-black bg-[#D4AF37] px-2.5 py-1 rounded-lg shadow-md">
                                        {fmtCur(act.cost||0, formData.currency)}
                                      </span>
                                    </div>

                                    {/* Bottom: title + description + meta */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3.5">
                                      <h3 className="text-[15px] font-display font-black text-white uppercase leading-tight tracking-wide mb-1 line-clamp-1">{act.place}</h3>
                                      <p className="text-[11px] text-white/50 leading-relaxed line-clamp-1 mb-2">{act.activity}</p>
                                      <div className="flex items-center gap-2 text-[9px] text-white/28 font-mono">
                                        <span>{SLOT_TIME[sk]}</span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                                        <span>{act.duration}</span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                                        <span>{act.travel}</span>
                                      </div>
                                    </div>

                                    {/* Selection ring */}
                                    {isSelected && <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{boxShadow:'inset 0 0 0 2px rgba(212,175,55,0.9)'}} />}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Day cost footer */}
                            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-x-6 gap-y-1 text-[10px] font-mono text-white/20">
                              {[{l:'Stay',v:day.budget?.stay},{l:'Food',v:day.budget?.food},{l:'Transport',v:day.budget?.transport},{l:'Activities',v:day.budget?.activities}].map(({l,v}) => (
                                <span key={l}>{l} <span className="text-white/45 font-black">{fmtCur(v||0, formData.currency)}</span></span>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* AI INSIGHTS */}
                        {res.ai_suggestions && (
                          <div className="border-t border-white/8 pt-12">
                            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.6em] mb-5">Curated Insights</p>
                            <div className="grid grid-cols-2 gap-3">
                              {[{key:'hidden_gems',label:'Hidden Gems',icon:'✦',col:'#D4AF37'},{key:'photo_spots',label:'Photo Spots',icon:'📸',col:'#818CF8'},{key:'tips',label:'Local Tips',icon:'💡',col:'#34D399'},{key:'avoid',label:'Avoid',icon:'⚠',col:'#F87171'}].map(({key,label,icon,col}) => {
                                const items=(res.ai_suggestions[key]||[]).slice(0,2);
                                if(!items.length) return null;
                                return <div key={key} className="rounded-xl p-4" style={{background:'#0d1927',border:'1px solid rgba(255,255,255,0.07)'}}><div className="flex items-center gap-2 mb-3"><span className="text-base leading-none">{icon}</span><span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{color:col}}>{label}</span></div><ul className="space-y-1.5">{items.map((t,i)=><li key={i} className="text-[11px] text-white/50 leading-relaxed">{t}</li>)}</ul></div>;
                              })}
                            </div>
                          </div>
                        )}

                        {/* FINALIZE */}
                        <div className="mt-12 pt-10 border-t border-white/10 flex items-center justify-between gap-6 flex-wrap">
                          <div>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Total Trip Cost</p>
                            <p className="text-5xl font-display font-black text-white tracking-tight">{fmtCur(res.total_budget?.total||0, formData.currency)}</p>
                            <p className="text-xs text-white/30 mt-1.5 uppercase tracking-widest">{ov.total_days} days · {ov.passengers||formData.travelers} travellers</p>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => setStep(5)} className="px-6 py-3 rounded-xl border border-white/12 text-white/55 text-xs font-black uppercase tracking-widest hover:border-white/30 hover:text-white transition-all">Customize</button>
                            <button onClick={handleSave} className="px-8 py-3 rounded-xl bg-[#D4AF37] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e4c040] transition-all shadow-xl shadow-[#D4AF37]/20">Finalize Trip ✦</button>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT — Sticky detail panel ───────────────── */}
                      <div className="w-[280px] flex-shrink-0 sticky top-6 self-start space-y-3 hidden lg:block">

                        {/* Main preview */}
                        <div className="rounded-2xl overflow-hidden" style={{background:'#0d1927', border:'1px solid rgba(255,255,255,0.08)'}}>
                          {/* Image */}
                          <div className="relative overflow-hidden" style={{height:'190px', background:'#111f30'}}>
                            <img
                              key={planFocusAct?.place || 'dest'}
                              src={planFocusAct ? planFocusAct.srcs?.panel : heroSrc}
                              onError={e => { e.target.onerror=null; e.target.src=SAFE_FB+"&w=640&h=420"; }}
                              className="w-full h-full object-cover transition-all duration-500"
                              style={{objectPosition:'center 40%'}}
                              alt={planFocusAct?.place || DEST}
                            />
                            <div className="absolute inset-0" style={{background:'linear-gradient(to top, rgba(13,25,39,0.97) 0%, rgba(13,25,39,0.25) 55%, transparent 100%)'}} />
                            <div className="absolute bottom-3 left-4 right-4">
                              {planFocusAct ? (
                                <>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-sm">{SLOT_ICON[planFocusAct.sk]}</span>
                                    <span className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.5em]">{SLOT_LABEL[planFocusAct.sk]}</span>
                                  </div>
                                  <p className="text-sm font-black text-white leading-tight">{planFocusAct.place}</p>
                                  <p className="text-sm font-black text-[#D4AF37] mt-0.5">{fmtCur(planFocusAct.cost||0, formData.currency)}</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.5em] mb-0.5">Your Destination</p>
                                  <p className="text-sm font-black text-white uppercase">{DEST}</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Detail body */}
                          {planFocusAct ? (
                            <div className="p-4">
                              <p className="text-[12px] text-white/55 leading-relaxed line-clamp-3 mb-3">{planFocusAct.activity}</p>
                              <div className="grid grid-cols-2 gap-1.5 mb-3">
                                {[{l:'Time',v:SLOT_TIME[planFocusAct.sk]},{l:'Duration',v:planFocusAct.duration},{l:'Travel',v:planFocusAct.travel},{l:'Cost',v:fmtCur(planFocusAct.cost||0,formData.currency)}].map(({l,v}) => (
                                  <div key={l} className="p-2 rounded-lg" style={{background:'rgba(255,255,255,0.04)'}}>
                                    <p className="text-[8px] font-black text-white/25 uppercase tracking-widest mb-0.5">{l}</p>
                                    <p className="text-[11px] font-black text-white/80 truncate">{v||'—'}</p>
                                  </div>
                                ))}
                              </div>
                              <button className="w-full text-center text-[10px] text-white/30 hover:text-white/60 transition-colors mt-1" onClick={() => setPlanFocusAct(null)}>← Back to overview</button>
                            </div>
                          ) : (
                            <div className="p-4">
                              <div className="grid grid-cols-2 gap-1.5">
                                {[{l:'Days',v:(ov.total_days||'—')+' days'},{l:'Travellers',v:ov.passengers||formData.travelers||1},{l:'Style',v:formData.travelStyle||'—'},{l:'Budget',v:fmtCur(res.total_budget?.total||0,formData.currency)}].map(({l,v}) => (
                                  <div key={l} className="p-2 rounded-lg" style={{background:'rgba(255,255,255,0.03)'}}>
                                    <p className="text-[8px] font-black text-white/25 uppercase tracking-widest mb-0.5">{l}</p>
                                    <p className="text-[11px] font-black text-white/80 truncate capitalize">{v}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Day navigation */}
                        <div className="rounded-2xl p-4" style={{background:'#0d1927', border:'1px solid rgba(255,255,255,0.08)'}}>
                          <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.5em] mb-4">Journey</p>
                          <div className="space-y-3">
                            {daysData.map(d => (
                              <div key={d.day} className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/12 flex items-center justify-center flex-shrink-0 border border-[#D4AF37]/20">
                                  <span className="text-[10px] font-black text-[#D4AF37]">{d.day}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-black text-white/75 uppercase tracking-wide truncate">{d.theme}</p>
                                  <p className="text-[9px] text-white/30 font-mono">{d.date}</p>
                                </div>
                                <span className="text-[10px] font-black text-[#D4AF37]/65 flex-shrink-0">{fmtCur(d.budget?.total||0,formData.currency)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* AI highlight */}
                        {res.ai_suggestions?.hidden_gems?.[0] && (
                          <div className="rounded-2xl p-4" style={{background:'rgba(212,175,55,0.05)',border:'1px solid rgba(212,175,55,0.15)'}}>
                            <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.5em] mb-2">✦ Hidden Gem</p>
                            <p className="text-[12px] text-white/60 leading-relaxed">"{res.ai_suggestions.hidden_gems[0]}"</p>
                          </div>
                        )}

                        <p className="text-center text-[9px] text-white/15 uppercase tracking-widest pt-1">
                          {planFocusAct ? '✦ Activity selected' : 'Click any card to preview'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}`;

const result = [...lines.slice(0, START), NEW, ...lines.slice(END + 1)];
fs.writeFileSync(FILE, result.join('\n'), 'utf8');
console.log('Done. Lines:', result.length, '| Replaced:', START+1, '–', END+1);
