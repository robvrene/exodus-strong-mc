import { useState } from "react";
import { REVENUE_ENGINE } from "@/config/exodus-data";

const promoteChannels = REVENUE_ENGINE.promoteChannels;
const profitMechanisms = REVENUE_ENGINE.profitMechanisms;
const produceCategories = REVENUE_ENGINE.produceCategories;

const shelfFunnels = [
  { name: "Biblical Biohacker Quiz Funnel", icon: "❓" },
  { name: "Light Code Book VSL Page", icon: "🎬" },
  { name: "Discovery Call Application", icon: "📝" },
  { name: "God Algorithm Newsletter Bridge", icon: "📰" },
  { name: "Red Wave Guest Appearance Page", icon: "🌊" },
];

const allProduceItems = produceCategories.flatMap(cat => cat.items.map(item => ({ ...item, catColor: cat.color, catId: cat.id })));

const cycle = (s: string) => s === "off" ? "now" : s === "now" ? "later" : "off";

const statusConfig: Record<string, { bg: string; border: string; color: string; label: string }> = {
  now: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", color: "#10B981", label: "90-DAY FOCUS" },
  later: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", color: "#F59E0B", label: "PHASE 2" },
  off: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", color: "#555", label: "NOT SELECTED" },
};

const Badge = ({ status, onClick, locked }: { status: string; onClick: () => void; locked?: boolean }) => {
  const c = statusConfig[status];
  return (
    <button onClick={(e) => { e.stopPropagation(); if (!locked) onClick(); }}
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, padding: "4px 12px", borderRadius: 4, cursor: locked ? "not-allowed" : "pointer", fontSize: 9, fontFamily: "'Orbitron', monospace", letterSpacing: 1, whiteSpace: "nowrap", opacity: locked ? 0.7 : 1 }}>
      {c.label}
    </button>
  );
};

const LockToggle = ({ locked, onToggle }: { locked: boolean; onToggle: () => void }) => (
  <button onClick={onToggle}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 20px",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "'Space Grotesk', sans-serif",
      letterSpacing: 0.5,
      transition: "all 0.2s",
      ...(locked ? {
        background: "rgba(16,185,129,0.15)",
        border: "2px solid #10B981",
        color: "#10B981",
      } : {
        background: "transparent",
        border: "2px solid #F59E0B",
        color: "#F59E0B",
      })
    }}>
    <span style={{ fontSize: 18 }}>{locked ? "🔒" : "🔓"}</span>
    <span>90-Day Plan {locked ? "LOCKED" : "OPEN"}</span>
  </button>
);

const QuarterlyProgress = ({ currentRevenue, goal, daysRemaining }: { currentRevenue: number; goal: number; daysRemaining: number }) => {
  const progress = goal > 0 ? Math.min((currentRevenue / goal) * 100, 100) : 0;
  const remaining = goal - currentRevenue;
  const dailyTarget = daysRemaining > 0 ? Math.ceil(remaining / daysRemaining) : 0;
  
  return (
    <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(47,128,255,0.08))", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
      <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 16, fontFamily: "'Orbitron', monospace", color: "#10B981" }}>Q1 2026 PROGRESS</div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: "#6B7186", fontFamily: "'Orbitron', monospace", marginBottom: 4 }}>CURRENT REVENUE</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#10B981", fontFamily: "'Space Grotesk', sans-serif" }}>${currentRevenue.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#6B7186", fontFamily: "'Orbitron', monospace", marginBottom: 4 }}>90-DAY GOAL</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>${goal.toLocaleString()}</div>
        </div>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#8A8F98" }}>Progress</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#10B981", fontFamily: "'Space Grotesk', sans-serif" }}>{progress.toFixed(1)}%</span>
        </div>
        <div style={{ height: 10, background: "rgba(255,255,255,0.1)", borderRadius: 5, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #10B981, #2F80FF)", borderRadius: 5, transition: "width 0.5s ease" }} />
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", marginBottom: 2 }}>DAYS REMAINING</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#F59E0B", fontFamily: "'Space Grotesk', sans-serif" }}>{daysRemaining}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", marginBottom: 2 }}>DAILY TARGET TO HIT GOAL</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#FF4EDB", fontFamily: "'Space Grotesk', sans-serif" }}>${dailyTarget.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

const SummaryBar = ({ items, statuses }: { items: Array<{ id: string; name: string }>; statuses: Record<string, string> }) => {
  const now = items.filter(i => statuses[i.id] === "now");
  const later = items.filter(i => statuses[i.id] === "later");
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: 9, color: "#10B981", fontFamily: "'Orbitron', monospace", letterSpacing: 1 }}>90-DAY FOCUS </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#10B981", fontFamily: "'Space Grotesk', sans-serif" }}>{now.length}</span>
          {now.length > 0 && <span style={{ fontSize: 11, color: "#6B7186", marginLeft: 8 }}>{now.map(n => n.name).join(" + ")}</span>}
        </div>
        <div>
          <span style={{ fontSize: 9, color: "#F59E0B", fontFamily: "'Orbitron', monospace", letterSpacing: 1 }}>PHASE 2 </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", fontFamily: "'Space Grotesk', sans-serif" }}>{later.length}</span>
          {later.length > 0 && <span style={{ fontSize: 11, color: "#6B7186", marginLeft: 8 }}>{later.map(n => n.name).join(" + ")}</span>}
        </div>
      </div>
    </div>
  );
};

