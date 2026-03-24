"use client";

import { useState } from "react";
import { Tv } from "lucide-react";

// Types matching original Mission Control
type TaskStatus = 'inbox' | 'up-next' | 'in-progress' | 'waiting-on-aaron' | 'in-review' | 'done' | 'backlog';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_agent: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  due_date: string | null;
}

// Columns - EXACT MATCH to original
const KANBAN_COLUMNS = [
  { id: 'inbox' as TaskStatus, title: 'Inbox', color: '#94A3B8' },
  { id: 'up-next' as TaskStatus, title: 'Up Next', color: '#00D9FF' },
  { id: 'in-progress' as TaskStatus, title: 'In Progress', color: '#E91E8C' },
  { id: 'waiting-on-aaron' as TaskStatus, title: '⏳ Waiting on Rob', color: '#FBBF24' },
  { id: 'in-review' as TaskStatus, title: 'In Review', color: '#A855F7' },
  { id: 'done' as TaskStatus, title: 'Done', color: '#34D399' },
  { id: 'backlog' as TaskStatus, title: '📦 Backlog', color: '#64748B' },
];

// Priorities - EXACT MATCH to original
const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
  medium: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  urgent: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  critical: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
};

// Agents — Exodus Strong team
const AGENTS = ['Rob', 'Solomon', 'Jay', 'The Levite'] as const;

