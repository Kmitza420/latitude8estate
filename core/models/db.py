"""
SQLAlchemy ORM model definitions.
"""

from sqlalchemy.orm import DeclarativeBase


class ORMBase(DeclarativeBase):
    """Base class for all ORM models."""
