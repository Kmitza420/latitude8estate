# Built from the REPOSITORY ROOT, not from web/api.
#
#   docker build -f web/api/Dockerfile .
#
# The service imports `core.*` as well as `web.api.*`, and a context of
# ./web/api cannot reach core/ — the container built that way starts and
# then dies on `import core.settings`. docker-compose.yml sets
# `context: .` accordingly.

FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY web/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Both import roots the service needs, plus the operational scripts, so the
# database can be created and seeded with
# `docker compose run --rm web_api python -m scripts.seed` — no local Python
# environment required.
COPY core/ ./core/
COPY scripts/ ./scripts/
COPY web/__init__.py ./web/
COPY web/api/ ./web/api/

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "web.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
