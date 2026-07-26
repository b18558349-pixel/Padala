import { paymentEventBus } from '@/server/lib/eventBus';
import { createSseResponse } from '@/server/lib/sseStream';
import { getRecentPayments } from '@/server/service/payment.service';

/**
 * GET /api/payments-feed — SSE stream of real-time payment events
 */
export async function GET() {
  return createSseResponse(async (emit, signal) => {
    // Send recent history on connect
    try {
      const recent = await getRecentPayments(20);
      emit('history', recent);
    } catch {
      // non-fatal
    }

    // Subscribe to live events
    const unsubscribe = paymentEventBus.subscribe((event) => {
      emit('payment', event);
    });

    // Wait until client disconnects
    await new Promise<void>((resolve) => {
      signal.addEventListener('abort', () => {
        unsubscribe();
        resolve();
      });
    });
  });
}
