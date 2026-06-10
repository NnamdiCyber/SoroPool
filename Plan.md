# SoroPool — 10-Day Development Sprint Plan

**Target: 55% completion — a robust foundation for contributors**

---

## Day 1 — Project Scaffolding & Shared Foundations

**Goal:** Initialize all workspace structures, package managers, shared libraries, and config files so every subsequent day has a place to land code.

### Prompts

1. **Initialize monorepo root** — Create root `package.json` (workspaces), `.editorconfig`, `.gitignore`, `.prettierrc`, `.eslintrc`, `Makefile` with targets: `dev`, `build`, `test`, `lint`, `migrate`, `seed`, `clean`. Add `README.md` symlink check. Copy `docker-compose.yml` from README spec.

2. **Scaffold smart contract workspace** — Create `contracts/Cargo.toml` workspace manifest. Lay out directories: `contracts/shared/src/`, `contracts/pool-factory/`, `contracts/constant-product-pool/`, `contracts/stableswap-pool/`, `contracts/concentrated-liquidity-pool/`, `contracts/router/`, `contracts/lp-token/`, `contracts/farm/`, `contracts/governance/`, `contracts/treasury/`, `contracts/twap-oracle/`, `contracts/scripts/`. Each contract directory has `Cargo.toml` and `src/lib.rs` with a stub `#[contract]` struct.

3. **Shared Rust library** — In `contracts/shared/`, implement:
   - Fixed-point math (Q64.96 for sqrt price, decimal18 for reserves) in `math.rs`
   - Core types: `FeeTier`, `PoolType`, `SwapStep`, `PositionInfo`, `Slot0`, `PoolInfo` in `types.rs`
   - Error enum: `Error` with variants `InsufficientLiquidity`, `InvalidFee`, `SlippageExceeded`, `DeadlineExpired`, `InvalidPath`, `Overflow`, `ZeroLiquidity`
   - Re-export everything in `lib.rs`

4. **Scaffold backend** — `backend/package.json` with NestJS 10.x, TypeORM, `stellar-sdk`, `graphology`, `socket.io`, `class-validator`, `@nestjs/schedule`, `@nestjs/swagger`. Create `src/main.ts` (bootstrap), `src/app.module.ts` (empty module tree matching README architecture). Create `src/config/` with `configuration.ts`, `database.config.ts`, `stellar.config.ts`. Create `tsconfig.json`, `nest-cli.json`.

5. **Scaffold frontend** — Initialize Angular 17 workspace in `frontend/`. Add `@angular/pwa`, `@ngrx/store`, `@angular/material`, `tailwindcss`. Create `src/environments/environment.ts` matching README spec. Generate core services stubs: `wallet.service.ts`, `stellar.service.ts`, `amm-math.service.ts`, `price-feed.service.ts`. Set up NgRx root store with empty slices for `auth`, `pools`, `swap`, `liquidity`, `farm`, `prices`, `analytics`.

6. **Infrastructure scaffolding** — Create `infrastructure/terraform/modules/` with stubs. Create `infrastructure/kubernetes/deployments/` YAML stubs. Create `infrastructure/monitoring/prometheus/prometheus.yml`. Create `.github/workflows/ci.yml` from README spec.

7. **Environment templates** — Create `.env.example`, `backend/.env.example`, `frontend/src/environments/environment.ts`. These match the exact variables in README § "Environment Variables".

8. **Database migration scaffold** — Create `backend/src/database/` directory with `entities/`, `migrations/`, `seeds/`. Write initial TypeORM entities: `Token`, `Pool`, `LpPosition`, `ClPosition`, `Swap`, `PriceCandle`, `FarmPosition`, `TvlSnapshot`. These mirror the SQL schema in README § "Database Design". Create `database.module.ts` with TypeORM + TimescaleDB config.

---

## Day 2 — Smart Contract Core: Pool Factory & LP Token

**Goal:** Fully implement the pool factory contract and LP token contract. These are the protocol's registry and receipt primitives.

### Prompts

1. **Pool Factory — storage** (`contracts/pool-factory/src/storage.rs`)
   - Persistent entries: `Admin` (Address), `FeeRecipient` (Address), `PoolCount` (u32)
   - `PoolRegistry` — map from `(token_a, token_b, fee_tier)` to pool address
   - `AllPools` — vector of `PoolInfo` for enumeration
   - `PoolOwners` — map from pool address to deployer address

2. **Pool Factory — events** (`contracts/pool-factory/src/events.rs`)
   - Emit `PoolCreated { pool: Address, pool_type: PoolType, token_a: Address, token_b: Address, fee_tier: u32, deployer: Address, timestamp: u64 }`
   - Emit `FeeRecipientUpdated { previous: Address, new: Address }`

3. **Pool Factory — implementation** (`contracts/pool-factory/src/lib.rs`)
   - `initialize(env, admin, fee_recipient)` — set admin and fee recipient
   - `create_constant_product_pool(env, token_a, token_b, fee_tier)` — deploy new CP pool via Soroban `create_contract`, register in registry, emit event
   - `create_stable_pool(env, tokens, amplification, fee_tier)` — deploy stableswap pool
   - `create_concentrated_pool(env, token_a, token_b, fee_tier, tick_spacing, initial_sqrt_price)` — deploy CL pool
   - `get_pool(env, token_a, token_b, fee_tier)` — lookup
   - `get_all_pools(env)` — paginated list
   - `set_fee_recipient(env, new_recipient)` — admin-only
   - All functions enforce `deadline` and check `caller` authorization

