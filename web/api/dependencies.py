"""
FastAPI dependency wiring for the public web API.

Everything is imported from the repository root (``core.*``, ``web.api.*``),
which is the single import root for this service. It is run as
``uvicorn web.api.main:app`` from the repository root, and the Dockerfile
copies ``core/`` and ``web/api/`` into the image so that both resolve.
"""

from fastapi import Depends, Query
from sqlalchemy.orm import Session
from typing import Generator, Annotated

from core.clients.db import Database
from core.repositories.blog_repository import BlogRepository
from core.repositories.category_repository import CategoryRepository
from core.repositories.project_repository import ProjectRepository
from core.services.blog_service import BlogService
from core.services.category_service import CategoryService
from core.services.project_service import ProjectService
from core.settings import settings


# Database dependency (singleton)
_db_instance = None

def get_db() -> Database:
    """Provide the singleton ``Database`` instance.

    The instance is created lazily on first call and reused for the
    lifetime of the process.
    """
    global _db_instance
    if _db_instance is None:
        _db_instance = Database(
            db_username=settings.DATABASE_USER,
            db_password=settings.DATABASE_PASSWORD,
            db_host=settings.DATABASE_HOST,
            db_port=settings.DATABASE_PORT,
            db_name=settings.DATABASE_NAME,
            pool_size=settings.DATABASE_POOL_SIZE,
            max_overflow=settings.DATABASE_MAX_OVERFLOW,
            pool_recycle=settings.DATABASE_POOL_RECYCLE,
        )
    return _db_instance

def get_db_session(db: Annotated[Database, Depends(get_db)]) -> Generator[Session, None, None]:
    """Yield a transactional SQLAlchemy session.

    The session is committed automatically on success and rolled back on
    error.  It is closed when the request completes.
    """
    with db.session_scope() as session:
        yield session

DBSessionDependency = Annotated[Session, Depends(get_db_session)]


def get_project_repository(session: DBSessionDependency) -> ProjectRepository:
    """Provide a ``ProjectRepository`` instance for the current request."""
    return ProjectRepository(session)

ProjectRepositoryDependency = Annotated[ProjectRepository, Depends(get_project_repository)]


def get_blog_repository(session: DBSessionDependency) -> BlogRepository:
    """Provide a ``BlogRepository`` instance for the current request."""
    return BlogRepository(session)

BlogRepositoryDependency = Annotated[BlogRepository, Depends(get_blog_repository)]


def get_category_repository(session: DBSessionDependency) -> CategoryRepository:
    """Provide a ``CategoryRepository`` instance for the current request."""
    return CategoryRepository(session)

CategoryRepositoryDependency = Annotated[CategoryRepository, Depends(get_category_repository)]


def get_project_service(project_repository: ProjectRepositoryDependency) -> ProjectService:
    """Provide a ``ProjectService`` instance for the current request."""
    return ProjectService(project_repository)

ProjectServiceDependency = Annotated[ProjectService, Depends(get_project_service)]


def get_blog_service(blog_repository: BlogRepositoryDependency) -> BlogService:
    """Provide a ``BlogService`` instance for the current request."""
    return BlogService(blog_repository)

BlogServiceDependency = Annotated[BlogService, Depends(get_blog_service)]


def get_category_service(category_repository: CategoryRepositoryDependency) -> CategoryService:
    """Provide a ``CategoryService`` instance for the current request."""
    return CategoryService(category_repository)

CategoryServiceDependency = Annotated[CategoryService, Depends(get_category_service)]


# ── Shared query parameters ───────────────────────────────────────────
#
# Both bounds are enforced, not merely defaulted. `limit` in particular was
# previously unvalidated, and the list routes divide by it to compute
# `total_pages` — so `?limit=0` was a 500 reachable by anyone who typed it
# into the address bar. `ge=1` makes it a 422 instead, and `le=100` stops a
# single request from asking for the entire table.

SkipParam = Annotated[int, Query(ge=0, description="Number of records to skip.")]
LimitParam = Annotated[int, Query(ge=1, le=100, description="Maximum records per page.")]
