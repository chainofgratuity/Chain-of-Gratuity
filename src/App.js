import { useState, useEffect, useRef, useCallback } from "react";

// ─── GLOBAL FONTS + RESET ──────────────────────────────────────────────────────
const GLOBAL = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,700;1,9..144,900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --sun:   #FFD44F; --coral: #FF6B4A; --mint:  #3ECFA0;
    --sky:   #4BBEF5; --ink:   #1A1A2E; --paper: #FFF8F0;
    --muted: #9A9AAA; --border:#EAE6DE;
  }
  html { scroll-behavior: smooth; }
  body { font-family: 'DM Sans', sans-serif; background: var(--paper); color: var(--ink); overflow-x: hidden; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #D0D0DC; border-radius: 3px; }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes popIn    { from{opacity:0;transform:scale(0.9) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
  @keyframes toastUp  { to{transform:translateX(-50%) translateY(0)} }
  @keyframes livePulse{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes bounce   { 0%{transform:scale(0)} 70%{transform:scale(1.15)} 100%{transform:scale(1)} }
  @keyframes pageIn   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
`;

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://ewowbwhfdpbnuvaqmxkk.supabase.co";
const SUPABASE_KEY = "sb_publishable_t5pln0r4nj3tiVdZ8_qUrg_pLKnAQ1i";

async function dbQuery(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
const adj  = ["GOLDEN","BOLD","KIND","WARM","BRIGHT","SWIFT","PURE","NOBLE","BRAVE","GENTLE"];
const noun = ["SPARK","WAVE","LINK","SEED","FLAME","CHAIN","RIPPLE","BLOOM","BRIDGE","GRACE"];
const genCode = () => `${adj[Math.floor(Math.random()*adj.length)]}-${noun[Math.floor(Math.random()*noun.length)]}-${String(Math.floor(Math.random()*9000)+1000)}`;
const ACCENTS = ["#FF6B4A","#FFD44F","#3ECFA0","#4BBEF5","#C084FC","#F472B6"];
const colorFor = i => ACCENTS[i % ACCENTS.length];
const timeAgo = iso => { const d=(Date.now()-new Date(iso))/1000; if(d<60)return"just now"; if(d<3600)return`${Math.floor(d/60)}m ago`; if(d<86400)return`${Math.floor(d/3600)}h ago`; return`${Math.floor(d/86400)}d ago`; };

// ─── SHARED NAV ───────────────────────────────────────────────────────────────
const NAV_CSS = `
  .nav { position:fixed;top:0;left:0;right:0;z-index:500;display:flex;align-items:center;justify-content:space-between;padding:18px 32px;transition:background .3s,box-shadow .3s,padding .3s; }
  .nav--dark,.nav--scrolled { background:rgba(26,26,46,.96);backdrop-filter:blur(12px);box-shadow:0 2px 20px rgba(0,0,0,.2); }
  .nav--scrolled { padding:12px 32px; }
  .nav-logo { font-family:'Fraunces',serif;font-size:1.1rem;font-weight:900;color:white;background:none;border:none;cursor:pointer;letter-spacing:-.3px; }
  .nav-logo em { font-style:italic;color:#FFD44F; }
  .nav-links { display:flex;align-items:center;gap:4px; }
  .nl { background:none;border:none;color:rgba(255,255,255,.6);font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:500;cursor:pointer;padding:7px 13px;border-radius:50px;transition:color .2s,background .2s;white-space:nowrap; }
  .nl:hover { color:white;background:rgba(255,255,255,.08); }
  .nl--active { color:white;background:rgba(255,255,255,.12); }
  .nl--cta { background:#FF6B4A;color:white!important;font-weight:700;margin-left:6px; }
  .nl--cta:hover { background:#ff5533!important; }
  .nav-burger { display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:4px; }
  .nav-burger span { display:block;width:22px;height:2px;background:white;border-radius:2px;transition:transform .2s,opacity .2s; }
  .nav-drawer { position:fixed;top:58px;left:0;right:0;background:rgba(26,26,46,.98);backdrop-filter:blur(16px);z-index:499;display:flex;flex-direction:column;padding:12px 24px 20px;border-bottom:1px solid rgba(255,255,255,.08);animation:fadeIn .2s ease; }
  .nd { background:none;border:none;color:rgba(255,255,255,.7);font-family:'DM Sans',sans-serif;font-size:1rem;font-weight:500;cursor:pointer;text-align:left;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.06);transition:color .2s; }
  .nd:last-child { border-bottom:none; }
  .nd:hover,.nd--active { color:white; }
  .color-bar { height:5px;background:linear-gradient(90deg,var(--coral),var(--sun),var(--mint),var(--sky),#C084FC); }
  @media(max-width:720px){ .nav-links{display:none;} .nav-burger{display:flex;} .nav{padding:16px 20px;} }
`;

function Nav({ page, go }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h);
  }, []);
  const LINKS = [["home","Home"],["feed","Live Feed"],["chain","My Chain"],["add","Add My Story"],["ask","Ask for Help"],["shop","Shop"]];
  const isDark = page !== "home" || scrolled;
  return (
    <>
      <nav className={`nav${isDark?" nav--dark":""}${scrolled?" nav--scrolled":""}`}>
        <button className="nav-logo" onClick={()=>go("home")} style={{display:"flex",alignItems:"center",gap:8}}>
          <img src="/logo.png" alt="Chain of Gratuity" style={{width:32,height:32,objectFit:"contain",flexShrink:0}}/>
          <span>Chain of <em>Gratuity</em></span>
        </button>
        <div className="nav-links">
          {LINKS.map(([id,label])=>(
            <button key={id} className={`nl${page===id?" nl--active":""}${id==="add"?" nl--cta":""}`} onClick={()=>go(id)}>{label}</button>
          ))}
        </div>
        <button className="nav-burger" onClick={()=>setOpen(o=>!o)}>
          <span/><span/><span/>
        </button>
      </nav>
      {open && (
        <div className="nav-drawer">
          {LINKS.map(([id,label])=>(
            <button key={id} className={`nd${page===id?" nd--active":""}`} onClick={()=>{go(id);setOpen(false);}}>{label}</button>
          ))}
        </div>
      )}
    </>
  );
}

// ─── TOAST HOOK ───────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const t = useRef(null);
  const show = msg => { setToast(msg); clearTimeout(t.current); t.current = setTimeout(()=>setToast(null),2800); };
  const el = toast ? <div className="toast">{toast}</div> : null;
  return [show, el];
}

// ─── SHARED SMALL COMPONENTS ──────────────────────────────────────────────────
const ColorBar = () => <div className="color-bar"/>;

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const FEED_DATA = [
  {id:1,code:"GOLDEN-SPARK-4821",author:"Maya R.",city:"San Francisco",links:5,excerpt:"A stranger helped me collect everything I dropped on the sidewalk without saying a word…",color:"#FF6B4A",created_at:new Date(Date.now()-7200000).toISOString()},
  {id:2,code:"WARM-BLOOM-2247",author:"Priya K.",city:"Chicago",links:3,excerpt:"The barista remembered my order even though I hadn't been in for months…",color:"#3ECFA0",created_at:new Date(Date.now()-18000000).toISOString()},
  {id:3,code:"BOLD-WAVE-7731",author:"James T.",city:"Austin",links:7,excerpt:"My neighbor shoveled my driveway at 6am before I even woke up…",color:"#4BBEF5",created_at:new Date(Date.now()-28800000).toISOString()},
  {id:4,code:"SWIFT-RIPPLE-9102",author:"Sam W.",city:"Portland",links:2,excerpt:"Someone paid my toll on the bridge and left a card on my windshield…",color:"#FFD44F",created_at:new Date(Date.now()-43200000).toISOString()},
  {id:5,code:"KIND-SEED-3318",author:"Dani F.",city:"Nashville",links:4,excerpt:"A woman in line ahead of me paid for my groceries after seeing my card decline…",color:"#C084FC",created_at:new Date(Date.now()-54000000).toISOString()},
  {id:6,code:"NOBLE-FLAME-6644",author:"Keisha L.",city:"Atlanta",links:1,excerpt:"My Uber driver helped me carry boxes to my apartment on the third floor without being asked…",color:"#F472B6",created_at:new Date(Date.now()-72000000).toISOString()},
];

const CHAIN_LINKS = [
  {id:1,name:"Maya R.",location:"San Francisco, CA",date:"March 2, 2025",story:"I was rushing to catch my train and dropped everything — groceries, bag, all of it scattered across the sidewalk. A man I'd never seen before dropped to his knees and helped me collect every single item without saying a word. When we were done he just smiled, nodded, and walked the other way. I never got his name.",isOrigin:true},
  {id:2,name:"Daniel F.",location:"Oakland, CA",date:"March 8, 2025",story:"Maya handed me this card after I'd had the worst afternoon of my year. My car had broken down and I was sitting on the curb waiting for a tow when she pulled over and sat with me for twenty minutes just talking. She didn't know me at all.",isOrigin:false},
  {id:3,name:"Anonymous",location:null,date:"March 19, 2025",story:"Daniel left this card on my windshield after seeing me struggle with a parking meter that kept rejecting my card. He fed it coins from his own pocket and just left the card tucked under my wiper. I cried a little, not gonna lie.",isOrigin:false},
  {id:4,name:"Priya K.",location:"Berkeley, CA",date:"April 1, 2025",story:"Got this card secondhand but the story hit me hard. That same week I bought dinner for a family I overheard saying they couldn't afford to order what their kids wanted. Left the card with their server.",isOrigin:false},
  {id:5,name:"James T.",location:"San Jose, CA",date:"April 14, 2025",story:"Priya's server passed this to me. I work at a restaurant and honestly people are rude more often than not. Getting this on a day when three tables had complained about things that weren't my fault — I sat in the back and read it four times.",isOrigin:false},
];

const REQUESTS_DATA = [
  {id:1,name:"Dara M.",location:"Wicker Park, Chicago",ask:"My car broke down near the blue line stop on Damen. I just need a jump start or a ride to the nearest auto shop.",category:"Transport",time:"23 mins ago",offers:1},
  {id:2,name:"Anonymous",location:"Downtown Portland",ask:"I'm a single mom and my kids just started school. Could really use help moving a couch and a few boxes this Saturday morning — maybe 2 hours.",category:"Moving",time:"1 hour ago",offers:3},
  {id:3,name:"Luis T.",location:"Astoria, Queens NY",ask:"Looking for someone who can sit with my elderly father for a couple hours on Thursday afternoon so I can make it to a job interview. He's great company.",category:"Companionship",time:"3 hours ago",offers:2},
  {id:4,name:"Priya W.",location:"Mission District, SF",ask:"I bake and I have way too much sourdough. Just need someone to come take a loaf or two off my hands before I eat it all myself.",category:"Food",time:"5 hours ago",offers:7},
  {id:5,name:"James R.",location:"East Nashville, TN",ask:"I'm learning to drive and too nervous to practice with my parents. If someone patient could sit shotgun for 30 minutes in an empty parking lot I'd be so grateful.",category:"Teaching",time:"8 hours ago",offers:0},
];

const CAT_COLORS = {Transport:"#4BBEF5",Moving:"#FF6B4A",Companionship:"#C084FC",Food:"#3ECFA0",Teaching:"#FFD44F",Financial:"#FF6B4A",Other:"#9A9AAA"};

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: HOME
// ═══════════════════════════════════════════════════════════════════════════════
const HOME_CSS = `
  .home-hero { min-height:100vh;background:var(--ink);display:flex;flex-direction:column;justify-content:center;padding:120px 48px 80px;position:relative;overflow:hidden; }
  .hh-bg { position:absolute;inset:0;background:radial-gradient(ellipse 60% 80% at -5% 20%,rgba(255,212,79,.22) 0%,transparent 55%),radial-gradient(ellipse 50% 60% at 105% 80%,rgba(62,207,160,.18) 0%,transparent 55%),radial-gradient(ellipse 40% 40% at 105% 5%,rgba(75,190,245,.14) 0%,transparent 50%);pointer-events:none; }
  .hh-inner { position:relative;max-width:780px; }
  .hh-eyebrow { display:flex;align-items:center;gap:10px;margin-bottom:28px;animation:fadeUp .6s ease both .1s; }
  .hh-dots { display:flex;gap:5px; }
  .hh-dot { width:8px;height:8px;border-radius:50%; }
  .hh-eyebrow-text { font-size:.72rem;text-transform:uppercase;letter-spacing:2.5px;color:rgba(255,255,255,.35); }
  .hh-h1 { font-family:'Fraunces',serif;font-size:clamp(3rem,8vw,6.8rem);font-weight:900;color:white;line-height:.92;letter-spacing:-2px;margin-bottom:28px;animation:fadeUp .6s ease both .2s; }
  .hh-h1 em { font-style:italic;color:var(--sun);display:block; }
  .hh-h1 .thin { font-weight:300;font-style:italic;color:rgba(255,255,255,.45);font-size:.75em;display:block;letter-spacing:-1px; }
  .hh-body { font-size:clamp(1rem,2vw,1.15rem);color:rgba(255,255,255,.55);max-width:500px;line-height:1.7;margin-bottom:44px;animation:fadeUp .6s ease both .3s; }
  .hh-ctas { display:flex;gap:14px;flex-wrap:wrap;animation:fadeUp .6s ease both .4s; }
  .hh-code-box { position:absolute;right:48px;bottom:80px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.12);border-radius:20px;padding:22px 26px;width:290px;backdrop-filter:blur(8px);animation:fadeUp .6s ease both .5s; }
  .hh-code-label { font-size:.66rem;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.3);margin-bottom:9px; }
  .hh-code-input { width:100%;padding:11px 14px;font-family:'DM Mono',monospace;font-size:.85rem;color:white;background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.15);border-radius:10px;outline:none;text-transform:uppercase;letter-spacing:.5px;margin-bottom:9px;transition:border-color .2s; }
  .hh-code-input:focus { border-color:var(--sun); }
  .hh-code-input::placeholder { color:rgba(255,255,255,.2);text-transform:none;font-weight:400;letter-spacing:0; }
  .hh-code-btn { width:100%;padding:11px;background:var(--sun);color:var(--ink);border:none;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:700;cursor:pointer;transition:opacity .2s; }
  .hh-code-btn:hover { opacity:.88; }
  .hh-code-hint { font-size:.65rem;color:rgba(255,255,255,.22);margin-top:7px;text-align:center;line-height:1.4; }
  .how-section { background:white;padding:88px 48px; }
  .how-inner { max-width:960px;margin:0 auto; }
  .how-hdr { margin-bottom:60px;max-width:480px; }
  .how-steps { display:grid;grid-template-columns:repeat(3,1fr);position:relative; }
  .how-steps::before { content:'';position:absolute;top:34px;left:calc(16.66% + 18px);right:calc(16.66% + 18px);height:2px;background:linear-gradient(90deg,var(--coral),var(--mint));z-index:0; }
  .how-step { text-align:center;padding:0 22px;position:relative;z-index:1; }
  .step-circle { width:68px;height:68px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:1.7rem;position:relative;z-index:2; }
  .step-num { position:absolute;top:-5px;right:-3px;width:20px;height:20px;border-radius:50%;background:var(--ink);color:white;font-size:.58rem;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid white; }
  .step-title { font-family:'Fraunces',serif;font-size:1.15rem;font-weight:700;color:var(--ink);margin-bottom:8px; }
  .step-body { font-size:.84rem;color:var(--muted);line-height:1.65; }
  .feed-preview-section { padding:88px 48px;background:var(--paper); }
  .fp-inner { max-width:1000px;margin:0 auto; }
  .fp-hdr { display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:36px;flex-wrap:wrap;gap:16px; }
  .live-pill { display:flex;align-items:center;gap:6px;font-size:.72rem;font-weight:700;color:var(--coral);text-transform:uppercase;letter-spacing:1px; }
  .live-dot { width:8px;height:8px;border-radius:50%;background:var(--coral);animation:livePulse 1.5s ease-in-out infinite; }
  .fp-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:18px; }
  .fp-card { background:white;border-radius:18px;padding:22px 24px;box-shadow:0 2px 14px rgba(26,26,46,.06);cursor:pointer;transition:transform .2s,box-shadow .2s;position:relative;overflow:hidden; }
  .fp-card:hover { transform:translateY(-4px);box-shadow:0 10px 28px rgba(26,26,46,.11); }
  .fp-card-top { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px; }
  .fp-author { font-weight:700;font-size:.88rem;color:var(--ink); }
  .fp-city { font-size:.72rem;color:var(--muted);margin-top:1px; }
  .fp-badge { font-size:.65rem;font-weight:700;padding:3px 9px;border-radius:20px;color:white;white-space:nowrap;flex-shrink:0; }
  .fp-excerpt { font-size:.85rem;line-height:1.58;color:#444;margin-bottom:12px; }
  .fp-code { font-family:'DM Mono',monospace;font-size:.65rem;color:var(--muted);letter-spacing:.5px; }
  .card-cta-section { background:var(--ink);padding:88px 48px;position:relative;overflow:hidden; }
  .card-cta-bg { position:absolute;inset:0;background:radial-gradient(ellipse 60% 80% at 0% 50%,rgba(255,212,79,.14) 0%,transparent 55%),radial-gradient(ellipse 50% 60% at 100% 50%,rgba(62,207,160,.11) 0%,transparent 55%);pointer-events:none; }
  .card-cta-inner { max-width:960px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center;position:relative; }
  .card-mockup { aspect-ratio:1.75;border-radius:18px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);padding:20px 22px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;max-width:320px; }
  .card-mockup::before { content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 80% at -20% -20%,rgba(255,212,79,.2) 0%,transparent 55%),radial-gradient(ellipse 60% 60% at 120% 120%,rgba(62,207,160,.15) 0%,transparent 55%); }
  .mock-brand { font-family:'Fraunces',serif;font-size:.95rem;font-weight:900;color:white;position:relative; }
  .mock-brand em { font-style:italic;color:var(--sun); }
  .mock-tag { font-size:.5rem;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,.28);margin-top:2px; }
  .mock-dots { display:flex;gap:4px;margin-top:5px; }
  .mock-dot { width:6px;height:6px;border-radius:50%; }
  .mock-bottom { display:flex;justify-content:space-between;align-items:flex-end;position:relative; }
  .mock-code-label { font-size:.44rem;color:rgba(255,255,255,.28);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px; }
  .mock-code-val { font-family:'DM Mono',monospace;font-size:.58rem;color:var(--sun);letter-spacing:.5px; }
  .mock-url { font-size:.48rem;color:rgba(255,255,255,.22); }
  .stats-section { background:white;padding:88px 48px; }
  .stats-inner { max-width:880px;margin:0 auto;text-align:center; }
  .stats-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:28px;margin-top:52px; }
  .stat-box { padding:26px 14px;border-radius:18px;text-align:center; }
  .stat-box-num { font-family:'Fraunces',serif;font-size:2.6rem;font-weight:900;line-height:1;margin-bottom:6px;display:block; }
  .stat-box-label { font-size:.78rem;color:var(--muted);line-height:1.4; }
  .site-footer { background:var(--ink);padding:44px 48px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px; }
  .footer-brand { font-family:'Fraunces',serif;font-size:1.05rem;font-weight:900;color:white; }
  .footer-brand em { font-style:italic;color:var(--sun); }
  .footer-tagline { font-size:.76rem;color:rgba(255,255,255,.3);margin-top:3px; }
  .footer-links { display:flex;gap:20px;flex-wrap:wrap; }
  .footer-link { font-size:.8rem;color:rgba(255,255,255,.38);background:none;border:none;cursor:pointer;transition:color .2s;font-family:'DM Sans',sans-serif; }
  .footer-link:hover { color:white; }
  .footer-copy { font-size:.7rem;color:rgba(255,255,255,.18);width:100%;text-align:center;border-top:1px solid rgba(255,255,255,.06);padding-top:20px; }
  @media(max-width:900px){ .hh-code-box{position:relative;right:auto;bottom:auto;width:100%;max-width:320px;margin-top:36px;} .home-hero{padding:110px 24px 70px;} .card-cta-inner{grid-template-columns:1fr;gap:36px;} .how-steps{grid-template-columns:1fr;gap:36px;} .how-steps::before{display:none;} .fp-grid{grid-template-columns:1fr;} .stats-grid{grid-template-columns:repeat(2,1fr);} .how-section,.feed-preview-section,.card-cta-section,.stats-section{padding:64px 24px;} .site-footer{padding:36px 24px;flex-direction:column;align-items:flex-start;} }
