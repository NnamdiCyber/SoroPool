# 🌊 SoroPool — Automated Market Maker & Liquidity Pool Protocol

<div align="center">

![SoroPool Banner](https://img.shields.io/badge/SoroPool-AMM%20Protocol-00C6FF?style=for-the-badge&logo=stellar&logoColor=white)

[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Angular](https://img.shields.io/badge/Angular-17.x-DD0031?style=flat-square&logo=angular)](https://angular.io/)
[![Rust](https://img.shields.io/badge/Rust-1.75+-000000?style=flat-square&logo=rust)](https://www.rust-lang.org/)
[![Soroban](https://img.shields.io/badge/Stellar-Soroban-7B61FF?style=flat-square&logo=stellar)](https://soroban.stellar.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**A fully decentralized, non-custodial Automated Market Maker (AMM) and liquidity pool protocol built on Stellar's Soroban smart contract platform — enabling permissionless token swaps, concentrated liquidity provisioning, multi-hop routing, yield farming, and deep protocol integrations with institutional-grade performance.**

[Live App](https://soropool.finance) · [Documentation](https://docs.soropool.finance) · [API Reference](https://api.soropool.finance/docs) · [Analytics](https://analytics.soropool.finance) · [Bug Reports](https://github.com/soropool/soropool/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Protocol Mechanics](#-protocol-mechanics)
- [Key Features](#-key-features)
- [Architecture Overview](#-architecture-overview)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Smart Contracts (Soroban)](#-smart-contracts-soroban)
- [Backend — NestJS](#-backend--nestjs)
- [Frontend — Angular](#-frontend--angular)
- [Infrastructure & DevOps](#-infrastructure--devops)
- [Database Design](#-database-design)
- [Security](#-security)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Monitoring & Observability](#-monitoring--observability)
- [Tokenomics — SPL Token](#-tokenomics--spl-token)
- [Contributing](#-contributing)
- [Audits & Compliance](#-audits--compliance)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🌐 Overview

SoroPool is a next-generation decentralized exchange (DEX) and liquidity infrastructure protocol built on **Stellar's Soroban** smart contract platform. It enables users to:

- **Swap** tokens instantly with minimal slippage via constant-product and stable-swap AMM curves
- **Provide Liquidity** to earn trading fees and yield farming rewards
- **Stake LP tokens** to earn protocol emissions and governance rights
- **Create Pools** permissionlessly — any token pair, any curve type
- **Route Trades** optimally across multi-hop paths for best execution
- **Govern** the protocol through the SPL DAO with on-chain voting

SoroPool implements a battle-tested AMM model with three distinct curve types — constant-product (x·y=k), StableSwap, and concentrated liquidity — giving liquidity providers full control over their capital efficiency while traders enjoy deep liquidity and low-slippage execution.

### Protocol at a Glance

```
                    ┌───────────────────────────────────────────────────┐
                    │                 SOROPOOL PROTOCOL                  │
                    │                                                    │
  Traders ─────────▶   Smart Order Router  ◀─────────── Arbitrageurs   │
                    │          │                                        │
                    │    ┌─────▼──────┐  ┌──────────────┐              │
                    │    │ Pool A     │  │ Pool B       │              │
                    │    │ x·y = k    │  │ StableSwap   │              │
                    │    │ XLM/USDC   │  │ USDC/USDT    │              │
                    │    └─────▲──────┘  └──────▲───────┘              │
                    │          │                │                       │
  LPs ─────────────▶    Liquidity Vaults        │                       │
                    │          │                │                       │
                    │    LP Tokens + Fee Accrual + Farming Rewards      │
                    └───────────────────────────────────────────────────┘
```

| Metric | Value |
|--------|-------|
| Swap Fee (Standard Pools) | 0.30% |
| Swap Fee (Stable Pools) | 0.05% |
| Swap Fee (Concentrated) | 0.01% – 1.00% (configurable) |
| Protocol Fee | 16.67% of swap fees → treasury |
| LP Fee Share | 83.33% of swap fees |
| Minimum Liquidity | 1,000 LP tokens (burned on pool creation) |
| Price Impact Protection | Configurable slippage tolerance |

---

## ⚙️ Protocol Mechanics

### AMM Curve Types

#### 1. Constant Product (x · y = k)
The classic Uniswap v2-style curve used for volatile asset pairs.

```
x · y = k

where:
  x = reserve of token A
  y = reserve of token B
  k = constant (invariant)

Price of A in terms of B:
  P(A) = y / x

Amount out for a swap of Δx:
  Δy = (y · Δx) / (x + Δx)   [before fee]
  Δy = (y · Δx · (1 - fee)) / (x + Δx · (1 - fee))   [after fee]

Price impact:
  Impact = Δx / (x + Δx)   (as a fraction)
```

#### 2. StableSwap (Curve-style)
Optimized for pegged assets (stablecoins, wrapped assets) with lower slippage near the peg.

```
A · n^n · Σxi + D = A · D · n^n + D^(n+1) / (n^n · Πxi)

where:
  A   = amplification coefficient (controls curve "flatness")
  n   = number of tokens in pool
  D   = total invariant
  xi  = balance of token i

Higher A → flatter curve → lower slippage near peg
A = 0   → reverts to constant-product curve
A = ∞   → constant-sum (x + y = k)
```

#### 3. Concentrated Liquidity (v3-style)
LPs define custom price ranges `[Pa, Pb]` for capital-efficient deployment.

```
Real reserves ↔ Virtual reserves mapping:

  x_virtual = x_real + L / √Pb
  y_virtual = y_real + L · √Pa

  where L = liquidity (√(x·y))

Active liquidity at price P:
  L = Δy / (√P_upper - √P_lower)

Capital efficiency gain vs full-range:
  efficiency = √(P_upper/P_lower) / (√(P_upper/P_lower) - 1)
```

### Multi-Hop Smart Order Routing

The SoroPool router finds optimal trade paths across all pools:

```
Direct swap:        A ──────────▶ B
Two-hop:           A ──▶ USDC ──▶ B
Three-hop:         A ──▶ XLM ──▶ USDC ──▶ B
Split routing:     A ──60%──▶ Pool1 ──▶ B
                     ──40%──▶ Pool2 ──▶ B

Optimization target: maximize amountOut (or minimize amountIn)
Algorithm: Dijkstra's shortest path on weighted pool graph
```

---

## ✨ Key Features

### Protocol Features
- **Three AMM Curve Types** — Constant product, StableSwap, and Concentrated Liquidity
- **Smart Order Router** — Multi-hop and split-route optimization for best execution
- **Permissionless Pool Creation** — Any Soroban token pair can create a pool
- **Concentrated Liquidity** — Custom price ranges for capital-efficient LP positions
- **Single-Sided Liquidity** — Add or remove one token at a time (with auto-swap)
- **Flash Swaps** — Borrow pool reserves within a single transaction
- **Yield Farming** — Stake LP tokens in farm contracts to earn SPL emissions
- **Protocol-Owned Liquidity** — DAO-managed treasury liquidity positions
- **Fee Tiers** — Multiple fee tiers per pool type for market-appropriate pricing
- **TWAP Oracles** — Built-in time-weighted average price oracles per pool

### Platform Features
- **Real-Time Swap Interface** — Price impact, route visualization, and slippage simulation
- **Liquidity Management Dashboard** — Track positions, earned fees, and impermanent loss
- **Portfolio Analytics** — Historical P&L, IL calculator, and APR estimator
- **Farm & Stake Interface** — One-click farm deposit, harvest, and compound
- **Pool Explorer** — Deep analytics per pool: volume, TVL, fees, APR history
- **Price Charts** — Candlestick and line charts powered by on-chain TWAP data
- **Notifications** — Price range out-of-range alerts for concentrated LP positions
- **Multi-Wallet Support** — Freighter, xBull, Albedo, and WalletConnect

---

## 🏛️ Architecture Overview

SoroPool follows a layered architecture: Soroban on-chain contracts form the settlement layer, a NestJS backend provides indexing and API services, and an Angular PWA delivers the user experience.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT LAYER                                       │
│                          Angular 17 SPA (PWA)                                    │
│                                                                                  │
│   Swap UI  │  Liquidity Manager  │  Farm & Stake  │  Pool Explorer  │  Analytics │
└──────────────────────────────────┬───────────────────────────────────────────────┘
                                   │ HTTPS / WebSocket
┌──────────────────────────────────▼───────────────────────────────────────────────┐
│                           API GATEWAY — NestJS                                    │
│                                                                                  │
│   REST API  │  WebSocket Gateway  │  GraphQL  │  Auth (SIWS/JWT)  │  Rate Limit  │
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Swap        │  │  Pool        │  │  Liquidity   │  │  Routing Engine      │ │
│  │  Service     │  │  Service     │  │  Service     │  │  Service             │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Farm        │  │  TWAP Oracle │  │  Indexer     │  │  Analytics           │ │
│  │  Service     │  │  Service     │  │  Service     │  │  Service             │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Governance  │  │  Notification│  │  Price Chart │  │  Admin               │ │
│  │  Service     │  │  Service     │  │  Service     │  │  Service             │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└────────┬─────────────────┬────────────────────┬─────────────────────────────────┘
         │                 │                    │
┌────────▼───────┐ ┌───────▼───────┐ ┌──────────▼──────┐ ┌──────────────────────┐
│  PostgreSQL    │ │    Redis      │ │   RabbitMQ      │ │   TimescaleDB        │
│  (Primary DB)  │ │  (Cache/Pub)  │ │  (Event Bus)    │ │   (Price History)    │
└────────────────┘ └───────────────┘ └─────────────────┘ └──────────────────────┘
         │
┌────────▼─────────────────────────────────────────────────────────────────────────┐
│                          STELLAR / SOROBAN LAYER                                  │
│                                                                                  │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│ │ Pool Factory│ │ Constant    │ │ StableSwap  │ │ Conc. Liq.  │ │ Router     │ │
│ │ Contract    │ │ Product Pool│ │ Pool        │ │ Pool        │ │ Contract   │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│ │ LP Token    │ │ Farm /      │ │ Governance  │ │ Treasury    │ │ TWAP       │ │
│ │ Contract    │ │ Staking     │ │ Contract    │ │ Contract    │ │ Oracle     │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack

### Smart Contracts
| Component | Technology | Version |
|-----------|------------|---------|
| Platform | Stellar Soroban | Latest |
| Language | Rust | 1.75+ |
| SDK | soroban-sdk | 20.x |
| Math Library | soroban-fixed-point-math | Custom |
| Testing | soroban-sdk test utilities | 20.x |
| CLI | soroban-cli | Latest |

### Backend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | NestJS | 10.x |
| Language | TypeScript | 5.x |
| Runtime | Node.js | 20 LTS |
| ORM | TypeORM | 0.3.x |
| Primary DB | PostgreSQL | 15.x |
| Time-Series DB | TimescaleDB | 2.x |
| Cache | Redis | 7.x |
| Message Queue | RabbitMQ | 3.12 |
| API Docs | Swagger / OpenAPI 3 | 3.0 |
| Real-time | Socket.IO | 4.x |
| Validation | class-validator | 0.14.x |
| Auth | Passport.js + JWT | — |
| Scheduling | @nestjs/schedule | 3.x |
| Graph Algorithms | graphology | 0.25.x |
| Blockchain SDK | stellar-sdk | 11.x |

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Angular | 17.x |
| Language | TypeScript | 5.x |
| State Management | NgRx | 17.x |
| UI Components | Angular Material + Custom DS | 17.x |
| Styling | SCSS + Tailwind CSS | — |
| Charts | TradingView Lightweight Charts + D3.js | — |
| AMM Math | Custom TS math library (mirrors contracts) | — |
| Wallet | Freighter API + WalletConnect | 2.x |
| Animations | Angular Animations + GSAP | — |
| PWA | @angular/pwa | 17.x |
| i18n | @ngx-translate | 15.x |
| Testing | Jest + Cypress | — |

### Infrastructure
| Component | Technology |
|-----------|------------|
| Containerization | Docker + Docker Compose |
| Orchestration | Kubernetes (EKS/GKE) |
| CI/CD | GitHub Actions |
| IaC | Terraform |
| Reverse Proxy | Nginx |
| CDN | Cloudflare |
| Monitoring | Prometheus + Grafana |
| Logging | ELK Stack |
| Tracing | OpenTelemetry + Jaeger |
| Secrets | HashiCorp Vault |
| Cloud | AWS (primary) |

---

## 📁 Repository Structure

```
soropool/
├── 📁 contracts/                            # Soroban smart contracts (Rust)
│   ├── pool-factory/                        # Factory for deploying new pools
│   │   ├── src/
│   │   │   ├── lib.rs                       # Factory entry point
│   │   │   ├── storage.rs                   # Pool registry storage
│   │   │   └── events.rs
│   │   └── Cargo.toml
│   ├── constant-product-pool/               # x·y=k AMM pool
│   │   ├── src/
│   │   │   ├── lib.rs                       # Pool contract
│   │   │   ├── swap.rs                      # Swap logic
│   │   │   ├── liquidity.rs                 # Add/remove liquidity
│   │   │   ├── math.rs                      # AMM math (fixed-point)
│   │   │   ├── fees.rs                      # Fee computation & distribution
│   │   │   ├── twap.rs                      # TWAP oracle
│   │   │   └── events.rs
│   │   └── tests/
│   ├── stableswap-pool/                     # StableSwap invariant pool
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── invariant.rs                 # StableSwap D-invariant solver
│   │   │   ├── amplification.rs             # A parameter ramp logic
│   │   │   └── ...
│   ├── concentrated-liquidity-pool/         # Tick-based concentrated liquidity
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── tick.rs                      # Tick bitmap & management
│   │   │   ├── position.rs                  # LP position (NFT-like)
│   │   │   ├── sqrt_price.rs                # √price math (Q64.96 fixed-point)
│   │   │   ├── swap.rs                      # Tick-crossing swap logic
│   │   │   └── fee_growth.rs                # Per-unit-liquidity fee tracking
│   ├── router/                              # Multi-hop swap router
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── path.rs                      # Path encoding & decoding
│   │       └── quote.rs                     # Quote engine
│   ├── lp-token/                            # ERC20-like LP token contract
│   ├── farm/                                # Yield farming / staking contract
│   ├── governance/                          # On-chain DAO governance
│   ├── treasury/                            # Protocol treasury
│   ├── twap-oracle/                         # Standalone TWAP oracle
│   ├── shared/                              # Shared Rust library (math, types)
│   └── scripts/
│       ├── deploy.sh
│       ├── create-pool.sh
│       └── verify.sh
│
├── 📁 backend/                              # NestJS API server
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── config/
│   │   │   ├── configuration.ts
│   │   │   ├── database.config.ts
│   │   │   ├── timescale.config.ts
│   │   │   └── stellar.config.ts
│   │   ├── modules/
│   │   │   ├── auth/                        # Wallet signature auth (SIWS)
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── strategies/
│   │   │   ├── pools/                       # Pool management module
│   │   │   │   ├── pools.module.ts
│   │   │   │   ├── pools.service.ts
│   │   │   │   ├── pools.controller.ts
│   │   │   │   ├── pools.gateway.ts         # WebSocket: real-time pool updates
│   │   │   │   ├── pool-factory.service.ts
│   │   │   │   └── dto/
│   │   │   ├── swap/                        # Swap quote & execution module
│   │   │   │   ├── swap.module.ts
│   │   │   │   ├── swap.service.ts
│   │   │   │   ├── swap.controller.ts
│   │   │   │   ├── swap.gateway.ts          # WebSocket: live swap quotes
│   │   │   │   └── dto/
│   │   │   ├── routing/                     # Smart order routing engine
│   │   │   │   ├── routing.module.ts
│   │   │   │   ├── routing.service.ts       # Graph-based path finder
│   │   │   │   ├── graph.service.ts         # Pool graph construction
│   │   │   │   └── quote-aggregator.ts
│   │   │   ├── liquidity/                   # LP position management module
│   │   │   │   ├── liquidity.module.ts
│   │   │   │   ├── liquidity.service.ts
│   │   │   │   ├── il-calculator.service.ts # Impermanent loss computation
│   │   │   │   └── position-tracker.service.ts
│   │   │   ├── farm/                        # Yield farming module
│   │   │   │   ├── farm.module.ts
│   │   │   │   ├── farm.service.ts
│   │   │   │   ├── emissions.service.ts     # SPL emission schedule
│   │   │   │   └── apr-calculator.service.ts
│   │   │   ├── oracle/                      # TWAP oracle aggregation
│   │   │   │   ├── oracle.module.ts
│   │   │   │   ├── twap.service.ts
│   │   │   │   └── oracle.scheduler.ts
│   │   │   ├── indexer/                     # Soroban event indexer
│   │   │   │   ├── indexer.module.ts
│   │   │   │   ├── stellar-indexer.service.ts
│   │   │   │   ├── event-processor.service.ts
│   │   │   │   ├── swap-indexer.service.ts
│   │   │   │   └── liquidity-indexer.service.ts
│   │   │   ├── analytics/                   # Protocol analytics module
│   │   │   │   ├── analytics.module.ts
│   │   │   │   ├── tvl.service.ts
│   │   │   │   ├── volume.service.ts
│   │   │   │   ├── fee-revenue.service.ts
│   │   │   │   ├── candlestick.service.ts   # OHLCV candle generation
│   │   │   │   └── leaderboard.service.ts
│   │   │   ├── notifications/
│   │   │   │   ├── email.service.ts         # AWS SES / SendGrid
│   │   │   │   ├── push.service.ts          # Web push
│   │   │   │   └── range-alert.service.ts   # Out-of-range CL position alerts
│   │   │   ├── governance/
│   │   │   └── admin/
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── pipes/
│   │   ├── database/
│   │   │   ├── entities/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   └── shared/
│   │       ├── stellar/
│   │       ├── redis/
│   │       ├── amm-math/                    # TypeScript AMM math (mirrors contracts)
│   │       └── events/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
│
├── 📁 frontend/                             # Angular 17 SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.config.ts
│   │   │   ├── app.routes.ts
│   │   │   ├── core/
│   │   │   │   ├── services/
│   │   │   │   │   ├── wallet.service.ts
│   │   │   │   │   ├── stellar.service.ts
│   │   │   │   │   ├── amm-math.service.ts  # Client-side swap simulation
│   │   │   │   │   └── price-feed.service.ts
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   └── store/                   # Root NgRx store
│   │   │   ├── features/
│   │   │   │   ├── swap/                    # Token swap interface
│   │   │   │   │   ├── swap.component.ts
│   │   │   │   │   ├── swap-settings/       # Slippage, deadline settings
│   │   │   │   │   ├── route-display/       # Multi-hop route visualization
│   │   │   │   │   └── price-impact-warning/
│   │   │   │   ├── liquidity/               # LP management interface
│   │   │   │   │   ├── pool-list/
│   │   │   │   │   ├── add-liquidity/
│   │   │   │   │   ├── remove-liquidity/
│   │   │   │   │   ├── concentrated-lp/     # Range selection UI
│   │   │   │   │   └── il-calculator/
│   │   │   │   ├── pool-explorer/           # Pool deep-dive analytics
│   │   │   │   │   ├── pool-overview/
│   │   │   │   │   ├── price-chart/         # TradingView chart
│   │   │   │   │   ├── liquidity-depth/     # Depth chart visualization
│   │   │   │   │   └── transactions/
│   │   │   │   ├── farm/                    # Yield farming dashboard
│   │   │   │   │   ├── farm-list/
│   │   │   │   │   ├── farm-detail/
│   │   │   │   │   └── harvest-modal/
│   │   │   │   ├── portfolio/               # User positions & P&L
│   │   │   │   ├── governance/              # DAO voting interface
│   │   │   │   ├── analytics/               # Protocol-wide analytics
│   │   │   │   └── create-pool/             # Permissionless pool creation
│   │   │   ├── shared/
│   │   │   │   ├── components/
│   │   │   │   │   ├── token-selector/
│   │   │   │   │   ├── token-amount-input/
│   │   │   │   │   ├── price-range-selector/ # Concentrated LP range picker
│   │   │   │   │   ├── tx-confirm-modal/
│   │   │   │   │   ├── price-impact-badge/
│   │   │   │   │   ├── apy-badge/
│   │   │   │   │   └── wallet-connect-button/
│   │   │   │   ├── pipes/
│   │   │   │   │   ├── format-token.pipe.ts
│   │   │   │   │   ├── usd-value.pipe.ts
│   │   │   │   │   └── percentage.pipe.ts
│   │   │   │   └── models/
│   │   │   └── layout/
│   │   ├── assets/
│   │   ├── environments/
│   │   └── styles/
│   ├── e2e/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── 📁 infrastructure/
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── vpc/
│   │   │   ├── eks/
│   │   │   ├── rds/
│   │   │   ├── elasticache/
│   │   │   └── cdn/
│   │   └── environments/
│   │       ├── dev/
│   │       ├── staging/
│   │       └── prod/
│   ├── kubernetes/
│   │   ├── deployments/
│   │   │   ├── backend.yaml
│   │   │   ├── frontend.yaml
│   │   │   ├── indexer.yaml
│   │   │   └── price-oracle.yaml
│   │   ├── services/
│   │   ├── ingress/
│   │   ├── configmaps/
│   │   ├── hpa/
│   │   └── pdb/                             # Pod Disruption Budgets
│   ├── monitoring/
│   │   ├── prometheus/
│   │   ├── grafana/
│   │   └── alertmanager/
│   └── docker/
│
├── 📁 .github/
│   └── workflows/
│       ├── ci.yml
│       ├── cd-staging.yml
│       ├── cd-production.yml
│       └── contract-security.yml
│
├── 📁 docs/
│   ├── architecture/
│   ├── contracts/
│   ├── api/
│   ├── math/                                # AMM math specifications
│   └── adr/
│
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## ⛓️ Smart Contracts (Soroban)

All core protocol logic is deployed as Soroban smart contracts written in Rust.

### Pool Factory Contract

The factory registers and deploys new pool contracts permissionlessly.

```rust
// contracts/pool-factory/src/lib.rs (simplified)

#[contract]
pub struct PoolFactory;

#[contractimpl]
impl PoolFactory {
    /// Initialize factory with protocol configuration
    pub fn initialize(env: Env, admin: Address, fee_recipient: Address) -> Result<(), Error>

    /// Deploy a new constant-product pool
    pub fn create_constant_product_pool(
        env: Env,
        token_a: Address,
        token_b: Address,
        fee_tier: FeeTier,         // Bps25, Bps30, Bps100
    ) -> Result<Address, Error>

    /// Deploy a new StableSwap pool
    pub fn create_stable_pool(
        env: Env,
        tokens: Vec<Address>,
        amplification: u128,       // A parameter (e.g. 100–2000)
        fee_tier: FeeTier,
    ) -> Result<Address, Error>

    /// Deploy a new concentrated liquidity pool
    pub fn create_concentrated_pool(
        env: Env,
        token_a: Address,
        token_b: Address,
        fee_tier: FeeTier,         // Bps1, Bps5, Bps30, Bps100
        tick_spacing: i32,
        initial_sqrt_price: u128,
    ) -> Result<Address, Error>

    /// Get pool address for a token pair and fee tier
    pub fn get_pool(env: Env, token_a: Address, token_b: Address, fee_tier: FeeTier) -> Option<Address>

    /// Get all registered pools
    pub fn get_all_pools(env: Env) -> Vec<PoolInfo>
}
```

### Constant Product Pool Contract

```rust
#[contractimpl]
impl ConstantProductPool {
    /// Add liquidity and receive LP tokens
    pub fn add_liquidity(
        env: Env,
        provider: Address,
        amount_a_desired: i128,
        amount_b_desired: i128,
        amount_a_min: i128,        // Slippage protection
        amount_b_min: i128,
        deadline: u64,
    ) -> Result<(i128, i128, i128), Error>  // (amount_a, amount_b, lp_minted)

    /// Remove liquidity by burning LP tokens
    pub fn remove_liquidity(
        env: Env,
        provider: Address,
        lp_amount: i128,
        amount_a_min: i128,
        amount_b_min: i128,
        deadline: u64,
    ) -> Result<(i128, i128), Error>        // (amount_a, amount_b)

    /// Swap exact tokens in for tokens out
    pub fn swap_exact_in(
        env: Env,
        caller: Address,
        amount_in: i128,
        amount_out_min: i128,      // Slippage protection
        zero_for_one: bool,        // true = token0 → token1
        recipient: Address,
        deadline: u64,
    ) -> Result<i128, Error>       // amount_out

    /// Swap tokens in for exact tokens out
    pub fn swap_exact_out(
        env: Env,
        caller: Address,
        amount_out: i128,
        amount_in_max: i128,
        zero_for_one: bool,
        recipient: Address,
        deadline: u64,
    ) -> Result<i128, Error>       // amount_in consumed

    /// Flash swap — borrow reserves, use them, repay + fee in one tx
    pub fn flash_swap(
        env: Env,
        caller: Address,
        amount0_out: i128,
        amount1_out: i128,
        callback_contract: Address,
        callback_data: Bytes,
    ) -> Result<(), Error>

    /// Get current pool reserves
    pub fn get_reserves(env: Env) -> (i128, i128)

    /// Get current spot price (token0 in terms of token1)
    pub fn get_spot_price(env: Env) -> i128

    /// Get cumulative TWAP price accumulators
    pub fn get_twap_accumulators(env: Env) -> (u256, u256, u64)
}
```

### Concentrated Liquidity Pool Contract

```rust
#[contractimpl]
impl ConcentratedLiquidityPool {
    /// Mint a new LP position in a custom price range
    pub fn mint_position(
        env: Env,
        recipient: Address,
        tick_lower: i32,           // Lower bound tick (e.g. -887272)
        tick_upper: i32,           // Upper bound tick (e.g. +887272)
        liquidity_desired: u128,
        amount0_max: i128,
        amount1_max: i128,
        deadline: u64,
    ) -> Result<(u128, i128, i128), Error>  // (position_id, amount0, amount1)

    /// Add liquidity to an existing position
    pub fn increase_liquidity(
        env: Env,
        caller: Address,
        position_id: u128,
        liquidity_delta: u128,
        amount0_max: i128,
        amount1_max: i128,
        deadline: u64,
    ) -> Result<(i128, i128), Error>

    /// Remove liquidity from a position
    pub fn decrease_liquidity(
        env: Env,
        caller: Address,
        position_id: u128,
        liquidity_delta: u128,
        amount0_min: i128,
        amount1_min: i128,
        deadline: u64,
    ) -> Result<(i128, i128), Error>

    /// Collect earned fees for a position
    pub fn collect_fees(
        env: Env,
        caller: Address,
        position_id: u128,
        amount0_max: i128,
        amount1_max: i128,
    ) -> Result<(i128, i128), Error>

    /// Perform swap across ticks
    pub fn swap(
        env: Env,
        caller: Address,
        zero_for_one: bool,
        amount_specified: i128,    // Positive = exactIn, negative = exactOut
        sqrt_price_limit: u128,    // Price limit (prevents excessive slippage)
        recipient: Address,
        deadline: u64,
    ) -> Result<(i128, i128), Error>  // (amount0, amount1)

    /// Get position details
    pub fn get_position(env: Env, position_id: u128) -> PositionInfo

    /// Get current pool slot (sqrt price, tick, liquidity)
    pub fn get_slot0(env: Env) -> Slot0
}
```

### StableSwap Pool Contract

```rust
#[contractimpl]
impl StableSwapPool {
    /// Initialize pool with amplification coefficient
    pub fn initialize(env: Env, tokens: Vec<Address>, a: u128, fee: u128) -> Result<(), Error>

    /// Add balanced or imbalanced liquidity
    pub fn add_liquidity(
        env: Env,
        provider: Address,
        amounts: Vec<i128>,
        min_mint_amount: i128,
        deadline: u64,
    ) -> Result<i128, Error>

    /// Remove liquidity in one coin (single-sided exit)
    pub fn remove_liquidity_one_coin(
        env: Env,
        provider: Address,
        token_amount: i128,
        coin_index: u32,
        min_amount: i128,
    ) -> Result<i128, Error>

    /// Exchange tokens i for tokens j
    pub fn exchange(
        env: Env,
        caller: Address,
        i: u32,                    // Index of input token
        j: u32,                    // Index of output token
        dx: i128,                  // Input amount
        min_dy: i128,              // Minimum output (slippage protection)
        recipient: Address,
    ) -> Result<i128, Error>

    /// Get current amplification coefficient (accounts for ramp)
    pub fn get_a(env: Env) -> u128

    /// Ramp A parameter up/down over time (admin only)
    pub fn ramp_a(env: Env, future_a: u128, future_time: u64) -> Result<(), Error>

    /// Get the StableSwap invariant D
    pub fn get_d(env: Env) -> u128
}
```

### Smart Order Router Contract

```rust
#[contractimpl]
impl Router {
    /// Execute multi-hop exact-input swap
    pub fn swap_exact_tokens_for_tokens(
        env: Env,
        caller: Address,
        amount_in: i128,
        amount_out_min: i128,
        path: Vec<SwapStep>,       // Encoded path: [tokenA, fee, tokenB, fee, tokenC...]
        recipient: Address,
        deadline: u64,
    ) -> Result<i128, Error>

    /// Execute multi-hop exact-output swap
    pub fn swap_tokens_for_exact_tokens(
        env: Env,
        caller: Address,
        amount_out: i128,
        amount_in_max: i128,
        path: Vec<SwapStep>,
        recipient: Address,
        deadline: u64,
    ) -> Result<i128, Error>

    /// Quote output amount for a given path (view only)
    pub fn quote_exact_input(
        env: Env,
        amount_in: i128,
        path: Vec<SwapStep>,
    ) -> Result<QuoteResult, Error>
}
```

### Farm / Staking Contract

```rust
#[contractimpl]
impl Farm {
    /// Deposit LP tokens to earn SPL emissions
    pub fn deposit(env: Env, caller: Address, pool: Address, amount: i128) -> Result<(), Error>

    /// Withdraw LP tokens from farm
    pub fn withdraw(env: Env, caller: Address, pool: Address, amount: i128) -> Result<(), Error>

    /// Harvest pending SPL rewards
    pub fn harvest(env: Env, caller: Address, pool: Address) -> Result<i128, Error>

    /// Compound: harvest + re-deposit in one transaction
    pub fn compound(env: Env, caller: Address, pool: Address) -> Result<(), Error>

    /// Get pending rewards for a user
    pub fn pending_rewards(env: Env, caller: Address, pool: Address) -> i128

    /// Get farm APR (view)
    pub fn get_apr(env: Env, pool: Address) -> u128
}
```

### Contract Addresses

| Contract | Testnet | Mainnet |
|----------|---------|---------|
| PoolFactory | `CTESTFACTORY...` | `CMAINFACTORY...` |
| Router | `CTESTROUTER...` | `CMAINROUTER...` |
| Farm | `CTESTFARM...` | `CMAINFARM...` |
| SPL Token | `CTESTSPL...` | `CMAINSPL...` |
| Governance | `CTESTGOV...` | `CMAINGOV...` |
| Treasury | `CTESTTREASURY...` | `CMAINTREASURY...` |
| TWAP Oracle | `CTESTTWAP...` | `CMAINTWAP...` |

---

## 🖥️ Backend — NestJS

The backend is a high-performance NestJS application serving as the protocol's API server, on-chain event indexer, routing engine, and analytics pipeline.

### Module Architecture

```
AppModule
├── ConfigModule (global)
├── DatabaseModule (TypeORM + PostgreSQL)
├── TimescaleModule (time-series price/volume data)
├── CacheModule (Redis)
├── AuthModule
│   ├── WalletSignatureStrategy      ← Sign-In With Stellar (SIWS)
│   └── JwtStrategy
├── PoolsModule
│   ├── PoolsController              ← REST: pool CRUD & listing
│   ├── PoolsService                 ← Pool metadata, TVL computation
│   ├── PoolsGateway                 ← WS: real-time reserve & price updates
│   ├── PoolFactoryService           ← Interface to factory contract
│   └── PoolSyncScheduler            ← Cron: sync on-chain pool state (every 30s)
├── SwapModule
│   ├── SwapController               ← REST: quote & build swap tx
│   ├── SwapService                  ← Quote simulation, tx building
│   └── SwapGateway                  ← WS: live quote streaming
├── RoutingModule
│   ├── RoutingService               ← Graph-based best path computation
│   ├── GraphService                 ← Builds pool graph from indexed data
│   ├── SplitRouteService            ← Split-route optimization
│   └── QuoteAggregatorService
├── LiquidityModule
│   ├── LiquidityController
│   ├── LiquidityService
│   ├── IlCalculatorService          ← Impermanent loss computation
│   └── PositionTrackerService       ← CL position range monitoring
├── FarmModule
│   ├── FarmController
│   ├── FarmService
│   ├── EmissionsService             ← SPL emission schedule & distribution
│   └── AprCalculatorService
├── OracleModule
│   ├── TwapService                  ← On-chain TWAP aggregation
│   └── OracleScheduler              ← Cron: refresh every 60s
├── IndexerModule
│   ├── StellarIndexerService        ← Stream & index all Soroban events
│   ├── SwapIndexerService           ← Index swap events → price history
│   ├── LiquidityIndexerService      ← Index mint/burn events
│   └── FeeIndexerService            ← Index fee accrual events
├── AnalyticsModule
│   ├── TvlService
│   ├── VolumeService
│   ├── FeeRevenueService
│   ├── CandlestickService           ← OHLCV candle generation (1m, 5m, 1h, 1d)
│   └── LeaderboardService
├── NotificationsModule
│   ├── EmailService
│   ├── PushService
│   └── RangeAlertService            ← CL position out-of-range alerts
└── GovernanceModule
```

### Smart Order Routing Engine

The backend routing engine builds a weighted directed graph of all pools and computes optimal swap paths using a modified Dijkstra's algorithm.

```typescript
@Injectable()
export class RoutingService {

  async findBestRoute(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    maxHops: number = 3,
  ): Promise<RouteResult> {
    // Build pool graph
    const graph = await this.graphService.buildGraph();

    // Find all paths up to maxHops
    const paths = this.findAllPaths(graph, tokenIn, tokenOut, maxHops);

    // Simulate each path and find best output
    const simulations = await Promise.all(
      paths.map(path => this.simulatePath(path, amountIn))
    );

    // Also try split routing (2 paths simultaneously)
    const splitRoutes = await this.splitRouteService.optimizeSplit(
      paths, amountIn
    );

    // Return best single or split route
    return this.selectBestRoute([...simulations, ...splitRoutes]);
  }

  private simulatePath(path: PoolPath, amountIn: bigint): RouteSimulation {
    let amount = amountIn;
    const steps: SwapStep[] = [];

    for (const hop of path.hops) {
      const { amountOut, priceImpact } = this.ammMath.simulateSwap(
        hop.pool.type,
        hop.pool.reserves,
        amount,
        hop.zeroForOne,
      );
      steps.push({ pool: hop.pool, amountIn: amount, amountOut, priceImpact });
      amount = amountOut;
    }

    return {
      path,
      steps,
      amountOut: amount,
      totalPriceImpact: this.aggregatePriceImpact(steps),
      effectivePrice: Number(amountIn) / Number(amount),
    };
  }
}
```

### AMM Math Library (TypeScript — mirrors contracts)

The backend ships a TypeScript AMM math library that exactly mirrors the contract logic, enabling off-chain quote simulation without contract calls.

```typescript
// backend/src/shared/amm-math/constant-product.math.ts

export class ConstantProductMath {

  /**
   * Calculate output amount for a swap (constant product formula)
   * Δy = (y · Δx · (1 - fee)) / (x + Δx · (1 - fee))
   */
  static getAmountOut(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    feeBps: bigint = 30n,         // Default 0.30%
  ): { amountOut: bigint; priceImpact: number } {
    const FEE_DENOMINATOR = 10000n;
    const amountInWithFee = amountIn * (FEE_DENOMINATOR - feeBps);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * FEE_DENOMINATOR + amountInWithFee;
    const amountOut = numerator / denominator;

    const spotPrice = Number(reserveOut) / Number(reserveIn);
    const executionPrice = Number(amountOut) / Number(amountIn);
    const priceImpact = Math.abs(1 - executionPrice / spotPrice);

    return { amountOut, priceImpact };
  }

  /**
   * Calculate required input for a given output
   */
  static getAmountIn(
    amountOut: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    feeBps: bigint = 30n,
  ): bigint {
    const FEE_DENOMINATOR = 10000n;
    const numerator = reserveIn * amountOut * FEE_DENOMINATOR;
    const denominator = (reserveOut - amountOut) * (FEE_DENOMINATOR - feeBps);
    return numerator / denominator + 1n;
  }

  /**
   * Calculate LP tokens minted for a given deposit
   */
  static calcLpTokensMinted(
    amountA: bigint,
    amountB: bigint,
    reserveA: bigint,
    reserveB: bigint,
    totalSupply: bigint,
  ): bigint {
    if (totalSupply === 0n) {
      // Initial deposit: geometric mean - MINIMUM_LIQUIDITY
      return BigIntMath.sqrt(amountA * amountB) - 1000n;
    }
    const lpFromA = (amountA * totalSupply) / reserveA;
    const lpFromB = (amountB * totalSupply) / reserveB;
    return lpFromA < lpFromB ? lpFromA : lpFromB;
  }
}
```

### Impermanent Loss Calculator

```typescript
@Injectable()
export class IlCalculatorService {

  /**
   * Calculate impermanent loss for a constant-product LP position
   *
   * IL = 2√(P_current/P_entry) / (1 + P_current/P_entry) - 1
   */
  calculateImpermanentLoss(
    priceEntry: number,
    priceCurrent: number,
  ): { ilPercent: number; ilUsd: number; hodlValue: number; lpValue: number } {
    const priceRatio = priceCurrent / priceEntry;
    const ilFactor = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1;
    return {
      ilPercent: ilFactor * 100,
      ilUsd: 0,   // computed with position value
      hodlValue: 0,
      lpValue: 0,
    };
  }

  /**
   * Calculate IL for concentrated liquidity position
   * More complex — depends on price range [Pa, Pb] and current price P
   */
  calculateConcentratedIL(
    tickLower: number,
    tickUpper: number,
    priceEntry: number,
    priceCurrent: number,
  ): number {
    const sqrtPa = Math.sqrt(this.tickToPrice(tickLower));
    const sqrtPb = Math.sqrt(this.tickToPrice(tickUpper));
    const sqrtP0 = Math.sqrt(priceEntry);
    const sqrtP1 = Math.sqrt(priceCurrent);
    // ... full concentrated IL computation
    return this.computeConcentratedILFormula(sqrtPa, sqrtPb, sqrtP0, sqrtP1);
  }
}
```

### Key REST API Endpoints

```
Authentication
  POST   /api/v1/auth/challenge                  Wallet challenge (SIWS)
  POST   /api/v1/auth/verify                     Verify & issue JWT
  POST   /api/v1/auth/refresh                    Refresh token

Pools
  GET    /api/v1/pools                            List all pools (paginated, filterable)
  GET    /api/v1/pools/:poolId                    Get pool details
  GET    /api/v1/pools/:poolId/reserves           Get current reserves
  GET    /api/v1/pools/:poolId/transactions       Get pool transaction history
  GET    /api/v1/pools/:poolId/stats              Get volume, TVL, APR
  POST   /api/v1/pools/create                     Build pool creation transaction

Swap
  GET    /api/v1/swap/quote                       Get swap quote with route
  POST   /api/v1/swap/build                       Build swap transaction (unsigned XDR)
  GET    /api/v1/swap/price-impact                Calculate price impact

Routing
  GET    /api/v1/routing/best-path                Find optimal swap path
  GET    /api/v1/routing/all-paths                Get all possible paths

Liquidity
  GET    /api/v1/liquidity/positions/:address     Get user LP positions
  POST   /api/v1/liquidity/add/build              Build add-liquidity tx
  POST   /api/v1/liquidity/remove/build           Build remove-liquidity tx
  GET    /api/v1/liquidity/il/:address/:poolId    Calculate impermanent loss
  GET    /api/v1/liquidity/earned-fees/:address   Earned fees for all positions

Farming
  GET    /api/v1/farms                            List all farms with APR
  GET    /api/v1/farms/:farmId                    Get farm details
  GET    /api/v1/farms/positions/:address         Get user farm positions
  POST   /api/v1/farms/deposit/build              Build deposit-to-farm tx
  POST   /api/v1/farms/harvest/build              Build harvest tx

Oracle & Prices
  GET    /api/v1/prices                           All token prices
  GET    /api/v1/prices/:token                    Token price with TWAP
  GET    /api/v1/prices/:tokenA/:tokenB/history   Price pair history (OHLCV)
  GET    /api/v1/prices/:tokenA/:tokenB/candles   Candlestick data

Analytics
  GET    /api/v1/analytics/tvl                    Protocol TVL (total + per pool)
  GET    /api/v1/analytics/volume                 24h/7d/30d volume
  GET    /api/v1/analytics/fees                   Protocol fee revenue
  GET    /api/v1/analytics/user/:address          User analytics & history
  GET    /api/v1/analytics/leaderboard            Top LPs leaderboard
```

### WebSocket Events

```typescript
// Real-time data streams

// Subscribe to pool reserve changes
socket.emit('subscribe:pool', { poolId: 'CPOOL...' });
socket.on('pool:reserves', (data: ReserveUpdate) => { /* x, y, price */ });
socket.on('pool:swap', (data: SwapEvent) => { /* swap executed */ });

// Subscribe to live swap quotes (streams quotes as market moves)
socket.emit('subscribe:quote', { tokenIn: 'XLM', tokenOut: 'USDC', amountIn: '100' });
socket.on('quote:update', (data: QuoteUpdate) => { /* amountOut, route, priceImpact */ });

// Subscribe to CL position range alerts
socket.emit('subscribe:position', { address: '0x...', positionId: '42' });
socket.on('position:out-of-range', (data: RangeAlert) => { /* position went out of range */ });

// Subscribe to protocol-wide stats
socket.emit('subscribe:stats');
socket.on('stats:update', (data: ProtocolStats) => { /* tvl, volume, fees */ });
```

---

## 🖥️ Frontend — Angular

The SoroPool frontend is a performant Angular 17 PWA delivering a best-in-class DEX trading interface.

### State Management (NgRx)

```
Store
├── auth/
│   ├── walletAddress: string | null
│   ├── isConnected: boolean
│   └── jwtToken: string | null
├── pools/
│   ├── pools: Pool[]
│   ├── selectedPool: Pool | null
│   ├── poolStats: Record<string, PoolStats>
│   └── loading: LoadingState
├── swap/
│   ├── tokenIn: Token | null
│   ├── tokenOut: Token | null
│   ├── amountIn: string
│   ├── quote: SwapQuote | null
│   ├── route: SwapRoute | null
│   ├── slippageTolerance: number      # Default: 0.5%
│   ├── deadline: number               # Default: 30 min
│   └── priceImpactWarning: boolean
├── liquidity/
│   ├── positions: LpPosition[]
│   ├── clPositions: ConcentratedPosition[]
│   └── earnedFees: EarnedFees[]
├── farm/
│   ├── farms: Farm[]
│   ├── userPositions: FarmPosition[]
│   └── pendingRewards: Record<string, bigint>
├── prices/
│   ├── prices: Record<string, PriceFeed>
│   ├── priceHistory: Record<string, OhlcvCandle[]>
│   └── lastUpdated: Date
└── analytics/
    ├── protocolTvl: number
    ├── volume24h: number
    └── fees24h: number
```

### Swap Component

```typescript
@Component({
  selector: 'sp-swap',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TokenAmountInputComponent,
            RouteDisplayComponent, PriceImpactBadgeComponent, MatButtonModule],
  templateUrl: './swap.component.html',
})
export class SwapComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private swapService = inject(SwapService);
  private walletService = inject(WalletService);

  // Signals
  tokenIn = signal<Token | null>(null);
  tokenOut = signal<Token | null>(null);
  amountIn = signal<string>('');

  // Derived state from store
  quote = this.store.selectSignal(selectSwapQuote);
  route = this.store.selectSignal(selectSwapRoute);
  slippage = this.store.selectSignal(selectSlippageTolerance);

  // Computed
  priceImpactSeverity = computed(() => {
    const impact = this.quote()?.priceImpact ?? 0;
    if (impact > 0.15) return 'critical';   // >15%
    if (impact > 0.05) return 'high';       // >5%
    if (impact > 0.01) return 'medium';     // >1%
    return 'low';
  });

  minAmountOut = computed(() => {
    const out = this.quote()?.amountOut ?? 0n;
    const slippage = this.slippage();
    return out * BigInt(Math.floor((1 - slippage) * 10000)) / 10000n;
  });

  async executeSwap(): Promise<void> {
    const { txXdr } = await this.swapService.buildSwapTransaction({
      tokenIn: this.tokenIn()!,
      tokenOut: this.tokenOut()!,
      amountIn: this.amountIn(),
      amountOutMin: this.minAmountOut().toString(),
      route: this.route()!,
    });

    const signedXdr = await this.walletService.signTransaction(txXdr);
    await this.swapService.submitTransaction(signedXdr);
  }
}
```

### Concentrated Liquidity Price Range Selector

```typescript
@Component({
  selector: 'sp-price-range-selector',
  standalone: true,
  template: `
    <div class="range-selector">
      <sp-liquidity-depth-chart
        [currentPrice]="currentPrice()"
        [tickLower]="tickLower()"
        [tickUpper]="tickUpper()"
        (rangeChange)="onRangeChange($event)">
      </sp-liquidity-depth-chart>

      <div class="range-inputs">
        <sp-tick-input label="Min Price" [(tick)]="tickLower" />
        <sp-tick-input label="Max Price" [(tick)]="tickUpper" />
      </div>

      <div class="efficiency-badge">
        Capital efficiency: {{ capitalEfficiency() | number:'1.1-1' }}x vs full range
      </div>
    </div>
  `
})
export class PriceRangeSelectorComponent {
  @Input() pool!: Pool;

  currentPrice = signal<number>(0);
  tickLower = signal<number>(-887272);
  tickUpper = signal<number>(887272);

  capitalEfficiency = computed(() => {
    const sqrtRatio = Math.sqrt(
      this.tickToPrice(this.tickUpper()) / this.tickToPrice(this.tickLower())
    );
    return sqrtRatio / (sqrtRatio - 1);
  });
}
```

---

## 🏗️ Infrastructure & DevOps

### Docker Compose (Local Development)

```yaml
version: '3.9'

services:
  postgres:
    image: timescale/timescaledb:latest-pg15
    environment:
      POSTGRES_DB: soropool
      POSTGRES_USER: soropool
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/docker/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U soropool"]
      interval: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: soropool
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "5672:5672"
      - "15672:15672"

  backend:
    build:
      context: ./backend
      target: development
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://soropool:${DB_PASSWORD}@postgres:5432/soropool
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      RABBITMQ_URL: amqp://soropool:${RABBITMQ_PASSWORD}@rabbitmq:5672
    volumes:
      - ./backend/src:/app/src
    ports:
      - "3000:3000"
      - "3001:3001"     # WebSocket port
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      target: development
    volumes:
      - ./frontend/src:/app/src
    ports:
      - "4200:4200"
    environment:
      API_URL: http://backend:3000
      WS_URL: ws://backend:3001

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes — HPA (Horizontal Pod Autoscaler)

```yaml
# infrastructure/kubernetes/hpa/backend-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: soropool-backend-hpa
  namespace: soropool-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: soropool-backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: websocket_connections_per_pod
        target:
          type: AverageValue
          averageValue: "500"
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI — SoroPool

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/toolchain@v1
        with: { toolchain: stable, target: wasm32-unknown-unknown }
      - name: Build contracts
        run: cd contracts && cargo build --target wasm32-unknown-unknown --release
      - name: Run contract tests
        run: cd contracts && cargo test -- --nocapture
      - name: Clippy lint
        run: cd contracts && cargo clippy -- -D warnings
      - name: Check contract size
        run: |
          for f in target/wasm32-unknown-unknown/release/*.wasm; do
            size=$(wc -c < "$f")
            echo "$f: ${size} bytes"
            [ "$size" -le 65536 ] || (echo "Contract too large!" && exit 1)
          done

  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: timescale/timescaledb:latest-pg15
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: soropool_test }
        options: --health-cmd pg_isready --health-interval 10s
      redis:
        image: redis:7-alpine
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: backend/package-lock.json }
      - run: cd backend && npm ci
      - run: cd backend && npm run lint
      - run: cd backend && npm run test:cov
      - uses: codecov/codecov-action@v3

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: frontend/package-lock.json }
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run test:ci
      - run: cd frontend && npm run build -- --configuration production

  amm-math-parity:
    runs-on: ubuntu-latest
    name: Verify TS ↔ Rust AMM math parity
    steps:
      - uses: actions/checkout@v4
      - run: cd backend && npm ci && npm run test:amm-parity
```

---

## 🗄️ Database Design

### Core Entities

```sql
-- Enable TimescaleDB for time-series tables
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Token registry
CREATE TABLE tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol          VARCHAR(20) UNIQUE NOT NULL,
  name            VARCHAR(100) NOT NULL,
  contract_address VARCHAR(56) UNIQUE NOT NULL,
  decimals        INT NOT NULL DEFAULT 7,
  logo_url        TEXT,
  is_verified     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Pool registry
CREATE TABLE pools (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address VARCHAR(56) UNIQUE NOT NULL,
  pool_type       VARCHAR(30) NOT NULL CHECK (pool_type IN ('constant_product', 'stableswap', 'concentrated')),
  token0_id       UUID REFERENCES tokens(id),
  token1_id       UUID REFERENCES tokens(id),
  fee_bps         INT NOT NULL,               -- e.g. 30 = 0.30%
  tick_spacing    INT,                         -- Concentrated only
  amplification   NUMERIC(20,6),              -- StableSwap only
  reserve0        NUMERIC(38,18) DEFAULT 0,
  reserve1        NUMERIC(38,18) DEFAULT 0,
  sqrt_price_x96  NUMERIC(80,0),              -- Concentrated: current √price
  current_tick    INT,                         -- Concentrated: current tick
  tvl_usd         NUMERIC(28,8) DEFAULT 0,
  volume_24h_usd  NUMERIC(28,8) DEFAULT 0,
  fee_revenue_24h NUMERIC(28,8) DEFAULT 0,
  lp_count        INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pools_tokens ON pools(token0_id, token1_id, fee_bps);

-- LP positions (constant product & stableswap)
CREATE TABLE lp_positions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address  VARCHAR(56) NOT NULL,
  pool_id         UUID REFERENCES pools(id),
  lp_token_amount NUMERIC(38,18) NOT NULL DEFAULT 0,
  token0_deposited NUMERIC(38,18) NOT NULL DEFAULT 0,
  token1_deposited NUMERIC(38,18) NOT NULL DEFAULT 0,
  token0_price_at_entry NUMERIC(28,8),
  fees_earned_token0 NUMERIC(38,18) DEFAULT 0,
  fees_earned_token1 NUMERIC(38,18) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, pool_id)
);

-- Concentrated liquidity positions (NFT-like)
CREATE TABLE cl_positions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id     BIGINT NOT NULL,            -- On-chain position NFT ID
  wallet_address  VARCHAR(56) NOT NULL,
  pool_id         UUID REFERENCES pools(id),
  tick_lower      INT NOT NULL,
  tick_upper      INT NOT NULL,
  liquidity       NUMERIC(38,0) NOT NULL DEFAULT 0,
  token0_owed     NUMERIC(38,18) DEFAULT 0,   -- Uncollected fees
  token1_owed     NUMERIC(38,18) DEFAULT 0,
  is_in_range     BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pool_id, position_id)
);

-- Swap transactions (time-series)
CREATE TABLE swaps (
  time            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pool_id         UUID REFERENCES pools(id),
  wallet_address  VARCHAR(56),
  token_in_id     UUID REFERENCES tokens(id),
  token_out_id    UUID REFERENCES tokens(id),
  amount_in       NUMERIC(38,18) NOT NULL,
  amount_out      NUMERIC(38,18) NOT NULL,
  amount_in_usd   NUMERIC(28,8),
  amount_out_usd  NUMERIC(28,8),
  price_impact    NUMERIC(10,8),
  fee_amount      NUMERIC(38,18),
  tx_hash         VARCHAR(64) NOT NULL,
  PRIMARY KEY (time, tx_hash)
);
-- Convert to TimescaleDB hypertable
SELECT create_hypertable('swaps', 'time');
CREATE INDEX idx_swaps_pool_time ON swaps (pool_id, time DESC);

-- OHLCV price candles (materialized by candlestick service)
CREATE TABLE price_candles (
  time            TIMESTAMPTZ NOT NULL,
  pool_id         UUID NOT NULL,
  interval        VARCHAR(10) NOT NULL,        -- '1m', '5m', '15m', '1h', '4h', '1d'
  open            NUMERIC(28,8) NOT NULL,
  high            NUMERIC(28,8) NOT NULL,
  low             NUMERIC(28,8) NOT NULL,
  close           NUMERIC(28,8) NOT NULL,
  volume_token0   NUMERIC(38,18) DEFAULT 0,
  volume_token1   NUMERIC(38,18) DEFAULT 0,
  volume_usd      NUMERIC(28,8) DEFAULT 0,
  tx_count        INT DEFAULT 0,
  PRIMARY KEY (time, pool_id, interval)
);
SELECT create_hypertable('price_candles', 'time');

-- Farm positions
CREATE TABLE farm_positions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address  VARCHAR(56) NOT NULL,
  pool_id         UUID REFERENCES pools(id),
  lp_amount_staked NUMERIC(38,18) DEFAULT 0,
  reward_debt     NUMERIC(38,18) DEFAULT 0,    -- For reward calculation
  pending_rewards NUMERIC(38,18) DEFAULT 0,
  total_harvested NUMERIC(38,18) DEFAULT 0,
  deposited_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, pool_id)
);

-- TVL snapshots (time-series for charts)
CREATE TABLE tvl_snapshots (
  time        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pool_id     UUID REFERENCES pools(id),
  tvl_usd     NUMERIC(28,8) NOT NULL,
  reserve0    NUMERIC(38,18) NOT NULL,
  reserve1    NUMERIC(38,18) NOT NULL,
  PRIMARY KEY (time, pool_id)
);
SELECT create_hypertable('tvl_snapshots', 'time');
```

---

## 🔐 Security

### Smart Contract Security

- **Integer Overflow Protection** — All math uses Rust's checked arithmetic or saturating operations; fixed-point 18-decimal precision throughout
- **Re-entrancy Guards** — Checks-effects-interactions pattern strictly enforced; no external calls before state updates
- **Reentrancy Lock** — Global reentrancy lock in concentrated liquidity pool during swap callback
- **Deadline Enforcement** — All user-facing functions accept a `deadline` timestamp to prevent transaction replay
- **Slippage Protection** — `amount_out_min` / `amount_in_max` enforced on every swap and liquidity action
- **Access Control** — Fine-grained roles: `Admin`, `FeeCollector`, `ParameterSetter`, `Pauser`
- **Circuit Breakers** — Emergency pause function on all pool contracts (governance-controlled)
- **Oracle Manipulation** — TWAP with minimum 30-minute observation window; spot price deviations > 5% revert
- **Flash Loan Protection** — Invariant checked before and after flash swap; net fee must be received

### Backend Security

- **Wallet Signature Authentication** — No passwords; Sign-In With Stellar for all protected endpoints
- **JWT Rotation** — Access tokens expire in 15 minutes; refresh tokens rotated on use
- **Rate Limiting** — Per-wallet rate limits: 100 req/min (public), 1000 req/min (authenticated)
- **Input Sanitization** — All inputs validated via `class-validator` + `class-transformer`; numeric values validated as BigInt
- **SQL Injection Prevention** — All queries via TypeORM parameterized queries; no raw SQL with user input
- **API Key for Admin Routes** — Admin routes additionally protected by API key + IP allowlist
- **CORS Policy** — Strict allowlist: only `soropool.finance` and `*.soropool.finance`
- **Dependency Scanning** — Automated Snyk + GitHub Dependabot on every push

### Frontend Security

- **No Private Key Handling** — All signing delegated to Freighter/xBull; private keys never leave the user's device
- **Transaction Simulation** — Every transaction simulated off-chain before wallet signing prompt
- **Slippage Warnings** — UI blocks submission if price impact > 15% without explicit confirmation
- **Content Security Policy** — Strict CSP headers block inline scripts and unauthorized sources
- **Subresource Integrity** — SRI hashes enforced on all external resources

---

## 🚀 Getting Started

### Prerequisites

```bash
# Node.js via nvm
nvm install 20 && nvm use 20

# Rust + Soroban target
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Soroban CLI
cargo install --locked soroban-cli --features opt

# Angular CLI
npm install -g @angular/cli@17

# Docker
docker --version       # 24.x+
docker compose version # 2.x+
```

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/soropool/soropool.git
cd soropool

# 2. Set up environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit each .env file with your config

# 3. Start infrastructure
docker compose up -d postgres redis rabbitmq

# 4. Run DB migrations
make migrate

# 5. Seed development data (demo pools, tokens)
make seed

# 6. Start backend
cd backend && npm install && npm run start:dev

# 7. Start frontend (new terminal)
cd frontend && npm install && ng serve

# 8. Deploy contracts to testnet
cd contracts && make deploy-testnet

# Visit: http://localhost:4200
# API Docs: http://localhost:3000/api/docs
```

### Makefile Commands

```bash
make dev              # Start all services via docker compose
make migrate          # Run all pending DB migrations
make seed             # Seed demo data
make test             # Run all tests (contracts + backend + frontend)
make lint             # Lint all workspaces
make build            # Build all for production
make deploy-staging   # Deploy to staging environment
make deploy-prod      # Deploy to production (requires approval)
make logs             # Tail all service logs
make clean            # Stop and remove all containers + volumes
```

---

## ⚙️ Environment Variables

### Backend `.env`

```dotenv
# App
NODE_ENV=development
PORT=3000
WS_PORT=3001
API_PREFIX=api/v1

# Database (TimescaleDB / PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=soropool
DATABASE_USER=soropool
DATABASE_PASSWORD=your_password
DATABASE_SSL=false
DATABASE_POOL_SIZE=20

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_TTL_SECONDS=300

# RabbitMQ
RABBITMQ_URL=amqp://soropool:password@localhost:5672

# JWT
JWT_SECRET=your_minimum_32_character_secret_key_here
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Stellar / Soroban
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# Contract Addresses
CONTRACT_POOL_FACTORY=CTESTFACTORY...
CONTRACT_ROUTER=CTESTROUTER...
CONTRACT_FARM=CTESTFARM...
CONTRACT_GOVERNANCE=CTESTGOV...
CONTRACT_SPL_TOKEN=CTESTSPL...

# Indexer
INDEXER_START_LEDGER=1000000
INDEXER_BATCH_SIZE=100
INDEXER_POLL_INTERVAL_MS=5000

# Oracle
TWAP_WINDOW_SECONDS=1800           # 30 min TWAP
ORACLE_REFRESH_INTERVAL_SEC=60
MAX_PRICE_DEVIATION_PCT=5

# Routing Engine
MAX_HOPS=3
MAX_ROUTES_CONSIDERED=20
ROUTING_CACHE_TTL_MS=2000

# Notifications
SENDGRID_API_KEY=SG.your_key
FROM_EMAIL=noreply@soropool.finance

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
```

### Frontend `environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'ws://localhost:3001',
  stellar: {
    network: 'testnet',
    networkPassphrase: 'Test SDF Network ; September 2015',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  },
  contracts: {
    poolFactory: 'CTESTFACTORY...',
    router: 'CTESTROUTER...',
    farm: 'CTESTFARM...',
  },
  swap: {
    defaultSlippageBps: 50,          // 0.50%
    defaultDeadlineMinutes: 30,
    priceImpactWarningThreshold: 0.05,  // 5%
    priceImpactBlockThreshold: 0.15,    // 15%
  },
  features: {
    concentratedLiquidity: true,
    flashSwaps: true,
    farming: true,
    governance: true,
  }
};
```

---

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts

# Run all contract tests
cargo test

# Test specific module
cargo test constant_product
cargo test stableswap
cargo test concentrated_liquidity
cargo test router

# Run with output
cargo test -- --nocapture

# Fuzz testing
cargo fuzz run fuzz_swap
cargo fuzz run fuzz_add_liquidity
```

### Backend Tests

```bash
cd backend

npm run test                     # All unit tests
npm run test:watch               # Watch mode
npm run test:e2e                 # End-to-end API tests
npm run test:cov                 # With coverage report
npm run test:amm-parity          # AMM TS ↔ Rust math parity tests
```

### Frontend Tests

```bash
cd frontend

ng test                          # Unit tests
ng test --code-coverage          # With coverage

# E2E with Cypress
npx cypress open                 # Interactive
npx cypress run                  # Headless CI mode
npx cypress run --spec "e2e/swap.cy.ts"
npx cypress run --spec "e2e/liquidity.cy.ts"
```

### Test Coverage Targets

| Layer | Unit | Integration | E2E |
|-------|------|-------------|-----|
| Smart Contracts | 95%+ | 90%+ | — |
| Backend Services | 85%+ | 75%+ | — |
| Routing Engine | 95%+ | — | — |
| AMM Math Library | 100% | — | — |
| Frontend Components | 80%+ | — | 100% (critical paths) |

---

## 📦 Deployment

### Environments

| Environment | Branch | URL | Auto-Deploy |
|-------------|--------|-----|-------------|
| Development | feature/* | localhost | — |
| Staging | develop | staging.soropool.finance | ✅ On merge |
| Production | main | soropool.finance | Manual approval |

### Production Deployment

```bash
# Automated via GitHub Actions on merge to main
# Manual:
make deploy-prod

# Verify deployment
kubectl rollout status deployment/soropool-backend -n soropool-prod
kubectl rollout status deployment/soropool-frontend -n soropool-prod

# Rollback
kubectl rollout undo deployment/soropool-backend -n soropool-prod
```

### Contract Upgrades (Governance-Gated)

```bash
# 1. Build new WASM
cargo build --target wasm32-unknown-unknown --release --manifest-path contracts/constant-product-pool/Cargo.toml

# 2. Submit upgrade proposal to governance (48h voting)
soroban contract invoke --id $GOVERNANCE_CONTRACT \
  -- propose_upgrade \
  --contract_id $POOL_CONTRACT \
  --new_wasm target/wasm32-unknown-unknown/release/constant_product_pool.wasm \
  --description "Pool v1.3 — reduced gas, improved precision"

# 3. After vote passes + 24h timelock:
soroban contract invoke --id $GOVERNANCE_CONTRACT -- execute_upgrade --proposal_id 42
```

---

## 📊 Monitoring & Observability

### Key Prometheus Metrics

```
# DEX core metrics
soropool_tvl_usd_total                      - Total protocol TVL
soropool_volume_usd{interval="24h"}         - Trading volume
soropool_swap_count_total{pool}             - Swap count per pool
soropool_fee_revenue_usd{interval="24h"}    - Fee revenue
soropool_pool_utilization{pool}             - Pool utilization rate

# Routing metrics
soropool_routing_latency_ms                 - Route computation latency
soropool_routes_found_total{hops}           - Routes found by hop count
soropool_split_routes_total                 - Split route executions

# Indexer metrics
soropool_indexer_lag_seconds                - Indexer lag behind chain head
soropool_events_processed_total            - Events processed
soropool_indexer_errors_total              - Indexer errors

# WebSocket metrics
soropool_ws_connections{type}              - Active WebSocket connections
soropool_ws_messages_per_second            - Message throughput

# API metrics
http_request_duration_seconds{route}       - API latency per route
http_requests_total{status}               - Request count by status
```

### Grafana Dashboards

- **Protocol Overview** — TVL, volume, fees, pool count
- **Swap Analytics** — Volume by pair, fee revenue, routing paths
- **Liquidity Depth** — Pool liquidity distributions, CL tick activity
- **Infrastructure** — API latency, error rates, pod health
- **Indexer Health** — Chain lag, event processing rate

**Grafana:** `https://grafana.soropool.finance`

### Alerting Rules

```yaml
# High-severity alerts (PagerDuty)
- Indexer lag > 2 minutes
- API error rate > 2% over 5 minutes
- TWAP oracle stale > 10 minutes
- TVL drops > 20% in 1 hour (possible exploit)
- Any pool reserve drops > 30% in 1 block

# Medium-severity alerts (Slack)
- API p99 latency > 2 seconds
- WebSocket connection count drops > 50%
- Routing engine cache miss rate > 80%
- Farm contract SPL balance low (< 7 days emissions remaining)
```

---

## 💎 Tokenomics — SPL Token

The **SoroPool Token (SPL)** is the protocol's native governance and incentive token.

### Supply Distribution

| Allocation | % | Tokens | Vesting |
|------------|---|--------|---------|
| Liquidity Mining (farming) | 40% | 400,000,000 | 4-year emission curve |
| Team & Advisors | 15% | 150,000,000 | 4-year linear + 1-year cliff |
| Ecosystem Fund | 20% | 200,000,000 | DAO-controlled |
| Treasury | 15% | 150,000,000 | DAO-controlled |
| Initial Liquidity | 5% | 50,000,000 | Unlocked at launch |
| Early Backers | 5% | 50,000,000 | 2-year linear + 6-month cliff |
| **Total Supply** | **100%** | **1,000,000,000** | — |

### Emission Schedule

```
Year 1:  200,000,000 SPL (50% of farming allocation)
Year 2:  100,000,000 SPL (25%)
Year 3:   60,000,000 SPL (15%)
Year 4:   40,000,000 SPL (10%)

Emissions per pool weighted by:
  - 70%: TVL in pool
  - 20%: Trading volume generated
  - 10%: Governance vote allocation (veToken model)
```

### SPL Utility

- **Governance** — Vote on pool parameters, fee tiers, emission allocations, upgrades
- **Fee Discounts** — SPL stakers receive up to 50% trading fee discount
- **Boost Multiplier** — Staking SPL boosts farm APR up to 2.5× (veToken model)
- **Revenue Share** — 10% of protocol fees distributed to SPL stakers weekly
- **Protocol-Owned Liquidity** — Treasury uses SPL to bootstrap new pool liquidity

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
# 1. Fork & clone
git clone https://github.com/YOUR_USERNAME/soropool.git

# 2. Create branch
git checkout -b feat/your-feature

# 3. Make changes + tests
make test

# 4. Lint
make lint

# 5. Commit (Conventional Commits)
git commit -m "feat(swap): add split route visualization"

# 6. Push & open PR
git push origin feat/your-feature
```

### Commit Convention
```
feat(scope):     New feature
fix(scope):      Bug fix
perf(scope):     Performance improvement
math(scope):     AMM math changes (requires parity test update)
contract(scope): Smart contract changes
docs(scope):     Documentation
test(scope):     Tests
chore(scope):    Tooling / dependencies
```

---

## 🔍 Audits & Compliance

| Audit | Firm | Scope | Date | Status |
|-------|------|-------|------|--------|
| AMM Contracts | Trail of Bits | Full contract suite | Q1 2024 | ✅ Complete |
| Economic Model | Gauntlet | AMM math & IL analysis | Q1 2024 | ✅ Complete |
| Concentrated Liquidity | Spearbit | CL pool & tick math | Q2 2024 | ✅ Complete |
| Backend API | NCC Group | Penetration test | Q2 2024 | ✅ Complete |
| Formal Verification | Certora | Core invariants | Q3 2024 | ✅ Complete |

Audit reports are publicly available in [`/docs/audits/`](docs/audits/).

### Invariants Formally Verified

- `x * y ≥ k` always holds after any swap (constant product)
- No swap can move price beyond `sqrt_price_limit` (concentrated pool)
- LP token supply is always backed 1:1 by pool reserves
- Total fees allocated never exceed fees collected
- StableSwap `D` invariant never decreases after a swap

### Bug Bounty — [Immunefi](https://immunefi.com/bounty/soropool)

| Severity | Reward |
|----------|--------|
| Critical (funds at risk) | Up to $200,000 |
| High | Up to $50,000 |
| Medium | Up to $10,000 |
| Low | Up to $2,000 |

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Powering the liquidity backbone of the Stellar DeFi ecosystem**

[Website](https://soropool.finance) · [Twitter](https://twitter.com/soropool) · [Discord](https://discord.gg/soropool) · [Telegram](https://t.me/soropool) · [Docs](https://docs.soropool.finance) · [Analytics](https://analytics.soropool.finance)

© 2024 SoroPool Protocol. All rights reserved.

</div>
