.PHONY: build-frontend run-frontend fclean help

# ANSI color codes
BLUE = \033[1;34m
GREEN = \033[1;32m
NC = \033[0m

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
	@echo "$(GREEN)Services started successfully!$(NC)"
	@echo "$(BLUE)To see the services, run: make help$(NC)"

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

help:
	@echo "$(BLUE)=== Core Application Services ===$(NC)"
	@echo "$(GREEN)Auth Service$(NC)"
	@echo "  Location: ./backend/auth"
	@echo "  Port: 8081"
	@echo "  Protocol: HTTP"
	@echo "  Database: SQLite at /app/db/auth.db"
	@echo ""
	@echo "$(GREEN)Match Service$(NC)"
	@echo "  Location: ./backend/match"
	@echo "  Port: 8082"
	@echo "  Protocol: HTTP"
	@echo "  Database: SQLite at /app/db/match.db"
	@echo ""
	@echo "$(GREEN)Chat Service$(NC)"
	@echo "  Location: ./backend/chat"
	@echo "  Port: 8083"
	@echo "  Protocol: HTTP"
	@echo "  Database: SQLite at /app/db/chat.db"
	@echo ""
	@echo "$(GREEN)Frontend Service$(NC)"
	@echo "  Location: ./frontend"
	@echo "  Port: 3000"
	@echo "  Protocol: HTTP"
	@echo ""
	@echo "$(BLUE)=== Infrastructure Services ===$(NC)"
	@echo "$(GREEN)Nginx$(NC)"
	@echo "  Location: ./infra/nginx"
	@echo "  Ports: 80:80 (HTTP), 443:443 (HTTPS)"
	@echo "  Protocol: HTTP/HTTPS"
	@echo ""
	@echo "$(GREEN)Nginx Exporter$(NC)"
	@echo "  Image: nginx/nginx-prometheus-exporter"
	@echo "  Port: 9113"
	@echo "  Protocol: HTTP"
	@echo ""
	@echo "$(GREEN)Node Exporter$(NC)"
	@echo "  Image: prom/node-exporter"
	@echo "  Port: 9100"
	@echo "  Protocol: HTTP"
	@echo ""
	@echo "$(GREEN)Prometheus$(NC)"
	@echo "  Image: prom/prometheus"
	@echo "  Port: 9090"
	@echo "  Protocol: HTTP"
	@echo ""
	@echo "$(GREEN)Grafana$(NC)"
	@echo "  Image: grafana/grafana"
	@echo "  Port: 3001"
	@echo "  Protocol: HTTP"
	@echo ""
	@echo "$(BLUE)=== Network Configuration ===$(NC)"
	@echo "All services are connected through a bridge network named app-network"
	@echo ""
	@echo "$(BLUE)=== Volume Mounts ===$(NC)"
	@echo "Common volumes shared across services:"
	@echo "  - ./certs (SSL certificates)"
	@echo "  - ./uploads (file storage)"
	@echo "  - ./db (database files)"
	@echo "Each service has its own source code mounted from its respective directory"

