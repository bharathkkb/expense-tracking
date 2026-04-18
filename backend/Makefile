.PHONY: install test run build

install:
	python3 -m venv venv && \
	. venv/bin/activate && \
	pip install -r requirements.txt

test:
	pytest -v

run:
	uvicorn main:app --reload --port 8080

build:
	docker compose -f ../docker-compose.yml build backend
