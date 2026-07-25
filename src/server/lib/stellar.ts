import {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { Horizon } from '@stellar/stellar-sdk';
import { env } from '@/server/config/env';
import { AppError } from './http';

export function getServer(): Horizon.Server {
  return new Horizon.Server(env.STELLAR_HORIZON_URL, { allowHttp: false });
}

export function getNetworkPassphrase(): string {
  if (env.STELLAR_NETWORK === 'public') return Networks.PUBLIC;
  if (env.STELLAR_NETWORK === 'futurenet') return Networks.FUTURENET;
  return Networks.TESTNET;
}

export function getUsdcAsset(): Asset {
  const issuer = env.STELLAR_NETWORK === 'public'
    ? env.USDC_ASSET_ISSUER_PUBLIC
    : env.USDC_ASSET_ISSUER_TESTNET;
  return new Asset(env.USDC_ASSET_CODE, issuer);
}

/**
 * Check if an account exists on the Stellar network.
 */
export async function accountExists(publicKey: string): Promise<boolean> {
  const server = getServer();
  try {
    await server.loadAccount(publicKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build an unsigned USDC payment. The server reads sequence/fee data but
 * never receives a secret key, signs, or submits the transaction.
 */
export async function buildUnsignedPayment(params: {
  senderAddress: string;
  recipientAddress: string;
  amountMinor: string;
  memo?: string;
}): Promise<{ unsignedXdr: string; unsignedTxDigest: string; amount: string }> {
  const server = getServer();
  const senderAccount = await server.loadAccount(params.senderAddress);

  const usdc = getUsdcAsset();
  const networkPassphrase = getNetworkPassphrase();

  try {
    const recipientAccount = await server.loadAccount(params.recipientAddress);
    const hasTrustline = recipientAccount.balances.some(
      (balance) =>
        balance.asset_code === usdc.getCode() && balance.asset_issuer === usdc.getIssuer(),
    );
    if (!hasTrustline) {
      throw new AppError('CONFLICT', 'Recipient has no trustline for the configured asset', 409);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('CONFLICT', 'Recipient account or trustline is not ready', 409);
  }

  // Stellar classic assets, including USDC, use seven decimal places.
  const amountBig = BigInt(params.amountMinor);
  const divisor = BigInt(10_000_000);
  const whole = amountBig / divisor;
  const frac = amountBig % divisor;
  const amount = `${whole}.${frac.toString().padStart(7, '0')}`;

  let txBuilder = new TransactionBuilder(senderAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  });

  if (params.memo) {
    txBuilder = txBuilder.addMemo(Memo.text(params.memo.slice(0, 28)));
  }

  txBuilder = txBuilder
    .addOperation(Operation.payment({
      destination: params.recipientAddress,
      asset: usdc,
      amount,
    }))
    .setTimeout(30);

  const tx = txBuilder.build();
  return {
    unsignedXdr: tx.toXDR(),
    unsignedTxDigest: Buffer.from(tx.hash()).toString('hex').toUpperCase(),
    amount,
  };
}

export async function submitSignedPayment(params: {
  signedXdr: string;
  senderAddress: string;
  recipientAddress: string;
  amountMinor: string;
}): Promise<{ txHash: string; ledger: number }> {
  let tx: ReturnType<typeof TransactionBuilder.fromXDR>;
  try {
    tx = TransactionBuilder.fromXDR(params.signedXdr, getNetworkPassphrase());
  } catch {
    throw new AppError('INVALID_INPUT', 'signedXdr is not a valid Stellar transaction', 400);
  }

  const txSource = (tx as unknown as { source?: string }).source;
  if (txSource !== params.senderAddress || tx.signatures.length === 0) {
    throw new AppError('UNAUTHORIZED', 'Transaction is not signed by the payment sender', 401);
  }
  const senderKeypair = Keypair.fromPublicKey(params.senderAddress);
  const hasValidSignature = tx.signatures.some((signature) => {
    try {
      return senderKeypair.verify(tx.hash(), signature.signature());
    } catch {
      return false;
    }
  });
  if (!hasValidSignature) {
    throw new AppError('UNAUTHORIZED', 'Transaction signature does not match the payment sender', 401);
  }

  const operations = tx.operations;
  if (operations.length !== 1 || operations[0]?.type !== 'payment') {
    throw new AppError('INVALID_INPUT', 'Transaction must contain exactly one payment operation', 400);
  }
  const operation = operations[0] as typeof operations[number] & {
    destination?: string;
    amount?: string;
    asset?: Asset;
  };
  const expectedAmountBig = BigInt(params.amountMinor);
  const expectedAmount = `${expectedAmountBig / 10_000_000n}.${(expectedAmountBig % 10_000_000n).toString().padStart(7, '0')}`;
  const asset = operation.asset;
  const assetCode = asset?.getCode?.();
  const assetIssuer = asset?.getIssuer?.();
  const configured = getUsdcAsset();
  if (
    operation.destination !== params.recipientAddress ||
    operation.amount !== expectedAmount ||
    assetCode !== configured.getCode() ||
    assetIssuer !== configured.getIssuer()
  ) {
    throw new AppError('INVALID_INPUT', 'Signed transaction does not match the payment intent', 400);
  }

  const result = await getServer().submitTransaction(tx);
  if (!result.hash || !Number.isInteger(result.ledger)) {
    throw new AppError('INTERNAL', 'Horizon returned incomplete payment confirmation', 502);
  }
  return { txHash: result.hash, ledger: result.ledger };
}

/**
 * Demo-only: simulate a payment without actually hitting Stellar.
 * Returns a fake tx hash.
 */
export function demoSimulatePayment(_params: {
  senderAddress: string;
  recipientAddress: string;
  amountMinor: string;
}): { txHash: string; isNewAccount: boolean } {
  const randomHex = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
  return {
    txHash: randomHex.toUpperCase(),
    isNewAccount: Math.random() < 0.3, // 30% chance recipient is new
  };
}

export function validateStellarAddress(address: string): void {
  try {
    Keypair.fromPublicKey(address);
  } catch {
    throw new AppError('INVALID_PUBLIC_KEY', `Invalid Stellar address: ${address}`, 400);
  }
}
