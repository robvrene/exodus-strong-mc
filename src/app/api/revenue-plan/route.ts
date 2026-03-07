import { NextRequest, NextResponse } from "next/server";
import { execute, newId } from "@/lib/db";

// ---------------------------------------------------------------------------
// POST /api/revenue-plan — Save & lock the revenue plan, fire outbound webhook
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    demoId,
    revenueGoal,
    promoteProspect,
    promotePaid,
    promotePublish,
    promotePartnership,
    profitCart,
    profitCall,
    profitCrowd,
    profitAiSales,
    produceSelections,
  } = body as Record<string, string | number | object>;

  // Validate at least one PROFIT channel is "now"
  const profitNow = [profitCart, profitCall, profitCrowd, profitAiSales].some(
    (v) => v === "now"
  );
  if (!profitNow) {
    return NextResponse.json(
      { error: "At least one PROFIT channel must be set to 'Now'" },
      { status: 400 }
    );
  }

  if (!demoId) {
    return NextResponse.json(
      { error: "demoId is required" },
      { status: 400 }
    );
  }

  try {
    const planId = newId();
    await execute(
      `INSERT INTO revenue_plans (id, demo_id, revenue_goal, promote_prospect, promote_paid, promote_publish, promote_partnership, profit_cart, profit_call, profit_crowd, profit_ai_sales, produce_selections, locked_at)
       VALUES (:id, :demoId, :goal, :prospect, :paid, :publish, :partnership, :cart, :call, :crowd, :aiSales, :produce, CURRENT_TIMESTAMP)`,
      {
        id: planId,
        demoId: demoId as string,
        goal: (revenueGoal as number) ?? 0,
        prospect: (promoteProspect as string) ?? "skip",
        paid: (promotePaid as string) ?? "skip",
        publish: (promotePublish as string) ?? "skip",
        partnership: (promotePartnership as string) ?? "skip",
        cart: (profitCart as string) ?? "skip",
        call: (profitCall as string) ?? "skip",
        crowd: (profitCrowd as string) ?? "skip",
        aiSales: (profitAiSales as string) ?? "skip",
        produce: JSON.stringify(produceSelections ?? {}),
      }
    );

    // Update demo phase to planner-locked
    await execute(
      "UPDATE demos SET phase = 'wave1', revenue_goal = :goal WHERE id = :id",
      { goal: (revenueGoal as number) ?? 0, id: demoId as string }
    );

    // Fire outbound webhook to OpenClaw
    const openclawUrl = process.env.OPENCLAW_WEBHOOK_URL;
    if (openclawUrl) {
      const webhookPayload = {
        event: "revenue_plan_locked",
        demoId,
        revenueGoal,
        promote: {
          prospect: promoteProspect,
          paid: promotePaid,
          publish: promotePublish,
          partnership: promotePartnership,
        },
        profit: {
          cart: profitCart,
          call: profitCall,
          crowd: profitCrowd,
          aiSales: profitAiSales,
        },
        produce: produceSelections,
        timestamp: new Date().toISOString(),
      };

      try {
        const resp = await fetch(openclawUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });
        console.log(
          `[OPENCLAW] Webhook fired: ${resp.status} ${resp.statusText}`
        );
      } catch (err) {
        console.error("[OPENCLAW] Webhook failed:", err);
        // Don't block the response — log it and continue
      }
    } else {
      console.warn("[OPENCLAW] No OPENCLAW_WEBHOOK_URL configured — skipping outbound webhook");
    }

    return NextResponse.json({ success: true, planId, demoId });
  } catch (err) {
    console.error("[API /revenue-plan] Error:", err);
    return NextResponse.json(
      { error: "Failed to save revenue plan" },
      { status: 500 }
    );
  }
}
