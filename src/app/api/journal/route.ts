import { NextRequest, NextResponse } from "next/server";
import { execute, db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Filesystem helpers (only used on the Mac Mini — gracefully skipped on Vercel)
// ---------------------------------------------------------------------------

function getMemoryDir(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    const ws =
      process.env.OPENCLAW_WORKSPACE ||
      path.join(process.env.HOME || "/Users/solomon", ".openclaw", "workspace");
    const dir = path.join(ws, "memory");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  } catch {
    return null;
  }
}

function writeLocalFile(date: string, content: string): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    const dir = getMemoryDir();
    if (!dir) return;
    fs.writeFileSync(path.join(dir, `${date}.md`), content, "utf-8");
  } catch {
    // Vercel read-only filesystem — expected, silently skip
  }
}

function readLocalFile(date: string): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    const dir = getMemoryDir();
    if (!dir) return null;
    const filePath = path.join(dir, `${date}.md`);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function listLocalFiles(): Array<{ date: string; content: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    const dir = getMemoryDir();
    if (!dir || !fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f: string) => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
      .map((f: string) => ({
        date: f.replace(".md", ""),
        content: fs.readFileSync(path.join(dir, f), "utf-8"),
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayDate(): string {
  const now = new Date();
  const local = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Chicago" })
  );
  return [
    local.getFullYear(),
    String(local.getMonth() + 1).padStart(2, "0"),
    String(local.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseFile(content: string): { preview: string; sections: string[] } {
  const lines = content.split("\n");
  const sections: string[] = [];
  let preview = "";
  for (const line of lines) {
    if (line.startsWith("## "))
      sections.push(line.replace(/^## /, "").trim());
    if (!preview && line.trim() && !line.startsWith("#"))
      preview = line.trim().slice(0, 160);
  }
  if (!preview && sections.length > 0) preview = sections[0];
  return { preview, sections };
}

// ---------------------------------------------------------------------------
// GET /api/journal
// ?date=YYYY-MM-DD  → return that day's full content
// (no params)       → return list of all dates
// ?q=search         → filtered list
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const query = searchParams.get("q");

  // ── Single date ──────────────────────────────────────────────────────────
  if (date) {
    // Try Turso first
    try {
      const row = await execute(
        "SELECT content, updated_at FROM journal WHERE date = :date",
        { date }
      );
      if (row.rows.length > 0) {
        const content = String(row.rows[0][0] ?? "");
        const { preview, sections } = parseFile(content);
        return NextResponse.json({ date, content, exists: true, preview, sections });
      }
    } catch {
      // Turso unavailable — fall through to filesystem
    }

    // Fallback: local filesystem (Mac Mini only)
    const content = readLocalFile(date);
    if (content) {
      const { preview, sections } = parseFile(content);
      return NextResponse.json({ date, content, exists: true, preview, sections });
    }

    return NextResponse.json({ date, content: "", exists: false, sections: [], preview: "" });
  }

  // ── List all dates ───────────────────────────────────────────────────────
  try {
    const result = await execute(
      "SELECT date, content FROM journal ORDER BY date DESC"
    );

    const entries = result.rows
      .map((row) => {
        const d = String(row[0]);
        const content = String(row[1] ?? "");
        if (query && !content.toLowerCase().includes(query.toLowerCase()))
          return null;
        const { preview, sections } = parseFile(content);
        return { date: d, size: content.length, preview, sections };
      })
      .filter(Boolean);

    return NextResponse.json({ entries, today: todayDate() });
  } catch {
    // Turso down — fall back to filesystem
    const files = listLocalFiles().sort((a, b) => b.date.localeCompare(a.date));
    const entries = files
      .filter((f) => !query || f.content.toLowerCase().includes(query.toLowerCase()))
      .map(({ date: d, content }) => {
        const { preview, sections } = parseFile(content);
        return { date: d, size: content.length, preview, sections };
      });
    return NextResponse.json({ entries, today: todayDate() });
  }
}

// ---------------------------------------------------------------------------
// POST /api/journal — append a block to a date's log
// Body: { date?, heading?, content }
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const body = await req.json() as { date?: string; heading?: string; content: string };
  const date = body.date || todayDate();
  const { heading, content } = body;

  if (!content) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Get existing content
  let existing = "";
  try {
    const row = await execute(
      "SELECT content FROM journal WHERE date = :date",
      { date }
    );
    if (row.rows.length > 0) existing = String(row.rows[0][0] ?? "");
  } catch {
    existing = readLocalFile(date) || "";
  }

  if (!existing) {
    const [y, m, d] = date.split("-").map(Number);
    const friendly = new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    existing = `# Daily Memory — ${friendly}\n\n`;
  }

  const block =
    `\n## ${heading || "Session Log"}\n` +
    `\n_[${timeStr} CDT]_\n\n` +
    content + "\n";

  const newContent = existing + block;
  const updatedAt = new Date().toISOString();

  // Write to Turso
  try {
    await execute(
      `INSERT INTO journal (date, content, updated_at) VALUES (:date, :content, :updatedAt)
       ON CONFLICT(date) DO UPDATE SET content = :content, updated_at = :updatedAt`,
      { date, content: newContent, updatedAt }
    );
  } catch (e) {
    console.error("[journal] Turso write failed:", e);
  }

  // Mirror to local filesystem
  writeLocalFile(date, newContent);

  return NextResponse.json({ success: true, date });
}

// ---------------------------------------------------------------------------
// PATCH /api/journal — overwrite a date's full content
// Body: { date, content }
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest) {
  const body = await req.json() as { date: string; content: string };
  const { date, content } = body;

  if (!date || content === undefined) {
    return NextResponse.json({ error: "date and content required" }, { status: 400 });
  }

  const updatedAt = new Date().toISOString();

  // Write to Turso
  try {
    await execute(
      `INSERT INTO journal (date, content, updated_at) VALUES (:date, :content, :updatedAt)
       ON CONFLICT(date) DO UPDATE SET content = :content, updated_at = :updatedAt`,
      { date, content, updatedAt }
    );
  } catch (e) {
    console.error("[journal] Turso write failed:", e);
  }

  // Mirror to local filesystem
  writeLocalFile(date, content);

  return NextResponse.json({ success: true, date });
}

// ---------------------------------------------------------------------------
// PUT /api/journal — bulk backfill (sync local .md files → Turso)
// Called once from backfill script
// ---------------------------------------------------------------------------

export async function PUT() {
  const files = listLocalFiles();
  if (files.length === 0) {
    return NextResponse.json({ synced: 0, message: "No local files found" });
  }

  const client = await db();
  let synced = 0;

  for (const { date, content } of files) {
    try {
      await client.execute({
        sql: `INSERT INTO journal (date, content, updated_at) VALUES (?, ?, ?)
              ON CONFLICT(date) DO UPDATE SET content = ?, updated_at = ?`,
        args: [date, content, new Date().toISOString(), content, new Date().toISOString()],
      });
      synced++;
    } catch (e) {
      console.error(`[journal] backfill failed for ${date}:`, e);
    }
  }

  return NextResponse.json({ synced, total: files.length });
}
