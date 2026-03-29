import { NextRequest, NextResponse } from "next/server";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
} from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const WORKSPACE = path.join(
  process.env.HOME || process.env.OPENCLAW_WORKSPACE || "/Users/solomon/.openclaw/workspace",
  ".openclaw",
  "workspace"
);

// On Vercel, HOME is /var/task or similar — we need a known path.
// Use OPENCLAW_WORKSPACE env var if set, otherwise derive from HOME.
function getMemoryDir(): string {
  const ws = process.env.OPENCLAW_WORKSPACE
    ? process.env.OPENCLAW_WORKSPACE
    : path.join(process.env.HOME || "/Users/solomon", ".openclaw", "workspace");
  return path.join(ws, "memory");
}

function ensureMemoryDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function todayDate(): string {
  const now = new Date();
  const local = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Chicago" })
  );
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const d = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface ParsedFile {
  preview: string;
  sections: string[];
}

function parseFile(content: string): ParsedFile {
  const lines = content.split("\n");
  const sections: string[] = [];
  let preview = "";
  for (const line of lines) {
    if (line.startsWith("## ")) sections.push(line.replace(/^## /, "").trim());
    if (!preview && line.trim() && !line.startsWith("#"))
      preview = line.trim().slice(0, 160);
  }
  if (!preview && sections.length > 0) preview = sections[0];
  return { preview, sections };
}

// ---------------------------------------------------------------------------
// GET /api/journal — list all dates OR read a single date
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const memDir = getMemoryDir();
  ensureMemoryDir(memDir);

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const query = searchParams.get("q");

  // Single date
  if (date) {
    const filePath = path.join(memDir, `${date}.md`);
    if (!existsSync(filePath)) {
      return NextResponse.json({ date, content: "", exists: false, sections: [], preview: "" });
    }
    const content = readFileSync(filePath, "utf-8");
    const { preview, sections } = parseFile(content);
    return NextResponse.json({ date, content, exists: true, preview, sections });
  }

  // List all dates
  const entries: {
    date: string;
    size: number;
    preview: string;
    sections: string[];
  }[] = [];

  if (existsSync(memDir)) {
    const files = readdirSync(memDir)
      .filter((f) => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
      .sort()
      .reverse();

    for (const f of files) {
      const content = readFileSync(path.join(memDir, f), "utf-8");
      if (query && !content.toLowerCase().includes(query.toLowerCase()))
        continue;
      const { preview, sections } = parseFile(content);
      entries.push({
        date: f.replace(".md", ""),
        size: content.length,
        preview,
        sections,
      });
    }
  }

  return NextResponse.json({ entries, today: todayDate() });
}

// ---------------------------------------------------------------------------
// POST /api/journal — append entry to a date's log
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const memDir = getMemoryDir();
  ensureMemoryDir(memDir);

  const body = await req.json();
  const date = body.date || todayDate();
  const { heading, content } = body as {
    heading?: string;
    content: string;
    date?: string;
  };

  if (!content) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const filePath = path.join(memDir, `${date}.md`);
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  let existing = "";
  if (existsSync(filePath)) {
    existing = readFileSync(filePath, "utf-8");
  } else {
    const [y, m, d] = date.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const friendly = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    existing = `# Daily Memory — ${friendly}\n\n`;
  }

  const block =
    `\n## ${heading || "Session Log"}\n` +
    `\n_[${timeStr} CDT]_\n\n` +
    content +
    "\n";

  writeFileSync(filePath, existing + block, "utf-8");
  return NextResponse.json({ success: true, date });
}

// ---------------------------------------------------------------------------
// PATCH /api/journal — overwrite a date's full content
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest) {
  const memDir = getMemoryDir();
  ensureMemoryDir(memDir);

  const body = await req.json();
  const { date, content } = body as { date: string; content: string };

  if (!date || content === undefined) {
    return NextResponse.json(
      { error: "date and content required" },
      { status: 400 }
    );
  }

  writeFileSync(path.join(memDir, `${date}.md`), content, "utf-8");
  return NextResponse.json({ success: true, date });
}
