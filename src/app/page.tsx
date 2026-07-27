import PaymentFeed from '@/ui/components/PaymentFeed';
import SendForm from '@/ui/components/SendForm';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Top nav */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
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
            </div>
            <span className="font-heading font-bold text-slate-900 text-lg">Padala</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
              Mainnet-ready
            </span>
            <span className="hidden sm:inline text-xs text-slate-500">SEP-2 Federation</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-7 sm:pt-8 pb-4">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl leading-tight font-bold text-slate-900 mb-2">
            Pay anyone by <span className="text-purple-600">@username</span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg leading-6 sm:leading-7">
            Type a federation address · resolve to Stellar · send XLM instantly
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 text-xs sm:text-sm">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">
                1
              </span>
              SEP-2 Federation
            </span>
            <span className="hidden sm:inline text-slate-300">·</span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">
                2
              </span>
              Sponsored Reserves
            </span>
            <span className="hidden sm:inline text-slate-300">·</span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">
                3
              </span>
              Live Feed (SSE)
            </span>
          </div>
        </div>

        {/* Layout F: Two-panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left panel: Send form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <SendForm />
          </div>

          {/* Right panel: Live feed */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm lg:h-[600px]">
            <PaymentFeed />
          </div>
        </div>

        {/* SEP-2 Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard
            icon="🏦"
            title="SEP-2 Federation"
            desc="Resolve @usernames to Stellar addresses — no copy-paste of long keys"
          />
          <InfoCard
            icon="⚡"
            title="Sponsored Reserves (CAP-33)"
            desc="New recipients onboarded gaslessly — zero XLM needed to receive"
          />
          <InfoCard
            icon="📡"
            title="Real-time Feed"
            desc="Horizon SSE streams every confirmed payment as it lands on-chain"
          />
        </div>

        {/* Demo usernames */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <h3 className="font-heading font-semibold text-slate-900 mb-3">
            Available Federation Addresses
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { addr: 'alice*padala.ph', name: 'Alice Reyes' },
              { addr: 'bob*padala.ph', name: 'Bob Cruz' },
              { addr: 'supplier*padala.ph', name: 'Supplier Co.' },
              { addr: 'merchant*padala.ph', name: 'Tindahan ni Mang' },
              { addr: 'leni*padala.ph', name: 'Leni Santos' },
            ].map(({ addr, name }) => (
              <div key={addr} className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-mono text-purple-700 truncate">{addr}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="text-center px-4 py-6 text-xs leading-5 text-slate-400">
        Padala · Built for Stellar APAC Hackathon · Network selected by deployment · Federation
        server self-hosted at padala.ph (simulated)
      </footer>
    </div>
  );
}

function InfoCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-heading font-semibold text-slate-900 text-sm mb-1">{title}</h3>
      <p className="text-xs leading-5 text-slate-500">{desc}</p>
    </div>
  );
}
