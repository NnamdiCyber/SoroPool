#!/usr/bin/env bash
# scripts/smoke-test.sh — SoroPool integration smoke test
# Usage: ./scripts/smoke-test.sh [base_url]

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
API="${BASE_URL}/api/v1"
PASS=0
FAIL=0
ERRORS=()

ok()   { echo "  ✅ $1"; ((PASS++)); }
fail() { echo "  ❌ $1"; ((FAIL++)); ERRORS+=("$1"); }

section() { echo; echo "▶ $1"; }

# ---------------------------------------------------------------------------
section "1. Infrastructure health"
# ---------------------------------------------------------------------------

# Backend health
status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/v1/pools" 2>/dev/null || echo "000")
if [ "$status" = "200" ]; then
  ok "Backend responds on ${BASE_URL}"
else
  fail "Backend not responding (HTTP ${status}). Run: make dev"
fi

# ---------------------------------------------------------------------------
section "2. Pools API"
# ---------------------------------------------------------------------------

response=$(curl -sf "${API}/pools" 2>/dev/null || echo "")
if [ -n "$response" ]; then
  count=$(echo "$response" | grep -o '"total":[0-9]*' | head -1 | tr -dc '0-9' || echo "0")
  ok "GET /pools returned (total: ${count:-?})"
else
  fail "GET /pools returned empty or error"
fi

# ---------------------------------------------------------------------------
section "3. Swap quote"
# ---------------------------------------------------------------------------

quote=$(curl -sf "${API}/swap/quote?tokenIn=XLM&tokenOut=USDC&amountIn=1000000" 2>/dev/null || echo "")
if echo "$quote" | grep -q '"amountOut"'; then
  ok "GET /swap/quote returned valid quote"
else
  fail "GET /swap/quote did not return expected amountOut"
fi

# Price impact in quote
if echo "$quote" | grep -q '"priceImpact"'; then
  ok "Quote contains priceImpact"
else
  fail "Quote missing priceImpact"
fi

# Route in quote
if echo "$quote" | grep -q '"route"'; then
  ok "Quote contains route"
else
  fail "Quote missing route"
fi

# ---------------------------------------------------------------------------
section "4. Routing"
# ---------------------------------------------------------------------------

routing=$(curl -sf "${API}/routing/best-path?tokenIn=XLM&tokenOut=USDC&amountIn=1000000" 2>/dev/null || echo "")
if echo "$routing" | grep -q '"path"'; then
  ok "GET /routing/best-path returned path"
else
  fail "GET /routing/best-path did not return expected path"
fi

# ---------------------------------------------------------------------------
section "5. Analytics"
# ---------------------------------------------------------------------------

tvl=$(curl -sf "${API}/analytics/tvl" 2>/dev/null || echo "")
if echo "$tvl" | grep -q '"tvlUsd"'; then
  ok "GET /analytics/tvl returned TVL data"
else
  fail "GET /analytics/tvl did not return expected tvlUsd"
fi

# ---------------------------------------------------------------------------
section "6. WebSocket (optional — requires wscat)"
# ---------------------------------------------------------------------------

if command -v wscat &>/dev/null; then
  WS_URL="${BASE_URL/http/ws}"
  ws_response=$(echo '{"event":"subscribe:stats"}' | timeout 3 wscat -c "${WS_URL}" 2>/dev/null | head -2 || echo "")
  if [ -n "$ws_response" ]; then
    ok "WebSocket connection established"
  else
    fail "WebSocket no response (may be normal if no live pools)"
  fi
else
  echo "  ⚠️  wscat not installed — skipping WebSocket test (npm install -g wscat)"
fi

# ---------------------------------------------------------------------------
echo
echo "────────────────────────────────────────"
echo "Results: ${PASS} passed, ${FAIL} failed"
if [ "${FAIL}" -gt 0 ]; then
  echo "Failures:"
  for e in "${ERRORS[@]}"; do echo "  - $e"; done
  echo
  exit 1
else
  echo
  echo "🌊 SoroPool 55% — READY FOR CONTRIBUTORS"
  echo "────────────────────────────────────────"
fi
