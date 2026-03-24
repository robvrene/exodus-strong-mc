/**
 * Notion query helpers for Hall of Judgment + Exodus MC
 * All database IDs from NOTION_CONFIG.md
 */

const NOTION_TOKEN = process.env.NOTION_API_KEY!;
const BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export const DB = {
  gates:      "71ef413870284f8c87d8fbcbd35fac4a",
  tribes:     "107b5ebc95b5401e82abfa30510938b3",
  tasks:      "719bc46800fe42f68a0ed90512eccbb1",
  projects:   "ea124e54da3c43e7856649e58c617f2f",
  revenue:    "34a55020b58a4e978d6d1859e2df167e",
  nehemiah:   "e6f7a5fbdcc841a78a64bf28d59fc966",
  compliance: "f48d8a752af4420d9b5f5524d459c550",
  redwave:    "b948edb9bfad436ba99f20bf04b039f6",
  content:    "4d0abb9ec69540a39fac7ef137e670e9",
  financial:  "95bdb57a1f1b42beb9702542d31844f9",
};

// Strip hyphens for API calls
function dbId(id: string) {
  return id.replace(/-/g, "");
}

async function notionFetch(path: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate: 900 }, // 15 min default
  });
  return res.json();
}

// ─── Type helpers ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotionPage = Record<string, any>;

function getText(prop: NotionPage): string {
  if (!prop) return "";
  if (prop.type === "title")     return prop.title?.[0]?.plain_text ?? "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text ?? "";
  if (prop.type === "select")    return prop.select?.name ?? "";
  if (prop.type === "status")    return prop.status?.name ?? "";
  if (prop.type === "number")    return String(prop.number ?? "");
  if (prop.type === "date")      return prop.date?.start ?? "";
  if (prop.type === "checkbox")  return prop.checkbox ? "true" : "false";
  if (prop.type === "multi_select") return prop.multi_select?.map((o: NotionPage) => o.name).join(", ") ?? "";
  if (prop.type === "people")    return prop.people?.map((p: NotionPage) => p.name).join(", ") ?? "";
  return "";
}

function getNum(prop: NotionPage): number {
  return prop?.number ?? 0;
}

// ─── Query helpers ────────────────────────────────────────────────────────

