import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { payments, type Payment, type NewPayment } from '@/server/db/schema';
import { AppError } from '@/server/lib/http';
import { minorFromString } from '@/server/lib/bigint';

export type CreatePaymentInput = {
  senderUsername: string;
  senderAddress: string;
  recipientUsername: string;
  recipientAddress: string;
  amountMinor: string;
  memo?: string;
  idempotencyKey?: string;
};

export type PaymentWithDisplay = Payment & {
  amountUsdc: string;
};

/**
 * Create a new pending payment record.
 */
export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  // Validate amount
  const amount = minorFromString(input.amountMinor);
  if (amount <= 0n) {
    throw new AppError('INVALID_INPUT', 'Amount must be greater than 0', 400);
  }

  if (input.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existing) {
      const sameRequest =
        existing.senderAddress === input.senderAddress &&
        existing.recipientAddress === input.recipientAddress &&
        existing.amountMinor === input.amountMinor &&
        existing.memo === (input.memo ?? null);
      if (!sameRequest) throw new AppError('CONFLICT', 'Idempotency-Key was reused for another payment', 409);
      return existing;
    }
  }

  const [payment] = await db
    .insert(payments)
    .values({
      senderUsername: input.senderUsername,
      senderAddress: input.senderAddress,
      recipientUsername: input.recipientUsername,
      recipientAddress: input.recipientAddress,
      amountMinor: input.amountMinor,
      memo: input.memo ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      status: 'pending',
      isNewAccount: false,
    })
    .returning();

  if (!payment) {
    throw new AppError('INTERNAL', 'Failed to create payment', 500);
  }
  return payment;
}

/**
 * Mark a payment as confirmed with a tx hash.
 */
export async function confirmPayment(
  id: string,
  txHash: string,
  isNewAccount = false,
): Promise<Payment> {
  const [updated] = await db
    .update(payments)
    .set({
      status: 'confirmed',
      txHash,
      isNewAccount,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, id))
    .returning();

  if (!updated) {
    throw new AppError('NOT_FOUND', 'Payment not found', 404);
  }
  return updated;
}

export async function attachPreparedPayment(
  id: string,
  unsignedXdr: string,
  unsignedTxDigest: string,
): Promise<Payment> {
  const [updated] = await db
    .update(payments)
    .set({ unsignedXdr, unsignedTxDigest, updatedAt: new Date() })
    .where(and(eq(payments.id, id), eq(payments.status, 'pending'), isNull(payments.unsignedXdr)))
    .returning();
  if (updated) return updated;
  const existing = await getPaymentById(id);
  if (existing.unsignedXdr === unsignedXdr && existing.unsignedTxDigest === unsignedTxDigest) {
    return existing;
  }
  throw new AppError('CONFLICT', 'Payment intent was prepared concurrently', 409);
}

export async function confirmPreparedPayment(id: string, txHash: string): Promise<Payment> {
  const existing = await getPaymentById(id);
  if (existing.status === 'confirmed' && existing.txHash === txHash) return existing;
  if (existing.status !== 'pending') {
    throw new AppError('CONFLICT', 'Payment is not pending', 409);
  }
  if (!existing.unsignedTxDigest) {
    throw new AppError('CONFLICT', 'Payment has not been prepared', 409);
  }
  const [updated] = await db
    .update(payments)
    .set({ status: 'confirmed', txHash, updatedAt: new Date() })
    .where(and(eq(payments.id, id), eq(payments.status, 'pending')))
    .returning();
  if (!updated) throw new AppError('CONFLICT', 'Payment changed while confirming', 409);
  return updated;
}

/**
 * Mark a payment as failed.
 */
export async function failPayment(id: string): Promise<Payment> {
  const [updated] = await db
    .update(payments)
    .set({
      status: 'failed',
      updatedAt: new Date(),
    })
    .where(eq(payments.id, id))
    .returning();

  if (!updated) {
    throw new AppError('NOT_FOUND', 'Payment not found', 404);
  }
  return updated;
}

/**
 * Get recent payments (last 50).
 */
export async function getRecentPayments(limit = 50): Promise<Payment[]> {
  return db
    .select()
    .from(payments)
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

/**
 * Get a single payment by ID.
 */
export async function getPaymentById(id: string): Promise<Payment> {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, id),
  });
  if (!payment) {
    throw new AppError('NOT_FOUND', 'Payment not found', 404);
  }
  return payment;
}
