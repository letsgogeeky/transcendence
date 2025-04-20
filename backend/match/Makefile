# Environment variables
DB_URL ?= file:../../db/match.db

migrate:
	@echo "Migrating match database..."
	@echo "Using database URL: $(DB_URL)"
	@npm install
	@DATABASE_URL=$(DB_URL) npx prisma migrate dev --name match --create-only

push:
	@echo "Pushing schema changes..."
	@echo "Using database URL: $(DB_URL)"
	@DATABASE_URL=$(DB_URL) npx prisma db push

view-db:
	@echo "Opening Prisma Studio..."
	@echo "Using database URL: $(DB_URL)"
	@DATABASE_URL=$(DB_URL) npx prisma studio

dev:
	@npm run dev

lint:
	@npm run lint

clean:
	@rm -rf prisma/db
	@rm -rf ./dist
	@rm -rf node_modules
	@rm -rf uploads/*
	@rm -rf coverage
