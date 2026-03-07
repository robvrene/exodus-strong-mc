import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/demo — Fetch the active demo and its tasks
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const demoId = req.nextUrl.searchParams.get("id");

  try {
    let demoRow;
    if (demoId) {
      demoRow = await execute(
        "SELECT * FROM demos WHERE id = :id LIMIT 1",
        { id: demoId }
      );
    } else {
      // Get most recent active demo
      demoRow = await execute(
        "SELECT * FROM demos WHERE status = 'active' ORDER BY created_at DESC LIMIT 1"
      );
    }

    if (demoRow.rows.length === 0) {
      return NextResponse.json({ demo: null, tasks: [], events: [] });
    }

    const demo = demoRow.rows[0];
    const id = demo.id as string;

    const [tasksResult, eventsResult, planResult] = await Promise.all([
      execute(
        "SELECT * FROM tasks WHERE demo_id = :demoId ORDER BY wave ASC, created_at ASC",
        { demoId: id }
      ),
      execute(
        "SELECT * FROM events WHERE demo_id = :demoId ORDER BY created_at DESC LIMIT 50",
        { demoId: id }
      ),
      execute(
        "SELECT * FROM revenue_plans WHERE demo_id = :demoId ORDER BY created_at DESC LIMIT 1",
        { demoId: id }
      ),
    ]);

    return NextResponse.json({
      demo,
      tasks: tasksResult.rows,
      events: eventsResult.rows,
      revenuePlan: planResult.rows[0] ?? null,
    });
  } catch (err) {
    console.error("[API /demo] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch demo data" },
      { status: 500 }
    );
  }
}