4. **LP Token contract** (`contracts/lp-token/src/lib.rs`)
   - Soroban token interface (compatible with `soroban_sdk::token::Interface`)
   - `initialize(env, admin, name, symbol)` — set metadata
   - `mint(env, to, amount)` — only callable by pool contract (store authorized minter address)
   - `burn(env, from, amount)` — only callable by pool contract
   - ERC20-like: `balance_of`, `total_supply`, `transfer`, `approve`, `transfer_from`
   - Metadata: `name()`, `symbol()`, `decimals()`

5. **Deployment script** (`contracts/scripts/deploy.sh`)
   - Bash script that deploys factory, then LP token contract, prints addresses
   - Accept network argument: `./deploy.sh testnet` or `./deploy.sh mainnet`
   - Uses `soroban contract deploy` CLI

6. **Pool Factory tests** (`contracts/pool-factory/tests/`)
   - Test `initialize` sets admin correctly
   - Test `create_constant_product_pool` registers pool and returns address
   - Test duplicate pool creation reverts
   - Test unauthorized admin calls revert
   - Test `get_all_pools` returns correct count
   - Use `soroban_sdk::testutils` for environment setup

7. **LP Token tests**
   - Test `mint` increases balance and total supply
   - Test `burn` decreases balance and total supply
   - Test unauthorized `mint` (non-minter) reverts
   - Test `transfer` and `transfer_from` with allowances

---

## Day 3 — Smart Contract: Constant Product Pool (Full)

**Goal:** Complete implementation of the constant-product AMM pool (`x·y=k`), the workhorse of the protocol.

### Prompts

1. **Math module** (`contracts/constant-product-pool/src/math.rs`)
   - `get_amount_out(amount_in, reserve_in, reserve_out, fee_bps)` → `amount_out` using `Δy = (y·Δx·(1-fee))/(x+Δx·(1-fee))`
   - `get_amount_in(amount_out, reserve_in, reserve_out, fee_bps)` → `amount_in`
   - `calc_lp_tokens(amount_a, amount_b, reserve_a, reserve_b, total_supply)` → `lp_tokens` (geometric mean for initial deposit, ratio-based thereafter)
   - `calc_liquidity_ratio(lp_amount, total_supply, reserve_a, reserve_b)` → `(amount_a_share, amount_b_share)`
   - All math uses `i128` with overflow checks; constant `MINIMUM_LIQUIDITY = 1000`

2. **Fees module** (`contracts/constant-product-pool/src/fees.rs`)
   - `FeeState` struct: `protocol_fee_bps` (16.67% of swap fees), `accumulated_protocol_fees_a`, `accumulated_protocol_fees_b`
   - `calculate_swap_fees(amount_in_without_fee, fee_bps)` → `(protocol_fee, lp_fee)`
   - `update_protocol_fees(env, fee_a, fee_b)` — accumulate to `FeeState`
   - `collect_protocol_fees(env, caller)` — governance-only, transfers accumulated fees

3. **Swap logic** (`contracts/constant-product-pool/src/swap.rs`)
   - `swap_exact_in(env, caller, amount_in, amount_out_min, zero_for_one, recipient, deadline)`
     - Apply fee, compute `amount_out` via math module
     - Update reserves
     - Revert if `amount_out < amount_out_min`
     - Transfer output tokens to recipient via Soroban token client
     - Emit `Swap` event
   - `swap_exact_out(env, caller, amount_out, amount_in_max, zero_for_one, recipient, deadline)`
     - Compute required `amount_in` via math module
     - Revert if `amount_in > amount_in_max`
     - Transfer input tokens from caller (via `require_auth`), output to recipient
   - `flash_swap(env, caller, amount0_out, amount1_out, callback_contract, callback_data)`
     - Transfer tokens to `callback_contract`, invoke it, verify invariant holds after callback

4. **Liquidity logic** (`contracts/constant-product-pool/src/liquidity.rs`)
   - `add_liquidity(env, provider, amount_a_desired, amount_b_desired, amount_a_min, amount_b_min, deadline)`
     - Compute optimal amounts given current reserves
     - Mint LP tokens via LP token contract
     - Transfer tokens from provider
     - Emit `Mint` event
   - `remove_liquidity(env, provider, lp_amount, amount_a_min, amount_b_min, deadline)`
     - Burn LP tokens
     - Compute proportional share of reserves
     - Transfer tokens to provider
     - Emit `Burn` event

5. **TWAP oracle** (`contracts/constant-product-pool/src/twap.rs`)
   - `TwapState` struct: `price_accumulator_0` (cumulative sum of `log(reserve1/reserve0)` × time delta), `price_accumulator_1`, `last_timestamp`
   - `update(env, reserve_a, reserve_b, current_time)` — called at start of every swap
   - `consult(env, token_in, amount_in, window_seconds)` — returns TWAP price over window
   - Uses `u256` for accumulators to prevent overflow

6. **Main contract entry** (`contracts/constant-product-pool/src/lib.rs`)
   - `initialize(env, token_a, token_b, fee_tier, sqrt_price_x96)` — set pool parameters
   - Wire up all modules: swap, liquidity, fees, TWAP
   - `get_reserves(env)` — return `(reserve_a, reserve_b)`
   - `get_spot_price(env)` — return `reserve_b / reserve_a`
   - `get_twap_accumulators(env)` — return accumulator state

