import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { type FederationUser, federationUsers } from '@/server/db/schema';
import { AppError } from '@/server/lib/http';

export type FederationRecord = {
  stellarAddress: string;
  username: string;
  domain: string;
  memo?: string | null;
  memoType?: string | null;
};

/**
 * Resolve a federation address like "alice*padala.ph" to a Stellar address.
 * Implements SEP-2 lookup against our local DB.
 */
export async function resolveFederation(federationAddress: string): Promise<FederationRecord> {
  const parts = federationAddress.split('*');
  if (parts.length !== 2) {
    throw new AppError(
      'INVALID_INPUT',
      'Invalid federation address format. Use username*domain',
      400,
    );
  }
  const [username, domain] = parts;
  if (!username || !domain) {
    throw new AppError('INVALID_INPUT', 'Username and domain are required', 400);
  }

  const user = await db.query.federationUsers.findFirst({
    where: and(
      eq(federationUsers.username, username.toLowerCase()),
      eq(federationUsers.domain, domain.toLowerCase()),
      eq(federationUsers.isActive, true),
    ),
  });

  if (!user) {
    throw new AppError('NOT_FOUND', `Federation address not found: ${federationAddress}`, 404);
  }

  return {
    stellarAddress: user.stellarAddress,
    username: user.username,
    domain: user.domain,
    memo: user.memo,
    memoType: user.memoType,
  };
}

/**
 * List all active federation users.
 */
export async function listFederationUsers(): Promise<FederationUser[]> {
  return db.query.federationUsers.findMany({
    where: eq(federationUsers.isActive, true),
    orderBy: (u, { asc }) => [asc(u.username)],
  });
}

/**
 * Get or create a federation user. Returns existing record or creates new.
 */
export async function ensureFederationUser(
  username: string,
  domain: string,
  stellarAddress: string,
  displayName: string,
): Promise<FederationUser> {
  const existing = await db.query.federationUsers.findFirst({
    where: and(
      eq(federationUsers.username, username.toLowerCase()),
      eq(federationUsers.domain, domain.toLowerCase()),
    ),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(federationUsers)
    .values({
      username: username.toLowerCase(),
      domain: domain.toLowerCase(),
      stellarAddress,
      displayName,
    })
    .returning();

  if (!created) {
    throw new AppError('INTERNAL', 'Failed to create federation user', 500);
  }
  return created;
}