async function queryDB(dbKey: keyof typeof DB, filter?: object, revalidate = 900) {
  const body: NotionPage = { page_size: 100 };
  if (filter) body.filter = filter;
  const data = await notionFetch(`/databases/${dbId(DB[dbKey])}/query`, body);
  return (data.results ?? []) as NotionPage[];
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────

export interface GateData {
  name: string;
  number: number;
  status: string;
  description: string;
  counselContact: string;
  notes: string;
  dateOpened: string;
  dateCleared: string;
}

export async function getGates(): Promise<GateData[]> {
  const pages = await queryDB("gates", undefined, 900);
  return pages
    .map((p) => ({
      name:          getText(p.properties.Name),
      number:        getNum(p.properties.Number),
      status:        getText(p.properties.Status),
      description:   getText(p.properties.Description),
      counselContact:getText(p.properties["Counsel Contact"]),
      notes:         getText(p.properties.Notes),
      dateOpened:    getText(p.properties["Date Opened"]),
      dateCleared:   getText(p.properties["Date Cleared"]),
    }))
    .sort((a, b) => a.number - b.number);
}

export interface TribeData {
  name: string;
  number: number;
  machine: string;
  status: string;
  deployWeek: number;
  role: string;
  mission: string;
  kpi: string;
  emoji: string;
  scripture: string;
  technology: string;
  primaryOutput: string;
  notes: string;
}

export async function getTribes(): Promise<TribeData[]> {
  const pages = await queryDB("tribes", undefined, 3600);
  return pages
    .map((p) => ({
      name:         getText(p.properties.Name),
      number:       getNum(p.properties.Number),
      machine:      getText(p.properties.Machine),
      status:       getText(p.properties.Status),
      deployWeek:   getNum(p.properties["Deploy Week"]),
      role:         getText(p.properties.Role),
      mission:      getText(p.properties.Mission),
      kpi:          getText(p.properties.KPI),
      emoji:        getText(p.properties.Emoji),
      scripture:    getText(p.properties.Scripture),
      technology:   getText(p.properties.Technology),
      primaryOutput:getText(p.properties["Primary Output"]),
      notes:        getText(p.properties.Notes),
    }))
    .sort((a, b) => a.number - b.number);
}

export interface TaskData {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  week: number;
  phase: string;
  tags: string;
  notesOutput: string;
}

export async function getTasksByStatus(statusName: string): Promise<TaskData[]> {
  const pages = await queryDB("tasks", {
    property: "Status",
    status: { equals: statusName },
  }, 900);
  return pages.map((p) => ({
    id:          p.id,
    name:        getText(p.properties.Name),
    description: getText(p.properties.Description),
    status:      getText(p.properties.Status),
    priority:    getText(p.properties.Priority),
    week:        getNum(p.properties.Week),
    phase:       getText(p.properties.Phase),
    tags:        getText(p.properties.Tags),
    notesOutput: getText(p.properties["Notes / Output"]),
  }));
}

export async function getWeekTasks(weekNum: number): Promise<TaskData[]> {
  const pages = await queryDB("tasks", {
    property: "Week",
    number: { equals: weekNum },
  }, 900);
  return pages.map((p) => ({
    id:          p.id,
    name:        getText(p.properties.Name),
    description: getText(p.properties.Description),
    status:      getText(p.properties.Status),
    priority:    getText(p.properties.Priority),
    week:        getNum(p.properties.Week),
    phase:       getText(p.properties.Phase),
    tags:        getText(p.properties.Tags),
    notesOutput: getText(p.properties["Notes / Output"]),
  }));
}

export interface RevenueEvent {
  name: string;
  type: string;
  weekStart: number;
  lowProjection: number;
  highProjection: number;
  actual: number;
  status: string;
  notes: string;
}

export async function getRevenue(): Promise<RevenueEvent[]> {
  const pages = await queryDB("revenue", undefined, 3600);
  return pages
    .map((p) => ({
      name:           getText(p.properties.Name),
      type:           getText(p.properties.Type),
      weekStart:      getNum(p.properties["Week Start"]),
      lowProjection:  getNum(p.properties["Low Projection"]),
      highProjection: getNum(p.properties["High Projection"]),
      actual:         getNum(p.properties.Actual),
      status:         getText(p.properties.Status),
      notes:          getText(p.properties.Notes),
    }))
    .sort((a, b) => a.weekStart - b.weekStart);
}

export interface ProjectData {
  name: string;
  status: string;
  progress: number;
  priority: string;
  phase: string;
  lead: string;
  revenueImpact: string;
  notes: string;
}

export async function getProjects(): Promise<ProjectData[]> {
  const pages = await queryDB("projects", undefined, 3600);
  return pages.map((p) => ({
    name:         getText(p.properties.Name),
    status:       getText(p.properties.Status),
    progress:     getNum(p.properties.Progress),
    priority:     getText(p.properties.Priority),
    phase:        getText(p.properties.Phase),
    lead:         getText(p.properties.Lead),
    revenueImpact:getText(p.properties["Revenue Impact"]),
    notes:        getText(p.properties.Notes),
  }));
}

export interface FinancialSnapshot {
  week: string;
  weekNumber: number;
  totalRevenue: number;
  adSpend: number;
  roas: number;
  mrr: number;
  beehiivSubscribers: number;
  gatesOpen: string;
  keyEvents: string;
  phase: string;
}

export async function getLatestFinancial(): Promise<FinancialSnapshot | null> {
  const pages = await queryDB("financial", undefined, 3600);
  if (!pages.length) return null;
  const p = pages[pages.length - 1]; // latest week
  return {
    week:               getText(p.properties.Name),
    weekNumber:         getNum(p.properties["Week Number"]),
    totalRevenue:       getNum(p.properties["Total Revenue"]),
    adSpend:            getNum(p.properties["Ad Spend"]),
    roas:               getNum(p.properties.ROAS),
    mrr:                getNum(p.properties.MRR),
    beehiivSubscribers: getNum(p.properties["Beehiiv Subscribers"]),
    gatesOpen:          getText(p.properties["Gates Open"]),
    keyEvents:          getText(p.properties["Key Events"]),
    phase:              getText(p.properties.Phase),
  };
}

// ─── Dashboard summary (combines key data for overview) ──────────────────

export interface DashboardSummary {
  gates: GateData[];
  gatesCleared: number;
  activeTribes: number;
  totalTribes: number;
  upNextTasks: TaskData[];
  inProgressTasks: TaskData[];
  weekRevenueLow: number;
  weekRevenueHigh: number;
  currentRevenue: number;
  jubileeTarget: number;
  financial: FinancialSnapshot | null;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [gates, tribes, upNext, inProgress, revenue, financial] = await Promise.all([
    getGates(),
    getTribes(),
    getTasksByStatus("Up Next"),
    getTasksByStatus("In Progress"),
    getRevenue(),
    getLatestFinancial(),
  ]);

  const currentWeekRevenue = revenue.find(r => r.weekStart <= 2 && r.status !== "Locked");
  const jubilee = revenue.find(r => r.name.includes("Jubilee"));

  return {
    gates,
    gatesCleared:     gates.filter(g => g.status === "Cleared").length,
    activeTribes:     tribes.filter(t => t.status === "Active").length,
    totalTribes:      tribes.length,
    upNextTasks:      upNext,
    inProgressTasks:  inProgress,
    weekRevenueLow:   currentWeekRevenue?.lowProjection ?? 0,
    weekRevenueHigh:  currentWeekRevenue?.highProjection ?? 0,
    currentRevenue:   financial?.totalRevenue ?? 0,
    jubileeTarget:    jubilee?.lowProjection ?? 250000,
    financial,
  };
}
