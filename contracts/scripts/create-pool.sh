#!/usr/bin/env bash
set -euo pipefail

FACTORY_ADDR="$1"
TOKEN_A="$2"
TOKEN_B="$3"
FEE_BPS="${4:-30}"
NETWORK="${5:-testnet}"

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

soroban contract invoke \
  --id "$FACTORY_ADDR" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$PASSPHRASE" \
  -- \
  create_constant_product_pool \
  --token_a "$TOKEN_A" \
  --token_b "$TOKEN_B" \
  --fee_tier "$FEE_BPS"
