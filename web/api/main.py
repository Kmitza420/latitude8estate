"""
FastAPI Application Entrypoint
==========================================

This module creates and configures the FastAPI application instance.

Responsibilities:
    - Application lifespan management (startup / shutdown).
    - CORS middleware configuration (locked to the UI origin in production).
    - Global exception handlers for database and object-storage errors.
    - Mounting the versioned API router (``/v1``).
    - Disabling OpenAPI / Swagger UI in production.

Run from the **repository root** — that is the single import root for this
service, so that ``core.*`` and ``web.api.*`` both resolve::

    uvicorn web.api.main:app --reload --host 0.0.0.0 --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.exc import OperationalError, ProgrammingError, IntegrityError
from minio.error import MinioException

from core.settings import settings
from web.api.dependencies import get_db
from web.api.endpoints.v1.router import router as v1_router


# ── Logging ───────────────────────────────────────────────────────────

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    **Startup:**
        - Initialises and verifies the PostgreSQL database connection.
        - Raises ``ConnectionError`` if the database is unreachable.

    **Shutdown:**
        - Logs a clean shutdown message.  Resources are released by
          the garbage collector / connection-pool finalizers.
    """
    logger.info("Starting up Latitude 8 Estate API  [env=%s] …", settings.ENVIRONMENT)

    # The same singleton the request dependencies use, so the process holds
    # one connection pool rather than two.
    db = get_db()
    logger.info("Database connection initialized")

    if not db.test_connection():
        logger.critical("Database connection test failed")
        raise ConnectionError("Failed to connect to the database")
    logger.info("Database connection verified")

    yield

    logger.info("Latitude 8 Estate API shut down complete")


# ── Application factory ──────────────────────────────────────────────

def create_app() -> FastAPI:
    """Build and return the configured FastAPI application."""

    # In production: hide Swagger UI, ReDoc, and the OpenAPI JSON schema.
    openapi_kwargs = {}
    if settings.is_production:
        openapi_kwargs.update(docs_url=None, redoc_url=None, openapi_url=None)

    application = FastAPI(
        title="Latitude 8 Estate API",
        version="1.0.0",
        lifespan=lifespan,
        redirect_slashes=False,
        **openapi_kwargs,
    )

    # ── CORS ──────────────────────────────────────────────────────────
    origins = settings.cors_origins

    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Trusted Host (production only) ────────────────────────────────
    if settings.is_production:
        allowed_hosts: list[str] = ["localhost"]
        for origin in origins:
            # strip scheme to get bare hostname
            host = origin.split("://", 1)[-1].rstrip("/")
            if host:
                allowed_hosts.append(host)
        if allowed_hosts:
            application.add_middleware(
                TrustedHostMiddleware,
                allowed_hosts=allowed_hosts,
            )

    # ── Exception handlers ────────────────────────────────────────────

    @application.exception_handler(OperationalError)
    async def _db_conn_error(_request: Request, _exc: OperationalError):
        return JSONResponse(content={"detail": "Database connection error"}, status_code=500)

    @application.exception_handler(ProgrammingError)
    async def _db_query_error(_request: Request, _exc: ProgrammingError):
        return JSONResponse(content={"detail": "Database query error"}, status_code=500)

    @application.exception_handler(IntegrityError)
    async def _db_integrity_error(_request: Request, _exc: IntegrityError):
        return JSONResponse(content={"detail": "Database integrity error"}, status_code=400)

    @application.exception_handler(MinioException)
    async def _minio_error(_request: Request, _exc: MinioException):
        return JSONResponse(content={"detail": "Object storage error"}, status_code=500)

    # ── Routers ───────────────────────────────────────────────────────
    application.include_router(v1_router)

    # ── Utility endpoints ─────────────────────────────────────────────

    @application.get("/health", tags=["Health"], include_in_schema=False)
    async def health():
        """Health check endpoint.

        Executes a real query rather than returning a constant. A check that
        does not touch the database stays green while every request 500s,
        which makes it worse than no check at all — an orchestrator will
        happily keep routing traffic to a broken instance.
        """
        if not get_db().test_connection():
            return JSONResponse(
                content={"status": "unhealthy", "detail": "Database unreachable"},
                status_code=503,
            )
        return {"status": "ok"}

    return application


app = create_app()