`;

function HomePage({ go }) {
  const [code, setCode] = useState("");
  return (
    <>
      <style>{HOME_CSS}</style>
      <section className="home-hero">
        <div className="hh-bg"/>
        <div className="hh-inner">
          <div className="hh-eyebrow">
            <div className="hh-dots">
              {["#FF6B4A","#FFD44F","#3ECFA0","#4BBEF5"].map((c,i)=><span key={i} className="hh-dot" style={{background:c}}/>)}
            </div>
            <span className="hh-eyebrow-text">Proof that good spreads</span>
          </div>
          <img src="/logo.png" alt="Chain of Gratuity" style={{width:110,height:110,objectFit:"contain",marginBottom:24,animation:"fadeUp .6s ease both .1s",display:"block"}}/>
          <h1 className="hh-h1">Someone<br/><em>was kind</em><span className="thin">to you.</span></h1>
          <p className="hh-body">Chain of Gratuity turns a single act of kindness into a living, growing story — passed from stranger to stranger, city to city, one good deed at a time.</p>
          <div className="hh-ctas">
            <button className="btn-primary" onClick={()=>go("add")}>Add my story →</button>
            <button className="btn-ghost" onClick={()=>go("feed")}>See live chains</button>
          </div>
        </div>
        <div className="hh-code-box">
          <div className="hh-code-label">Got a card? Find your chain</div>
          <input className="hh-code-input" placeholder="GOLDEN-SPARK-4821" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={24}/>
          <button className="hh-code-btn" onClick={()=>go("chain")}>Find my chain →</button>
          <p className="hh-code-hint">Enter the code printed on your card</p>
        </div>
      </section>
      <ColorBar/>
      <section className="how-section">
        <div className="how-inner">
          <div className="how-hdr">
            <p className="sec-label">How it works</p>
            <h2 className="sec-title">Three steps.<br/><em>Infinite kindness.</em></h2>
          </div>
          <div className="how-steps">
            {[{e:"🤝",bg:"rgba(255,107,74,.1)",t:"Receive a good deed",b:"Someone does something kind and hands you a Chain of Gratuity card with a unique code."},
              {e:"✍️",bg:"rgba(255,212,79,.1)",t:"Share your story",b:"Scan the QR code, enter your chain code, and add your story to the living chain."},
              {e:"🔗",bg:"rgba(62,207,160,.1)",t:"Pass it on",b:"Do something kind for someone else. Hand them your card. Watch the chain grow."}
            ].map((s,i)=>(
              <div className="how-step" key={i}>
                <div className="step-circle" style={{background:s.bg}}><span>{s.e}</span><div className="step-num">{i+1}</div></div>
                <div className="step-title">{s.t}</div>
                <p className="step-body">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="feed-preview-section">
        <div className="fp-inner">
          <div className="fp-hdr">
            <div><p className="sec-label"><span className="live-pill"><span className="live-dot"/>Live</span></p><h2 className="sec-title">Chains happening<br/><em>right now.</em></h2></div>
            <button className="btn-text-link" onClick={()=>go("feed")}>See all chains →</button>
          </div>
          <div className="fp-grid">
            {FEED_DATA.slice(0,4).map(c=>(
              <div key={c.id} className="fp-card" onClick={()=>go("chain")}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:c.color,borderRadius:"18px 18px 0 0"}}/>
                <div className="fp-card-top">
                  <div><div className="fp-author">{c.author}</div><div className="fp-city">📍 {c.city}</div></div>
                  <div className="fp-badge" style={{background:c.color}}>🔗 {c.links} links</div>
                </div>
                <p className="fp-excerpt">"{c.excerpt}"</p>
                <div className="fp-code">{c.code}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="card-cta-section">
        <div className="card-cta-bg"/>
        <div className="card-cta-inner">
          <div>
            <p className="sec-label" style={{color:"rgba(255,255,255,.3)"}}>The card</p>
            <h2 className="sec-title" style={{color:"white"}}>The physical link<br/><em>between strangers.</em></h2>
            <p style={{fontSize:"1rem",color:"rgba(255,255,255,.5)",lineHeight:1.7,margin:"18px 0 28px",maxWidth:400}}>Every chain starts with a card. Carry one in your wallet. When kindness finds you, pass it on.</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button className="btn-sun" onClick={()=>go("shop")}>Get your cards →</button>
              <button className="btn-ghost" onClick={()=>go("shop")}>See the digital pass</button>
            </div>
          </div>
          <div className="card-mockup">
            <div style={{display:"flex",alignItems:"center",gap:8,position:"relative"}}>
              <img src="/logo.png" alt="CoG" style={{width:32,height:32,objectFit:"contain",flexShrink:0}}/>
              <div><div className="mock-brand">Chain of <em>Gratuity</em></div><div className="mock-tag">Proof that good spreads</div></div>
            </div>
            <div className="mock-bottom"><div><div className="mock-code-label">Chain Code</div><div className="mock-code-val">GOLDEN-SPARK-4821</div></div><div className="mock-url">chainofgratuity.com</div></div>
          </div>
        </div>
      </section>
      <section className="stats-section">
        <div className="stats-inner">
          <p className="sec-label" style={{justifyContent:"center"}}>The impact so far</p>
          <h2 className="sec-title" style={{textAlign:"center"}}>Good is <em>spreading.</em></h2>
          <div className="stats-grid">
            {[{n:"1,284",l:"Good deeds shared",c:"#FF6B4A",bg:"rgba(255,107,74,.07)"},{n:"347",l:"Active chains",c:"#FFD44F",bg:"rgba(255,212,79,.1)"},{n:"28",l:"Cities touched",c:"#3ECFA0",bg:"rgba(62,207,160,.08)"},{n:"9",l:"Longest chain",c:"#4BBEF5",bg:"rgba(75,190,245,.08)"}].map((s,i)=>(
              <div key={i} className="stat-box" style={{background:s.bg}}><span className="stat-box-num" style={{color:s.c}}>{s.n}</span><div className="stat-box-label">{s.l}</div></div>
            ))}
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src="/logo.png" alt="CoG" style={{width:36,height:36,objectFit:"contain",flexShrink:0}}/>
          <div><div className="footer-brand">Chain of <em>Gratuity</em></div><div className="footer-tagline">Proof that good spreads.</div></div>
        </div>
        <div className="footer-links">{["Home","Live Feed","Add My Story","Ask for Help","Shop"].map(l=><button key={l} className="footer-link" onClick={()=>go(l.toLowerCase().replace(/ /g,"-"))}>{l}</button>)}</div>
        <div className="footer-copy">© 2025 Chain of Gratuity. Made with kindness.</div>
      </footer>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: LIVE FEED
// ═══════════════════════════════════════════════════════════════════════════════
function FeedPage({ go }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [showToast, Toast] = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await dbQuery("/chain_posts?select=*&order=created_at.desc&limit=50");
      setPosts(data && data.length > 0 ? data : FEED_DATA);
    } catch {
      setPosts(FEED_DATA);
    }
    setLoading(false);
  };

  const handlePost = async (data) => {
    try {
      await dbQuery("/chain_posts", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await fetchPosts();
    } catch {
      setPosts(p => [{ id: Date.now(), ...data, created_at: new Date().toISOString() }, ...p]);
    }
    setComposing(false);
    showToast("Good deed posted! ✨");
  };

  return (
    <>
      <style>{`
        .feed-page { padding-top:72px;min-height:100vh; }
        .feed-hero { background:var(--ink);padding:56px 48px 64px;position:relative;overflow:hidden; }
        .feed-hero-bg { position:absolute;inset:0;background:radial-gradient(ellipse 60% 80% at 100% 0%,rgba(255,212,79,.2) 0%,transparent 55%),radial-gradient(ellipse 50% 60% at 0% 100%,rgba(62,207,160,.15) 0%,transparent 55%);pointer-events:none; }
        .feed-hero-inner { max-width:600px;position:relative; }
        .feed-main { max-width:680px;margin:0 auto;padding:48px 24px 80px; }
        .feed-top-row { display:flex;justify-content:space-between;align-items:center;margin-bottom:28px; }
        .post-card { background:white;border-radius:20px;padding:26px;margin-bottom:18px;box-shadow:0 2px 12px rgba(26,26,46,.06);border:2px solid transparent;transition:transform .2s,box-shadow .2s;animation:fadeUp .4s ease both;position:relative;overflow:hidden; }
        .post-card:hover { transform:translateY(-3px);box-shadow:0 8px 26px rgba(26,26,46,.11); }
        .post-header { display:flex;align-items:center;gap:12px;margin-bottom:14px; }
        .avatar { width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-weight:700;font-size:.95rem;color:white;flex-shrink:0; }
        .post-author { font-weight:700;font-size:.92rem;color:var(--ink); }
        .post-time { font-size:.75rem;color:var(--muted);margin-top:1px; }
        .chain-badge { font-size:.68rem;font-weight:700;padding:3px 9px;border-radius:20px;background:rgba(62,207,160,.12);color:var(--mint); }
        .post-excerpt { font-size:.95rem;line-height:1.68;color:#333; }
        .post-footer { display:flex;align-items:center;justify-content:space-between;margin-top:14px;flex-wrap:wrap;gap:8px; }
        .post-code { font-family:'DM Mono',monospace;font-size:.68rem;color:var(--muted);letter-spacing:.5px; }
        .fab { position:fixed;bottom:30px;right:30px;width:62px;height:62px;border-radius:50%;background:linear-gradient(135deg,var(--coral),var(--sun));border:none;cursor:pointer;font-size:1.7rem;color:white;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 22px rgba(255,107,74,.4);transition:transform .2s,box-shadow .2s;z-index:100; }
        .fab:hover { transform:scale(1.1) rotate(10deg);box-shadow:0 10px 30px rgba(255,107,74,.5); }
        .compose-overlay { position:fixed;inset:0;background:rgba(26,26,46,.6);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .2s ease; }
        .compose-modal { background:white;border-radius:24px;padding:34px;width:100%;max-width:500px;animation:popIn .25s ease; }
        @media(max-width:600px){ .feed-hero{padding:48px 24px 52px;} }
      `}</style>
      <div className="feed-page">
        <div className="feed-hero">
          <div className="feed-hero-bg"/>
          <div className="feed-hero-inner">
            <p className="sec-label" style={{color:"rgba(255,255,255,.3)",marginBottom:12}}><span className="live-pill"><span className="live-dot"/>Live right now</span></p>
            <h1 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(2rem,5vw,3.2rem)",fontWeight:900,color:"white",lineHeight:1,letterSpacing:-1,marginBottom:12}}>Every chain,<br/><em style={{fontStyle:"italic",color:"var(--sun)"}}>unfolding.</em></h1>
            <p style={{fontSize:"1rem",color:"rgba(255,255,255,.5)",lineHeight:1.65,maxWidth:460}}>Every story here started with one act of kindness. Tap any chain to see where it began and where it's going.</p>
          </div>
        </div>
        <ColorBar/>
        <div className="feed-main">
          <div className="feed-top-row">
            <h2 style={{fontFamily:"'Fraunces',serif",fontSize:"1.5rem",fontWeight:700}}>Live Feed</h2>
            <span className="live-pill"><span className="live-dot"/>Live</span>
          </div>
          {posts.map((p,i) => {
            const color = p.color || colorFor(i);
            const initials = p.author.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
            return (
              <div key={p.id} className="post-card" style={{animationDelay:`${i*.07}s`}} onClick={()=>go("chain")}>
                <div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:color,borderRadius:"4px 0 0 4px"}}/>
                <div className="post-header">
                  <div className="avatar" style={{background:color}}>{initials}</div>
                  <div style={{flex:1}}><div className="post-author">{p.author}</div><div className="post-time">📍 {p.city} · {timeAgo(p.created_at)}</div></div>
                  {p.links > 1 && <span className="chain-badge">🔗 {p.links} links</span>}
                </div>
                <p className="post-excerpt">"{p.excerpt}"</p>
                <div className="post-footer">
                  <span className="post-code">{p.code}</span>
                  <button className="btn-sm" onClick={e=>{e.stopPropagation();go("chain");}}>View chain →</button>
                </div>
              </div>
            );
          })}
        </div>
        <button className="fab" onClick={()=>setComposing(true)}>+</button>
        {composing && (
          <div className="compose-overlay" onClick={e=>e.target===e.currentTarget&&setComposing(false)}>
            <div className="compose-modal">
              <h2 style={{fontFamily:"'Fraunces',serif",fontSize:"1.6rem",fontWeight:900,marginBottom:6}}>Share a good deed ✨</h2>
              <p style={{fontSize:".88rem",color:"var(--muted)",marginBottom:24,lineHeight:1.5}}>Tell us about the kindness that came your way.</p>
              <ComposeForm onSubmit={handlePost} onCancel={()=>setComposing(false)} accentColor="var(--coral)"/>
            </div>
          </div>
        )}
        {Toast}
      </div>
    </>
  );
}

function ComposeForm({ onSubmit, onCancel, accentColor }) {
  const [author, setAuthor] = useState("");
  const [story, setStory]   = useState("");
  const [city, setCity]     = useState("");
  const can = author.trim() && story.trim().length >= 10 && city.trim();
  return (
    <div>
      <div className="field-group">
        <label className="field-lbl">Your Name</label>
        <input className="field-input" placeholder="How you want to appear" value={author} onChange={e=>setAuthor(e.target.value)} style={{"--ac":accentColor}}/>
      </div>
      <div className="field-group">
        <label className="field-lbl">City</label>
        <input className="field-input" placeholder="Where did this happen?" value={city} onChange={e=>setCity(e.target.value)} style={{"--ac":accentColor}}/>
      </div>
      <div className="field-group">
        <label className="field-lbl">The deed</label>
        <textarea className="field-ta" placeholder="What act of kindness brought you here?" value={story} onChange={e=>setStory(e.target.value)} style={{"--ac":accentColor}}/>
      </div>
      <div style={{display:"flex",gap:10,marginTop:24}}>
        <button className="btn-cancel-sm" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" style={{flex:2,background:accentColor,border:"none"}} disabled={!can} onClick={()=>onSubmit({author,excerpt:story.slice(0,80)+"…",city,color:accentColor,code:genCode()})}>Post →</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: CHAIN (with map)
// ═══════════════════════════════════════════════════════════════════════════════

function haversine(lat1,lng1,lat2,lng2){const R=3958.8,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180,a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function totalDist(links){let d=0;for(let i=1;i<links.length;i++)d+=haversine(links[i-1].lat,links[i-1].lng,links[i].lat,links[i].lng);return Math.round(d);}

function ChainMap({ links }) {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const init = (LL) => {
      try {
        if (!mapRef.current || mapObj.current) return;
        const lats = links.map(l=>l.lat), lngs = links.map(l=>l.lng);
        const map = LL.map(mapRef.current, { center:[(Math.min(...lats)+Math.max(...lats))/2,(Math.min(...lngs)+Math.max(...lngs))/2], zoom:10, zoomControl:true, scrollWheelZoom:false });
        mapObj.current = map;
        LL.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{attribution:'© CARTO',subdomains:"abcd",maxZoom:19}).addTo(map);
        LL.polyline(links.map(l=>[l.lat,l.lng]),{color:"rgba(26,26,46,0.22)",weight:2,dashArray:"6 8",lineCap:"round"}).addTo(map);
        links.forEach((link,i) => {
          const color = ACCENTS[i%ACCENTS.length];
          const icon = LL.divIcon({ className:"", html:`<div style="width:34px;height:34px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;font-family:sans-serif;">${i+1}</div>`, iconSize:[34,34], iconAnchor:[17,17], popupAnchor:[0,-20] });
          LL.marker([link.lat,link.lng],{icon}).addTo(map).bindPopup(`<div style="padding:14px;min-width:190px;font-family:sans-serif;">${link.isOrigin?'<div style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#FF6B4A;background:rgba(255,107,74,.1);border-radius:20px;padding:2px 8px;display:inline-block;margin-bottom:6px;">✦ Origin</div><br/>':""}<div style="font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:white;background:${color};padding:2px 8px;border-radius:20px;display:inline-block;margin-bottom:6px;">Link #${i+1}</div><div style="font-family:serif;font-size:.95rem;font-weight:700;color:#1A1A2E;margin-bottom:3px;">${link.name}</div><div style="font-size:.7rem;color:#9A9AAA;margin-bottom:6px;">📍 ${link.location} · ${link.date}</div><div style="font-size:.78rem;color:#444;line-height:1.5;border-top:1px solid #EAE6DE;padding-top:7px;">"${link.story.slice(0,90)}…"</div></div>`,{maxWidth:240});
        });
        map.fitBounds(links.map(l=>[l.lat,l.lng]),{padding:[40,40]});
      } catch(e) { setMapError(true); }
    };
    try {
      if (window.L) { init(window.L); return; }
      const link = document.createElement("link"); link.rel="stylesheet"; link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
      const script = document.createElement("script"); script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload=()=>init(window.L);
      script.onerror=()=>setMapError(true);
      document.head.appendChild(script);
    } catch(e) { setMapError(true); }
    return () => { if(mapObj.current){try{mapObj.current.remove();}catch(e){} mapObj.current=null;} };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (mapError) return (
    <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,background:"#F7F5F0"}}>
      <span style={{fontSize:"2rem"}}>🗺️</span>
      <p style={{fontSize:".88rem",color:"var(--muted)",textAlign:"center",lineHeight:1.5}}>Map loads when the site is live.<br/>All chain locations are listed below.</p>
    </div>
  );

  return <div ref={mapRef} style={{width:"100%",height:"100%"}}/>;
}

