.PHONY: dev build test lint migrate seed clean deploy-staging deploy-prod logs

dev:
	docker compose up -d

build:
	cd contracts && cargo build --target wasm32-unknown-unknown --release
	cd backend && npm run build
	cd frontend && npm run build

test:
	cd contracts && cargo test -- --nocapture
	cd backend && npm run test:cov
	cd frontend && npm run test:ci

lint:
	cd contracts && cargo clippy -- -D warnings
	cd backend && npm run lint
	cd frontend && npm run lint

migrate:
	cd backend && npm run migration:run

seed:
	cd backend && npm run seed

clean:
	docker compose down -v
	rm -rf backend/dist frontend/dist contracts/target

deploy-staging:
	@echo "Deploying to staging..."
	cd infrastructure/terraform/environments/staging && terraform apply

deploy-prod:
	@echo "Deploying to production (requires approval)..."
	cd infrastructure/terraform/environments/prod && terraform apply

logs:
	docker compose logs -f
