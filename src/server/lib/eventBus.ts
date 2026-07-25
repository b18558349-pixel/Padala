type Listener<T> = (event: T) => void;

class EventBus<T> {
  private listeners = new Set<Listener<T>>();

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(event: T): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[eventBus] listener error', err);
      }
    }
  }
}

export type PaymentEvent = {
  id: string;
  sender: string;
  senderUsername: string;
  recipient: string;
  recipientUsername: string;
  amountMinor: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  isNewAccount: boolean;
};

const globalForBus = globalThis as unknown as {
  paymentEventBus: EventBus<PaymentEvent> | undefined;
};

export const paymentEventBus: EventBus<PaymentEvent> =
  globalForBus.paymentEventBus ?? new EventBus<PaymentEvent>();

if (process.env.NODE_ENV !== 'production') {
  globalForBus.paymentEventBus = paymentEventBus;
}
