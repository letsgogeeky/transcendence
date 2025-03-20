.PHONY: build-frontend run-frontend

build-frontend:
	docker compose build frontend

run-frontend: build-frontend
	docker compose up frontend

build-auth:
	docker compose build auth

up:
	@docker compose -f ./docker-compose.yml up --build -d

down : 
	@docker compose -f ./docker-compose.yml down

stop : 
	@docker compose -f ./docker-compose.yml stop

start : 
	@docker compose -f ./docker-compose.yml start

status : 
	docker compose -f ./docker-compose.yml ps

clean: stop

# docker-compose up -d