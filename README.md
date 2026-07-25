# Pay by Username / SEP-2

Pay-by-username payment UX on Stellar: resolve a human handle to a public account and prepare a verifiable payment.

## Stellar surface

- Classic Stellar USDC uses seven-decimal stroops (`1 USDC = 10,000,000`)

- Horizon account lookup and payment verification
- Issued-asset payment support, with network and issuer bound to configuration
- No private key custody in the application

## Readiness status

This repository is in hackathon readiness hardening. Demo data is gated to non-public networks. It does not claim a mainnet deployment until a real account, asset configuration, signed transaction, Horizon proof, and reproducible runbook are supplied.

See [`docs/MAINNET_READINESS.md`](docs/MAINNET_READINESS.md) for the remaining gates.

Normal mode uses `POST /api/payments/prepare` to build an unsigned USDC payment and `POST /api/payments/:id/confirm` to submit only an externally signed envelope matching the prepared intent. Demo simulation remains limited to non-public demo mode.

## Local demo

Use a disposable testnet wallet and local environment variables. Install dependencies, configure `.env.local` from `.env.example`, then run the scripts listed in `package.json`. Never commit `.env`, `.env.local`, seed phrases, or secret keys.

## Mainnet gate

Mainnet requires `STELLAR_NETWORK=public`, the public Horizon passphrase, an external signer, idempotent payment intents, and exact Horizon reconciliation before UI state changes to paid.
