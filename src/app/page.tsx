"use client";

import { useState, useEffect, useCallback } from "react";
import CEODashboard from "@/components/CEODashboard";
import RevenueEngine from "@/components/RevenueEngine";
import AIWorkforce from "@/components/AIWorkforce";
import ProfitPipeline from "@/components/ProfitPipeline";
import MediaHub from "@/components/MediaHub";
import Projects from "@/components/Projects";
import Financials from "@/components/Financials";
import LiveKanban from "@/components/LiveKanban";
import RevenuePlanner from "@/components/RevenuePlanner";
import LiveMediaHub from "@/components/LiveMediaHub";
import StartupCheck from "@/components/StartupCheck";
import PhaseProgress from "@/components/PhaseProgress";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSSE } from "@/lib/useSSE";

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

const SEPARATOR = "---";

const navItems = [
  // Live demo section
  { id: "pre-flight", label: "Pre-Flight", icon: "🔧", color: "#F59E0B" },
  { id: "mission-control", label: "Mission Control", icon: "🛰️", color: "#7B61FF" },
  { id: "revenue-planner", label: "Revenue Planner", icon: "🚀", color: "#FF4EDB" },
  { id: "live-media", label: "Live Media Hub", icon: "📡", color: "#2F80FF" },
  { id: SEPARATOR, label: "", icon: "", color: "" },
  // Original demo views
  { id: "ceo-dashboard", label: "CEO Dashboard", icon: "📊", color: "#FF4EDB" },
  { id: "revenue-engine", label: "Revenue Engine", icon: "💰", color: "#10B981" },
  { id: "ai-workforce", label: "AI Workforce", icon: "🤖", color: "#2F80FF" },
  { id: "profit-pipeline", label: "Profit Pipeline", icon: "📈", color: "#10B981" },
  { id: "media-hub", label: "Media Hub", icon: "🎬", color: "#FF4EDB" },
  { id: "projects", label: "Projects", icon: "📋", color: "#7B61FF" },
  { id: "financials", label: "Financials", icon: "💵", color: "#10B981" },
];

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

interface DemoState {
  id: string | null;
  businessName: string | null;
  volunteerName: string | null;
  phase: string;
  startTime: string | null;
}

