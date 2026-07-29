# Architecture

Padala separates human-readable routing from Stellar settlement.

1. The Next.js UI collects a federation address, amount, and optional memo.
2. The federation API resolves the address to a Stellar public key.
3. The payment service builds an unsigned transaction for the selected network.
4. Freighter signs the envelope without exposing the secret key to the app.
5. The confirmation route verifies the signed intent and submits it to Horizon.
6. The Soroban payment registry records username mappings and payment receipts.

PostgreSQL stores durable payment intents in production. The public preview can
fall back to a demo store for browsing, but demo records are never presented as
on-chain evidence.
