"""Editorial category persistence."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.repositories.base import BaseSQLAlchemyRepository
from core.models.db import Category


class CategoryRepository(BaseSQLAlchemyRepository[Category]):
    """Reads and writes :class:`~core.models.db.Category` rows."""

    def __init__(self, session: Session):
        super().__init__(session, Category)

    def default_select(self):
        """Categories read alphabetically, not newest-first.

        A taxonomy is navigation, and navigation that reorders itself when an
        editor adds a category is worse than one that does not.
        """
        return select(Category).order_by(Category.name, Category.id)

    def get_by_slug(self, slug: str) -> Category | None:
        """Fetch one category by the slug the site routes on."""
        return self._session.scalars(select(Category).where(Category.slug == slug)).first()

    def list_featured(self) -> list[Category]:
        """Return the categories flagged for the tile row on the lifestyle index."""
        stmt = self.default_select().where(Category.featured.is_(True))
        return list(self._session.scalars(stmt).all())
