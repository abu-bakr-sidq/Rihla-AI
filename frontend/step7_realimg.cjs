// step7_realimg.cjs — 3-tier real image system: knownId → KW map → loremflickr
const fs = require('fs');
const FILE = 'src/pages/planner.jsx';
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

const START = lines.findIndex(l => l.includes('step === 7') && l.includes('generatedResult'));
let depth = 0, END = -1;
for (let i = START; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > START) { END = i; break; }
}
console.log(`Replacing step 7 block: lines ${START + 1}–${END + 1}`);

const NEW = `            {step === 7 && generatedResult && (() => {
              const res = generatedResult;
              if (!res?.days?.length) return (
                <div className="flex items-center justify-center py-24 text-white/30 text-sm">Generating itinerary…</div>
              );

              const ov = res.trip_overview || {};
              const DEST = ov.destination || formData.destination || "";
              const SLOTS      = ["morning","afternoon","evening","night"];
              const SLOT_ICON  = { morning:"🌅", afternoon:"🌇", evening:"🌃", night:"🌙" };
              const SLOT_TIME  = { morning:"08:00 – 12:00", afternoon:"12:00 – 17:00", evening:"17:00 – 21:00", night:"21:00 – 23:30" };
              const SLOT_LABEL = { morning:"Morning", afternoon:"Afternoon", evening:"Evening", night:"Night" };

              // ── FALLBACK ──────────────────────────────────────────────────
              const SAFE_FB = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80";

              // ── TIER 1: curated Unsplash photo IDs (verified) ─────────────
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
              const matchedDest = Object.keys(DEST_PHOTOS).find(k => destKey.includes(k));
              const heroSrc = matchedDest
                ? "https://images.unsplash.com/photo-" + DEST_PHOTOS[matchedDest] + "?auto=format&fit=crop&q=80&w=800&h=500"
                : "https://loremflickr.com/800/500/" + encodeURIComponent(DEST.split(' ').slice(0,2).join(',')) + "?random=0";

              // ── TIER 2: keyword → verified Unsplash ID (100+ entries) ─────
              const KW_MAP = [
                // Landmarks (global)
                ["burj khalifa","1512453979798-5ea266f8880c"],
                ["al fahidi","1546412414-803b9a4d429d"],
                ["museum of the future","1609121838589-9407384ed880"],
                ["palm jumeirah","1546190255-451a91afc548"],
                ["desert safari","1528659550302-53b006932e65"],
                ["fushimi inari","1640546088631-fd6e3e88dec0"],
                ["golden pavilion","1493976040374-85c8e2238c0e"],
                ["arashiyama","1475938476802-32a7e851adb1"],
                ["kinkaku","1493976040374-85c8e2238c0e"],
                ["eiffel","1502602228474-5084ce11ef2d"],
                ["louvre","1499119643444-245f7bd04899"],
                ["montmartre","1494236581341-7d399e430485"],
                ["colosseum","1552832230-c0197dd311b5"],
                ["vatican","1431274172761-fca41d930114"],
                ["pantheon","1534430480872-27ff9c6c5fef"],
                ["trevi fountain","1552832230-c0197dd311b5"],
                ["tower of london","1513635269973-35364416f34a"],
                ["british museum","1505761671924-054936d34b43"],
                ["westminster","1486304891242-13c54a7d6cbc"],
                ["big ben","1486304891242-13c54a7d6cbc"],
                ["gardens by the bay","1523906834658-6e24ef2386f9"],
                ["marina bay sands","1512453979798-5ea266f8880c"],
                ["sentosa","1507525428034-b723cf961d3e"],
                ["chinatown singapore","1506973035872-a4ec16b8e8d9"],
                ["shore temple","1668766158906-9bffd77d67a0"],
                ["five rathas","1603766806347-54cdf3745953"],
                ["vivekananda rock","1653675838191-2f17f0cdf278"],
                ["matrimandir","1591007823521-7f3bc7a12bc2"],
                ["auroville","1518998053574-53ee7535d644"],
                ["marina beach","1616212176465-4f358316f731"],
                ["promenade beach","1616212176465-4f358316f731"],
                ["kapaleeshwarar","1564507592333-c60657eea523"],
                ["mahabalipuram","1668766158906-9bffd77d67a0"],
                // Religious / Cultural
                ["mosque","1518684079105-3132793108c9"],
                ["jumeirah mosque","1518684079105-3132793108c9"],
                ["shrine","1640546088631-fd6e3e88dec0"],
                ["temple","1564507592333-c60657eea523"],
                ["church","1509439581-299f24796675"],
                ["basilica","1431274172761-fca41d930114"],
                ["cathedral","1509439581-299f24796675"],
                ["palace","1546412414-803b9a4d429d"],
                ["fort","1546412414-803b9a4d429d"],
                ["monastery","1583395838374-e4e4fc57d6f4"],
                ["ashram","1540660290370-8af2f64177d6"],
                ["heritage","1603766806347-54cdf3745953"],
                ["monument","1668766158906-9bffd77d67a0"],
                ["statue","1653675838191-2f17f0cdf278"],
                // Museums & Arts
                ["museum","1505761671924-054936d34b43"],
                ["gallery","1475440197467-ed5019d75831"],
                ["art walk","1475440197467-ed5019d75831"],
                ["theatre","1505761671924-054936d34b43"],
                ["opera","1499119643444-245f7bd04899"],
                // Nature / Outdoors
                ["beach","1616212176465-4f358316f731"],
                ["sea","1507525428034-b723cf961d3e"],
                ["ocean","1507525428034-b723cf961d3e"],
                ["coast","1616212176465-4f358316f731"],
                ["lake","1547847055-7977a419c836"],
                ["backwater","1547847055-7977a419c836"],
                ["waterfall","1475938476802-32a7e851adb1"],
                ["bamboo","1475938476802-32a7e851adb1"],
                ["forest","1475938476802-32a7e851adb1"],
                ["hill station","1591007823521-7f3bc7a12bc2"],
                ["hill","1591007823521-7f3bc7a12bc2"],
                ["mountain","1475938476802-32a7e851adb1"],
                ["valley","1591007823521-7f3bc7a12bc2"],
                ["viewpoint","1591007823521-7f3bc7a12bc2"],
                ["sunrise","1653675838191-2f17f0cdf278"],
                ["sunset","1616212176465-4f358316f731"],
                ["garden","1583395838374-e4e4fc57d6f4"],
                ["park","1523906834658-6e24ef2386f9"],
                // Adventure
                ["safari","1528659550302-53b006932e65"],
                ["desert","1528659550302-53b006932e65"],
                ["dune","1528659550302-53b006932e65"],
                ["trek","1475938476802-32a7e851adb1"],
                ["hike","1475938476802-32a7e851adb1"],
                ["adventure","1528659550302-53b006932e65"],
                ["cruise","1436491865332-7a61a109cc05"],
                ["yacht","1546190255-451a91afc548"],
                ["boat","1547847055-7977a419c836"],
                ["ferry","1547847055-7977a419c836"],
                ["river","1436491865332-7a61a109cc05"],
                // Wellness
                ["yoga","1540660290370-8af2f64177d6"],
                ["meditation","1591007823521-7f3bc7a12bc2"],
                ["spa","1540660290370-8af2f64177d6"],
                ["wellness","1540660290370-8af2f64177d6"],
                ["tea ceremony","1528360983277-13d401cdc186"],
                ["tea","1528360983277-13d401cdc186"],
                // Food & Dining
                ["michelin","1586221147501-14e365022e37"],
                ["fine dining","1559339352-11d035aa65de"],
                ["underwater dining","1559339352-11d035aa65de"],
                ["rooftop","1586221147501-14e365022e37"],
                ["restaurant","1559339352-11d035aa65de"],
                ["dining","1559339352-11d035aa65de"],
                ["food","1501147233959-1fec69e2189d"],
                ["cuisine","1501147233959-1fec69e2189d"],
                ["cafe","1501147233959-1fec69e2189d"],
                ["bistro","1501147233959-1fec69e2189d"],
                ["market","1526129314478-200a3add6d97"],
                ["bazaar","1526129314478-200a3add6d97"],
                ["street food","1526129314478-200a3add6d97"],
                // Shopping
                ["shopping","1526129314478-200a3add6d97"],
                ["mall","1512207436516-5e4b3776be5c"],
                // Stays
                ["royal suite","1542314831-068cd1dbfeeb"],
                ["suite","1542314831-068cd1dbfeeb"],
                ["hotel","1607316041696-6d634be942d5"],
                ["resort","1542314831-068cd1dbfeeb"],
                ["ryokan","1528360983277-13d401cdc186"],
                ["heritage stay","1603766806347-54cdf3745953"],
                // Misc
                ["night","1477959858617-67f85cf4f1df"],
                ["skyline","1512453979798-5ea266f8880c"],
                ["city tour","1477959858617-67f85cf4f1df"],
                ["walk","1772633634752-7b7611e839fc"],
                ["stroll","1772633634752-7b7611e839fc"],
                ["lighthouse","1524231757912-21f4fe3a7200"],
                ["art", "1475440197467-ed5019d75831"],
              ];

              // ── TIER 3: loremflickr — real Flickr photos by keyword query ─
              // Builds a query from activity name + destination for accuracy
              const loremSrc = (act, idx, w, h) => {
                const raw = (act?.imageQuery || act?.place || "travel destination");
                const terms = raw.toLowerCase()
                  .replace(/[^a-z0-9 ]/g,'').trim()
                  .split(' ').filter(t => t.length > 2).slice(0,3).join(',');
                return "https://loremflickr.com/" + w + "/" + h + "/" + (terms||"travel") + "?random=" + idx;
              };

              // ── MAIN IMAGE RESOLVER ───────────────────────────────────────
              const buildSrcs = (act, idx) => {
                // Tier 1: curated per-destination photo ID
                if (act?.knownId && act?.image?.length >= 10 && !act.image.includes(' ')) {
                  const base = "https://images.unsplash.com/photo-" + act.image + "?auto=format&fit=crop&q=80";
                  return { hero: base+"&w=900&h=520", thumb: base+"&w=160&h=160", panel: base+"&w=600&h=400", mini: base+"&w=72&h=72" };
                }
                // Tier 2: keyword → verified photo ID
                const text = ((act?.imageQuery||"")+" "+(act?.place||"")).toLowerCase();
                for (const [kw, id] of KW_MAP) {
                  if (text.includes(kw)) {
                    const base = "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&q=80";
                    return { hero: base+"&w=900&h=520", thumb: base+"&w=160&h=160", panel: base+"&w=600&h=400", mini: base+"&w=72&h=72" };
                  }
                }
                // Tier 3: loremflickr — real Flickr photo matching the query
                return {
                  hero:  loremSrc(act, idx, 900, 520),
                  thumb: loremSrc(act, idx, 160, 160),
                  panel: loremSrc(act, idx, 600, 400),
                  mini:  loremSrc(act, idx, 72,  72),
                };
              };

              // Pre-resolve all slots
              let ci = 0;
              const daysData = res.days.map((day) => ({
                ...day,
                slots: SLOTS.map((sk, si) => {
                  const act = day[sk];
                  if (!act?.place) return null;
                  const srcs = buildSrcs(act, ci++);
                  return { sk, act, srcs, isHero: si === 0 };
                }).filter(Boolean)
              }));

              const ON_ERR = "e=>{e.target.onerror=null;e.target.src='" + SAFE_FB + "&w='+e.target.naturalWidth+'&h='+e.target.naturalHeight;}";

              return (
                <motion.div key="realimg-plan" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5}} className="w-full min-h-screen relative z-10 pb-28" style={{background:'#060f1c'}}>
                  <div className="max-w-[1220px] ml-[clamp(16px,4vw,80px)] mr-auto pt-10 px-4">

                    {/* ── HEADER ─────────────────────────────────────────── */}
                    <div className="mb-12 pb-8 border-b border-white/8 flex items-end justify-between gap-6 flex-wrap">
                      <div>
                        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.6em] mb-3">Rihla AI · Your Journey</p>
                        <h1 className="text-5xl md:text-[80px] font-display font-black text-white uppercase tracking-tight leading-none mb-4" style={{letterSpacing:'-0.03em'}}>
                          {DEST}
                        </h1>
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

                    {/* ── 2-COLUMN ─────────────────────────────────────── */}
                    <div className="flex gap-8 items-start">

                      {/* LEFT — Days ────────────────────────────────────── */}
                      <div className="flex-1 min-w-0 space-y-20">
                        {daysData.map((day) => (
                          <div key={day.day}>

                            {/* Day label row */}
                            <div className="flex items-center gap-3 mb-5">
                              <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.6em]">Day {day.day}</span>
                              <span className="text-[10px] text-white/30 font-mono">{day.date}</span>
                              <div className="flex-1 h-px bg-white/6" />
                              <span className="text-[10px] font-black text-white/40">{fmtCur(day.budget?.total||0, formData.currency)}</span>
                            </div>
                            <p className="text-[22px] font-display font-black text-white uppercase tracking-wide mb-5">{day.theme}</p>

                            {/* HERO CARD — first slot */}
                            {day.slots[0] && (() => {
                              const { sk, act, srcs } = day.slots[0];
                              return (
                                <div
                                  className="relative w-full rounded-2xl overflow-hidden mb-4 cursor-pointer group"
                                  style={{ height:'260px', background:'#0d1927' }}
                                  onClick={() => setPlanFocusAct(planFocusAct?.place===act.place ? null : {...act, srcs, sk})}
                                >
                                  <img
                                    src={srcs.hero}
                                    onError={e => { e.target.onerror=null; e.target.src=SAFE_FB+"&w=900&h=520"; }}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    alt={act.place}
                                  />
                                  <div className="absolute inset-0" style={{background:'linear-gradient(to top, rgba(6,15,28,0.97) 0%, rgba(6,15,28,0.5) 50%, rgba(6,15,28,0.1) 100%)'}} />
                                  <div className="absolute top-4 left-4 flex items-center gap-2">
                                    <span className="text-lg">{SLOT_ICON[sk]}</span>
                                    <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.5em] bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full border border-[#D4AF37]/25">{SLOT_LABEL[sk]}</span>
                                  </div>
                                  <div className="absolute top-4 right-4 bg-[#D4AF37] text-black text-xs font-black px-3 py-1.5 rounded-xl shadow-lg">
                                    {fmtCur(act.cost||0, formData.currency)}
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 p-5">
                                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-wide leading-tight mb-1.5">{act.place}</h3>
                                    <p className="text-sm text-white/60 leading-relaxed line-clamp-2 mb-3">{act.activity}</p>
                                    <div className="flex items-center gap-3">
                                      <span className="text-[11px] text-white/40 font-mono">{SLOT_TIME[sk]}</span>
                                      <span className="w-1 h-1 rounded-full bg-white/25" />
                                      <span className="text-[11px] text-white/40 font-mono">{act.duration}</span>
                                      <span className="w-1 h-1 rounded-full bg-white/25" />
                                      <span className="text-[11px] text-white/40 font-mono">{act.travel}</span>
                                    </div>
                                  </div>
                                  {planFocusAct?.place===act.place && <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{boxShadow:'inset 0 0 0 2px rgba(212,175,55,0.8)'}} />}
                                </div>
                              );
                            })()}

                            {/* SUB-CARDS — remaining slots */}
                            {day.slots.length > 1 && (
                              <div className="space-y-2">
                                {day.slots.slice(1).map(({ sk, act, srcs }) => (
                                  <div
                                    key={sk}
                                    className="flex items-center gap-4 rounded-xl p-4 cursor-pointer group transition-all duration-200"
                                    style={{
                                      background: planFocusAct?.place===act.place ? 'rgba(212,175,55,0.07)' : '#0d1927',
                                      border: '1px solid '+(planFocusAct?.place===act.place?'rgba(212,175,55,0.3)':'rgba(255,255,255,0.07)'),
                                    }}
                                    onClick={() => setPlanFocusAct(planFocusAct?.place===act.place ? null : {...act, srcs, sk})}
                                    onMouseEnter={e => { if(planFocusAct?.place!==act.place){ e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.transform='translateX(2px)'; } }}
                                    onMouseLeave={e => { if(planFocusAct?.place!==act.place){ e.currentTarget.style.background='#0d1927'; e.currentTarget.style.transform=''; } }}
                                  >
                                    {/* Fixed 72×72 thumbnail */}
                                    <div style={{width:'72px', height:'72px', minWidth:'72px', minHeight:'72px', borderRadius:'12px', overflow:'hidden', background:'#111f30', flexShrink:0}}>
                                      <img
                                        src={srcs.thumb}
                                        onError={e => { e.target.onerror=null; e.target.src=SAFE_FB+"&w=160&h=160"; }}
                                        style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}}
                                        className="group-hover:scale-105 transition-transform duration-500"
                                        alt=""
                                      />
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-3 mb-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-sm flex-shrink-0">{SLOT_ICON[sk]}</span>
                                          <h3 className="text-[14px] font-black text-white truncate">{act.place}</h3>
                                        </div>
                                        <span className="text-[14px] font-black text-[#D4AF37] flex-shrink-0 ml-2">{fmtCur(act.cost||0, formData.currency)}</span>
                                      </div>
                                      <p className="text-[12px] text-white/45 line-clamp-1 mb-2">{act.activity}</p>
                                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-white/25 font-mono">
                                        <span className="text-white/35 font-black uppercase tracking-widest text-[9px]">{SLOT_LABEL[sk]}</span>
                                        <span>·</span><span>{SLOT_TIME[sk]}</span>
                                        <span>·</span><span>{act.duration}</span>
                                        <span>·</span><span>{act.travel}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Day cost footer */}
                            <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap gap-x-6 gap-y-1 text-[10px] font-mono text-white/20">
                              {[{l:'Stay',v:day.budget?.stay},{l:'Food',v:day.budget?.food},{l:'Transport',v:day.budget?.transport},{l:'Activities',v:day.budget?.activities}].map(({l,v}) => (
                                <span key={l}>{l} <span className="text-white/45 font-black">{fmtCur(v||0, formData.currency)}</span></span>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* AI TIPS — 2×2 compact cards */}
                        {res.ai_suggestions && (
                          <div className="border-t border-white/8 pt-12">
                            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.6em] mb-6">Curated Insights</p>
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                {key:'hidden_gems',label:'Hidden Gems',icon:'✦',col:'#D4AF37'},
                                {key:'photo_spots',label:'Photo Spots',icon:'📸',col:'#818CF8'},
                                {key:'tips',label:'Local Tips',icon:'💡',col:'#34D399'},
                                {key:'avoid',label:'Avoid',icon:'⚠',col:'#F87171'},
                              ].map(({key,label,icon,col}) => {
                                const items = (res.ai_suggestions[key]||[]).slice(0,2);
                                if (!items.length) return null;
                                return (
                                  <div key={key} className="rounded-xl p-4" style={{background:'#0d1927',border:'1px solid rgba(255,255,255,0.07)'}}>
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="text-base leading-none">{icon}</span>
                                      <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{color:col}}>{label}</span>
                                    </div>
                                    <ul className="space-y-1.5">{items.map((tip,i) => <li key={i} className="text-[11px] text-white/50 leading-relaxed">{tip}</li>)}</ul>
                                  </div>
                                );
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

                      {/* RIGHT — Sticky Panel ─────────────────────────── */}
                      <div className="w-[272px] flex-shrink-0 sticky top-6 self-start space-y-3 hidden lg:block">

                        {/* Preview card */}
                        <div className="rounded-2xl overflow-hidden" style={{background:'#0d1927', border:'1px solid rgba(255,255,255,0.08)'}}>
                          <div className="relative overflow-hidden" style={{height:'200px', background:'#0d1927'}}>
                            <img
                              key={planFocusAct?.place||'dest'}
                              src={planFocusAct ? planFocusAct.srcs?.panel : heroSrc}
                              onError={e => { e.target.onerror=null; e.target.src=SAFE_FB+"&w=600&h=400"; }}
                              className="w-full h-full object-cover transition-all duration-500"
                              style={{objectPosition:'center 40%'}}
                              alt={planFocusAct?.place||DEST}
                            />
                            <div className="absolute inset-0" style={{background:'linear-gradient(to top, rgba(13,25,39,0.97) 0%, rgba(13,25,39,0.3) 55%, transparent 100%)'}} />
                            <div className="absolute bottom-4 left-4 right-4">
                              {planFocusAct ? (
                                <>
                                  <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.5em] mb-0.5">Selected Activity</p>
                                  <p className="text-sm font-black text-white leading-tight">{planFocusAct.place}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-black text-[#D4AF37]">{fmtCur(planFocusAct.cost||0, formData.currency)}</span>
                                    <span className="text-[10px] text-white/35 font-mono">{SLOT_TIME[planFocusAct.sk]}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.5em] mb-0.5">Your Destination</p>
                                  <p className="text-sm font-black text-white uppercase tracking-wide">{DEST}</p>
                                </>
                              )}
                            </div>
                          </div>
                          {planFocusAct ? (
                            <div className="p-4">
                              <p className="text-[12px] text-white/55 leading-relaxed line-clamp-3 mb-3">{planFocusAct.activity}</p>
                              <div className="grid grid-cols-2 gap-1.5">
                                {[{l:'Duration',v:planFocusAct.duration},{l:'Travel',v:planFocusAct.travel},{l:'Time',v:SLOT_TIME[planFocusAct.sk]},{l:'Cost',v:fmtCur(planFocusAct.cost||0,formData.currency)}].map(({l,v}) => (
                                  <div key={l} className="p-2 rounded-lg" style={{background:'rgba(255,255,255,0.04)'}}>
                                    <p className="text-[8px] font-black text-white/25 uppercase tracking-widest">{l}</p>
                                    <p className="text-[11px] font-black text-white/80 truncate">{v}</p>
                                  </div>
                                ))}
                              </div>
                              <button className="mt-3 w-full text-center text-[10px] text-white/30 hover:text-white/60 transition-colors" onClick={() => setPlanFocusAct(null)}>← Back to overview</button>
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

                        {/* Day overview */}
                        <div className="rounded-2xl p-4" style={{background:'#0d1927', border:'1px solid rgba(255,255,255,0.08)'}}>
                          <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.5em] mb-4">Journey</p>
                          <div className="space-y-3">
                            {daysData.map(d => (
                              <div key={d.day} className="flex items-center gap-3">
                                {d.slots[0] && (
                                  <div style={{width:'32px',height:'32px',minWidth:'32px',minHeight:'32px',borderRadius:'8px',overflow:'hidden',background:'#111f30',flexShrink:0}}>
                                    <img
                                      src={d.slots[0].srcs?.mini}
                                      onError={e => { e.target.onerror=null; e.target.src=SAFE_FB+"&w=72&h=72"; }}
                                      style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                                      alt=""
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-black text-white/75 uppercase tracking-wide truncate">{d.theme}</p>
                                  <p className="text-[9px] text-white/30 font-mono">{d.date}</p>
                                </div>
                                <span className="text-[10px] font-black text-[#D4AF37]/65 flex-shrink-0">{fmtCur(d.budget?.total||0,formData.currency)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

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
