"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Startup Check Panel — Pre-flight system check
// ---------------------------------------------------------------------------

interface HealthCheck {
  service: string;
  status: "green" | "yellow" | "red";
  latency: number;
  message: string;
}

interface HealthResult {
  overall: "green" | "yellow" | "red";
  checks: HealthCheck[];
  timestamp: string;
}

const STATUS_STYLES: Record<string, { bg: string; border: string; color: string; label: string }> = {
  green: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", color: "#10B981", label: "OPERATIONAL" },
  yellow: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", color: "#F59E0B", label: "DEGRADED" },
  red: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", color: "#EF4444", label: "DOWN" },
};

export default function StartupCheck() {
  const [result, setResult] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runChecks = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/health");
      const data: HealthResult = await resp.json();
      setResult(data);
    } catch {
      setResult({
        overall: "red",
        checks: [{ service: "Mission Control", status: "red", latency: 0, message: "Health endpoint unreachable" }],
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-run on mount
  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const anyRed = result?.checks.some((c) => c.status === "red");

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", padding: 24 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, fontFamily: "'Orbitron', monospace", color: "#2F80FF", marginBottom: 4 }}>
            PRE-FLIGHT CHECK
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "#F5F7FA", margin: 0 }}>
              System Status
            </h1>
            <button
              onClick={runChecks}
              disabled={loading}
              style={{
                padding: "8px 20px",
                borderRadius: 6,
                border: "1px solid rgba(47,128,255,0.3)",
                background: loading ? "rgba(255,255,255,0.04)" : "rgba(47,128,255,0.1)",
                color: "#2F80FF",
                fontSize: 12,
                fontFamily: "'Orbitron', monospace",
                letterSpacing: 1,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "CHECKING..." : "RUN CHECKS"}
            </button>
          </div>
        </div>

        {/* Alert banner */}
        {anyRed && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "2px solid rgba(239,68,68,0.4)",
              borderRadius: 10,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 12,
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#EF4444", fontFamily: "'Space Grotesk', sans-serif" }}>
                ALERT JOSEPH — System Not Ready
              </div>
              <div style={{ fontSize: 12, color: "#EF4444", opacity: 0.8, marginTop: 2 }}>
                {result?.checks
                  .filter((c) => c.status === "red")
                  .map((c) => c.service)
                  .join(", ")}{" "}
                {result?.checks.filter((c) => c.status === "red").length === 1 ? "is" : "are"} DOWN
              </div>
            </div>
          </div>
        )}

        {/* Overall status */}
        {result && (
          <div
            style={{
              background: STATUS_STYLES[result.overall].bg,
              border: `2px solid ${STATUS_STYLES[result.overall].border}`,
              borderRadius: 10,
              padding: "20px 24px",
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            <div style={{
              fontSize: 9, letterSpacing: 3, fontFamily: "'Orbitron', monospace",
              color: STATUS_STYLES[result.overall].color, marginBottom: 8,
            }}>
              SYSTEM STATUS
            </div>
            <div style={{
              fontSize: 28, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
              color: STATUS_STYLES[result.overall].color,
            }}>
              {result.overall === "green" ? "ALL SYSTEMS GO" : result.overall === "yellow" ? "PARTIAL READINESS" : "SYSTEMS DOWN"}
            </div>
          </div>
        )}

        {/* Individual checks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {result?.checks.map((check) => {
            const st = STATUS_STYLES[check.status];
            return (
              <div
                key={check.service}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${st.border}`,
                  borderRadius: 8,
                  padding: "14px 18px",
                  borderLeft: `4px solid ${st.color}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 10, height: 10, borderRadius: "50%", background: st.color,
                      boxShadow: `0 0 8px ${st.color}60`,
                      animation: check.status === "red" ? "pulse 1s ease-in-out infinite" : "none",
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {check.service}
                    </div>
                    <div style={{ fontSize: 11, color: "#8A8F98", marginTop: 2 }}>
                      {check.message}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {check.latency > 0 && (
                    <span style={{ fontSize: 11, color: "#6B7186", fontFamily: "'Orbitron', monospace" }}>
                      {check.latency}ms
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 9, padding: "3px 10px", borderRadius: 4,
                      background: st.bg, border: `1px solid ${st.border}`,
                      color: st.color, fontFamily: "'Orbitron', monospace", letterSpacing: 1,
                    }}
                  >
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timestamp */}
        {result && (
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#555" }}>
            Last checked: {new Date(result.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
