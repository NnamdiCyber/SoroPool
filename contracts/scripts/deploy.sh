#!/usr/bin/env bash
set -euo pipefail

NETWORK="${1:-testnet}"
echo "Deploying SoroPool contracts to $NETWORK..."

case "$NETWORK" in
  testnet)
    RPC_URL="https://soroban-testnet.stellar.org"
    PASSPHRASE="Test SDF Network ; September 2015"
    ;;
  mainnet)
    RPC_URL="https://soroban.stellar.org"
    PASSPHRASE="Public Global Stellar Network ; September 2015"
    ;;
  *)
    echo "Usage: $0 {testnet|mainnet}"
    exit 1
    ;;
esac

deploy_contract() {
  local name="$1"
  local path="$2"
  echo "Deploying $name..."
  soroban contract deploy \
    --wasm "$path" \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$PASSPHRASE"
}

FACTORY_ADDR=$(deploy_contract "PoolFactory" "../target/wasm32-unknown-unknown/release/soropool_pool_factory.wasm")
echo "PoolFactory: $FACTORY_ADDR"

LP_TOKEN_ADDR=$(deploy_contract "LpToken" "../target/wasm32-unknown-unknown/release/soropool_lp_token.wasm")
echo "LpToken: $LP_TOKEN_ADDR"

ROUTER_ADDR=$(deploy_contract "Router" "../target/wasm32-unknown-unknown/release/soropool_router.wasm")
echo "Router: $ROUTER_ADDR"

FARM_ADDR=$(deploy_contract "Farm" "../target/wasm32-unknown-unknown/release/soropool_farm.wasm")
echo "Farm: $FARM_ADDR"

GOVERNANCE_ADDR=$(deploy_contract "Governance" "../target/wasm32-unknown-unknown/release/soropool_governance.wasm")
echo "Governance: $GOVERNANCE_ADDR"

TREASURY_ADDR=$(deploy_contract "Treasury" "../target/wasm32-unknown-unknown/release/soropool_treasury.wasm")
echo "Treasury: $TREASURY_ADDR"

TWAP_ADDR=$(deploy_contract "TwapOracle" "../target/wasm32-unknown-unknown/release/soropool_twap_oracle.wasm")
echo "TwapOracle: $TWAP_ADDR"

echo ""
echo "=== Deployment Summary ($NETWORK) ==="
echo "PoolFactory: $FACTORY_ADDR"
echo "LpToken:     $LP_TOKEN_ADDR"
echo "Router:      $ROUTER_ADDR"
echo "Farm:        $FARM_ADDR"
echo "Governance:  $GOVERNANCE_ADDR"
echo "Treasury:    $TREASURY_ADDR"
echo "TwapOracle:  $TWAP_ADDR"
