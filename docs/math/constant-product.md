# Constant Product AMM Math

## Invariant

```
x · y = k
```

Where `x` and `y` are the pool's token reserves and `k` is held constant after every swap (before fees).

## Swap output (exact input)

Given an input of `Δx` tokens:

```
amount_out = (y · Δx · (1 - fee)) / (x + Δx · (1 - fee))
```

In integer arithmetic with fee as basis points (e.g. 30 = 0.30%):

```
fee_multiplier    = 10_000 - fee_bps
amount_in_with_fee = Δx · fee_multiplier
amount_out        = (amount_in_with_fee · y) / (x · 10_000 + amount_in_with_fee)
```

### Example

- `x = 10,000,000` (XLM reserves)
- `y = 5,000,000` (USDC reserves)
- `Δx = 1,000,000` (swap 1M XLM)
- `fee_bps = 30`

```
fee_multiplier     = 9970
amount_in_with_fee = 1,000,000 × 9970 = 9,970,000,000
amount_out         = (9,970,000,000 × 5,000,000) / (10,000,000 × 10,000 + 9,970,000,000)
                   = 49,850,000,000,000,000 / 109,970,000,000
                   ≈ 453,303 USDC
```

## Swap input (exact output)

Given a desired output of `Δy`:

```
amount_in = (x · Δy · 10_000) / ((y - Δy) · fee_multiplier) + 1
```

## LP token minting

### Initial deposit (empty pool)

```
lp_minted = sqrt(amount_a × amount_b) - MINIMUM_LIQUIDITY
```

`MINIMUM_LIQUIDITY = 1000` is burned to the zero address to prevent the pool from being drained to zero.

### Subsequent deposits

```
lp_minted = min(
  amount_a × totalSupply / reserve_a,
  amount_b × totalSupply / reserve_b
)
```

The minimum ensures providers cannot mint more LP tokens than their proportional share.

## LP token redemption

```
amount_a = lp_amount × reserve_a / totalSupply
amount_b = lp_amount × reserve_b / totalSupply
```

## Price impact

```
price_impact = Δx / (x + Δx)
```

Expressed as a fraction, this equals the fraction of pool reserves being consumed by the trade.

## Fee distribution

```
swap_fee   = amount_in × fee_bps / 10_000
lp_fee     = swap_fee × 8333 / 10_000   (83.33% of fee)
protocol_fee = swap_fee × 1667 / 10_000 (16.67% of fee)
```

LP fees remain in the pool reserves, automatically accruing to LP token holders. Protocol fees are accumulated separately and claimed by governance.

## Invariant verification

After every swap: `new_x × new_y ≥ k` must hold. In practice, due to fee extraction from the invariant, the pool's product grows monotonically.
