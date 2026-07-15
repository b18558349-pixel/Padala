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
  return new Asset(env.USDC_ASSET_CODE, env.USDC_ASSET_ISSUER_TESTNET);
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
 * Simulate a USDC payment on Stellar testnet.
 * In production this would sign with a real wallet; in demo mode we simulate.
 *
 * Returns a mock tx hash for demo purposes.
 */
export async function simulatePayment(params: {
  senderSecret: string;
  recipientAddress: string;
  amountMinor: string;
  memo?: string;
  isNewAccount?: boolean;
}): Promise<{ txHash: string; isNewAccount: boolean }> {
  const server = getServer();
  const senderKeypair = Keypair.fromSecret(params.senderSecret);
  const senderAccount = await server.loadAccount(senderKeypair.publicKey());

  const usdc = getUsdcAsset();
  const networkPassphrase = getNetworkPassphrase();

  // Convert minor units (6 decimals) to Stellar amount string
  const amountBig = BigInt(params.amountMinor);
  const divisor = BigInt(1_000_000);
  const whole = amountBig / divisor;
  const frac = amountBig % divisor;
  const amount = `${whole}.${frac.toString().padStart(7, '0')}`;

  const recipientExists = await accountExists(params.recipientAddress);

  let txBuilder = new TransactionBuilder(senderAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  });

  if (!recipientExists && env.SPONSOR_SECRET) {
    // CAP-33: sponsored reserve for new account
    const sponsorKeypair = Keypair.fromSecret(env.SPONSOR_SECRET);
    txBuilder = txBuilder
      .addOperation(Operation.beginSponsoringFutureReserves({
        sponsoredId: params.recipientAddress,
        source: sponsorKeypair.publicKey(),
      }))
      .addOperation(Operation.createAccount({
        destination: params.recipientAddress,
        startingBalance: '0',
      }))
      .addOperation(Operation.changeTrust({
        asset: usdc,
        source: params.recipientAddress,
      }))
      .addOperation(Operation.endSponsoringFutureReserves({
        source: params.recipientAddress,
      }));
  }

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
  tx.sign(senderKeypair);

  const result = await server.submitTransaction(tx);
  return {
    txHash: result.hash,
    isNewAccount: !recipientExists,
  };
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