// Sample tasks data
const sampleTasks: Task[] = [
  // Inbox
  {
    id: "t1",
    title: "Brief Carpe Diem agency — consolidated Exodus operating brief",
    description: "Share The Nehemiah Protocol summary + content calendar for social media activation",
    status: "inbox",
    priority: "medium",
    assigned_agent: "Rob",
    tags: ["Content", "Agency"],
    created_at: "2026-03-24T08:00:00Z",
    updated_at: "2026-03-24T08:00:00Z",
    due_date: null,
  },
  {
    id: "t2",
    title: "Buy cold email domains (getexodusstrong.com, etc.)",
    description: "NEVER use exodusstrong.com for cold outreach. Purchase 2–3 dedicated domains, configure SPF/DKIM/DMARC.",
    status: "inbox",
    priority: "urgent",
    assigned_agent: "Rob",
    tags: ["Cold Email", "Week 1"],
    created_at: "2026-03-24T07:30:00Z",
    updated_at: "2026-03-24T07:30:00Z",
    due_date: "2026-03-24",
  },
  // Up Next
  {
    id: "t3",
    title: "Register PodMatch + MatchMaker.fm (Red Wave Phase 1)",
    description: "Create profile with 'Faith-Based AI Wellness Futurist' positioning. Submit top 5 guest applications this week.",
    status: "up-next",
    priority: "high",
    assigned_agent: "Jay",
    tags: ["Red Wave", "Week 1"],
    created_at: "2026-03-24T10:00:00Z",
    updated_at: "2026-03-24T10:00:00Z",
    due_date: "2026-03-27",
  },
  {
    id: "t4",
    title: "Launch Laurel Method Phase 1 video view ads ($15/day)",
    description: "Select 3 videos. Campaign objective: Video Views ONLY. NO sales, NO prices. Monitor CPV target $0.07–$0.50.",
    status: "up-next",
    priority: "high",
    assigned_agent: "Solomon",
    tags: ["Paid Ads", "Week 1"],
    created_at: "2026-03-24T10:00:00Z",
    updated_at: "2026-03-24T10:00:00Z",
    due_date: "2026-03-25",
  },
  // In Progress
  {
    id: "t5",
    title: "Search for FDA/FTC Regulatory Counsel — GATE I",
    description: "Contact Hyman Phelps (FDA) and Venable LLP (FTC). Request referrals from Troutman + Goletti network. Budget $5K–$10K initial. BLOCKS: warm list launch, paid placements.",
    status: "in-progress",
    priority: "critical",
    assigned_agent: "Rob",
    tags: ["Compliance", "Gate I"],
    created_at: "2026-03-24T08:00:00Z",
    updated_at: "2026-03-24T09:00:00Z",
    due_date: "2026-03-30",
  },
  {
    id: "t6",
    title: "Build AC Ascension Funnel (Zipify OCU) — GATE II",
    description: "$47 Book → OB → OTO1 ($67 H₂) → OTO2 (device) → $60/mo sub. The Herald generates copy. Actovision builds pages. Levite scans all. Rob approves.",
    status: "in-progress",
    priority: "critical",
    assigned_agent: "Solomon",
    tags: ["Funnel", "Gate II"],
    created_at: "2026-03-24T08:00:00Z",
    updated_at: "2026-03-24T10:30:00Z",
    due_date: "2026-04-14",
  },
  {
    id: "t7",
    title: "Record pillar video for Week 1 (Rob)",
    description: "My Exodus story OR Light Code educational content. 3–5 min, vertical 9:16. Value-bomb hook. The Multiplier repurposes into 10–15 assets.",
    status: "in-progress",
    priority: "medium",
    assigned_agent: "Rob",
    tags: ["Content", "Week 1"],
    created_at: "2026-03-24T08:00:00Z",
    updated_at: "2026-03-24T08:00:00Z",
    due_date: "2026-03-28",
  },
  // Waiting on Rob
  {
    id: "t8",
    title: "Approve The Levite forbidden-terms database",
    description: "Review compliance rules for: Face Mask+, Frequency Mist+, Molecular Hydrogen, QE Strong Patches, RLT Devices, Light Code Book. Solomon has draft ready.",
    status: "waiting-on-aaron",
    priority: "high",
    assigned_agent: "Rob",
    tags: ["Compliance", "The Levite"],
    created_at: "2026-03-24T08:00:00Z",
    updated_at: "2026-03-24T10:00:00Z",
    due_date: "2026-03-25",
  },
  {
    id: "t9",
    title: "Call WBAP 820 AM (Joe Pags Show — Dallas local)",
    description: "Red Wave Phase 1 — local radio outreach. Rob makes the call personally. Relationship-building = founder-level Production Quadrant work.",
    status: "waiting-on-aaron",
    priority: "urgent",
    assigned_agent: "Rob",
    tags: ["Red Wave", "Week 1"],
    created_at: "2026-03-24T09:00:00Z",
    updated_at: "2026-03-24T09:00:00Z",
    due_date: "2026-03-27",
  },
  // In Review
  {
    id: "t10",
    title: "Deploy The Scribe on Solomon2 (Week 2)",
    description: "Builds 4 email sequences: God Algorithm Bridge, Post-Quiz VSL, Book→Sub Ascension, Win-Back. DRAFT only — NOT deployed until Gate II clears.",
    status: "in-review",
    priority: "high",
    assigned_agent: "Solomon",
    tags: ["Email", "Week 2"],
    created_at: "2026-03-24T08:00:00Z",
    updated_at: "2026-03-24T09:00:00Z",
    due_date: "2026-03-31",
  },
  {
    id: "t11",
    title: "Deploy The Multiplier on Solomon2 (Week 2)",
    description: "Content repurposing pipeline: 1 pillar video → 10–15 assets for Carpe Diem queue. Feeds social calendar.",
    status: "in-review",
    priority: "medium",
    assigned_agent: "Solomon",
    tags: ["Content", "Week 2"],
    created_at: "2026-03-24T08:00:00Z",
    updated_at: "2026-03-24T09:00:00Z",
    due_date: "2026-03-31",
  },
  // Done
  {
    id: "t12",
    title: "Deploy The Levite on Solomon2 ✓",
    description: "FastAPI + 3-agent CrewAI crew LIVE. GREEN/YELLOW/RED verdict system operational. Compliance gate active.",
    status: "done",
    priority: "critical",
    assigned_agent: "Solomon",
    tags: ["Compliance", "Week 1"],
    created_at: "2026-03-22T09:00:00Z",
    updated_at: "2026-03-24T08:00:00Z",
    due_date: "2026-03-24",
  },
  {
    id: "t13",
    title: "Connect GoHighLevel CRM to OpenClaw ✓",
    description: "GHL operational via mcporter. All 36 tools accessible: Contacts, Opportunities, Conversations, Calendars, Payments.",
    status: "done",
    priority: "high",
    assigned_agent: "Solomon",
    tags: ["CRM", "Infrastructure"],
    created_at: "2026-03-20T08:00:00Z",
    updated_at: "2026-03-22T14:00:00Z",
    due_date: "2026-03-22",
  },
  {
    id: "t14",
    title: "The Nehemiah Protocol — master plan complete ✓",
    description: "16-agent blueprint, 12-week sequencing, 4 Goletti pillars, Red Wave Phase 1–3, Sultanic funnel architecture, Laurel Method, compliance infrastructure — all integrated.",
    status: "done",
    priority: "critical",
    assigned_agent: "Rob",
    tags: ["Strategy", "Planning"],
    created_at: "2026-03-23T08:00:00Z",
    updated_at: "2026-03-23T18:00:00Z",
    due_date: "2026-03-23",
  },
  // Backlog
  {
    id: "t15",
    title: "BiohackingVille community launch (Circle.so)",
    description: "The Cornerstone deploys Week 9. Free tier only until 500+ engaged members. Post-purchase onboarding → community retention.",
    status: "backlog",
    priority: "low",
    assigned_agent: "Solomon",
    tags: ["Community", "Week 9"],
    created_at: "2026-03-24T11:00:00Z",
    updated_at: "2026-03-24T11:00:00Z",
    due_date: "2026-05-26",
  },
  {
    id: "t16",
    title: "TikTok Shop Face Mask+ affiliate pilot",
    description: "The Ambassador recruits TikTok creators. Blocked until Gate III (QE Strong/branding) + Gate I (counsel) cleared.",
    status: "backlog",
    priority: "medium",
    assigned_agent: "Solomon",
    tags: ["Affiliates", "Week 9"],
    created_at: "2026-03-24T09:00:00Z",
    updated_at: "2026-03-24T09:00:00Z",
    due_date: "2026-05-01",
  },
  {
    id: "t17",
    title: "$27 Light Code Challenge Guide (Pillar 3 — Publish)",
    description: "Maria Wint model. 40-Day Light Code Challenge → OB ($19 Frequency Mist sample) → OTO ($47 Book) → backend. Zero COGS. Build Month 2.",
    status: "backlog",
    priority: "low",
    assigned_agent: "Solomon",
    tags: ["Product", "Month 2"],
    created_at: "2026-03-24T08:00:00Z",
    updated_at: "2026-03-24T08:00:00Z",
    due_date: "2026-04-28",
  },
];

