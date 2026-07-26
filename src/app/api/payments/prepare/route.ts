import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { humanToMinor } from '@/server/lib/bigint';
import { created, fail, fromError } from '@/server/lib/http';
import { buildUnsignedPayment, validateStellarAddress } from '@/server/lib/stellar';
import { resolveFederation } from '@/server/service/federation.service';
import { attachPreparedPayment, createPayment } from '@/server/service/payment.service';

const schema = z.object({
  senderUsername: z.string().min(1).max(64),
  senderAddress: z.string().length(56),
  recipientFederation: z.string().min(3),
  amount: z.string().min(1),
  memo: z.string().max(28).optional(),
});

/** Prepare a real unsigned payment; the external wallet signs it. */
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail('INVALID_INPUT', 'Invalid payment input', 400);
    const { senderUsername, senderAddress, recipientFederation, amount, memo } = parsed.data;
    const idempotencyKey = req.headers.get('Idempotency-Key')?.trim();
    if (!idempotencyKey || !/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
      return fail('INVALID_INPUT', 'Idempotency-Key header is required', 400);
    }
    validateStellarAddress(senderAddress);
    const recipient = await resolveFederation(recipientFederation);
    validateStellarAddress(recipient.stellarAddress);
    const amountMinor = humanToMinor(amount, 7);
    const payment = await createPayment({
      senderUsername,
      senderAddress,
      recipientUsername: `${recipient.username}*${recipient.domain}`,
      recipientAddress: recipient.stellarAddress,
      amountMinor,
      memo,
      idempotencyKey,
    });
    if (payment.status !== 'pending') {
      return fail('CONFLICT', 'Payment is no longer pending', 409);
    }
    if (payment.unsignedXdr && payment.unsignedTxDigest) {
      return created({
        payment,
        unsignedXdr: payment.unsignedXdr,
        unsignedTxDigest: payment.unsignedTxDigest,
        network: process.env.STELLAR_NETWORK ?? 'testnet',
        networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE,
        recipientAddress: recipient.stellarAddress,
        idempotent: true,
      });
    }
    const prepared = await buildUnsignedPayment({
      senderAddress,
      recipientAddress: recipient.stellarAddress,
      amountMinor,
      memo,
    });
    const updated = await attachPreparedPayment(
      payment.id,
      prepared.unsignedXdr,
      prepared.unsignedTxDigest,
    );
    return created({
      payment: updated,
      unsignedXdr: prepared.unsignedXdr,
      unsignedTxDigest: prepared.unsignedTxDigest,
      network: process.env.STELLAR_NETWORK ?? 'testnet',
      networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE,
      recipientAddress: recipient.stellarAddress,
    });
  } catch (err) {
    return fromError(err);
  }
}
