# Padala payment registry contract

Minimal Soroban contract for project 016. It registers username-to-account
records and stores signed native-XLM payment receipts on-chain. The classic
Stellar payment remains a separate payment operation; this contract provides
the on-chain identity and receipt evidence required by the product.

```bash
cargo test --offline --manifest-path contracts/payment-registry/Cargo.toml
rustup run stable cargo build --manifest-path contracts/payment-registry/Cargo.toml --target wasm32v1-none --release
```

Deploy and initialize through the unsigned XDR runbook. Never put a private key
in the repository or environment.
