"""
Generic base repository implementing standard CRUD operations.

All entity-specific repositories inherit from
:class:`BaseSQLAlchemyRepository` and may override or extend its methods.
"""

from __future__ import annotations

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from core.models.db import ORMBase


class BaseSQLAlchemyRepository[T: ORMBase]:
    """Generic CRUD repository for SQLAlchemy ORM models.

    Type parameter ``T`` is bound to an :class:`~core.db.models.ORMBase`
    subclass.  Subclasses should call ``super().__init__(session, ModelCls)``
    in their constructor.

    Provides:
        - :meth:`create`     — insert a new row.
        - :meth:`get_by_pk`  — fetch by primary key.
        - :meth:`list`       — paginated listing.
        - :meth:`update`     — partial update by primary key.
        - :meth:`delete`     — delete by primary key.
        - :meth:`count`      — total row count.
    """

    def __init__(self, session: Session, model_cls: type[T]):
        self._session = session
        self._model_cls = model_cls

    @property
    def session(self) -> Session:
        """The underlying SQLAlchemy session (used by services to register
        post-commit side effects such as recompute jobs)."""
        return self._session

    def create(self, **kwargs) -> T:
        """Insert a new row from keyword arguments.

        The instance is flushed (but **not** committed — the session
        scope handles that) and refreshed so auto-generated fields
        (e.g. ``id``, ``created_at``) are populated.

        Returns:
            The newly created ORM instance.
        """
        instance = self._model_cls(**kwargs)
        self._session.add(instance)
        self._session.flush() 
        self._session.refresh(instance)
        return instance

    def get_by_pk(self, pk) -> T | None:
        """Fetch a single record by its primary key.

        Args:
            pk: The primary-key value.

        Returns:
            The ORM instance, or ``None`` if not found.
        """
        return self._session.get(self._model_cls, pk)

    def list(
        self,
        skip: int | None = None,
        limit: int | None = None,
    ) -> list[T]:
        """Return a (possibly paginated) list of records.

        Args:
            skip:  Number of rows to skip (``OFFSET``).
            limit: Maximum number of rows to return (``LIMIT``).

        Returns:
            A list of ORM instances.
        """
        stmt = select(self._model_cls)
        if skip:
            stmt = stmt.offset(skip)
        if limit:
            stmt = stmt.limit(limit)
        stmt = stmt.order_by(self._model_cls.created_at.desc())
        return list(self._session.scalars(stmt).all())

    def update(self, pk, **kwargs) -> T | None:
        """Partially update an existing record.

        Only the provided keyword arguments are set on the instance.

        Args:
            pk: The primary-key value of the record to update.
            **kwargs: Column names and their new values.

        Returns:
            The updated ORM instance, or ``None`` if not found.
        """
        instance = self.get_by_pk(pk)
        if not instance:
            return None
        for key, value in kwargs.items():
            setattr(instance, key, value)
        self._session.flush()
        self._session.refresh(instance)
        return instance


    def delete(self, pk) -> bool:
        """Delete a record by its primary key.

        Args:
            pk: The primary-key value.

        Returns:
            ``True`` if the record existed and was deleted, ``False`` otherwise.
        """
        instance = self.get_by_pk(pk)
        if not instance:
            return False
        self._session.delete(instance)
        self._session.flush()
        return True

    def count(self) -> int:
        """Return the total number of rows in the table.

        Returns:
            An integer count.
        """
        stmt = select(func.count()).select_from(self._model_cls)
        return self._session.scalar(stmt) or 0