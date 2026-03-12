import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import {
  buildAdImagePrompt,
  buildAdCreativePack,
  type AdImageRequest,
  type PromoteChannel,
  type ProduceType,
  type BrandColors,
  type GeneratedPrompt,
} from "@/lib/protocols/ad-image-playbook";
import { execute, newId } from "@/lib/db";
import { broadcaster } from "@/lib/sse";

// ---------------------------------------------------------------------------
// POST /api/generate-ad-image — Generate ad images via fal.ai
// ---------------------------------------------------------------------------
//
// Modes:
//   1. Single image — provide produceType + channel
//   2. Creative pack — provide produceTypes[] + channels[] for batch
//
// The endpoint:
//   - Builds a prompt from the playbook protocols
//   - Calls fal.ai to generate the image
//   - Stores the result as a task in the demo
//   - Broadcasts via SSE so the dashboard updates live
// ---------------------------------------------------------------------------

interface SingleImageBody {
  mode?: "single";
  businessName: string;
  demoId?: string;
  produceType: ProduceType;
  channel: PromoteChannel;
  businessDescription?: string;
  brandColors?: Partial<BrandColors>;
  customSubject?: string;
  adHeadline?: string;
}

interface CreativePackBody {
  mode: "pack";
  businessName: string;
  demoId?: string;
  produceTypes: ProduceType[];
  channels: PromoteChannel[];
  businessDescription?: string;
  brandColors?: Partial<BrandColors>;
  adHeadline?: string;
}

type RequestBody = SingleImageBody | CreativePackBody;

function validateBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.businessName !== "string" || !b.businessName) return false;

  if (b.mode === "pack") {
    if (!Array.isArray(b.produceTypes) || b.produceTypes.length === 0) return false;
    if (!Array.isArray(b.channels) || b.channels.length === 0) return false;
    return true;
  }

  // Single mode
  if (typeof b.produceType !== "string") return false;
  if (typeof b.channel !== "string") return false;
  return true;
}

const CHANNEL_LABELS: Record<PromoteChannel, string> = {
  paid: "Facebook/Instagram Ad",
  publish: "YouTube/Blog Thumbnail",
  prospect: "Email/LinkedIn Header",
  partnership: "Affiliate/JV Banner",
};

const PRODUCE_LABELS: Record<ProduceType, string> = {
  ship: "Product",
  serve: "Service",
  unlock: "Digital",
  shift: "Coaching",
};

async function generateImage(
  prompt: GeneratedPrompt
): Promise<{ imageUrl: string; seed: number }> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    throw new Error("FAL_API_KEY not configured");
  }

  fal.config({ credentials: apiKey });

  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt: prompt.prompt,
      image_size: {
        width: prompt.width,
        height: prompt.height,
      },
      num_images: 1,
      enable_safety_checker: true,
    },
  });

  const data = result.data as { images?: Array<{ url: string }>; seed?: number };
  if (!data.images || data.images.length === 0) {
    throw new Error("No image returned from fal.ai");
  }

  return {
    imageUrl: data.images[0].url,
    seed: data.seed ?? 0,
  };
}

async function recordTaskAndBroadcast(
  demoId: string,
  businessName: string,
  channel: PromoteChannel,
  produceType: ProduceType,
  imageUrl: string,
  adHeadline?: string
) {
  const taskId = newId();
  const taskName = `${CHANNEL_LABELS[channel]} — ${PRODUCE_LABELS[produceType]} Creative`;

  await execute(
    `INSERT INTO tasks (id, demo_id, task_name, wave, status, output_type, destination, output_url, duration_seconds)
     VALUES (:id, :demoId, :name, 1, 'complete', 'media', 'media-hub', :outputUrl, 0)`,
    {
      id: taskId,
      demoId,
      name: taskName,
      outputUrl: imageUrl,
    }
  );

  // Log event
  const eventId = newId();
  await execute(
    `INSERT INTO events (id, demo_id, event_type, signal, payload)
     VALUES (:id, :demoId, 'task_update', :signal, :payload)`,
    {
      id: eventId,
      demoId,
      signal: `[AD-IMAGE] Generated ${taskName}`,
      payload: JSON.stringify({
        taskName,
        channel,
        produceType,
        imageUrl,
        adHeadline,
      }),
    }
  );

  // Broadcast via SSE
  broadcaster.broadcast({
    type: "task_update",
    data: {
      demoId,
      businessName,
      taskName,
      taskId,
      status: "complete",
      outputType: "media",
      destination: "media-hub",
      outputUrl: imageUrl,
      wave: 1,
    },
    id: eventId,
  });

  return { taskId, taskName };
}

