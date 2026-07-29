# Payment Registry Contract API

The contract source is in `contracts/payment-registry/src/lib.rs`.

| Function | Purpose |
|---|---|
| `initialize` | Sets the registry administrator once |
| `register` | Associates a username with a Stellar account |
| `resolve` | Returns the account registered for a username |
| `record_payment` | Stores a payment receipt under a stable identifier |
| `get_payment` | Reads a previously recorded receipt |

Write operations require the expected account authorization. Values are stored
in Soroban contract storage, while XLM settlement remains a classic Stellar
payment signed by the user.
