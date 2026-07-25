import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, created, fromError, fail } from '@/server/lib/http';
import {
  createPayment,
  confirmPayment,
  failPayment,
  getRecentPayments,
} from '@/server/service/payment.service';
import { resolveFederation } from '@/server/service/federation.service';
import { demoSimulatePayment } from '@/server/lib/stellar';
import { humanToMinor } from '@/server/lib/bigint';
import { paymentEventBus, type PaymentEvent } from '@/server/lib/eventBus';

const sendSchema = z.object({
  senderUsername: z.string().min(1).max(64),
  senderAddress: z.string().min(56).max(56),
  recipientFederation: z.string().min(3), // e.g. "alice*padala.ph"
  amount: z.string().min(1), // human amount like "5.50"
  memo: z.string().max(28).optional(),
});

/**
 * GET /api/payments — list recent payments
 */
export async function GET() {
  try {
    const list = await getRecentPayments(50);
    return ok(list);
  } catch (err) {
    return fromError(err);
  }
}

/**
 * POST /api/payments — send a payment via SEP-2 federation
 */
export async function POST(req: NextRequest) {
  try {
    if (process.env.DEMO_MODE !== 'true' || process.env.STELLAR_NETWORK === 'public') {
      return fail('CONFLICT', 'Payment route requires an external signer and Horizon proof outside demo mode', 409);
    }
    const body = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return fail('INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid input', 400);
    }

    const { senderUsername, senderAddress, recipientFederation, amount, memo } = parsed.data;

    // Step 1: SEP-2 resolve
    const recipient = await resolveFederation(recipientFederation);

    // Step 2: Convert amount to minor units
    const amountMinor = humanToMinor(amount, 7);

    // Step 3: Create pending payment record
    const payment = await createPayment({
      senderUsername,
      senderAddress,
      recipientUsername: `${recipient.username}*${recipient.domain}`,
      recipientAddress: recipient.stellarAddress,
      amountMinor,
      memo,
    });

    // Step 4: Demo simulate on-chain tx
    const { txHash, isNewAccount } = demoSimulatePayment({
      senderAddress,
      recipientAddress: recipient.stellarAddress,
      amountMinor,
    });

    // Step 5: Confirm payment
    const confirmed = await confirmPayment(payment.id, txHash, isNewAccount);

    // Step 6: Emit SSE event
    const event: PaymentEvent = {
      id: confirmed.id,
      sender: confirmed.senderAddress,
      senderUsername: confirmed.senderUsername,
      recipient: confirmed.recipientAddress,
      recipientUsername: confirmed.recipientUsername,
      amountMinor: confirmed.amountMinor,
      txHash: txHash,
      status: 'confirmed',
      createdAt: confirmed.createdAt.toISOString(),
      isNewAccount,
    };
    paymentEventBus.publish(event);

    return created({
      payment: confirmed,
      txHash,
      recipientAddress: recipient.stellarAddress,
      isNewAccount,
    });
  } catch (err) {
    return fromError(err);
  }
}
