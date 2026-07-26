'use client';

import { ArrowRight, CheckCircle, Clock, Sparkles, XCircle, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Payment } from '@/server/db/schema';

type FeedEntry = {
  id: string;
  senderUsername: string;
  recipientUsername: string;
  amountMinor: string;
  txHash: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  isNewAccount: boolean;
};

function formatAmount(minor: string): string {
  const big = BigInt(minor);
  const divisor = BigInt(10_000_000);
  const whole = big / divisor;
  const frac = big % divisor;
  return `${whole}.${frac.toString().padStart(2, '0').slice(0, 2)}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'confirmed') return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (status === 'failed') return <XCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
}

function PaymentCard({ entry, isNew }: { entry: FeedEntry; isNew: boolean }) {
  return (
    <div
      className={`group p-3 rounded-xl border transition-all duration-500 ${
        isNew
          ? 'border-purple-300 bg-purple-50 shadow-sm shadow-purple-100'
          : 'border-slate-200 bg-white hover:border-purple-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <StatusIcon status={entry.status} />
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-sm">
              <span className="font-semibold text-slate-800 truncate max-w-[100px]">
                {entry.senderUsername.split('*')[0]}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="font-semibold text-purple-700 truncate max-w-[100px]">
                {entry.recipientUsername.split('*')[0]}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {entry.isNewAccount && (
                <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                  <Sparkles className="w-3 h-3" /> New
                </span>
              )}
              <span className="text-xs text-slate-400">{timeAgo(entry.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-slate-900 text-sm">${formatAmount(entry.amountMinor)}</p>
          <p className="text-xs text-slate-400">USDC</p>
        </div>
      </div>
      {entry.txHash && (
        <p className="text-xs text-slate-400 font-mono mt-2 truncate">
          {entry.txHash.slice(0, 12)}…{entry.txHash.slice(-8)}
        </p>
      )}
    </div>
  );
}

export default function PaymentFeed() {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const addEntry = useCallback((entry: FeedEntry) => {
    setEntries((prev) => {
      const exists = prev.find((e) => e.id === entry.id);
      if (exists) return prev.map((e) => (e.id === entry.id ? entry : e));
      return [entry, ...prev].slice(0, 50);
    });
    setNewIds((prev) => new Set([...prev, entry.id]));
    setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }, 3000);
  }, []);

  useEffect(() => {
    const es = new EventSource('/api/payments-feed');
    esRef.current = es;

    es.addEventListener('open', () => setConnected(true));
    es.addEventListener('error', () => setConnected(false));

    es.addEventListener('history', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as Payment[];
        setEntries(
          data.map((p) => ({
            id: p.id,
            senderUsername: p.senderUsername,
            recipientUsername: p.recipientUsername,
            amountMinor: p.amountMinor,
            txHash: p.txHash,
            status: p.status,
            createdAt:
              typeof p.createdAt === 'string' ? p.createdAt : new Date(p.createdAt).toISOString(),
            isNewAccount: p.isNewAccount,
          })),
        );
      } catch {
        // ignore
      }
    });

    es.addEventListener('payment', (e: MessageEvent) => {
      try {
        const entry = JSON.parse(e.data) as FeedEntry;
        addEntry(entry);
      } catch {
        // ignore
      }
    });

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [addEntry]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          <h2 className="font-heading font-semibold text-slate-900">Live Feed</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              connected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'
            }`}
          />
          <span className="text-xs text-slate-500">{connected ? 'Live' : 'Connecting…'}</span>
        </div>
      </div>

      {/* Feed list */}
      <div className="min-h-0 flex-1 overflow-y-auto flex flex-col gap-2">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-3">
              <Send className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-slate-500 text-sm font-medium">No payments yet</p>
            <p className="text-slate-400 text-xs mt-1">Send a payment to see it here</p>
          </div>
        ) : (
          entries.map((entry) => (
            <PaymentCard key={entry.id} entry={entry} isNew={newIds.has(entry.id)} />
          ))
        )}
      </div>

      {/* Stats */}
      {entries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-slate-900">{entries.length}</p>
            <p className="text-xs text-slate-500">Payments</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-600">
              {entries.filter((e) => e.status === 'confirmed').length}
            </p>
            <p className="text-xs text-slate-500">Confirmed</p>
          </div>
          <div>
            <p className="text-xl font-bold text-purple-600">
              {entries.filter((e) => e.isNewAccount).length}
            </p>
            <p className="text-xs text-slate-500">New accounts</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Need to import Send for empty state — add it
function Send(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
