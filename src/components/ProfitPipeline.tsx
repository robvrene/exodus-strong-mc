"use client";

import { useState, useEffect } from "react";
import { PIPELINE_LEADS } from "@/config/exodus-data";

// Pipeline types
type PipelineType = "book-a-call" | "webinar" | "challenge";

// Pipeline type definitions with stages
const pipelineTypes: Record<PipelineType, { name: string; stages: { id: string; name: string; description: string; color: string }[] }> = {
  "book-a-call": {
    name: "Book a Call",
    stages: [
      { id: "new-lead", name: "New Lead", description: "Just entered, qualifying", color: "#2F80FF" },
      { id: "qualified", name: "Qualified", description: "Confirmed fit", color: "#7B61FF" },
      { id: "call-scheduled", name: "Call Scheduled", description: "Meeting on calendar", color: "#F59E0B" },
      { id: "call-completed", name: "Call Completed", description: "Discovery done", color: "#06B6D4" },
      { id: "proposal-sent", name: "Proposal Sent", description: "Offer delivered", color: "#10B981" },
      { id: "negotiating", name: "Negotiating", description: "Working terms", color: "#FF4EDB" },
      { id: "closed-won", name: "Closed Won", description: "Money in! 🎉", color: "#10B981" },
      { id: "closed-lost", name: "Closed Lost", description: "Not this time", color: "#EF4444" },
    ],
  },
  webinar: {
    name: "Webinar",
    stages: [
      { id: "registered", name: "Registered", description: "Signed up for webinar", color: "#2F80FF" },
      { id: "reminded", name: "Reminded", description: "Got reminder emails", color: "#7B61FF" },
      { id: "attended-live", name: "Attended Live", description: "Showed up live", color: "#10B981" },
      { id: "watched-replay", name: "Watched Replay", description: "Viewed recording", color: "#06B6D4" },
      { id: "clicked-offer", name: "Clicked Offer", description: "Clicked sales link", color: "#F59E0B" },
      { id: "started-checkout", name: "Started Checkout", description: "Cart initiated", color: "#FF4EDB" },
      { id: "purchased", name: "Purchased", description: "Converted! 🎉", color: "#10B981" },
      { id: "no-show", name: "No Show", description: "Didn't attend", color: "#EF4444" },
    ],
  },
  challenge: {
    name: "Challenge",
    stages: [
      { id: "registered", name: "Registered", description: "Signed up for challenge", color: "#2F80FF" },
      { id: "day-1", name: "Day 1 Attended", description: "Showed up day 1", color: "#7B61FF" },
      { id: "day-2", name: "Day 2 Attended", description: "Showed up day 2", color: "#06B6D4" },
      { id: "day-3", name: "Day 3 Attended", description: "Showed up day 3", color: "#F59E0B" },
      { id: "offer-presented", name: "Offer Presented", description: "Saw the offer", color: "#FF4EDB" },
      { id: "started-checkout", name: "Started Checkout", description: "Cart initiated", color: "#E91E8C" },
      { id: "purchased", name: "Purchased", description: "Challenge buyer! 🎉", color: "#10B981" },
      { id: "vip-upsold", name: "VIP Upsold", description: "Upgraded to VIP! 💎", color: "#FFD700" },
      { id: "dropped-off", name: "Dropped Off", description: "Left the challenge", color: "#EF4444" },
    ],
  },
};

// Deal interface
interface Deal {
  id: number;
  name: string;
  email: string;
  phone: string;
  value: number;
  stage: string;
  source: string;
  entryDate: string;
  temp: "hot" | "warm" | "cold";
  avatar?: string;
  tags: { type: "event" | "status" | "behavior"; label: string }[];
  workflow: string;
  notes: { date: string; content: string; agent?: string }[];
}

// Temperature colors
const tempColors = {
  hot: "#FF4EDB",
  warm: "#F59E0B",
  cold: "#2F80FF",
};

// Tag colors by type
const tagColors = {
  event: { bg: "rgba(47,128,255,0.15)", border: "rgba(47,128,255,0.3)", text: "#2F80FF" },
  status: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)", text: "#10B981" },
  behavior: { bg: "rgba(123,97,255,0.15)", border: "rgba(123,97,255,0.3)", text: "#7B61FF" },
};
// Exodus Strong pipeline data from config
const bookACallDeals: Deal[] = PIPELINE_LEADS["book-a-call"] as unknown as Deal[];
const webinarDeals: Deal[] = PIPELINE_LEADS["webinar"] as unknown as Deal[];
const challengeDeals: Deal[] = PIPELINE_LEADS["challenge"] as unknown as Deal[];

