import { randomUUID } from 'node:crypto';
import type { FederationUser, Payment } from '@/server/db/schema';

const demoNow = new Date('2026-07-26T00:00:00.000Z');

export const DEMO_FEDERATION_USERS: FederationUser[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    username: 'alice',
    domain: 'padala.ph',
    stellarAddress: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    displayName: 'Alice Reyes',
    memo: null,
    memoType: null,
    isActive: true,
    createdAt: demoNow,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    username: 'bob',
    domain: 'padala.ph',
    stellarAddress: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
    displayName: 'Bob Cruz',
    memo: null,
    memoType: null,
    isActive: true,
    createdAt: demoNow,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    username: 'supplier',
    domain: 'padala.ph',
    stellarAddress: 'GBVVJJWGEN57INEF5DF6MNFD3WDUHZJCL5YWE6M3BJJKLLNOV47YR49',
    displayName: 'Supplier Co. (Mahal Sari-Sari Supplies)',
    memo: null,
    memoType: null,
    isActive: true,
    createdAt: demoNow,
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    username: 'merchant',
    domain: 'padala.ph',
    stellarAddress: 'GAK3WH5HNKKSSFDUHFXBUG6X57RMTFZJ4R3SB3GEVDNT6D5QMMO5PQEO',
    displayName: 'Tindahan ni Mang Erning',
    memo: null,
    memoType: null,
    isActive: true,
    createdAt: demoNow,
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    username: 'leni',
    domain: 'padala.ph',
    stellarAddress: 'GBBM6BKZPEHWYO3AMVOLP2JPTXPXGV3C58XKVH57B83HMWKAKR5JWH5',
    displayName: 'Leni Santos (Sari-Sari Store Owner)',
    memo: null,
    memoType: null,
    isActive: true,
    createdAt: demoNow,
  },
];

const demoPaymentSeed = [
  [
    'leni*padala.ph',
    'GBBM6BKZPEHWYO3AMVOLP2JPTXPXGV3C58XKVH57B83HMWKAKR5JWH5',
    'supplier*padala.ph',
    'GBVVJJWGEN57INEF5DF6MNFD3WDUHZJCL5YWE6M3BJJKLLNOV47YR49',
    '500000000',
    'Rice & noodles bulk order',
    'A1B2C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF123456',
  ],
  [
    'alice*padala.ph',
    'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    'merchant*padala.ph',
    'GAK3WH5HNKKSSFDUHFXBUG6X57RMTFZJ4R3SB3GEVDNT6D5QMMO5PQEO',
    '50000000',
    'Tabo at sabon',
    'B2C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF1234567',
  ],
  [
    'bob*padala.ph',
    'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
    'alice*padala.ph',
    'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    '250000000',
    'Utang bayad',
    'C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF12345678',
  ],
  [
    'merchant*padala.ph',
    'GAK3WH5HNKKSSFDUHFXBUG6X57RMTFZJ4R3SB3GEVDNT6D5QMMO5PQEO',
    'supplier*padala.ph',
    'GBVVJJWGEN57INEF5DF6MNFD3WDUHZJCL5YWE6M3BJJKLLNOV47YR49',
    '1000000000',
    'Monthly supply order',
    'D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF1234567890',
  ],
  [
    'leni*padala.ph',
    'GBBM6BKZPEHWYO3AMVOLP2JPTXPXGV3C58XKVH57B83HMWKAKR5JWH5',
    'alice*padala.ph',
    'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    '100000000',
    'Para sa anak',
    'E5F6789012345678901234567890ABCDEF1234567890ABCDEF123456789012',
  ],
] as const;

export const demoPayments = new Map<string, Payment>();

for (const [index, seed] of demoPaymentSeed.entries()) {
  const [
    senderUsername,
    senderAddress,
    recipientUsername,
    recipientAddress,
    amountMinor,
    memo,
    txHash,
  ] = seed;
  const createdAt = new Date(demoNow.getTime() - (demoPaymentSeed.length - index) * 3 * 60 * 1000);
  const payment: Payment = {
    id: `00000000-0000-4000-8000-00000000010${index + 1}`,
    senderUsername,
    senderAddress,
    recipientUsername,
    recipientAddress,
    amountMinor,
    memo,
    idempotencyKey: null,
    unsignedXdr: null,
    unsignedTxDigest: null,
    txHash,
    status: 'confirmed',
    isNewAccount: false,
    createdAt,
    updatedAt: createdAt,
  };
  demoPayments.set(payment.id, payment);
}

export function createDemoPayment(input: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Payment {
  const now = new Date();
  const payment: Payment = {
    ...input,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  demoPayments.set(payment.id, payment);
  return payment;
}
