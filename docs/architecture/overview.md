# Architecture Overview

## System Layers

SoroPool is composed of three layers:

1. **Smart Contracts** — Soroban (Rust) — settlement and custody of funds
2. **Backend** — NestJS — indexing, routing, analytics, API
3. **Frontend** — Angular 17 — user interface

```mermaid
graph TB
    subgraph Client["CLIENT LAYER — Angular 17 SPA"]
        Swap["Swap UI"]
        Liq["Liquidity Manager"]
        Farm["Farm & Stake"]
        Explorer["Pool Explorer"]
        Analytics["Analytics"]
    end

    subgraph API["API GATEWAY — NestJS"]
        REST["REST API"]
        WS["WebSocket Gateway"]
        Auth["Auth (SIWS/JWT)"]
        Router["Routing Engine"]
        Indexer["Soroban Indexer"]
        OracleM["TWAP Oracle"]
        AnalyticsM["Analytics"]
    end

    subgraph DB["DATA LAYER"]
        PG[("PostgreSQL\n(TimescaleDB)")]
        Redis[("Redis\nCache/Pub")]
        RMQ[("RabbitMQ\nEvent Bus")]
    end

    subgraph Chain["STELLAR / SOROBAN LAYER"]
        Factory["Pool Factory"]
        CPPool["Constant Product Pool"]
        SSPool["StableSwap Pool"]
        CLPool["Concentrated Liquidity Pool"]
        RouterC["Router Contract"]
        LPToken["LP Token"]
        FarmC["Farm Contract"]
        Gov["Governance"]
    end

    Client -->|HTTPS / WS| API
    API -->|TypeORM| PG
    API -->|ioredis| Redis
    API -->|amqplib| RMQ
    API -->|stellar-sdk| Chain
    Chain -->|Soroban RPC events| Indexer
```

## Request flows

**Swap quote:**  
Frontend → `GET /api/v1/swap/quote` → `SwapService` → `RoutingService` (graph Dijkstra) → AMM math simulation → response

**Swap execution:**  
Frontend → `POST /api/v1/swap/build` → `SwapService.buildSwapTransaction()` → unsigned XDR → Freighter wallet signs → `StellarService.submitTransaction()` → Soroban RPC

**Real-time price updates:**  
`StellarIndexerService` polls Soroban RPC → `SwapIndexerService` decodes event → updates DB → emits `pool:reserves` via `PoolsGateway` WebSocket → Frontend NgRx store

## Module summary

| Module | Responsibility |
|--------|---------------|
| `AuthModule` | Sign-In With Stellar, JWT access + refresh tokens |
| `PoolsModule` | Pool CRUD, TVL, WebSocket reserve updates |
| `SwapModule` | Quote simulation, unsigned XDR building |
| `RoutingModule` | Graph-based multi-hop path finding, split routing |
| `LiquidityModule` | LP position tracking, impermanent loss calculator |
| `FarmModule` | Yield farm positions, APR calculation |
| `OracleModule` | TWAP aggregation, price feed |
| `IndexerModule` | Soroban event polling and DB sync |
| `AnalyticsModule` | TVL, volume, fees, candlestick generation |
| `NotificationsModule` | Email / push alerts for out-of-range CL positions |