7. **Events** (`contracts/constant-product-pool/src/events.rs`)
   - `Swap { caller, token_in, token_out, amount_in, amount_out, price_impact, timestamp }`
   - `Mint { provider, amount_a, amount_b, lp_minted, timestamp }`
   - `Burn { provider, amount_a, amount_b, lp_burned, timestamp }`
   - `ProtocolFeesCollected { caller, amount_a, amount_b }`

8. **Tests** (`contracts/constant-product-pool/tests/`)
   - Test complete swap flow with various fee tiers (Bps25, Bps30, Bps100)
   - Test add/remove liquidity with correct LP token minting
   - Test slippage protection (`amount_out_min` reverts when exceeded)
   - Test deadline expiration reverts
   - Test flash swap borrow-repay flow
   - Test protocol fee accumulation and collection
   - Test TWAP accumulator updates across multiple swaps
   - Test edge cases: zero liquidity, minimum liquidity burned, large swaps near price limits
   - Fuzz test: random swaps followed by invariant check `reserve_a * reserve_b >= k`

---

## Day 4 — Backend: NestJS Foundation & Database Layer

**Goal:** Backend server boots, connects to database, entities are mapped, migrations run, and core infrastructure modules (config, caching, auth) are wired.

### Prompts

1. **Database connection** — Complete `database.module.ts` with TypeORM `forRootAsync`. Configure entities auto-loading, migration auto-run in dev, connection pooling (pool size from env). Create `timescale.module.ts` for TimescaleDB hypertable management.

2. **Token entity & repository** (`backend/src/database/entities/token.entity.ts`)
   - Fields: `id` (UUID), `symbol`, `name`, `contractAddress` (VARCHAR 56 unique), `decimals`, `logoUrl`, `isVerified`, `createdAt`
   - `TokenService` with `findOrCreate(contractAddress)` that checks chain metadata cache then falls back to Soroban contract call

3. **Pool entity & repository** (`backend/src/database/entities/pool.entity.ts`)
   - Fields matching SQL schema: `id`, `contractAddress`, `poolType` (enum), `token0`, `token1`, `feeBps`, `tickSpacing`, `amplification`, `reserve0`, `reserve1`, `sqrtPriceX96`, `currentTick`, `tvlUsd`, `volume24hUsd`, `feeRevenue24h`, `lpCount`, `isActive`, `createdAt`, `updatedAt`
   - Index on `(token0, token1, feeBps)`
   - `PoolService`: CRUD, `findByTokens(tokenA, tokenB)`, `updateReserves()`, `updateTvl()`

4. **LP Position entity** (`lp_position.entity.ts`)
   - Fields: `id`, `walletAddress`, `pool`, `lpTokenAmount`, `token0Deposited`, `token1Deposited`, `token0PriceAtEntry`, `feesEarnedToken0`, `feesEarnedToken1`, `createdAt`, `updatedAt`
   - Unique constraint on `(walletAddress, poolId)`

5. **CL Position entity** (`cl_position.entity.ts`)
   - Fields: `id`, `positionId` (bigint), `walletAddress`, `pool`, `tickLower`, `tickUpper`, `liquidity`, `token0Owed`, `token1Owed`, `isInRange`, `createdAt`, `updatedAt`

6. **Swap entity** (`swap.entity.ts`) — Time-series
   - Fields: `time` (TIMESTAMPTZ), `pool`, `walletAddress`, `tokenIn`, `tokenOut`, `amountIn`, `amountOut`, `amountInUsd`, `amountOutUsd`, `priceImpact`, `feeAmount`, `txHash`
   - Hypertable on `time` via TimescaleDB
   - `SwapService`: `recordSwap()`, `getSwapHistory(poolId, from, to)`, `getVolume24h(poolId)`

7. **Auth module** (`backend/src/modules/auth/`)
   - `WalletSignatureStrategy` — implement Sign-In With Stellar: generate challenge (random nonce), verify Stellar signed payload using `stellar-sdk` `Keypair.verify()`
   - `JwtStrategy` — validate JWT from `Authorization: Bearer` header, extract wallet address
   - `AuthController`: `POST /auth/challenge` (returns nonce), `POST /auth/verify` (returns JWT pair), `POST /auth/refresh`
   - `AuthGuard` — decorator that enforces JWT + wallet address

8. **Redis cache module** (`backend/src/shared/redis/`)
   - `CacheModule` wrapping `ioredis` with JSON serialization
   - Cache-aside pattern: `getOrSet(key, ttl, fetchFn)`
   - Used by routing engine, price feeds, pool data

9. **Configuration module** — Validate all env vars on startup using `class-validator`. `ConfigModule.forRoot({ load: [configuration, databaseConfig, stellarConfig] })`. Typed config interface matching README env vars.

10. **Seed script** (`backend/src/database/seeds/seed.ts`)
    - Insert common Stellar tokens (XLM, USDC, USDT, BTC, ETH wrapped)
    - Insert 3 demo pools: XLM/USDC (constant product, 30bps), USDC/USDT (stableswap, A=200), XLM/USDC (concentrated, 5bps)
    - Insert demo LP positions and historical swap data

---

## Day 5 — Backend: Pools, Swap & AMM Math Library

**Goal:** Backend can serve pool data, simulate quotes, and build swap transactions. The TypeScript AMM math library exactly mirrors the Rust contract math.

### Prompts

