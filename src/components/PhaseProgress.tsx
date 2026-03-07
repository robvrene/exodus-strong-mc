"use client";

import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Phase Progress Bar — horizontal step tracker at the top of the dashboard
// ---------------------------------------------------------------------------

const PHASES = [
  { id: "startup", label: "Startup", icon: "🔧" },
  { id: "vision", label: "Vision", icon: "👁️" },
  { id: "brand", label: "Brand", icon: "🎨" },
  { id: "character", label: "Character", icon: "🎭" },
  { id: "planner", label: "Planner", icon: "📋" },
  { id: "wave1", label: "Wave 1", icon: "🌊" },
  { id: "wave2", label: "Wave 2", icon: "🌊" },
  { id: "wave3", label: "Wave 3", icon: "🌊" },
  { id: "complete", label: "Complete", icon: "🏁" },
];

interface PhaseProgressProps {
  currentPhase: string;
  businessName: string | null;
  volunteerName: string | null;
  startTime: string | null;
}

export default function PhaseProgress({
  currentPhase,
  businessName,
  volunteerName,
  startTime,
}: PhaseProgressProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const start = new Date(startTime).getTime();

    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(17,22,36,0.95), rgba(11,15,25,0.95))",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "12px 24px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        {/* Business name */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {businessName && (
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
                color: "#F5F7FA",
              }}
            >
              {businessName}
            </span>
          )}
          {volunteerName && (
            <span style={{ fontSize: 12, color: "#8A8F98" }}>
              with {volunteerName}
            </span>
          )}
          {!businessName && (
            <span style={{ fontSize: 14, color: "#6B7186", fontFamily: "'Space Grotesk', sans-serif" }}>
              Awaiting Demo...
            </span>
          )}
        </div>

        {/* Elapsed timer */}
        {startTime && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 12px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", letterSpacing: 1 }}>
              ELAPSED
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "'Orbitron', monospace",
                color: elapsed > 1800 ? "#EF4444" : elapsed > 1200 ? "#F59E0B" : "#10B981",
              }}
            >
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>

      {/* Phase steps */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, overflow: "auto" }}>
        {PHASES.map((phase, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div key={phase.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              {/* Step dot + label */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                <div
                  style={{
                    width: isCurrent ? 28 : 22,
                    height: isCurrent ? 28 : 22,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isCurrent ? 14 : 11,
                    transition: "all 0.3s ease",
                    background: isComplete
                      ? "linear-gradient(135deg, #10B981, #2F80FF)"
                      : isCurrent
                      ? "linear-gradient(135deg, #7B61FF, #FF4EDB)"
                      : "rgba(255,255,255,0.06)",
                    border: isCurrent
                      ? "2px solid #FF4EDB"
                      : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: isCurrent ? "0 0 12px rgba(255,78,219,0.4)" : "none",
                    animation: isCurrent ? "pulse 2s ease-in-out infinite" : "none",
                  }}
                >
                  {isComplete ? "✓" : phase.icon}
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "'Orbitron', monospace",
                    letterSpacing: 1,
                    marginTop: 4,
                    color: isComplete ? "#10B981" : isCurrent ? "#FF4EDB" : "#555",
                    fontWeight: isCurrent ? 700 : 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  {phase.label}
                </span>
              </div>

              {/* Connector line */}
              {i < PHASES.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    marginTop: -16,
                    background: isComplete
                      ? "linear-gradient(90deg, #10B981, #2F80FF)"
                      : isCurrent
                      ? "linear-gradient(90deg, #FF4EDB, rgba(255,255,255,0.1))"
                      : "rgba(255,255,255,0.06)",
                    minWidth: 20,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
