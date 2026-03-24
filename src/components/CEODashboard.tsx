"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ALERTS, CEO_KPI, PROMOTE_CHANNELS, PROFIT_FUNNELS, AI_SALES, PRODUCE_OFFERS, SCHEDULE, BRAND } from "@/config/exodus-data";

const deptColors: Record<string, string> = { Prospect: "#2F80FF", Paid: "#7B61FF", Publish: "#2F80FF", Partner: "#7B61FF", Sales: "#FF4EDB", All: "#8A8F98" };

const daysBetween = (a: Date, b: Date) => Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
const toISO = (d: Date) => d.toISOString().split("T")[0];
const fromISO = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

interface DataResult {
  rangeLabel: string;
  days: number;
  revenue: { current: number; previous: number };
  newSales: { count: number; value: number };
  aov: { current: number };
  leads: { current: number; previous: number };
  eventRegs: { webinar: number; challenge: number; total: number; previous: number };
  conversionRate: { current: number; previous: number };
  activeClients: {
    dfy: { count: number; capacity: number; label: string };
    workshop: { count: number; label: string };
    challenge: { count: number; label: string };
    book: { count: number; label: string };
  };
  referrals: { current: number; previous: number };
  adSpend: { spend: number; revenue: number; roas: number };
  alerts: Array<{ type: string; message: string; area: string }>;
  promote: {
    channels: Array<{
      name: string;
      icon: string;
      color: string;
      leads: number;
      eventRegs: number;
      metrics: Record<string, number | string>;
    }>;
  };
  profit: {
    funnels: Array<{
      name: string;
      icon: string;
      type: string;
      color: string;
      visitors: number;
      conversions: number;
      rate: number;
      revenue: number;
      status?: string;
    }>;
    aiSales: {
      ticketsSold: number;
      assists: number;
      directSales: number;
      totalConversations: number;
      responseTime: string;
      revenue: number;
    };
  };
  produce: {
    offers: Array<{
      name: string;
      icon: string;
      color: string;
      active: number;
      capacity: number | null;
      completed: number;
      satisfaction: number | null;
      referrals: number;
    }>;
    totalReferrals: number;
  };
}

// ── Exodus Strong: generateData pulls from config instead of hardcoded demo values ──
const generateData = (_startDate: Date, _endDate: Date): DataResult => {
  return {
    rangeLabel: CEO_KPI.rangeLabel,
    days: 7,
    revenue: CEO_KPI.revenue,
    newSales: CEO_KPI.newSales,
    aov: CEO_KPI.aov,
    leads: CEO_KPI.leads,
    eventRegs: CEO_KPI.eventRegs,
    conversionRate: CEO_KPI.conversionRate,
    activeClients: CEO_KPI.activeClients as unknown as DataResult["activeClients"],
    referrals: CEO_KPI.referrals,
    adSpend: CEO_KPI.adSpend,
    alerts: ALERTS,
    promote: {
      channels: PROMOTE_CHANNELS.map(ch => ({
        name: ch.name,
        icon: ch.icon,
        color: ch.color,
        leads: ch.leads,
        eventRegs: ch.eventRegs,
        metrics: ch.metrics as unknown as Record<string, number | string>,
      })),
    },
    profit: {
      funnels: PROFIT_FUNNELS.map(f => ({
        name: f.name,
        icon: f.icon,
        type: f.type,
        color: f.color,
        visitors: f.visitors,
        conversions: f.conversions,
        rate: f.rate,
        revenue: f.revenue,
        status: f.status,
      })),
      aiSales: {
        ticketsSold: AI_SALES.ticketsSold,
        assists: AI_SALES.assists,
        directSales: AI_SALES.directSales,
        totalConversations: AI_SALES.totalConversations,
        responseTime: AI_SALES.responseTime,
        revenue: AI_SALES.revenue,
      },
    },
    produce: {
      offers: PRODUCE_OFFERS.map(o => ({
        name: o.name,
        icon: o.icon,
        color: o.color,
        active: o.active,
        capacity: o.capacity,
        completed: o.completed,
        satisfaction: o.satisfaction,
        referrals: o.referrals,
      })),
      totalReferrals: CEO_KPI.referrals.current,
    },
  };
};