export default function Home() {
  const [activeView, setActiveView] = useState("pre-flight");
  const [demo, setDemo] = useState<DemoState>({
    id: null,
    businessName: null,
    volunteerName: null,
    phase: "startup",
    startTime: null,
  });
  const [dbWarning, setDbWarning] = useState(false);

  // Load active demo on mount
  useEffect(() => {
    fetch("/api/demo")
      .then((r) => r.json())
      .then((data) => {
        if (data.demo) {
          setDemo({
            id: data.demo.id,
            businessName: data.demo.business_name,
            volunteerName: data.demo.volunteer_name,
            phase: data.demo.phase || "startup",
            startTime: data.demo.created_at,
          });
        }
      })
      .catch(() => {
        // Likely no DB — show warning
        setDbWarning(true);
      });
  }, []);

  // SSE for phase updates
  const handleSSE = useCallback((eventType: string, data: unknown) => {
    const d = data as Record<string, unknown>;
    if (eventType === "phase_update") {
      setDemo((prev) => ({
        ...prev,
        id: (d.demoId as string) ?? prev.id,
        businessName: (d.businessName as string) ?? prev.businessName,
        volunteerName: (d.volunteerName as string) ?? prev.volunteerName,
        phase: (d.phase as string) ?? prev.phase,
        startTime: prev.startTime || new Date().toISOString(),
      }));
    }
    if (eventType === "demo_complete") {
      setDemo((prev) => ({ ...prev, phase: "complete" }));
    }
  }, []);

  useSSE({ onEvent: handleSSE });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#0B0F19" }}>
      {/* DB Warning Banner */}
      {dbWarning && (
        <div style={{
          background: "rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.3)",
          padding: "8px 24px", display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>⚠️</span>
          <span style={{ fontSize: 12, color: "#F59E0B" }}>
            No database configured — running in demo mode with in-memory state.
            Set DATABASE_URL in .env.local for persistence.
          </span>
        </div>
      )}

      {/* Phase Progress Bar */}
      <PhaseProgress
        currentPhase={demo.phase}
        businessName={demo.businessName}
        volunteerName={demo.volunteerName}
        startTime={demo.startTime}
      />

      <div style={{ display: "flex", flex: 1 }}>
        {/* Left Sidebar */}
        <div style={{
          width: 240,
          minWidth: 240,
          background: "linear-gradient(180deg, #111624 0%, #0B0F19 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 0",
        }}>
          {/* Logo/Brand */}
          <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{
              fontSize: 9,
              letterSpacing: 3,
              fontFamily: "'Orbitron', monospace",
              background: "linear-gradient(90deg, #2F80FF, #7B61FF, #FF4EDB)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 4,
            }}>
              AI MONETIZATION
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: "#F5F7FA",
            }}>
              Mission Control
            </div>
            <div style={{
              fontSize: 10,
              color: "#6B7186",
              marginTop: 4,
              fontFamily: "'Orbitron', monospace",
            }}>
              {demo.id ? "LIVE" : "DEMO MODE"}
            </div>
          </div>

          {/* Navigation Buttons */}
          <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
            {navItems.map((item, idx) => {
              if (item.id === SEPARATOR) {
                return (
                  <div key={`sep-${idx}`} style={{
                    height: 1,
                    background: "rgba(255,255,255,0.06)",
                    margin: "8px 16px",
                  }} />
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 0.15s ease",
                    background: activeView === item.id
                      ? `linear-gradient(135deg, ${item.color}20, ${item.color}10)`
                      : "transparent",
                    borderLeft: activeView === item.id
                      ? `3px solid ${item.color}`
                      : "3px solid transparent",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{
                    fontSize: 13,
                    fontWeight: activeView === item.id ? 600 : 500,
                    color: activeView === item.id ? "#F5F7FA" : "#8A8F98",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              fontSize: 10,
              color: "#6B7186",
              fontFamily: "'Orbitron', monospace",
              letterSpacing: 1,
            }}>
              LIVE DEMO
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10B981",
                animation: "pulse 2s ease-in-out infinite",
              }} />
              <span style={{ fontSize: 12, color: "#10B981" }}>System Active</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Live demo views */}
          {activeView === "pre-flight" && (
            <ErrorBoundary fallbackLabel="Pre-Flight Check"><StartupCheck /></ErrorBoundary>
          )}
          {activeView === "mission-control" && (
            <ErrorBoundary fallbackLabel="Mission Control"><LiveKanban /></ErrorBoundary>
          )}
          {activeView === "revenue-planner" && (
            <ErrorBoundary fallbackLabel="Revenue Planner">
              <RevenuePlanner
                demoId={demo.id}
                onLocked={() => setActiveView("mission-control")}
              />
            </ErrorBoundary>
          )}
          {activeView === "live-media" && (
            <ErrorBoundary fallbackLabel="Live Media Hub"><LiveMediaHub /></ErrorBoundary>
          )}

          {/* Original demo views */}
          {activeView === "ceo-dashboard" && (
            <ErrorBoundary fallbackLabel="CEO Dashboard"><CEODashboard /></ErrorBoundary>
          )}
          {activeView === "revenue-engine" && (
            <ErrorBoundary fallbackLabel="Revenue Engine"><RevenueEngine /></ErrorBoundary>
          )}
          {activeView === "ai-workforce" && (
            <ErrorBoundary fallbackLabel="AI Workforce"><AIWorkforce /></ErrorBoundary>
          )}
          {activeView === "profit-pipeline" && (
            <ErrorBoundary fallbackLabel="Profit Pipeline"><ProfitPipeline /></ErrorBoundary>
          )}
          {activeView === "media-hub" && (
            <ErrorBoundary fallbackLabel="Media Hub"><MediaHub /></ErrorBoundary>
          )}
          {activeView === "projects" && (
            <ErrorBoundary fallbackLabel="Projects"><Projects /></ErrorBoundary>
          )}
          {activeView === "financials" && (
            <ErrorBoundary fallbackLabel="Financials"><Financials /></ErrorBoundary>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
