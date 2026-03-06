"use client";

import { useState, useEffect } from "react";

// Static mock data - already populated
const mockAgents = [
  { id: "prospector", name: "Prospect Hunter", avatar: "🎯", role: "Finding ideal prospects", status: "complete", currentTask: "Found 112 prospects", progress: 100, tasksCompleted: 3 },
  { id: "researcher", name: "Deep Researcher", avatar: "🔍", role: "Researching prospects", status: "working", currentTask: "Analyzing prospect #47...", progress: 65, tasksCompleted: 2 },
  { id: "writer", name: "Message Writer", avatar: "✍️", role: "Crafting personalized DMs", status: "working", currentTask: "Writing message for John S.", progress: 40, tasksCompleted: 1 },
  { id: "sender", name: "Outreach Agent", avatar: "📧", role: "Sending messages", status: "active", currentTask: "30 DMs sent today", progress: 30, tasksCompleted: 1 },
];

const mockTasks = [
  { id: "1", title: "Scrape LinkedIn for SaaS founders", status: "complete", priority: "high" },
  { id: "2", title: "Research company backgrounds", status: "in-progress", priority: "high" },
  { id: "3", title: "Generate personalized openers", status: "in-progress", priority: "medium" },
  { id: "4", title: "Send batch 1 (50 DMs)", status: "in-progress", priority: "high" },
  { id: "5", title: "Follow up on replies", status: "todo", priority: "medium" },
  { id: "6", title: "Book discovery calls", status: "todo", priority: "high" },
];

const mockActivity = [
  { id: "1", message: "📞 Call booked with Sarah M. - Tomorrow 2pm", timestamp: new Date(Date.now() - 60000).toISOString(), type: "success" },
  { id: "2", message: "💬 New reply from Mike T.: 'Interested, let's chat'", timestamp: new Date(Date.now() - 180000).toISOString(), type: "success" },
  { id: "3", message: "📧 30 DMs sent - waiting for responses", timestamp: new Date(Date.now() - 300000).toISOString(), type: "info" },
  { id: "4", message: "✍️ Message Writer crafting personalized openers", timestamp: new Date(Date.now() - 420000).toISOString(), type: "agent" },
  { id: "5", message: "💬 Reply from Jennifer K.: 'Tell me more'", timestamp: new Date(Date.now() - 600000).toISOString(), type: "success" },
  { id: "6", message: "🔍 Deep Researcher analyzing 112 prospect profiles", timestamp: new Date(Date.now() - 900000).toISOString(), type: "agent" },
  { id: "7", message: "✅ Prospecting complete: 112 ideal prospects found", timestamp: new Date(Date.now() - 1200000).toISOString(), type: "success" },
  { id: "8", message: "🎯 Prospect Hunter scanning LinkedIn...", timestamp: new Date(Date.now() - 1500000).toISOString(), type: "agent" },
];

const mockMetrics = {
  prospects: 112,
  dmsSent: 30,
  replies: 3,
  calls: 1,
};

const statusColors: Record<string, { bg: string; text: string }> = {
  idle: { bg: "rgba(100,116,139,0.2)", text: "#94A3B8" },
  active: { bg: "rgba(16,185,129,0.2)", text: "#10B981" },
  working: { bg: "rgba(124,58,237,0.2)", text: "#A78BFA" },
  complete: { bg: "rgba(16,185,129,0.2)", text: "#10B981" },
  blocked: { bg: "rgba(239,68,68,0.2)", text: "#EF4444" },
};

const activityColors: Record<string, string> = {
  info: "#2F80FF",
  success: "#10B981",
  warning: "#F59E0B",
  agent: "#7B61FF",
  metric: "#FF4EDB",
};