const fmt = (n: number) => { if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`; if (n >= 1000) return `$${(n/1000).toFixed(1)}K`; return `$${n}`; };
const fmtN = (n: number) => { if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`; if (n >= 1000) return `${(n/1000).toFixed(1)}K`; return `${n}`; };
const pctChange = (curr: number, prev: number) => { if (!prev) return null; return Math.round(((curr - prev) / prev) * 100); };

const Trend = ({ current, previous }: { current: number; previous: number }) => {
  const change = pctChange(current, previous);
  if (change === null) return null;
  const up = change >= 0;
  return <span style={{ fontSize: 11, fontWeight: 600, color: up ? "#10B981" : "#EF4444", marginLeft: 8 }}>{up ? "↑" : "↓"} {Math.abs(change)}%</span>;
};

const KPICard = ({ label, value, subValue, trend, small }: { label: string; value: string | number; subValue?: string; trend?: React.ReactNode; small?: boolean }) => (
  <div style={{
    background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: small ? "14px 16px" : "18px 22px",
    border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  }}>
    <div style={{ fontSize: 10, color: "#8A8F98", fontFamily: "'Orbitron', monospace", letterSpacing: 1, marginBottom: 8 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline" }}>
      <span style={{ fontSize: small ? 24 : 30, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>{value}</span>
      {trend}
    </div>
    {subValue && <div style={{ fontSize: 11, color: "#6B7186", marginTop: 4 }}>{subValue}</div>}
  </div>
);

// Mini Calendar Component
function MiniCalendar({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const [viewDate, setViewDate] = useState(new Date(fromISO(value)));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const selected = value ? fromISO(value) : null;
  const isSelected = (day: number) => selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
  const isToday = (day: number) => { const t = new Date(); return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day; };

  return (
    <div ref={ref} style={{
      position: "absolute", top: "100%", right: 0, marginTop: 8, zIndex: 100,
      background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
      padding: 16, width: 280, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ background: "none", border: "none", color: "#8A8F98", cursor: "pointer", fontSize: 16, padding: "4px 8px" }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>{months[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: "none", border: "none", color: "#8A8F98", cursor: "pointer", fontSize: 16, padding: "4px 8px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", padding: "4px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, i) => (
          <div key={i} onClick={() => { if (day) { onChange(toISO(new Date(year, month, day))); }}}
            style={{
              textAlign: "center", padding: "6px 0", borderRadius: 4, fontSize: 12, cursor: day ? "pointer" : "default",
              color: !day ? "transparent" : isSelected(day) ? "#fff" : isToday(day) ? "#2F80FF" : "#C8CCD4",
              background: day && isSelected(day) ? "linear-gradient(135deg, #2F80FF, #7B61FF)" : day ? "rgba(255,255,255,0.02)" : "transparent",
              fontWeight: (day && isSelected(day)) || (day && isToday(day)) ? 700 : 400,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
            {day || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// Date Range Picker
function DateRangePicker({ startDate, endDate, onStartChange, onEndChange, onPreset }: {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onPreset: (s: string, e: string) => void;
}) {
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const today = new Date();
  const todayStr = toISO(today);

  const presets = [
    { label: "TODAY", fn: () => { const t = toISO(today); onPreset(t, t); } },
    { label: "7D", fn: () => { const s = new Date(today); s.setDate(s.getDate() - 7); onPreset(toISO(s), todayStr); } },
    { label: "30D", fn: () => { const s = new Date(today); s.setDate(s.getDate() - 30); onPreset(toISO(s), todayStr); } },
    { label: "90D", fn: () => { const s = new Date(today); s.setDate(s.getDate() - 90); onPreset(toISO(s), todayStr); } },
    { label: "YTD", fn: () => { onPreset(`${today.getFullYear()}-01-01`, todayStr); } },
  ];

  const formatDisplay = (iso: string) => {
    const d = fromISO(iso);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {/* Presets */}
      <div style={{ display: "flex", gap: 3, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: 3 }}>
        {presets.map(p => {
          const days = daysBetween(fromISO(startDate), fromISO(endDate));
          const isActive = (p.label === "TODAY" && startDate === endDate && endDate === todayStr) ||
            (p.label === "7D" && days >= 6 && days <= 8 && endDate === todayStr) ||
            (p.label === "30D" && days >= 29 && days <= 31 && endDate === todayStr) ||
            (p.label === "90D" && days >= 89 && days <= 91 && endDate === todayStr) ||
            (p.label === "YTD" && startDate === `${today.getFullYear()}-01-01` && endDate === todayStr);
          return (
            <button key={p.label} onClick={p.fn} style={{
              background: isActive ? "rgba(47,128,255,0.25)" : "transparent",
              border: "none", color: isActive ? "#fff" : "#6B7186",
              padding: "5px 10px", borderRadius: 4, cursor: "pointer",
              fontSize: 10, fontFamily: "'Orbitron', monospace", letterSpacing: 1,
            }}>{p.label}</button>
          );
        })}
      </div>

      {/* Custom date pickers */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowStart(!showStart); setShowEnd(false); }} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#C8CCD4", padding: "5px 12px", borderRadius: 4, cursor: "pointer",
            fontSize: 11, fontFamily: "'Inter', sans-serif",
          }}>{formatDisplay(startDate)}</button>
          {showStart && <MiniCalendar value={startDate} onChange={(v) => { onStartChange(v); setShowStart(false); }} onClose={() => setShowStart(false)} />}
        </div>
        <span style={{ color: "#6B7186", fontSize: 11 }}>→</span>
        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowEnd(!showEnd); setShowStart(false); }} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#C8CCD4", padding: "5px 12px", borderRadius: 4, cursor: "pointer",
            fontSize: 11, fontFamily: "'Inter', sans-serif",
          }}>{formatDisplay(endDate)}</button>
          {showEnd && <MiniCalendar value={endDate} onChange={(v) => { onEndChange(v); setShowEnd(false); }} onClose={() => setShowEnd(false)} />}
        </div>
      </div>
    </div>
  );
}

export default function CEODashboard() {
  const today = new Date();
  const thirtyAgo = new Date(today); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
  const [view, setView] = useState("dashboard");
  const [startDate, setStartDate] = useState(toISO(thirtyAgo));
  const [endDate, setEndDate] = useState(toISO(today));
  const [showEngine, setShowEngine] = useState(false);
  const d = useMemo(() => generateData(fromISO(startDate), fromISO(endDate)), [startDate, endDate]);

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", fontFamily: "'Inter', system-ui, sans-serif", color: "#F5F7FA" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg, #2F80FF, #7B61FF, #FF4EDB, #7B61FF, #2F80FF)" }} />

      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #111624, #0B0F19)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px 16px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 4, fontFamily: "'Orbitron', monospace",
                background: "linear-gradient(90deg, #C9A84C, #E6C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {BRAND.eyebrow} · {BRAND.subtitle}
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0", color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>CEO Dashboard</h1>
            </div>
            <DateRangePicker
              startDate={startDate} endDate={endDate}
              onStartChange={setStartDate} onEndChange={setEndDate}
              onPreset={(s, e) => { setStartDate(s); setEndDate(e); }}
            />
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
            {[{ key: "dashboard", label: "DASHBOARD" }, { key: "promote", label: "PROMOTE" }, { key: "profit", label: "PROFIT" }, { key: "produce", label: "PRODUCE" }, { key: "schedule", label: "24HR" }].map(v => (
              <button key={v.key} onClick={() => setView(v.key)} style={{
                background: view === v.key ? "linear-gradient(135deg, rgba(47,128,255,0.2), rgba(123,97,255,0.2))" : "transparent",
                border: `1px solid ${view === v.key ? "rgba(47,128,255,0.4)" : "transparent"}`,
                color: view === v.key ? "#fff" : "#6B7186",
                padding: "6px 14px", borderRadius: 5, cursor: "pointer",
                fontSize: 10, fontFamily: "'Orbitron', monospace", letterSpacing: 1,
              }}>{v.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 48px" }}>

        {/* ========= DASHBOARD ========= */}
        {view === "dashboard" && (
          <div>
            {d.alerts.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {d.alerts.map((a, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", marginBottom: 6, borderRadius: 8,
                    background: a.type === "red" ? "rgba(239,68,68,0.08)" : a.type === "yellow" ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)",
                    border: `1px solid ${a.type === "red" ? "rgba(239,68,68,0.2)" : a.type === "yellow" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}`,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: a.type === "red" ? "#EF4444" : a.type === "yellow" ? "#F59E0B" : "#10B981" }} />
                    <span style={{ fontSize: 12, color: "#C8CCD4", flex: 1 }}>{a.message}</span>
                    <span style={{ fontSize: 10, color: "#6B7186", fontFamily: "'Orbitron', monospace" }}>{a.area}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 10, fontFamily: "'Orbitron', monospace", color: "#FF4EDB" }}>THE MONEY</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              <KPICard label="TOTAL REVENUE" value={fmt(d.revenue.current)} trend={<Trend current={d.revenue.current} previous={d.revenue.previous} />} subValue={`vs ${fmt(d.revenue.previous)} prior period`} />
              <KPICard label="NEW SALES" value={d.newSales.count} subValue={`${fmt(d.newSales.value)} total value`} />
              <KPICard label="AVG ORDER VALUE" value={fmt(d.aov.current)} />
            </div>

            <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 10, fontFamily: "'Orbitron', monospace", color: "#2F80FF" }}>THE PIPELINE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              <KPICard label="TOTAL NEW LEADS" value={fmtN(d.leads.current)} trend={<Trend current={d.leads.current} previous={d.leads.previous} />} subValue={`vs ${fmtN(d.leads.previous)} prior period`} />
              <KPICard label="EVENT REGISTRATIONS" value={fmtN(d.eventRegs.total)} trend={<Trend current={d.eventRegs.total} previous={d.eventRegs.previous} />} subValue={`${fmtN(d.eventRegs.webinar)} webinar · ${fmtN(d.eventRegs.challenge)} challenge`} />
              <KPICard label="LEAD → SALE RATE" value={`${d.conversionRate.current}%`} trend={<Trend current={d.conversionRate.current} previous={d.conversionRate.previous} />} />
            </div>

            <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 10, fontFamily: "'Orbitron', monospace", color: "#7B61FF" }}>THE HEALTH</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "18px 22px", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
                <div style={{ fontSize: 10, color: "#8A8F98", fontFamily: "'Orbitron', monospace", letterSpacing: 1, marginBottom: 10 }}>ACTIVE CLIENTS</div>
                {Object.values(d.activeClients).map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 12, color: "#8A8F98" }}>{c.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {c.count}{'capacity' in c && c.capacity ? <span style={{ color: "#6B7186" }}> / {c.capacity}</span> : ""}
                    </span>
                  </div>
                ))}
              </div>
              <KPICard label="REFERRALS GENERATED" value={d.referrals.current} trend={<Trend current={d.referrals.current} previous={d.referrals.previous} />} subValue="From fulfilled clients" />
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "18px 22px", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
                <div style={{ fontSize: 10, color: "#8A8F98", fontFamily: "'Orbitron', monospace", letterSpacing: 1, marginBottom: 10 }}>AD SPEND & ROI</div>
                {[
                  { label: "Spend", value: fmt(d.adSpend.spend), color: "#EF4444" },
                  { label: "Revenue from Ads", value: fmt(d.adSpend.revenue), color: "#10B981" },
                  { label: "ROAS", value: `${d.adSpend.roas}x`, color: "#2F80FF" },
                ].map((r, ri) => (
                  <div key={ri} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 12, color: "#8A8F98" }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: r.color, fontFamily: "'Space Grotesk', sans-serif" }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
              <div onClick={() => setShowEngine(!showEngine)} style={{ padding: "14px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, letterSpacing: 3, fontFamily: "'Orbitron', monospace", color: "#6B7186" }}>HOW THE ENGINE WORKS</span>
                <span style={{ fontSize: 12, color: "#6B7186" }}>{showEngine ? "▾" : "▸"}</span>
              </div>
              {showEngine && (
                <div style={{ padding: "0 20px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap", padding: "16px 0" }}>
                    {[{ label: "PROMOTE", color: "#2F80FF" }, null, { label: "PROFIT", color: "#FF4EDB" }, null, { label: "PRODUCE", color: "#7B61FF" }].map((item, i) => item ? (
                      <span key={i} style={{ background: `${item.color}15`, border: `1px solid ${item.color}33`, padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 700, color: item.color, fontFamily: "'Space Grotesk', sans-serif" }}>{item.label}</span>
                    ) : <span key={i} style={{ color: "#333", fontSize: 16 }}>→</span>)}
                    <span style={{ color: "#333", fontSize: 16 }}>↩</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#8A8F98", lineHeight: 1.6, maxWidth: 700, margin: "0 auto" }}>
                    <strong style={{ color: "#2F80FF" }}>Promote</strong> (Prospect + Paid + Publish + Partnership) generates leads →
                    <strong style={{ color: "#FF4EDB" }}> Profit</strong> (Cart + Call + Crowd) closes them →
                    <strong style={{ color: "#7B61FF" }}> Produce</strong> delivers & delights → Referrals loop back to Promote
                  </div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 8, fontFamily: "'Orbitron', monospace" }}>PROJECT MANAGE supports all three</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========= PROMOTE ========= */}
        {view === "promote" && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 6, fontFamily: "'Orbitron', monospace", color: "#2F80FF" }}>PROMOTE</div>
            <div style={{ fontSize: 13, color: "#6B7186", marginBottom: 20 }}>Marketing — Goal is leads and event registrations · {d.rangeLabel}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              <KPICard small label="TOTAL LEADS" value={fmtN(d.leads.current)} trend={<Trend current={d.leads.current} previous={d.leads.previous} />} />
              <KPICard small label="EVENT REGS" value={fmtN(d.eventRegs.total)} trend={<Trend current={d.eventRegs.total} previous={d.eventRegs.previous} />} />
              <KPICard small label="WEBINAR REGS" value={fmtN(d.eventRegs.webinar)} />
              <KPICard small label="CHALLENGE REGS" value={fmtN(d.eventRegs.challenge)} />
            </div>
            {d.promote.channels.map((ch, ci) => (
              <div key={ci} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "20px 24px", marginBottom: 14, borderLeft: `4px solid ${ch.color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{ch.icon}</span>
                    <div style={{ fontSize: 16, fontWeight: 700, color: ch.color, fontFamily: "'Space Grotesk', sans-serif" }}>{ch.name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: "#6B7186", fontFamily: "'Orbitron', monospace" }}>LEADS</div><div style={{ fontSize: 20, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>{fmtN(ch.leads)}</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: "#6B7186", fontFamily: "'Orbitron', monospace" }}>EVENT REGS</div><div style={{ fontSize: 20, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>{fmtN(ch.eventRegs)}</div></div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                  {Object.entries(ch.metrics).map(([key, val], mi) => (
                    <div key={mi} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>{key.replace(/([A-Z])/g, ' $1')}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>
                        {typeof val === "number" && (key.includes("spend") || key.includes("commission")) ? fmt(val) : typeof val === "number" && (key.includes("cpl") || key.includes("cpc")) ? `$${val}` : typeof val === "number" && (key.includes("Rate") || key.includes("engagement")) ? `${val}%` : fmtN(val as number)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========= PROFIT ========= */}
        {view === "profit" && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 6, fontFamily: "'Orbitron', monospace", color: "#FF4EDB" }}>PROFIT</div>
            <div style={{ fontSize: 13, color: "#6B7186", marginBottom: 20 }}>Sales — Funnels (Cart + Crowd) & AI Sales Team (Call) · {d.rangeLabel}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              <KPICard small label="TOTAL REVENUE" value={fmt(d.revenue.current)} trend={<Trend current={d.revenue.current} previous={d.revenue.previous} />} />
              <KPICard small label="SALES CLOSED" value={d.newSales.count} />
              <KPICard small label="CONVERSION RATE" value={`${d.conversionRate.current}%`} trend={<Trend current={d.conversionRate.current} previous={d.conversionRate.previous} />} />
              <KPICard small label="AI SALES REVENUE" value={fmt(d.profit.aiSales.revenue)} />
            </div>
            <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 10, fontFamily: "'Orbitron', monospace", color: "#2F80FF" }}>FUNNELS</div>
            {d.profit.funnels.map((f, fi) => (
              <div key={fi} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "18px 22px", marginBottom: 10, borderLeft: `4px solid ${f.color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.2)", opacity: f.status === "PLANNED" ? 0.4 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{f.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>{f.name}</span>
                    <span style={{ fontSize: 10, color: "#6B7186", fontFamily: "'Orbitron', monospace" }}>{f.type}</span>
                    {f.status === "PLANNED" && <span style={{ fontSize: 10, color: "#6B7186", fontFamily: "'Orbitron', monospace", padding: "1px 6px", background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>PLANNED</span>}
                  </div>
                  <div style={{ display: "flex", gap: 20 }}>
                    {[{ label: "VISITORS", value: fmtN(f.visitors) }, { label: "CONVERSIONS", value: fmtN(f.conversions) }, { label: "CVR", value: `${f.rate}%`, color: f.rate > 10 ? "#10B981" : f.rate > 5 ? "#2F80FF" : "#EF4444" }, { label: "REVENUE", value: fmt(f.revenue), color: "#10B981" }].map((mm, mi) => (
                      <div key={mi} style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace" }}>{mm.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: mm.color || "#F5F7FA" }}>{mm.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 10, marginTop: 24, fontFamily: "'Orbitron', monospace", color: "#FF4EDB" }}>AI SALES TEAM</div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,78,219,0.15)", borderRadius: 10, padding: "20px 24px", borderLeft: "4px solid #FF4EDB", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr", gap: 10 }}>
                {[{ label: "CONVERSATIONS", value: fmtN(d.profit.aiSales.totalConversations) }, { label: "AVG RESPONSE", value: d.profit.aiSales.responseTime }, { label: "TICKET SALES", value: d.profit.aiSales.ticketsSold, sub: "to events" }, { label: "ASSISTS", value: d.profit.aiSales.assists, sub: "to closers" }, { label: "DIRECT SALES", value: d.profit.aiSales.directSales, sub: "closed by AI" }, { label: "REVENUE", value: fmt(d.profit.aiSales.revenue) }].map((mm, mi) => (
                  <div key={mi} style={{ background: "rgba(255,78,219,0.05)", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(255,78,219,0.1)", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#8A8F98", fontFamily: "'Orbitron', monospace", letterSpacing: 0.5, marginBottom: 6 }}>{mm.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>{mm.value}</div>
                    {mm.sub && <div style={{ fontSize: 10, color: "#6B7186", marginTop: 2 }}>{mm.sub}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========= PRODUCE ========= */}
        {view === "produce" && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 6, fontFamily: "'Orbitron', monospace", color: "#7B61FF" }}>PRODUCE</div>
            <div style={{ fontSize: 13, color: "#6B7186", marginBottom: 20 }}>Delivery — Active clients, completion, satisfaction & referrals · {d.rangeLabel}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              <KPICard small label="TOTAL ACTIVE CLIENTS" value={Object.values(d.activeClients).reduce((a, c) => a + c.count, 0)} />
              <KPICard small label="REFERRALS GENERATED" value={d.produce.totalReferrals} trend={<Trend current={d.referrals.current} previous={d.referrals.previous} />} />
              <KPICard small label="REFERRAL → PROMOTE LOOP" value={`${Math.round(d.produce.totalReferrals / Math.max(1, d.leads.current) * 100)}%`} subValue="of leads from referrals" />
            </div>
            {d.produce.offers.map((o, oi) => (
              <div key={oi} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "20px 24px", marginBottom: 14, borderLeft: `4px solid ${o.color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 22 }}>{o.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>{o.name}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: o.capacity ? "1fr 1fr 1fr 1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 10 }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", marginBottom: 4 }}>ACTIVE</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>{o.active}{o.capacity ? <span style={{ color: "#6B7186" }}> / {o.capacity}</span> : ""}</div>
                  </div>
                  {o.capacity && (
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", marginBottom: 4 }}>CAPACITY</div>
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: o.active / o.capacity > 0.8 ? "#EF4444" : "#10B981" }}>{Math.round((1 - o.active / o.capacity) * 100)}% open</div>
                    </div>
                  )}
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", marginBottom: 4 }}>COMPLETED</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>{o.completed}</div>
                  </div>
                  {o.satisfaction && (
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", marginBottom: 4 }}>SATISFACTION</div>
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: o.satisfaction > 95 ? "#10B981" : o.satisfaction > 85 ? "#2F80FF" : "#F59E0B" }}>{o.satisfaction}%</div>
                    </div>
                  )}
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", marginBottom: 4 }}>REFERRALS</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#7B61FF", fontFamily: "'Space Grotesk', sans-serif" }}>{o.referrals}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========= 24HR SCHEDULE ========= */}
        {view === "schedule" && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 16, fontFamily: "'Orbitron', monospace", color: "#C9A84C" }}>24/7 TWELVE TRIBES SCHEDULE — THE NEHEMIAH PROTOCOL</div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
                {Object.entries(deptColors).map(([name, color]) => (
                  <span key={name} style={{ fontSize: 10, color, fontFamily: "'Orbitron', monospace", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />{name}
                  </span>
                ))}
              </div>
              {SCHEDULE.map((shift, si) => (
                <div key={si} style={{ marginBottom: si < 3 ? 22 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${shift.color}22` }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: shift.color, fontFamily: "'Space Grotesk', sans-serif" }}>{shift.shift}</span>
                    <span style={{ fontSize: 10, color: "#6B7186", fontFamily: "'Orbitron', monospace" }}>{shift.time}</span>
                  </div>
                  {shift.tasks.map((t, ti) => (
                    <div key={ti} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12, alignItems: "center" }}>
                      <span style={{ color: shift.color, fontFamily: "'Orbitron', monospace", minWidth: 42, fontSize: 10, fontWeight: 600 }}>{t.time}</span>
                      <span style={{ width: 7, height: 7, borderRadius: 2, flexShrink: 0, background: deptColors[t.dept] || "#6B7186" }} />
                      <span style={{ color: "#C8CCD4", flex: 1 }}>{t.task}</span>
                      <span style={{ color: deptColors[t.dept] || "#6B7186", fontSize: 9, fontFamily: "'Orbitron', monospace", minWidth: 56, textAlign: "right", fontWeight: 600 }}>{t.dept}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #2F80FF44, #7B61FF44, #FF4EDB44, transparent)", marginBottom: 16 }} />
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "#F5F7FA" }}>
            {BRAND.footer} <span style={{ color: "#C9A84C" }}>{BRAND.footerAccent}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
