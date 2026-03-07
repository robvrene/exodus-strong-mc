import { broadcaster, type SSEEvent } from "@/lib/sse";

// ---------------------------------------------------------------------------
// GET /api/events/stream — Server-Sent Events for real-time dashboard updates
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`
        )
      );

      // Heartbeat every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `: heartbeat ${new Date().toISOString()}\n\n`
            )
          );
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Subscribe to broadcast events
      const unsubscribe = broadcaster.subscribe((event: SSEEvent) => {
        try {
          const lines: string[] = [];
          if (event.type) lines.push(`event: ${event.type}`);
          if (event.id) lines.push(`id: ${event.id}`);
          lines.push(`data: ${JSON.stringify(event.data)}`);
          lines.push(""); // trailing newline
          controller.enqueue(encoder.encode(lines.join("\n") + "\n"));
        } catch {
          // Client disconnected
          clearInterval(heartbeat);
          unsubscribe();
        }
      });

      // Cleanup on stream cancel
      const originalCancel = stream.cancel?.bind(stream);
      stream.cancel = (reason) => {
        clearInterval(heartbeat);
        unsubscribe();
        return originalCancel?.(reason) ?? Promise.resolve();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
