'use client';

import { AlertCircle, CheckCircle, Loader2, Search, Send, User } from 'lucide-react';
import { useCallback, useState } from 'react';

type ResolvedRecipient = {
  federationAddress: string;
  stellarAddress: string;
};

type PaymentResult = {
  txHash: string;
  isNewAccount: boolean;
  recipientAddress: string;
};

type SendFormProps = {
  onPaymentSent?: (result: PaymentResult & { recipientFederation: string; amount: string }) => void;
};

const DEMO_SENDER = {
  username: 'leni*padala.ph',
  address: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
};

export default function SendForm({ onPaymentSent }: SendFormProps) {
  const [federationInput, setFederationInput] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [resolved, setResolved] = useState<ResolvedRecipient | null>(null);
  const [resolveError, setResolveError] = useState('');
  const [resolving, setResolving] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<PaymentResult | null>(null);
  const [error, setError] = useState('');

  const handleResolve = useCallback(async () => {
    if (!federationInput.includes('*')) {
      setResolveError('Enter a federation address like supplier*padala.ph');
      return;
    }
    setResolving(true);
    setResolveError('');
    setResolved(null);
    try {
      const res = await fetch(`/api/resolve?address=${encodeURIComponent(federationInput)}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Resolve failed');
      setResolved(json.data);
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : 'Failed to resolve');
    } finally {
      setResolving(false);
    }
  }, [federationInput]);

  const handleSend = useCallback(async () => {
    if (!resolved || !amount) return;
    setSending(true);
    setError('');
    setSuccess(null);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderUsername: DEMO_SENDER.username,
          senderAddress: DEMO_SENDER.address,
          recipientFederation: federationInput,
          amount,
          memo: memo || undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Payment failed');
      const result: PaymentResult = {
        txHash: json.data.txHash,
        isNewAccount: json.data.isNewAccount,
        recipientAddress: json.data.recipientAddress,
      };
      setSuccess(result);
      onPaymentSent?.({ ...result, recipientFederation: federationInput, amount });
      // Reset form
      setFederationInput('');
      setAmount('');
      setMemo('');
      setResolved(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setSending(false);
    }
  }, [resolved, amount, federationInput, memo, onPaymentSent]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">Padala</h2>
        </div>
        <p className="text-slate-500 text-sm ml-13">Pay anyone by @username.</p>
      </div>

      {/* Sender badge */}
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl">
        <User className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-slate-700">Sending as</span>
        <span className="text-sm font-semibold text-purple-700">{DEMO_SENDER.username}</span>
      </div>

      {/* Federation address input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="fed-input">
          Recipient @username
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              @
            </span>
            <input
              id="fed-input"
              type="text"
              value={federationInput}
              onChange={(e) => {
                setFederationInput(e.target.value);
                setResolved(null);
                setResolveError('');
              }}
              placeholder="supplier*padala.ph"
              className="w-full h-11 pl-8 pr-4 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleResolve()}
            />
          </div>
          <button
            type="button"
            onClick={handleResolve}
            disabled={resolving || !federationInput}
            className="h-11 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors min-w-[90px] justify-center"
          >
            {resolving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                Resolve
              </>
            )}
          </button>
        </div>

        {/* Quick-select suggestions */}
        <div className="flex flex-wrap gap-2">
          {['supplier*padala.ph', 'alice*padala.ph', 'merchant*padala.ph'].map((addr) => (
            <button
              key={addr}
              type="button"
              onClick={() => {
                setFederationInput(addr);
                setResolved(null);
                setResolveError('');
              }}
              className="text-xs px-2 py-1 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 rounded-lg border border-slate-200 hover:border-purple-300 transition-colors"
            >
              {addr}
            </button>
          ))}
        </div>

        {resolveError && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {resolveError}
          </div>
        )}

        {resolved && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Address resolved via SEP-2</p>
              <p className="text-xs text-green-700 font-mono mt-0.5 break-all">
                {resolved.stellarAddress}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="amount-input">
          Amount (USDC)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
            $
          </span>
          <input
            id="amount-input"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full h-11 pl-7 pr-20 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm font-semibold"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
            USDC
          </span>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2">
          {['1', '5', '10', '25', '50'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className="flex-1 h-8 text-xs font-semibold bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 rounded-lg border border-slate-200 hover:border-purple-300 transition-colors"
            >
              ${v}
            </button>
          ))}
        </div>
      </div>

      {/* Memo */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="memo-input">
          Memo <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id="memo-input"
          type="text"
          maxLength={28}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="For rice delivery, Sept"
          className="w-full h-11 px-4 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-800">Payment sent!</span>
            {success.isNewAccount && (
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                New account created
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-mono break-all">Tx: {success.txHash}</p>
        </div>
      )}

      {/* Send button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={!resolved || !amount || sending}
        className="h-12 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-sm"
      >
        {sending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Send className="w-5 h-5" />
            Send USDC
          </>
        )}
      </button>

      <p className="text-xs text-slate-400 text-center">
        Powered by Stellar SEP-2 federation · Testnet
      </p>
    </div>
  );
}
