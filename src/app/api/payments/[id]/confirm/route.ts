import { TransactionBuilder } from '@stellar/stellar-sdk';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { created, fail, fromError } from '@/server/lib/http';
import { submitSignedPayment } from '@/server/lib/stellar';
import { confirmPreparedPayment, getPaymentById } from '@/server/service/payment.service';

const schema = z.object({
  signedXdr: z.string().min(1).max(100_000),
  unsignedXdr: z.string().min(1).max(100_000).optional(),
  senderAddress: z.string().length(56).optional(),
  recipientAddress: z.string().length(56).optional(),
  amountMinor: z.string().regex(/^\d+$/).optional(),
});

/** Submit an externally signed envelope and reconcile the confirmed hash. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail('INVALID_INPUT', 'signedXdr is required', 400);

    let payment: Awaited<ReturnType<typeof getPaymentById>>;
    try {
      payment = await getPaymentById(id);
    } catch (err) {
      // Vercel demo deployments may route prepare and confirm to different
      // serverless instances. In that case, validate the signed XDR against
      // the unsigned envelope supplied by the client before submitting it.
      if (
        process.env.DEMO_MODE !== 'true' ||
        !parsed.data.unsignedXdr ||
        !parsed.data.senderAddress ||
        !parsed.data.recipientAddress ||
        !parsed.data.amountMinor
      ) {
        throw err;
      }

      const networkPassphrase =
        process.env.STELLAR_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015';
      let unsignedTx: ReturnType<typeof TransactionBuilder.fromXDR>;
      let signedTx: ReturnType<typeof TransactionBuilder.fromXDR>;
      try {
        unsignedTx = TransactionBuilder.fromXDR(parsed.data.unsignedXdr, networkPassphrase);
        signedTx = TransactionBuilder.fromXDR(parsed.data.signedXdr, networkPassphrase);
      } catch {
        return fail(
          'INVALID_INPUT',
          'Transaction XDR is not valid for the configured network',
          400,
        );
      }
      if (!Buffer.from(unsignedTx.hash()).equals(Buffer.from(signedTx.hash()))) {
        return fail('CONFLICT', 'Signed transaction does not match the prepared intent', 409);
      }

      const result = await submitSignedPayment({
        signedXdr: parsed.data.signedXdr,
        senderAddress: parsed.data.senderAddress,
        recipientAddress: parsed.data.recipientAddress,
        amountMinor: parsed.data.amountMinor,
      });
      return created({
        payment: { id, status: 'confirmed', txHash: result.txHash },
        txHash: result.txHash,
        ledger: result.ledger,
        statelessDemoConfirmation: true,
      });
    }
    if (payment.status === 'confirmed' && payment.txHash) {
      return created({ payment, txHash: payment.txHash, idempotent: true });
    }
    if (!payment.unsignedTxDigest) {
      return fail('CONFLICT', 'Payment has not been prepared', 409);
    }
    let tx: ReturnType<typeof TransactionBuilder.fromXDR>;
    try {
      tx = TransactionBuilder.fromXDR(
        parsed.data.signedXdr,
        process.env.STELLAR_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015',
      );
    } catch {
      return fail('INVALID_INPUT', 'signedXdr is not a valid Stellar transaction', 400);
    }
    const digest = Buffer.from(tx.hash()).toString('hex').toUpperCase();
    if (digest !== payment.unsignedTxDigest.toUpperCase()) {
      return fail('CONFLICT', 'Submitted transaction does not match the prepared intent', 409);
    }
    const result = await submitSignedPayment({
      signedXdr: parsed.data.signedXdr,
      senderAddress: payment.senderAddress,
      recipientAddress: payment.recipientAddress,
      amountMinor: payment.amountMinor,
    });
    if (digest !== result.txHash.toUpperCase()) {
      return fail('CONFLICT', 'Horizon returned a different transaction hash', 409);
    }
    const confirmed = await confirmPreparedPayment(id, result.txHash);
    return created({ payment: confirmed, txHash: result.txHash, ledger: result.ledger });
  } catch (err) {
    return fromError(err);
  }
}
