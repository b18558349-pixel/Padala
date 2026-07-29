# Operations

The application uses Horizon for classic payment submission and Soroban RPC for
registry contract interaction.

Operational monitoring should cover:

- Vercel availability and server error rate;
- federation resolution failures by domain;
- prepared intents that never receive confirmation;
- Horizon submission failures and expired transactions;
- duplicate idempotency keys;
- contract invocation failures;
- database migration and connection health.

Treat Horizon and Soroban RPC responses as external dependencies. Preserve the
transaction hash as the canonical reference for every confirmed operation.
