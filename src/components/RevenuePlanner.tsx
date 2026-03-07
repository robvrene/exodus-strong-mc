"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Revenue Planner — The LOCK & BUILD moment
// ---------------------------------------------------------------------------

type Timing = "now" | "later" | "skip";

const REVENUE_GOALS = [10000, 25000, 50000, 100000, 250000, 500000, 1000000];

const PROMOTE_CHANNELS = [
  { id: "prospect", name: "Prospect", desc: "Cold outreach at scale", icon: "📧" },
  { id: "publish", name: "Publish", desc: "Content engine", icon: "🎬" },
  { id: "paid", name: "Pay", desc: "Paid advertising", icon: "💰" },
  { id: "partnership", name: "Partnership", desc: "Affiliates & JVs", icon: "🤝" },
];

const PROFIT_CHANNELS = [
  { id: "cart", name: "Cart", desc: "1-page sales page", icon: "🛒" },
  { id: "call", name: "Call", desc: "Application funnel", icon: "📞" },
  { id: "crowd", name: "Crowd", desc: "Webinar/event page", icon: "🎙️" },
  { id: "aiSales", name: "AI Sales Team", desc: "GHL bot", icon: "🤖" },
];

const PRODUCE_OPTIONS = [
  { id: "ship", label: "Ship", icon: "📦" },
  { id: "serve", label: "Serve", icon: "⚡" },
  { id: "unlock", label: "Unlock", icon: "🔓" },
  { id: "shift", label: "Shift", icon: "🎯" },
];

const TIMING_STYLES: Record<Timing, { bg: string; border: string; color: string; label: string }> = {
  now: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.35)", color: "#10B981", label: "NOW" },
  later: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", color: "#F59E0B", label: "LATER" },
  skip: { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)", color: "#555", label: "SKIP" },
};

const cycleTiming = (t: Timing): Timing => t === "skip" ? "now" : t === "now" ? "later" : "skip";

const fK = (n: number) => {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "K";
  return "$" + n;
};

interface RevenuePlannerProps {
  demoId: string | null;
  onLocked: () => void;
}