const fK = (n: number) => {
  if (n >= 1e6) return (n/1e6).toFixed(1)+"M";
  if (n >= 1000) return (n/1000).toFixed(1)+"K";
  return String(n);
};

export default function RevenueEnginePlanner() {
  const [view, setView] = useState("engine");
  const [promoteS, setPromoteS] = useState<Record<string, string>>({ prospect: "off", paid: "off", publish: "off", partnership: "off" });
  const [profitS, setProfitS] = useState<Record<string, string>>({ "ai-sales": "off", "lto-funnel": "off", "call-funnel": "off", "book-funnel": "off", webinar: "off", challenge: "off", event: "off" });
  const [produceS, setProduceS] = useState<Record<string, string>>({ "platform-sales": "off", "physical-products": "off", "digital-products": "off", "dfy-services": "off", software: "off", licensing: "off", subscriptions: "off", coaching: "off", consulting: "off", counseling: "off", "misc-other": "off" });
  const [offerDetails, setOfferDetails] = useState<Record<string, { name?: string }>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [revGoal, setRevGoal] = useState("1000000");
  const [planLocked, setPlanLocked] = useState(true);
  
  // Quarterly tracking values
  const currentRevenue = 847500;
  const daysRemaining = 26;

  const tNow = [...Object.values(promoteS), ...Object.values(profitS), ...Object.values(produceS)].filter(v => v === "now").length;
  const tLater = [...Object.values(promoteS), ...Object.values(profitS), ...Object.values(produceS)].filter(v => v === "later").length;
  const goal = Number(revGoal) || 0;

  const iS: React.CSSProperties = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "10px 14px", fontSize: 22, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif", outline: "none", width: "100%", textAlign: "center" };

  const rM = (m: typeof profitMechanisms[0]) => {
    const st = profitS[m.id];
    return (
      <div key={m.id} style={{ background: st==="now" ? m.color+"08" : "rgba(255,255,255,0.03)", border: "1px solid "+(st==="now" ? m.color+"33" : "rgba(255,255,255,0.06)"), borderRadius: 10, padding: "16px 20px", marginBottom: 10, borderLeft: "4px solid "+(st==="now" ? m.color : st==="later" ? "#F59E0B" : "rgba(255,255,255,0.06)"), opacity: st==="off" ? 0.6 : 1, ...(planLocked ? { pointerEvents: "none" as const, opacity: 0.8 } : {}) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{m.icon}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: st==="now" ? m.color : "#C8CCD4", fontFamily: "'Space Grotesk', sans-serif" }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "#8A8F98", marginTop: 2 }}>{m.desc}</div>
            </div>
          </div>
          <Badge status={st} onClick={() => setProfitS({ ...profitS, [m.id]: cycle(st) })} locked={planLocked} />
        </div>
        {planLocked && <div style={{ position: "absolute", top: 8, right: 8, fontSize: 12, opacity: 0.5 }}>🔒</div>}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", fontFamily: "'Inter', system-ui, sans-serif", color: "#F5F7FA" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg, #2F80FF, #7B61FF, #FF4EDB, #7B61FF, #2F80FF)" }} />

      {goal > 0 && (
        <div style={{ background: "rgba(16,185,129,0.06)", borderBottom: "1px solid rgba(16,185,129,0.15)", padding: "10px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 9, color: "#10B981", fontFamily: "'Orbitron', monospace", letterSpacing: 1 }}>90-DAY REVENUE GOAL </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#10B981", fontFamily: "'Space Grotesk', sans-serif" }}>${fK(goal)}</span>
            </div>
            <div style={{ fontSize: 10, color: "#6B7186", fontFamily: "'Orbitron', monospace" }}>90 DAYS</div>
          </div>
        </div>
      )}

      <div style={{ background: "linear-gradient(180deg, #111624, #0B0F19)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px 16px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 4, fontFamily: "'Orbitron', monospace", background: "linear-gradient(90deg, #2F80FF, #7B61FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI MONETIZATION WORKSHOPS</div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0", color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>Revenue Engine Planner</h1>
              <p style={{ fontSize: 12, color: "#6B7186", margin: "4px 0 0" }}>Choose your plays. Set your targets. Build your 90-day plan.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <LockToggle locked={planLocked} onToggle={() => setPlanLocked(!planLocked)} />
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ textAlign: "center", padding: "4px 14px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 6 }}>
                  <div style={{ fontSize: 9, color: "#10B981", fontFamily: "'Orbitron', monospace" }}>90-DAY</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#10B981", fontFamily: "'Space Grotesk', sans-serif" }}>{tNow}</div>
                </div>
                <div style={{ textAlign: "center", padding: "4px 14px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 6 }}>
                  <div style={{ fontSize: 9, color: "#F59E0B", fontFamily: "'Orbitron', monospace" }}>PHASE 2</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#F59E0B", fontFamily: "'Space Grotesk', sans-serif" }}>{tLater}</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
            {[{k:"engine",l:"ENGINE"},{k:"promote",l:"PROMOTE"},{k:"profit",l:"PROFIT"},{k:"produce",l:"PRODUCE"},{k:"plan",l:"MY 90-DAY PLAN"}].map(v=>(
              <button key={v.k} onClick={()=>setView(v.k)} style={{ background: view===v.k ? "linear-gradient(135deg, rgba(47,128,255,0.2), rgba(123,97,255,0.2))" : "transparent", border: "1px solid "+(view===v.k ? "rgba(47,128,255,0.4)" : "transparent"), color: view===v.k ? "#fff" : "#6B7186", padding: "6px 14px", borderRadius: 5, cursor: "pointer", fontSize: 10, fontFamily: "'Orbitron', monospace", letterSpacing: 1 }}>{v.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 48px" }}>
        
        <QuarterlyProgress currentRevenue={currentRevenue} goal={goal} daysRemaining={daysRemaining} />

        {view === "engine" && (
          <div>
            <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(47,128,255,0.06))", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "24px 28px", marginBottom: 24, position: "relative" }}>
              {planLocked && <div style={{ position: "absolute", top: 16, right: 16, fontSize: 14, opacity: 0.6 }}>🔒 Goal Locked</div>}
              <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 16, fontFamily: "'Orbitron', monospace", color: "#10B981" }}>SET YOUR 90-DAY TARGET</div>
              <div style={{ fontSize: 13, color: "#8A8F98", marginBottom: 12, lineHeight: 1.6 }}>What is your revenue goal for the next 90 days? This number drives everything.</div>
              <div style={{ maxWidth: 400, margin: "0 auto" }}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 28, fontWeight: 700, color: "#6B7186", fontFamily: "'Space Grotesk', sans-serif" }}>$</span>
                  <input type="number" value={revGoal} onChange={e=>!planLocked && setRevGoal(e.target.value)} placeholder="100000" style={{...iS, paddingLeft: 38, fontSize: 28, cursor: planLocked ? "not-allowed" : "text", opacity: planLocked ? 0.8 : 1}} readOnly={planLocked} />
                </div>
                {goal > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
                    {[{l:"DAILY",v:"$"+fK(Math.round(goal/90))},{l:"WEEKLY",v:"$"+fK(Math.round(goal/13))},{l:"MONTHLY",v:"$"+fK(Math.round(goal/3))}].map((m,i)=>(
                      <div key={i} style={{background:"rgba(16,185,129,0.06)",borderRadius:8,padding:"10px 12px",border:"1px solid rgba(16,185,129,0.12)",textAlign:"center"}}>
                        <div style={{fontSize:9,color:"#10B981",fontFamily:"'Orbitron', monospace",marginBottom:4}}>{m.l}</div>
                        <div style={{fontSize:18,fontWeight:700,color:"#10B981",fontFamily:"'Space Grotesk', sans-serif"}}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"20px 24px",marginBottom:24,textAlign:"center"}}>
              <div style={{fontSize:10,color:"#6B7186",letterSpacing:3,fontFamily:"'Orbitron', monospace",marginBottom:14}}>HOW THE ENGINE WORKS</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,flexWrap:"wrap",marginBottom:12}}>
                {[{label:"PROMOTE",color:"#2F80FF",sub:"Get Leads"},null,{label:"PROFIT",color:"#FF4EDB",sub:"Close Sales"},null,{label:"PRODUCE",color:"#7B61FF",sub:"Deliver & Delight"}].map((item,i)=>item ? (
                  <div key={i} style={{textAlign:"center"}}>
                    <div style={{background:item.color+"15",border:"1px solid "+item.color+"33",padding:"10px 20px",borderRadius:6,fontSize:14,fontWeight:700,color:item.color,fontFamily:"'Space Grotesk', sans-serif"}}>{item.label}</div>
                    <div style={{fontSize:10,color:"#6B7186",marginTop:4,fontFamily:"'Orbitron', monospace"}}>{item.sub}</div>
                  </div>
                ) : <span key={i} style={{color:"#333",fontSize:18}}>{"→"}</span>)}
                <span style={{color:"#333",fontSize:18}}>{"↩"}</span>
              </div>
              <div style={{fontSize:12,color:"#8A8F98",lineHeight:1.6,maxWidth:700,margin:"0 auto"}}>
                <strong style={{color:"#2F80FF"}}>Promote</strong> generates leads {"→"} <strong style={{color:"#FF4EDB"}}>Profit</strong> closes them {"→"} <strong style={{color:"#7B61FF"}}>Produce</strong> delivers and creates referrals that loop back
              </div>
            </div>

            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(47,128,255,0.15)",borderRadius:10,padding:"16px 20px",marginBottom:24,borderLeft:"4px solid #2F80FF"}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:6,fontFamily:"'Space Grotesk', sans-serif",color:"#2F80FF"}}>YOUR 90-DAY MISSION</div>
              <div style={{fontSize:13,color:"#C8CCD4",lineHeight:1.7}}>Pick the <strong>minimum viable plays</strong> to validate your offer and generate revenue in 90 days. The goal is <span style={{color:"#FF4EDB",fontWeight:600}}>focus, not coverage</span>.</div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
              {[{step:"01",label:"PROMOTE",color:"#2F80FF",desc:"Pick 1-2 channels to generate leads. One great channel beats four mediocre ones.",link:"promote"},{step:"02",label:"PROFIT",color:"#FF4EDB",desc:"Choose your funnels and closing methods. Cart, Call, or Crowd.",link:"profit"},{step:"03",label:"PRODUCE",color:"#7B61FF",desc:"Define what you are selling and delivering. Start with one core offer.",link:"produce"}].map((s,si)=>(
                <div key={si} onClick={()=>setView(s.link)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid "+s.color+"22",borderRadius:10,padding:"20px 22px",cursor:"pointer",borderTop:"3px solid "+s.color,position:"relative"}}>
                  {planLocked && <div style={{ position: "absolute", top: 10, right: 10, fontSize: 12, opacity: 0.5 }}>🔒</div>}
                  <div style={{fontSize:10,color:s.color,fontFamily:"'Orbitron', monospace",letterSpacing:2,marginBottom:8}}>STEP {s.step}</div>
                  <div style={{fontSize:18,fontWeight:700,color:s.color,fontFamily:"'Space Grotesk', sans-serif",marginBottom:8}}>{s.label}</div>
                  <div style={{fontSize:12,color:"#8A8F98",lineHeight:1.6}}>{s.desc}</div>
                  <div style={{fontSize:10,color:s.color,fontFamily:"'Orbitron', monospace",marginTop:12,letterSpacing:1}}>{planLocked ? "VIEW YOUR SELECTIONS →" : "CHOOSE YOUR PLAYS →"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "promote" && (
          <div>
            <div style={{fontSize:10,letterSpacing:3,marginBottom:6,fontFamily:"'Orbitron', monospace",color:"#2F80FF"}}>STEP 01 - PROMOTE</div>
            <div style={{fontSize:13,color:"#6B7186",marginBottom:6}}>How will you generate leads? Pick 1-2 channels for your 90-day focus.</div>
            <div style={{fontSize:11,color:"#555",marginBottom:20}}>Click the status badge to cycle: Not Selected {"→"} 90-Day Focus {"→"} Phase 2</div>
            <SummaryBar items={promoteChannels} statuses={promoteS} />
            {promoteChannels.map(ch => {
              const s = promoteS[ch.id];
              const isE = expanded === ch.id;
              return (
                <div key={ch.id} onClick={()=>!planLocked && setExpanded(isE?null:ch.id)} style={{background:s==="now"?ch.color+"08":"rgba(255,255,255,0.03)",border:"1px solid "+(s==="now"?ch.color+"33":"rgba(255,255,255,0.06)"),borderRadius:10,padding:"18px 22px",marginBottom:12,cursor:planLocked?"not-allowed":"pointer",borderLeft:"4px solid "+(s==="now"?ch.color:s==="later"?"#F59E0B":"rgba(255,255,255,0.06)"),opacity:s==="off"?0.6:planLocked?0.8:1,position:"relative"}}>
                  {planLocked && <div style={{ position: "absolute", top: 10, right: 10, fontSize: 12, opacity: 0.5 }}>🔒</div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:24}}>{ch.icon}</span>
                      <div>
                        <div style={{fontSize:16,fontWeight:700,color:s==="now"?ch.color:"#C8CCD4",fontFamily:"'Space Grotesk', sans-serif"}}>{ch.name}</div>
                        <div style={{fontSize:10,color:"#6B7186",fontFamily:"'Orbitron', monospace",letterSpacing:1}}>{ch.subtitle}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:9,padding:"2px 8px",borderRadius:3,background:"rgba(255,255,255,0.04)",color:"#6B7186",fontFamily:"'Orbitron', monospace"}}>{ch.effort}</span>
                      <span style={{fontSize:9,padding:"2px 8px",borderRadius:3,background:"rgba(255,255,255,0.04)",color:"#6B7186",fontFamily:"'Orbitron', monospace"}}>{ch.cost}</span>
                      <Badge status={s} onClick={()=>setPromoteS({...promoteS,[ch.id]:cycle(s)})} locked={planLocked} />
                    </div>
                  </div>
                  <div style={{fontSize:12,color:"#8A8F98",marginTop:8,lineHeight:1.5}}>{ch.desc}</div>
                  {isE && !planLocked && (
                    <div style={{marginTop:14,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:12}} onClick={e=>e.stopPropagation()}>
                      <div style={{fontSize:10,color:"#6B7186",fontFamily:"'Orbitron', monospace",letterSpacing:1,marginBottom:8}}>KEY TACTICS</div>
                      {ch.tactics.map((t,ti)=>(
                        <div key={ti} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:12,color:"#C8CCD4"}}>
                          <span style={{color:ch.color,fontSize:9,fontFamily:"'Orbitron', monospace",minWidth:18}}>0{ti+1}</span>{t}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {view === "profit" && (() => {
          const aiS = profitS["ai-sales"];
          const ai = profitMechanisms[0];
          return (
            <div>
              <div style={{fontSize:10,letterSpacing:3,marginBottom:6,fontFamily:"'Orbitron', monospace",color:"#FF4EDB"}}>STEP 02 - PROFIT</div>
              <div style={{fontSize:13,color:"#6B7186",marginBottom:6}}>How will you close sales? Three closing mechanisms - pick what fits.</div>
              <div style={{fontSize:11,color:"#555",marginBottom:20}}><strong style={{color:"#2F80FF"}}>Cart</strong> = the page sells it {"·"} <strong style={{color:"#FF4EDB"}}>Call</strong> = a conversation sells it {"·"} <strong style={{color:"#7B61FF"}}>Crowd</strong> = an event sells it</div>
              <SummaryBar items={profitMechanisms} statuses={profitS} />
              <div style={{background:aiS==="now"?"rgba(255,78,219,0.06)":"rgba(255,255,255,0.03)",border:"1px solid "+(aiS==="now"?"rgba(255,78,219,0.3)":"rgba(255,255,255,0.06)"),borderRadius:10,padding:"20px 22px",marginBottom:24,borderLeft:"4px solid "+(aiS==="now"?"#FF4EDB":aiS==="later"?"#F59E0B":"rgba(255,255,255,0.06)"),opacity:aiS==="off"?0.6:planLocked?0.8:1,position:"relative",pointerEvents:planLocked?"none":"auto"}}>
                {planLocked && <div style={{ position: "absolute", top: 10, right: 10, fontSize: 12, opacity: 0.5 }}>🔒</div>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:28}}>{ai.icon}</span>
                    <div>
                      <div style={{fontSize:18,fontWeight:700,color:aiS==="now"?"#FF4EDB":"#C8CCD4",fontFamily:"'Space Grotesk', sans-serif"}}>{ai.name}</div>
                      <div style={{fontSize:12,color:"#8A8F98",marginTop:2}}>{ai.desc}</div>
                    </div>
                  </div>
                  <Badge status={aiS} onClick={()=>setProfitS({...profitS,"ai-sales":cycle(aiS)})} locked={planLocked} />
                </div>
                <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
                  {["Sells tickets to events","Assists human closers","Closes deals directly","Pursues leads 24/7"].map((t,i)=>(
                    <span key={i} style={{fontSize:10,padding:"3px 10px",borderRadius:4,background:"rgba(255,78,219,0.06)",border:"1px solid rgba(255,78,219,0.12)",color:"#FF4EDB",fontFamily:"'Orbitron', monospace"}}>{t}</span>
                  ))}
                </div>
              </div>
              {[{label:"CART",sub:"THE PAGE SELLS IT",color:"#2F80FF",items:profitMechanisms.filter(m=>m.type==="Cart")},{label:"CALL",sub:"A CONVERSATION SELLS IT",color:"#FF4EDB",items:profitMechanisms.filter(m=>m.type==="Call"&&m.id!=="ai-sales")},{label:"CROWD",sub:"AN EVENT SELLS IT",color:"#7B61FF",items:profitMechanisms.filter(m=>m.type==="Crowd")}].map((sec,si)=>(
                <div key={si} style={{marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:700,color:sec.color,fontFamily:"'Space Grotesk', sans-serif"}}>{sec.label}</div>
                    <div style={{fontSize:10,color:"#555",fontFamily:"'Orbitron', monospace"}}>{sec.sub}</div>
                    <div style={{flex:1,height:1,background:sec.color+"25"}} />
                  </div>
                  {sec.items.map(rM)}
                </div>
              ))}
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"16px 20px"}}>
                <div style={{fontSize:10,letterSpacing:2,marginBottom:10,fontFamily:"'Orbitron', monospace",color:"#555"}}>ON THE SHELF</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {shelfFunnels.map((f,i)=>(
                    <span key={i} style={{fontSize:11,padding:"5px 12px",borderRadius:5,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",color:"#555"}}>{f.icon} {f.name}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {view === "produce" && (
          <div>
            <div style={{fontSize:10,letterSpacing:3,marginBottom:6,fontFamily:"'Orbitron', monospace",color:"#7B61FF"}}>STEP 03 - PRODUCE</div>
            <div style={{fontSize:13,color:"#6B7186",marginBottom:6}}>What are you selling and delivering? Select the product types that apply to your business.</div>
            <div style={{fontSize:11,color:"#555",marginBottom:20}}>Great delivery creates referrals - referrals loop back to Promote. Production IS marketing.</div>
            <SummaryBar items={allProduceItems} statuses={produceS} />
            {produceCategories.map(cat => (
              <div key={cat.id} style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: cat.color, fontFamily: "'Space Grotesk', sans-serif" }}>{cat.label}</div>
                  <div style={{ fontSize: 10, color: "#555", fontFamily: "'Orbitron', monospace" }}>{cat.desc.toUpperCase()}</div>
                  <div style={{ flex: 1, height: 1, background: cat.color + "25" }} />
                </div>
                {cat.items.map(item => {
                  const s = produceS[item.id];
                  const det = offerDetails[item.id] || {};
                  return (
                    <div key={item.id} style={{ background: s === "now" ? cat.color + "08" : "rgba(255,255,255,0.03)", border: "1px solid " + (s === "now" ? cat.color + "33" : "rgba(255,255,255,0.06)"), borderRadius: 10, padding: "16px 20px", marginBottom: 10, borderLeft: "4px solid " + (s === "now" ? cat.color : s === "later" ? "#F59E0B" : "rgba(255,255,255,0.06)"), opacity: s === "off" ? 0.6 : planLocked ? 0.8 : 1, position: "relative", pointerEvents: planLocked ? "none" : "auto" }}>
                      {planLocked && <div style={{ position: "absolute", top: 10, right: 10, fontSize: 12, opacity: 0.5 }}>🔒</div>}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{item.icon}</span>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: s === "now" ? cat.color : "#C8CCD4", fontFamily: "'Space Grotesk', sans-serif" }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: "#8A8F98", marginTop: 2 }}>{item.desc}</div>
                          </div>
                        </div>
                        <Badge status={s} onClick={() => setProduceS({ ...produceS, [item.id]: cycle(s) })} locked={planLocked} />
                      </div>
                      {s === "now" && item.id === "misc-other" && !planLocked && (
                        <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                          <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", letterSpacing: 1, marginBottom: 4 }}>DESCRIBE YOUR PRODUCT / SERVICE</div>
                          <input type="text" value={det.name || ""} onChange={e => setOfferDetails({...offerDetails, [item.id]: {...det, name: e.target.value}})} placeholder="e.g. Event ticket sales, real estate, etc." style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, padding: "8px 12px", fontSize: 13, color: "#F5F7FA", fontFamily: "'Inter', sans-serif", outline: "none", width: "100%" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {view === "plan" && (
          <div>
            <div style={{fontSize:10,letterSpacing:3,marginBottom:6,fontFamily:"'Orbitron', monospace",color:"#10B981"}}>YOUR 90-DAY REVENUE ENGINE</div>
            <div style={{fontSize:13,color:"#6B7186",marginBottom:24}}>Everything here gets built and activated in the next 90 days.</div>
            {goal > 0 && (
              <div style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:10,padding:"16px 20px",marginBottom:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div style={{fontSize:10,color:"#10B981",fontFamily:"'Orbitron', monospace",letterSpacing:2}}>REVENUE TARGET</div>
                  <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                    {[{l:"90-DAY",v:"$"+fK(goal)},{l:"MONTHLY",v:"$"+fK(Math.round(goal/3))},{l:"WEEKLY",v:"$"+fK(Math.round(goal/13))},{l:"DAILY",v:"$"+fK(Math.round(goal/90))}].map((m,i)=>(
                      <div key={i} style={{textAlign:"center"}}>
                        <div style={{fontSize:9,color:"#6B7186",fontFamily:"'Orbitron', monospace"}}>{m.l}</div>
                        <div style={{fontSize:18,fontWeight:700,color:"#10B981",fontFamily:"'Space Grotesk', sans-serif"}}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {[{label:"PROMOTE",color:"#2F80FF",items:promoteChannels,st:promoteS,sub:"Generating Leads"},{label:"PROFIT",color:"#FF4EDB",items:profitMechanisms,st:profitS,sub:"Closing Sales"},{label:"PRODUCE",color:"#7B61FF",items:allProduceItems,st:produceS,sub:"Delivering Value"}].map((sec,si)=>{
              const nI=sec.items.filter(i=>sec.st[i.id]==="now");
              const lI=sec.items.filter(i=>sec.st[i.id]==="later");
              return(
                <div key={si} style={{marginBottom:28}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <div style={{fontSize:14,fontWeight:700,color:sec.color,fontFamily:"'Space Grotesk', sans-serif"}}>{sec.label}</div>
                    <div style={{fontSize:10,color:"#6B7186",fontFamily:"'Orbitron', monospace"}}>{sec.sub}</div>
                  </div>
                  {nI.length===0&&lI.length===0&&<div style={{background:"rgba(255,255,255,0.02)",border:"1px dashed rgba(255,255,255,0.1)",borderRadius:8,padding:20,textAlign:"center",fontSize:12,color:"#555"}}>No selections yet</div>}
                  {nI.length>0&&(
                    <div style={{marginBottom:lI.length>0?12:0}}>
                      <div style={{fontSize:9,color:"#10B981",fontFamily:"'Orbitron', monospace",letterSpacing:1,marginBottom:8}}>90-DAY FOCUS</div>
                      <div style={{display:"grid",gridTemplateColumns:nI.length>2?"1fr 1fr 1fr":nI.length>1?"1fr 1fr":"1fr",gap:10}}>
                        {nI.map(it=>(
                          <div key={it.id} style={{background:sec.color+"08",border:"1px solid "+sec.color+"33",borderRadius:8,padding:"14px 16px",borderLeft:"3px solid "+sec.color}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:20}}>{it.icon}</span>
                              <div>
                                <div style={{fontSize:14,fontWeight:700,color:sec.color,fontFamily:"'Space Grotesk', sans-serif"}}>{it.name}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {lI.length>0&&(
                    <div>
                      <div style={{fontSize:9,color:"#F59E0B",fontFamily:"'Orbitron', monospace",letterSpacing:1,marginBottom:8}}>PHASE 2</div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        {lI.map(it=>(
                          <span key={it.id} style={{fontSize:11,padding:"5px 12px",borderRadius:5,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",color:"#F59E0B"}}>{it.icon} {it.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {tNow>0&&(
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"20px 24px",textAlign:"center"}}>
                <div style={{fontSize:10,color:"#6B7186",letterSpacing:3,fontFamily:"'Orbitron', monospace",marginBottom:14}}>YOUR ENGINE IN MOTION</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,flexWrap:"wrap"}}>
                  {[{its:promoteChannels.filter(c=>promoteS[c.id]==="now"),c:"#2F80FF",l:"PROMOTE"},{its:profitMechanisms.filter(m=>profitS[m.id]==="now"),c:"#FF4EDB",l:"PROFIT"},{its:allProduceItems.filter(o=>produceS[o.id]==="now"),c:"#7B61FF",l:"PRODUCE"}].map((col,ci)=>(
                    <div key={ci} style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{textAlign:"center"}}>
                        {col.its.length>0?col.its.map(it=>(
                          <div key={it.id} style={{fontSize:11,color:col.c,marginBottom:2,fontWeight:600}}>{it.icon} {it.name}</div>
                        )):<div style={{fontSize:11,color:"#555"}}> -</div>}
                        <div style={{fontSize:9,color:"#6B7186",fontFamily:"'Orbitron', monospace",marginTop:4}}>{col.l}</div>
                      </div>
                      {ci<2&&<span style={{color:"#333",fontSize:18}}>{"→"}</span>}
                    </div>
                  ))}
                  <span style={{color:"#333",fontSize:18}}>{"↩"}</span>
                </div>
                <div style={{fontSize:11,color:"#6B7186",marginTop:12}}>Referrals from great delivery loop back to Promote. The engine compounds.</div>
              </div>
            )}
          </div>
        )}

        <div style={{marginTop:32,textAlign:"center"}}>
          <div style={{height:2,background:"linear-gradient(90deg, transparent, #2F80FF44, #7B61FF44, #FF4EDB44, transparent)",marginBottom:16}} />
          <span style={{fontSize:16,fontWeight:700,fontFamily:"'Space Grotesk', sans-serif",color:"#F5F7FA"}}>STOP LEARNING. <span style={{color:"#FF4EDB"}}>START BUILDING.</span></span>
        </div>
      </div>
    </div>
  );
}
