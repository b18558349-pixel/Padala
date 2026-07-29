# Verification Checklist

- [ ] Public Vercel URL returns the Padala page.
- [ ] Freighter connection shows the expected public account.
- [ ] Federation lookup returns a valid Stellar `G...` address.
- [ ] Amount parsing preserves seven decimal places.
- [ ] The signing prompt shows Stellar Mainnet.
- [ ] Destination, amount, asset, and memo match the form.
- [ ] Horizon reports the submitted transaction as successful.
- [ ] The registry contract exists at the README contract ID.
- [ ] The functional registry transaction opens in Stellar Expert.
- [ ] No secret key or seed phrase is present in logs or Git history.

Run `npm test` and `npm run build` before a tagged release.