export async function POST(req: NextRequest) {
  // Auth check
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Check FAL key
  if (!process.env.FAL_API_KEY) {
    return NextResponse.json(
      { error: "FAL_API_KEY not configured — add it to .env.local" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!validateBody(body)) {
    return NextResponse.json(
      {
        error: "Missing required fields. Single mode: businessName, produceType, channel. Pack mode: businessName, produceTypes[], channels[]",
      },
      { status: 400 }
    );
  }

  try {
    // Resolve demoId
    let demoId = body.demoId;
    if (!demoId) {
      const result = await execute(
        "SELECT id FROM demos WHERE business_name = :name AND status = 'active' ORDER BY created_at DESC LIMIT 1",
        { name: body.businessName }
      );
      if (result.rows.length > 0) {
        demoId = result.rows[0].id as string;
      } else {
        // Create a demo record if none exists
        demoId = newId();
        await execute(
          `INSERT INTO demos (id, business_name, phase) VALUES (:id, :name, 'wave1')`,
          { id: demoId, name: body.businessName }
        );
      }
    }

    if (body.mode === "pack") {
      // Creative pack — generate images for all channel+produce combos
      const prompts = buildAdCreativePack(
        body.businessName,
        body.produceTypes,
        body.channels,
        {
          businessDescription: body.businessDescription,
          brandColors: body.brandColors,
          adHeadline: body.adHeadline,
        }
      );

      const results = [];
      for (const prompt of prompts) {
        const { imageUrl } = await generateImage(prompt);
        const task = await recordTaskAndBroadcast(
          demoId,
          body.businessName,
          prompt.channel,
          prompt.produceType,
          imageUrl,
          body.adHeadline
        );
        results.push({
          ...task,
          channel: prompt.channel,
          produceType: prompt.produceType,
          imageUrl,
        });
      }

      return NextResponse.json({
        success: true,
        demoId,
        mode: "pack",
        images: results,
      });
    } else {
      // Single image
      const prompt = buildAdImagePrompt({
        businessName: body.businessName,
        businessDescription: body.businessDescription,
        produceType: body.produceType,
        channel: body.channel,
        brandColors: body.brandColors,
        customSubject: body.customSubject,
        adHeadline: body.adHeadline,
      });

      const { imageUrl } = await generateImage(prompt);
      const task = await recordTaskAndBroadcast(
        demoId,
        body.businessName,
        body.channel,
        body.produceType,
        imageUrl,
        body.adHeadline
      );

      return NextResponse.json({
        success: true,
        demoId,
        ...task,
        channel: body.channel,
        produceType: body.produceType,
        imageUrl,
        promptUsed: prompt.prompt,
      });
    }
  } catch (err) {
    console.error("[AD-IMAGE] Generation error:", err);
    const message = err instanceof Error ? err.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — endpoint info
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/generate-ad-image",
    method: "POST",
    modes: {
      single: {
        required: ["businessName", "produceType", "channel"],
        optional: ["demoId", "businessDescription", "brandColors", "customSubject", "adHeadline"],
        produceTypes: ["ship", "serve", "unlock", "shift"],
        channels: ["paid", "publish", "prospect", "partnership"],
      },
      pack: {
        required: ["mode: 'pack'", "businessName", "produceTypes[]", "channels[]"],
        optional: ["demoId", "businessDescription", "brandColors", "adHeadline"],
      },
    },
    falConfigured: !!process.env.FAL_API_KEY,
  });
}
