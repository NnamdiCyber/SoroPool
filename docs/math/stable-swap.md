# StableSwap AMM Math

## Motivation

The constant product curve `x·y=k` has high slippage near the peg for correlated assets (stablecoins, wrapped tokens). StableSwap introduces an amplification coefficient `A` that flattens the curve near equal balances.

## D Invariant

```
A · n^n · Σxi  +  D  =  A · D · n^n  +  D^(n+1) / (n^n · Πxi)
```

Where:
- `A` = amplification coefficient (e.g. 100–2000)
- `n` = number of tokens in the pool
- `xi` = balance of token i
- `D` = total invariant (analogous to `k` in constant product)
- `Σxi` = sum of all balances
- `Πxi` = product of all balances

### Behaviour extremes

| A | Curve shape |
|---|-------------|
| 0 | Constant product (x·y=k) |
| ∞ | Constant sum (x+y=const) |
| 100-2000 | Flat near peg, reverts to CP far from peg |

## Solving for D (Newton's method)

Since D appears on both sides, we solve iteratively:

```
D_{n+1} = (A·n^n·Σx + n·D_P) · D_n
          ──────────────────────────────
          (A·n^n - 1) · D_n + (n+1) · D_P

where D_P = D^(n+1) / (n^n · Πxi)
```

Convergence typically occurs within 4–6 iterations for reasonable inputs.

## Solving for output amount y (given swap of dx into token i)

After updating the balance of token i to `xi + dx`, solve for the new balance `y` of token j:

```
y^2 + b·y = c

where:
  c = D^(n+1) / (n^n · A · Πxk)   for k ≠ j
  b = Σxk + D/A                    for k ≠ j

Solution via Newton's method:
  y_{n+1} = (y_n^2 + c) / (2·y_n + b - D)
```

The output amount is then `dy = x_j_old - y - 1` (the -1 ensures rounding against the user), minus the swap fee.

## Amplification ramp

To adjust `A` safely without disrupting the pool, changes are applied linearly over time:

```
A(t) = A0 + (A1 - A0) × (t - t0) / (t1 - t0)   for t0 ≤ t ≤ t1
A(t) = A1                                         for t > t1
```

- Minimum ramp duration: 24 hours
- This prevents sudden shifts that would benefit front-runners

## Example: 2-token USDC/USDT pool

With `A = 200`, reserves `[1000, 1000]`, swap 100 USDC:

```
D = 2000  (sum, since balanced)
New balance of USDC = 1100
Solve for y (USDT): ≈ 900.9
dy ≈ 1000 - 900.9 - 1 = 98.1 USDT
```

vs constant product: `dy = 1000 × 100 / (1000 + 100) ≈ 90.9 USDT`

The StableSwap curve delivers ~8% better output near the peg.
