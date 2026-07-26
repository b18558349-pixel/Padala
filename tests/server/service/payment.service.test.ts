import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock DB
vi.mock('../../../src/server/db/client', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
    query: {
      payments: {
        findFirst: vi.fn(),
      },
    },
  },
}));

import { db } from '../../../src/server/db/client';
import { AppError } from '../../../src/server/lib/http';
import {
  confirmPayment,
  createPayment,
  failPayment,
} from '../../../src/server/service/payment.service';

const mockDb = db as unknown as {
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  query: { payments: { findFirst: ReturnType<typeof vi.fn> } };
};

const mockPayment = {
  id: 'test-uuid',
  senderUsername: 'leni*padala.ph',
  senderAddress: 'GBBM6BKZPEHWYO3AMVOLP2JPTXPXGV3C58XKVH57B83HMWKAKR5JWH5',
  recipientUsername: 'supplier*padala.ph',
  recipientAddress: 'GBVVJJWGEN57INEF5DF6MNFD3WDUHZJCL5YWE6M3BJJKLLNOV47YR49',
  amountMinor: '5000000',
  memo: null,
  txHash: null,
  status: 'pending' as const,
  isNewAccount: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('createPayment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a payment successfully', async () => {
    const insertMock = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockPayment]),
    };
    mockDb.insert.mockReturnValue(insertMock);

    const result = await createPayment({
      senderUsername: 'leni*padala.ph',
      senderAddress: 'GBBM6BKZPEHWYO3AMVOLP2JPTXPXGV3C58XKVH57B83HMWKAKR5JWH5',
      recipientUsername: 'supplier*padala.ph',
      recipientAddress: 'GBVVJJWGEN57INEF5DF6MNFD3WDUHZJCL5YWE6M3BJJKLLNOV47YR49',
      amountMinor: '5000000',
    });

    expect(result.status).toBe('pending');
    expect(result.amountMinor).toBe('5000000');
  });

  it('throws on zero amount', async () => {
    await expect(
      createPayment({
        senderUsername: 'leni*padala.ph',
        senderAddress: 'GBBM6BKZPEHWYO3AMVOLP2JPTXPXGV3C58XKVH57B83HMWKAKR5JWH5',
        recipientUsername: 'supplier*padala.ph',
        recipientAddress: 'GBVVJJWGEN57INEF5DF6MNFD3WDUHZJCL5YWE6M3BJJKLLNOV47YR49',
        amountMinor: '0',
      }),
    ).rejects.toThrow(AppError);
  });

  it('throws on negative amount', async () => {
    await expect(
      createPayment({
        senderUsername: 'leni*padala.ph',
        senderAddress: 'GABC',
        recipientUsername: 'supplier*padala.ph',
        recipientAddress: 'GDEF',
        amountMinor: '-100',
      }),
    ).rejects.toThrow();
  });
});

describe('confirmPayment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('confirms a payment with tx hash', async () => {
    const confirmedPayment = { ...mockPayment, status: 'confirmed' as const, txHash: 'ABCDEF' };
    const updateMock = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([confirmedPayment]),
    };
    mockDb.update.mockReturnValue(updateMock);

    const result = await confirmPayment('test-uuid', 'ABCDEF', false);
    expect(result.status).toBe('confirmed');
    expect(result.txHash).toBe('ABCDEF');
  });

  it('throws NOT_FOUND if payment not found', async () => {
    const updateMock = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    mockDb.update.mockReturnValue(updateMock);

    await expect(confirmPayment('nonexistent', 'HASH')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('failPayment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks payment as failed', async () => {
    const failedPayment = { ...mockPayment, status: 'failed' as const };
    const updateMock = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([failedPayment]),
    };
    mockDb.update.mockReturnValue(updateMock);

    const result = await failPayment('test-uuid');
    expect(result.status).toBe('failed');
  });
});
