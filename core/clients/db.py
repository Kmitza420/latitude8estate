"""
Database connection and session management.

Provides the ``Database`` class which encapsulates an SQLAlchemy engine
and session factory.  All database access in the application flows
through this class.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from contextlib import contextmanager

from core.models.db import ORMBase


class Database:
    """Manages the SQLAlchemy engine and provides session factories.

    Typical usage::

        db = Database(
            db_username="postgres",
            db_password="postgres",
            db_host="localhost",
            db_port=5432,
            db_name="crm_db",
        )
        with db.session_scope() as session:
            ...
    """

    def __init__(
        self,
        db_username: str,
        db_password: str,
        db_host: str,
        db_port: int,
        db_name: str,
        db_driver: str = "postgresql+psycopg2",
        pool_size: int = 5,
        max_overflow: int = 10,
        pool_recycle: int = 1800,
    ):
        """Initialise the database engine.

        Args:
            db_username:   PostgreSQL user.
            db_password:   PostgreSQL password.
            db_host:       PostgreSQL host.
            db_port:       PostgreSQL port.
            db_name:       PostgreSQL database name.
            db_driver:     SQLAlchemy driver string (default ``postgresql+psycopg2``).
            pool_size:     Number of persistent connections in the pool.
            max_overflow:  Extra connections allowed above *pool_size*.
            pool_recycle:  Seconds before a connection is transparently recycled.
        """
        database_url = URL.create(
            drivername=db_driver,
            username=db_username,
            password=db_password,
            host=db_host,
            port=db_port,
            database=db_name
        )
        self.engine = create_engine(
            database_url,
            echo=False,
            pool_pre_ping=True,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_recycle=pool_recycle,
        )
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    def get_session(self) -> Session:
        """Get a new database session."""
        return self.SessionLocal()
    
    def create_tables(self) -> None:
        """Create all tables defined in the ORM models."""
        ORMBase.metadata.create_all(bind=self.engine)

    def drop_tables(self) -> None:
        """Drop all tables defined in the ORM models. Use with caution!"""
        ORMBase.metadata.drop_all(bind=self.engine)

    @contextmanager
    def session_scope(self) -> Generator[Session, None, None]:
        """Provide a transactional scope around a series of operations.

        Commits on success, rolls back on error, and always closes the
        session.

        Yields:
            Session: A SQLAlchemy session bound to the engine.

        Example::

            with db.session_scope() as session:
                session.add(MyModel(name="example"))
                # Commits automatically on exiting the block.
        """
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def test_connection(self) -> bool:
        """Test database connection by executing a simple query."""
        try:
            with self.get_session() as session:
                session.execute(text("SELECT 1"))
        except Exception:
            return False
        return True
    
    def seed_table(self, model: type[ORMBase], data: list[dict]) -> None:
        """Seed a table with initial data rows.

        Args:
            model: The ORM model class to insert into.
            data:  List of dictionaries, each representing a row.
        """
        with self.session_scope() as session:
            for item in data:
                instance = model(**item)
                session.add(instance)
