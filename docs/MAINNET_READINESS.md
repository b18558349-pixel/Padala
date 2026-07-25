# Mainnet readiness

Concept: username-to-Stellar payment routing with SEP-2 lookup, sponsored reserve support, and Horizon observation.

Current evidence: the demo path remains explicitly gated, while the safe slice now exposes a real unsigned payment flow (`/api/payments/prepare`) and an external-signer confirmation flow (`/api/payments/:id/confirm`) that binds the signed digest to the stored intent before Horizon submission.

Required gates: confirm SEP-2 domain and account ownership, migrate `unsigned_xdr`/`unsigned_tx_digest`, verify recipient trustlines, test external signing without custody, add full idempotency/reconciliation, and record funded testnet/mainnet transaction links.

Status: **not mainnet-ready**. `scripts/seed-demo.ts` is explicitly blocked on public network unless `DEMO_MODE=true`.
