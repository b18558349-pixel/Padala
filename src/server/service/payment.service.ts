import { eq, desc } from 'drizzle-orm';
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

  const [payment] = await db
    .insert(payments)
    .values({
      senderUsername: input.senderUsername,
      senderAddress: input.senderAddress,
      recipientUsername: input.recipientUsername,
      recipientAddress: input.recipientAddress,
      amountMinor: input.amountMinor,
      memo: input.memo ?? null,
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