1. **AMM Math — Constant Product** (`backend/src/shared/amm-math/constant-product.math.ts`)
   - `getAmountOut(amountIn, reserveIn, reserveOut, feeBps)` — matches Day 3 Rust implementation exactly (including fee denominator)
   - `getAmountIn(amountOut, reserveIn, reserveOut, feeBps)` — mirror of Rust
   - `calcLpTokensMinted(amountA, amountB, reserveA, reserveB, totalSupply)` — geometric mean for initial, ratio thereafter
   - `calcLpTokensBurned(lpAmount, totalSupply, reserveA, reserveB)` → `(amountA, amountB)`
   - `getSpotPrice(reserveA, reserveB)` — returns price as decimal number
   - All input/output as `bigint` with same precision as Rust

2. **AMM Math — StableSwap** (`backend/src/shared/amm-math/stable-swap.math.ts`)
   - `getD(xs, a, n)` — Newton's method to solve the StableSwap invariant `A·n^n·Σx + D = A·D·n^n + D^(n+1)/(n^n·Πx)`
   - `getY(i, j, x, xs, a, d)` — calculate output amount for token j given input x of token i
   - `calculateSwap(i, j, dx, xs, a, fee)` — full swap calculation
   - `calculateTokenAmount(amounts, xs, a, deposit)` — LP token calc for add/remove

3. **AMM Math — Concentrated Liquidity** (`backend/src/shared/amm-math/concentrated.math.ts`)
   - `tickToPrice(tick)` / `priceToTick(price)` — tick ↔ sqrt price conversions (Q64.96)
   - `getAmount0Delta(sqrtRatioA, sqrtRatioB, liquidity, roundUp)` — token0 amount for a range
   - `getAmount1Delta(sqrtRatioA, sqrtRatioB, liquidity, roundUp)` — token1 amount for a range
   - `getNextSqrtPriceFromInput(sqrtP, liquidity, amountIn, zeroForOne)` — tick-crossing step
   - `computeSwapStep(sqrtP, sqrtPTarget, liquidity, amountIn, fee)` — single swap step within one tick

4. **AMM Math Parity test** (`backend/src/shared/amm-math/__tests__/parity.test.ts`)
   - Hardcode known inputs, compute outputs in TS, compare to expected values
   - Test every math function against 100+ random inputs
   - Document output format so Rust tests can consume same vectors

5. **Pools module** (`backend/src/modules/pools/`)
   - `PoolsService`: `listPools(filters, pagination)`, `getPool(id)`, `getPoolByAddress(contractAddress)`, `getPoolReserves(id)`
   - `PoolFactoryService`: `buildCreatePoolTx(tokenA, tokenB, poolType, feeTier, amplification)` — construct unsigned XDR
   - `PoolsController`: `GET /pools`, `GET /pools/:id`, `GET /pools/:id/reserves`, `GET /pools/:id/stats`, `POST /pools/create`
   - `PoolsGateway` (WebSocket): `subscribe:pool` → emits `pool:reserves` on reserve changes

6. **Swap module** (`backend/src/modules/swap/`)
   - `SwapService`: `getQuote(tokenIn, tokenOut, amountIn, poolId?)` — simulate swap using AMM math, returns `{ amountOut, priceImpact, route, effectivePrice, fee }`
   - `buildSwapTransaction(quote, userAddress, slippage, deadline)` — construct unsigned XDR via Soroban contract invocation
   - `SwapController`: `GET /swap/quote`, `POST /swap/build`, `GET /swap/price-impact`
   - `SwapGateway` (WebSocket): `subscribe:quote` → streams updated quotes as reserves change

7. **Swap route visualization types** (`backend/src/modules/swap/dto/`)
   - `SwapQuoteResponse`: `{ tokenIn, tokenOut, amountIn, amountOut, priceImpact, route: SwapRoute, fee, effectivePrice }`
   - `SwapRoute`: `{ pools: PoolHop[], path: string[], totalPriceImpact }`
   - `PoolHop`: `{ poolId, poolType, tokenIn, tokenOut, amountIn, amountOut, priceImpact, fee }`

8. **Validation DTOs** — `class-validator` on all inputs: `@IsStellarAddress()` custom decorator, `@IsBigIntString()`, `@MinSlippage(0.001)`, `@MaxPriceImpact(0.15)`

---

## Day 6 — Backend: Routing Engine, Indexer & Analytics

**Goal:** The smart order router finds optimal multi-hop paths. The indexer listens to Soroban events and keeps the DB in sync. Basic analytics endpoints serve TVL, volume, and fee data.

### Prompts

1. **Pool graph** (`backend/src/modules/routing/graph.service.ts`)
   - Build a weighted directed graph from all active pools using `graphology`
   - Each pool is an edge between its token nodes
   - Edge weight = `1 / (1 - priceImpact)` (lower impact = preferred)
   - Cache graph in Redis, rebuild every 30s or on pool creation

2. **Routing engine** (`backend/src/modules/routing/routing.service.ts`)
   - Modified Dijkstra's algorithm: find top-K paths (up to `MAX_HOPS=3`)
   - For each path, simulate via `ammMath.simulateSwap()` across each hop
   - Return best path by `amountOut`
   - `findBestRoute(tokenIn, tokenOut, amountIn, maxHops, maxRoutes)` → `RouteResult`
   - `findAllPaths(tokenIn, tokenOut, maxHops)` — BFS/DFS limited by depth

3. **Split routing** (`backend/src/modules/routing/split-route.service.ts`)
   - Take top-2 paths, optimize split ratio (20%-80% increments, 5% step)
   - Return split route if it beats single-path output
   - `optimizeSplit(paths, amountIn)` → `SplitRouteResult | null`

