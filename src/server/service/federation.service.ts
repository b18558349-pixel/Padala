import { and, eq } from 'drizzle-orm';
import { env } from '@/server/config/env';
import { db } from '@/server/db/client';
import { type FederationUser, federationUsers } from '@/server/db/schema';
import { DEMO_FEDERATION_USERS } from '@/server/demo-data';
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

  if (env.DEMO_MODE) {
    const user = DEMO_FEDERATION_USERS.find(
      (candidate) =>
        candidate.username === username.toLowerCase() &&
        candidate.domain === domain.toLowerCase() &&
        candidate.isActive,
    );
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
  if (env.DEMO_MODE) return DEMO_FEDERATION_USERS.filter((user) => user.isActive);

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
  if (env.DEMO_MODE) {
    const existing = DEMO_FEDERATION_USERS.find(
      (user) => user.username === username.toLowerCase() && user.domain === domain.toLowerCase(),
    );
    if (existing) return existing;

    const created: FederationUser = {
      id: crypto.randomUUID(),
      username: username.toLowerCase(),
      domain: domain.toLowerCase(),
      stellarAddress,
      displayName,
      memo: null,
      memoType: null,
      isActive: true,
      createdAt: new Date(),
    };
    DEMO_FEDERATION_USERS.push(created);
    return created;
  }

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