// Activity feed
const mockActivity = [
  { id: 1, type: 'task_moved', message: 'The Levite deployment COMPLETE — compliance gate LIVE on Solomon2', time: 'Today', agent: 'Solomon' },
  { id: 2, type: 'task_created', message: 'Week 1 standing orders issued — The Nehemiah Protocol Week 1 active', time: 'Today', agent: 'Solomon' },
  { id: 3, type: 'task_completed', message: 'The Nehemiah Protocol master plan finalized — 12-week blueprint locked', time: 'Yesterday', agent: 'Rob' },
  { id: 4, type: 'comment', message: 'Gate I search initiated — Rob contacting Hyman Phelps and Venable LLP', time: 'Today', agent: 'Rob' },
  { id: 5, type: 'task_moved', message: 'Jay assigned Red Wave Phase 1 — PodMatch, MatchMaker.fm outreach', time: 'Today', agent: 'Jay' },
];

// Recurring tasks
const mockRecurringTasks = [
  { id: 1, title: 'Record pillar video', frequency: 'Weekly (45–60 min)', nextRun: 'Mar 28', agent: 'Rob' },
  { id: 2, title: 'Review War Council report + decisions', frequency: 'Weekly Sunday', nextRun: 'Mar 29', agent: 'Rob' },
  { id: 3, title: 'The Watchman morning brief', frequency: 'Daily 6:00 AM', nextRun: 'Mar 25', agent: 'Solomon' },
];

