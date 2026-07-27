# Testnet payment runbook

This is the shortest path to exercise Padala's real classic Stellar payment flow. It does not use a private key in the app.

## Before opening the app

Set the testnet values in `.env.local`:

- `STELLAR_NETWORK=testnet`
- `STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org`
- the configured USDC issuer and a federation record whose destination is a funded testnet account with the configured USDC trustline
- a database URL if running with persistent payments

The sender wallet must also hold the configured USDC asset and enough XLM for the network fee. The recipient account must exist and have a trustline for the configured USDC issuer.

## Payment flow

1. Open the app in Chrome with the Freighter extension enabled.
2. Connect Freighter in the Padala form and confirm the displayed sender address.
3. Enter a federation address, resolve it, review the destination, amount, and optional memo.
4. Select **Send USDC**. The server creates a payment intent and returns an unsigned XDR plus digest.
5. Review the transaction in Freighter and approve the signature.
6. Padala sends the signed XDR to `POST /api/payments/:id/confirm`. The server checks the network, sender signature, one payment operation, destination, amount, asset, and stored digest before submitting to Horizon.
7. Save the returned transaction hash and verify it on the Stellar testnet explorer.

If any check fails, no submission should be treated as successful. Retry by creating a new payment intent rather than reusing an edited XDR.

## Manual API checkpoints

The browser performs these steps automatically:

```text
POST /api/resolve?address=<username>*<domain>
POST /api/payments/prepare
  Idempotency-Key: <unique value>
  { senderUsername, senderAddress, recipientFederation, amount, memo? }
Freighter signs data.unsignedXdr
POST /api/payments/<payment-id>/confirm
  { signedXdr }
```

Do not paste a private key, seed phrase, or wallet secret into the terminal, server environment, or repository. Mainnet use requires a separate production configuration review and public evidence; this runbook is testnet-only.
