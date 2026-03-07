"use client";

import { useState, useEffect, useCallback } from "react";
import { useSSE } from "@/lib/useSSE";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TaskStatus = "todo" | "in_progress" | "in_review" | "complete" | "blocked" | "skipped";
type OutputType = "funnel" | "content" | "media" | "strategy" | "ghl-workflow";
type Destination = "project-manager" | "media-hub";

interface LiveTask {
  id: string;
  demo_id: string;
  task_name: string;
  wave: number | null;
  status: TaskStatus;
  output_type: OutputType | null;
  destination: Destination | null;
  output_path: string | null;
  output_url: string | null;
  duration_seconds: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface Demo {
  id: string;
  business_name: string;
  volunteer_name: string | null;
  status: string;
  phase: string;
  revenue_goal: number | null;
  created_at: string;
  elapsed_seconds: number | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "todo", title: "Todo", color: "#94A3B8" },
  { id: "in_progress", title: "In Progress", color: "#E91E8C" },
  { id: "in_review", title: "In Review", color: "#A855F7" },
  { id: "complete", title: "Complete", color: "#34D399" },
  { id: "blocked", title: "Blocked", color: "#EF4444" },
];

const OUTPUT_TYPE_ICONS: Record<string, { icon: string; label: string }> = {
  funnel: { icon: "🔗", label: "Funnel" },
  content: { icon: "📝", label: "Content" },
  media: { icon: "🎬", label: "Media" },
  strategy: { icon: "🧠", label: "Strategy" },
  "ghl-workflow": { icon: "⚙️", label: "GHL Workflow" },
};