4. **Quote aggregator** (`backend/src/modules/routing/quote-aggregator.service.ts`)
   - Combines best-path and split-route results
   - Caches quotes in Redis (keyed by `tokenIn:tokenOut:amountIn`, TTL 2s from README)
   - `getBestQuote(tokenIn, tokenOut, amountIn)` → cached or computed

5. **Stellar indexer** (`backend/src/modules/indexer/stellar-indexer.service.ts`)
   - Poll Soroban RPC for new ledgers (configurable interval from env)
   - Parse contract events: `Swap`, `Mint`, `Burn`, `PoolCreated`, `FeeCollected`
   - Deduplicate by `txHash + eventIndex`
   - Track `last_processed_ledger` cursor in Redis
   - Emit events on internal RabbitMQ exchange for downstream processors

6. **Swap indexer** (`backend/src/modules/indexer/swap-indexer.service.ts`)
   - Subscribe to swap events from `StellarIndexerService`
   - Decode swap event data (token amounts, pool address, price impact)
   - Record to `swaps` hypertable
   - Update pool `volume24hUsd`, `reserve0`, `reserve1`
   - Invalidate relevant caches

7. **Liquidity indexer** (`backend/src/modules/indexer/liquidity-indexer.service.ts`)
   - Subscribe to `Mint` / `Burn` events
   - Upsert `lp_positions` or `cl_positions` records
   - Update pool `lpCount`, reserves
   - Emit `pool:reserves` via WebSocket

8. **Analytics — TVL** (`backend/src/modules/analytics/tvl.service.ts`)
   - Compute TVL per pool: `reserve0 * price0 + reserve1 * price1`
   - Snapshot every 5 minutes to `tvl_snapshots` hypertable
   - `getTvl(poolId?, interval?)` — total or per-pool with time range
   - `getProtocolTvl()` — sum of all active pools

9. **Analytics — Volume & Fees** (`backend/src/modules/analytics/volume.service.ts`, `fee-revenue.service.ts`)
   - `getVolume24h(poolId?)`, `getVolume7d(poolId?)` — aggregate from `swaps` hypertable
   - `getFeeRevenue24h(poolId?)` — sum of fees from swaps
   - `getLeaderboard(topN, metric)` — top pools by volume/TVL/fees

10. **Routing controller** (`backend/src/modules/routing/`)
    - `GET /routing/best-path?tokenIn=X&tokenOut=Y&amountIn=100` — returns best path + quote
    - `GET /routing/all-paths?tokenIn=X&tokenOut=Y` — returns all possible paths

---

## Day 7 — Frontend: Angular App Core, Wallet & Store

**Goal:** Angular app boots, connects to wallets, has a working NgRx store, and can communicate with the backend API.

### Prompts

1. **Angular app shell** (`frontend/src/app/`)
   - `app.config.ts` — provide Angular router (with `provideRouter`), NgRx store, Angular Material theming
   - `app.routes.ts` — lazy-load routes: `swap`, `liquidity`, `pool-explorer`, `farm`, `portfolio`, `governance`, `analytics`, `create-pool`
   - Layout component: top navbar with logo, nav links, wallet connect button, theme toggle; sidebar for mobile; footer with social links from README
   - `styles/` — Tailwind CSS config, SCSS variables matching SoroPool brand (blue `#00C6FF` accent)

2. **Wallet service** (`frontend/src/app/core/services/wallet.service.ts`)
   - Integrate `@stellar/freighter-api` for Freighter wallet detection
   - `connect()` — request wallet access, get public key
   - `disconnect()` — clear stored session
   - `signTransaction(xdr)` — delegate to Freighter `signTransaction`
   - `isConnected` signal, `walletAddress` signal
   - Use `albedo-wallet` and `xbull-wallet` as fallback adapters

3. **Stellar service** (`frontend/src/app/core/services/stellar.service.ts`)
   - `getAccountBalances(address)` — fetch token balances from Horizon
   - `submitTransaction(signedXdr)` — submit via Soroban RPC
   - `getTokenDetails(contractId)` — fetch token name, symbol, decimals from contract
   - `getPoolReserves(poolAddress)` — call `get_reserves` view function

4. **AMM Math service** (`frontend/src/app/core/services/amm-math.service.ts`)
   - TypeScript implementation of `getAmountOut`, `getAmountIn`, `calcLpTokens` for client-side swap simulation
   - Mirrors the backend AMM math (readme § AMM Math Library)
   - Used for instant preview before API call

5. **Price feed service** (`frontend/src/app/core/services/price-feed.service.ts`)
   - WebSocket connection to backend `ws://localhost:3001`
   - Auto-reconnect with exponential backoff
   - Subscribe to `pool:reserves`, `quote:update`, `stats:update`
   - Expose RxJS subjects: `poolReserves$`, `quoteUpdates$`, `protocolStats$`

6. **NgRx store — Auth** (`frontend/src/app/core/store/auth/`)
   - Actions: `connectWallet`, `disconnectWallet`, `setJwt`, `refreshJwt`
   - Reducer state: `walletAddress`, `isConnected`, `jwtToken`
   - Effects: on `connectWallet` → get challenge from backend → sign → verify → store JWT

