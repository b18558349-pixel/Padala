# Mainnet Runbook

Use this checklist for a production smoke test.

1. Confirm Freighter displays **Mainnet**.
2. Open the verified Vercel deployment from the README.
3. Connect the intended funded account.
4. Resolve a known federation username.
5. Review destination, amount, asset, memo, and fee before signing.
6. Submit and wait for the transaction hash.
7. Open the hash in Stellar Expert and confirm success.
8. Record the hash in the deployment evidence when it represents a release.

Never paste a secret key into the app, source tree, issue, or deployment log.