export default function LiveDemo() {
  const [agents, setAgents] = useState(mockAgents);
  const [activity, setActivity] = useState(mockActivity);
  const [metrics, setMetrics] = useState(mockMetrics);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update agent progress
      setAgents(prev => prev.map(agent => {
        if (agent.status === "working") {
          const newProgress = Math.min(100, agent.progress + Math.random() * 5);
          return { ...agent, progress: newProgress };
        }
        return agent;
      }));

      // Occasionally add new activity
      if (Math.random() > 0.7) {
        const messages = [
          "🔍 Analyzing prospect profile...",
          "✍️ Generating personalized message...",
          "📧 Message queued for sending...",
          "🎯 New prospect identified...",
        ];
        const newActivity = {
          id: `activity-${Date.now()}`,
          message: messages[Math.floor(Math.random() * messages.length)],
          timestamp: new Date().toISOString(),
          type: "info",
        };
        setActivity(prev => [newActivity, ...prev.slice(0, 19)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0B0F19",
      padding: 24,
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        padding: "20px 24px",
        background: "linear-gradient(135deg, #111624, #0D1117)",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div>
          <div style={{
            fontSize: 10,
            letterSpacing: 2,
            color: "#FF4EDB",
            fontFamily: "'Orbitron', monospace",
            marginBottom: 4,
          }}>
            🔴 LIVE DEMO
          </div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#F5F7FA",
            margin: 0,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            Viral Growth Agency
          </h1>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <span style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#10B981",
            animation: "pulse 2s infinite",
          }} />
          <span style={{ fontSize: 12, color: "#10B981" }}>Live</span>
        </div>
      </div>

      {/* Metrics Bar */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 24,
      }}>
        <MetricCard label="Prospects Found" value={metrics.prospects} icon="🎯" color="#2F80FF" />
        <MetricCard label="DMs Sent" value={metrics.dmsSent} icon="📧" color="#7B61FF" />
        <MetricCard label="Replies" value={metrics.replies} icon="💬" color="#10B981" />
        <MetricCard label="Calls Booked" value={metrics.calls} icon="📞" color="#FF4EDB" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        {/* Left Column - Activity Feed */}
        <div style={{
          background: "linear-gradient(180deg, #111624 0%, #0D1117 100%)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: 20,
          maxHeight: "calc(100vh - 280px)",
          overflow: "auto",
        }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#F5F7FA",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span>📡</span> Live Activity
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activity.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: 12,
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 8,
                  borderLeft: `3px solid ${activityColors[item.type] || "#6B7186"}`,
                }}
              >
                <p style={{
                  color: "#F5F7FA",
                  fontSize: 13,
                  margin: 0,
                  lineHeight: 1.4,
                }}>
                  {item.message}
                </p>
                <p style={{
                  color: "#6B7186",
                  fontSize: 10,
                  margin: "4px 0 0",
                }}>
                  {new Date(item.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Column - AI Agents */}
        <div style={{
          background: "linear-gradient(180deg, #111624 0%, #0D1117 100%)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: 20,
        }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#F5F7FA",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span>🤖</span> AI Workforce ({agents.length})
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {agents.map((agent) => {
              const statusStyle = statusColors[agent.status] || statusColors.idle;
              return (
                <div
                  key={agent.id}
                  style={{
                    padding: 14,
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 8,
                    border: `1px solid ${statusStyle.text}30`,
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}>
                    <span style={{ fontSize: 24 }}>{agent.avatar}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#F5F7FA",
                      }}>
                        {agent.name}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: "#8A8F98",
                      }}>
                        {agent.role}
                      </div>
                    </div>
                    <div style={{
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      fontSize: 9,
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}>
                      {agent.status}
                    </div>
                  </div>
                  
                  {agent.currentTask && (
                    <div style={{
                      fontSize: 12,
                      color: "#8A8F98",
                      marginBottom: 8,
                    }}>
                      {agent.currentTask}
                    </div>
                  )}
                  
                  {(agent.status === "working" || agent.status === "active") && (
                    <div style={{
                      height: 4,
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${agent.progress}%`,
                        height: "100%",
                        background: statusStyle.text,
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Tasks */}
        <div style={{
          background: "linear-gradient(180deg, #111624 0%, #0D1117 100%)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: 20,
        }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#F5F7FA",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span>📋</span> Tasks ({mockTasks.length})
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mockTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: 10,
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 6,
                  borderLeft: `3px solid ${
                    task.status === "complete" ? "#10B981" :
                    task.status === "in-progress" ? "#2F80FF" : "#6B7186"
                  }`,
                }}
              >
                <div style={{
                  fontSize: 12,
                  color: "#F5F7FA",
                  marginBottom: 4,
                }}>
                  {task.title}
                </div>
                <div style={{
                  fontSize: 10,
                  color: "#6B7186",
                  textTransform: "uppercase",
                }}>
                  {task.status}
                </div>
              </div>
            ))}
          </div>
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

function MetricCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div style={{
      padding: 20,
      background: "linear-gradient(180deg, #111624 0%, #0D1117 100%)",
      borderRadius: 12,
      border: `1px solid ${color}30`,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#6B7186", textTransform: "uppercase", letterSpacing: 1 }}>
            {label}
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            color: color,
            fontFamily: "'Orbitron', monospace",
            marginTop: 4,
          }}>
            {value}
          </div>
        </div>
        <span style={{ fontSize: 32 }}>{icon}</span>
      </div>
    </div>
  );
}
