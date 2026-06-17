# Concentrated Liquidity Math

## Overview

In concentrated liquidity pools, LPs choose a price range `[Pa, Pb]`. Liquidity is only active when the current price P is within the range. This increases capital efficiency dramatically compared to full-range positions.

## Q64.96 Fixed-Point Representation

Prices are stored as `sqrt(P)` in Q64.96 format — a 128-bit integer where the upper 64 bits are the integer part and the lower 96 bits are the fractional part.

```
sqrtPriceX96 = sqrt(price) × 2^96
price        = (sqrtPriceX96 / 2^96)^2
```

This format allows precise integer-only arithmetic for price calculations.

## Ticks

The price space is divided into discrete **ticks**. Each tick i corresponds to a price:

```
price(i) = 1.0001^i
sqrt_price(i) = sqrt(1.0001)^i = 1.0001^(i/2)
```

- Tick 0 → price 1.0
- Tick 100 → price ≈ 1.01005
- Tick -100 → price ≈ 0.99005
- Min tick: -887272, Max tick: +887272

### Tick to sqrt price (Soroban implementation)

Uses precomputed bit-manipulation constants:

```rust
// For each bit of abs_tick, multiply by the corresponding ratio
// If tick > 0, invert the result
ratio = MAX_UINT256 / ratio
// Convert from Q128 to Q96
result = ratio >> 32
```

## Token amounts from liquidity and price range

Given a liquidity value `L` and a price range `[Pa, Pb]`:

### Token 0 (token priced in terms of token 1)

```
Δtoken0 = L × (1/√Pa - 1/√Pb)
        = L × (√Pb - √Pa) / (√Pa × √Pb)
```

### Token 1

```
Δtoken1 = L × (√Pb - √Pa)
```

### When current price P is inside the range

```
amount0 = L × (1/√P  - 1/√Pb)   [if P < Pb]
amount1 = L × (√P  -  √Pa)      [if P > Pa]
```

## Capital efficiency

For a position in range `[Pa, Pb]` vs full range, the efficiency multiplier is:

```
efficiency = √(Pb/Pa) / (√(Pb/Pa) - 1)
```

Example: range ±10% around current price → efficiency ≈ 5.25×

## Fee growth per unit liquidity

Fees are tracked as `feeGrowthGlobal` — a running sum of fees earned per unit of liquidity:

```
feeGrowthGlobal += fee_amount / active_liquidity    (Q128.128 fixed-point)
```

For a position's accumulated fees since its last update:

```
fees_owed = (feeGrowthInside_now - feeGrowthInside_last) × position_liquidity
```

`feeGrowthInside` for a range `[tickLower, tickUpper]` is computed from the global fee growth and the fee growth recorded at each tick boundary when it was last crossed.

## Swap step

Each swap step crosses at most one tick:

1. Compute `sqrtPriceNext` given `amountIn` and `active_liquidity`
2. If `sqrtPriceNext` crosses the next initialized tick:
   - Compute partial amount for this sub-range
   - **Cross the tick**: flip `feeGrowthOutside`, adjust `active_liquidity` by the tick's `liquidityNet`
   - Continue with remaining amount
3. If no tick is crossed, compute the full output

### Next sqrt price from exact input

**Zero for one (selling token0):**
```
sqrtPriceNext = L × sqrtP / (L + amount0 × sqrtP / 2^96)
```

**One for zero (selling token1):**
```
sqrtPriceNext = sqrtP + amount1 × 2^96 / L
```