export default function RevenuePlanner({ demoId, onLocked }: RevenuePlannerProps) {
  const [revenueGoal, setRevenueGoal] = useState(100000);
  const [promote, setPromote] = useState<Record<string, Timing>>({
    prospect: "skip", publish: "skip", paid: "skip", partnership: "skip",
  });
  const [profit, setProfit] = useState<Record<string, Timing>>({
    cart: "skip", call: "skip", crowd: "skip", aiSales: "skip",
  });
  const [produce, setProduce] = useState<Record<string, boolean>>({
    ship: false, serve: false, unlock: false, shift: false,
  });
  const [locking, setLocking] = useState(false);
  const [lockPhase, setLockPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasProfitNow = Object.values(profit).some((v) => v === "now");

  const handleLockAndBuild = async () => {
    if (!hasProfitNow) {
      setError("You need at least one PROFIT channel set to NOW");
      return;
    }
    if (!demoId) {
      setError("No active demo — start a demo first");
      return;
    }

    setError(null);
    setLocking(true);
    setLockPhase("Saving revenue plan...");

    try {
      setLockPhase("Locking plan to database...");
      const resp = await fetch("/api/revenue-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demoId,
          revenueGoal,
          promoteProspect: promote.prospect,
          promotePaid: promote.paid,
          promotePublish: promote.publish,
          promotePartnership: promote.partnership,
          profitCart: profit.cart,
          profitCall: profit.call,
          profitCrowd: profit.crowd,
          profitAiSales: profit.aiSales,
          produceSelections: produce,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Failed to save plan");
      }

      setLockPhase("Signaling OpenClaw AI...");
      await new Promise((r) => setTimeout(r, 800));

      setLockPhase("Spawning Wave 1 bots...");
      await new Promise((r) => setTimeout(r, 1200));

      setLockPhase("Mission Control is LIVE");
      await new Promise((r) => setTimeout(r, 600));

      onLocked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLocking(false);
      setLockPhase(null);
    }
  };

  // Lock animation overlay
  if (locking) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0F19", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 500 }}>
          <div
            style={{
              fontSize: 64,
              marginBottom: 24,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            🚀
          </div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: 4,
              fontFamily: "'Orbitron', monospace",
              background: "linear-gradient(90deg, #2F80FF, #7B61FF, #FF4EDB)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 16,
            }}
          >
            LAUNCHING MISSION CONTROL
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: "#F5F7FA",
              marginBottom: 24,
            }}
          >
            {lockPhase}
          </div>
          <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #2F80FF, #7B61FF, #FF4EDB)",
                borderRadius: 2,
                animation: "loading 2s ease-in-out infinite",
              }}
            />
          </div>
          <style jsx>{`
            @keyframes loading {
              0% { width: 0%; }
              50% { width: 80%; }
              100% { width: 100%; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, fontFamily: "'Orbitron', monospace", color: "#FF4EDB", marginBottom: 4 }}>
            PHASE 4 — REVENUE PLANNER
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "#F5F7FA", margin: 0 }}>
            Build Your Revenue Engine
          </h1>
          <p style={{ fontSize: 13, color: "#8A8F98", marginTop: 4 }}>
            Choose your plays. Lock the plan. Watch the bots build it live.
          </p>
        </div>

        {/* Revenue Goal */}
        <div style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(47,128,255,0.06))",
          border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "20px 24px", marginBottom: 24,
        }}>
          <div style={{ fontSize: 10, letterSpacing: 3, fontFamily: "'Orbitron', monospace", color: "#10B981", marginBottom: 12 }}>
            REVENUE TARGET
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {REVENUE_GOALS.map((goal) => (
              <button
                key={goal}
                onClick={() => setRevenueGoal(goal)}
                style={{
                  padding: "10px 18px", borderRadius: 6, cursor: "pointer", fontSize: 14,
                  fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
                  background: revenueGoal === goal ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                  border: `2px solid ${revenueGoal === goal ? "#10B981" : "rgba(255,255,255,0.08)"}`,
                  color: revenueGoal === goal ? "#10B981" : "#8A8F98",
                  transition: "all 0.15s ease",
                }}
              >
                {fK(goal)}
              </button>
            ))}
          </div>
        </div>

        {/* PROMOTE Section */}
        <SectionHeader label="PROMOTE" subtitle="Get Leads" color="#2F80FF" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {PROMOTE_CHANNELS.map((ch) => (
            <TimingCard
              key={ch.id}
              name={ch.name}
              desc={ch.desc}
              icon={ch.icon}
              timing={promote[ch.id]}
              onCycle={() => setPromote({ ...promote, [ch.id]: cycleTiming(promote[ch.id]) })}
            />
          ))}
        </div>

        {/* PROFIT Section */}
        <SectionHeader label="PROFIT" subtitle="Close Sales" color="#FF4EDB" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {PROFIT_CHANNELS.map((ch) => (
            <TimingCard
              key={ch.id}
              name={ch.name}
              desc={ch.desc}
              icon={ch.icon}
              timing={profit[ch.id]}
              onCycle={() => setProfit({ ...profit, [ch.id]: cycleTiming(profit[ch.id]) })}
            />
          ))}
        </div>

        {/* PRODUCE Section */}
        <SectionHeader label="PRODUCE" subtitle="Informs Copy — Does Not Spawn Bots" color="#7B61FF" />
        <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
          {PRODUCE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setProduce({ ...produce, [opt.id]: !produce[opt.id] })}
              style={{
                padding: "12px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif",
                display: "flex", alignItems: "center", gap: 8,
                background: produce[opt.id] ? "rgba(123,97,255,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${produce[opt.id] ? "rgba(123,97,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                color: produce[opt.id] ? "#7B61FF" : "#8A8F98",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 18 }}>{opt.icon}</span>
              {opt.label}
              {produce[opt.id] && <span style={{ fontSize: 11 }}>✓</span>}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#EF4444", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* LOCK & BUILD Button */}
        <button
          onClick={handleLockAndBuild}
          disabled={!hasProfitNow}
          style={{
            width: "100%",
            padding: "20px 32px",
            borderRadius: 12,
            border: hasProfitNow ? "2px solid #FF4EDB" : "2px solid rgba(255,255,255,0.1)",
            cursor: hasProfitNow ? "pointer" : "not-allowed",
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "'Orbitron', monospace",
            letterSpacing: 3,
            transition: "all 0.3s ease",
            background: hasProfitNow
              ? "linear-gradient(135deg, rgba(47,128,255,0.15), rgba(123,97,255,0.15), rgba(255,78,219,0.15))"
              : "rgba(255,255,255,0.03)",
            color: hasProfitNow ? "#FF4EDB" : "#555",
            boxShadow: hasProfitNow
              ? "0 0 30px rgba(255,78,219,0.2), inset 0 0 30px rgba(255,78,219,0.05)"
              : "none",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {hasProfitNow && (
            <div
              style={{
                position: "absolute", top: 0, left: "-100%", width: "200%", height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,78,219,0.1), transparent)",
                animation: "shimmer 3s ease-in-out infinite",
              }}
            />
          )}
          <span style={{ position: "relative", zIndex: 1 }}>
            🚀 LOCK & BUILD →
          </span>
          <style jsx>{`
            @keyframes shimmer {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(50%); }
            }
            button:hover {
              transform: ${hasProfitNow ? "scale(1.02)" : "none"};
              box-shadow: ${hasProfitNow ? "0 0 50px rgba(255,78,219,0.3), inset 0 0 50px rgba(255,78,219,0.08)" : "none"};
            }
          `}</style>
        </button>

        {!hasProfitNow && (
          <div style={{ textAlign: "center", fontSize: 12, color: "#6B7186", marginTop: 8 }}>
            Select at least one PROFIT channel as "NOW" to unlock
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ label, subtitle, color }: { label: string; subtitle: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'Space Grotesk', sans-serif" }}>{label}</div>
      <div style={{ fontSize: 10, color: "#6B7186", fontFamily: "'Orbitron', monospace", letterSpacing: 1 }}>{subtitle.toUpperCase()}</div>
      <div style={{ flex: 1, height: 1, background: `${color}25` }} />
    </div>
  );
}

function TimingCard({
  name, desc, icon, timing, onCycle,
}: {
  name: string; desc: string; icon: string; timing: Timing; onCycle: () => void;
}) {
  const st = TIMING_STYLES[timing];
  return (
    <div
      onClick={onCycle}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: st.bg, border: `1px solid ${st.border}`, borderRadius: 8,
        padding: "14px 16px", cursor: "pointer", transition: "all 0.15s ease",
        borderLeft: `4px solid ${st.color}`,
        opacity: timing === "skip" ? 0.6 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>{name}</div>
          <div style={{ fontSize: 11, color: "#8A8F98" }}>{desc}</div>
        </div>
      </div>
      <span
        style={{
          fontSize: 9, padding: "4px 12px", borderRadius: 4,
          background: st.bg, border: `1px solid ${st.border}`,
          color: st.color, fontFamily: "'Orbitron', monospace", letterSpacing: 1,
        }}
      >
        {st.label}
      </span>
    </div>
  );
}
