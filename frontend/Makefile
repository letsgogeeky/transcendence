.PHONY: install-local run-local run-docker clean

install-local:
	npm ci

run-local: install-local
	npm run dev

clean:
	rm -rf node_modules
	rm -rf dist

run-docker:
	docker compose build frontend
	docker compose up frontend