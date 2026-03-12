"use client";

import { useState, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// /dev/simulate — Rehearsal control panel for testing the full demo pipeline
// ---------------------------------------------------------------------------

const BUSINESS_NAME = "Test Business Co.";

interface LogEntry {
  time: string;
  message: string;
  status: "ok" | "error" | "pending";
}

// Simulate payloads for each demo phase
const WAVE_1_TASKS = [
  { taskName: "1-Page Sales Funnel", outputType: "funnel", destination: "project-manager", wave: 1 },
  { taskName: "Email Welcome Sequence (5 emails)", outputType: "content", destination: "media-hub", wave: 1 },
  { taskName: "Facebook Ad Creative Pack", outputType: "media", destination: "media-hub", wave: 1 },
  { taskName: "Lead Magnet Landing Page", outputType: "funnel", destination: "project-manager", wave: 1 },
];

const WAVE_2_TASKS = [
  { taskName: "Webinar Registration Funnel", outputType: "funnel", destination: "project-manager", wave: 2 },
  { taskName: "YouTube Content Calendar (30 days)", outputType: "strategy", destination: "media-hub", wave: 2 },
  { taskName: "Book-a-Call Application Page", outputType: "funnel", destination: "project-manager", wave: 2 },
];

const WAVE_3_TASKS = [
  { taskName: "GHL Automation: Lead Nurture Workflow", outputType: "ghl-workflow", destination: "project-manager", wave: 3 },
  { taskName: "Instagram Content Batch (7 posts)", outputType: "content", destination: "media-hub", wave: 3 },
];

async function fireWebhook(
  payload: Record<string, unknown>,
  addLog: (msg: string, status: "ok" | "error") => void
) {
  try {
    const resp = await fetch("/api/demo-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (resp.ok) {
      addLog(`${payload.event}: ${JSON.stringify((payload as Record<string, Record<string, unknown>>).data?.taskName || (payload as Record<string, Record<string, unknown>>).data?.phase || "OK")} → demoId: ${data.demoId}`, "ok");
    } else {
      addLog(`${payload.event}: ${data.error || resp.statusText}`, "error");
    }
  } catch (err) {
    addLog(`${payload.event}: ${err instanceof Error ? err.message : "Network error"}`, "error");
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function SimulatePage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const abortRef = useRef(false);

  const addLog = useCallback((message: string, status: "ok" | "error" | "pending") => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), message, status },
      ...prev,
    ]);
  }, []);

  const fire = useCallback(
    (event: string, data: Record<string, unknown>) =>
      fireWebhook({ businessName: BUSINESS_NAME, event, data }, addLog),
    [addLog]
  );

  const startNewDemo = () => fire("phase_update", { phase: "startup", volunteerName: "Demo Volunteer", revenueGoal: 100000 });
  const fireVision = () => fire("phase_update", { phase: "vision", signal: "[MASTER: VISION INTAKE COMPLETE]" });
  const fireBrand = () => fire("phase_update", { phase: "brand", signal: "[MASTER: BRAND COMPLETE]" });
  const fireCharacter = () => fire("phase_update", { phase: "character", signal: "[MASTER: CHARACTER APPROVED]" });
  const firePlanLocked = () => fire("phase_update", { phase: "planner", signal: "[MASTER: REVENUE PLAN LOCKED]" });

  const spawnWaveTasks = async (tasks: typeof WAVE_1_TASKS, waveNum: number) => {
    await fire("phase_update", { phase: `wave${waveNum}`, signal: `[MASTER: WAVE ${waveNum} SPAWNING]` });
    for (const task of tasks) {
      if (abortRef.current) return;
      await fire("task_update", { ...task, status: "todo" });
      await sleep(300);
    }
  };

  const completeWaveTasks = async (tasks: typeof WAVE_1_TASKS) => {
    for (const task of tasks) {
      if (abortRef.current) return;
      await fire("task_update", { taskName: task.taskName, status: "in_progress" });
      await sleep(1500 + Math.random() * 2000);
      if (abortRef.current) return;
      await fire("task_update", {
        taskName: task.taskName,
        status: "complete",
        duration: Math.floor(20 + Math.random() * 60),
        outputUrl: `https://example.com/${task.taskName.toLowerCase().replace(/\s+/g, "-")}`,
      });
      await sleep(500);
    }
  };

  const fireRandomBlocked = async () => {
    await fire("task_update", {
      taskName: "GHL Automation: Lead Nurture Workflow",
      status: "blocked",
      error: "GHL API rate limit exceeded — retry in 60s. Contact Joseph if this persists.",
      wave: 3,
      outputType: "ghl-workflow",
      destination: "project-manager",
    });
  };

  const runFullDemo = async () => {
    setRunning(true);
    abortRef.current = false;
    addLog("--- FULL REHEARSAL STARTING ---", "pending");

    // Phase 0: Start
    await startNewDemo();
    await sleep(1000);

    // Phase 1: Vision
    await fireVision();
    await sleep(1500);

    // Phase 2: Brand
    await fireBrand();
    await sleep(1500);

    // Phase 3: Character
    await fireCharacter();
    await sleep(1500);

    // Phase 4: Plan locked
    await firePlanLocked();
    await sleep(1000);

    if (abortRef.current) { setRunning(false); return; }

    // Wave 1
    await spawnWaveTasks(WAVE_1_TASKS, 1);
    await sleep(500);
    await completeWaveTasks(WAVE_1_TASKS);
    await sleep(1000);

    if (abortRef.current) { setRunning(false); return; }

    // Wave 2
    await spawnWaveTasks(WAVE_2_TASKS, 2);
    await sleep(500);
    await completeWaveTasks(WAVE_2_TASKS);
    await sleep(1000);

    if (abortRef.current) { setRunning(false); return; }

    // Wave 3
    await spawnWaveTasks(WAVE_3_TASKS, 3);
    await sleep(500);

    // Fire one blocked task
    await fireRandomBlocked();
    await sleep(2000);

    // Complete the non-blocked wave 3 tasks
    await fire("task_update", {
      taskName: "Instagram Content Batch (7 posts)",
      status: "in_progress",
    });
    await sleep(2000);
    await fire("task_update", {
      taskName: "Instagram Content Batch (7 posts)",
      status: "complete",
      duration: 34,
    });
    await sleep(1000);

    // Complete demo
    await fire("demo_complete", { signal: "[MASTER: DEMO COMPLETE]" });

    addLog("--- FULL REHEARSAL COMPLETE ---", "ok");
    setRunning(false);
  };

  const stopDemo = () => {
    abortRef.current = true;
    addLog("--- REHEARSAL ABORTED ---", "error");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", fontFamily: "'Inter', system-ui, sans-serif", color: "#F5F7FA", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 16 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, fontFamily: "'Orbitron', monospace", color: "#F59E0B", marginBottom: 4 }}>
            DEV TOOLS — REHEARSAL MODE
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "#F5F7FA", margin: 0 }}>
            Demo Simulator
          </h1>
          <p style={{ fontSize: 12, color: "#6B7186", marginTop: 4 }}>
            Fire real webhooks to test the full pipeline. Open the dashboard in another tab to watch it update live.
          </p>
        </div>

        {/* Control buttons - 2 column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          <SimButton label="Start New Demo" sub={`"${BUSINESS_NAME}"`} onClick={startNewDemo} color="#10B981" disabled={running} />
          <SimButton label="Vision Complete" sub="Phase 1" onClick={fireVision} color="#2F80FF" disabled={running} />
          <SimButton label="Brand Complete" sub="Phase 2" onClick={fireBrand} color="#2F80FF" disabled={running} />
          <SimButton label="Character Complete" sub="Phase 3" onClick={fireCharacter} color="#2F80FF" disabled={running} />
          <SimButton label="Revenue Plan Locked" sub="Phase 4" onClick={firePlanLocked} color="#FF4EDB" disabled={running} />
          <SimButton label="Wave 1 — Spawn 4 bots" sub="Create tasks" onClick={() => spawnWaveTasks(WAVE_1_TASKS, 1)} color="#2F80FF" disabled={running} />
          <SimButton label="Wave 1 — Complete all" sub="Process tasks" onClick={() => completeWaveTasks(WAVE_1_TASKS)} color="#10B981" disabled={running} />
          <SimButton label="Wave 2 — Spawn 3 bots" sub="Create tasks" onClick={() => spawnWaveTasks(WAVE_2_TASKS, 2)} color="#7B61FF" disabled={running} />
          <SimButton label="Wave 2 — Complete all" sub="Process tasks" onClick={() => completeWaveTasks(WAVE_2_TASKS)} color="#10B981" disabled={running} />
          <SimButton label="Wave 3 — Spawn 2 bots" sub="Create tasks" onClick={() => spawnWaveTasks(WAVE_3_TASKS, 3)} color="#FF4EDB" disabled={running} />
          <SimButton label="Wave 3 — Complete all" sub="Process tasks" onClick={() => { completeWaveTasks(WAVE_3_TASKS); }} color="#10B981" disabled={running} />
          <SimButton label="Random Task BLOCKED" sub="Simulate failure" onClick={fireRandomBlocked} color="#EF4444" disabled={running} />
        </div>

        {/* Full run button */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <button
            onClick={running ? stopDemo : runFullDemo}
            style={{
              flex: 1, padding: "16px 24px", borderRadius: 10, cursor: "pointer",
              fontSize: 14, fontWeight: 700, fontFamily: "'Orbitron', monospace", letterSpacing: 2,
              background: running
                ? "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.1))"
                : "linear-gradient(135deg, rgba(47,128,255,0.15), rgba(123,97,255,0.15), rgba(255,78,219,0.15))",
              border: `2px solid ${running ? "#EF4444" : "#7B61FF"}`,
              color: running ? "#EF4444" : "#7B61FF",
            }}
          >
            {running ? "⏹ ABORT REHEARSAL" : "▶ FULL DEMO RUN — 60s SIMULATION"}
          </button>
        </div>

        {/* Event log */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10, padding: "16px 18px", maxHeight: 400, overflowY: "auto",
        }}>
          <div style={{ fontSize: 9, letterSpacing: 2, fontFamily: "'Orbitron', monospace", color: "#6B7186", marginBottom: 10 }}>
            EVENT LOG
          </div>
          {logs.length === 0 ? (
            <div style={{ fontSize: 12, color: "#555", textAlign: "center", padding: 20 }}>
              No events fired yet. Click a button above.
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: 12 }}>
                <span style={{ color: "#6B7186", fontFamily: "monospace", minWidth: 70, flexShrink: 0 }}>{log.time}</span>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                  background: log.status === "ok" ? "#10B981" : log.status === "error" ? "#EF4444" : "#F59E0B",
                }} />
                <span style={{ color: log.status === "error" ? "#EF4444" : "#C8CCD4", fontFamily: "monospace", wordBreak: "break-all" }}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SimButton({
  label, sub, onClick, color, disabled,
}: {
  label: string; sub: string; onClick: () => void; color: string; disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "12px 16px", borderRadius: 8, cursor: disabled ? "wait" : "pointer",
        background: `${color}10`, border: `1px solid ${color}33`,
        textAlign: "left", opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s ease",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "'Space Grotesk', sans-serif" }}>
        {label}
      </div>
      <div style={{ fontSize: 10, color: "#6B7186", marginTop: 2 }}>{sub}</div>
    </button>
  );
}