// Activity feed
const aiActivity = [
  { agent: "The Levite",    action: "compliance gate LIVE — all content scanning active",            time: "Today",    icon: "⚖️" },
  { agent: "Solomon",       action: "Week 1 standing orders issued — The Nehemiah Protocol active",  time: "Today",    icon: "⚔️" },
  { agent: "Solomon",       action: "cold email domain purchase initiated",                          time: "Today",    icon: "📧" },
  { agent: "Solomon",       action: "Laurel Phase 1 video view ads — $15/day running",               time: "Today",    icon: "📱" },
  { agent: "Jay",           action: "Red Wave Phase 1 — PodMatch registration submitted",            time: "Today",    icon: "🌊" },
  { agent: "Solomon",       action: "warm list PROTECTED — Gate II active (8,400 subs)",             time: "Today",    icon: "🔒" },
];

export default function ProfitPipeline() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activePipeline, setActivePipeline] = useState<PipelineType>("book-a-call");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get deals for active pipeline
  const getDeals = (): Deal[] => {
    switch (activePipeline) {
      case "book-a-call":
        return bookACallDeals;
      case "webinar":
        return webinarDeals;
      case "challenge":
        return challengeDeals;
      default:
        return bookACallDeals;
    }
  };

  const deals = getDeals();
  const stages = pipelineTypes[activePipeline].stages;

  // Calculate stats
  const totalPipelineValue = deals.reduce((sum, d) => sum + d.value, 0);
  const totalDeals = deals.length;
  
  // Conversion rate calculation
  const getConversionRate = () => {
    if (activePipeline === "book-a-call") {
      const closedWon = deals.filter(d => d.stage === "closed-won").length;
      const total = deals.length;
      return total > 0 ? Math.round((closedWon / total) * 100) : 0;
    } else if (activePipeline === "webinar") {
      const purchased = deals.filter(d => d.stage === "purchased").length;
      const registered = deals.length;
      return registered > 0 ? Math.round((purchased / registered) * 100) : 0;
    } else {
      const purchased = deals.filter(d => d.stage === "purchased" || d.stage === "vip-upsold").length;
      const registered = deals.length;
      return registered > 0 ? Math.round((purchased / registered) * 100) : 0;
    }
  };
  
  // Closing this week (deals in late stages)
  const closingThisWeek = activePipeline === "book-a-call" 
    ? deals.filter(d => d.stage === "negotiating" || d.stage === "proposal-sent")
    : activePipeline === "webinar"
    ? deals.filter(d => d.stage === "started-checkout" || d.stage === "clicked-offer")
    : deals.filter(d => d.stage === "started-checkout" || d.stage === "offer-presented");
  
  const closingValue = closingThisWeek.reduce((sum, d) => sum + d.value, 0);
  
  // Stage stats
  const getStageDeals = (stageId: string) => deals.filter(d => d.stage === stageId);
  const getStageValue = (stageId: string) => getStageDeals(stageId).reduce((sum, d) => sum + d.value, 0);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle deal click
  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsDetailOpen(true);
  };

  return (
    <div style={{ padding: 32, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 10,
          letterSpacing: 3,
          fontFamily: "'Orbitron', monospace",
          background: "linear-gradient(90deg, #10B981, #2F80FF, #FF4EDB)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 8,
        }}>
          PROFIT PIPELINE
        </div>
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "'Space Grotesk', sans-serif",
          color: "#F5F7FA",
          marginBottom: 4,
        }}>
          Deals in Motion
        </div>
        <div style={{
          fontSize: 14,
          color: "#6B7186",
          fontFamily: "'Inter', sans-serif",
        }}>
          AI Following Up Automatically — Your Revenue Never Sleeps
        </div>
      </div>

      {/* Pipeline Type Toggle */}
      <div style={{
        display: "flex",
        gap: 0,
        marginBottom: 24,
        background: "rgba(255,255,255,0.03)",
        borderRadius: 12,
        padding: 4,
        border: "1px solid rgba(255,255,255,0.06)",
        width: "fit-content",
      }}>
        {(["book-a-call", "webinar", "challenge"] as PipelineType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActivePipeline(type)}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              background: activePipeline === type 
                ? "linear-gradient(135deg, rgba(233,30,140,0.2), rgba(0,217,255,0.2))"
                : "transparent",
              color: activePipeline === type ? "#F5F7FA" : "#6B7186",
              boxShadow: activePipeline === type 
                ? "0 0 20px rgba(233,30,140,0.2)"
                : "none",
            }}
          >
            {type === "book-a-call" && "📞 Book a Call"}
            {type === "webinar" && "🎥 Webinar"}
            {type === "challenge" && "🏆 Challenge"}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Total Pipeline Value */}
        <div style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
          borderRadius: 12,
          border: "1px solid rgba(16,185,129,0.3)",
        }}>
          <div style={{
            fontSize: 10,
            letterSpacing: 1.5,
            fontFamily: "'Orbitron', monospace",
            color: "#10B981",
            marginBottom: 8,
          }}>
            TOTAL IN PIPELINE
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#F5F7FA",
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {totalDeals}
            <span style={{ fontSize: 14, color: "#10B981", marginLeft: 8 }}>
              (${totalPipelineValue.toLocaleString()})
            </span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, rgba(47,128,255,0.15), rgba(47,128,255,0.05))",
          borderRadius: 12,
          border: "1px solid rgba(47,128,255,0.3)",
        }}>
          <div style={{
            fontSize: 10,
            letterSpacing: 1.5,
            fontFamily: "'Orbitron', monospace",
            color: "#2F80FF",
            marginBottom: 8,
          }}>
            CONVERSION RATE
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#F5F7FA",
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {getConversionRate()}%
          </div>
        </div>

        {/* Revenue in Pipeline */}
        <div style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, rgba(255,78,219,0.15), rgba(255,78,219,0.05))",
          borderRadius: 12,
          border: "1px solid rgba(255,78,219,0.3)",
        }}>
          <div style={{
            fontSize: 10,
            letterSpacing: 1.5,
            fontFamily: "'Orbitron', monospace",
            color: "#FF4EDB",
            marginBottom: 8,
          }}>
            REVENUE IN PIPELINE
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#F5F7FA",
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            ${totalPipelineValue.toLocaleString()}
          </div>
        </div>

        {/* Closing This Week */}
        <div style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, rgba(123,97,255,0.15), rgba(123,97,255,0.05))",
          borderRadius: 12,
          border: "1px solid rgba(123,97,255,0.3)",
        }}>
          <div style={{
            fontSize: 10,
            letterSpacing: 1.5,
            fontFamily: "'Orbitron', monospace",
            color: "#7B61FF",
            marginBottom: 8,
          }}>
            CLOSING THIS WEEK
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#F5F7FA",
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {closingThisWeek.length}
            <span style={{ fontSize: 14, color: "#7B61FF", marginLeft: 8 }}>
              (${closingValue.toLocaleString()})
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Pipeline + Sidebar */}
      <div style={{ display: "flex", gap: 24, flex: 1 }}>
        {/* Pipeline Kanban */}
        <div style={{ 
          flex: 1, 
          overflowX: "auto",
          paddingBottom: 16,
        }}>
          <div style={{
            display: "flex",
            gap: 12,
            minWidth: "fit-content",
          }}>
            {stages.map((stage) => {
              const stageDeals = getStageDeals(stage.id);
              const stageValue = getStageValue(stage.id);
              
              return (
                <div
                  key={stage.id}
                  style={{
                    width: 260,
                    minWidth: 260,
                    background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "calc(100vh - 420px)",
                  }}
                >
                  {/* Stage Header */}
                  <div style={{
                    padding: "16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}>
                      <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: stage.color,
                        fontFamily: "'Orbitron', monospace",
                        letterSpacing: 0.5,
                      }}>
                        {stage.name.toUpperCase()}
                      </div>
                      <div style={{
                        padding: "3px 8px",
                        borderRadius: 10,
                        background: `${stage.color}20`,
                        fontSize: 11,
                        fontWeight: 600,
                        color: stage.color,
                      }}>
                        {stageDeals.length}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: "#6B7186",
                      marginBottom: 8,
                    }}>
                      {stage.description}
                    </div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#F5F7FA",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      {formatCurrency(stageValue)}
                    </div>
                  </div>

                  {/* Deal Cards */}
                  <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}>
                    {stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        onClick={() => handleDealClick(deal)}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderLeft: `3px solid ${tempColors[deal.temp]}`,
                          padding: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                        }}
                      >
                        {/* Deal Header */}
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 8,
                        }}>
                          <div>
                            <div style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#F5F7FA",
                              fontFamily: "'Space Grotesk', sans-serif",
                            }}>
                              {deal.name}
                            </div>
                          </div>
                          {/* Temperature indicator */}
                          <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: tempColors[deal.temp],
                            boxShadow: `0 0 8px ${tempColors[deal.temp]}80`,
                          }} />
                        </div>

                        {/* Deal Value */}
                        <div style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#10B981",
                          fontFamily: "'Space Grotesk', sans-serif",
                          marginBottom: 8,
                        }}>
                          ${deal.value.toLocaleString()}
                        </div>

                        {/* Tags Preview (first 2) */}
                        <div style={{
                          display: "flex",
                          gap: 4,
                          flexWrap: "wrap",
                          marginBottom: 8,
                        }}>
                          {deal.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: 9,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: tagColors[tag.type].bg,
                                color: tagColors[tag.type].text,
                                border: `1px solid ${tagColors[tag.type].border}`,
                              }}
                            >
                              {tag.label}
                            </span>
                          ))}
                          {deal.tags.length > 2 && (
                            <span style={{
                              fontSize: 9,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "rgba(255,255,255,0.05)",
                              color: "#6B7186",
                            }}>
                              +{deal.tags.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Source Badge */}
                        <div style={{
                          fontSize: 9,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "rgba(47,128,255,0.15)",
                          color: "#2F80FF",
                          fontFamily: "'Orbitron', monospace",
                          display: "inline-block",
                          marginBottom: 8,
                        }}>
                          {deal.source}
                        </div>

                        {/* Last Activity */}
                        {deal.notes.length > 0 && (
                          <div style={{
                            fontSize: 10,
                            color: "#6B7186",
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                            paddingTop: 8,
                          }}>
                            <span style={{ color: "#7B61FF" }}>🤖</span>
                            {" "}{deal.notes[deal.notes.length - 1].content.substring(0, 35)}
                            {deal.notes[deal.notes.length - 1].content.length > 35 && "..."}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {stageDeals.length === 0 && (
                      <div style={{
                        padding: 20,
                        textAlign: "center",
                        color: "#6B7186",
                        fontSize: 12,
                      }}>
                        No deals
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar - AI Activity */}
        <div style={{
          width: 280,
          minWidth: 280,
          background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 420px)",
        }}>
          {/* Sidebar Header */}
          <div style={{
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{
                  fontSize: 10,
                  letterSpacing: 2,
                  fontFamily: "'Orbitron', monospace",
                  color: "#7B61FF",
                  marginBottom: 4,
                }}>
                  AI ACTIVITY
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#F5F7FA",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  Pipeline Actions
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
          </div>

          {/* Activity Items */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}>
            {aiActivity.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 8px",
                  borderRadius: 8,
                  background: index === 0 ? "rgba(123,97,255,0.1)" : "transparent",
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 11,
                    color: "#F5F7FA",
                    lineHeight: 1.4,
                  }}>
                    <span style={{ fontWeight: 600, color: "#7B61FF" }}>{item.agent}</span>
                    {" "}{item.action}
                  </div>
                  <div style={{
                    fontSize: 9,
                    color: "#6B7186",
                    fontFamily: "'Orbitron', monospace",
                    marginTop: 3,
                  }}>
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client Detail Modal */}
      {isDetailOpen && selectedDeal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {/* Backdrop */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
            }}
            onClick={() => setIsDetailOpen(false)}
          />
          
          {/* Modal */}
          <div style={{
            position: "relative",
            background: "#12121A",
            border: "1px solid #2A2A3E",
            borderRadius: 12,
            width: "100%",
            maxWidth: 600,
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            margin: "0 16px",
          }}>
            {/* Header */}
            <div style={{
              flexShrink: 0,
              borderBottom: "1px solid #2A2A3E",
              padding: 24,
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {/* Profile Photo Placeholder */}
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${tempColors[selectedDeal.temp]}, ${tempColors[selectedDeal.temp]}80)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    {selectedDeal.name.charAt(0)}
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: "#F5F7FA",
                      fontFamily: "'Space Grotesk', sans-serif",
                      margin: 0,
                    }}>
                      {selectedDeal.name}
                    </h2>
                    <div style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#10B981",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      ${selectedDeal.value.toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: "#6B7186",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#1E1E2A";
                    e.currentTarget.style.color = "#F5F7FA";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#6B7186";
                  }}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}>
              {/* Contact Info */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}>
                <div style={{
                  padding: 12,
                  background: "#1A1A2E",
                  borderRadius: 8,
                  border: "1px solid #2A2A3E",
                }}>
                  <div style={{ fontSize: 10, color: "#6B7186", marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>EMAIL</div>
                  <div style={{ fontSize: 13, color: "#F5F7FA" }}>{selectedDeal.email}</div>
                </div>
                <div style={{
                  padding: 12,
                  background: "#1A1A2E",
                  borderRadius: 8,
                  border: "1px solid #2A2A3E",
                }}>
                  <div style={{ fontSize: 10, color: "#6B7186", marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>PHONE</div>
                  <div style={{ fontSize: 13, color: "#F5F7FA" }}>{selectedDeal.phone}</div>
                </div>
              </div>

              {/* Entry Date, Source, Current Stage */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}>
                <div style={{
                  padding: 12,
                  background: "#1A1A2E",
                  borderRadius: 8,
                  border: "1px solid #2A2A3E",
                }}>
                  <div style={{ fontSize: 10, color: "#6B7186", marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>ENTRY DATE</div>
                  <div style={{ fontSize: 13, color: "#F5F7FA" }}>{formatDate(selectedDeal.entryDate)}</div>
                </div>
                <div style={{
                  padding: 12,
                  background: "#1A1A2E",
                  borderRadius: 8,
                  border: "1px solid #2A2A3E",
                }}>
                  <div style={{ fontSize: 10, color: "#6B7186", marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>SOURCE</div>
                  <div style={{ fontSize: 13, color: "#2F80FF" }}>{selectedDeal.source}</div>
                </div>
                <div style={{
                  padding: 12,
                  background: "#1A1A2E",
                  borderRadius: 8,
                  border: "1px solid #2A2A3E",
                }}>
                  <div style={{ fontSize: 10, color: "#6B7186", marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>CURRENT STAGE</div>
                  <div style={{ 
                    fontSize: 13, 
                    color: stages.find(s => s.id === selectedDeal.stage)?.color || "#F5F7FA",
                    fontWeight: 600,
                  }}>
                    {stages.find(s => s.id === selectedDeal.stage)?.name}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <div style={{ fontSize: 10, color: "#6B7186", marginBottom: 8, fontFamily: "'Orbitron', monospace" }}>TAGS</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selectedDeal.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 12,
                        padding: "6px 12px",
                        borderRadius: 6,
                        background: tagColors[tag.type].bg,
                        color: tagColors[tag.type].text,
                        border: `1px solid ${tagColors[tag.type].border}`,
                        fontWeight: 500,
                      }}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Current GHL Workflow */}
              <div style={{
                padding: 12,
                background: "linear-gradient(135deg, rgba(123,97,255,0.1), rgba(123,97,255,0.05))",
                borderRadius: 8,
                border: "1px solid rgba(123,97,255,0.3)",
              }}>
                <div style={{ fontSize: 10, color: "#7B61FF", marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>CURRENT GHL WORKFLOW</div>
                <div style={{ fontSize: 14, color: "#F5F7FA", fontWeight: 600 }}>{selectedDeal.workflow}</div>
              </div>

              {/* Notes / Activity Log */}
              <div>
                <div style={{ fontSize: 10, color: "#6B7186", marginBottom: 8, fontFamily: "'Orbitron', monospace" }}>ACTIVITY LOG</div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  maxHeight: 200,
                  overflowY: "auto",
                }}>
                  {selectedDeal.notes.map((note, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        background: "#1A1A2E",
                        borderRadius: 8,
                        border: "1px solid #2A2A3E",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#E91E8C" }}>
                          {note.agent || "System"}
                        </span>
                        <span style={{ fontSize: 10, color: "#6B7186" }}>
                          {formatDate(note.date)}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "#F5F7FA", margin: 0, lineHeight: 1.5 }}>
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