7. **NgRx store — Pools** (`frontend/src/app/core/store/pools/`)
   - Actions: `loadPools`, `loadPoolDetail`, `selectPool`, `updatePoolReserves`
   - Reducer state: `pools[]`, `selectedPool`, `poolStats`, `loading`
   - Effects: fetch pools from `GET /api/v1/pools`, subscribe to real-time updates via WebSocket

8. **NgRx store — Swap** (`frontend/src/app/core/store/swap/`)
   - Actions: `setTokenIn`, `setTokenOut`, `setAmountIn`, `setSlippage`, `setDeadline`, `getQuote`, `updateQuote`, `resetSwap`
   - Reducer state: `tokenIn`, `tokenOut`, `amountIn`, `quote`, `route`, `slippageTolerance` (default 0.5%), `deadline` (30 min), `priceImpactWarning`
   - Effects: debounced `getQuote` → call `GET /api/v1/swap/quote` → dispatch `updateQuote`
   - Selectors: `selectSwapQuote`, `selectSwapRoute`, `selectMinAmountOut`, `selectPriceImpactSeverity`

9. **Wallet connect button component** (`frontend/src/app/shared/components/wallet-connect-button/`)
   - Displays `Connect Wallet` when disconnected, truncated address when connected
   - Dropdown: disconnect, view on Stellar Explorer
   - Loading state during connection

10. **Token amount input component** (`frontend/src/app/shared/components/token-amount-input/`)
    - Amount input (big number formatting with commas, max button)
    - Token selector dropdown (searchable list of known tokens from store)
    - USD equivalent display (from price feed)
    - Balance display (from Stellar service)

---

## Day 8 — Frontend: Swap UI, Pool Explorer & Liquidity Components

**Goal:** Users can see pools, simulate swaps with route visualization, and manage basic liquidity positions.

### Prompts

1. **Swap component** (`frontend/src/app/features/swap/swap.component.ts`)
   - Two `sp-token-amount-input` instances (token in / token out) with reverse button
   - Slippage settings panel (0.1%, 0.5%, 1% presets + custom input)
   - Deadline input (minutes)
   - Quote display: amount out, price impact badge (low/medium/high/critical from README § Swap Component), minimum received
   - Route display: visual multi-hop path (token → pool → token → pool → token)
   - Swap button: disabled when not connected, zero amount, or price impact exceeds 15% (matches README threshold)
   - `executeSwap()` flow: build tx → sign → submit → show success modal
   - Use NgRx swap store for all state

2. **Price impact badge** (`frontend/src/app/shared/components/price-impact-badge/`)
   - Color-coded: green (<1%), yellow (1-5%), orange (5-15%), red (>15%)
   - Shows % with tooltip explaining price impact

3. **Route display** (`frontend/src/app/features/swap/route-display/`)
   - Horizontal flow diagram: token icon → pool name → token icon → pool name → token icon
   - Each pool shows type badge (CP/Stable/CL) and fee tier
   - Each hop shows amount and price impact
   - Split routes shown as parallel flows

4. **Pool list** (`frontend/src/app/features/liquidity/pool-list/`)
   - Table/card view of all pools with columns: pair, type, fee tier, TVL (USD), volume 24h, APR, liquidity depth
   - Search/filter by token symbol or pool type
   - Click navigates to pool detail
   - Data from `GET /api/v1/pools` and `GET /api/v1/pools/:id/stats`

5. **Add liquidity component** (`frontend/src/app/features/liquidity/add-liquidity/`)
   - Token pair display with pool info
   - Two `sp-token-amount-input` instances for token A and B
   - Price and share preview: estimated LP tokens minted, % of pool, price range
   - Slippage settings (same component as swap)
   - Preview modal: amounts, LP tokens, share of pool
   - Build → sign → submit flow

6. **Remove liquidity component** (`frontend/src/app/features/liquidity/remove-liquidity/`)
   - Display user's LP token balance for the pool
   - Slider or percentage selector (25%, 50%, 75%, 100%, custom)
   - Preview of tokens to receive
   - Build → sign → submit flow

7. **Pool detail / explorer** (`frontend/src/app/features/pool-explorer/`)
   - Pool overview: TVL, volume 24h, fees 24h, APR, liquidity depth
   - Reserve ratio chart (token A vs token B)
   - Recent transactions table (from `swaps` API)
   - Price chart placeholder (TradingView Lightweight Charts)

8. **Concentrated LP range selector** (`frontend/src/app/shared/components/price-range-selector/`)
   - Min/max price inputs with current price indicator
   - Capital efficiency display: "Xx vs full range" (matching README formula)
   - Full range button (min -887272, max 887272)
   - Common range presets: ±10%, ±25%, ±50%

9. **Token selector component** (`frontend/src/app/shared/components/token-selector/`)
   - Modal/drawer with searchable token list
   - Each row: logo, symbol, name, balance, USD value
   - "Manage tokens" link to add custom token by contract address
   - Imported from NgRx `pools` state

10. **Transaction confirmation modal** (`frontend/src/app/shared/components/tx-confirm-modal/`)
    - Review step: show all transaction details before signing
    - Signing step: waiting for wallet signature with spinner
    - Submitted step: tx hash link to Stellar Explorer
    - Error step: retry or dismiss

---

## Day 9 — Infrastructure, DevOps & CI/CD

**Goal:** Full local development environment works via Docker Compose. CI pipeline runs tests. Kubernetes manifests ready for staging.

### Prompts

