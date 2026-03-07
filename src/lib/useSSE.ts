"use client";

import { useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// React hook for SSE connection with auto-reconnect
// ---------------------------------------------------------------------------

interface UseSSEOptions {
  onEvent: (eventType: string, data: unknown) => void;
  enabled?: boolean;
}

export function useSSE({ onEvent, enabled = true }: UseSSEOptions) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const reconnectAttempt = useRef(0);
  const maxReconnectDelay = 30000;

  const connect = useCallback(() => {
    if (!enabled) return;

    const es = new EventSource("/api/events/stream");

    es.addEventListener("connected", () => {
      console.log("[SSE] Connected");
      reconnectAttempt.current = 0;
    });

    es.addEventListener("phase_update", (e) => {
      try {
        onEventRef.current("phase_update", JSON.parse(e.data));
      } catch { /* malformed */ }
    });

    es.addEventListener("task_update", (e) => {
      try {
        onEventRef.current("task_update", JSON.parse(e.data));
      } catch { /* malformed */ }
    });

    es.addEventListener("bot_status", (e) => {
      try {
        onEventRef.current("bot_status", JSON.parse(e.data));
      } catch { /* malformed */ }
    });

    es.addEventListener("demo_complete", (e) => {
      try {
        onEventRef.current("demo_complete", JSON.parse(e.data));
      } catch { /* malformed */ }
    });

    es.onerror = () => {
      es.close();
      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttempt.current),
        maxReconnectDelay
      );
      reconnectAttempt.current++;
      console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempt.current})`);
      setTimeout(connect, delay);
    };

    return es;
  }, [enabled]);

  useEffect(() => {
    const es = connect();
    return () => {
      es?.close();
    };
  }, [connect]);
}
