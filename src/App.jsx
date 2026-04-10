import { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ═══════════════════════════════════════════════════════
// DOMAIN — Constants
// ═══════════════════════════════════════════════════════

const ADMIN_PASS = "PromptMaster2024";
const ADMIN_CLICKS_REQUIRED = 7;
const ADMIN_CLICK_WINDOW_MS = 3000;
const MAX_HISTORY = 50;
const MAX_FREE_PER_DAY = 10;

const DARK_THEME = {
  bg:"#070711", surface:"#0D0D1E", card:"rgba(255,255,255,0.04)", cardHover:"rgba(255,255,255,0.07)",
  border:"rgba(255,255,255,0.08)", accent:"#C8FF00", accentDim:"rgba(200,255,0,0.09)",
  accentBdr:"rgba(200,255,0,0.28)", orange:"#FF6B35", green:"#4ADE80", purple:"#7C3AED",
  text:"#F0F0F8", muted:"rgba(240,240,248,0.5)", dim:"rgba(240,240,248,0.25)",
  inputBg:"rgba(255,255,255,0.05)", inputBorder:"rgba(255,255,255,0.08)",
  ratingOff:"rgba(255,255,255,0.15)",
};
const LIGHT_THEME = {
  bg:"#F2F3F7", surface:"#FFFFFF", card:"rgba(0,0,0,0.03)", cardHover:"rgba(0,0,0,0.055)",
  border:"rgba(0,0,0,0.09)", accent:"#5A8A00", accentDim:"rgba(90,138,0,0.08)",
  accentBdr:"rgba(90,138,0,0.3)", orange:"#D95A1A", green:"#16A34A", purple:"#6D28D9",
  text:"#14141F", muted:"rgba(20,20,31,0.55)", dim:"rgba(20,20,31,0.32)",
  inputBg:"rgba(0,0,0,0.04)", inputBorder:"rgba(0,0,0,0.1)",
  ratingOff:"rgba(0,0,0,0.15)",
};

const ThemeCtx = createContext(DARK_THEME);
const useC = () => useContext(ThemeCtx);

const EXPERTISE_MODES = [
  { id:"novice",       label:"Novice",       emoji:"🌱", desc:"I'm new to AI tools",          tagline:"We'll guide you every step" },
  { id:"professional", label:"Professional", emoji:"💼", desc:"I use AI tools regularly",     tagline:"More control, better output" },
  { id:"expert",       label:"Expert",       emoji:"🧠", desc:"I'm a power user / developer", tagline:"Full prompt engineering control" },
];

const CATEGORIES = [
  { id:"content",  label:"Content Creation", emoji:"✍️",  desc:"Blogs, social & copy"    },
  { id:"code",     label:"Code & Dev",        emoji:"💻",  desc:"Debug, build & review"   },
  { id:"data",     label:"Data Analysis",     emoji:"📊",  desc:"Insights & reports"      },
  { id:"research", label:"Research",          emoji:"🔍",  desc:"Deep dives & summaries"  },
  { id:"creative", label:"Creative Writing",  emoji:"🎨",  desc:"Stories, scripts & more" },
  { id:"business", label:"Business",          emoji:"💼",  desc:"Strategy & planning"     },
  { id:"learning", label:"Learning",          emoji:"📚",  desc:"Explain & teach me"      },
  { id:"image",    label:"Image Gen",         emoji:"🖼️",  desc:"Midjourney, DALL-E"      },
  { id:"sales",    label:"Sales & CRM",       emoji:"🤝",  desc:"Pitches & outreach"      },
  { id:"legal",    label:"Legal & Compliance",emoji:"⚖️",  desc:"Docs & contracts"        },
  { id:"medical",  label:"Medical / Science", emoji:"🔬",  desc:"Research & summaries"    },
  { id:"design",   label:"Design & UX",       emoji:"✦",   desc:"Briefs, feedback, specs"  },
];

// Dynamic config per category — drives wizard intelligence
const CATEGORY_CONFIG = {
  content:  { tones:["professional","creative","persuasive","casual"],        formats:["Essay prose","Bullet points","Numbered steps","Executive summary","Markdown report"], tools:["ChatGPT","Claude","Gemini","Copilot"],           techniques:["role","few_shot","meta"],       audiences:["marketing managers","startup founders","social media followers","general readers"], placeholders:{ novice:"e.g. Write a blog post about healthy eating for beginners...", professional:"e.g. Write a LinkedIn series targeting SaaS founders that drives demo bookings...", expert:"e.g. Build a content framework for a B2B SaaS brand targeting enterprise CTOs across 3 funnel stages..." } },
  code:     { tones:["technical","professional","concise"],                    formats:["Code block","Numbered steps","Markdown report","JSON structure"],                    tools:["Claude","Copilot","ChatGPT","Gemini"],          techniques:["cot","few_shot","zero_shot"],   audiences:["senior developers","junior engineers","technical reviewers","open-source contributors"], placeholders:{ novice:"e.g. Help me fix a bug in my Python code...", professional:"e.g. Review my React component for performance issues and suggest optimisations...", expert:"e.g. Design a fault-tolerant microservices architecture with circuit breakers and distributed tracing..." } },
  data:     { tones:["professional","technical","academic","concise"],         formats:["Table / Matrix","Markdown report","Executive summary","JSON structure","Bullet points"], tools:["ChatGPT","Claude","Gemini","Perplexity"],    techniques:["cot","step_back","tot"],        audiences:["C-suite executives","data analysts","non-technical stakeholders","investors"], placeholders:{ novice:"e.g. Help me understand what this spreadsheet data is telling me...", professional:"e.g. Analyse customer churn patterns in my SaaS data and identify the top 3 contributing factors...", expert:"e.g. Design a causal inference framework to separate correlation from causation in our multi-variate conversion dataset..." } },
  research: { tones:["academic","professional","technical"],                   formats:["Markdown report","Executive summary","Essay prose","Numbered steps","Q&A format"],   tools:["Perplexity","Claude","ChatGPT","Gemini"],       techniques:["step_back","tot","cot"],        audiences:["academic peers","industry professionals","policymakers","general readers"], placeholders:{ novice:"e.g. Summarise the key facts about climate change for me...", professional:"e.g. Research the competitive landscape for AI productivity tools and identify market gaps...", expert:"e.g. Conduct a systematic literature review of transformer attention mechanisms and synthesise the key findings on efficiency improvements since 2022..." } },
  creative: { tones:["creative","casual","persuasive"],                        formats:["Essay prose","Bullet points","Q&A format","Numbered steps"],                         tools:["ChatGPT","Claude","Gemini"],                    techniques:["role","meta","zero_shot"],      audiences:["young adults","fantasy readers","screenplay producers","fiction enthusiasts"], placeholders:{ novice:"e.g. Write me a short story about a robot who learns to feel emotions...", professional:"e.g. Write the first chapter of a literary thriller set in Lagos in 2035 with unreliable narration...", expert:"e.g. Construct a non-linear narrative structure using a fragmented timeline to explore collective trauma through multiple unreliable first-person voices..." } },
  business: { tones:["professional","persuasive","concise","academic"],        formats:["Executive summary","Bullet points","Table / Matrix","Numbered steps","Markdown report"], tools:["ChatGPT","Claude","Gemini","Copilot"],       techniques:["cot","step_back","role"],       audiences:["investors","board members","department heads","potential partners"], placeholders:{ novice:"e.g. Help me write a business plan for my small bakery...", professional:"e.g. Create a go-to-market strategy for a B2B SaaS product targeting mid-market HR departments...", expert:"e.g. Build a unit economics model and growth sensitivity analysis for a marketplace business with network effects and negative churn..." } },
  learning: { tones:["casual","professional","academic"],                      formats:["Numbered steps","Q&A format","Bullet points","Essay prose"],                         tools:["ChatGPT","Claude","Gemini","Perplexity"],       techniques:["few_shot","role","cot"],        audiences:["complete beginners","intermediate learners","students","adult professionals"], placeholders:{ novice:"e.g. Explain how the internet works in simple terms...", professional:"e.g. Create a 4-week learning curriculum for mastering SQL with practical exercises...", expert:"e.g. Design a Socratic dialogue framework that guides an advanced learner to independently derive the key principles of quantum entanglement..." } },
  image:    { tones:["creative","concise","technical"],                        formats:["Bullet points","Numbered steps","Q&A format"],                                        tools:["Midjourney","DALL-E","ChatGPT","Gemini"],       techniques:["role","zero_shot","few_shot"],  audiences:["art directors","creative directors","brand managers","game designers"], placeholders:{ novice:"e.g. Create a picture of a cosy coffee shop on a rainy day...", professional:"e.g. Generate a series of product mockup images for a minimalist skincare brand with a clean, editorial aesthetic...", expert:"e.g. Design a high-fashion editorial concept with cinematic lighting ratios, specific colour grading (teal-orange LUT), and environmental storytelling for a luxury fragrance campaign..." } },
  sales:    { tones:["persuasive","professional","casual"],                    formats:["Bullet points","Executive summary","Numbered steps","Essay prose"],                   tools:["ChatGPT","Claude","Gemini","Copilot"],          techniques:["role","few_shot","cot"],        audiences:["enterprise decision-makers","SME owners","procurement teams","mid-market managers"], placeholders:{ novice:"e.g. Help me write an email to a potential customer about my product...", professional:"e.g. Write a cold outreach sequence targeting CFOs at Series B startups with a financial ROI angle...", expert:"e.g. Design a multi-touch sales enablement framework with persona-specific messaging for each stage of a complex enterprise sales cycle..." } },
  legal:    { tones:["professional","academic","technical"],                   formats:["Essay prose","Numbered steps","Executive summary","Markdown report"],                 tools:["Claude","ChatGPT","Gemini"],                    techniques:["cot","step_back","role"],       audiences:["legal counsel","compliance officers","C-suite executives","contract managers"], placeholders:{ novice:"e.g. Explain what an NDA is and what it means for me...", professional:"e.g. Review this SaaS subscription agreement and flag any unusual liability clauses...", expert:"e.g. Analyse the cross-jurisdictional compliance implications of GDPR Article 46 transfer mechanisms for a US-incorporated SaaS company processing EU healthcare data..." } },
  medical:  { tones:["professional","academic","technical"],                   formats:["Markdown report","Essay prose","Numbered steps","Executive summary"],                 tools:["Claude","ChatGPT","Perplexity"],                techniques:["cot","step_back","tot"],        audiences:["clinical researchers","healthcare practitioners","patients","medical students"], placeholders:{ novice:"e.g. Explain the difference between Type 1 and Type 2 diabetes in simple terms...", professional:"e.g. Summarise the current evidence for intermittent fasting in managing metabolic syndrome...", expert:"e.g. Synthesise the mechanistic pathway evidence for GLP-1 receptor agonists in neuroinflammation modulation beyond their established glycaemic role..." } },
  design:   { tones:["creative","professional","technical"],                   formats:["Bullet points","Numbered steps","Markdown report","Q&A format"],                     tools:["ChatGPT","Claude","Gemini","Midjourney"],       techniques:["role","few_shot","meta"],       audiences:["product managers","UX leads","stakeholders","engineering teams"], placeholders:{ novice:"e.g. Help me design a simple logo for my business...", professional:"e.g. Write a UX audit brief for an e-commerce checkout flow with high abandonment rates...", expert:"e.g. Design a design system critique framework using jobs-to-be-done theory to evaluate component-level decisions against product strategy..." } },
};

const AI_TOOLS = ["ChatGPT","Claude","Gemini","Midjourney","DALL-E","Copilot","Perplexity","Llama","Grok","Other"];
const TONES = [
  { id:"professional",label:"Professional",emoji:"👔" },
  { id:"casual",      label:"Casual",      emoji:"😊" },
  { id:"creative",    label:"Creative",    emoji:"🎭" },
  { id:"technical",   label:"Technical",   emoji:"⚙️" },
  { id:"persuasive",  label:"Persuasive",  emoji:"🎯" },
  { id:"academic",    label:"Academic",    emoji:"🎓" },
  { id:"concise",     label:"Concise",     emoji:"⚡" },
];
const OUTPUT_FORMATS = ["Bullet points","Numbered steps","Essay prose","Table / Matrix","JSON structure","Code block","Q&A format","Executive summary","Markdown report"];
const PROMPT_TECHNIQUES = [
  { id:"zero_shot", label:"Zero-Shot",        desc:"Direct instruction, no examples" },
  { id:"few_shot",  label:"Few-Shot",         desc:"Guide with 2–3 worked examples" },
  { id:"cot",       label:"Chain-of-Thought", desc:"Force step-by-step reasoning" },
  { id:"role",      label:"Expert Persona",   desc:"Deep role-play with a specific expert" },
  { id:"step_back", label:"Step-Back",        desc:"Abstract first, then apply" },
  { id:"tot",       label:"Tree-of-Thought",  desc:"Explore multiple reasoning paths" },
  { id:"meta",      label:"Meta-Prompting",   desc:"AI designs its own approach first" },
];
const CHART_COLORS = ["#C8FF00","#FF6B35","#7C3AED","#06B6D4","#F59E0B","#EC4899","#10B981","#EF4444"];

const CSS = (isDark) => `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
@keyframes fadeUp   {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin     {to{transform:rotate(360deg)}}
@keyframes pulse2   {0%,100%{opacity:1}50%{opacity:.35}}
@keyframes meshDrift{0%,100%{transform:scale(1)}50%{transform:scale(1.04) translate(-1%,.8%)}}
@keyframes pop      {from{opacity:0;transform:translateY(-6px) scale(.9)}to{opacity:1;transform:none}}
@keyframes slideIn  {from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
.au {animation:fadeUp .35s ease both}
.au1{animation:fadeUp .35s .07s ease both}
.au2{animation:fadeUp .35s .14s ease both}
.au3{animation:fadeUp .35s .21s ease both}
.au4{animation:fadeUp .35s .28s ease both}
body{background:${isDark?"#070711":"#F2F3F7"};transition:background .3s}
input,textarea{
  background:${isDark?"rgba(255,255,255,.05)":"rgba(0,0,0,.04)"};
  border:1px solid ${isDark?"rgba(255,255,255,.08)":"rgba(0,0,0,.1)"};
  border-radius:12px;color:${isDark?"#F0F0F8":"#14141F"};
  font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;padding:13px 16px;
  width:100%;outline:none;transition:border-color .2s,background .3s;
}
input:focus,textarea:focus{border-color:${isDark?"#C8FF00":"#5A8A00"};}
input::placeholder,textarea::placeholder{color:${isDark?"rgba(240,240,248,.22)":"rgba(20,20,31,.3)"};}
textarea{resize:vertical;line-height:1.65;}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-thumb{background:${isDark?"rgba(200,255,0,.22)":"rgba(90,138,0,.3)"};border-radius:2px;}
`;

// ═══════════════════════════════════════════════════════
// INFRASTRUCTURE — Services
// ═══════════════════════════════════════════════════════

const Store = {
  get(k, fallback = null) { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove(k) { try { localStorage.removeItem(k); } catch {} },
};

const HistoryService = {
  load() { return Store.get("q:history", []); },
  save(entry) {
    const h = this.load();
    h.unshift({ ...entry, id: Date.now(), savedAt: new Date().toISOString() });
    Store.set("q:history", h.slice(0, MAX_HISTORY));
  },
  remove(id) { Store.set("q:history", this.load().filter(e => e.id !== id)); },
  clear() { Store.remove("q:history"); },
};

const RateLimitService = {
  _key() { return `q:rl:${new Date().toISOString().slice(0,10)}`; },
  count() { return Store.get(this._key(), 0); },
  increment() { Store.set(this._key(), this.count() + 1); },
  exceeded() { return this.count() >= MAX_FREE_PER_DAY; },
};

const SessionService = {
  incrementVisits() { const v = Store.get("q:visits", 0) + 1; Store.set("q:visits", v); return v; },
  getVisits() { return Store.get("q:visits", 0); },
  getMode() { return Store.get("q:mode", null); },
  saveMode(m) { Store.set("q:mode", m); },
  getTheme() { return Store.get("q:theme", "dark"); },
  saveTheme(t) { Store.set("q:theme", t); },
};

const AnalyticsService = {
  track(type, payload = {}) {
    const events = Store.get("q:analytics", []);
    events.push({ type, ...payload, ts: Date.now(), h: new Date().getHours() });
    Store.set("q:analytics", events.slice(-500));
  },
  loadAll() { return Store.get("q:analytics", []); },
};

const PromptGeneratorService = {
  buildSystem({ mode, tool, tone, technique, outputFormat, chainOfThought, fewShot, constraints }) {
    const t = tool || "any AI tool";
    if (mode === "novice") return `You are a friendly AI prompt expert. Create a clear, simple prompt for a complete beginner.
Must: start with "You are a helpful...", use plain everyday language, single clear task, specify response format, be immediately copy-paste ready, optimised for ${t}.
Return ONLY valid JSON: {"prompt":"...","title":"max 6 words","tips":["tip1","tip2","tip3"],"whyItWorks":"one sentence","complexity":"beginner"}`;
    if (mode === "professional") return `You are an expert prompt engineer. Generate a professional-grade prompt.
Must include: expert role with specific credentials, layered context (situation+background+objective), explicit output format (${outputFormat||"structured"}), quality controls, constraints, edge case handling, tone: ${tone}, optimised for ${t}.
Return ONLY valid JSON: {"prompt":"...","title":"max 6 words","tips":["tip1","tip2","tip3"],"whyItWorks":"one sentence","complexity":"intermediate"}`;
    const techMap = { zero_shot:"Zero-Shot Instruction",few_shot:"Few-Shot Learning with 2-3 worked examples",cot:"Chain-of-Thought with explicit step-by-step reasoning",role:"Deep Expert Persona with specific credentials",step_back:"Step-Back Prompting (abstract then apply)",tot:"Tree-of-Thought with multiple solution branches",meta:"Meta-Prompting (AI designs its approach first)" };
    return `You are a master prompt engineer. Generate an expert-level prompt using ${techMap[technique]||"Chain-of-Thought"}.
Mandatory: metacognitive priming, hierarchical structure (role→context→task→constraints→format), ${chainOfThought?"chain-of-thought induction":"direct instruction"}, ${fewShot?"few-shot scaffolding with [EXAMPLE] slots":"zero-shot formulation"}, output format: ${outputFormat||"structured"}, anti-hallucination guardrails, iterative refinement hook, ${constraints?`constraints: ${constraints}`:"domain-specific constraints"}, tone: ${tone}, optimised for ${t}.
Return ONLY valid JSON: {"prompt":"...","title":"max 6 words","tips":["tip1","tip2","tip3"],"whyItWorks":"one sentence","complexity":"advanced","technique":"${technique||"cot"}"}`;
  },

  async generate(inputs) {
    const system = this.buildSystem(inputs);
    const { category, goal, audience, tool, tone, outputFormat, constraints, mode } = inputs;
  
    const userMsg = `Category: ${category}
    Goal: ${goal}
    Audience: ${audience || "general audience"}
    Tool: ${tool || "any AI tool"}
    Tone: ${tone}
    ${outputFormat ? `Output Format: ${outputFormat}` : ""}
    ${constraints ? `Constraints: ${constraints}` : ""}
    Expertise Level: ${mode}`;
  
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
  
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    const raw = data.content?.[0]?.text || "{}";
    try {
      return JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      return { prompt: raw, title: "Your Prompt", tips: [], whyItWorks: "", complexity: mode === "expert" ? "advanced" : "intermediate" };
    }
  },
};

// ═══════════════════════════════════════════════════════
// APPLICATION — Hooks
// ═══════════════════════════════════════════════════════

function useGeneratePrompt() {
  const [state, setState] = useState({ loading:false, result:null, error:null });
  const generate = useCallback(async (inputs) => {
    setState({ loading:true, result:null, error:null });
    const t0 = Date.now();
    try {
      const result = await PromptGeneratorService.generate(inputs);
      setState({ loading:false, result, error:null });
      RateLimitService.increment();
      HistoryService.save({ ...result, category:inputs.category, tool:inputs.tool, tone:inputs.tone, mode:inputs.mode });
      AnalyticsService.track("generate", { category:inputs.category, tool:inputs.tool, tone:inputs.tone, mode:inputs.mode, goalLen:inputs.goal?.length||0, ms:Date.now()-t0 });
    } catch(e) { setState({ loading:false, result:null, error:e.message||"Generation failed." }); }
  }, []);
  return { ...state, generate, reset: () => setState({ loading:false, result:null, error:null }) };
}

function useAdminAnalytics() {
  const [data, setData] = useState(null);
  const load = useCallback(() => {
    const events = AnalyticsService.loadAll();
    const gens = events.filter(e=>e.type==="generate");
    const copies = events.filter(e=>e.type==="copy");
    const ratings = events.filter(e=>e.type==="rate");
    const byCategory={}, byTool={}, byTone={}, byMode={};
    const byHour = Array(24).fill(0);
    let totalGoalLen=0, totalMs=0, totalRating=0;
    for(const e of gens){
      if(e.category) byCategory[e.category]=(byCategory[e.category]||0)+1;
      if(e.tool) byTool[e.tool]=(byTool[e.tool]||0)+1;
      if(e.tone) byTone[e.tone]=(byTone[e.tone]||0)+1;
      if(e.mode) byMode[e.mode]=(byMode[e.mode]||0)+1;
      if(e.h!==undefined) byHour[e.h]++;
      totalGoalLen+=e.goalLen||0; totalMs+=e.ms||0;
    }
    for(const e of ratings) totalRating+=e.rating||0;
    const avgGoalLen=gens.length?Math.round(totalGoalLen/gens.length):0;
    setData({
      totalPrompts:gens.length, totalCopies:copies.length, totalRatings:ratings.length,
      avgRating:ratings.length?(totalRating/ratings.length).toFixed(1):"N/A",
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
  }, []);
  return { data, load };
}

// ═══════════════════════════════════════════════════════
// ATOMS
// ═══════════════════════════════════════════════════════

function Btn({ children, onClick, variant="primary", disabled, full, sm, style:ex={} }) {
  const C = useC();
  const [hov,setHov] = useState(false);
  const base = { border:"none", cursor:disabled?"not-allowed":"pointer", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:sm?12:14, transition:"all .18s ease", opacity:disabled?.45:1, borderRadius:12, width:full?"100%":undefined, ...ex };
  const v = {
    primary:   { background:C.accent, color:C.bg, padding:sm?"8px 16px":"13px 28px", ...(hov&&!disabled?{transform:"translateY(-2px)",boxShadow:`0 8px 28px ${C.accentBdr}`}:{}) },
    secondary: { background:"transparent", color:hov&&!disabled?C.accent:C.text, padding:sm?"7px 14px":"12px 20px", border:`1px solid ${hov&&!disabled?C.accent:C.border}`, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500 },
    ghost:     { background:"transparent", color:hov?C.text:C.muted, padding:"8px 0", fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:400 },
    danger:    { background:"transparent", color:hov?"#FF6B6B":C.muted, padding:"7px 14px", border:`1px solid ${hov?"#FF6B6B":C.border}`, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500, fontSize:12 },
  };
  return <button onClick={disabled?undefined:onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{...base,...v[variant]}}>{children}</button>;
}

function Chip({ label, selected, onClick, recommended }) {
  const C = useC();
  const [hov,setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ position:"relative", background:selected?C.accentDim:hov?C.cardHover:C.card, border:`1px solid ${selected?C.accentBdr:recommended?"rgba(200,255,0,0.2)":C.border}`, borderRadius:100, padding:"7px 14px", color:selected?C.accent:recommended?C.accent:C.muted, fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:selected||recommended?600:400, cursor:"pointer", transition:"all .15s ease" }}>
      {recommended && !selected && <span style={{ position:"absolute", top:-4, right:-4, width:8, height:8, borderRadius:"50%", background:C.accent }}/>}
      {label}
    </button>
  );
}

function Label({ children }) {
  const C = useC();
  return <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:C.dim, marginBottom:10, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{children}</div>;
}

function SectionLabel({ children, note }) {
  const C = useC();
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{children}</div>
      {note && <div style={{ fontSize:10, background:C.accentDim, border:`1px solid ${C.accentBdr}`, color:C.accent, borderRadius:100, padding:"2px 8px", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>✦ smart for {note}</div>}
    </div>
  );
}

function ProgressBar({ step, total }) {
  const C = useC();
  return <div style={{ display:"flex", gap:5, flex:1 }}>{Array.from({length:total}).map((_,i)=><div key={i} style={{ height:3, flex:i===step?2:1, background:i<=step?C.accent:C.border, borderRadius:2, transition:"all .35s ease" }} />)}</div>;
}

function Card({ children, style:s={} }) {
  const C = useC();
  return <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:22, padding:"clamp(20px,4vw,38px)", ...s }}>{children}</div>;
}

function Toggle({ value, onChange, label }) {
  const C = useC();
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer" }} onClick={()=>onChange(!value)}>
      <div style={{ width:40, height:22, borderRadius:11, background:value?C.accent:C.border, transition:"all .2s", position:"relative", flexShrink:0 }}>
        <div style={{ position:"absolute", top:3, left:value?20:3, width:16, height:16, borderRadius:8, background:value?C.bg:"rgba(255,255,255,0.7)", transition:"all .2s" }} />
      </div>
      <span style={{ fontSize:13, color:C.muted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{label}</span>
    </div>
  );
}

function StarRating({ value, onChange, size=22 }) {
  const C = useC();
  const [hov,setHov] = useState(0);
  return (
    <div style={{ display:"flex", gap:4 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onClick={()=>onChange(n)} onMouseEnter={()=>setHov(n)} onMouseLeave={()=>setHov(0)}
          style={{ fontSize:size, cursor:"pointer", color:(hov||value)>=n?C.accent:C.ratingOff, transition:"all .12s", transform:(hov>=n)?"scale(1.2)":"scale(1)" }}>★</span>
      ))}
    </div>
  );
}

function ThemeToggle() {
  const C = useC();
  return null; // injected via prop in App
}

// ═══════════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════════

// ── Landing ────────────────────────────────────────────
function LandingView({ onStart, onAdmin, onHistory, isDark, toggleTheme }) {
  const C = useC();
  const [visits, setVisits] = useState(0);
  const [mode, setMode]     = useState("novice");
  const [logoClicks, setLogoClicks] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const clickTimer = useRef(null);

  useEffect(() => {
    const v = SessionService.incrementVisits(); setVisits(v);
    const m = SessionService.getMode(); if(m) setMode(m);
    setHistoryCount(HistoryService.load().length);
    AnalyticsService.track("visit", {});
  }, []);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    if(next >= ADMIN_CLICKS_REQUIRED){ setLogoClicks(0); clearTimeout(clickTimer.current); onAdmin(); return; }
    setLogoClicks(next); clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(()=>setLogoClicks(0), ADMIN_CLICK_WINDOW_MS);
  };
  const handleStart = () => { SessionService.saveMode(mode); onStart(mode); };
  const returning = visits > 1;
  const modeColors = { novice:C.green, professional:C.accent, expert:C.purple };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 20px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", animation:"meshDrift 20s ease-in-out infinite", background:`radial-gradient(ellipse 72% 55% at 18% 18%, ${C.accentDim} 0%,transparent 60%),radial-gradient(ellipse 55% 44% at 84% 82%, rgba(255,107,53,0.04) 0%,transparent 55%)` }} />

      {/* Top-right controls */}
      <div style={{ position:"fixed", top:20, right:24, display:"flex", gap:10, zIndex:10 }}>
        {historyCount > 0 && (
          <button onClick={onHistory} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 14px", color:C.muted, fontSize:12, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
            📋 <span>History ({historyCount})</span>
          </button>
        )}
        <button onClick={toggleTheme} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 12px", color:C.muted, fontSize:16, cursor:"pointer" }}>
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      <div style={{ position:"relative", zIndex:1, textAlign:"center", maxWidth:760 }}>
        {/* Logo */}
        <div className="au" onClick={handleLogoClick} style={{ cursor:"default", marginBottom:36, userSelect:"none" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:32, filter:`drop-shadow(0 0 12px ${C.accentBdr})` }}>✦</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color:C.text, letterSpacing:"-0.02em" }}>Quill</span>
            {logoClicks > 2 && <span style={{ fontSize:10, color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{"·".repeat(logoClicks)}</span>}
          </div>
        </div>

        {/* Badge */}
        <div className="au1" style={{ display:"inline-flex", alignItems:"center", gap:8, background:C.accentDim, border:`1px solid ${C.accentBdr}`, borderRadius:100, padding:"6px 18px", marginBottom:36 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:C.accent, display:"inline-block", animation:"pulse2 2s infinite" }} />
          <span style={{ fontSize:12, color:C.accent, fontWeight:600, letterSpacing:"0.06em", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            {returning ? `Welcome back · session ${visits}` : "Sharp prompts. Maximum results."}
          </span>
        </div>

        <h1 className="au2" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(44px,9vw,80px)", lineHeight:1.02, marginBottom:20, color:C.text }}>
          Stop getting <span style={{ color:C.accent }}>average</span><br />AI results.
        </h1>
        <p className="au3" style={{ fontSize:"clamp(15px,2.2vw,18px)", color:C.muted, lineHeight:1.7, marginBottom:52, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:300 }}>
          Expert-engineered AI prompts in seconds.<br />Built for everyone — from curious beginners to seasoned developers.
        </p>

        {/* Mode selector */}
        <div className="au4" style={{ marginBottom:40 }}>
          <p style={{ fontSize:11, color:C.dim, marginBottom:16, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"0.06em", fontWeight:700 }}>I AM A...</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            {EXPERTISE_MODES.map(m => {
              const sel = mode === m.id;
              return (
                <div key={m.id} onClick={()=>setMode(m.id)} style={{ background:sel?`${modeColors[m.id]}12`:C.card, border:`1px solid ${sel?modeColors[m.id]+"55":C.border}`, borderRadius:16, padding:"16px 20px", cursor:"pointer", transition:"all .2s", minWidth:155, textAlign:"left" }}>
                  <div style={{ fontSize:22, marginBottom:7 }}>{m.emoji}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:sel?modeColors[m.id]:C.text, marginBottom:3 }}>{m.label}</div>
                  <div style={{ fontSize:11, color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{m.desc}</div>
                  {sel && <div style={{ fontSize:10, color:modeColors[m.id], marginTop:6, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>{m.tagline}</div>}
                </div>
              );
            })}
          </div>
        </div>

        <Btn onClick={handleStart} style={{ padding:"16px 52px", fontSize:15 }}>Generate my prompt →</Btn>

        <div style={{ display:"flex", gap:44, justifyContent:"center", marginTop:72 }}>
          {[["10+","AI Tools"],["3 Modes","Novice → Expert"],["Free","Always"]].map(([val,lbl])=>(
            <div key={lbl} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:C.accent }}>{val}</div>
              <div style={{ fontSize:11, color:C.dim, marginTop:4, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{lbl}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:60, fontSize:11, color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>© 2025 Quill AI · Sharp prompts. Maximum results.</div>
      </div>
    </div>
  );
}

// ── Wizard (Fully Dynamic) ─────────────────────────────
function WizardView({ mode, onComplete, onBack, isDark, toggleTheme }) {
  const C = useC();
  const stepsCount = mode === "expert" ? 4 : 3;
  const [step, setStep]   = useState(0);
  const [form, setForm]   = useState({ category:"", goal:"", audience:"", tool:"ChatGPT", tone:"professional", outputFormat:"", constraints:"", technique:"cot", chainOfThought:true, fewShot:false, mode });
  const up = (k,v) => setForm(f=>({...f,[k]:v}));

  const cfg = form.category ? CATEGORY_CONFIG[form.category] : null;
  const modeColor = { novice:C.green, professional:C.accent, expert:C.purple }[mode] || C.accent;
  const modeLabel = EXPERTISE_MODES.find(m=>m.id===mode)?.label;
  const cat = CATEGORIES.find(c=>c.id===form.category);

  // Smart defaults: auto-select first recommended tone when category changes
  useEffect(() => {
    if(cfg && !cfg.tones.includes(form.tone)) up("tone", cfg.tones[0]);
    if(cfg && !cfg.tools.includes(form.tool)) up("tool", cfg.tools[0]);
    if(cfg && mode==="expert" && !cfg.techniques.includes(form.technique)) up("technique", cfg.techniques[0]);
  }, [form.category]);

  const sortedTones = cfg
    ? [...TONES.filter(t=>cfg.tones.includes(t.id)), ...TONES.filter(t=>!cfg.tones.includes(t.id))]
    : TONES;
  const sortedTools = cfg
    ? [...AI_TOOLS.filter(t=>cfg.tools.includes(t)), ...AI_TOOLS.filter(t=>!cfg.tools.includes(t))]
    : AI_TOOLS;
  const sortedFormats = cfg
    ? [...OUTPUT_FORMATS.filter(f=>cfg.formats.includes(f)), ...OUTPUT_FORMATS.filter(f=>!cfg.formats.includes(f))]
    : OUTPUT_FORMATS;
  const sortedTechniques = cfg
    ? [...PROMPT_TECHNIQUES.filter(t=>cfg.techniques.includes(t.id)), ...PROMPT_TECHNIQUES.filter(t=>!cfg.techniques.includes(t.id))]
    : PROMPT_TECHNIQUES;

  const goalPlaceholder = cfg
    ? (cfg.placeholders[mode] || cfg.placeholders.professional)
    : "Describe your goal in as much detail as possible...";

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 20px" }}>
      <div style={{ width:"100%", maxWidth:700 }}>
        {/* Nav */}
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28 }}>
          <Btn variant="ghost" onClick={onBack}>← Home</Btn>
          <ProgressBar step={step} total={stepsCount} />
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <span style={{ fontSize:11, color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{step+1}/{stepsCount}</span>
            <span style={{ fontSize:11, background:`${modeColor}18`, border:`1px solid ${modeColor}44`, color:modeColor, borderRadius:100, padding:"2px 10px", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>{modeLabel}</span>
            <button onClick={toggleTheme} style={{ background:"none", border:"none", fontSize:16, cursor:"pointer", padding:"4px", color:C.muted }}>{isDark?"☀️":"🌙"}</button>
          </div>
        </div>

        <Card>
          {/* ── Step 0: Category ── */}
          {step===0 && (
            <div className="au">
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, marginBottom:6, color:C.text }}>What are you working on?</h2>
              <p style={{ color:C.muted, marginBottom:28, fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {mode==="novice" ? "Pick the area closest to your task." : mode==="expert" ? "Your category shapes the prompt architecture." : "This personalises your wizard steps and recommendations."}
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:8 }}>
                {CATEGORIES.map(cat => {
                  const sel = form.category===cat.id;
                  return (
                    <div key={cat.id} onClick={()=>{up("category",cat.id);setTimeout(()=>setStep(1),260);}} style={{ background:sel?C.accentDim:C.card, border:`1px solid ${sel?C.accentBdr:C.border}`, borderRadius:14, padding:"13px 10px", textAlign:"center", cursor:"pointer", transition:"all .2s", transform:sel?"scale(1.03)":"scale(1)" }} onMouseEnter={e=>{if(!sel)e.currentTarget.style.background=C.cardHover;}} onMouseLeave={e=>{if(!sel)e.currentTarget.style.background=C.card;}}>
                      <div style={{ fontSize:20, marginBottom:5 }}>{cat.emoji}</div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:11, color:sel?C.accent:C.text, marginBottom:2 }}>{cat.label}</div>
                      <div style={{ fontSize:9, color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{cat.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 1: Goal ── */}
          {step===1 && (
            <div className="au">
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                {cat && <span style={{ fontSize:24 }}>{cat.emoji}</span>}
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:C.text }}>Describe your goal</h2>
              </div>
              <p style={{ color:C.muted, marginBottom:26, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {mode==="novice" ? "Tell us what you want in plain English — no technical knowledge needed." : mode==="professional" ? "The richer your context, the more powerful your prompt will be." : "Be precise. Every constraint and detail you add shapes the prompt architecture."}
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div>
                  <Label>WHAT DO YOU WANT TO ACHIEVE? *</Label>
                  <textarea value={form.goal} onChange={e=>up("goal",e.target.value)} placeholder={goalPlaceholder} rows={mode==="expert"?6:5} autoFocus />
                  <div style={{ fontSize:11, marginTop:5, textAlign:"right", fontFamily:"'Plus Jakarta Sans',sans-serif", color:form.goal.length<40?C.dim:form.goal.length<90?C.orange:C.accent }}>
                    {form.goal.length} chars · {form.goal.length<40?"add more for best results":form.goal.length<90?"getting better, keep going":"excellent depth ✓"}
                  </div>
                </div>

                <div>
                  <Label>TARGET AUDIENCE {mode==="novice"?"(optional)":"(recommended)"}</Label>
                  <input value={form.audience} onChange={e=>up("audience",e.target.value)}
                    placeholder={cfg ? cfg.audienceSuggestion : "e.g. who will read or use this output..."} />
                </div>

                {(mode==="professional"||mode==="expert") && (
                  <div>
                    <SectionLabel note={cat?.label}>PREFERRED OUTPUT FORMAT</SectionLabel>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                      {sortedFormats.map(f => <Chip key={f} label={f} selected={form.outputFormat===f} recommended={cfg?.formats.includes(f)&&form.outputFormat!==f} onClick={()=>up("outputFormat",form.outputFormat===f?"":f)} />)}
                    </div>
                  </div>
                )}

                {mode==="expert" && (
                  <div>
                    <Label>CONSTRAINTS & GUARDRAILS</Label>
                    <input value={form.constraints} onChange={e=>up("constraints",e.target.value)} placeholder="e.g. max 300 words, avoid jargon, cite sources, no bullet points..." />
                  </div>
                )}
              </div>

              <div style={{ display:"flex", gap:12, marginTop:28 }}>
                <Btn variant="secondary" onClick={()=>setStep(0)}>← Back</Btn>
                <Btn onClick={()=>setStep(2)} disabled={!form.goal.trim()} style={{ flex:1 }}>Continue →</Btn>
              </div>
            </div>
          )}

          {/* ── Step 2: Tool + Tone ── */}
          {step===2 && (
            <div className="au">
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, marginBottom:6, color:C.text }}>Tailor your prompt</h2>
              <p style={{ color:C.muted, marginBottom:26, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {mode==="expert" ? "Select your target model and tone. Starred options are recommended for your category." : "Pick the AI tool you'll use and your preferred output voice."}
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
                <div>
                  <SectionLabel note={cat?.label}>WHICH AI TOOL?</SectionLabel>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {sortedTools.map(t => <Chip key={t} label={t} selected={form.tool===t} recommended={cfg?.tools.includes(t)&&form.tool!==t} onClick={()=>up("tool",t)} />)}
                  </div>
                </div>
                <div>
                  <SectionLabel note={cat?.label}>TONE</SectionLabel>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {sortedTones.map(t => <Chip key={t.id} label={`${t.emoji} ${t.label}`} selected={form.tone===t.id} recommended={cfg?.tones.includes(t.id)&&form.tone!==t.id} onClick={()=>up("tone",t.id)} />)}
                  </div>
                </div>

                {/* Novice gets output format here */}
                {mode==="novice" && (
                  <div>
                    <SectionLabel note={cat?.label}>HOW SHOULD THE ANSWER LOOK?</SectionLabel>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                      {(cfg?.formats.slice(0,5)||OUTPUT_FORMATS.slice(0,5)).map(f => <Chip key={f} label={f} selected={form.outputFormat===f} onClick={()=>up("outputFormat",form.outputFormat===f?"":f)} />)}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display:"flex", gap:12, marginTop:28 }}>
                <Btn variant="secondary" onClick={()=>setStep(1)}>← Back</Btn>
                {mode==="expert"
                  ? <Btn onClick={()=>setStep(3)} disabled={!form.tool} style={{ flex:1 }}>Advanced Options →</Btn>
                  : <Btn onClick={()=>onComplete(form)} disabled={!form.tool} style={{ flex:1 }}>✨ Generate Prompt</Btn>
                }
              </div>
            </div>
          )}

          {/* ── Step 3: Expert Technique ── */}
          {step===3 && mode==="expert" && (
            <div className="au">
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, marginBottom:6, color:C.text }}>Prompt Engineering</h2>
              <p style={{ color:C.muted, marginBottom:26, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Configure the underlying prompt architecture. Highlighted techniques are optimal for <strong style={{color:C.text}}>{cat?.label||"your category"}</strong>.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
                <div>
                  <SectionLabel note={cat?.label}>TECHNIQUE</SectionLabel>
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    {sortedTechniques.map(t => {
                      const sel = form.technique===t.id;
                      const rec = cfg?.techniques.includes(t.id);
                      return (
                        <div key={t.id} onClick={()=>up("technique",t.id)} style={{ background:sel?C.accentDim:rec?`${C.accentDim}88`:C.card, border:`1px solid ${sel?C.accentBdr:rec?"rgba(200,255,0,0.15)":C.border}`, borderRadius:12, padding:"11px 15px", cursor:"pointer", transition:"all .15s", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            {rec && <span style={{ fontSize:10, color:C.accent, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>✦</span>}
                            <div>
                              <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:sel?C.accent:C.text }}>{t.label}</span>
                              <span style={{ fontSize:11, color:C.dim, marginLeft:10, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{t.desc}</span>
                            </div>
                          </div>
                          {sel && <span style={{ color:C.accent, fontSize:14 }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <Toggle value={form.chainOfThought} onChange={v=>up("chainOfThought",v)} label="Include chain-of-thought induction" />
                  <Toggle value={form.fewShot}       onChange={v=>up("fewShot",v)}       label="Add few-shot example scaffolding" />
                </div>
              </div>
              <div style={{ display:"flex", gap:12, marginTop:28 }}>
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

// ── Loading ─────────────────────────────────────────────
function LoadingView({ mode }) {
  const C = useC();
  const msgs = { novice:["Getting things ready...","Building your prompt...","Polishing the details...","Almost there..."], professional:["Analysing your goal...","Structuring the prompt layers...","Adding professional techniques...","Finalising..."], expert:["Parsing requirements...","Architecting the structure...","Applying prompt engineering...","Optimising output contracts...","Nearly done..."] }[mode]||["Generating..."];
  const [idx,setIdx]=useState(0); const [dots,setDots]=useState(".");
  useEffect(()=>{const t1=setInterval(()=>setIdx(i=>(i+1)%msgs.length),1700);const t2=setInterval(()=>setDots(d=>d.length>=3?".":d+"."),420);return()=>{clearInterval(t1);clearInterval(t2);};},[]);
  const rc = { novice:C.green, professional:C.accent, expert:C.purple }[mode]||C.accent;
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:36 }}>
      <div style={{ position:"relative", width:96, height:96 }}>
        <div style={{ position:"absolute", inset:0,  borderRadius:"50%", border:`2.5px solid ${C.border}`, borderTopColor:rc, animation:"spin .9s linear infinite" }} />
        <div style={{ position:"absolute", inset:10, borderRadius:"50%", border:"2px solid transparent", borderTopColor:`${rc}55`, animation:"spin 1.5s linear infinite reverse" }} />
        <div style={{ position:"absolute", inset:20, borderRadius:"50%", border:"2px solid transparent", borderTopColor:`${rc}25`, animation:"spin 2.2s linear infinite" }} />
        <div style={{ position:"absolute", inset:32, borderRadius:"50%", background:C.accentDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>✨</div>
      </div>
      <div style={{ textAlign:"center" }}>
        <p style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:rc, minHeight:28 }}>{msgs[idx]}</p>
        <p style={{ color:C.dim, marginTop:8, fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Engineering your prompt{dots}</p>
      </div>
    </div>
  );
}

// ── Result ──────────────────────────────────────────────
function ResultView({ result, form, onNew, onRegenerate, loading }) {
  const C = useC();
  const [copied, setCopied]       = useState(false);
  const [copyFormat, setCopyFormat] = useState("plain");
  const [shared, setShared]       = useState(false);
  const [rating, setRating]       = useState(0);
  const [showFormats, setShowFormats] = useState(false);

  const getFormattedPrompt = () => {
    if(copyFormat === "system") return `## System Prompt\n\n${result.prompt}`;
    if(copyFormat === "chatgpt") return `[CUSTOM INSTRUCTIONS FOR CHATGPT]\n${result.prompt}`;
    if(copyFormat === "claude")  return `<system>\n${result.prompt}\n</system>`;
    return result.prompt;
  };

  const handleCopy = () => {
    const txt = getFormattedPrompt();
    const fb = ()=>{const el=document.createElement("textarea");el.value=txt;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);};
    (navigator.clipboard?.writeText(txt)||Promise.reject()).catch(fb);
    setCopied(true); setShowFormats(false);
    AnalyticsService.track("copy",{category:form?.category,tool:form?.tool,mode:form?.mode,format:copyFormat});
    setTimeout(()=>setCopied(false),2600);
  };

  const handleShare = () => {
    const data = JSON.stringify({ p:result.prompt, t:result.title });
    const encoded = btoa(unescape(encodeURIComponent(data)));
    const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
    const fb = ()=>{};
    (navigator.clipboard?.writeText(url)||Promise.reject()).catch(fb);
    setShared(true); setTimeout(()=>setShared(false),2600);
    AnalyticsService.track("share",{category:form?.category,mode:form?.mode});
  };

  const handleRate = (r) => {
    setRating(r);
    AnalyticsService.track("rate",{rating:r,category:form?.category,mode:form?.mode,complexity:result.complexity});
  };

  const cm = { beginner:{color:C.green,label:"Beginner Friendly"}, intermediate:{color:C.accent,label:"Intermediate"}, advanced:{color:C.purple,label:"Advanced"} }[result.complexity]||{color:C.accent,label:"Intermediate"};
  const mc = { novice:C.green, professional:C.accent, expert:C.purple }[form?.mode]||C.accent;
  const PROMPT_TECHNIQUES_MAP = Object.fromEntries(PROMPT_TECHNIQUES.map(t=>[t.id,t.label]));

  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"32px 20px", display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ width:"100%", maxWidth:760 }}>

        {/* Top bar */}
        <div className="au" style={{ display:"flex", alignItems:"center", marginBottom:26, gap:10 }}>
          <Btn variant="ghost" onClick={onNew}>← New</Btn>
          <div style={{ flex:1 }} />
          {form?.mode && <span style={{ background:`${mc}18`, border:`1px solid ${mc}44`, color:mc, borderRadius:100, padding:"4px 12px", fontSize:11, fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{EXPERTISE_MODES.find(m=>m.id===form.mode)?.label}</span>}
          <span style={{ background:`${cm.color}18`, border:`1px solid ${cm.color}44`, color:cm.color, borderRadius:100, padding:"4px 12px", fontSize:11, fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{cm.label}</span>
        </div>

        <div className="au1">
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:5, color:C.text }}>{result.title}</h2>
          {result.whyItWorks && <p style={{ color:C.muted, fontSize:13, marginBottom:22, fontFamily:"'Plus Jakarta Sans',sans-serif", fontStyle:"italic" }}>{result.whyItWorks}</p>}
        </div>

        {result.technique && (
          <div className="au2" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.25)", borderRadius:100, padding:"5px 14px", marginBottom:18 }}>
            <span style={{ fontSize:12, color:C.purple, fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>⚡ {PROMPT_TECHNIQUES_MAP[result.technique]||result.technique} applied</span>
          </div>
        )}

        {/* Main prompt box */}
        <div className="au2" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"24px 26px 20px", marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <Label>YOUR OPTIMISED PROMPT</Label>
            <div style={{ display:"flex", gap:8, position:"relative" }}>
              {/* Copy format selector */}
              <div style={{ position:"relative" }}>
                <button onClick={()=>setShowFormats(s=>!s)} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.muted, borderRadius:8, padding:"6px 12px", fontSize:11, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:5 }}>
                  {copyFormat==="plain"?"Plain":copyFormat==="system"?"System":copyFormat==="chatgpt"?"GPT":"Claude"} ▾
                </button>
                {showFormats && (
                  <div style={{ position:"absolute", top:"110%", right:0, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:8, zIndex:20, minWidth:150, animation:"pop .2s ease", boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }}>
                    {[["plain","Plain text"],["system","System prompt"],["chatgpt","ChatGPT format"],["claude","Claude format"]].map(([id,lbl])=>(
                      <div key={id} onClick={()=>{setCopyFormat(id);setShowFormats(false);}} style={{ padding:"8px 12px", cursor:"pointer", borderRadius:8, background:copyFormat===id?C.accentDim:"transparent", color:copyFormat===id?C.accent:C.text, fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all .1s" }}>{lbl}</div>
                    ))}
                  </div>
                )}
              </div>
              {/* Copy button */}
              <div style={{ position:"relative" }}>
                {copied && <span style={{ position:"absolute", top:-32, right:0, whiteSpace:"nowrap", background:C.accent, color:C.bg, fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:6, animation:"pop .25s ease", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>✓ Copied!</span>}
                <button onClick={handleCopy} style={{ background:copied?C.accentDim:C.card, border:`1px solid ${copied?C.accentBdr:C.border}`, color:copied?C.accent:C.muted, borderRadius:8, padding:"6px 16px", fontSize:12, cursor:"pointer", transition:"all .18s ease", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500 }}>{copied?"✓ Copied":"Copy"}</button>
              </div>
            </div>
          </div>
          <p style={{ lineHeight:1.9, color:C.text, fontSize:14.5, whiteSpace:"pre-wrap", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{result.prompt}</p>
        </div>

        {/* Pro Tips */}
        {result.tips?.length > 0 && (
          <div className="au3" style={{ background:C.accentDim, border:`1px solid ${C.accentBdr}50`, borderRadius:16, padding:"18px 22px", marginBottom:16 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:10, letterSpacing:"0.09em", color:C.accent, marginBottom:12 }}>PRO TIPS</div>
            {result.tips.map((tip,i)=>(
              <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:i<result.tips.length-1?10:0 }}>
                <span style={{ color:C.accent, fontWeight:800, flexShrink:0, fontSize:12, marginTop:2 }}>{i+1}.</span>
                <span style={{ fontSize:13, color:C.text, lineHeight:1.65, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{tip}</span>
              </div>
            ))}
          </div>
        )}

        {/* Rating */}
        <div className="au3" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px 20px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.09em", color:C.dim, marginBottom:6, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>RATE THIS PROMPT</div>
            <StarRating value={rating} onChange={handleRate} />
          </div>
          {rating > 0 && <span style={{ fontSize:12, color:C.accent, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600, animation:"pop .25s ease" }}>{rating>=4?"Great! Saved to your history.":rating>=2?"Thanks for the feedback.":"We'll keep improving."}</span>}
        </div>

        {/* Action buttons */}
        <div className="au4" style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <Btn onClick={handleCopy} style={{ flex:1, minWidth:140 }}>{copied?"✓ Copied":"Copy Prompt"}</Btn>
          <Btn variant="secondary" onClick={handleShare} style={{ minWidth:120 }}>
            {shared?"✓ Link copied!":"🔗 Share"}
          </Btn>
          <Btn variant="secondary" onClick={onRegenerate} disabled={loading} style={{ minWidth:130 }}>
            {loading?"⏳ Generating...":"↻ Regenerate"}
          </Btn>
          <Btn variant="secondary" onClick={onNew}>New Prompt</Btn>
        </div>

        <p style={{ marginTop:14, fontSize:11, color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif", textAlign:"center" }}>
          Tip: "Regenerate" produces a different variation using the same settings.
        </p>
      </div>
    </div>
  );
}

// ── History ─────────────────────────────────────────────
function HistoryView({ onBack, onUsePrompt }) {
  const C = useC();
  const [history, setHistory] = useState([]);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [copied, setCopied]   = useState(null);

  useEffect(() => { setHistory(HistoryService.load()); }, []);

  const filtered = history.filter(h => {
    const matchSearch = !search || h.prompt?.toLowerCase().includes(search.toLowerCase()) || h.title?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || h.mode === filter || h.category === filter;
    return matchSearch && matchFilter;
  });

  const handleCopy = (entry) => {
    const fb = ()=>{const el=document.createElement("textarea");el.value=entry.prompt;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);};
    (navigator.clipboard?.writeText(entry.prompt)||Promise.reject()).catch(fb);
    setCopied(entry.id); setTimeout(()=>setCopied(null),2000);
  };

  const handleDelete = (id) => {
    HistoryService.remove(id);
    setHistory(h => h.filter(e => e.id !== id));
  };

  const modeColor = (m) => ({ novice:C.green, professional:C.accent, expert:C.purple }[m]||C.muted);
  const cmColor   = (c) => ({ beginner:C.green, intermediate:C.accent, advanced:C.purple }[c]||C.muted);

  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"32px 20px" }}>
      <div style={{ maxWidth:760, margin:"0 auto" }}>

        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:32 }}>
          <Btn variant="ghost" onClick={onBack}>← Home</Btn>
          <div style={{ flex:1 }} />
          {history.length > 0 && <Btn variant="danger" sm onClick={()=>{ HistoryService.clear(); setHistory([]); }}>Clear all</Btn>}
        </div>

        <div className="au" style={{ marginBottom:28 }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.text, marginBottom:6 }}>Prompt History</h2>
          <p style={{ color:C.muted, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{history.length} saved prompt{history.length!==1?"s":""} · stored on this device</p>
        </div>

        {history.length > 0 && (
          <div className="au1" style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search prompts..." style={{ flex:1, minWidth:200 }} />
            <div style={{ display:"flex", gap:7 }}>
              {["all","novice","professional","expert"].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{ background:filter===f?C.accentDim:C.card, border:`1px solid ${filter===f?C.accentBdr:C.border}`, borderRadius:100, padding:"8px 14px", color:filter===f?C.accent:C.muted, fontSize:11, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:filter===f?600:400, cursor:"pointer", transition:"all .15s", textTransform:"capitalize" }}>{f}</button>
              ))}
            </div>
          </div>
        )}

        {history.length === 0 && (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
            <p style={{ color:C.muted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>No prompts yet. Generate your first prompt to see it here.</p>
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {filtered.map((entry, i) => (
            <div key={entry.id} className="au" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, padding:"18px 20px", animationDelay:`${i*0.04}s` }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:C.text }}>{entry.title || "Untitled Prompt"}</span>
                    {entry.mode && <span style={{ fontSize:10, background:`${modeColor(entry.mode)}18`, border:`1px solid ${modeColor(entry.mode)}44`, color:modeColor(entry.mode), borderRadius:100, padding:"2px 8px", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>{entry.mode}</span>}
                    {entry.complexity && <span style={{ fontSize:10, background:`${cmColor(entry.complexity)}18`, border:`1px solid ${cmColor(entry.complexity)}44`, color:cmColor(entry.complexity), borderRadius:100, padding:"2px 8px", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>{entry.complexity}</span>}
                    {entry.category && <span style={{ fontSize:10, color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{CATEGORIES.find(c=>c.id===entry.category)?.emoji} {entry.category}</span>}
                  </div>
                  <p style={{ fontSize:12, color:C.muted, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{entry.prompt}</p>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"space-between" }}>
                <span style={{ fontSize:10, color:C.dim, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{entry.savedAt ? new Date(entry.savedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : ""}</span>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn variant="secondary" sm onClick={()=>handleCopy(entry)}>{copied===entry.id?"✓ Copied":"Copy"}</Btn>
                  <Btn variant="danger"    sm onClick={()=>handleDelete(entry.id)}>Delete</Btn>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && search && (
            <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>No prompts match "{search}"</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared Prompt View ─────────────────────────────────
function SharedPromptView({ data, onNew }) {
  const C = useC();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const fb=()=>{const el=document.createElement("textarea");el.value=data.p;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);};
    (navigator.clipboard?.writeText(data.p)||Promise.reject()).catch(fb);
    setCopied(true); setTimeout(()=>setCopied(false),2400);
  };
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 20px" }}>
      <div style={{ width:"100%", maxWidth:700 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <span style={{ fontSize:28, filter:`drop-shadow(0 0 10px ${C.accentBdr})` }}>✦</span>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:C.text, marginTop:8, marginBottom:4 }}>Shared Prompt</h2>
          <p style={{ color:C.muted, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Someone shared this Quill prompt with you</p>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"24px 26px", marginBottom:16 }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:C.text, marginBottom:14 }}>{data.t || "Shared Prompt"}</h3>
          <p style={{ lineHeight:1.9, color:C.text, fontSize:14, whiteSpace:"pre-wrap", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{data.p}</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={handleCopy} style={{ flex:1 }}>{copied?"✓ Copied!":"Copy Prompt"}</Btn>
          <Btn variant="secondary" onClick={onNew}>Create my own →</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Admin Login ─────────────────────────────────────────
function AdminLoginView({ onLogin, onBack }) {
  const C = useC();
  const [pass,setPass]=useState(""); const [error,setError]=useState(false);
  const attempt=()=>{ if(pass===ADMIN_PASS){onLogin();}else{setError(true);setTimeout(()=>setError(false),3000);} };
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:24, padding:"48px 42px", width:"100%", maxWidth:420, textAlign:"center" }}>
        <div style={{ fontSize:44, marginBottom:18 }}>🔐</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, marginBottom:8, color:C.text }}>Quill Admin</h2>
        <p style={{ color:C.muted, marginBottom:32, fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Enter your password to access analytics.</p>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="Admin password" autoFocus style={{ marginBottom:error?8:16, borderColor:error?"#FF6B6B":undefined }} />
        {error && <p style={{ color:"#FF6B6B", fontSize:13, marginBottom:12, fontFamily:"'Plus Jakarta Sans',sans-serif", animation:"pop .25s ease" }}>Incorrect password.</p>}
        <Btn onClick={attempt} full style={{ padding:"14px" }}>Access Dashboard</Btn>
        <Btn variant="secondary" onClick={onBack} full style={{ marginTop:10, padding:"13px" }}>← Back</Btn>
      </div>
    </div>
  );
}

// ── Admin Dashboard ─────────────────────────────────────
function AdminDashboard({ onLogout }) {
  const C = useC();
  const { data, load } = useAdminAnalytics();
  useEffect(()=>{ load(); },[]);
  const tt = { contentStyle:{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif" } };
  const SC = ({label,value,sub,color}) => (<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 16px"}}><div style={{fontSize:10,fontWeight:700,letterSpacing:"0.09em",color:C.dim,marginBottom:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{label}</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:800,color:color||C.accent,lineHeight:1}}>{value}</div>{sub&&<div style={{fontSize:11,color:C.dim,marginTop:5,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{sub}</div>}</div>);
  const ST = ({children}) => <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:C.text,marginBottom:14}}>{children}</div>;
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"32px 20px" }}>
      <div style={{ maxWidth:980, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:36, flexWrap:"wrap", gap:14 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}><span style={{ fontSize:20 }}>✦</span><h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:C.text }}>Quill Analytics</h1></div>
            <p style={{ color:C.muted, fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Psychology signals · zero personal data collected · this device only</p>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn variant="secondary" onClick={load} style={{ padding:"10px 18px" }}>↻ Refresh</Btn>
            <Btn variant="secondary" onClick={onLogout} style={{ padding:"10px 18px" }}>Sign out</Btn>
          </div>
        </div>

        {(!data || data.totalPrompts===0) && (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ fontSize:46, marginBottom:16 }}>📭</div>
            <p style={{ color:C.muted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>No data yet. Generate some prompts to see insights.</p>
          </div>
        )}

        {data && data.totalPrompts > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))", gap:12 }}>
              <SC label="TOTAL PROMPTS" value={data.totalPrompts} />
              <SC label="COPIED" value={data.totalCopies} />
              <SC label="COPY RATE" value={`${data.copyRate}%`} sub="adoption signal" color={data.copyRate>60?C.green:C.accent} />
              <SC label="RATINGS GIVEN" value={data.totalRatings} />
              <SC label="AVG RATING" value={data.avgRating==="N/A"?"N/A":`${data.avgRating}★`} color={parseFloat(data.avgRating)>=4?C.green:C.orange} />
              <SC label="AVG CONTEXT" value={`${data.avgGoalLen} chr`} sub="engagement depth" />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(330px,1fr))", gap:18 }}>
              {data.categories.length>0 && (
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:22 }}>
                  <ST>Category Distribution</ST>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart><Pie data={data.categories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} stroke="none">
                      {data.categories.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                    </Pie><Tooltip {...tt} /></PieChart>
                  </ResponsiveContainer>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:6 }}>
                    {data.categories.map((c,i)=><span key={c.name} style={{ fontSize:10, color:CHART_COLORS[i%CHART_COLORS.length], background:CHART_COLORS[i%CHART_COLORS.length]+"18", border:`1px solid ${CHART_COLORS[i%CHART_COLORS.length]}30`, padding:"2px 8px", borderRadius:100, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{c.name}: {c.value}</span>)}
                  </div>
                </div>
              )}
              {data.tools.length>0 && (
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:22 }}>
                  <ST>AI Tool Preferences</ST>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={data.tools} margin={{top:0,right:0,bottom:0,left:-28}}>
                      <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} />
                      <Tooltip {...tt} />
                      <Bar dataKey="value" fill={C.accent} radius={[5,5,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {data.modes.length>0 && (
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:22 }}>
                <ST>Expertise Level Distribution</ST>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={data.modes} margin={{top:0,right:20,bottom:0,left:-20}}>
                    <XAxis dataKey="name" tick={{fill:C.muted,fontSize:12}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill:C.dim,fontSize:10}} axisLine={false} tickLine={false} />
                    <Tooltip {...tt} />
                    <Bar dataKey="value" radius={[5,5,0,0]}>
                      {data.modes.map((e,i)=><Cell key={i} fill={e.name==="novice"?C.green:e.name==="professional"?C.accent:C.purple} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:22 }}>
              <ST>Psychology Insights</ST>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:12 }}>
                {[
                  {emoji:"❤️",label:"Top category",       value:data.topCat,                    note:"Double down here"},
                  {emoji:"🤖",label:"Preferred AI tool",  value:data.topTool,                   note:"Optimise defaults for this model"},
                  {emoji:"📊",label:"Engagement depth",   value:data.engagementLevel,            note:data.avgGoalLen>100?"High intent users":"Nudge for more context"},
                  {emoji:"📋",label:"Adoption rate",      value:`${data.copyRate}%`,             note:data.copyRate>60?"Strong product-market fit":"Improve result quality"},
                  {emoji:"⭐",label:"Quality signal",     value:data.avgRating==="N/A"?"No ratings":data.avgRating, note:"User satisfaction with outputs"},
                  {emoji:"⏰",label:"Peak usage hour",    value:`${data.peakHour}:00`,           note:"Best time to push updates"},
                ].map(({emoji,label,value,note})=>(
                  <div key={label} style={{ background:C.card, borderRadius:14, padding:"14px" }}>
                    <div style={{ fontSize:18, marginBottom:8 }}>{emoji}</div>
                    <div style={{ fontSize:9, color:C.dim, marginBottom:3, fontFamily:"'Plus Jakarta Sans',sans-serif", textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:C.accent, fontSize:14, marginBottom:6 }}>{value}</div>
                    <div style={{ fontSize:10, color:C.dim, lineHeight:1.5, fontFamily:"'Plus Jakarta Sans',sans-serif", fontStyle:"italic" }}>{note}</div>
                  </div>
                ))}
              </div>
            </div>
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
  const [view,     setView]     = useState("landing");
  const [mode,     setMode]     = useState("novice");
  const [formData, setFormData] = useState(null);
  const [isDark,   setIsDark]   = useState(() => SessionService.getTheme() === "dark");
  const [shared,   setShared]   = useState(null);

  const C = isDark ? DARK_THEME : LIGHT_THEME;
  const { loading, result, error, generate, reset } = useGeneratePrompt();

  // Inject global CSS
  useEffect(() => {
    let el = document.getElementById("quill-css");
    if(!el){ el = document.createElement("style"); el.id="quill-css"; document.head.appendChild(el); }
    el.innerHTML = CSS(isDark);
  }, [isDark]);

  // Check for shared prompt in URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if(hash.startsWith("#share=")) {
      try {
        const data = JSON.parse(decodeURIComponent(escape(atob(hash.slice(7)))));
        setShared(data); setView("shared");
      } catch {}
    }
  }, []);

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setIsDark(!isDark);
    SessionService.saveTheme(next);
  };

  const handleWizardComplete = async (form) => {
    setFormData(form); setView("generating");
    await generate(form);
    setView("result");
  };

  const handleRegenerate = async () => {
    if(!formData) return;
    setView("generating");
    await generate(formData);
    setView("result");
  };

  const goHome   = () => { reset(); setView("landing"); window.location.hash=""; };
  const goWizard = () => { reset(); setView("wizard"); };

  const sharedProps = { isDark, toggleTheme };

  return (
    <ThemeCtx.Provider value={C}>
      {view==="landing"    && <LandingView   onStart={m=>{setMode(m);setView("wizard");}} onAdmin={()=>setView("adminLogin")} onHistory={()=>setView("history")} {...sharedProps} />}
      {view==="wizard"     && <WizardView    mode={mode} onComplete={handleWizardComplete} onBack={goHome} {...sharedProps} />}
      {(view==="generating"||loading) && <LoadingView mode={formData?.mode||mode} />}
      {view==="result" && result && <ResultView result={result} form={formData} onNew={goWizard} onRegenerate={handleRegenerate} loading={loading} />}
      {view==="history"    && <HistoryView   onBack={goHome} />}
      {view==="shared"     && <SharedPromptView data={shared} onNew={()=>{setView("landing");window.location.hash="";}} />}
      {view==="adminLogin" && <AdminLoginView onLogin={()=>setView("admin")} onBack={goHome} />}
      {view==="admin"      && <AdminDashboard onLogout={goHome} />}
      {error && view!=="generating" && (
        <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:18, padding:20 }}>
          <div style={{ fontSize:44 }}>⚠️</div>
          <p style={{ color:"#FF6B6B", fontFamily:"'Plus Jakarta Sans',sans-serif", textAlign:"center", maxWidth:400 }}>{error}</p>
          <Btn onClick={goWizard}>← Try Again</Btn>
        </div>
      )}
    </ThemeCtx.Provider>
  );
}
