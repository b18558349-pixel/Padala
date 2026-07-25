import type { NextRequest } from 'next/server';
import { ok, fail, fromError } from '@/server/lib/http';
import { resolveFederation, listFederationUsers } from '@/server/service/federation.service';

/**
 * Resolve federation address and return preview info.
 * GET /api/resolve?address=alice*padala.ph
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const address = searchParams.get('address');

    if (!address) {
      // List all users if no address provided
      const users = await listFederationUsers();
      return ok(users.map((u) => ({
        federationAddress: `${u.username}*${u.domain}`,
        stellarAddress: u.stellarAddress,
        displayName: u.displayName,
      })));
    }

    const record = await resolveFederation(address);
    return ok({
      federationAddress: `${record.username}*${record.domain}`,
      stellarAddress: record.stellarAddress,
    });
  } catch (err) {
    return fromError(err);
  }
}
