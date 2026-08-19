from fastapi import Depends
from sqlalchemy.orm import Session
from typing import Generator, Annotated

from core.clients.db import Database
from core.repositories.blog_repository import BlogRepository
from core.repositories.project_repository import ProjectRepository
from core.services.blog_service import BlogService
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


def get_project_service(project_repository: ProjectRepositoryDependency) -> ProjectService:
    """Provide a ``ProjectService`` instance for the current request."""
    return ProjectService(project_repository)

ProjectServiceDependency = Annotated[ProjectService, Depends(get_project_service)]


def get_blog_service(blog_repository: BlogRepositoryDependency) -> BlogService:
    """Provide a ``BlogService`` instance for the current request."""
    return BlogService(blog_repository)

BlogServiceDependency = Annotated[BlogService, Depends(get_blog_service)]