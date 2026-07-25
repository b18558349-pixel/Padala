import type { NextRequest } from 'next/server';
import { ok, fail, fromError } from '@/server/lib/http';
import { resolveFederation } from '@/server/service/federation.service';

/**
 * SEP-2 Federation Server endpoint.
 * GET /api/federation?q=alice*padala.ph&type=name
 *
 * Returns: { stellar_address, account_memo_type?, memo? }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get('q');
    const type = searchParams.get('type') ?? 'name';

    if (!q) {
      return fail('INVALID_INPUT', 'Missing required parameter: q', 400);
    }

    if (type !== 'name') {
      return fail('INVALID_INPUT', `Unsupported federation query type: ${type}. Only "name" is supported.`, 400);
    }

    const record = await resolveFederation(q);

    return ok({
      stellar_address: record.stellarAddress,
      stellar_memo_type: record.memoType ?? undefined,
      stellar_memo: record.memo ?? undefined,
    });
  } catch (err) {
    return fromError(err);
  }
}
