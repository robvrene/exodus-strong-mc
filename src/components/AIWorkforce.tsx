"use client";

import { useState, useEffect } from "react";
import { TWELVE_TRIBES, ACTIVITY_FEED } from "@/config/exodus-data";

// ── Exodus Strong: The Twelve Tribes replaces demo agents ──
const agents = TWELVE_TRIBES.map(t => ({
  ...t,
  avgResponseTime: t.avgResponseTime,
  lastActionTime: t.lastActionTime,
}));

const generateActivityFeed = () => ACTIVITY_FEED;

export default function AIWorkforce() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activityFeed] = useState(generateActivityFeed);
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAgents = agents.filter(a => a.status === "active").length;
  const workingAgents = agents.filter(a => a.status === "working").length;
  const totalTasksToday = agents.reduce((sum, a) => sum + a.tasksToday, 0);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      second: "2-digit",
      hour12: true 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#10B981";
      case "working": return "#F59E0B";
      case "idle": return "#6B7186";
      default: return "#6B7186";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Active";
      case "working": return "Working";
      case "idle": return "Idle";
      default: return "Unknown";
    }
  };

  return (
    <div style={{ padding: 32, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 10,
          letterSpacing: 3,
          fontFamily: "'Orbitron', monospace",
          background: "linear-gradient(90deg, #C9A84C, #E6C46A, #C9A84C)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 8,
        }}>
          THE TWELVE TRIBES
        </div>
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "'Space Grotesk', sans-serif",
          color: "#F5F7FA",
          marginBottom: 4,
        }}>
          Your 24/7 Agent Army
        </div>
        <div style={{
          fontSize: 14,
          color: "#6B7186",
          fontFamily: "'Inter', sans-serif",
        }}>
          The Nehemiah Protocol — 16 Tribes deploying over 12 weeks
        </div>
      </div>

      {/* Live Status Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        background: "linear-gradient(135deg, rgba(47,128,255,0.1), rgba(123,97,255,0.05))",
        borderRadius: 12,
        border: "1px solid rgba(47,128,255,0.2)",
        marginBottom: 32,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {/* Active Agents */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 12px rgba(16,185,129,0.6)",
              animation: "pulse 2s ease-in-out infinite",
            }} />
            <span style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#F5F7FA",
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              {activeAgents + workingAgents} Agents Active
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />

          {/* Current Time */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#6B7186" }}>System Time:</span>
            <span style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#2F80FF",
              fontFamily: "'Orbitron', monospace",
            }}>
              {formatTime(currentTime)}
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />

          {/* Tasks Today */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#6B7186" }}>Tasks Completed Today:</span>
            <span style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#10B981",
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              {totalTasksToday.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status Pills */}
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: "rgba(16,185,129,0.15)",
            borderRadius: 20,
            border: "1px solid rgba(16,185,129,0.3)",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: 12, color: "#10B981", fontWeight: 500 }}>{activeAgents} Active</span>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: "rgba(245,158,11,0.15)",
            borderRadius: 20,
            border: "1px solid rgba(245,158,11,0.3)",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
            <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 500 }}>{workingAgents} Working</span>
          </div>
        </div>
      </div>

      {/* Main Content: Agent Grid + Activity Feed */}
      <div style={{ display: "flex", gap: 24 }}>
        {/* Agent Cards Grid */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}>
            {agents.map((agent) => (
              <div
                key={agent.id}
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: 20,
                  transition: "all 0.2s ease",
                }}
              >
                {/* Agent Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${agent.departmentColor}30, ${agent.departmentColor}10)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      border: `1px solid ${agent.departmentColor}40`,
                    }}>
                      {agent.avatar}
                    </div>
                    
                    {/* Name and Role */}
                    <div>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#F5F7FA",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}>
                        {agent.name}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: agent.departmentColor,
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        {agent.role}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 12,
                    background: `${getStatusColor(agent.status)}20`,
                    border: `1px solid ${getStatusColor(agent.status)}40`,
                  }}>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: getStatusColor(agent.status),
                      animation: agent.status === "active" ? "pulse 2s ease-in-out infinite" : "none",
                    }} />
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: getStatusColor(agent.status),
                      textTransform: "uppercase",
                      fontFamily: "'Orbitron', monospace",
                      letterSpacing: 0.5,
                    }}>
                      {getStatusLabel(agent.status)}
                    </span>
                  </div>
                </div>

                {/* Department Tag */}
                <div style={{
                  display: "inline-block",
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: `${agent.departmentColor}15`,
                  border: `1px solid ${agent.departmentColor}30`,
                  fontSize: 10,
                  fontWeight: 500,
                  color: agent.departmentColor,
                  fontFamily: "'Orbitron', monospace",
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}>
                  {agent.department.toUpperCase()}
                </div>

                {/* Current Task */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 11,
                    color: "#6B7186",
                    marginBottom: 6,
                    fontFamily: "'Orbitron', monospace",
                    letterSpacing: 0.5,
                  }}>
                    CURRENT TASK
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: "#B4B9C4",
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: 1.4,
                  }}>
                    {agent.currentTask}
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: "#6B7186", fontFamily: "'Orbitron', monospace" }}>PROGRESS</span>
                    <span style={{ fontSize: 11, color: agent.departmentColor, fontWeight: 600 }}>{agent.progress}%</span>
                  </div>
                  <div style={{
                    height: 6,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${agent.progress}%`,
                      borderRadius: 3,
                      background: `linear-gradient(90deg, ${agent.departmentColor}, ${agent.departmentColor}CC)`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>

                {/* Stats Grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                  padding: "12px 0",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  marginBottom: 12,
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#F5F7FA",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      {agent.tasksToday}
                    </div>
                    <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", letterSpacing: 0.5 }}>
                      TASKS
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#10B981",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      {agent.successRate}%
                    </div>
                    <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", letterSpacing: 0.5 }}>
                      SUCCESS
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#2F80FF",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      {agent.avgResponseTime}
                    </div>
                    <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", letterSpacing: 0.5 }}>
                      AVG TIME
                    </div>
                  </div>
                </div>

                {/* Last Action */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{
                    fontSize: 11,
                    color: "#8A8F98",
                    fontFamily: "'Inter', sans-serif",
                    maxWidth: "70%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {agent.lastAction}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: "#6B7186",
                    fontFamily: "'Orbitron', monospace",
                  }}>
                    {agent.lastActionTime}m ago
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed Sidebar */}
        <div style={{
          width: 340,
          minWidth: 340,
          background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: 20,
          height: "fit-content",
          maxHeight: "calc(100vh - 200px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Feed Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div>
              <div style={{
                fontSize: 10,
                letterSpacing: 2,
                fontFamily: "'Orbitron', monospace",
                color: "#7B61FF",
                marginBottom: 4,
              }}>
                LIVE FEED
              </div>
              <div style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#F5F7FA",
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                Activity Stream
              </div>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 12,
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10B981",
                animation: "pulse 2s ease-in-out infinite",
              }} />
              <span style={{ fontSize: 10, color: "#10B981", fontWeight: 500 }}>LIVE</span>
            </div>
          </div>

          {/* Feed Items */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}>
            {activityFeed.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 8px",
                  borderRadius: 8,
                  background: index === 0 ? "rgba(47,128,255,0.08)" : "transparent",
                  transition: "background 0.2s ease",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    color: "#F5F7FA",
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: 4,
                    lineHeight: 1.4,
                  }}>
                    <span style={{ fontWeight: 600, color: "#2F80FF" }}>{item.agent}</span>
                    {" "}{item.action}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: "#6B7186",
                    fontFamily: "'Orbitron', monospace",
                  }}>
                    {item.time} min ago
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Feed Footer */}
          <div style={{
            paddingTop: 12,
            marginTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 10,
              color: "#6B7186",
              fontFamily: "'Orbitron', monospace",
              letterSpacing: 0.5,
            }}>
              Showing last hour of activity
            </div>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