1. **Docker Compose** (`docker-compose.yml`)
   - Services: `postgres` (TimescaleDB), `redis` (7-alpine), `rabbitmq` (3.12-management), `backend` (multi-stage build), `frontend` (with nginx for production, ng serve for dev)
   - Health checks on DB, Redis
   - Named volumes for persistence
   - Environment variables match `.env.example`
   - Backend depends on postgres (healthy), redis, rabbitmq
   - Frontend depends on backend

2. **Backend Dockerfile** (`backend/Dockerfile`)
   - Multi-stage: `development` (npm install, `npm run start:dev`), `builder` (compile), `production` (distroless Node 20, run compiled output)
   - `HEALTHCHECK --interval=30s --timeout=3s CMD node healthcheck.js`

3. **Frontend Dockerfile** (`frontend/Dockerfile`)
   - Multi-stage: `development` (ng serve with live reload), `builder` (ng build --configuration production), `production` (nginx:alpine, serve static from `/usr/share/nginx/html`)
   - Include `frontend/nginx.conf` with gzip, cache headers, SPA routing fallback

4. **Nginx config** (`frontend/nginx.conf`)
   - Reverse proxy `/api/` and `/ws/` to backend
   - Strict CSP headers (matching README security section)
   - SRI hashes for static assets
   - Gzip compression for JS/CSS
   - Cache-control headers for assets (1y for hashed files)

5. **GitHub Actions — CI** (`.github/workflows/ci.yml`)
   - `test-contracts`: install Rust with wasm target, `cargo build`, `cargo test`, `cargo clippy`, check .wasm size ≤ 64KB
   - `test-backend`: services (postgres+redis), `npm ci`, `npm run lint`, `npm run test:cov`
   - `test-frontend`: `npm ci`, `npm run lint`, `ng test --no-watch --browsers=ChromeHeadless`, `ng build`
   - `amm-math-parity`: run TS ↔ Rust math parity tests
   - Artifacts: coverage reports, build outputs
   - Caching: `actions/cache` for Rust `~/.cargo` and `target/`, npm `~/.npm`

6. **GitHub Actions — Staging CD** (`.github/workflows/cd-staging.yml`)
   - Trigger: push to `develop`
   - Build Docker images, push to registry (GHCR)
   - `kubectl set image` on staging namespace
   - Run DB migrations via job
   - Smoke test: `GET /api/v1/pools` returns 200

7. **Kubernetes manifests** (`infrastructure/kubernetes/`)
   - `deployments/backend.yaml`, `deployments/frontend.yaml`, `deployments/indexer.yaml` — resource requests/limits, liveness/readiness probes, pod anti-affinity
   - `services/` — ClusterIP for internal, LoadBalancer for public
   - `ingress/` — TLS with cert-manager, host rules for `staging.soropool.finance`
   - `configmaps/` — backend config (non-secret vars), nginx config
   - `hpa/backend-hpa.yaml` — CPU/Memory/WebSocket-connections based autoscaling (matching README spec)
   - `pdb/` — PodDisruptionBudget: min 2 available

8. **Terraform stubs** (`infrastructure/terraform/`)
   - `modules/vpc/` — VPC with public/private subnets, NAT gateway
   - `modules/eks/` — EKS cluster with managed node group (t3.medium, 3-10 nodes)
   - `modules/rds/` — PostgreSQL RDS (db.r6g.large, Multi-AZ)
   - `modules/elasticache/` — Redis ElastiCache (cache.r6g.large, cluster mode)
   - `modules/cdn/` — CloudFront distribution for frontend
   - `environments/dev/`, `staging/`, `prod/` — `backend.tf`, `terraform.tfvars`

9. **Monitoring — Prometheus** (`infrastructure/monitoring/prometheus/`)
   - `prometheus.yml` — scrape config for backend (:3000/metrics), node exporter, kube-state-metrics
   - Recording rules for TVL, volume, fee revenue (matching README metrics)
   - Alerting rules from README: indexer lag, API error rate, stale TWAP, TVL drop

10. **Monitoring — Grafana** (`infrastructure/monitoring/grafana/`)
    - Dashboard JSONs: Protocol Overview, Swap Analytics, Liquidity Depth, Indexer Health (as specified in README)
    - Datasource config for Prometheus + TimescaleDB (via postgres datasource)

---

## Day 10 — Testing, Documentation & Integration Finalization

**Goal:** All tests pass, contributor documentation is in place, the codebase is "55% complete" — enough that a new developer can clone, run, and start contributing.

### Prompts

1. **Smart contract — StableSwap pool scaffold** (`contracts/stableswap-pool/src/`)
   - `lib.rs` with `initialize`, `add_liquidity`, `remove_liquidity_one_coin`, `exchange`, `get_a`, `get_d`
   - `invariant.rs` — implement `compute_d(xs, a, n)` with Newton's method (same formula as README § StableSwap)
   - `amplification.rs` — `ramp_a(future_a, future_time)` with linear interpolation
   - Wire up LP token mint/burn via shared LP token contract
   - Test `exchange` with demo 3-coin pool (USDC/USDT/DAI)

2. **Smart contract — Concentrated liquidity pool scaffold** (`contracts/concentrated-liquidity-pool/src/`)
   - `lib.rs` with `mint_position`, `increase_liquidity`, `decrease_liquidity`, `collect_fees`, `swap`
   - `tick.rs` — tick bitmap (256-bit chunks), `cross_tick(tick)` — flip initialized bit, update fee growth
   - `sqrt_price.rs` — Q64.96 math: `sqrt(price)`, `get_amount_0_delta`, `get_amount_1_delta`
   - `position.rs` — position storage: `Position { liquidity, feeGrowthInside0, feeGrowthInside1, tokensOwed0, tokensOwed1 }`
   - Test basic mint + swap across a single tick