function ChainPage({ go }) {
  const [expanded, setExpanded] = useState({});
  const distance = totalDist(CHAIN_LINKS);
  const cities   = [...new Set(CHAIN_LINKS.filter(l=>l.location).map(l=>l.location.split(",")[0]))];

  return (
    <>
      <style>{`
        .chain-page { padding-top:0;min-height:100vh; }
        .chain-hero { background:var(--ink);padding:100px 24px 64px;text-align:center;position:relative;overflow:hidden; }
        .chain-hero-bg { position:absolute;inset:0;background:radial-gradient(ellipse 70% 80% at 10% 0%,rgba(255,212,79,.2) 0%,transparent 55%),radial-gradient(ellipse 60% 60% at 90% 100%,rgba(62,207,160,.17) 0%,transparent 55%);pointer-events:none; }
        .chain-code-pill { display:inline-block;font-family:'DM Mono',monospace;font-size:clamp(.9rem,2.5vw,1.2rem);font-weight:500;color:var(--sun);background:rgba(255,212,79,.1);border:1px solid rgba(255,212,79,.25);border-radius:8px;padding:6px 18px;margin-bottom:18px;letter-spacing:1px;position:relative; }
        .chain-stats-bar { display:flex;justify-content:center;gap:0;flex-wrap:wrap;position:relative;margin-top:32px; }
        .chain-stat { padding:0 22px;text-align:center;border-right:1px solid rgba(255,255,255,.1); }
        .chain-stat:last-child { border-right:none; }
        .chain-stat-num { font-family:'Fraunces',serif;font-size:1.9rem;font-weight:900;color:white;display:block;line-height:1;margin-bottom:3px; }
        .chain-stat-lbl { font-size:.62rem;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,.32); }
        .map-section { background:white;padding:56px 24px;position:relative;overflow:hidden; }
        .map-section::before { content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--coral),var(--sun),var(--mint),var(--sky)); }
        .map-inner { max-width:840px;margin:0 auto; }
        .map-container { border-radius:20px;overflow:hidden;border:2px solid var(--border);box-shadow:0 4px 24px rgba(26,26,46,.1);height:360px;background:#e8e0d5; }
        .leaflet-popup-content-wrapper { border-radius:14px!important;box-shadow:0 8px 24px rgba(0,0,0,.15)!important;padding:0!important;overflow:hidden; }
        .leaflet-popup-content { margin:0!important; }
        .leaflet-popup-tip { background:white!important; }
        .map-legend { display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;padding:13px 16px;background:var(--paper);border-radius:13px;border:1.5px solid var(--border); }
        .legend-item { display:flex;align-items:center;gap:7px;font-size:.76rem;color:var(--ink);font-weight:500; }
        .legend-dot { width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.58rem;font-weight:700;color:white;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,.18); }
        .legend-loc { font-size:.66rem;color:var(--muted);font-weight:400; }
        .map-stats { display:flex;gap:0;margin-top:14px;background:var(--ink);border-radius:13px;overflow:hidden;flex-wrap:wrap; }
        .map-stat { flex:1;min-width:110px;padding:14px 16px;border-right:1px solid rgba(255,255,255,.08);text-align:center; }
        .map-stat:last-child { border-right:none; }
        .map-stat-num { font-family:'Fraunces',serif;font-size:1.35rem;font-weight:900;color:white;display:block;line-height:1;margin-bottom:2px; }
        .map-stat-lbl { font-size:.58rem;text-transform:uppercase;letter-spacing:1.2px;color:rgba(255,255,255,.32); }
        .tl-section { max-width:700px;margin:0 auto;padding:60px 24px 90px; }
        .tl-intro { text-align:center;margin-bottom:52px; }
        .timeline { position:relative; }
        .timeline::before { content:'';position:absolute;left:27px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,#FF6B4A,#FFD44F,#3ECFA0,#4BBEF5,rgba(200,200,200,.2)); }
        .tl-item { display:flex;gap:22px;animation:slideIn .5s ease both; }
        .tl-item:nth-child(1){animation-delay:.05s}.tl-item:nth-child(2){animation-delay:.15s}.tl-item:nth-child(3){animation-delay:.25s}.tl-item:nth-child(4){animation-delay:.35s}.tl-item:nth-child(5){animation-delay:.45s}.tl-item:nth-child(6){animation-delay:.55s}
        .tl-node-col { display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:56px; }
        .tl-node { width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:1rem;font-weight:900;color:white;position:relative;z-index:2;box-shadow:0 4px 14px rgba(0,0,0,.15);transition:transform .2s; }
        .tl-node:hover { transform:scale(1.08); }
        .tl-node.origin { width:62px;height:62px;font-size:1.15rem; }
        .tl-connector { width:2px;flex:1;min-height:20px;margin:4px 0; }
        .tl-card-wrap { flex:1;padding-bottom:36px; }
        .tl-card { background:white;border-radius:18px;padding:24px;box-shadow:0 2px 14px rgba(26,26,46,.07);position:relative;overflow:hidden;transition:transform .2s,box-shadow .2s; }
        .tl-card:hover { transform:translateY(-2px);box-shadow:0 8px 26px rgba(26,26,46,.11); }
        .origin-badge { display:inline-flex;align-items:center;gap:5px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--coral);background:rgba(255,107,74,.1);border-radius:20px;padding:3px 10px;margin-bottom:10px; }
        .tl-author { font-weight:700;font-size:.9rem;color:var(--ink); }
        .tl-meta { font-size:.72rem;color:var(--muted);margin-top:2px;margin-bottom:12px; }
        .tl-story { font-size:.92rem;line-height:1.7;color:#333; }
        .tl-link-num { font-family:'DM Mono',monospace;font-size:.68rem;font-weight:500;padding:2px 9px;border-radius:20px;color:white;position:absolute;top:16px;right:16px; }
        .read-more-btn { background:none;border:none;color:var(--coral);font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;cursor:pointer;padding:0;margin-top:6px;display:block; }
        .tl-cta { border:2.5px dashed var(--border);background:linear-gradient(135deg,rgba(255,107,74,.03),rgba(255,212,79,.03));box-shadow:none;text-align:center;padding:28px 22px; }
        .tl-cta:hover { border-color:var(--coral); }
        .share-strip { background:var(--ink);padding:36px 24px;text-align:center;position:relative;overflow:hidden; }
        .share-strip-bg { position:absolute;inset:0;background:radial-gradient(ellipse 80% 100% at 50% 0%,rgba(255,212,79,.1) 0%,transparent 60%);pointer-events:none; }
        .share-btns { display:flex;justify-content:center;gap:10px;flex-wrap:wrap;position:relative;margin-top:16px; }
        .btn-share { padding:9px 20px;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;cursor:pointer;border:2px solid rgba(255,255,255,.18);background:transparent;color:white;transition:background .2s;display:flex;align-items:center;gap:6px; }
        .btn-share:hover { background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.35); }
        @media(max-width:560px){ .map-container{height:260px;} .chain-stat{padding:0 14px;} }
      `}</style>
      <div className="chain-page">
        <div className="chain-hero">
          <div className="chain-hero-bg"/>
          <p style={{fontSize:".7rem",textTransform:"uppercase",letterSpacing:"2.5px",color:"rgba(255,255,255,.3)",marginBottom:14,position:"relative"}}>You're part of something bigger</p>
          <div className="chain-code-pill">GOLDEN-SPARK-4821</div>
          <h1 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(2rem,5vw,3.8rem)",fontWeight:900,color:"white",lineHeight:1,letterSpacing:-1.5,marginBottom:14,position:"relative"}}>A chain of<br/><em style={{fontStyle:"italic",color:"var(--sun)"}}>goodness</em></h1>
          <p style={{fontSize:"1rem",color:"rgba(255,255,255,.48)",maxWidth:440,margin:"0 auto",lineHeight:1.65,position:"relative"}}>This chain started on March 2, 2025 with one small act of kindness. Here's every story — and every place — it has touched.</p>
          <div className="chain-stats-bar">
            {[{n:CHAIN_LINKS.length,l:"Links in chain"},{n:55,l:"Days old"},{n:cities.length,l:"Cities touched"},{n:`${distance}mi`,l:"Distance traveled"}].map((s,i)=>(
              <div key={i} className="chain-stat"><span className="chain-stat-num">{s.n}</span><span className="chain-stat-lbl">{s.l}</span></div>
            ))}
          </div>
        </div>
        <ColorBar/>

        {/* MAP */}
        <section className="map-section">
          <div className="map-inner">
            <div style={{marginBottom:22}}>
              <p style={{fontSize:".7rem",textTransform:"uppercase",letterSpacing:"2px",color:"var(--muted)",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>The journey <span style={{flex:1,height:1,background:"var(--border)",maxWidth:50,display:"inline-block"}}/></p>
              <h2 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(1.4rem,3vw,2rem)",fontWeight:900,color:"var(--ink)",lineHeight:1.1,marginBottom:7}}>See where this chain<br/><em style={{fontStyle:"italic",color:"var(--coral)"}}>has traveled.</em></h2>
              <p style={{fontSize:".86rem",color:"var(--muted)",lineHeight:1.55}}>Each pin is a person, a moment, an act of kindness. Tap any pin to read their story.</p>
            </div>
            <div className="map-container"><ChainMap links={CHAIN_LINKS}/></div>
            <div className="map-legend">
              {CHAIN_LINKS.map((link,i)=>(
                <div key={link.id} className="legend-item">
                  <div className="legend-dot" style={{background:colorFor(i)}}>{i+1}</div>
                  <div><div>{link.name}</div><div className="legend-loc">{link.location}</div></div>
                </div>
              ))}
            </div>
            <div className="map-stats">
              {[{n:`${distance} mi`,l:"Total distance"},{n:cities.length,l:"Cities touched"},{n:"44 days",l:"Duration"},{n:"Bay Area",l:"Region"}].map((s,i)=>(
                <div key={i} className="map-stat"><span className="map-stat-num">{s.n}</span><span className="map-stat-lbl">{s.l}</span></div>
              ))}
            </div>
          </div>
        </section>

        <section className="tl-section">
          <div className="tl-intro">
            <p className="sec-label">The full chain</p>
            <h2 className="sec-title">Every act of kindness,<br/><em>in the order it happened</em></h2>
          </div>
          <div className="timeline">
            {CHAIN_LINKS.map((link,i) => {
              const color = colorFor(i);
              const initials = link.name==="Anonymous"?"?":link.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
              const isLong = link.story.length > 220;
              const exp = expanded[link.id];
              return (
                <div key={link.id} className="tl-item">
                  <div className="tl-node-col">
                    <div className={`tl-node${link.isOrigin?" origin":""}`} style={{background:color}}>{initials}</div>
                    <div className="tl-connector" style={{background:`linear-gradient(to bottom,${color},${colorFor(i+1)})`}}/>
                  </div>
                  <div className="tl-card-wrap">
                    <div className="tl-card">
                      <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:color,borderRadius:"18px 18px 0 0"}}/>
                      <div className="tl-link-num" style={{background:color}}>#{i+1}</div>
                      {link.isOrigin && <div className="origin-badge">✦ Origin of this chain</div>}
                      <div className="tl-author">{link.name}</div>
                      <div className="tl-meta">{link.location&&`📍 ${link.location} · `}{link.date}</div>
                      <p className="tl-story">{isLong&&!exp?link.story.slice(0,220)+"…":link.story}</p>
                      {isLong&&<button className="read-more-btn" onClick={()=>setExpanded(e=>({...e,[link.id]:!e[link.id]}))}>{exp?"Show less ↑":"Read full story ↓"}</button>}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* CTA */}
            <div className="tl-item">
              <div className="tl-node-col">
                <div style={{width:56,height:56,borderRadius:"50%",border:"2.5px dashed #CCC",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",color:"#CCC",flexShrink:0,zIndex:2}}>+</div>
              </div>
              <div className="tl-card-wrap">
                <div className="tl-card tl-cta">
                  <span style={{fontSize:"1.8rem",display:"block",marginBottom:10}}>🔗</span>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.25rem",fontWeight:900,color:"var(--ink)",marginBottom:8}}>You're <em style={{fontStyle:"italic",color:"var(--coral)"}}>next</em> in this chain.</div>
                  <p style={{fontSize:".85rem",color:"var(--muted)",lineHeight:1.6,marginBottom:20,maxWidth:340,margin:"0 auto 20px"}}>Someone was kind enough to give you this card. Share what they did — and add your link.</p>
                  <button className="btn-primary" onClick={()=>go("add")}>Add my story to the chain →</button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="share-strip">
          <div className="share-strip-bg"/>
          <h3 style={{fontFamily:"'Fraunces',serif",fontSize:"1.35rem",fontWeight:700,color:"white",marginBottom:6,position:"relative"}}>Help this chain <em style={{fontStyle:"italic",color:"var(--sun)"}}>keep going.</em></h3>
          <p style={{fontSize:".82rem",color:"rgba(255,255,255,.4)",marginBottom:20,position:"relative"}}>Share it with someone who needs a little proof that good spreads.</p>
          <div className="share-btns">
            <button className="btn-share">🔗 Copy chain link</button>
            <button className="btn-share">✉️ Share via text</button>
            <button className="btn-share">↗ Share on Instagram</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: ADD TO CHAIN
// ═══════════════════════════════════════════════════════════════════════════════
function AddPage({ go }) {
  const [code, setCode]     = useState("");
  const [name, setName]     = useState("");
  const [story, setStory]   = useState("");
  const [photo, setPhoto]   = useState(null);
  const [drag, setDrag]     = useState(false);
  const [done, setDone]     = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const MAX = 600;
  const codeClean = code.trim().toUpperCase();
  const codeValid = /^[A-Z]+-[A-Z]+-\d{4}$/.test(codeClean);
  const canSubmit = codeValid && story.trim().length >= 10 && story.length <= MAX;

  const handlePhoto = useCallback(file => {
    if(!file||!file.type.startsWith("image/")) return;
    const r = new FileReader(); r.onload=e=>setPhoto(e.target.result); r.readAsDataURL(file);
  },[]);

  const handleSubmit = async () => {
    if(!canSubmit) return;
    setLoading(true);
    try {
      await dbQuery("/chain_links", {
        method: "POST",
        body: JSON.stringify({
          code: codeClean,
          name: name || "Anonymous",
          story,
          location: null,
        }),
      });
    } catch(e) {
      console.log("Save failed, continuing anyway");
    }
    setLoading(false);
    setDone(true);
  };

  return (
    <>
      <style>{`
        .add-page { min-height:100vh;display:grid;grid-template-columns:1fr 1fr;padding-top:0; }
        .add-left { background:var(--ink);position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:88px 44px 48px; }
        .add-left-bg { position:absolute;inset:0;background:radial-gradient(ellipse 90% 70% at -10% -10%,rgba(255,212,79,.26) 0%,transparent 55%),radial-gradient(ellipse 70% 70% at 110% 110%,rgba(62,207,160,.2) 0%,transparent 55%);pointer-events:none; }
        .add-right { background:var(--paper);padding:88px 44px 48px;overflow-y:auto;display:flex;flex-direction:column;justify-content:center; }
        .add-chain-vis { display:flex;align-items:center;gap:0;margin-bottom:20px; }
        .add-node { width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:.85rem;font-weight:900;color:white;flex-shrink:0; }
        .add-connector { height:2px;width:18px;background:rgba(255,255,255,.15);flex-shrink:0; }
        .add-node-new { width:34px;height:34px;border-radius:50%;border:2px dashed rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;font-size:.9rem;color:rgba(255,255,255,.28);flex-shrink:0; }
        .code-input { width:100%;padding:13px 16px;font-family:'DM Mono',monospace;font-size:.95rem;font-weight:500;letter-spacing:1px;color:var(--ink);background:white;border:2px solid var(--border);border-radius:13px;outline:none;transition:border-color .2s,box-shadow .2s;text-transform:uppercase; }
        .code-input::placeholder { color:#CCC;font-weight:400;text-transform:none;letter-spacing:0; }
        .code-input:focus { border-color:var(--coral);box-shadow:0 0 0 4px rgba(255,107,74,.1); }
        .code-input.valid { border-color:var(--mint);box-shadow:0 0 0 4px rgba(62,207,160,.1); }
        .code-wrap { position:relative; }
        .code-icon { position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:1rem;pointer-events:none; }
        .photo-drop { border:2px dashed var(--border);border-radius:15px;background:white;padding:28px 20px;text-align:center;cursor:pointer;transition:border-color .2s,background .2s;position:relative; }
        .photo-drop:hover,.photo-drop.drag-over { border-color:var(--coral);background:rgba(255,107,74,.03); }
        .photo-preview { width:100%;max-height:200px;object-fit:cover;display:block;border-radius:13px; }
        .photo-preview-wrap { position:relative;border-radius:14px;overflow:hidden; }
        .photo-rm { position:absolute;top:9px;right:9px;width:28px;height:28px;border-radius:50%;background:rgba(26,26,46,.7);color:white;border:none;cursor:pointer;font-size:.85rem;display:flex;align-items:center;justify-content:center; }
        .photo-rm:hover { background:var(--coral); }
        .success-panel { display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 20px;animation:pageIn .5s ease both; }
        .success-icon { font-size:3.5rem;margin-bottom:20px;animation:bounce .5s cubic-bezier(.34,1.56,.64,1) both .2s; }
        @media(max-width:780px){ .add-page{grid-template-columns:1fr;} .add-left{min-height:260px;padding:80px 24px 36px;} .add-right{padding:32px 24px;} }
      `}</style>
      <div className="add-page">
        <div className="add-left">
          <div className="add-left-bg"/>
          <div style={{position:"relative"}}>
            <button className="btn-back" onClick={()=>go("feed")}>← Back to feed</button>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,marginTop:28}}>
              <img src="/logo.png" alt="CoG" style={{width:44,height:44,objectFit:"contain",flexShrink:0}}/>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(1.8rem,3vw,2.6rem)",fontWeight:900,color:"white",lineHeight:1,letterSpacing:-1}}>Chain of<br/><em style={{fontStyle:"italic",color:"var(--sun)"}}>Gratuity</em></div>
            </div>
            <div style={{fontSize:".72rem",textTransform:"uppercase",letterSpacing:"2px",color:"rgba(255,255,255,.32)",marginBottom:40}}>Proof that good spreads</div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(1.4rem,2.5vw,2rem)",fontWeight:700,color:"white",lineHeight:1.2,marginBottom:16}}>Every story<br/><em style={{fontStyle:"italic",color:"var(--sun)"}}>lengthens</em> the chain.</div>
            <p style={{fontSize:".92rem",color:"rgba(255,255,255,.5)",lineHeight:1.68,maxWidth:340}}>Someone did something kind for you. By sharing it here, you're adding a permanent link to a chain that will keep going long after.</p>
          </div>
          <div style={{position:"relative"}}>
            <div className="add-chain-vis">
              {[{bg:"#FF6B4A",l:"M"},{bg:"#FFD44F",l:"J"},{bg:"#3ECFA0",l:"P"}].map((n,i)=>(
                <span key={i} style={{display:"flex",alignItems:"center"}}>
                  <span className="add-node" style={{background:n.bg}}>{n.l}</span>
                  <span className="add-connector"/>
                </span>
              ))}
              <span className="add-node-new">+</span>
            </div>
            <div style={{fontSize:".68rem",textTransform:"uppercase",letterSpacing:"1px",color:"rgba(255,255,255,.28)"}}>You're next in the chain</div>
          </div>
        </div>
        <div className="add-right">
          {done ? (
            <div className="success-panel">
              <div className="success-icon">🔗</div>
              <h2 style={{fontFamily:"'Fraunces',serif",fontSize:"1.9rem",fontWeight:900,color:"var(--ink)",lineHeight:1.1,marginBottom:10}}>You've <em style={{fontStyle:"italic",color:"var(--coral)"}}>extended</em><br/>the chain.</h2>
              <p style={{fontSize:".9rem",color:"var(--muted)",lineHeight:1.65,maxWidth:320,marginBottom:24}}>Your story is now a permanent link. Every person who holds this chain code can see what you added.</p>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:"1rem",fontWeight:500,color:"var(--ink)",background:"white",border:"2px solid var(--border)",borderRadius:10,padding:"10px 22px",marginBottom:24,letterSpacing:1}}>{codeClean}</div>
              <button className="btn-primary" onClick={()=>go("chain")}>View the full chain →</button>
              <button className="btn-ghost-sm" style={{marginTop:12}} onClick={()=>{setCode("");setName("");setStory("");setPhoto(null);setDone(false);}}>Add another story</button>
            </div>
          ) : (
            <>
              <h1 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(1.6rem,3vw,2.1rem)",fontWeight:900,color:"var(--ink)",lineHeight:1.1,marginBottom:6}}>Add your<br/><em style={{fontStyle:"italic",color:"var(--coral)"}}>story</em> to the chain.</h1>
              <p style={{fontSize:".88rem",color:"var(--muted)",marginBottom:36,lineHeight:1.5}}>Tell us about the act of kindness that brought you here.</p>
              <div className="field-group">
                <div className="field-label-row"><span className="field-lbl">Chain Code</span></div>
                <div className="code-wrap">
                  <input className={`code-input${codeValid?" valid":""}`} placeholder="e.g. GOLDEN-SPARK-4821" value={code} onChange={e=>setCode(e.target.value)} maxLength={24} spellCheck={false}/>
                  {codeClean.length>0 && <span className="code-icon">{codeValid?"✅":"⏳"}</span>}
                </div>
                <p className="field-hint">Found on the card you received. Format: WORD-WORD-0000</p>
              </div>
              <div className="field-group">
                <div className="field-label-row"><span className="field-lbl">Your Name</span><span className="field-opt">(optional)</span></div>
                <input className="field-input" placeholder="How you'd like to appear on the chain" value={name} onChange={e=>setName(e.target.value)} maxLength={60}/>
              </div>
              <div className="field-group">
                <div className="field-label-row"><span className="field-lbl">The Act of Kindness</span></div>
                <textarea className="field-ta" style={{minHeight:130}} placeholder="What did someone do for you? Even a small thing matters — tell it in your own words." value={story} onChange={e=>setStory(e.target.value)} maxLength={MAX+20}/>
                <div style={{textAlign:"right",fontSize:".7rem",color:story.length>MAX?"var(--coral)":story.length>MAX*.85?"var(--sun)":"var(--muted)",marginTop:4}}>{story.length}/{MAX}</div>
              </div>
              <div className="field-group">
                <div className="field-label-row"><span className="field-lbl">Add a Photo</span><span className="field-opt">(optional)</span></div>
                {photo ? (
                  <div className="photo-preview-wrap"><img src={photo} alt="Preview" className="photo-preview"/><button className="photo-rm" onClick={()=>setPhoto(null)}>✕</button></div>
                ) : (
                  <div className={`photo-drop${drag?" drag-over":""}`} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handlePhoto(e.dataTransfer.files[0]);}} onClick={()=>fileRef.current?.click()}>
                    <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handlePhoto(e.target.files[0])}/>
                    <span style={{fontSize:"1.8rem",display:"block",marginBottom:8}}>📷</span>
                    <p style={{fontSize:".84rem",color:"var(--muted)"}}><strong style={{color:"var(--coral)"}}>Tap to upload</strong> or drag a photo here</p>
                  </div>
                )}
              </div>
              <button className="btn-primary" style={{width:"100%",padding:15,marginTop:28,fontSize:"1rem",background:"linear-gradient(135deg,var(--coral),#FF8C42)",border:"none"}} disabled={!canSubmit||loading} onClick={handleSubmit}>
                {loading?"Adding to the chain…":"Add my story to the chain →"}
              </button>
              <p style={{textAlign:"center",fontSize:".75rem",color:"var(--muted)",marginTop:10,lineHeight:1.5}}>Your story will be visible to everyone who shares this chain code. Names are always optional.</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: ASK FOR HELP
// ═══════════════════════════════════════════════════════════════════════════════
function AskPage({ go }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]     = useState("All");
  const [postOpen, setPostOpen] = useState(false);
  const [helpTarget, setHelpTarget] = useState(null);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [codes, setCodes]       = useState(null);
  const [showToast, Toast]      = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await dbQuery("/help_requests?select=*&order=created_at.desc&eq.resolved=false");
      setRequests(data && data.length > 0 ? data : REQUESTS_DATA);
    } catch {
      setRequests(REQUESTS_DATA);
    }
    setLoading(false);
  };
  const CATS = ["All","Transport","Moving","Companionship","Food","Teaching","Other"];
  const filtered = filter==="All" ? requests : requests.filter(r=>r.category===filter);

  return (
    <>
      <style>{`
        .ask-page { padding-top:0;min-height:100vh; }
        .ask-hero { background:var(--ink);padding:100px 48px 72px;position:relative;overflow:hidden; }
        .ask-hero-bg { position:absolute;inset:0;background:radial-gradient(ellipse 55% 70% at 0% 0%,rgba(62,207,160,.2) 0%,transparent 55%),radial-gradient(ellipse 45% 55% at 100% 100%,rgba(75,190,245,.15) 0%,transparent 55%);pointer-events:none; }
        .ask-hero-inner { max-width:660px;position:relative; }
        .ask-how { display:flex;gap:0;margin-top:48px;padding-top:36px;border-top:1px solid rgba(255,255,255,.08);flex-wrap:wrap; }
        .ask-how-item { flex:1;min-width:150px;padding-right:24px;margin-right:24px;border-right:1px solid rgba(255,255,255,.08); }
        .ask-how-item:last-child { border-right:none;margin-right:0; }
        .ask-how-num { font-family:'Fraunces',serif;font-size:1.5rem;font-weight:900;line-height:1;margin-bottom:5px; }
        .ask-how-text { font-size:.76rem;color:rgba(255,255,255,.38);line-height:1.5; }
        .ask-body { max-width:1060px;margin:0 auto;padding:52px 48px 90px; }
        .ask-controls { display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:28px;flex-wrap:wrap; }
        .cat-filters { display:flex;gap:7px;flex-wrap:wrap; }
        .cat-pill { padding:7px 15px;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;border:2px solid var(--border);background:white;color:var(--muted);transition:all .18s; }
        .cat-pill:hover { border-color:var(--ink);color:var(--ink); }
        .cat-pill.active { background:var(--ink);border-color:var(--ink);color:white; }
        .req-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:18px; }
        .req-card { background:white;border-radius:19px;padding:22px 24px;box-shadow:0 2px 14px rgba(26,26,46,.06);border:2px solid transparent;transition:transform .2s,box-shadow .2s;position:relative;overflow:hidden;animation:fadeUp .4s ease both; }
        .req-card:hover { transform:translateY(-3px);box-shadow:0 9px 28px rgba(26,26,46,.11); }
        .req-accent { position:absolute;top:0;left:0;right:0;height:4px;border-radius:19px 19px 0 0; }
        .req-top { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px; }
        .req-author { font-weight:700;font-size:.9rem;color:var(--ink); }
        .req-loc { font-size:.73rem;color:var(--muted);margin-top:2px; }
        .req-cat { font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 9px;border-radius:20px;color:white;flex-shrink:0; }
        .req-ask { font-size:.88rem;line-height:1.65;color:#333;margin-bottom:16px; }
        .req-footer { display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap; }
        .req-meta { display:flex;align-items:center;gap:10px; }
        .req-time { font-size:.7rem;color:var(--muted); }
        .req-offers { font-size:.7rem;color:var(--mint);font-weight:600; }
        .req-btns { display:flex;gap:7px; }
        .btn-resolve { padding:7px 13px;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:600;cursor:pointer;border:2px solid var(--border);background:transparent;color:var(--muted);transition:all .18s; }
        .btn-resolve:hover { border-color:var(--mint);color:var(--mint); }
        .code-reveal-overlay { position:fixed;inset:0;background:rgba(26,26,46,.7);backdrop-filter:blur(10px);z-index:700;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .2s ease; }
        .code-reveal-box { background:var(--ink);border-radius:24px;padding:44px 38px;width:100%;max-width:460px;text-align:center;animation:popIn .3s cubic-bezier(.34,1.4,.64,1) both; }
        .cr-emoji { font-size:3.2rem;margin-bottom:18px;display:block;animation:bounce .5s cubic-bezier(.34,1.56,.64,1) both .2s; }
        .cr-title { font-family:'Fraunces',serif;font-size:1.65rem;font-weight:900;color:white;line-height:1.1;margin-bottom:10px; }
        .cr-title em { font-style:italic;color:var(--sun); }
        .cr-sub { font-size:.86rem;color:rgba(255,255,255,.48);line-height:1.6;margin-bottom:26px; }
        .cr-codes { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px; }
        .cr-code-box { border-radius:13px;padding:14px;border:1.5px solid rgba(255,255,255,.12); }
        .cr-code-lbl { font-size:.55rem;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,.32);margin-bottom:5px; }
        .cr-code-val { font-family:'DM Mono',monospace;font-size:.75rem;font-weight:500;word-break:break-all; }
        .cr-code-hint { font-size:.62rem;color:rgba(255,255,255,.28);margin-top:5px;line-height:1.4; }
        @media(max-width:700px){ .ask-hero{padding:88px 24px 56px;} .ask-body{padding:40px 20px 70px;} .ask-how{gap:20px;} .ask-how-item{border-right:none;margin-right:0;padding-right:0;} }
      `}</style>
      <div className="ask-page">
        <div className="ask-hero">
          <div className="ask-hero-bg"/>
          <div className="ask-hero-inner">
            <div className="hh-eyebrow" style={{marginBottom:18}}>
              {["#3ECFA0","#4BBEF5","#FFD44F"].map((c,i)=><span key={i} className="hh-dot" style={{background:c,width:7,height:7}}/>)}
              <span className="hh-eyebrow-text">Asking is the first act of courage</span>
            </div>
            <h1 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(2.4rem,6vw,4.5rem)",fontWeight:900,color:"white",lineHeight:.93,letterSpacing:-2,marginBottom:18}}>Need a little<br/><em style={{fontStyle:"italic",color:"var(--mint)"}}>help?</em></h1>
            <p style={{fontSize:"clamp(.95rem,2vw,1.08rem)",color:"rgba(255,255,255,.5)",lineHeight:1.7,maxWidth:520,marginBottom:32}}>Post what you need. Someone nearby might see it and show up. When they do — you both walk away with a chain code, and one act of kindness becomes two new chains.</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button className="btn-mint" onClick={()=>setPostOpen(true)}>Post a request →</button>
              <button className="btn-ghost">Browse requests ↓</button>
            </div>
            <div className="ask-how">
              {[{n:"01",c:"var(--mint)",t:"Post what you need — as specific or vague as you're comfortable with"},
                {n:"02",c:"var(--sky)",t:"Someone nearby sees it and offers to help"},
                {n:"03",c:"var(--sun)",t:"They show up. You mark it resolved. You both get a chain code."}
              ].map((s,i)=>(
                <div key={i} className="ask-how-item">
                  <div className="ask-how-num" style={{color:s.c}}>{s.n}</div>
                  <div className="ask-how-text">{s.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ColorBar/>
        <div className="ask-body">
          <div className="ask-controls">
            <div className="cat-filters">{CATS.map(c=><button key={c} className={`cat-pill${filter===c?" active":""}`} onClick={()=>setFilter(c)}>{c}</button>)}</div>
            <button className="btn-mint" onClick={()=>setPostOpen(true)}>+ Post a request</button>
          </div>
          <div className="req-grid">
            {filtered.map((req,i)=>{
              const color = CAT_COLORS[req.category]||"#9A9AAA";
              return (
                <div key={req.id} className="req-card" style={{animationDelay:`${i*.08}s`}}>
                  <div className="req-accent" style={{background:color}}/>
                  <div className="req-top">
                    <div><div className="req-author">{req.name}</div><div className="req-loc">📍 {req.location}</div></div>
                    <div className="req-cat" style={{background:color}}>{req.category}</div>
                  </div>
                  <p className="req-ask">{req.ask}</p>
                  <div className="req-footer">
                    <div className="req-meta">
                      <span className="req-time">{req.time}</span>
                      {req.offers>0&&<span className="req-offers">🙋 {req.offers} offer{req.offers!==1?"s":""}</span>}
                    </div>
                    <div className="req-btns">
                      <button className="btn-resolve" onClick={()=>setResolveTarget(req)}>✓ Resolved</button>
                      <button className="btn-sm" onClick={()=>setHelpTarget(req)}>I can help →</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Post Modal */}
      {postOpen && (
        <div className="compose-overlay" onClick={e=>e.target===e.currentTarget&&setPostOpen(false)}>
          <div className="compose-modal">
            <h2 style={{fontFamily:"'Fraunces',serif",fontSize:"1.6rem",fontWeight:900,marginBottom:6}}>Ask for a <em style={{fontStyle:"italic",color:"var(--mint)"}}>little help.</em></h2>
            <p style={{fontSize:".86rem",color:"var(--muted)",marginBottom:24,lineHeight:1.5}}>Be specific. Be honest. People want to help — you just have to ask.</p>
            <div className="field-group">
              <div className="field-label-row"><span className="field-lbl">Your Name</span><span className="field-opt">(optional)</span></div>
              <input className="field-input" placeholder="How you'd like to appear"/>
            </div>
            <div className="field-group">
              <div className="field-label-row"><span className="field-lbl">Location</span></div>
              <input className="field-input" placeholder="Neighborhood, city, landmark…"/>
            </div>
            <div className="field-group">
              <div className="field-label-row"><span className="field-lbl">What do you need?</span></div>
              <textarea className="field-ta" placeholder="Describe what you need as specifically as you can…"/>
            </div>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button className="btn-cancel-sm" onClick={()=>setPostOpen(false)}>Cancel</button>
              <button className="btn-mint" style={{flex:2}} onClick={()=>{setPostOpen(false);showToast("Your request is live. Someone will see it. 🙏");}}>Post my request →</button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {helpTarget && (
        <div className="compose-overlay" onClick={e=>e.target===e.currentTarget&&setHelpTarget(null)}>
          <div className="compose-modal">
            <h2 style={{fontFamily:"'Fraunces',serif",fontSize:"1.5rem",fontWeight:900,marginBottom:8}}>You're stepping <em style={{fontStyle:"italic",color:"var(--mint)"}}>up.</em></h2>
            <p style={{fontSize:".86rem",color:"var(--muted)",marginBottom:18,lineHeight:1.5}}>Once you've helped them, they can mark it resolved and you'll both get a chain code.</p>
            <div style={{background:"rgba(62,207,160,.08)",border:"1.5px solid rgba(62,207,160,.2)",borderRadius:13,padding:"14px 16px",marginBottom:20,fontSize:".86rem",color:"#333",lineHeight:1.6}}>"{helpTarget.ask}"</div>
            <p style={{fontSize:".78rem",color:"var(--muted)",marginBottom:20}}>📍 <strong>{helpTarget.location}</strong></p>
            <div style={{display:"flex",gap:10}}>
              <button className="btn-cancel-sm" onClick={()=>setHelpTarget(null)}>Go back</button>
              <button className="btn-mint" style={{flex:2}} onClick={()=>{setRequests(r=>r.map(req=>req.id===helpTarget.id?{...req,offers:req.offers+1}:req));setHelpTarget(null);showToast("They've been notified! 🤝");}}>I'm helping them →</button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveTarget && (
        <div className="compose-overlay" onClick={e=>e.target===e.currentTarget&&setResolveTarget(null)}>
          <div className="compose-modal">
            <h2 style={{fontFamily:"'Fraunces',serif",fontSize:"1.5rem",fontWeight:900,marginBottom:8}}>Mark this <em style={{fontStyle:"italic",color:"var(--mint)"}}>resolved?</em></h2>
            <p style={{fontSize:".86rem",color:"var(--muted)",marginBottom:18,lineHeight:1.5}}>Did someone come through for you? You'll both receive a unique chain code — the start of two new chains.</p>
            <div style={{background:"rgba(255,212,79,.1)",border:"1.5px solid rgba(255,212,79,.3)",borderRadius:13,padding:"13px 16px",marginBottom:22,fontSize:".8rem",color:"#555",lineHeight:1.5}}>🎉 Marking this resolved means someone was kind enough to show up for you. That's the whole chain right there.</div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn-cancel-sm" onClick={()=>setResolveTarget(null)}>Not yet</button>
              <button className="btn-mint" style={{flex:2}} onClick={()=>{setRequests(r=>r.filter(req=>req.id!==resolveTarget.id));setResolveTarget(null);setCodes({yours:genCode(),helper:genCode()});}}>Yes — someone helped me ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* Code Reveal */}
      {codes && (
        <div className="code-reveal-overlay">
          <div className="code-reveal-box">
            <span className="cr-emoji">🔗</span>
            <h2 className="cr-title">Two new chains<br/><em>just started.</em></h2>
            <p className="cr-sub">One act of kindness, two chain codes. You and the person who helped you each get one.</p>
            <div className="cr-codes">
              <div className="cr-code-box" style={{background:"rgba(62,207,160,.12)",borderColor:"rgba(62,207,160,.25)"}}>
                <div className="cr-code-lbl">Your Code</div>
                <div className="cr-code-val" style={{color:"var(--mint)"}}>{codes.yours}</div>
                <div className="cr-code-hint">The chain you received</div>
              </div>
              <div className="cr-code-box" style={{background:"rgba(255,212,79,.1)",borderColor:"rgba(255,212,79,.25)"}}>
                <div className="cr-code-lbl">Helper's Code</div>
                <div className="cr-code-val" style={{color:"var(--sun)"}}>{codes.helper}</div>
                <div className="cr-code-hint">The chain they started</div>
              </div>
            </div>
            <button className="btn-primary" style={{width:"100%"}} onClick={()=>{setCodes(null);go("add");}}>Start adding to my chain →</button>
          </div>
        </div>
      )}
      {Toast}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: SHOP
// ═══════════════════════════════════════════════════════════════════════════════
const PRODUCTS = [
  {id:1,name:"Classic Tee",emoji:"👕",desc:"100% organic cotton. Chain of Gratuity wordmark on chest, chain code on back hem.",price:"$32",badge:"Most Popular",badgeColor:"#FF6B4A",bg:"linear-gradient(135deg,#FFF0EC,#FFE4DC)",colors:["#1A1A2E","#FFF8F0","#FF6B4A","#3ECFA0"]},
  {id:2,name:"Dad Hat",emoji:"🧢",desc:"Unstructured 6-panel. Embroidered 'CoG' on front, chain dot motif on side.",price:"$28",badge:"New",badgeColor:"#3ECFA0",bg:"linear-gradient(135deg,#EDFAF5,#D6F5EA)",colors:["#1A1A2E","#FFD44F","#FFF8F0"]},
  {id:3,name:"Sticker Pack",emoji:"✨",desc:"10 die-cut vinyl stickers. Waterproof, weatherproof. Perfect for spreading the word.",price:"$10",badge:null,bg:"linear-gradient(135deg,#FFF8DC,#FFF0B0)",colors:null},
  {id:4,name:"Tote Bag",emoji:"👜",desc:"Heavy canvas tote with the full wordmark. Carry kindness.",price:"$24",badge:null,bg:"linear-gradient(135deg,#EDF5FF,#D6E8FF)",colors:["#1A1A2E","#FFF8F0","#4BBEF5"]},
  {id:5,name:"Enamel Pin",emoji:"📌",desc:"Hard enamel, gold plating. The chain dot motif.",price:"$14",badge:"Limited",badgeColor:"#C084FC",bg:"linear-gradient(135deg,#F5EDFF,#EAD6FF)",colors:null},
  {id:6,name:"Hoodie",emoji:"🧥",desc:"Midweight fleece. Oversized fit. 'Proof that good spreads' on the back.",price:"$58",badge:null,bg:"linear-gradient(135deg,#F0F0F5,#E0E0EA)",colors:["#1A1A2E","#FFF8F0","#FF6B4A"]},
];

function ShopPage({ go }) {
  const [cardOpt, setCardOpt] = useState(0);
  const [swatches, setSwatches] = useState({});
  const [showToast, Toast] = useToast();
  const CARD_OPTS = [
    {icon:"📦",name:"Physical Cards (Pack of 25)",desc:"Printed, double-sided, ready to hand out",price:"$12"},
    {icon:"📱",name:"Digital Wallet Pass",desc:"Apple Wallet + Google Wallet instant delivery",price:"$4"},
    {icon:"🎁",name:"Physical + Digital Bundle",desc:"25 cards and the digital pass — best value",price:"$14"},
  ];
  return (
    <>
      <style>{`
        .shop-page { padding-top:72px;min-height:100vh; }
        .shop-hero { background:var(--ink);padding:56px 48px 72px;position:relative;overflow:hidden; }
        .shop-hero-bg { position:absolute;inset:0;background:radial-gradient(ellipse 50% 80% at 100% 0%,rgba(255,212,79,.18) 0%,transparent 55%),radial-gradient(ellipse 40% 60% at 0% 100%,rgba(62,207,160,.14) 0%,transparent 55%);pointer-events:none; }
        .shop-body { max-width:1060px;margin:0 auto;padding:60px 48px 90px; }
        .cards-feature { background:var(--ink);border-radius:24px;overflow:hidden;margin-bottom:56px;display:grid;grid-template-columns:1fr 1fr;position:relative; }
        .cards-feature-bg { position:absolute;inset:0;background:radial-gradient(ellipse 70% 80% at -10% 50%,rgba(255,212,79,.17) 0%,transparent 55%),radial-gradient(ellipse 50% 50% at 110% 50%,rgba(62,207,160,.13) 0%,transparent 55%);pointer-events:none; }
        .cf-text { padding:40px 38px;position:relative; }
        .cf-visual { display:flex;align-items:center;justify-content:center;padding:36px;overflow:hidden; }
        .v-card-stack { position:relative;width:210px;height:125px; }
        .v-card { position:absolute;width:210px;height:122px;border-radius:13px;padding:15px 17px;display:flex;flex-direction:column;justify-content:space-between; }
        .v-c1 { background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);transform:rotate(-6deg) translateY(15px);z-index:1; }
        .v-c2 { background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);transform:rotate(3deg) translateY(8px);z-index:2; }
        .v-c3 { background:linear-gradient(135deg,rgba(255,107,74,.28),rgba(255,212,79,.18));border:1px solid rgba(255,212,79,.28);z-index:3; }
        .v-brand { font-family:'Fraunces',serif;font-size:.72rem;font-weight:900;color:white; }
        .v-brand em { font-style:italic;color:var(--sun); }
        .v-code { font-family:'DM Mono',monospace;font-size:.5rem;color:rgba(255,255,255,.45); }
        .cf-option { display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:12px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.09);cursor:pointer;transition:background .2s,border-color .2s;margin-bottom:9px; }
        .cf-option:hover,.cf-option.sel { background:rgba(255,255,255,.1);border-color:rgba(255,212,79,.4); }
        .cf-opt-icon { font-size:1.2rem;flex-shrink:0; }
        .cf-opt-name { font-size:.85rem;font-weight:600;color:white; }
        .cf-opt-desc { font-size:.7rem;color:rgba(255,255,255,.38); }
        .cf-opt-price { font-family:'DM Mono',monospace;font-size:.88rem;color:var(--sun);flex-shrink:0; }
        .product-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-bottom:56px; }
        .product-card { background:white;border-radius:19px;overflow:hidden;box-shadow:0 2px 14px rgba(26,26,46,.06);transition:transform .2s,box-shadow .2s;cursor:pointer; }
        .product-card:hover { transform:translateY(-4px);box-shadow:0 11px 30px rgba(26,26,46,.12); }
        .product-img { aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:3.5rem;position:relative;overflow:hidden; }
        .product-badge { position:absolute;top:11px;right:11px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 9px;border-radius:20px;color:white; }
        .product-info { padding:18px 20px; }
        .product-name { font-family:'Fraunces',serif;font-size:1rem;font-weight:700;color:var(--ink);margin-bottom:4px; }
        .product-desc { font-size:.78rem;color:var(--muted);line-height:1.5;margin-bottom:14px; }
        .swatch-row { display:flex;gap:5px;margin-bottom:12px; }
        .swatch { width:17px;height:17px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:border-color .15s; }
        .swatch:hover,.swatch.active { border-color:var(--ink); }
        .product-footer { display:flex;align-items:center;justify-content:space-between; }
        .product-price { font-family:'DM Mono',monospace;font-size:.95rem;font-weight:500;color:var(--ink); }
        .bundle-banner { background:linear-gradient(135deg,var(--coral),#FF8C42,var(--sun));border-radius:22px;padding:36px 40px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap; }
        .bundle-was { font-size:.8rem;color:rgba(255,255,255,.5);text-decoration:line-through;margin-bottom:2px; }
        .bundle-now { font-family:'Fraunces',serif;font-size:2.6rem;font-weight:900;color:white;line-height:1; }
        .bundle-save { font-size:.7rem;color:rgba(255,255,255,.6);margin-top:2px; }
        @media(max-width:800px){ .product-grid{grid-template-columns:repeat(2,1fr);} .cards-feature{grid-template-columns:1fr;} .cf-visual{display:none;} }
        @media(max-width:500px){ .product-grid{grid-template-columns:1fr;} .shop-body{padding:40px 20px 70px;} .shop-hero{padding:48px 24px 56px;} }
      `}</style>
      <div className="shop-page">
        <div className="shop-hero">
          <div className="shop-hero-bg"/>
          <div style={{maxWidth:640,position:"relative"}}>
            <p style={{fontSize:".7rem",textTransform:"uppercase",letterSpacing:"2.5px",color:"rgba(255,255,255,.3)",marginBottom:14}}>The Shop</p>
            <h1 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(2.2rem,5vw,3.8rem)",fontWeight:900,color:"white",lineHeight:.95,letterSpacing:-1.5,marginBottom:16}}>Wear the<br/><em style={{fontStyle:"italic",color:"var(--sun)"}}>chain.</em></h1>
            <p style={{fontSize:"1rem",color:"rgba(255,255,255,.48)",lineHeight:1.65,maxWidth:460}}>Cards to start a chain. Merch to spread the word. Every purchase helps keep the platform running and the kindness flowing.</p>
          </div>
        </div>
        <ColorBar/>
        <div className="shop-body">
          <h2 className="sec-title" style={{marginBottom:6}}>The <em>Cards</em></h2>
          <p style={{fontSize:".88rem",color:"var(--muted)",marginBottom:28,lineHeight:1.5}}>The physical link between strangers. Start your chain here.</p>
          <div className="cards-feature">
            <div className="cards-feature-bg"/>
            <div className="cf-text">
              <p style={{fontSize:".64rem",textTransform:"uppercase",letterSpacing:"2px",color:"rgba(255,255,255,.3)",marginBottom:12}}>Physical &amp; Digital</p>
              <h3 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(1.4rem,2.5vw,1.9rem)",fontWeight:900,color:"white",lineHeight:1.1,marginBottom:12}}>Your chain<br/><em style={{fontStyle:"italic",color:"var(--sun)"}}>starts here.</em></h3>
              <p style={{fontSize:".85rem",color:"rgba(255,255,255,.48)",lineHeight:1.65,marginBottom:22}}>Each card comes with a unique generated chain code and QR code linking directly to your chain page.</p>
              <div style={{marginBottom:20}}>
                {CARD_OPTS.map((o,i)=>(
                  <div key={i} className={`cf-option${cardOpt===i?" sel":""}`} onClick={()=>setCardOpt(i)}>
                    <span className="cf-opt-icon">{o.icon}</span>
                    <div style={{flex:1}}><div className="cf-opt-name">{o.name}</div><div className="cf-opt-desc">{o.desc}</div></div>
                    <span className="cf-opt-price">{o.price}</span>
                  </div>
                ))}
              </div>
              <button className="btn-sun" onClick={()=>showToast("Added to cart! 🔗")}>Add to cart — {CARD_OPTS[cardOpt].price}</button>
            </div>
            <div className="cf-visual">
              <div className="v-card-stack">
                {[1,2,3].map(n=>(
                  <div key={n} className={`v-card v-c${n}`}>
                    <div className="v-brand">Chain of <em>Gratuity</em></div>
                    <div className="v-code">{["WARM-BLOOM-2247","BOLD-WAVE-7731","GOLDEN-SPARK-4821"][n-1]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <h2 className="sec-title" style={{marginBottom:6}}><em>Merch</em></h2>
          <p style={{fontSize:".88rem",color:"var(--muted)",marginBottom:28}}>Wear kindness. Spread the word.</p>
          <div className="product-grid">
            {PRODUCTS.map(p=>(
              <div key={p.id} className="product-card">
                <div className="product-img" style={{background:p.bg}}>
                  <span>{p.emoji}</span>
                  {p.badge&&<div className="product-badge" style={{background:p.badgeColor}}>{p.badge}</div>}
                </div>
                <div className="product-info">
                  <div className="product-name">{p.name}</div>
                  <div className="product-desc">{p.desc}</div>
                  {p.colors&&<div className="swatch-row">{p.colors.map((c,i)=><div key={i} className={`swatch${(swatches[p.id]??0)===i?" active":""}`} style={{background:c,border:c==="#FFF8F0"?"2px solid #DDD":undefined}} onClick={()=>setSwatches(s=>({...s,[p.id]:i}))}/>)}</div>}
                  <div className="product-footer">
                    <div className="product-price">{p.price}</div>
                    <button className="btn-sm" onClick={()=>showToast(`${p.name} added ✓`)}>Add to cart</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bundle-banner">
            <div>
              <div style={{fontSize:".65rem",textTransform:"uppercase",letterSpacing:"2px",color:"rgba(255,255,255,.55)",marginBottom:7}}>Best value</div>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(1.3rem,2.5vw,1.8rem)",fontWeight:900,color:"white",marginBottom:7}}>The Starter Bundle</div>
              <div style={{fontSize:".86rem",color:"rgba(255,255,255,.65)",lineHeight:1.5}}>25 physical cards + digital wallet pass + a Classic Tee.<br/>Everything you need to start spreading kindness.</div>
            </div>
            <div style={{textAlign:"center",flexShrink:0}}>
              <div className="bundle-was">$44 separately</div>
              <div className="bundle-now">$36</div>
              <div className="bundle-save">You save $8</div>
            </div>
            <button className="btn-white-coral" onClick={()=>showToast("Bundle added to cart! 🎉")}>Get the bundle →</button>
          </div>
        </div>
        <footer className="site-footer" style={{marginTop:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src="/logo.png" alt="CoG" style={{width:36,height:36,objectFit:"contain",flexShrink:0}}/>
            <div><div className="footer-brand">Chain of <em>Gratuity</em></div><div className="footer-tagline">Proof that good spreads.</div></div>
          </div>
          <div className="footer-copy">© 2025 Chain of Gratuity. Made with kindness.</div>
        </footer>
        {Toast}
      </div>
    </>
  );
}

// ─── SHARED BUTTON + FORM STYLES ──────────────────────────────────────────────
const SHARED_CSS = `
  .btn-primary { padding:13px 28px;background:linear-gradient(135deg,var(--coral),#FF8C42);color:white;border:none;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:.95rem;font-weight:700;cursor:pointer;box-shadow:0 5px 18px rgba(255,107,74,.35);transition:transform .2s,box-shadow .2s,opacity .2s; }
  .btn-primary:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 10px 26px rgba(255,107,74,.4); }
  .btn-primary:disabled { opacity:.45;cursor:not-allowed;box-shadow:none; }
  .btn-ghost { padding:13px 28px;background:transparent;color:rgba(255,255,255,.65);border:2px solid rgba(255,255,255,.2);border-radius:50px;font-family:'DM Sans',sans-serif;font-size:.95rem;font-weight:600;cursor:pointer;transition:border-color .2s,color .2s; }
  .btn-ghost:hover { border-color:rgba(255,255,255,.5);color:white; }
  .btn-ghost-sm { padding:10px 22px;background:transparent;color:var(--muted);border:2px solid var(--border);border-radius:50px;font-family:'DM Sans',sans-serif;font-size:.86rem;font-weight:600;cursor:pointer;transition:border-color .2s,color .2s; }
  .btn-ghost-sm:hover { border-color:var(--ink);color:var(--ink); }
  .btn-sun { padding:13px 26px;background:var(--sun);color:var(--ink);border:none;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer;transition:opacity .2s,transform .15s; }
  .btn-sun:hover { opacity:.88;transform:scale(1.02); }
  .btn-mint { padding:11px 24px;background:var(--mint);color:white;border:none;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(62,207,160,.3);transition:opacity .2s,transform .15s; }
  .btn-mint:hover { opacity:.88;transform:scale(1.02); }
  .btn-sm { padding:8px 16px;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:700;cursor:pointer;border:none;background:var(--ink);color:white;transition:background .2s,transform .15s; }
  .btn-sm:hover { background:var(--coral);transform:scale(1.04); }
  .btn-cancel-sm { flex:1;padding:12px;border:2px solid var(--border);border-radius:12px;background:transparent;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:600;color:var(--muted);cursor:pointer;transition:border-color .2s,color .2s; }
  .btn-cancel-sm:hover { border-color:var(--ink);color:var(--ink); }
  .btn-back { background:none;border:none;color:rgba(255,255,255,.35);font-family:'DM Sans',sans-serif;font-size:.8rem;cursor:pointer;transition:color .2s;padding:0; }
  .btn-back:hover { color:rgba(255,255,255,.8); }
  .btn-white-coral { padding:12px 26px;background:white;color:var(--coral);border:none;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:opacity .2s,transform .15s; }
  .btn-white-coral:hover { opacity:.9;transform:scale(1.02); }
  .btn-text-link { font-size:.85rem;font-weight:600;color:var(--coral);background:none;border:none;cursor:pointer;transition:opacity .2s; }
  .btn-text-link:hover { opacity:.7; }
  .sec-label { font-size:.7rem;text-transform:uppercase;letter-spacing:2.5px;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;gap:10px; }
  .sec-label::after { content:'';flex:1;height:1px;background:var(--border);max-width:50px; }
  .sec-title { font-family:'Fraunces',serif;font-size:clamp(1.9rem,4vw,2.8rem);font-weight:900;color:var(--ink);line-height:1.05;letter-spacing:-.5px; }
  .sec-title em { font-style:italic;color:var(--coral); }
  .field-group { margin-bottom:20px; }
  .field-label-row { display:flex;align-items:baseline;gap:8px;margin-bottom:7px; }
  .field-lbl { font-size:.74rem;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--ink); }
  .field-opt { font-size:.7rem;color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0; }
  .field-hint { font-size:.74rem;color:var(--muted);margin-top:5px;line-height:1.4; }
  .field-input { width:100%;padding:12px 16px;font-family:'DM Sans',sans-serif;font-size:.93rem;color:var(--ink);background:white;border:2px solid var(--border);border-radius:12px;outline:none;transition:border-color .2s,box-shadow .2s; }
  .field-input:focus { border-color:var(--coral);box-shadow:0 0 0 4px rgba(255,107,74,.1); }
  .field-input::placeholder { color:#CCC; }
  .field-ta { width:100%;min-height:100px;padding:12px 16px;font-family:'DM Sans',sans-serif;font-size:.93rem;color:var(--ink);background:white;border:2px solid var(--border);border-radius:12px;outline:none;resize:vertical;line-height:1.6;transition:border-color .2s,box-shadow .2s; }
  .field-ta:focus { border-color:var(--coral);box-shadow:0 0 0 4px rgba(255,107,74,.1); }
  .field-ta::placeholder { color:#CCC; }
  .compose-overlay { position:fixed;inset:0;background:rgba(26,26,46,.6);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .2s ease; }
  .compose-modal { background:white;border-radius:24px;padding:32px;width:100%;max-width:500px;animation:popIn .25s ease;max-height:90vh;overflow-y:auto; }
  .toast { position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(10px);background:var(--ink);color:white;padding:11px 24px;border-radius:50px;font-size:.87rem;font-weight:600;z-index:999;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:toastUp .3s ease forwards; }
  .live-pill { display:flex;align-items:center;gap:6px;font-size:.72rem;font-weight:700;color:var(--coral);text-transform:uppercase;letter-spacing:1px; }
  .live-dot { width:8px;height:8px;border-radius:50%;background:var(--coral);animation:livePulse 1.5s ease-in-out infinite; }
  .page-wrap { animation:pageIn .35s ease both; }
`;

// ─── APP SHELL ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");

  const go = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style>{GLOBAL}</style>
      <style>{NAV_CSS}</style>
      <style>{SHARED_CSS}</style>
      <Nav page={page} go={go} />
      <div className="page-wrap" key={page}>
        {page === "home"  && <HomePage go={go} />}
        {page === "feed"  && <FeedPage go={go} />}
        {page === "chain" && <ChainPage go={go} />}
        {page === "add"   && <AddPage go={go} />}
        {page === "ask"   && <AskPage go={go} />}
        {page === "shop"  && <ShopPage go={go} />}
      </div>
    </>
  );
}
