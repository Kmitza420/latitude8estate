"""Property project persistence."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.repositories.base import BaseSQLAlchemyRepository
from core.models.db import Project


class ProjectRepository(BaseSQLAlchemyRepository[Project]):
    """Reads and writes :class:`~core.models.db.Project` rows.

    Every project status is public, ``planned`` included: a pre-launch
    development is exactly what the portfolio is there to advertise, and the
    site renders the status as a badge on the card.
    """

    def __init__(self, session: Session):
        super().__init__(session, Project)

    def list_featured(self, limit: int = 3) -> list[Project]:
        """Return the projects flagged ``featured``, newest first.

        Backs the "Featured Estates" rail on the home page. The flag is
        editorial, so an empty result means nothing has been flagged — the
        caller decides whether to fall back to the newest listings.
        """
        stmt = self.default_select().where(Project.featured.is_(True)).limit(limit)
        return list(self._session.scalars(stmt).all())

    def get_by_slug(self, slug: str) -> Project | None:
        """Fetch one project by the slug the site routes on."""
        return self._session.scalars(select(Project).where(Project.slug == slug)).first()
