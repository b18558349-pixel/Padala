# Security Boundaries

Padala is non-custodial: the browser wallet owns signing authority and the
server must never receive a wallet secret.

The server verifies the signed envelope against the prepared intent, including:

- Stellar network passphrase;
- source and destination accounts;
- native asset and exact stroop amount;
- memo and operation count;
- transaction digest and expiration;
- idempotency key.

Production secrets belong in encrypted deployment settings. Database URLs,
session secrets, provider credentials, seed phrases, and private keys must not
be committed.
