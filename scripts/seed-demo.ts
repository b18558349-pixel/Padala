import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { federationUsers, payments } from '../src/server/db/schema/index.js';

if (process.env.DEMO_MODE !== 'true' || process.env.STELLAR_NETWORK === 'public') {
  throw new Error(
    'seed-demo requires DEMO_MODE=true and a non-mainnet STELLAR_NETWORK; refusing to seed demo data on mainnet',
  );
}

const DATABASE_URL = process.env.DRIZZLE_DATABASE_URL ?? process.env.DATABASE_URL ?? '';
if (!DATABASE_URL) {
  console.error('DRIZZLE_DATABASE_URL is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

// Pre-defined Stellar testnet addresses (public keys only - safe to commit)
const DEMO_USERS = [
  {
    username: 'alice',
    domain: 'padala.ph',
    stellarAddress: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    displayName: 'Alice Reyes',
  },
  {
    username: 'bob',
    domain: 'padala.ph',
    stellarAddress: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
    displayName: 'Bob Cruz',
  },
  {
    username: 'supplier',
    domain: 'padala.ph',
    stellarAddress: 'GBVVJJWGEN57INEF5DF6MNFD3WDUHZJCL5YWE6M3BJJKLLNOV47YR49',
    displayName: 'Supplier Co. (Mahal Sari-Sari Supplies)',
  },
  {
    username: 'merchant',
    domain: 'padala.ph',
    stellarAddress: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGPRE4HGD8MCA7MVK8E6AJ',
    displayName: 'Tindahan ni Mang Erning',
  },
  {
    username: 'leni',
    domain: 'padala.ph',
    stellarAddress: 'GBBM6BKZPEHWYO3AMVOLP2JPTXPXGV3C58XKVH57B83HMWKAKR5JWH5',
    displayName: 'Leni Santos (Sari-Sari Store Owner)',
  },
];

// Demo payment history
const DEMO_PAYMENTS = [
  {
    senderUsername: 'leni*padala.ph',
    senderAddress: 'GBBM6BKZPEHWYO3AMVOLP2JPTXPXGV3C58XKVH57B83HMWKAKR5JWH5',
    recipientUsername: 'supplier*padala.ph',
    recipientAddress: 'GBVVJJWGEN57INEF5DF6MNFD3WDUHZJCL5YWE6M3BJJKLLNOV47YR49',
    amountMinor: '500000000', // $50 USDC
    memo: 'Rice & noodles bulk order',
    txHash: 'A1B2C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF123456',
    status: 'confirmed' as const,
    isNewAccount: false,
  },
  {
    senderUsername: 'alice*padala.ph',
    senderAddress: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    recipientUsername: 'merchant*padala.ph',
    recipientAddress: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGPRE4HGD8MCA7MVK8E6AJ',
    amountMinor: '50000000', // $5 USDC
    memo: 'Tabo at sabon',
    txHash: 'B2C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF1234567',
    status: 'confirmed' as const,
    isNewAccount: false,
  },
  {
    senderUsername: 'bob*padala.ph',
    senderAddress: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
    recipientUsername: 'alice*padala.ph',
    recipientAddress: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    amountMinor: '250000000', // $25 USDC
    memo: 'Utang bayad',
    txHash: 'C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF12345678',
    status: 'confirmed' as const,
    isNewAccount: false,
  },
  {
    senderUsername: 'merchant*padala.ph',
    senderAddress: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGPRE4HGD8MCA7MVK8E6AJ',
    recipientUsername: 'supplier*padala.ph',
    recipientAddress: 'GBVVJJWGEN57INEF5DF6MNFD3WDUHZJCL5YWE6M3BJJKLLNOV47YR49',
    amountMinor: '1000000000', // $100 USDC
    memo: 'Monthly supply order',
    txHash: 'D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF1234567890',
    status: 'confirmed' as const,
    isNewAccount: false,
  },
  {
    senderUsername: 'leni*padala.ph',
    senderAddress: 'GBBM6BKZPEHWYO3AMVOLP2JPTXPXGV3C58XKVH57B83HMWKAKR5JWH5',
    recipientUsername: 'alice*padala.ph',
    recipientAddress: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    amountMinor: '100000000', // $10 USDC
    memo: 'Para sa anak',
    txHash: 'E5F6789012345678901234567890ABCDEF1234567890ABCDEF123456789012',
    status: 'confirmed' as const,
    isNewAccount: true,
  },
  {
    senderUsername: 'alice*padala.ph',
    senderAddress: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    recipientUsername: 'bob*padala.ph',
    recipientAddress: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
    amountMinor: '35000000', // $3.50 USDC
    memo: 'Kape at pandesal',
    txHash: 'F6789012345678901234567890ABCDEF1234567890ABCDEF12345678901234',
    status: 'confirmed' as const,
    isNewAccount: false,
  },
  {
    senderUsername: 'leni*padala.ph',
    senderAddress: 'GBBM6BKZPEHWYO3AMVOLP2JPTXPXGV3C58XKVH57B83HMWKAKR5JWH5',
    recipientUsername: 'supplier*padala.ph',
    recipientAddress: 'GBVVJJWGEN57INEF5DF6MNFD3WDUHZJCL5YWE6M3BJJKLLNOV47YR49',
    amountMinor: '750000000', // $75 USDC
    memo: 'Softdrinks at yelo',
    txHash: null,
    status: 'pending' as const,
    isNewAccount: false,
  },
];

async function seed() {
  console.log('🌱 Seeding Padala demo data...');

  // Clear existing data
  await db.delete(payments);
  await db.delete(federationUsers);

  // Seed federation users
  await db.insert(federationUsers).values(DEMO_USERS);
  console.log(`✅ Seeded ${DEMO_USERS.length} federation users`);

  // Seed demo payments
  const now = new Date();
  for (let i = 0; i < DEMO_PAYMENTS.length; i++) {
    const p = DEMO_PAYMENTS[i];
    const createdAt = new Date(now.getTime() - (DEMO_PAYMENTS.length - i) * 3 * 60 * 1000); // spread over last hour
    await db.insert(payments).values({
      ...p,
      createdAt,
      updatedAt: createdAt,
    });
  }
  console.log(`✅ Seeded ${DEMO_PAYMENTS.length} demo payments`);

  console.log('');
  console.log('🎉 Demo data ready! Try sending:');
  console.log('   supplier*padala.ph → "For rice delivery"');
  console.log('   leni*padala.ph → "Personal use"');
  console.log('');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
