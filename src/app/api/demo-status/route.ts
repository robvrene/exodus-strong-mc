import { NextRequest, NextResponse } from "next/server";
import { execute, newId } from "@/lib/db";
import { broadcaster } from "@/lib/sse";

// ---------------------------------------------------------------------------
// POST /api/demo-status — Incoming webhook from OpenClaw AI agent
// ---------------------------------------------------------------------------

interface WebhookPayload {
  businessName: string;
  timestamp?: string;
  event: "phase_update" | "task_update" | "bot_status" | "demo_complete";
  data: {
    phase?: string;
    taskName?: string;
    taskId?: string;
    status?: "todo" | "in_progress" | "complete" | "blocked" | "skipped" | "in_review";
    wave?: number;
    outputType?: "funnel" | "content" | "media" | "strategy" | "ghl-workflow";
    destination?: "project-manager" | "media-hub";
    outputPath?: string;
    outputUrl?: string;
    duration?: number;
    error?: string | null;
    volunteerName?: string;
    revenueGoal?: number;
    signal?: string;
  };
}

function validatePayload(body: unknown): body is WebhookPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.businessName !== "string" || !b.businessName) return false;
  if (
    typeof b.event !== "string" ||
    !["phase_update", "task_update", "bot_status", "demo_complete"].includes(
      b.event
    )
  )
    return false;
  if (!b.data || typeof b.data !== "object") return false;
  return true;
}

export async function POST(req: NextRequest) {
  // --- Auth ---
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.warn("[WEBHOOK] No WEBHOOK_SECRET set in production!");
  }

  // --- Parse & validate ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!validatePayload(body)) {
    return NextResponse.json(
      { error: "Malformed payload — requires businessName, event, data" },
      { status: 400 }
    );
  }

  const payload = body;
  const { businessName, event, data } = payload;

  console.log(`[WEBHOOK] ${event} — ${businessName}`, JSON.stringify(data));

  try {
    // --- Upsert demo record ---
    let demoResult = await execute(
      "SELECT id, phase FROM demos WHERE business_name = :name AND status = 'active' ORDER BY created_at DESC LIMIT 1",
      { name: businessName }
    );

    let demoId: string;

    if (demoResult.rows.length === 0) {
      demoId = newId();
      await execute(
        `INSERT INTO demos (id, business_name, volunteer_name, phase, revenue_goal)
         VALUES (:id, :name, :volunteer, :phase, :goal)`,
        {
          id: demoId,
          name: businessName,
          volunteer: data.volunteerName ?? null,
          phase: data.phase ?? "startup",
          goal: data.revenueGoal ?? null,
        }
      );
      console.log(`[WEBHOOK] Created demo ${demoId} for "${businessName}"`);
    } else {
      demoId = demoResult.rows[0].id as string;
    }

    // --- Handle event types ---
    switch (event) {
      case "phase_update": {
        if (data.phase) {
          await execute(
            "UPDATE demos SET phase = :phase WHERE id = :id",
            { phase: data.phase, id: demoId }
          );
        }
        if (data.volunteerName) {
          await execute(
            "UPDATE demos SET volunteer_name = :name WHERE id = :id",
            { name: data.volunteerName, id: demoId }
          );
        }
        if (data.revenueGoal) {
          await execute(
            "UPDATE demos SET revenue_goal = :goal WHERE id = :id",
            { goal: data.revenueGoal, id: demoId }
          );
        }
        break;
      }

      case "task_update": {
        if (!data.taskName) {
          return NextResponse.json(
            { error: "task_update requires data.taskName" },
            { status: 400 }
          );
        }
        const taskId = data.taskId || newId();
        // Upsert task by taskId or by task_name+demo_id
        const existingTask = await execute(
          "SELECT id FROM tasks WHERE (id = :taskId OR (demo_id = :demoId AND task_name = :name)) LIMIT 1",
          { taskId, demoId, name: data.taskName }
        );

        if (existingTask.rows.length > 0) {
          const existingId = existingTask.rows[0].id as string;
          await execute(
            `UPDATE tasks SET
              status = COALESCE(:status, status),
              wave = COALESCE(:wave, wave),
              output_type = COALESCE(:outputType, output_type),
              destination = COALESCE(:destination, destination),
              output_path = COALESCE(:outputPath, output_path),
              output_url = COALESCE(:outputUrl, output_url),
              duration_seconds = COALESCE(:duration, duration_seconds),
              error_message = :error,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = :id`,
            {
              status: data.status ?? null,
              wave: data.wave ?? null,
              outputType: data.outputType ?? null,
              destination: data.destination ?? null,
              outputPath: data.outputPath ?? null,
              outputUrl: data.outputUrl ?? null,
              duration: data.duration ?? null,
              error: data.error ?? null,
              id: existingId,
            }
          );
        } else {
          await execute(
            `INSERT INTO tasks (id, demo_id, task_name, wave, status, output_type, destination, output_path, output_url, duration_seconds, error_message)
             VALUES (:id, :demoId, :name, :wave, :status, :outputType, :destination, :outputPath, :outputUrl, :duration, :error)`,
            {
              id: taskId,
              demoId,
              name: data.taskName,
              wave: data.wave ?? null,
              status: data.status ?? "todo",
              outputType: data.outputType ?? null,
              destination: data.destination ?? "project-manager",
              outputPath: data.outputPath ?? null,
              outputUrl: data.outputUrl ?? null,
              duration: data.duration ?? null,
              error: data.error ?? null,
            }
          );
        }
        break;
      }

      case "bot_status": {
        // Just log the event — no specific table update needed
        break;
      }

      case "demo_complete": {
        await execute(
          `UPDATE demos SET
            status = 'complete',
            phase = 'complete',
            completed_at = CURRENT_TIMESTAMP
          WHERE id = :id`,
          { id: demoId }
        );
        break;
      }
    }

    // --- Log raw event ---
    const eventId = newId();
    await execute(
      `INSERT INTO events (id, demo_id, event_type, signal, payload)
       VALUES (:id, :demoId, :eventType, :signal, :payload)`,
      {
        id: eventId,
        demoId,
        eventType: event,
        signal: data.signal ?? null,
        payload: JSON.stringify(payload),
      }
    );

    // --- Broadcast via SSE ---
    broadcaster.broadcast({
      type: event,
      data: { demoId, ...data, businessName },
      id: eventId,
    });

    return NextResponse.json({ success: true, demoId });
  } catch (err) {
    console.error("[WEBHOOK] Error processing:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// --- GET for health check / verification ---
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/demo-status",
    method: "POST",
    accepts: "WebhookPayload",
  });
}
