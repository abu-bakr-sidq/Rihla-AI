// step7_final.cjs — Interactive split layout + keyword-based real images
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

              // ── Destination hero photo map ──────────────────────────────────
              const DEST_PHOTOS = {
                dubai:"1512453979798-5ea266f8880c", kyoto:"1493976040374-85c8e2238c0e",
                istanbul:"1524231757912-21f4fe3a7200", paris:"1502602228474-5084ce11ef2d",
                london:"1513635269973-35364416f34a", rome:"1552832230-c0197dd311b5",
                singapore:"1523906834658-6e24ef2386f9", pondicherry:"1772633634752-7b7611e839fc",
                chennai:"1587474260584-136574297316", mumbai:"1529253355930-ddbe423a2ac7",
                goa:"1613510854126-1a89fc9f4b1b", kerala:"1596895111956-bf1cf0599c2f",
                mahabalipuram:"1668766158906-9bffd77d67a0", kanyakumari:"1653675838191-2f17f0cdf278",
                venice:"1523906834658-6e24ef2386f9", tokyo:"1540959733332-eab4deabeeaf",
              };
              const destKey = (ov.destination||formData.destination||"").toLowerCase().replace(/[^a-z]/g,'');
              const heroPhotoId = Object.keys(DEST_PHOTOS).find(k => destKey.includes(k)) && DEST_PHOTOS[Object.keys(DEST_PHOTOS).find(k => destKey.includes(k))];
              const heroSrc = heroPhotoId
                ? "https://images.unsplash.com/photo-" + heroPhotoId + "?auto=format&fit=crop&q=80&w=600&h=400"
                : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600&h=400";

              // ── Keyword → curated Unsplash ID pool ─────────────────────────
              // All IDs sourced from verified DESTINATION_ACTIVITIES in this file
              const KW = [
                ["burj khalifa",   "1512453979798-5ea266f8880c"],
                ["fushimi inari",  "1640546088631-fd6e3e88dec0"],
                ["golden pavilion","1493976040374-85c8e2238c0e"],
                ["bamboo",         "1475938476802-32a7e851adb1"],
                ["eiffel",         "1502602228474-5084ce11ef2d"],
                ["louvre",         "1499119643444-245f7bd04899"],
                ["colosseum",      "1552832230-c0197dd311b5"],
                ["vatican",        "1431274172761-fca41d930114"],
                ["tower of london","1513635269973-35364416f34a"],
                ["british museum", "1505761671924-054936d34b43"],
                ["gardens by the bay","1523906834658-6e24ef2386f9"],
                ["supertree",      "1523906834658-6e24ef2386f9"],
                ["shore temple",   "1668766158906-9bffd77d67a0"],
                ["vivekananda",    "1653675838191-2f17f0cdf278"],
                ["matrimandir",    "1591007823521-7f3bc7a12bc2"],
                ["auroville",      "1518998053574-53ee7535d644"],
                ["marina beach",   "1616212176465-4f358316f731"],
                ["promenade",      "1616212176465-4f358316f731"],
                ["backwater",      "1547847055-7977a419c836"],
                ["desert safari",  "1528659550302-53b006932e65"],
                ["mosque",         "1518684079105-3132793108c9"],
                ["shrine",         "1640546088631-fd6e3e88dec0"],
                ["temple",         "1564507592333-c60657eea523"],
                ["church",         "1509439581-299f24796675"],
                ["palace",         "1546412414-803b9a4d429d"],
                ["fort",           "1546412414-803b9a4d429d"],
                ["heritage",       "1603766806347-54cdf3745953"],
                ["monument",       "1668766158906-9bffd77d67a0"],
                ["museum",         "1505761671924-054936d34b43"],
                ["gallery",        "1475440197467-ed5019d75831"],
                ["art",            "1475440197467-ed5019d75831"],
                ["market",         "1526129314478-200a3add6d97"],
                ["bazaar",         "1526129314478-200a3add6d97"],
                ["food",           "1501147233959-1fec69e2189d"],
                ["dining",         "1559339352-11d035aa65de"],
                ["restaurant",     "1559339352-11d035aa65de"],
                ["michelin",       "1586221147501-14e365022e37"],
                ["cafe",           "1501147233959-1fec69e2189d"],
                ["tea",            "1528360983277-13d401cdc186"],
                ["yoga",           "1540660290370-8af2f64177d6"],
                ["meditation",     "1591007823521-7f3bc7a12bc2"],
                ["wellnes",        "1540660290370-8af2f64177d6"],
                ["spa",            "1540660290370-8af2f64177d6"],
                ["safari",         "1528659550302-53b006932e65"],
                ["desert",         "1528659550302-53b006932e65"],
                ["beach",          "1616212176465-4f358316f731"],
                ["sea",            "1547847055-7977a419c836"],
                ["coast",          "1616212176465-4f358316f731"],
                ["cruise",         "1436491865332-7a61a109cc05"],
                ["boat",           "1547847055-7977a419c836"],
                ["river",          "1436491865332-7a61a109cc05"],
                ["lake",           "1547847055-7977a419c836"],
                ["waterfall",      "1475938476802-32a7e851adb1"],
                ["hill",           "1591007823521-7f3bc7a12bc2"],
                ["mountain",       "1475938476802-32a7e851adb1"],
                ["forest",         "1475938476802-32a7e851adb1"],
                ["nature",         "1518998053574-53ee7535d644"],
                ["park",           "1523906834658-6e24ef2386f9"],
                ["garden",         "1583395838374-e4e4fc57d6f4"],
                ["sunset",         "1653675838191-2f17f0cdf278"],
                ["sunrise",        "1653675838191-2f17f0cdf278"],
                ["night",          "1477959858617-67f85cf4f1df"],
                ["skyline",        "1512453979798-5ea266f8880c"],
                ["city",           "1477959858617-67f85cf4f1df"],
                ["walk",           "1772633634752-7b7611e839fc"],
                ["stroll",         "1772633634752-7b7611e839fc"],
                ["suite",          "1542314831-068cd1dbfeeb"],
                ["hotel",          "1607316041696-6d634be942d5"],
                ["resort",         "1542314831-068cd1dbfeeb"],
                ["stay",           "1609132174365-276634b3e80f"],
                ["lighthouse",     "1524231757912-21f4fe3a7200"],
                ["shopping",       "1526129314478-200a3add6d97"],
                ["theatre",        "1505761671924-054936d34b43"],
                ["opera",          "1499119643444-245f7bd04899"],
              ];

              // Fallback pool — 20 unique verified IDs for variety
              const FB_POOL = [
                "1616212176465-4f358316f731","1591007823521-7f3bc7a12bc2",
                "1528360983277-13d401cdc186","1540660290370-8af2f64177d6",
                "1547847055-7977a419c836",   "1603766806347-54cdf3745953",
                "1518998053574-53ee7535d644","1561006289-4fe1a09bf743",
                "1526129314478-200a3add6d97","1475440197467-ed5019d75831",
                "1501147233959-1fec69e2189d","1559339352-11d035aa65de",
                "1528659550302-53b006932e65","1546190255-451a91afc548",
                "1436491865332-7a61a109cc05","1523906834658-6e24ef2386f9",
                "1640546088631-fd6e3e88dec0","1475938476802-32a7e851adb1",
                "1583395838374-e4e4fc57d6f4","1772633634752-7b7611e839fc",
              ];

              let fbIdx = 0;
              const usedIds = new Set();

              const getPhotoId = (act, poolIdx) => {
                // 1. Curated known ID
                if (act?.knownId && act?.image && act.image.length >= 10 && !act.image.includes(' '))
                  return act.image;
                // 2. Keyword match
                const text = ((act?.imageQuery || "") + " " + (act?.place || "")).toLowerCase();
                for (const [kw, id] of KW) { if (text.includes(kw)) return id; }
                // 3. Rotate fallback pool (unique per card)
                const start = poolIdx % FB_POOL.length;
                for (let off = 0; off < FB_POOL.length; off++) {
                  const id = FB_POOL[(start + off) % FB_POOL.length];
                  if (!usedIds.has(id)) { usedIds.add(id); return id; }
                }
                return FB_POOL[poolIdx % FB_POOL.length];
              };

              const thumbUrl = (photoId, w=200, h=200) =>
                "https://images.unsplash.com/photo-" + photoId + "?auto=format&fit=crop&q=75&w=" + w + "&h=" + h;

              // Pre-build all activity data with images
              let cardIdx = 0;
              const daysWithImages = res.days.map((day, di) => ({
                ...day,
                slots: SLOTS.map((sk, si) => {
                  const act = day[sk];
                  if (!act?.place) return null;
                  const photoId = getPhotoId(act, cardIdx++);
                  return { sk, act, photoId, isFirst: si === 0 };
                }).filter(Boolean)
              }));

              // Day previews for right panel
              const dayPreviews = daysWithImages.map(d => ({
                day: d.day, date: d.date, theme: d.theme, total: d.budget?.total,
                previewId: d.slots[0]?.photoId
              }));

              return (
                <motion.div key="final-plan" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }} className="w-full min-h-screen relative z-10 pb-24" style={{ background:'#060f1c' }}>
                  <div className="max-w-[1220px] ml-[clamp(16px,4vw,80px)] mr-auto pt-10 px-4">

                    {/* HEADER */}
                    <div className="mb-10 pb-8 border-b border-white/10 flex items-end justify-between gap-6 flex-wrap">
                      <div>
                        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.6em] mb-3">Rihla AI · Your Journey</p>
                        <h1 className="text-5xl md:text-7xl font-display font-black text-white uppercase tracking-tight leading-none mb-3">
                          {ov.destination || formData.destination}
                        </h1>
                        <p className="text-sm text-white/55 font-mono">{ov.dates} · {ov.total_days} days · {ov.passengers||formData.travelers} {+(ov.passengers||formData.travelers)===1?'traveller':'travellers'}</p>
                        {formData.preferences?.length > 0 && <p className="text-xs text-white/30 mt-1">{formData.preferences.slice(0,4).join(' · ')}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-4xl font-display font-black text-[#D4AF37] tracking-tight">{fmtCur(res.total_budget?.total||0, formData.currency)}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Total Budget</p>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 justify-end">
                          {[{l:'Stay',v:res.total_budget?.stay},{l:'Food',v:res.total_budget?.food},{l:'Transport',v:res.total_budget?.transport},{l:'Activities',v:res.total_budget?.activities}].map(({l,v}) => (
                            <div key={l} className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/30 uppercase tracking-widest">{l}</span>
                              <span className="text-xs font-black text-white/75">{fmtCur(v||0, formData.currency)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 2-COLUMN BODY */}
                    <div className="flex gap-8 items-start">

                      {/* LEFT — Timeline */}
                      <div className="flex-1 min-w-0 space-y-16">
                        {daysWithImages.map((day) => (
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

                            {/* Timeline connector + cards */}
                            <div className="relative ml-5 pl-6 border-l border-white/8 space-y-3">
                              {day.slots.map(({sk, act, photoId, isFirst}) => (
                                <div key={sk} className="relative group">
                                  {/* Dot */}
                                  <div className={"absolute -left-[33px] top-5 w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 " +
                                    (planFocusAct?.place === act.place
                                      ? "bg-[#D4AF37] border-[#D4AF37] scale-125 shadow-md shadow-[#D4AF37]/50"
                                      : isFirst
                                        ? "bg-[#D4AF37] border-[#D4AF37] shadow-sm"
                                        : "bg-[#0d1927] border-white/20 group-hover:border-[#D4AF37]/60"
                                    )} />

                                  {/* Card */}
                                  <div
                                    className="flex gap-4 rounded-xl p-3.5 cursor-default transition-all duration-200"
                                    style={{
                                      background: isFirst ? 'rgba(212,175,55,0.06)' : '#0d1927',
                                      border: '1px solid ' + (isFirst ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.07)'),
                                      borderLeft: isFirst ? '3px solid rgba(212,175,55,0.7)' : '1px solid rgba(255,255,255,0.07)',
                                      boxShadow: planFocusAct?.place === act.place
                                        ? '0 0 0 2px rgba(212,175,55,0.3), 0 8px 32px rgba(0,0,0,0.5)'
                                        : '0 2px 8px rgba(0,0,0,0.2)',
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.transform = 'translateY(-2px)';
                                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)';
                                      setPlanFocusAct({ ...act, photoId });
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.transform = '';
                                      e.currentTarget.style.boxShadow = isFirst
                                        ? '0 2px 8px rgba(0,0,0,0.2)'
                                        : '0 2px 8px rgba(0,0,0,0.2)';
                                      setPlanFocusAct(null);
                                    }}
                                  >
                                    {/* Image */}
                                    <div className="w-[88px] h-[88px] rounded-xl overflow-hidden flex-shrink-0" style={{ background:'#111f30' }}>
                                      <img
                                        src={thumbUrl(photoId, 200, 200)}
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
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-wider px-2 py-0.5 rounded-md" style={{background:'rgba(255,255,255,0.05)'}}>
                                          {SLOT_LABEL[sk]}
                                        </span>
                                        <span className="text-[10px] text-white/30 font-mono">{SLOT_TIME[sk]}</span>
                                        <span className="text-[10px] text-white/25 font-mono">{act.duration}</span>
                                        <span className="text-[10px] text-white/25 font-mono">{act.travel}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Day cost footer */}
                            <div className="ml-5 mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-mono text-white/25">
                              {[{l:'Stay',v:day.budget?.stay},{l:'Food',v:day.budget?.food},{l:'Transport',v:day.budget?.transport},{l:'Activities',v:day.budget?.activities}].map(({l,v}) => (
                                <span key={l}>{l} <span className="text-white/50 font-black">{fmtCur(v||0, formData.currency)}</span></span>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* AI Tips */}
                        {res.ai_suggestions && (
                          <div className="pt-10 border-t border-white/8 grid grid-cols-2 gap-8">
                            {[
                              {label:'Hidden Gems',items:res.ai_suggestions.hidden_gems,col:'#D4AF37'},
                              {label:'Photo Spots',items:res.ai_suggestions.photo_spots,col:'#818CF8'},
                              {label:'Local Tips',items:res.ai_suggestions.tips,col:'#34D399'},
                              {label:'Avoid',items:res.ai_suggestions.avoid,col:'#F87171'},
                            ].map(({label,items,col}) => (
                              <div key={label}>
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-3" style={{color:col}}>{label}</p>
                                <ul className="space-y-2">{(items||[]).slice(0,3).map((tip,i) => <li key={i} className="text-xs text-white/50 leading-relaxed">{tip}</li>)}</ul>
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
                            <button onClick={() => setStep(5)} className="px-6 py-3 rounded-xl border border-white/15 text-white/60 text-xs font-black uppercase tracking-widest hover:border-white/30 hover:text-white transition-all">Customize</button>
                            <button onClick={handleSave} className="px-7 py-3 rounded-xl bg-[#D4AF37] text-black text-xs font-black uppercase tracking-widest hover:bg-[#e4c040] transition-all shadow-lg shadow-[#D4AF37]/20">Finalize Trip</button>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT — Sticky Panel */}
                      <div className="w-[272px] flex-shrink-0 sticky top-6 self-start space-y-3 hidden lg:block">

                        {/* Dynamic preview — updates on hover */}
                        <div className="rounded-2xl overflow-hidden transition-all duration-300" style={{background:'#0d1927', border:'1px solid rgba(255,255,255,0.08)'}}>
                          <div className="relative h-[180px] overflow-hidden">
                            <img
                              key={planFocusAct?.photoId || 'hero'}
                              src={planFocusAct ? thumbUrl(planFocusAct.photoId, 560, 360) : heroSrc}
                              className="w-full h-full object-cover transition-all duration-500"
                              style={{objectPosition:'center 40%'}}
                              alt={planFocusAct?.place || (ov.destination||'')}
                            />
                            <div className="absolute inset-0" style={{background:'linear-gradient(to top, rgba(13,25,39,0.95) 0%, rgba(13,25,39,0.2) 55%, transparent 100%)'}} />
                            <div className="absolute bottom-3 left-4 right-4">
                              {planFocusAct ? (
                                <>
                                  <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.5em] mb-0.5">Now Viewing</p>
                                  <p className="text-sm font-black text-white leading-tight">{planFocusAct.place}</p>
                                  <p className="text-[11px] font-black text-[#D4AF37] mt-0.5">{fmtCur(planFocusAct.cost||0, formData.currency)}</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.5em] mb-0.5">Destination</p>
                                  <p className="text-sm font-black text-white uppercase">{ov.destination||formData.destination}</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Detail strip — shown on hover */}
                          {planFocusAct ? (
                            <div className="p-3 space-y-2">
                              <p className="text-[11px] text-white/55 leading-relaxed line-clamp-3">{planFocusAct.activity}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/35 font-mono mt-1">
                                <span>{SLOT_TIME[Object.keys(SLOT_TIME).find(k => planFocusAct.reason?.includes(k==='night'?'intimate':k==='morning'?'energetic':k==='evening'?'scenic':'full'))||'morning']}</span>
                                <span>{planFocusAct.duration}</span>
                                <span>{planFocusAct.travel}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3">
                              <div className="grid grid-cols-2 gap-1.5">
                                {[
                                  {l:'Duration', v:(ov.total_days||'—')+' days'},
                                  {l:'Travellers', v:(ov.passengers||formData.travelers||1)+(+(ov.passengers||formData.travelers)===1?' person':' people')},
                                  {l:'Style', v:formData.travelStyle||'—'},
                                  {l:'Budget', v:fmtCur(res.total_budget?.total||0, formData.currency)},
                                ].map(({l,v}) => (
                                  <div key={l} className="p-2 rounded-lg" style={{background:'rgba(255,255,255,0.03)'}}>
                                    <p className="text-[8px] font-black text-white/25 uppercase tracking-widest mb-0.5">{l}</p>
                                    <p className="text-[11px] font-black text-white/80 truncate">{v}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Journey overview */}
                        <div className="rounded-2xl p-4" style={{background:'#0d1927', border:'1px solid rgba(255,255,255,0.08)'}}>
                          <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.5em] mb-4">Journey Overview</p>
                          <div className="space-y-3">
                            {dayPreviews.map(dp => (
                              <div key={dp.day} className="flex items-center gap-3">
                                {dp.previewId && (
                                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={thumbUrl(dp.previewId, 64, 64)} className="w-full h-full object-cover" alt={dp.theme} />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-black text-white/75 uppercase tracking-wide truncate">{dp.theme||('Day '+dp.day)}</p>
                                  <p className="text-[9px] text-white/30 font-mono">{dp.date}</p>
                                </div>
                                <span className="text-[10px] font-black text-[#D4AF37]/70 flex-shrink-0">{fmtCur(dp.total||0, formData.currency)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Hidden gem */}
                        {res.ai_suggestions?.hidden_gems?.[0] && (
                          <div className="rounded-2xl p-4" style={{background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.15)'}}>
                            <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.5em] mb-2">✦ Hidden Gem</p>
                            <p className="text-[12px] text-white/60 leading-relaxed">"{res.ai_suggestions.hidden_gems[0]}"</p>
                          </div>
                        )}

                        {/* Hover hint */}
                        {!planFocusAct && (
                          <p className="text-center text-[9px] text-white/18 uppercase tracking-widest pt-1">Hover a card to preview</p>
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
