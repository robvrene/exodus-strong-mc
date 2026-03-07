"use client";

import { useState, useEffect, useCallback } from "react";
import { useSSE } from "@/lib/useSSE";

// ---------------------------------------------------------------------------
// Live Media Hub — Content outputs arriving via webhook
// ---------------------------------------------------------------------------

type MediaStatus = "in_review" | "approved" | "live";
type OutputType = "funnel" | "content" | "media" | "strategy" | "ghl-workflow";

interface MediaItem {
  id: string;
  task_name: string;
  output_type: OutputType | null;
  status: string;
  output_path: string | null;
  output_url: string | null;
  wave: number | null;
  duration_seconds: number | null;
  created_at: string;
}

const TABS = [
  { id: "all", label: "All" },
  { id: "funnel", label: "Funnels" },
  { id: "content", label: "Content" },
  { id: "media", label: "Ads" },
  { id: "strategy", label: "Brand Assets" },
  { id: "ghl-workflow", label: "GHL Prompts" },
];

const OUTPUT_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  funnel: { bg: "rgba(47,128,255,0.1)", color: "#2F80FF", label: "Funnel" },
  content: { bg: "rgba(16,185,129,0.1)", color: "#10B981", label: "Content" },
  media: { bg: "rgba(255,78,219,0.1)", color: "#FF4EDB", label: "Media" },
  strategy: { bg: "rgba(123,97,255,0.1)", color: "#7B61FF", label: "Strategy" },
  "ghl-workflow": { bg: "rgba(245,158,11,0.1)", color: "#F59E0B", label: "GHL" },
};

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  in_review: { bg: "rgba(168,85,247,0.1)", color: "#A855F7" },
  complete: { bg: "rgba(16,185,129,0.1)", color: "#10B981" },
  approved: { bg: "rgba(16,185,129,0.1)", color: "#10B981" },
  live: { bg: "rgba(47,128,255,0.1)", color: "#2F80FF" },
};

export default function LiveMediaHub() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetch("/api/demo")
      .then((r) => r.json())
      .then((data) => {
        if (data.tasks) {
          const mediaItems = (data.tasks as MediaItem[]).filter(
            (t) => t.status !== "todo" // Show items that have started
          );
          setItems(mediaItems);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // SSE updates
  const handleSSE = useCallback((eventType: string, data: unknown) => {
    if (eventType !== "task_update") return;
    const d = data as Record<string, unknown>;
    const dest = d.destination as string;
    if (dest !== "media-hub") return;

    setItems((prev) => {
      const existing = prev.find((t) => t.task_name === d.taskName);
      if (existing) {
        return prev.map((t) =>
          t.id === existing.id
            ? { ...t, status: (d.status as string) ?? t.status, output_url: (d.outputUrl as string) ?? t.output_url }
            : t
        );
      }
      return [
        ...prev,
        {
          id: (d.taskId as string) || crypto.randomUUID().slice(0, 8),
          task_name: d.taskName as string,
          output_type: (d.outputType as OutputType) ?? null,
          status: (d.status as string) ?? "in_review",
          output_path: (d.outputPath as string) ?? null,
          output_url: (d.outputUrl as string) ?? null,
          wave: (d.wave as number) ?? null,
          duration_seconds: (d.duration as number) ?? null,
          created_at: new Date().toISOString(),
        },
      ];
    });
  }, []);

  useSSE({ onEvent: handleSSE });

  const filtered = activeTab === "all"
    ? items
    : items.filter((i) => i.output_type === activeTab);

  const handleApprove = async (item: MediaItem) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, status: "approved" } : t))
    );
    // Fire webhook to update DB
    await fetch("/api/demo-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: "current",
        event: "task_update",
        data: { taskName: item.task_name, status: "complete", destination: "media-hub" },
      }),
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ fontSize: 14, color: "#8A8F98" }}>Loading Media Hub...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, fontFamily: "'Orbitron', monospace", color: "#FF4EDB", marginBottom: 4 }}>
            MEDIA HUB
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "#F5F7FA", margin: 0 }}>
            Content & Assets
          </h1>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "6px 14px", borderRadius: 5, cursor: "pointer", fontSize: 11,
                fontFamily: "'Orbitron', monospace", letterSpacing: 1, whiteSpace: "nowrap",
                background: activeTab === tab.id ? "linear-gradient(135deg, rgba(255,78,219,0.15), rgba(123,97,255,0.15))" : "transparent",
                border: `1px solid ${activeTab === tab.id ? "rgba(255,78,219,0.3)" : "transparent"}`,
                color: activeTab === tab.id ? "#FF4EDB" : "#6B7186",
              }}
            >
              {tab.label}
              {activeTab !== tab.id && (
                <span style={{ marginLeft: 6, fontSize: 10, color: "#555" }}>
                  {tab.id === "all" ? items.length : items.filter((i) => i.output_type === tab.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)",
            borderRadius: 10, padding: 40, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 14, color: "#6B7186" }}>
              No assets yet — they&apos;ll appear here as bots complete deliverables
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {filtered.map((item) => {
              const typeBadge = item.output_type ? OUTPUT_BADGE[item.output_type] : null;
              const statusStyle = STATUS_BADGE[item.status] || STATUS_BADGE.in_review;

              return (
                <div
                  key={item.id}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    padding: "16px 18px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif", flex: 1 }}>
                      {item.task_name}
                    </div>
                    <span style={{
                      fontSize: 9, padding: "2px 8px", borderRadius: 4,
                      background: statusStyle.bg, color: statusStyle.color,
                      fontFamily: "'Orbitron', monospace", letterSpacing: 1, whiteSpace: "nowrap", marginLeft: 8,
                    }}>
                      {item.status === "complete" ? "APPROVED" : item.status.toUpperCase().replace("_", " ")}
                    </span>
                  </div>

                  {/* Badges */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {typeBadge && (
                      <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: typeBadge.bg, color: typeBadge.color }}>
                        {typeBadge.label}
                      </span>
                    )}
                    {item.wave && (
                      <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: "#8A8F98" }}>
                        Wave {item.wave}
                      </span>
                    )}
                  </div>

                  {/* Path preview */}
                  {item.output_path && (
                    <div style={{ fontSize: 11, color: "#6B7186", marginBottom: 8, fontFamily: "monospace" }}>
                      {item.output_path}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {item.status === "in_review" && (
                      <button
                        onClick={() => handleApprove(item)}
                        style={{
                          padding: "6px 14px", borderRadius: 5, cursor: "pointer", fontSize: 11,
                          background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                          color: "#10B981", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                        }}
                      >
                        Approve
                      </button>
                    )}
                    {item.output_url && (
                      <a
                        href={item.output_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "6px 14px", borderRadius: 5, fontSize: 11, textDecoration: "none",
                          background: "rgba(47,128,255,0.1)", border: "1px solid rgba(47,128,255,0.3)",
                          color: "#2F80FF", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                        }}
                      >
                        View →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
