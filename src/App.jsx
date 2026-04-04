import { useState, useEffect, useCallback, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Analytics } from "@vercel/analytics/react";

// ═══════════════════════════════════════════════════════
// DOMAIN — Constants & Configuration
// ═══════════════════════════════════════════════════════

const ADMIN_PASS = "PromptMaster2024";
const ADMIN_CLICKS_REQUIRED = 7;
const ADMIN_CLICK_WINDOW_MS = 3000;

const EXPERTISE_MODES = [
  { id: "novice",       label: "Novice",       emoji: "🌱", desc: "I'm new to AI tools",           tagline: "We'll guide you every step" },
  { id: "professional", label: "Professional", emoji: "💼", desc: "I use AI tools regularly",      tagline: "More control, better output" },
  { id: "expert",       label: "Expert",       emoji: "🧠", desc: "I'm a power user / developer",  tagline: "Full prompt engineering control" },
];

const CATEGORIES = [
  { id: "content",  label: "Content Creation", emoji: "✍️",  desc: "Blogs, social & copy"   },
  { id: "code",     label: "Code & Dev",        emoji: "💻",  desc: "Debug, build & review"  },
  { id: "data",     label: "Data Analysis",     emoji: "📊",  desc: "Insights & reports"     },
  { id: "research", label: "Research",          emoji: "🔍",  desc: "Deep dives & summaries" },
  { id: "creative", label: "Creative Writing",  emoji: "🎨",  desc: "Stories, scripts & more"},
  { id: "business", label: "Business",          emoji: "💼",  desc: "Strategy & planning"    },
  { id: "learning", label: "Learning",          emoji: "📚",  desc: "Explain & teach me"     },
  { id: "image",    label: "Image Gen",         emoji: "🖼️",  desc: "Midjourney, DALL-E"     },
  { id: "sales",    label: "Sales & CRM",       emoji: "🤝",  desc: "Pitches & outreach"     },
  { id: "legal",    label: "Legal & Compliance",emoji: "⚖️",  desc: "Docs, contracts, review"},
  { id: "medical",  label: "Medical / Science", emoji: "🔬",  desc: "Research, summaries"    },
  { id: "design",   label: "Design & UX",       emoji: "✦",   desc: "Briefs, feedback, specs" },
];

const AI_TOOLS = ["ChatGPT","Claude","Gemini","Midjourney","DALL-E","Copilot","Perplexity","Llama","Grok","Other"];

const TONES = [
  { id: "professional", label: "Professional", emoji: "👔" },
  { id: "casual",       label: "Casual",       emoji: "😊" },
  { id: "creative",     label: "Creative",     emoji: "🎭" },
  { id: "technical",    label: "Technical",    emoji: "⚙️" },
  { id: "persuasive",   label: "Persuasive",   emoji: "🎯" },
  { id: "academic",     label: "Academic",     emoji: "🎓" },
  { id: "concise",      label: "Concise",      emoji: "⚡" },
];

const OUTPUT_FORMATS = [
  "Bullet points","Numbered steps","Essay prose","Table / Matrix",
  "JSON structure","Code block","Q&A format","Executive summary","Markdown report",
];

const PROMPT_TECHNIQUES = [
  { id: "zero_shot",    label: "Zero-Shot",           desc: "Direct instruction, no examples" },
  { id: "few_shot",     label: "Few-Shot",            desc: "Guide AI with 2–3 worked examples" },
  { id: "cot",          label: "Chain-of-Thought",    desc: "Force explicit step-by-step reasoning" },
  { id: "role",         label: "Expert Persona",      desc: "Deep role-play with a specific expert" },
  { id: "step_back",    label: "Step-Back",           desc: "Abstract first, then apply — for complex problems" },
  { id: "tot",          label: "Tree-of-Thought",     desc: "Explore multiple reasoning paths simultaneously" },
  { id: "meta",         label: "Meta-Prompting",      desc: "Prompt the AI to design its own optimal approach" },
];

const CHART_COLORS = ["#C8FF00","#FF6B35","#7C3AED","#06B6D4","#F59E0B","#EC4899","#10B981","#EF4444"];

