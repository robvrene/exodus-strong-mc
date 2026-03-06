import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Static mock data
const mockState = {
  business: {
    name: "Viral Growth Agency",
    niche: "B2B SaaS",
  },
  agents: [
    { id: "prospector", name: "Prospect Hunter", avatar: "🎯", role: "Finding ideal prospects", status: "complete", currentTask: "Found 112 prospects", progress: 100, tasksCompleted: 3 },
    { id: "researcher", name: "Deep Researcher", avatar: "🔍", role: "Researching prospects", status: "working", currentTask: "Analyzing prospects...", progress: 65, tasksCompleted: 2 },
    { id: "writer", name: "Message Writer", avatar: "✍️", role: "Crafting personalized DMs", status: "working", currentTask: "Writing messages...", progress: 40, tasksCompleted: 1 },
    { id: "sender", name: "Outreach Agent", avatar: "📧", role: "Sending messages", status: "active", currentTask: "30 DMs sent", progress: 30, tasksCompleted: 1 },
  ],
  tasks: [
    { id: "1", title: "Scrape LinkedIn for SaaS founders", status: "complete", priority: "high" },
    { id: "2", title: "Research company backgrounds", status: "in-progress", priority: "high" },
    { id: "3", title: "Generate personalized openers", status: "in-progress", priority: "medium" },
    { id: "4", title: "Send batch 1 (50 DMs)", status: "in-progress", priority: "high" },
    { id: "5", title: "Follow up on replies", status: "todo", priority: "medium" },
  ],
  activity: [
    { id: "1", message: "📞 Call booked with Sarah M.", timestamp: new Date().toISOString(), type: "success" },
    { id: "2", message: "💬 New reply from Mike T.", timestamp: new Date().toISOString(), type: "success" },
    { id: "3", message: "📧 30 DMs sent", timestamp: new Date().toISOString(), type: "info" },
  ],
  metrics: {
    totalTasks: 5,
    completedTasks: 1,
    inReviewTasks: 0,
    blockedTasks: 0,
    prospects: 112,
    dmsSent: 30,
    replies: 3,
    calls: 1,
  },
};

// GET - Return static mock data
export async function GET() {
  return NextResponse.json({
    ...mockState,
    lastUpdated: new Date().toISOString(),
  });
}

// POST - Accept but ignore (for compatibility)
export async function POST() {
  return NextResponse.json({ success: true });
}
