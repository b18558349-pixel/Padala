import { env } from '@/server/config/env';

export type SseEmit = (event: string, data: unknown) => void;
export type SseHandler = (emit: SseEmit, signal: AbortSignal) => void | Promise<void>;

const DEFAULT_RETRY_MS = 5_000;

export function createSseResponse(handler: SseHandler): Response {
  const controller = new AbortController();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(streamController) {
      streamController.enqueue(encoder.encode(`:${Date.now()}\n\n`));
      streamController.enqueue(encoder.encode(`retry: ${DEFAULT_RETRY_MS}\n\n`));

      const heartbeat = setInterval(() => {
        if (controller.signal.aborted) return;
        try {
          streamController.enqueue(encoder.encode(`:ping\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, env.SSE_HEARTBEAT_MS);

      const cleanup = () => {
        clearInterval(heartbeat);
        try {
          streamController.close();
        } catch {
          /* already closed */
        }
      };
      controller.signal.addEventListener('abort', cleanup, { once: true });

      const emit: SseEmit = (event, data) => {
        if (controller.signal.aborted) return;
        const payload = typeof data === 'string' ? data : safeStringify(data);
        const frame = `event: ${event}\ndata: ${payload}\n\n`;
        try {
          streamController.enqueue(encoder.encode(frame));
        } catch {
          controller.abort();
        }
      };

      try {
        await handler(emit, controller.signal);
      } finally {
        controller.abort();
      }
    },
    cancel() {
      controller.abort();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
