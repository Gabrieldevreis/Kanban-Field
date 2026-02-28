.PHONY: help docker dev-backend dev-frontend dev test-unit test-e2e test

help:
	@echo "Comandos disponíveis:"
	@echo ""
	@echo "  make docker        - Iniciar PostgreSQL (Docker)"
	@echo "  make dev-backend   - Rodar backend"
	@echo "  make dev-frontend  - Rodar frontend"
	@echo "  make dev           - Rodar Docker + backend + frontend"
	@echo "  make test-unit     - Rodar testes unitários"
	@echo "  make test-e2e      - Rodar testes de integração"
	@echo "  make test          - Rodar todos os testes (unitários + integração)"

docker:
	@echo "🐘 Iniciando PostgreSQL..."
	docker network create kanban-networks 2>/dev/null || true
	docker compose up -d
	@sleep 3

dev-backend:
	@echo "🚀 Iniciando backend..."
	cd backend && npm run start:dev

dev-frontend:
	@echo "🚀 Iniciando frontend..."
	cd frontend && npm start

dev:
	@echo "🚀 Iniciando ambiente completo..."
	@if [ ! -d "backend/node_modules" ]; then \
		echo "📦 Instalando dependências do backend..."; \
		cd backend && npm install; \
	fi
	@if [ ! -d "frontend/node_modules" ]; then \
		echo "📦 Instalando dependências do frontend..."; \
		cd frontend && npm install; \
	fi
	@if [ ! -d "backend/node_modules/.prisma" ]; then \
		echo "🗄️  Gerando cliente Prisma..."; \
		cd backend && npx prisma generate; \
	fi
	@make docker
	@echo "🗄️  Rodando migrations do Prisma..."
	@cd backend && npx prisma migrate deploy || npx prisma migrate dev
	@(trap 'kill 0' SIGINT; \
	cd backend && npm run start:dev & \
	cd frontend && npm start & \
	wait)

test-unit:
	@echo "🧪 Rodando testes unitários..."
	cd backend && npm run test
	cd frontend && npm test -- --watch=false --browsers=ChromeHeadless

test-e2e:
	@echo "🔗 Rodando testes de integração..."
	@make docker
	cd backend && npm run test:e2e

test: test-unit test-e2e
	@echo "✅ Todos os testes concluídos!"
