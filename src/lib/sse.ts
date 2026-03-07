// ---------------------------------------------------------------------------
// In-process Server-Sent Events broadcaster
// ---------------------------------------------------------------------------

export interface SSEEvent {
  type: string;
  data: unknown;
  id?: string;
}

type Listener = (event: SSEEvent) => void;

class SSEBroadcaster {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  broadcast(event: SSEEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // swallow — dead listeners get cleaned up on disconnect
      }
    }
  }

  get connectionCount(): number {
    return this.listeners.size;
  }
}

// Singleton — shared across all requests within the same process
export const broadcaster = new SSEBroadcaster();
