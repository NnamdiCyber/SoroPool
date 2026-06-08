#!/usr/bin/env bash
set -euo pipefail

CONTRACT_ADDR="$1"
NETWORK="${2:-testnet}"

case "$NETWORK" in
  testnet)
    RPC_URL="https://soroban-testnet.stellar.org"
    PASSPHRASE="Test SDF Network ; September 2015"
    ;;
  mainnet)
    RPC_URL="https://soroban.stellar.org"
    PASSPHRASE="Public Global Stellar Network ; September 2015"
    ;;
esac

echo "Verifying contract $CONTRACT_ADDR on $NETWORK..."
echo "RPC URL: $RPC_URL"

soroban contract read \
  --id "$CONTRACT_ADDR" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$PASSPHRASE" \
  -- \
  is_active

echo "Verification complete."