const C = {
  bg:"#070711", surface:"#0D0D1E", card:"rgba(255,255,255,0.04)", cardHover:"rgba(255,255,255,0.07)",
  border:"rgba(255,255,255,0.08)", accent:"#C8FF00", accentDim:"rgba(200,255,0,0.09)",
  accentBdr:"rgba(200,255,0,0.28)", orange:"#FF6B35", green:"#4ADE80", purple:"#7C3AED",
  text:"#F0F0F8", muted:"rgba(240,240,248,0.5)", dim:"rgba(240,240,248,0.25)",
};

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
@keyframes fadeUp   {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin     {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes pulse2   {0%,100%{opacity:1}50%{opacity:0.35}}
@keyframes meshDrift{0%,100%{transform:scale(1) translate(0,0)}40%{transform:scale(1.05) translate(-1.5%,1%)}70%{transform:scale(0.97) translate(1.5%,-0.5%)}}
@keyframes pop      {from{opacity:0;transform:translateY(-8px) scale(0.88)}to{opacity:1;transform:translateY(0) scale(1)}}
.au  {animation:fadeUp 0.38s ease forwards}
.au1 {animation:fadeUp 0.38s 0.07s ease both}
.au2 {animation:fadeUp 0.38s 0.14s ease both}
.au3 {animation:fadeUp 0.38s 0.21s ease both}
.au4 {animation:fadeUp 0.38s 0.28s ease both}
input,textarea{
  background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
  border-radius:12px;color:#F0F0F8;font-family:'Plus Jakarta Sans',sans-serif;
  font-size:14px;padding:13px 16px;width:100%;outline:none;transition:border-color 0.2s;
}
input:focus,textarea:focus{border-color:#C8FF00;}
input::placeholder,textarea::placeholder{color:rgba(240,240,248,0.22);}
textarea{resize:vertical;line-height:1.65;}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-thumb{background:rgba(200,255,0,0.22);border-radius:2px;}
`;

// ═══════════════════════════════════════════════════════
// INFRASTRUCTURE — Services
// ═══════════════════════════════════════════════════════

const AnalyticsService = {
  async track(type, payload = {}) {
    try {
      const key = `evt:${Date.now()}:${Math.random().toString(36).slice(2,8)}`;
      await window.storage.set(key, JSON.stringify({ type, ...payload, ts: Date.now(), h: new Date().getHours(), dow: new Date().getDay() }), true);
    } catch {}
  },
  async loadAll() {
    try {
      const { keys = [] } = await window.storage.list("evt:", true) || {};
      const events = [];
      for (const k of keys.slice(-600)) {
        try { const r = await window.storage.get(k, true); if (r?.value) events.push(JSON.parse(r.value)); } catch {}
      }
      return events;
    } catch { return []; }
  },
};

const SessionService = {
  async incrementVisits() {
    try { const r = await window.storage.get("q:v"); const v = parseInt(r?.value||"0")+1; await window.storage.set("q:v", String(v)); return v; } catch { return 1; }
  },
  async getMode() {
    try { const r = await window.storage.get("q:mode"); return r?.value || null; } catch { return null; }
  },
  async saveMode(m) { try { await window.storage.set("q:mode", m); } catch {} },
};

// ── API Service — reads key from environment variable ──
const PromptGeneratorService = {
  buildSystem({ mode, tool, tone, technique, outputFormat, chainOfThought, fewShot, constraints }) {
    const toolStr = tool || "any AI tool";

    if (mode === "novice") return `You are a friendly AI prompt expert. Create a clear, simple, easy-to-use prompt for someone who is new to AI tools.
The prompt MUST: start with "You are a helpful...", use plain language, include a clear single task, specify output format, be immediately copy-paste ready, optimized for ${toolStr}.
Return ONLY valid JSON: {"prompt":"...","title":"max 6 words","tips":["tip1","tip2","tip3"],"whyItWorks":"one sentence","complexity":"beginner"}`;

    if (mode === "professional") return `You are an expert prompt engineer. Generate a professional-grade prompt using advanced best practices.
Include: strong expert role with credentials, layered context (situation+background+objective), explicit output format (${outputFormat||"structured"}), quality controls, constraints, edge case handling, tone: ${tone}, optimized for ${toolStr}.
Return ONLY valid JSON: {"prompt":"...","title":"max 6 words","tips":["tip1","tip2","tip3"],"whyItWorks":"one sentence","complexity":"intermediate"}`;

    const techMap = {
      zero_shot:"Zero-Shot Instruction", few_shot:"Few-Shot Learning (include 2-3 worked examples)",
      cot:"Chain-of-Thought (force step-by-step reasoning)", role:"Deep Expert Persona",
      step_back:"Step-Back Prompting (abstract first, then apply)", tot:"Tree-of-Thought (explore multiple solution branches)", meta:"Meta-Prompting",
    };

    return `You are a master prompt engineer. Generate an expert-level prompt using the ${techMap[technique]||"Chain-of-Thought"} technique.
MANDATORY: metacognitive priming, hierarchical instruction structure, ${chainOfThought?"chain-of-thought induction":"direct instruction"}, ${fewShot?"few-shot scaffolding with [EXAMPLE] slots":"zero-shot formulation"}, output format: ${outputFormat||"structured"}, anti-hallucination guardrails, iterative refinement hook, ${constraints?`constraints: ${constraints}`:"domain-specific constraints"}, tone: ${tone}, optimized for ${toolStr}.
Return ONLY valid JSON: {"prompt":"...","title":"max 6 words","tips":["tip1","tip2","tip3"],"whyItWorks":"one sentence","complexity":"advanced","technique":"${technique||"cot"}"}`;
  },

  async generate(inputs) {
    const system = this.buildSystem(inputs);
    const { category, goal, audience, tool, tone, outputFormat, constraints, mode } = inputs;

    // Reads API key from environment variable (set in .env file)
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content: `Category: ${category}\nGoal: ${goal}\nAudience: ${audience||"general"}\nTool: ${tool||"any"}\nTone: ${tone}${outputFormat?`\nFormat: ${outputFormat}`:""}${constraints?`\nConstraints: ${constraints}`:""}` }],
      }),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    const raw = data.content?.[0]?.text || "{}";
    try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); }
    catch { return { prompt: raw, title: "Your Prompt", tips: [], whyItWorks: "", complexity: mode === "expert" ? "advanced" : "intermediate" }; }
  },
};

// ═══════════════════════════════════════════════════════
// APPLICATION — Use-Case Hooks
// ═══════════════════════════════════════════════════════

function useGeneratePrompt() {
  const [state, setState] = useState({ loading: false, result: null, error: null });
  const generate = useCallback(async (inputs) => {
    setState({ loading: true, result: null, error: null });
    const t0 = Date.now();
    try {
      const result = await PromptGeneratorService.generate(inputs);
      setState({ loading: false, result, error: null });
      await AnalyticsService.track("generate", { category: inputs.category, tool: inputs.tool, tone: inputs.tone, mode: inputs.mode, goalLen: inputs.goal?.length || 0, hasAudience: !!inputs.audience, ms: Date.now() - t0 });
    } catch (e) {
      setState({ loading: false, result: null, error: e.message || "Generation failed. Please try again." });
    }
  }, []);
  return { ...state, generate, reset: () => setState({ loading: false, result: null, error: null }) };
}

function useAdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    const events = await AnalyticsService.loadAll();
    const gens = events.filter(e => e.type === "generate");
    const visits = events.filter(e => e.type === "visit");
    const copies = events.filter(e => e.type === "copy");
    const byCategory={}, byTool={}, byTone={}, byMode={};
    const byHour = Array(24).fill(0);
    let totalGoalLen=0, totalMs=0;
    for (const e of gens) {
      if (e.category) byCategory[e.category]=(byCategory[e.category]||0)+1;
      if (e.tool)     byTool[e.tool]=(byTool[e.tool]||0)+1;
      if (e.tone)     byTone[e.tone]=(byTone[e.tone]||0)+1;
      if (e.mode)     byMode[e.mode]=(byMode[e.mode]||0)+1;
      if (e.h!==undefined) byHour[e.h]++;
      totalGoalLen+=e.goalLen||0; totalMs+=e.ms||0;
    }
    const avgGoalLen = gens.length ? Math.round(totalGoalLen/gens.length) : 0;
    setData({
      totalPrompts:gens.length, totalVisits:visits.length, totalCopies:copies.length,
      copyRate:gens.length?Math.round((copies.length/gens.length)*100):0,
      avgGoalLen, avgMs:gens.length?Math.round(totalMs/gens.length):0,
      peakHour:byHour.indexOf(Math.max(...byHour)),
      topCat:Object.entries(byCategory).sort((a,b)=>b[1]-a[1])[0]?.[0]||"N/A",
      topTool:Object.entries(byTool).sort((a,b)=>b[1]-a[1])[0]?.[0]||"N/A",
      engagementLevel:avgGoalLen>120?"High":avgGoalLen>50?"Medium":"Low",
      categories:Object.entries(byCategory).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),
      tools:Object.entries(byTool).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),
      modes:Object.entries(byMode).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),
      hourly:byHour.map((count,h)=>({h:`${h}h`,count})),
    });
    setLoading(false);
  }, []);
  return { data, loading, load };
}

// ═══════════════════════════════════════════════════════
// PRESENTATION — Shared Atoms
// ═══════════════════════════════════════════════════════

function Btn({ children, onClick, variant="primary", disabled, full, style:extra={} }) {
  const [hov, setHov] = useState(false);
  const base = { border:"none", cursor:disabled?"not-allowed":"pointer", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, transition:"all 0.18s ease", opacity:disabled?0.45:1, borderRadius:12, width:full?"100%":undefined, ...extra };
  const variants = {
    primary:   { background:C.accent, color:"#000", padding:"13px 28px", ...(hov&&!disabled?{transform:"translateY(-2px)",boxShadow:"0 8px 28px rgba(200,255,0,0.28)"}:{}) },
    secondary: { background:"transparent", color:hov&&!disabled?C.accent:C.text, padding:"12px 20px", border:`1px solid ${hov&&!disabled?C.accent:C.border}`, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500 },
    ghost:     { background:"transparent", color:hov?C.text:C.muted, padding:"8px 0", fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:400 },
  };
  return <button onClick={disabled?undefined:onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{...base,...variants[variant]}}>{children}</button>;
}

function Chip({ label, selected, onClick }) {
  const [hov,setHov]=useState(false);
  return <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ background:selected?C.accentDim:hov?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.04)", border:`1px solid ${selected?C.accentBdr:C.border}`, borderRadius:100, padding:"8px 16px", color:selected?C.accent:C.muted, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:selected?600:400, cursor:"pointer", transition:"all 0.15s ease" }}>{label}</button>;
}

function Label({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:C.dim, marginBottom:10, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{children}</div>;
}

function ProgressBar({ step, total }) {
  return <div style={{ display:"flex", gap:6, flex:1 }}>{Array.from({length:total}).map((_,i)=><div key={i} style={{ height:3, flex:i===step?2:1, background:i<=step?C.accent:C.border, borderRadius:2, transition:"all 0.35s ease" }} />)}</div>;
}

function Card({ children, style:s={} }) {
  return <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:22, padding:"clamp(22px,4vw,40px)", ...s }}>{children}</div>;
}

function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer" }} onClick={()=>onChange(!value)}>
      <div style={{ width:40, height:22, borderRadius:11, background:value?C.accent:"rgba(255,255,255,0.1)", transition:"all 0.2s", position:"relative" }}>
        <div style={{ position:"absolute", top:3, left:value?20:3, width:16, height:16, borderRadius:8, background:value?"#000":"rgba(255,255,255,0.5)", transition:"all 0.2s" }} />
      </div>
      <span style={{ fontSize:13, color:C.muted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════════

function LandingView({ onStart, onAdmin }) {
  const [visits, setVisits] = useState(0);
  const [mode, setMode]     = useState("novice");
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimer = useRef(null);

  useEffect(() => {
    SessionService.incrementVisits().then(setVisits);
    SessionService.getMode().then(m => m && setMode(m));
    AnalyticsService.track("visit", {});
  }, []);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    if (next >= ADMIN_CLICKS_REQUIRED) { setLogoClicks(0); clearTimeout(clickTimer.current); onAdmin(); return; }
    setLogoClicks(next);
    clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => setLogoClicks(0), ADMIN_CLICK_WINDOW_MS);
  };

  const handleStart = () => { SessionService.saveMode(mode); onStart(mode); };
  const returning = visits > 1;
  const modeColors = { novice:C.green, professional:C.accent, expert:C.purple };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 20px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", animation:"meshDrift 20s ease-in-out infinite", background:`radial-gradient(ellipse 72% 55% at 18% 18%, rgba(200,255,0,0.055) 0%,transparent 60%),radial-gradient(ellipse 55% 44% at 84% 82%, rgba(255,107,53,0.045) 0%,transparent 55%),radial-gradient(ellipse 38% 38% at 55% 42%, rgba(124,58,237,0.032) 0%,transparent 65%)` }} />
      <div style={{ position:"relative", zIndex:1, textAlign:"center", maxWidth:760 }}>
        <div className="au" onClick={handleLogoClick} style={{ cursor:"default", marginBottom:36, userSelect:"none" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:32, filter:"drop-shadow(0 0 12px rgba(200,255,0,0.4))" }}>✦</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color:C.text, letterSpacing:"-0.02em" }}>Quill</span>
            {logoClicks > 2 && <span style={{ fontSize:10, color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{'·'.repeat(logoClicks)}</span>}
          </div>
        </div>
        <div className="au1" style={{ display:"inline-flex", alignItems:"center", gap:8, background:C.accentDim, border:`1px solid ${C.accentBdr}`, borderRadius:100, padding:"6px 18px", marginBottom:36 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:C.accent, display:"inline-block", animation:"pulse2 2s infinite" }} />
          <span style={{ fontSize:12, color:C.accent, fontWeight:600, letterSpacing:"0.06em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            {returning ? `Welcome back · session #${visits}` : "Sharp prompts. Maximum results."}
          </span>
        </div>
        <h1 className="au2" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(44px,9vw,80px)", lineHeight:1.02, marginBottom:20, color:C.text }}>
          Stop getting <span style={{ color:C.accent }}>average</span><br />AI results.
        </h1>
        <p className="au3" style={{ fontSize:"clamp(16px,2.4vw,19px)", color:C.muted, lineHeight:1.7, marginBottom:52, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:300 }}>
          Expert-engineered AI prompts in seconds.<br />Built for everyone — from curious beginners to seasoned developers.
        </p>
        <div className="au4" style={{ marginBottom:40 }}>
          <p style={{ fontSize:13, color:C.dim, marginBottom:16, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"0.06em", fontWeight:600 }}>I AM A...</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            {EXPERTISE_MODES.map(m => {
              const sel = mode === m.id;
              return (
                <div key={m.id} onClick={() => setMode(m.id)} style={{ background:sel?`${modeColors[m.id]}10`:"rgba(255,255,255,0.04)", border:`1px solid ${sel?modeColors[m.id]+"55":C.border}`, borderRadius:16, padding:"16px 20px", cursor:"pointer", transition:"all 0.2s", minWidth:160, textAlign:"left" }}>
                  <div style={{ fontSize:22, marginBottom:7 }}>{m.emoji}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:sel?modeColors[m.id]:C.text, marginBottom:3 }}>{m.label}</div>
                  <div style={{ fontSize:11, color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{m.desc}</div>
                  {sel && <div style={{ fontSize:10, color:modeColors[m.id], marginTop:6, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>{m.tagline}</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
          <Btn onClick={handleStart} style={{ padding:"16px 52px", fontSize:15 }}>Generate my prompt →</Btn>
        </div>
        <div style={{ display:"flex", gap:44, justifyContent:"center", marginTop:72 }}>
          {[["10+","AI Tools"],["3 Expertise","Levels"],["Free","Always"]].map(([val,lbl])=>(
            <div key={lbl} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.accent }}>{val}</div>
              <div style={{ fontSize:12, color:C.dim, marginTop:5, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{lbl}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:60, fontSize:11, color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>© 2025 Quill AI · Sharp prompts. Maximum results.</div>
      </div>
    </div>
  );
}

function WizardView({ mode, onComplete, onBack }) {
  const stepsCount = mode === "expert" ? 4 : 3;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ category:"", goal:"", audience:"", tool:"ChatGPT", tone:"professional", outputFormat:"", constraints:"", technique:"cot", chainOfThought:true, fewShot:false, mode });
  const up = (k,v) => setForm(f=>({...f,[k]:v}));
  const selectedCat = CATEGORIES.find(c=>c.id===form.category);
  const modeColor = { novice:C.green, professional:C.accent, expert:C.purple }[mode] || C.accent;
  const modeLabel = EXPERTISE_MODES.find(m=>m.id===mode)?.label || "Novice";

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 20px" }}>
      <div style={{ width:"100%", maxWidth:680 }}>
        <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:32 }}>
          <Btn variant="ghost" onClick={onBack}>← Home</Btn>
          <ProgressBar step={step} total={stepsCount} />
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap" }}>{step+1}/{stepsCount}</span>
            <span style={{ fontSize:11, background:`${modeColor}18`, border:`1px solid ${modeColor}44`, color:modeColor, borderRadius:100, padding:"2px 10px", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>{modeLabel}</span>
          </div>
        </div>
        <Card>
          {step===0 && (
            <div className="au">
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, marginBottom:6, color:C.text }}>What are you working on?</h2>
              <p style={{ color:C.muted, marginBottom:28, fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Pick the category closest to your goal.</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(135px,1fr))", gap:9 }}>
                {CATEGORIES.map(cat=>{
                  const sel=form.category===cat.id;
                  return <div key={cat.id} onClick={()=>{up("category",cat.id);setTimeout(()=>setStep(1),280);}} style={{ background:sel?C.accentDim:C.card, border:`1px solid ${sel?C.accentBdr:C.border}`, borderRadius:14, padding:"14px 10px", textAlign:"center", cursor:"pointer", transition:"all 0.2s", transform:sel?"scale(1.03)":"scale(1)" }} onMouseEnter={e=>{if(!sel)e.currentTarget.style.background=C.cardHover;}} onMouseLeave={e=>{if(!sel)e.currentTarget.style.background=C.card;}}>
                    <div style={{ fontSize:22, marginBottom:6 }}>{cat.emoji}</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:11, color:sel?C.accent:C.text, marginBottom:2 }}>{cat.label}</div>
                    <div style={{ fontSize:9, color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{cat.desc}</div>
                  </div>;
                })}
              </div>
            </div>
          )}
          {step===1 && (
            <div className="au">
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                {selectedCat && <span style={{ fontSize:24 }}>{selectedCat.emoji}</span>}
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Describe your goal</h2>
              </div>
              <p style={{ color:C.muted, marginBottom:28, fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {mode==="novice"?"Tell us what you want in plain English.":mode==="professional"?"The richer the context, the more powerful your prompt.":"Be precise — every detail shapes the prompt architecture."}
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                <div>
                  <Label>WHAT DO YOU WANT TO ACHIEVE? *</Label>
                  <textarea value={form.goal} onChange={e=>up("goal",e.target.value)} placeholder={mode==="novice"?"e.g. Help me write an email to my boss asking for a raise...":mode==="professional"?"e.g. Generate LinkedIn thought-leadership posts targeting B2B SaaS decision-makers...":"e.g. Construct a systematic framework for evaluating complex multi-stakeholder business problems..."} rows={mode==="expert"?6:5} autoFocus />
                  <div style={{ fontSize:11, color:form.goal.length<40?C.dim:form.goal.length<100?"rgba(200,255,0,0.5)":C.accent, marginTop:5, textAlign:"right", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {form.goal.length} chars {form.goal.length<40?"· add more for best results":form.goal.length<100?"· good, keep going":"· great depth ✓"}
                  </div>
                </div>
                <div>
                  <Label>TARGET AUDIENCE {mode==="novice"?"(optional)":"(recommended)"}</Label>
                  <input value={form.audience} onChange={e=>up("audience",e.target.value)} placeholder={mode==="novice"?"e.g. my manager, a 10-year-old...":"e.g. senior engineers, non-technical C-suite executives..."} />
                </div>
                {(mode==="professional"||mode==="expert") && (
                  <div>
                    <Label>OUTPUT FORMAT</Label>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                      {OUTPUT_FORMATS.map(f=><Chip key={f} label={f} selected={form.outputFormat===f} onClick={()=>up("outputFormat",form.outputFormat===f?"":f)} />)}
                    </div>
                  </div>
                )}
                {mode==="expert" && (
                  <div>
                    <Label>CONSTRAINTS & GUARDRAILS</Label>
                    <input value={form.constraints} onChange={e=>up("constraints",e.target.value)} placeholder="e.g. max 300 words, avoid passive voice, cite sources..." />
                  </div>
                )}
              </div>
              <div style={{ display:"flex", gap:12, marginTop:32 }}>
                <Btn variant="secondary" onClick={()=>setStep(0)}>← Back</Btn>
                <Btn onClick={()=>setStep(2)} disabled={!form.goal.trim()} style={{ flex:1 }}>Continue →</Btn>
              </div>
            </div>
          )}
          {step===2 && (
            <div className="au">
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, marginBottom:6, color:C.text }}>Tailor your prompt</h2>
              <p style={{ color:C.muted, marginBottom:28, fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Pick your AI tool and preferred voice.</p>
              <div style={{ display:"flex", flexDirection:"column", gap:26 }}>
                <div>
                  <Label>WHICH AI TOOL?</Label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {AI_TOOLS.map(t=><Chip key={t} label={t} selected={form.tool===t} onClick={()=>up("tool",t)} />)}
                  </div>
                </div>
                <div>
                  <Label>TONE</Label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {TONES.map(t=><Chip key={t.id} label={`${t.emoji} ${t.label}`} selected={form.tone===t.id} onClick={()=>up("tone",t.id)} />)}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:12, marginTop:32 }}>
                <Btn variant="secondary" onClick={()=>setStep(1)}>← Back</Btn>
                {mode==="expert"
                  ? <Btn onClick={()=>setStep(3)} disabled={!form.tool} style={{ flex:1 }}>Advanced Options →</Btn>
                  : <Btn onClick={()=>onComplete(form)} disabled={!form.tool} style={{ flex:1 }}>✨ Generate Prompt</Btn>
                }
              </div>
            </div>
          )}
          {step===3 && mode==="expert" && (
            <div className="au">
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, marginBottom:6, color:C.text }}>Prompt Engineering</h2>
              <p style={{ color:C.muted, marginBottom:28, fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Configure the underlying prompt architecture.</p>
              <div style={{ display:"flex", flexDirection:"column", gap:26 }}>
                <div>
                  <Label>TECHNIQUE</Label>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {PROMPT_TECHNIQUES.map(t=>{
                      const sel=form.technique===t.id;
                      return <div key={t.id} onClick={()=>up("technique",t.id)} style={{ background:sel?C.accentDim:C.card, border:`1px solid ${sel?C.accentBdr:C.border}`, borderRadius:12, padding:"12px 16px", cursor:"pointer", transition:"all 0.15s", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:sel?C.accent:C.text }}>{t.label}</span>
                          <span style={{ fontSize:11, color:C.dim, marginLeft:10, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{t.desc}</span>
                        </div>
                        {sel && <span style={{ color:C.accent }}>✓</span>}
                      </div>;
                    })}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <Toggle value={form.chainOfThought} onChange={v=>up("chainOfThought",v)} label="Include chain-of-thought induction" />
                  <Toggle value={form.fewShot}       onChange={v=>up("fewShot",v)}       label="Add few-shot example scaffolding" />
                </div>
              </div>
              <div style={{ display:"flex", gap:12, marginTop:32 }}>
                <Btn variant="secondary" onClick={()=>setStep(2)}>← Back</Btn>
                <Btn onClick={()=>onComplete(form)} disabled={!form.tool} style={{ flex:1 }}>✨ Generate Expert Prompt</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function LoadingView({ mode }) {
  const msgs = { novice:["Getting things ready...","Building your prompt...","Almost done..."], professional:["Analyzing your goal...","Structuring prompt layers...","Finalizing..."], expert:["Parsing requirements...","Architecting structure...","Applying techniques...","Optimizing..."] }[mode]||["Generating..."];
  const [idx,setIdx]=useState(0); const [dots,setDots]=useState(".");
  useEffect(()=>{ const t1=setInterval(()=>setIdx(i=>(i+1)%msgs.length),1700); const t2=setInterval(()=>setDots(d=>d.length>=3?".":d+"."),420); return()=>{clearInterval(t1);clearInterval(t2);}; },[]);
  const rc = { novice:C.green, professional:C.accent, expert:C.purple }[mode]||C.accent;
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:38 }}>
      <div style={{ position:"relative", width:96, height:96 }}>
        <div style={{ position:"absolute", inset:0,  borderRadius:"50%", border:`2.5px solid ${C.border}`, borderTopColor:rc, animation:"spin 0.9s linear infinite" }} />
        <div style={{ position:"absolute", inset:10, borderRadius:"50%", border:"2px solid transparent", borderTopColor:`${rc}55`, animation:"spin 1.5s linear infinite reverse" }} />
        <div style={{ position:"absolute", inset:32, borderRadius:"50%", background:C.accentDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>✨</div>
      </div>
      <div style={{ textAlign:"center" }}>
        <p style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:rc, minHeight:28 }}>{msgs[idx]}</p>
        <p style={{ color:C.dim, marginTop:8, fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Engineering your prompt{dots}</p>
      </div>
    </div>
  );
}

function ResultView({ result, form, onNew }) {
  const [copied,setCopied]=useState(false);
  const handleCopy=()=>{ const fb=()=>{const el=document.createElement("textarea");el.value=result.prompt;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);}; (navigator.clipboard?.writeText(result.prompt)||Promise.reject()).catch(fb); setCopied(true); AnalyticsService.track("copy",{category:form?.category,tool:form?.tool,mode:form?.mode}); setTimeout(()=>setCopied(false),2600); };
  const cm={beginner:{color:C.green,label:"Beginner Friendly"},intermediate:{color:C.accent,label:"Intermediate"},advanced:{color:C.purple,label:"Advanced"}}[result.complexity]||{color:C.accent,label:"Intermediate"};
  const mc={novice:C.green,professional:C.accent,expert:C.purple}[form?.mode]||C.accent;
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"32px 20px", display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ width:"100%", maxWidth:760 }}>
        <div className="au" style={{ display:"flex", alignItems:"center", marginBottom:30 }}>
          <Btn variant="ghost" onClick={onNew}>← New Prompt</Btn>
          <div style={{ flex:1 }} />
          <div style={{ display:"flex", gap:8 }}>
            {form?.mode && <span style={{ background:`${mc}18`, border:`1px solid ${mc}44`, color:mc, borderRadius:100, padding:"4px 12px", fontSize:11, fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{EXPERTISE_MODES.find(m=>m.id===form.mode)?.label}</span>}
            <span style={{ background:`${cm.color}18`, border:`1px solid ${cm.color}44`, color:cm.color, borderRadius:100, padding:"4px 12px", fontSize:11, fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{cm.label}</span>
          </div>
        </div>
        <div className="au1">
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, marginBottom:6, color:C.text }}>{result.title}</h2>
          {result.whyItWorks && <p style={{ color:C.muted, fontSize:14, marginBottom:28, fontFamily:"'Plus Jakarta Sans',sans-serif", fontStyle:"italic" }}>{result.whyItWorks}</p>}
        </div>
        {result.technique && <div className="au2" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.3)", borderRadius:100, padding:"5px 16px", marginBottom:20 }}><span style={{ fontSize:12, color:C.purple, fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>⚡ {PROMPT_TECHNIQUES.find(t=>t.id===result.technique)?.label||result.technique} applied</span></div>}
        <div className="au2" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"26px 28px 22px", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <Label>YOUR OPTIMIZED PROMPT</Label>
            <div style={{ position:"relative" }}>
              {copied && <span style={{ position:"absolute", top:-34, right:0, whiteSpace:"nowrap", background:C.accent, color:"#000", fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:6, animation:"pop 0.25s ease", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>✓ Copied!</span>}
              <button onClick={handleCopy} style={{ background:copied?C.accentDim:"rgba(255,255,255,0.06)", border:`1px solid ${copied?C.accentBdr:C.border}`, color:copied?C.accent:C.muted, borderRadius:8, padding:"6px 16px", fontSize:12, cursor:"pointer", transition:"all 0.18s ease", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500 }}>{copied?"✓ Copied":"Copy"}</button>
            </div>
          </div>
          <p style={{ lineHeight:1.9, color:C.text, fontSize:14.5, whiteSpace:"pre-wrap", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{result.prompt}</p>
        </div>
        {result.tips?.length>0 && (
          <div className="au3" style={{ background:C.accentDim, border:"1px solid rgba(200,255,0,0.14)", borderRadius:16, padding:"20px 24px", marginBottom:22 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:11, letterSpacing:"0.09em", color:C.accent, marginBottom:14 }}>PRO TIPS</div>
            {result.tips.map((tip,i)=>(
              <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:10 }}>
                <span style={{ color:C.accent, fontWeight:800, flexShrink:0, fontSize:13 }}>{i+1}.</span>
                <span style={{ fontSize:13.5, color:C.text, lineHeight:1.65, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{tip}</span>
              </div>
            ))}
          </div>
        )}
        <div className="au4" style={{ display:"flex", gap:12 }}>
          <Btn onClick={handleCopy} style={{ flex:1 }}>{copied?"✓ Copied to clipboard":"Copy Prompt"}</Btn>
          <Btn variant="secondary" onClick={onNew}>New Prompt</Btn>
        </div>
      </div>
    </div>
  );
}

function AdminLoginView({ onLogin, onBack }) {
  const [pass,setPass]=useState(""); const [error,setError]=useState(false);
  const attempt=()=>{ if(pass===ADMIN_PASS){onLogin();}else{setError(true);setTimeout(()=>setError(false),3000);} };
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:24, padding:"50px 44px", width:"100%", maxWidth:430, textAlign:"center" }}>
        <div style={{ fontSize:46, marginBottom:20 }}>🔐</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, marginBottom:8, color:C.text }}>Quill Admin</h2>
        <p style={{ color:C.muted, marginBottom:34, fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Enter your password to access analytics.</p>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="Admin password" autoFocus style={{ marginBottom:error?8:18, borderColor:error?"#FF6B6B":undefined }} />
        {error && <p style={{ color:"#FF6B6B", fontSize:13, marginBottom:14, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Incorrect password.</p>}
        <Btn onClick={attempt} full style={{ padding:"14px" }}>Access Dashboard</Btn>
        <Btn variant="secondary" onClick={onBack} full style={{ marginTop:10, padding:"13px" }}>← Back</Btn>
      </div>
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const { data, loading, load } = useAdminAnalytics();
  useEffect(()=>{ load(); },[]);
  const tt={contentStyle:{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12,fontFamily:"'Plus Jakarta Sans',sans-serif"}};
  const SC=({label,value,sub,color})=>(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 18px"}}><div style={{fontSize:10,fontWeight:700,letterSpacing:"0.09em",color:C.dim,marginBottom:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{label}</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:34,fontWeight:800,color:color||C.accent,lineHeight:1}}>{value}</div>{sub&&<div style={{fontSize:12,color:C.dim,marginTop:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{sub}</div>}</div>);
  const ST=({children})=><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:C.text,marginBottom:16}}>{children}</div>;
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"32px 20px" }}>
      <div style={{ maxWidth:980, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:40, flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}><span style={{ fontSize:20 }}>✦</span><h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.text }}>Quill Analytics</h1></div>
            <p style={{ color:C.muted, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Psychology signals · zero personal data collected</p>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn variant="secondary" onClick={load} style={{ padding:"10px 18px" }}>↻ Refresh</Btn>
            <Btn variant="secondary" onClick={onLogout} style={{ padding:"10px 18px" }}>Sign out</Btn>
          </div>
        </div>
        {loading && <div style={{ textAlign:"center", padding:"80px 0", color:C.muted }}>Loading analytics...</div>}
        {!loading&&data&&data.totalPrompts===0 && <div style={{ textAlign:"center", padding:"80px 0" }}><div style={{ fontSize:46, marginBottom:16 }}>📭</div><p style={{ color:C.muted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>No data yet. Generate some prompts to see insights.</p></div>}
        {data&&data.totalPrompts>0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:13 }}>
              <SC label="TOTAL PROMPTS" value={data.totalPrompts} />
              <SC label="PAGE VISITS" value={data.totalVisits} color={C.muted} />
              <SC label="COPIED PROMPTS" value={data.totalCopies} />
              <SC label="COPY RATE" value={`${data.copyRate}%`} sub="adoption signal" color={data.copyRate>60?C.green:C.accent} />
              <SC label="AVG CONTEXT DEPTH" value={`${data.avgGoalLen} chr`} />
              <SC label="AVG GEN TIME" value={`${(data.avgMs/1000).toFixed(1)}s`} color={C.orange} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))", gap:18 }}>
              {data.categories.length>0&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:24}}><ST>Category Distribution</ST><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={data.categories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3} stroke="none">{data.categories.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}</Pie><Tooltip {...tt} /></PieChart></ResponsiveContainer><div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>{data.categories.map((c,i)=><span key={c.name} style={{fontSize:11,color:CHART_COLORS[i%CHART_COLORS.length],background:CHART_COLORS[i%CHART_COLORS.length]+"18",border:`1px solid ${CHART_COLORS[i%CHART_COLORS.length]}30`,padding:"2px 10px",borderRadius:100,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{c.name}: {c.value}</span>)}</div></div>}
              {data.tools.length>0&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:24}}><ST>AI Tool Preferences</ST><ResponsiveContainer width="100%" height={200}><BarChart data={data.tools} margin={{top:0,right:0,bottom:0,left:-28}}><XAxis dataKey="name" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false} /><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} /><Tooltip {...tt} /><Bar dataKey="value" fill={C.accent} radius={[5,5,0,0]} /></BarChart></ResponsiveContainer></div>}
            </div>
            {data.modes.length>0&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:24}}><ST>Expertise Level Distribution</ST><p style={{color:C.dim,fontSize:12,marginTop:-10,marginBottom:18,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Who your users are — critical for product positioning</p><ResponsiveContainer width="100%" height={130}><BarChart data={data.modes} margin={{top:0,right:20,bottom:0,left:-20}}><XAxis dataKey="name" tick={{fill:C.muted,fontSize:12}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.dim,fontSize:10}} axisLine={false} tickLine={false}/><Tooltip {...tt}/><Bar dataKey="value" radius={[5,5,0,0]}>{data.modes.map((e,i)=><Cell key={i} fill={e.name==="novice"?C.green:e.name==="professional"?C.accent:C.purple}/>)}</Bar></BarChart></ResponsiveContainer></div>}
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:24}}><ST>Hourly Activity</ST><p style={{color:C.dim,fontSize:12,marginTop:-10,marginBottom:18,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Peak: {data.peakHour}:00–{(data.peakHour+1)%24}:00</p><ResponsiveContainer width="100%" height={130}><BarChart data={data.hourly} margin={{top:0,right:0,bottom:0,left:-28}}><XAxis dataKey="h" tick={{fill:C.dim,fontSize:10}} axisLine={false} tickLine={false} interval={3}/><YAxis tick={{fill:C.dim,fontSize:10}} axisLine={false} tickLine={false}/><Tooltip {...tt}/><Bar dataKey="count" fill={C.orange} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════

export default function App() {
  const [view,setView]         = useState("landing");
  const [mode,setMode]         = useState("novice");
  const [formData,setFormData] = useState(null);
  const { loading,result,error,generate,reset } = useGeneratePrompt();

  useEffect(()=>{
    const el=document.createElement("style");
    el.id="quill-css"; el.innerHTML=GLOBAL_CSS;
    document.head.appendChild(el);
    return()=>document.getElementById("quill-css")?.remove();
  },[]);

  const handleWizardComplete=async(form)=>{ setFormData(form); setView("generating"); await generate(form); setView("result"); };
  const goHome=()=>{ reset(); setView("landing"); };
  const goWizard=()=>{ reset(); setView("wizard"); };

  if(view==="landing")    return <><LandingView   onStart={m=>{setMode(m);setView("wizard");}} onAdmin={()=>setView("adminLogin")} /><Analytics /></>;
  if(view==="wizard")     return <><WizardView    mode={mode} onComplete={handleWizardComplete} onBack={goHome} /><Analytics /></>;
  if(view==="generating"||loading) return <><LoadingView mode={formData?.mode||mode} /><Analytics /></>;
  if(view==="result"&&result)      return <><ResultView result={result} form={formData} onNew={goWizard} /><Analytics /></>;
  if(view==="adminLogin") return <><AdminLoginView onLogin={()=>setView("admin")} onBack={goHome} /><Analytics /></>;
  if(view==="admin")      return <><AdminDashboard onLogout={goHome} /><Analytics /></>;
  if(error) return <><div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:20}}><div style={{fontSize:46}}>⚠️</div><p style={{color:"#FF6B6B",fontFamily:"'Plus Jakarta Sans',sans-serif",textAlign:"center"}}>{error}</p><Btn onClick={goWizard}>← Try Again</Btn></div><Analytics /></>;
  return <Analytics />;
}
