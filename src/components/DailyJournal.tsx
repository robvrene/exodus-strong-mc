"use client";
import { useEffect, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EntryMeta {
  date: string;
  size: number;
  preview: string;
  sections: string[];
}

interface DayData {
  date: string;
  content: string;
  exists: boolean;
  preview: string;
  sections: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function todayLocal(): string {
  const now = new Date();
  const local = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const d = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatFull(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function sizeLabel(b: number): string {
  return b < 1024 ? `${b}B` : `${(b / 1024).toFixed(1)}KB`;
}

// ---------------------------------------------------------------------------
// Mini Markdown renderer (no react-markdown dependency needed)
// ---------------------------------------------------------------------------

function renderMarkdown(md: string): string {
  return md
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:700;color:#F5F7FA;margin:0 0 20px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:10px">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:15px;font-weight:700;color:#F5F7FA;margin:28px 0 10px">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:13px;font-weight:600;color:#C9A84C;margin:18px 0 8px">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#F5F7FA;font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#8A8F98;font-style:italic">$1</em>')
    .replace(/_(.+?)_/g, '<em style="color:#8A8F98;font-style:italic">$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px;font-size:12px;color:#C9A84C">$1</code>')
    .replace(/^[-*] (.+)$/gm, '<li style="margin-bottom:5px;color:#B0B6C3">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-bottom:5px;color:#B0B6C3">$1</li>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0">')
    .replace(/\n\n/g, '</p><p style="margin:0 0 12px;color:#B0B6C3">')
    .replace(/^(?!<[h|l|p|h])/gm, '')
    .trim();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DailyJournal() {
  const today = todayLocal();

  const [entries, setEntries] = useState<EntryMeta[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [editBuf, setEditBuf] = useState("");
  const [saving, setSaving] = useState(false);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [quickNote, setQuickNote] = useState("");
  const [showQuickNote, setShowQuickNote] = useState(false);

  const loadEntries = useCallback((q = "") => {
    fetch(`/api/journal${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then((r) => r.json())
      .then((data) => setEntries(data.entries || []));
  }, []);

  const loadDay = useCallback((date: string) => {
    setSelectedDate(date);
    setEditing(false);
    fetch(`/api/journal?date=${date}`)
      .then((r) => r.json())
      .then(setDayData);
  }, []);

  useEffect(() => {
    loadEntries();
    loadDay(today);
  }, [loadEntries, loadDay, today]);

  async function saveEdit() {
    setSaving(true);
    await fetch("/api/journal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, content: editBuf }),
    });
    setSaving(false);
    setEditing(false);
    loadDay(selectedDate);
    loadEntries(query);
  }

  async function submitQuickNote() {
    if (!quickNote.trim()) return;
    await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, heading: "Note", content: quickNote }),
    });
    setQuickNote("");
    setShowQuickNote(false);
    loadDay(selectedDate);
    loadEntries(query);
  }

  // Calendar
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const entryDates = new Set(entries.map((e) => e.date));

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
  };

  return (
    <div style={{ display: "flex", gap: 20, height: "calc(100vh - 120px)", fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── Left Column ──────────────────────────────────── */}
      <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Header */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 2px", color: "#F5F7FA", fontFamily: "'Orbitron', sans-serif" }}>
            Daily Journal
          </h2>
          <p style={{ color: "#8A8F98", fontSize: 12, margin: 0 }}>
            {entries.length} session log{entries.length !== 1 ? "s" : ""} · memory tracker
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#666", fontSize: 13 }}>🔍</span>
          <input
            placeholder="Search logs..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); loadEntries(e.target.value); }}
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "8px 12px 8px 32px", color: "#F5F7FA",
              fontSize: 13, boxSizing: "border-box", outline: "none",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          />
        </div>

        {/* Mini Calendar */}
        <div style={{ ...card, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button
              onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8F98", padding: 2, fontSize: 14 }}
            >‹</button>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#F5F7FA" }}>
              {MONTHS[calMonth]} {calYear}
            </span>
            <button
              onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8F98", padding: 2, fontSize: 14 }}
            >›</button>
          </div>

          {/* Day labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#666", fontWeight: 600 }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const ds = `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const hasLog = entryDates.has(ds);
              const isToday = ds === today;
              const isSel = ds === selectedDate;

              return (
                <button
                  key={day}
                  onClick={() => loadDay(ds)}
                  style={{
                    width: "100%", aspectRatio: "1", borderRadius: 5, border: "none",
                    fontSize: 11, fontWeight: isToday ? 700 : 400, cursor: "pointer",
                    background: isSel ? "#C9A84C" : isToday ? "rgba(201,168,76,0.15)" : "transparent",
                    color: isSel ? "#0b0f19" : isToday ? "#C9A84C" : hasLog ? "#F5F7FA" : "#555",
                    position: "relative",
                  }}
                >
                  {day}
                  {hasLog && !isSel && (
                    <span style={{
                      position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
                      width: 3, height: 3, borderRadius: "50%",
                      background: isToday ? "#C9A84C" : "#10B981",
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Entry list */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {entries.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#555", fontSize: 13 }}>
              {query ? "No results" : "No logs yet"}
            </div>
          )}
          {entries.map((e) => (
            <button
              key={e.date}
              onClick={() => loadDay(e.date)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                background: selectedDate === e.date ? "rgba(201,168,76,0.1)" : "transparent",
                border: selectedDate === e.date ? "1px solid rgba(201,168,76,0.3)" : "1px solid transparent",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: selectedDate === e.date ? "#C9A84C" : "#F5F7FA" }}>
                  {e.date === today ? "📅 Today" : e.date}
                </span>
                <span style={{ fontSize: 10, color: "#555" }}>{sizeLabel(e.size)}</span>
              </div>
              {e.sections.length > 0 && (
                <div style={{ fontSize: 11, color: "#666", marginBottom: 3 }}>
                  {e.sections.slice(0, 2).join(" · ")}{e.sections.length > 2 ? ` +${e.sections.length - 2}` : ""}
                </div>
              )}
              <div style={{ fontSize: 11, color: "#8A8F98", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {e.preview || "No content yet"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Panel ───────────────────────────────────── */}
      <div style={{ flex: 1, ...card, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{
          padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Orbitron', sans-serif" }}>
              {selectedDate === today && "📅 "}{formatFull(selectedDate)}
            </div>
            {dayData?.sections && dayData.sections.length > 0 && (
              <div style={{ fontSize: 11, color: "#8A8F98", marginTop: 3 }}>
                {dayData.sections.slice(0,4).join(" · ")}{dayData.sections.length > 4 ? ` +${dayData.sections.length - 4}` : ""}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#8A8F98", fontSize: 13, cursor: "pointer" }}
                >Cancel</button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(201,168,76,0.4)", background: "#C9A84C", color: "#0b0f19", fontSize: 13, cursor: "pointer", fontWeight: 700 }}
                >{saving ? "Saving..." : "💾 Save"}</button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowQuickNote(v => !v)}
                  style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)", color: "#10B981", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                >+ Quick Note</button>
                <button
                  onClick={() => { setEditBuf(dayData?.content || `# Daily Memory — ${formatFull(selectedDate)}\n\n`); setEditing(true); }}
                  style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#8A8F98", fontSize: 13, cursor: "pointer" }}
                >✏️ Edit</button>
              </>
            )}
          </div>
        </div>

        {/* Quick note bar */}
        {showQuickNote && !editing && (
          <div style={{
            padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: 10, flexShrink: 0,
            background: "rgba(16,185,129,0.04)",
          }}>
            <input
              autoFocus
              placeholder="Add a quick note to this day's log..."
              value={quickNote}
              onChange={e => setQuickNote(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submitQuickNote(); if (e.key === "Escape") setShowQuickNote(false); }}
              style={{
                flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 7, padding: "8px 14px", color: "#F5F7FA", fontSize: 13, outline: "none",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            />
            <button
              onClick={submitQuickNote}
              style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: "#10B981", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 700 }}
            >Add</button>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
          {editing ? (
            <textarea
              value={editBuf}
              onChange={(e) => setEditBuf(e.target.value)}
              style={{
                width: "100%", height: "100%", minHeight: 400,
                background: "transparent", border: "none", outline: "none",
                color: "#F5F7FA", fontSize: 13, lineHeight: 1.8,
                fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace',
                resize: "none", boxSizing: "border-box",
              }}
            />
          ) : dayData?.content ? (
            <div
              style={{ maxWidth: 760, fontSize: 14, lineHeight: 1.85, color: "#B0B6C3" }}
              dangerouslySetInnerHTML={{ __html: `<p style="margin:0 0 12px;color:#B0B6C3">${renderMarkdown(dayData.content)}</p>` }}
            />
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              height: "100%", gap: 16, color: "#555",
            }}>
              <div style={{ fontSize: 52 }}>{selectedDate === today ? "📅" : "📖"}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#8A8F98" }}>
                {selectedDate === today ? "No log yet for today" : "No log for this day"}
              </div>
              <div style={{ fontSize: 13, textAlign: "center", maxWidth: 340, lineHeight: 1.6, color: "#555" }}>
                {selectedDate === today
                  ? "Solomon automatically logs session summaries here as you work together. You can also add a quick note above."
                  : "No session activity was recorded for this date."}
              </div>
              {selectedDate === today && (
                <button
                  onClick={() => { setEditBuf(`# Daily Memory — ${formatFull(today)}\n\n`); setEditing(true); }}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.1)", color: "#C9A84C", fontSize: 13, cursor: "pointer", fontWeight: 600, marginTop: 8 }}
                >✏️ Start today&apos;s log</button>
              )}
            </div>
          )}
        </div>

        {/* Footer stats */}
        {dayData?.content && !editing && (
          <div style={{
            padding: "10px 24px", borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: 24, flexShrink: 0,
          }}>
            {[
              { label: "chars", value: dayData.content.length.toLocaleString() },
              { label: "words", value: dayData.content.split(/\s+/).filter(Boolean).length.toLocaleString() },
              { label: "sections", value: String(dayData.sections?.length || 0) },
              { label: "size", value: sizeLabel(dayData.content.length) },
            ].map(({ label, value }) => (
              <div key={label} style={{ fontSize: 11, color: "#555" }}>
                <span style={{ fontWeight: 600, color: "#8A8F98" }}>{value}</span> {label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
