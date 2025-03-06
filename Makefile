.PHONY: build-frontend run-frontend

build-frontend:
	docker compose build frontend

run-frontend: build-frontend
	docker compose up frontend

