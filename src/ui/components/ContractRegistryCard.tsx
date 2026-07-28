'use client';

import { signTransaction } from '@stellar/freighter-api';
import {
  Address,
  Contract,
  Networks,
  nativeToScVal,
  rpc,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { CheckCircle, ExternalLink, Loader2, Radio, WalletCards } from 'lucide-react';
import { useState } from 'react';

const CONTRACT_ID = 'CDKH3WERXPN3OEJNGMYDWVLFPQ4KI4HWM2EQO7WNM3SXIUJR5P54FRRD';
const RPC_URL = 'https://soroban-rpc.mainnet.stellar.gateway.fm';

type ContractRegistryCardProps = {
  walletAddress: string | null;
};

export default function ContractRegistryCard({ walletAddress }: ContractRegistryCardProps) {
  const [username, setUsername] = useState('demo-ui-016');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!walletAddress) {
      setError('Connect Freighter first.');
      return;
    }
    const normalized = username.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{2,31}$/.test(normalized)) {
      setError('Use 3–32 lowercase letters, numbers, or hyphens.');
      return;
    }

    setSending(true);
    setError('');
    setTxHash(null);

    try {
      const server = new rpc.Server(RPC_URL);
      const account = await server.getAccount(walletAddress);
      const contract = new Contract(CONTRACT_ID);
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.PUBLIC,
      })
        .addOperation(
          contract.call(
            'register_username',
            nativeToScVal(normalized, { type: 'string' }),
            new Address(walletAddress).toScVal(),
          ),
        )
        .setTimeout(300)
        .build();

      // RPC simulation adds the Soroban footprint, resource fee, and auth entry.
      const prepared = await server.prepareTransaction(transaction);
      const signed = await signTransaction(prepared.toXDR(), {
        address: walletAddress,
        networkPassphrase: Networks.PUBLIC,
      });
      if (signed.error || !signed.signedTxXdr) {
        throw new Error(signed.error?.message ?? 'Freighter did not return a signed transaction');
      }

      const signedTransaction = TransactionBuilder.fromXDR(signed.signedTxXdr, Networks.PUBLIC);
      const result = await server.sendTransaction(signedTransaction);
      if (result.status === 'ERROR') {
        throw new Error('Stellar rejected the contract transaction. Try another username.');
      }
      setTxHash(result.hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Contract transaction failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-slate-950 rounded-2xl p-4 sm:p-5 text-white shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
          <Radio className="w-5 h-5 text-purple-300" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-purple-300 font-semibold">
            Live Soroban contract
          </p>
          <h2 className="font-heading text-lg font-bold mt-1">Register a Padala username</h2>
          <p className="text-xs leading-5 text-slate-300 mt-1">
            A small mainnet action on the payment registry. Freighter reviews and signs it.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <label className="sr-only" htmlFor="contract-username">
          Username
        </label>
        <input
          id="contract-username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="your-username"
          disabled={sending}
          className="h-11 flex-1 rounded-xl bg-white/10 border border-white/15 px-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-300"
        />
        <button
          type="button"
          onClick={handleRegister}
          disabled={sending || !walletAddress}
          className="h-11 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <WalletCards className="w-4 h-4" />
          )}
          {sending ? 'Preparing…' : 'Register on mainnet'}
        </button>
      </div>

      {!walletAddress && (
        <p className="text-xs text-amber-200 mt-2">
          Connect Freighter above to enable this action.
        </p>
      )}
      {error && <p className="text-xs text-red-200 mt-2">{error}</p>}
      {txHash && (
        <div className="mt-3 flex items-start gap-2 text-xs text-emerald-200">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="break-all">
            Submitted: {txHash}{' '}
            <a
              href={`https://stellar.expert/explorer/public/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline"
            >
              View <ExternalLink className="w-3 h-3" />
            </a>
          </span>
        </div>
      )}
      <p className="text-[11px] text-slate-400 mt-3 font-mono truncate">Contract: {CONTRACT_ID}</p>
    </section>
  );
}