const WAVE_COLORS: Record<number, string> = {
  1: "#2F80FF",
  2: "#7B61FF",
  3: "#FF4EDB",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LiveKanban() {
  const [demo, setDemo] = useState<Demo | null>(null);
  const [tasks, setTasks] = useState<LiveTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  // Fetch initial data
  useEffect(() => {
    fetch("/api/demo")
      .then((r) => r.json())
      .then((data) => {
        if (data.demo) setDemo(data.demo);
        if (data.tasks) setTasks(data.tasks);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // SSE handler
  const handleSSE = useCallback((eventType: string, data: unknown) => {
    const d = data as Record<string, unknown>;

    if (eventType === "phase_update") {
      setDemo((prev) =>
        prev ? { ...prev, phase: (d.phase as string) ?? prev.phase } : prev
      );
    }

    if (eventType === "task_update") {
      const taskName = d.taskName as string;
      const taskId = d.taskId as string | undefined;
      setTasks((prev) => {
        const existing = prev.find(
          (t) => (taskId && t.id === taskId) || t.task_name === taskName
        );
        if (existing) {
          // Trigger animation
          setAnimatingIds((ids) => new Set(ids).add(existing.id));
          setTimeout(() => {
            setAnimatingIds((ids) => {
              const next = new Set(ids);
              next.delete(existing.id);
              return next;
            });
          }, 1500);

          return prev.map((t) =>
            t.id === existing.id
              ? {
                  ...t,
                  status: (d.status as TaskStatus) ?? t.status,
                  wave: (d.wave as number) ?? t.wave,
                  output_type: (d.outputType as OutputType) ?? t.output_type,
                  destination: (d.destination as Destination) ?? t.destination,
                  output_path: (d.outputPath as string) ?? t.output_path,
                  output_url: (d.outputUrl as string) ?? t.output_url,
                  duration_seconds: (d.duration as number) ?? t.duration_seconds,
                  error_message: (d.error as string) ?? t.error_message,
                  updated_at: new Date().toISOString(),
                }
              : t
          );
        } else {
          // New task
          const newTask: LiveTask = {
            id: taskId || crypto.randomUUID().slice(0, 8),
            demo_id: (d.demoId as string) ?? "",
            task_name: taskName,
            wave: (d.wave as number) ?? null,
            status: (d.status as TaskStatus) ?? "todo",
            output_type: (d.outputType as OutputType) ?? null,
            destination: (d.destination as Destination) ?? "project-manager",
            output_path: (d.outputPath as string) ?? null,
            output_url: (d.outputUrl as string) ?? null,
            duration_seconds: (d.duration as number) ?? null,
            error_message: (d.error as string) ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setAnimatingIds((ids) => new Set(ids).add(newTask.id));
          setTimeout(() => {
            setAnimatingIds((ids) => {
              const next = new Set(ids);
              next.delete(newTask.id);
              return next;
            });
          }, 1500);
          return [...prev, newTask];
        }
      });
    }

    if (eventType === "demo_complete") {
      setDemo((prev) =>
        prev ? { ...prev, phase: "complete", status: "complete" } : prev
      );
    }
  }, []);

  useSSE({ onEvent: handleSSE });

  // Filter tasks for Kanban (project-manager destination only)
  const kanbanTasks = tasks.filter(
    (t) => t.destination !== "media-hub"
  );

  // Wave stats
  const waveStats = [1, 2, 3].map((w) => {
    const waveTasks = kanbanTasks.filter((t) => t.wave === w);
    const complete = waveTasks.filter((t) => t.status === "complete").length;
    return { wave: w, total: waveTasks.length, complete };
  }).filter((w) => w.total > 0);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "pulse 2s ease-in-out infinite" }}>
            🛰️
          </div>
          <div style={{ fontSize: 14, color: "#8A8F98", fontFamily: "'Space Grotesk', sans-serif" }}>
            Connecting to Mission Control...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, fontFamily: "'Orbitron', monospace", color: "#7B61FF", marginBottom: 4 }}>
              MISSION CONTROL
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "#F5F7FA" }}>
              {demo?.business_name || "Awaiting Demo..."}
              {demo?.volunteer_name && (
                <span style={{ fontSize: 14, color: "#8A8F98", fontWeight: 400, marginLeft: 12 }}>
                  with {demo.volunteer_name}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {waveStats.map((w) => (
              <div
                key={w.wave}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  background: `${WAVE_COLORS[w.wave]}15`,
                  border: `1px solid ${WAVE_COLORS[w.wave]}33`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 9, color: WAVE_COLORS[w.wave], fontFamily: "'Orbitron', monospace", letterSpacing: 1 }}>
                  WAVE {w.wave}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: WAVE_COLORS[w.wave], fontFamily: "'Space Grotesk', sans-serif" }}>
                  {w.complete}/{w.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16, minHeight: "calc(100vh - 160px)" }}>
        {COLUMNS.map((column) => {
          const columnTasks = kanbanTasks.filter((t) => t.status === column.id);
          return (
            <div key={column.id} style={{ flex: 1, minWidth: 260, maxWidth: 340 }}>
              {/* Column Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 4px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: column.color }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>
                  {column.title}
                </span>
                <span style={{
                  fontSize: 11, color: "#8A8F98", background: "rgba(255,255,255,0.06)",
                  padding: "2px 8px", borderRadius: 10,
                }}>
                  {columnTasks.length}
                </span>
              </div>

              {/* Column Body */}
              <div style={{
                background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: 8,
                minHeight: 200, border: "1px solid rgba(255,255,255,0.04)",
              }}>
                {columnTasks.map((task) => {
                  const isAnimating = animatingIds.has(task.id);
                  const outputInfo = task.output_type ? OUTPUT_TYPE_ICONS[task.output_type] : null;
                  const isGHL = task.output_type === "ghl-workflow";

                  return (
                    <div
                      key={task.id}
                      style={{
                        background: isGHL
                          ? "linear-gradient(135deg, rgba(255,78,219,0.06), rgba(123,97,255,0.06))"
                          : "rgba(255,255,255,0.03)",
                        border: `1px solid ${isAnimating
                          ? task.status === "complete" ? "#34D399" : task.status === "blocked" ? "#EF4444" : "#2F80FF"
                          : "rgba(255,255,255,0.06)"
                        }`,
                        borderLeft: `4px solid ${column.color}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        marginBottom: 8,
                        transition: "all 0.4s ease",
                        transform: isAnimating ? "scale(1.02)" : "scale(1)",
                        boxShadow: isAnimating
                          ? `0 0 20px ${task.status === "complete" ? "#34D39940" : task.status === "blocked" ? "#EF444440" : "#2F80FF40"}`
                          : "none",
                      }}
                    >
                      {/* Task Name */}
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F7FA", marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
                        {task.task_name}
                      </div>

                      {/* Badges row */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        {/* Wave badge */}
                        {task.wave && (
                          <span style={{
                            fontSize: 9, padding: "2px 8px", borderRadius: 4,
                            background: `${WAVE_COLORS[task.wave] || "#666"}15`,
                            border: `1px solid ${WAVE_COLORS[task.wave] || "#666"}33`,
                            color: WAVE_COLORS[task.wave] || "#666",
                            fontFamily: "'Orbitron', monospace", letterSpacing: 1,
                          }}>
                            WAVE {task.wave}
                          </span>
                        )}
                        {/* Output type */}
                        {outputInfo && (
                          <span style={{
                            fontSize: 9, padding: "2px 8px", borderRadius: 4,
                            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                            color: "#8A8F98",
                          }}>
                            {outputInfo.icon} {outputInfo.label}
                          </span>
                        )}
                        {/* Destination badge */}
                        {task.destination === "media-hub" && (
                          <span style={{
                            fontSize: 9, padding: "2px 8px", borderRadius: 4,
                            background: "rgba(255,78,219,0.1)", border: "1px solid rgba(255,78,219,0.25)",
                            color: "#FF4EDB",
                          }}>
                            Media Hub
                          </span>
                        )}
                      </div>

                      {/* GHL special card */}
                      {isGHL && (
                        <div style={{
                          fontSize: 11, color: "#FF4EDB", background: "rgba(255,78,219,0.06)",
                          border: "1px solid rgba(255,78,219,0.15)", borderRadius: 6,
                          padding: "8px 10px", marginBottom: 8, lineHeight: 1.5,
                        }}>
                          Open in Claude Cowork to build this in GHL
                        </div>
                      )}

                      {/* Duration */}
                      {task.status === "complete" && task.duration_seconds != null && (
                        <div style={{ fontSize: 11, color: "#34D399", marginBottom: 4 }}>
                          Built in {task.duration_seconds}s
                        </div>
                      )}

                      {/* Error (expandable) */}
                      {task.status === "blocked" && task.error_message && (
                        <div>
                          <button
                            onClick={() => setExpandedError(expandedError === task.id ? null : task.id)}
                            style={{
                              fontSize: 11, color: "#EF4444", background: "rgba(239,68,68,0.08)",
                              border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4,
                              padding: "4px 8px", cursor: "pointer", width: "100%", textAlign: "left",
                            }}
                          >
                            {expandedError === task.id ? "▼" : "▶"} Error details
                          </button>
                          {expandedError === task.id && (
                            <div style={{
                              fontSize: 11, color: "#EF4444", background: "rgba(239,68,68,0.04)",
                              borderRadius: 4, padding: 8, marginTop: 4, whiteSpace: "pre-wrap",
                              fontFamily: "monospace",
                            }}>
                              {task.error_message}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Output link */}
                      {task.output_url && (
                        <a
                          href={task.output_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 11, color: "#2F80FF", textDecoration: "none",
                            display: "block", marginTop: 4,
                          }}
                        >
                          View output →
                        </a>
                      )}
                    </div>
                  );
                })}

                {/* Empty state */}
                {columnTasks.length === 0 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 100, fontSize: 12, color: "#555" }}>
                    {column.id === "todo" ? "Awaiting deliverables..." : "No tasks"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
