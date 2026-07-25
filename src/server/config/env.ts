import { z } from 'zod';

const booleanEnv = z.preprocess(
  (value) => (value === undefined ? false : typeof value === 'string' ? value === 'true' || value === '1' : value),
  z.boolean(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  NEXT_PUBLIC_APP_NAME: z.string().default('Padala'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3003'),

  DRIZZLE_DATABASE_URL: z.string().url(),

  STELLAR_NETWORK: z.enum(['testnet', 'public', 'futurenet']).default('testnet'),
  STELLAR_HORIZON_URL: z.string().url().default('https://horizon-testnet.stellar.org'),
  STELLAR_NETWORK_PASSPHRASE: z.string().default('Test SDF Network ; September 2015'),

  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 chars'),

  USDC_ASSET_CODE: z.string().default('USDC'),
  USDC_ASSET_ISSUER_TESTNET: z
    .string()
    .default('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'),
  USDC_ASSET_ISSUER_PUBLIC: z
    .string()
    .default('GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'),

  /** Optional sponsor secret for CAP-33 sponsored reserves */
  SPONSOR_SECRET: z.string().optional(),

  SSE_HEARTBEAT_MS: z.coerce.number().int().positive().default(15_000),

  DEMO_MODE: booleanEnv,

  FEDERATION_DOMAIN: z.string().default('padala.ph'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
export type Env = typeof env;
