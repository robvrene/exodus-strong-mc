"use client";

import { useState } from "react";
import CEODashboard from "@/components/CEODashboard";
import RevenueEngine from "@/components/RevenueEngine";
import AIWorkforce from "@/components/AIWorkforce";
import ProfitPipeline from "@/components/ProfitPipeline";
import MediaHub from "@/components/MediaHub";
import Projects from "@/components/Projects";
import Financials from "@/components/Financials";
import BusinessSetup from "@/components/BusinessSetup";
import LiveDemo from "@/components/LiveDemo";

// Navigation items
const navItems = [
  { id: "live-demo", label: "🔴 LIVE DEMO", icon: "📡", color: "#FF4EDB" },
  { id: "ceo-dashboard", label: "CEO Dashboard", icon: "📊", color: "#FF4EDB" },
  { id: "revenue-engine", label: "Revenue Engine", icon: "💰", color: "#10B981" },
  { id: "ai-workforce", label: "AI Workforce", icon: "🤖", color: "#2F80FF" },
  { id: "profit-pipeline", label: "Profit Pipeline", icon: "📈", color: "#10B981" },
  { id: "media-hub", label: "Media Hub", icon: "🎬", color: "#FF4EDB" },
  { id: "projects", label: "Projects", icon: "📋", color: "#7B61FF" },
  { id: "financials", label: "Financials", icon: "💵", color: "#10B981" },
  { id: "business-setup", label: "Business Setup", icon: "⚙️", color: "#8A8F98" },
];

export default function Home() {
  const [activeView, setActiveView] = useState("live-demo");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0B0F19" }}>
      {/* Left Sidebar */}
      <div style={{
        width: 260,
        minWidth: 260,
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
            AI MONETIZATION LIVE
          </div>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            color: "#F5F7FA",
          }}>
            Viral Growth Agency
          </div>
          <div style={{
            fontSize: 10,
            color: "#6B7186",
            marginTop: 4,
            fontFamily: "'Orbitron', monospace",
          }}>
            MISSION CONTROL
          </div>
        </div>

        {/* Navigation Buttons */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => (
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
          ))}
        </nav>

        {/* Bottom Info */}
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            fontSize: 10,
            color: "#6B7186",
            marginBottom: 4,
          }}>
            Agents Active: 4
          </div>
          <div style={{
            fontSize: 10,
            color: "#6B7186",
          }}>
            Tasks: 6
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeView === "live-demo" && <LiveDemo />}
        {activeView === "ceo-dashboard" && <CEODashboard />}
        {activeView === "revenue-engine" && <RevenueEngine />}
        {activeView === "ai-workforce" && <AIWorkforce />}
        {activeView === "profit-pipeline" && <ProfitPipeline />}
        {activeView === "media-hub" && <MediaHub />}
        {activeView === "projects" && <Projects />}
        {activeView === "financials" && <Financials />}
        {activeView === "business-setup" && <BusinessSetup />}
      </div>
    </div>
  );
}
