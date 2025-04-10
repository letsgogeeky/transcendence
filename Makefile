.PHONY: build-frontend run-frontend

build-frontend:
	docker compose build frontend

run-frontend: build-frontend
	docker compose up frontend

build-auth:
	docker compose build auth

run:
	mkdir -p ./uploads
	mkdir -p ./db
	docker compose up --build

up:
	@docker compose -f ./docker-compose.yml up --build -d
	@docker compose -f ./docker-compose.yml exec auth npx prisma db push
	@docker compose -f ./docker-compose.yml exec match npx prisma db push

down: 
	@docker compose -f ./docker-compose.yml down

stop: 
	@docker compose -f ./docker-compose.yml stop

start: 
	@docker compose -f ./docker-compose.yml start

status:
	@docker compose -f ./docker-compose.yml ps

clean: stop

generate-certs:
	openssl genrsa -out certs/server.key 2048
	openssl req -new -key certs/server.key -out certs/server.csr -subj "/CN=localhost"
	openssl x509 -req -days 365 -in certs/server.csr -signkey certs/server.key -out certs/server.crt

# docker-compose up -d