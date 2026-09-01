"""Blog author persistence."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.repositories.base import BaseSQLAlchemyRepository
from core.models.db import Author


class AuthorRepository(BaseSQLAlchemyRepository[Author]):
    """Reads and writes :class:`~core.models.db.Author` rows."""

    def __init__(self, session: Session):
        super().__init__(session, Author)

    def default_select(self):
        """Authors read alphabetically."""
        return select(Author).order_by(Author.name, Author.id)
