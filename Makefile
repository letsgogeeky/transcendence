.PHONY: build-frontend run-frontend fclean

build-frontend:
	docker compose build frontend

run-frontend: build-frontend
	docker compose up frontend

build-auth:
	docker compose build auth

run:
	@make ensure-volumes
	@docker compose up --build

ensure-volumes:
	mkdir -p ./uploads
	mkdir -p ./db
	mkdir -p ./data
	mkdir -p ./data/prometheus
	mkdir -p ./data/grafana

up: ensure-volumes
	@chmod +x ./init-env.sh
	@./init-env.sh
	@make generate-certs
	@docker compose -f ./docker-compose.yml up --build -d
	@docker compose -f ./docker-compose.yml exec auth npx prisma db push
	@docker compose -f ./docker-compose.yml exec match npx prisma db push
	@docker compose -f ./docker-compose.yml exec chat npx prisma db push

down: 
	@docker compose -f ./docker-compose.yml down

restart: down up

stop: 
	@docker compose -f ./docker-compose.yml stop

start: 
	@docker compose -f ./docker-compose.yml start

status:
	@docker compose -f ./docker-compose.yml ps

log:
	@docker compose -f ./docker-compose.yml logs -f

clean: stop

generate-certs:
	@echo "Generating SSL certificates..."
	@mkdir -p certs
	@if [ ! -f "certs/server.key" ] || [ ! -f "certs/server.crt" ]; then \
		openssl genrsa -out certs/server.key 2048; \
		openssl req -new -key certs/server.key -out certs/server.csr -subj "/CN=localhost"; \
		openssl x509 -req -days 365 -in certs/server.csr -signkey certs/server.key -out certs/server.crt; \
	fi
	@if [ ! -f "frontend/localhost-key.pem" ] || [ ! -f "frontend/localhost-cert.pem" ]; then \
		openssl genrsa -out frontend/localhost-key.pem 2048; \
		openssl req -new -key frontend/localhost-key.pem -out frontend/localhost.csr -subj "/CN=localhost"; \
		openssl x509 -req -days 365 -in frontend/localhost.csr -signkey frontend/localhost-key.pem -out frontend/localhost-cert.pem; \
		rm frontend/localhost.csr; \
	fi
	@echo "SSL certificates generated successfully!"

fclean: down
	@echo "Cleaning up all generated files and volumes..."
	@docker compose -f ./docker-compose.yml down -v
	@rm -rf ./uploads
	@rm -rf ./db
	@rm -rf ./data
	@rm -rf ./certs
	@rm -f ./frontend/localhost-key.pem
	@rm -f ./frontend/localhost-cert.pem
	@rm -f ./frontend/localhost.csr
	@echo "Cleanup complete!"

re: fclean up