3. **Smart contract — Router scaffold** (`contracts/router/src/`)
   - `lib.rs` with `swap_exact_tokens_for_tokens` and `swap_tokens_for_exact_tokens`
   - `path.rs` — path encoding: `[token, fee, token, fee, ...]`
   - `quote.rs` — view function to simulate multi-hop quote
   - Test single-hop and two-hop swaps

4. **Backend — Service tests**
   - `PoolsService` — unit test with mock repository
   - `SwapService` — test quote simulation for all three pool types
   - `RoutingService` — test path finding on a mock 5-pool graph
   - `AnalyticsService` — test TVL computation, volume aggregation
   - `AuthService` — test challenge generation and signature verification
   - All test files at `backend/src/**/*.spec.ts`

5. **Frontend — Component tests**
   - `SwapComponent` — test token selection triggers quote fetch, price impact warning at 15%
   - `TokenAmountInput` — test formatting, max button, validation
   - `PoolListComponent` — test rendering with mock pools
   - `WalletConnectButton` — test connect/disconnect flow
   - Use `jest` + `@testing-library/angular` for component tests

6. **Frontend — E2E tests** (`frontend/e2e/`)
   - `swap.cy.ts` — Cypress E2E: connect wallet → select tokens → enter amount → verify quote → simulate swap
   - `liquidity.cy.ts` — navigate to pool → add liquidity → verify position appears
   - Mock API responses for deterministic testing

7. **Documentation — `CONTRIBUTING.md`**
   - Setup instructions (matching README § Getting Started)
   - Code style guide (matching README § Commit Convention): feat/fix/perf/math/contract/docs/test/chore
   - PR process: fork → branch → test → lint → conventional commit → PR
   - How to run tests: `make test`
   - How to add a new pool type

8. **Documentation — `docs/architecture/`**
   - `overview.md` — architecture diagram (links of boxes from README § Architecture Overview, rendered as Mermaid)
   - `data-flow.md` — swap flow: UI → API → Router → Contract → Indexer → DB → UI
   - `contracts.md` — contract interaction diagram (factory deploys pools, router calls pools, pool mints LP tokens)

9. **Documentation — `docs/math/`**
   - `constant-product.md` — formula derivation with examples
   - `stable-swap.md` — D invariant Newton method explanation
   - `concentrated-liquidity.md` — tick math, Q64.96 fixed point, fee growth per unit liquidity

10. **Integration smoke test** (`scripts/smoke-test.sh`)
    - `docker compose up -d` — all services running
    - `curl GET /api/v1/pools` — returns pool list
    - `curl GET /api/v1/swap/quote?tokenIn=XLM&tokenOut=USDC&amountIn=100` — returns valid quote
    - WebSocket connection test via `wscat`
    - Print "SoroPool 55% — READY FOR CONTRIBUTORS"

---

## Summary: 55% Completion Milestone

| Component | Day(s) | Est. Completion | What's Built |
|-----------|--------|-----------------|--------------|
| Shared Rust lib (math/types) | 1 | 100% | Fixed-point math, core types, error enum |
| Pool Factory contract | 2 | 100% | Deploy + register all pool types |
| LP Token contract | 2 | 100% | Mint/burn/transfer with access control |
| Constant Product Pool | 3 | 100% | Swap, liquidity, fees, TWAP, events, tests |
| StableSwap Pool | 10 | 40% | Scaffold + D invariant + exchange |
| Concentrated Liquidity Pool | 10 | 40% | Scaffold + ticks + sqrt price + basic swap |
| Router contract | 10 | 50% | Scaffold + path encoding + quote + single-hop |
| Farm / Governance / Treasury | — | 5% | Directory stubs only (awaiting phase 2) |
| Backend NestJS scaffold | 1,4 | 100% | Config, DB entities, auth, seed data |
| Backend AMM Math (TS) | 5 | 95% | CP + Stable + CL math, parity tests |
| Backend Pools + Swap modules | 5 | 90% | Pool CRUD, quotes, tx building, WebSocket |
| Backend Routing Engine | 6 | 90% | Dijkstra pathfinding, split routing, cache |
| Backend Indexer | 6 | 70% | Soroban event polling + swap/liquidity indexers |
| Backend Analytics | 6 | 60% | TVL, volume, fees, leaderboard endpoints |
| Frontend Angular scaffold | 1,7 | 100% | Routes, store, wallet, services, PWA setup |
| Frontend Swap UI | 8 | 85% | Swap form, quote display, route visualization |
| Frontend Pool Explorer | 8 | 60% | Pool list, pool detail, price chart placeholder |
| Frontend Liquidity UI | 8 | 50% | Add/remove liquidity, CL range selector |
| Infrastructure / Docker / K8s | 9 | 70% | Docker Compose, CI/CD, K8s manifests, monitoring |
| Testing | 10 | 60% | Contract tests, backend unit + e2e, frontend unit + e2e |
| Documentation | 10 | 50% | CONTRIBUTING.md, architecture docs, math docs |

**Overall: ~55% complete** — core AMM math and constant-product pool are fully shipped, backend serves quotes and routes, frontend displays swaps and pools, and the CI pipeline validates everything. All major directories have code, not just stubs. New contributors can pick up StableSwap, Concentrated Liquidity, Farm, Governance, and remaining frontend features.
