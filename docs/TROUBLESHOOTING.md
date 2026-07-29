# Troubleshooting

## Wallet does not connect

Use Chrome, unlock Freighter, refresh the page, and confirm the extension is
allowed for the deployment domain.

## Federation address does not resolve

Check the `name*domain` format and retry with one of the demo suggestions.

## Transaction simulation or submission fails

Confirm the wallet network, account balance, sequence number, destination, and
transaction timeout. Rebuild an expired transaction instead of resubmitting it.

## Explorer is slow

Check the transaction hash in both Stellar Expert and Horizon before assuming
the submission failed.
