# Swap Data Flow

This document traces a token swap from the user clicking "Swap" to the final state update.

## Step-by-step flow

```
1. User enters amount in SwapComponent
        │
        ▼
2. NgRx dispatch: SwapActions.setAmountIn(amount)
   (debounced 300ms)
        │
        ▼
3. SwapEffects: GET /api/v1/swap/quote?tokenIn=XLM&tokenOut=USDC&amountIn=100
        │
        ▼
4. SwapController → SwapService.getQuote()
        │
        ▼
5. RoutingService.findBestRoute(XLM, USDC, 100)
   └─ GraphService.getGraph()         (Redis cache, rebuild every 30s)
   └─ Dijkstra DFS, up to 3 hops
   └─ simulatePath() using ConstantProductMath.getAmountOut()
        │
        ▼
6. Response: { amountOut, priceImpact, route, effectivePrice, fee }
        │
        ▼
7. NgRx dispatch: SwapActions.updateQuote(quote)
   Store updated → UI reacts via selectSignal
        │
        ▼
8. User clicks "Swap" → SwapComponent.executeSwap()
        │
        ▼
9. POST /api/v1/swap/build → SwapService.buildSwapTransaction()
   Constructs Soroban contract invocation XDR (unsigned)
        │
        ▼
10. WalletService.signTransaction(txXdr)
    → Freighter extension signs with user's private key
        │
        ▼
11. StellarService.submitTransaction(signedXdr)
    → Soroban RPC submits to Stellar network
        │
        ▼
12. Transaction confirmed on chain
    Router contract calls pool.swap_exact_in()
    Pool transfers tokens, emits Swap event
        │
        ▼
13. StellarIndexerService detects Swap event (next poll)
    → SwapIndexerService.processSwap()
    → Updates swaps hypertable, pool.reserve0/1, pool.volume24hUsd
    → Invalidates Redis cache
    → Emits pool:reserves via PoolsGateway WebSocket
        │
        ▼
14. Frontend receives pool:reserves WebSocket message
    NgRx dispatch: PoolActions.updatePoolReserves(data)
    Pool list and charts update automatically
```

## Contract interaction diagram

```
Router.swap_exact_tokens_for_tokens(path)
    │
    ├─ step 0: Pool_A.swap_exact_in(amount_in, ...)
    │          Pool_A transfers token_out to Router
    │
    └─ step N: Pool_N.swap_exact_in(amount_from_prev, ...)
               Pool_N transfers final token to recipient
```

The Router contract is a thin orchestrator — it holds no liquidity. Each pool is self-contained and enforces its own slippage and deadline checks.