export default function Projects() {
  const [tasks] = useState<Task[]>(sampleTasks);

  // Get tasks by status
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  // Stats for sidebar
  const stats = {
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    inReview: tasks.filter(t => t.status === 'in-review').length,
    completed: tasks.filter(t => t.status === 'done').length,
    total: tasks.length,
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Kanban Board - Main Content */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full">
            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4 h-full">
              {KANBAN_COLUMNS.map((column) => {
                const columnTasks = getTasksByStatus(column.id);
                return (
                  <div
                    key={column.id}
                    className="flex flex-col min-w-[280px] max-w-[320px] flex-1"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: column.color }}
                        />
                        <h3 className="font-semibold text-sm text-foreground">{column.title}</h3>
                        <span className="text-xs text-muted-foreground bg-[#1E1E2A] px-2 py-0.5 rounded-full">
                          {columnTasks.length}
                        </span>
                      </div>
                      <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#1E1E2A] text-muted-foreground hover:text-foreground transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Column Content */}
                    <div className="flex-1 rounded-lg p-2 bg-[#0E0E14]/50 min-h-[200px]">
                      <div className="flex flex-col gap-2">
                        {columnTasks.map((task) => {
                          const priority = PRIORITY_COLORS[task.priority];
                          return (
                            <div
                              key={task.id}
                              className="group relative p-3 bg-[#12121A] border border-[#2A2A3E] hover:border-[#3A3A5E] rounded-lg transition-all duration-200 cursor-pointer"
                            >
                              {/* Priority indicator bar */}
                              <div 
                                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                                style={{ backgroundColor: column.color }}
                              />
                              
                              <div className="pl-2">
                                {/* Title */}
                                <h4 className="font-medium text-sm text-foreground mb-2 line-clamp-2">
                                  {task.title}
                                </h4>

                                {/* Description preview */}
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                {/* Tags */}
                                {task.tags.length > 0 && (
                                  <div className="flex gap-1 flex-wrap mb-3">
                                    {task.tags.slice(0, 2).map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-[10px] text-[#00D9FF] bg-[#00D9FF]/10 px-2 py-0.5 rounded border border-[#00D9FF]/30"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Meta row */}
                                <div className="flex items-center justify-between gap-2">
                                  {/* Priority badge */}
                                  <span className={`${priority.bg} ${priority.text} ${priority.border} text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-medium`}>
                                    {task.priority}
                                  </span>

                                  {/* Agent */}
                                  <div className="flex items-center gap-1">
                                    <div 
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                      style={{ 
                                        background: task.assigned_agent === 'Solomon' 
                                          ? 'linear-gradient(135deg, #E91E8C, #00D9FF)' 
                                          : task.assigned_agent === 'Phil'
                                          ? '#00D9FF'
                                          : task.assigned_agent === 'Alex'
                                          ? '#A855F7'
                                          : '#FBBF24'
                                      }}
                                    >
                                      {task.assigned_agent[0]}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                      {task.assigned_agent}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Empty state */}
                      {columnTasks.length === 0 && (
                        <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                          No tasks
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - Right Side */}
        <aside className="w-80 border-l border-[#2A2A3E] bg-[#0E0E14] p-4 overflow-y-auto">
          {/* Live Activity */}
          <div className="p-4 rounded-lg bg-[#12121A] border border-[#2A2A3E]">
            <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-[#34D399] rounded-full animate-pulse" />
              Live Activity
            </h3>
            <div className="space-y-3">
              {mockActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ 
                      background: activity.agent === 'Solomon' 
                        ? 'linear-gradient(135deg, #E91E8C, #00D9FF)' 
                        : activity.agent === 'Phil'
                        ? '#00D9FF'
                        : activity.agent === 'Alex'
                        ? '#A855F7'
                        : activity.agent === 'Aaron'
                        ? '#FBBF24'
                        : '#64748B'
                    }}
                  >
                    {activity.agent[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground line-clamp-2">{activity.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Stats Summary */}
          <div className="mt-4 p-4 rounded-lg bg-[#12121A] border border-[#2A2A3E]">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="In Progress" value={stats.inProgress.toString()} color="#E91E8C" />
              <StatCard label="In Review" value={stats.inReview.toString()} color="#A855F7" />
              <StatCard label="Completed" value={stats.completed.toString()} color="#34D399" />
              <StatCard label="Total" value={stats.total.toString()} color="#00D9FF" />
            </div>
          </div>

          {/* Media Hub Link */}
          <a 
            href="/media"
            className="mt-4 block p-4 rounded-lg bg-gradient-to-br from-[#E91E8C]/20 to-[#00D9FF]/20 border border-[#E91E8C]/40 hover:border-[#E91E8C]/80 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E91E8C] to-[#00D9FF] flex items-center justify-center">
                <Tv className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-[#E91E8C] transition-colors">Media Hub</h3>
                <p className="text-[10px] text-muted-foreground">Channels, content & analytics</p>
              </div>
              <span className="text-[#E91E8C] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </div>
          </a>

          {/* Recurring Tasks */}
          <div className="mt-4 p-4 rounded-lg bg-[#12121A] border border-[#2A2A3E]">
            <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
              <svg className="w-4 h-4 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recurring Tasks
            </h3>
            <div className="space-y-3">
              {mockRecurringTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 rounded bg-[#1A1A2E]">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{task.title}</p>
                    <p className="text-[10px] text-muted-foreground">{task.frequency}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-[10px] text-[#00D9FF]">{task.nextRun}</p>
                    <p className="text-[10px] text-muted-foreground">{task.agent}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Status */}
          <div className="mt-4 p-4 rounded-lg bg-[#12121A] border border-[#2A2A3E]">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Agent Status</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E91E8C] to-[#00D9FF] flex items-center justify-center text-white font-bold">
                S
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Solomon</p>
                <p className="text-[10px] text-muted-foreground">claude-opus-4-5</p>
              </div>
              <span className="ml-auto w-2 h-2 bg-[#34D399] rounded-full animate-pulse" />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center p-2 rounded-md bg-[#1A1A2E]">
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
