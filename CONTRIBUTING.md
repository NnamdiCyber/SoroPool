# Contributing to SoroPool

Thank you for your interest in contributing to SoroPool! This guide covers setup, code style, and the PR process.

---

## Setup

### Prerequisites

```bash
# Node.js 20 via nvm
nvm install 20 && nvm use 20

# Rust + Soroban
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
cargo install --locked soroban-cli --features opt

# Angular CLI
npm install -g @angular/cli@17

# Docker (24.x+)
docker --version
docker compose version
```

### Clone and run

```bash
git clone https://github.com/soropool/soropool.git
cd soropool
cp .env.example .env
cp backend/.env.example backend/.env

make dev          # starts postgres + redis + rabbitmq + backend + frontend
make migrate      # run pending DB migrations
make seed         # insert demo tokens, pools, and positions
```

- App: http://localhost:4200  
- API + Swagger: http://localhost:3000/api/docs

---

## Repository structure

```
contracts/   Soroban smart contracts (Rust)
backend/     NestJS API server
frontend/    Angular 17 SPA
docs/        Architecture docs, math specs, ADRs
infrastructure/  Docker, Kubernetes, Terraform, monitoring
```

---

## Running tests

```bash
make test           # all workspaces

# Individual
cd contracts && cargo test
cd backend  && npm test
cd frontend && ng test --no-watch
```

---

## Code style

### Rust (contracts)
- Run `cargo fmt` before committing
- Lint with `cargo clippy -- -D warnings`
- All math operations use checked arithmetic — no bare `+`, `*` on `i128`

### TypeScript (backend + frontend)
- Linted with ESLint: `npm run lint`
- Formatted with Prettier: config at root `.prettierrc`
- Use `bigint` (not `number`) for on-chain token amounts

---

## Commit convention

```
feat(scope):       New feature
fix(scope):        Bug fix
perf(scope):       Performance improvement
math(scope):       AMM math changes — must include parity test update
contract(scope):   Smart contract changes
docs(scope):       Documentation only
test(scope):       Tests only
chore(scope):      Tooling / dependency updates
```

Examples:
```
feat(swap): add split route visualization
fix(pool): prevent division by zero on empty reserves
math(stableswap): implement Newton's method D invariant
contract(router): add two-hop exact-output path
```

---

## Pull request process

1. Fork the repository and create a branch:
   ```bash
   git checkout -b feat/your-feature
   ```
2. Make your changes and add tests.
3. Run `make test` and `make lint` — both must pass.
4. Commit using the convention above.
5. Push and open a PR against `develop`:
   ```bash
   git push -u origin feat/your-feature
   ```
6. Fill in the PR template: summary of changes, what was tested, any follow-up work.
7. A maintainer will review within 48 hours.

PRs that introduce new AMM math **must** update the parity test in  
`backend/src/shared/amm-math/__tests__/parity.spec.ts`.

---

## Adding a new pool type

1. **Contract** — Create `contracts/<pool-type>/src/lib.rs` with the standard interface (`initialize`, `swap_exact_in`, `swap_exact_out`, `add_liquidity`, `remove_liquidity`, `get_reserves`).
2. **Factory** — Register the new pool type in `contracts/pool-factory/src/lib.rs` and `deploy.rs`.
3. **Backend math** — Add a `<pool-type>.math.ts` in `backend/src/shared/amm-math/` and add it to the parity tests.
4. **Backend module** — Handle the new `poolType` in `SwapService.getQuote()` and `RoutingService`.
5. **Frontend** — Add the pool type badge mapping in `PoolListComponent.formatPoolType()`.
6. **Tests** — Add contract tests, backend unit tests, and parity tests.

---

## Useful `make` targets

| Target           | Description                                |
|------------------|--------------------------------------------|
| `make dev`       | Start all services via Docker Compose      |
| `make test`      | Run all tests                              |
| `make lint`      | Lint all workspaces                        |
| `make migrate`   | Run pending DB migrations                  |
| `make seed`      | Seed demo data                             |
| `make build`     | Production build (all workspaces)          |
| `make clean`     | Stop containers and remove volumes         |

---

## Need help?

- Open a GitHub Discussion for questions
- Use the `bug` label for defects, `enhancement` for feature requests
- Smart contract security issues → private disclosure via [Immunefi](https://immunefi.com/bounty/soropool)
