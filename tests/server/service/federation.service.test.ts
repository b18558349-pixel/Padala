import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the DB module
vi.mock('../../../src/server/db/client', () => ({
  db: {
    query: {
      federationUsers: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
  },
}));

import { db } from '../../../src/server/db/client';
import { AppError } from '../../../src/server/lib/http';
import {
  listFederationUsers,
  resolveFederation,
} from '../../../src/server/service/federation.service';

const mockDb = db as unknown as {
  query: {
    federationUsers: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };
};

describe('resolveFederation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves a valid federation address', async () => {
    mockDb.query.federationUsers.findFirst.mockResolvedValue({
      stellarAddress: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      username: 'alice',
      domain: 'padala.ph',
      memo: null,
      memoType: null,
    });

    const result = await resolveFederation('alice*padala.ph');
    expect(result.stellarAddress).toBe('GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN');
    expect(result.username).toBe('alice');
    expect(result.domain).toBe('padala.ph');
  });

  it('throws NOT_FOUND for unknown address', async () => {
    mockDb.query.federationUsers.findFirst.mockResolvedValue(null);

    await expect(resolveFederation('unknown*padala.ph')).rejects.toThrow(AppError);
    await expect(resolveFederation('unknown*padala.ph')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });

  it('throws INVALID_INPUT for malformed address', async () => {
    await expect(resolveFederation('noDomain')).rejects.toThrow(AppError);
    await expect(resolveFederation('noDomain')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
  });

  it('throws INVALID_INPUT for empty username', async () => {
    await expect(resolveFederation('*padala.ph')).rejects.toThrow(AppError);
  });
});

describe('listFederationUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns list of users', async () => {
    const mockUsers = [
      {
        id: '1',
        username: 'alice',
        domain: 'padala.ph',
        stellarAddress: 'GABC',
        displayName: 'Alice',
        isActive: true,
        createdAt: new Date(),
        memo: null,
        memoType: null,
      },
      {
        id: '2',
        username: 'bob',
        domain: 'padala.ph',
        stellarAddress: 'GDEF',
        displayName: 'Bob',
        isActive: true,
        createdAt: new Date(),
        memo: null,
        memoType: null,
      },
    ];
    mockDb.query.federationUsers.findMany.mockResolvedValue(mockUsers);

    const result = await listFederationUsers();
    expect(result).toHaveLength(2);
    expect(result[0]?.username).toBe('alice');
  });

  it('returns empty array when no users', async () => {
    mockDb.query.federationUsers.findMany.mockResolvedValue([]);
    const result = await listFederationUsers();
    expect(result).toHaveLength(0);
  });
});
