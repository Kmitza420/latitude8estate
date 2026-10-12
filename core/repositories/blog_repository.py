"""Blog post persistence."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.repositories.base import BaseSQLAlchemyRepository
from core.models.db import Blog
from core.models.dto import BlogStatus


class BlogRepository(BaseSQLAlchemyRepository[Blog]):
    """Reads and writes :class:`~core.models.db.Blog` rows.

    The ``*_published`` methods are what the public API uses. Filtering by
    status here rather than in the client is the point: a draft that is
    filtered out in the browser has still been sent to the browser, and
    anyone can read it.
    """

    def __init__(self, session: Session):
        super().__init__(session, Blog)

    def published_select(self):
        """Base ``SELECT`` over published posts, newest first.

        ``published_at`` is nullable, so ``NULLS LAST`` keeps a published row
        with no date from jumping to the top of the list under PostgreSQL's
        ``DESC`` default. ``id`` makes the ordering total.
        """
        return (
            select(Blog)
            .where(Blog.status == BlogStatus.PUBLISHED)
            .order_by(Blog.published_at.desc().nulls_last(), Blog.id)
        )

    def list_published(self, skip: int | None = None, limit: int | None = None) -> list[Blog]:
        """Return a page of published posts, newest first."""
        stmt = self.paginate(self.published_select(), skip, limit)
        return list(self._session.scalars(stmt).all())

    def count_published(self) -> int:
        """Return the number of published posts."""
        return self.count(Blog.status == BlogStatus.PUBLISHED)

    def list_featured(self, limit: int = 1) -> list[Blog]:
        """Return the published posts flagged ``featured``, newest first."""
        stmt = self.published_select().where(Blog.featured.is_(True)).limit(limit)
        return list(self._session.scalars(stmt).all())

    def get_by_slug(self, slug: str, published_only: bool = True) -> Blog | None:
        """Fetch one post by its slug.

        Args:
            slug:           The URL segment the site routes on.
            published_only: When true (the default, and what the public API
                            passes), an unpublished post reads as absent.

        Returns:
            The post, or ``None``.
        """
        stmt = select(Blog).where(Blog.slug == slug)
        if published_only:
            stmt = stmt.where(Blog.status == BlogStatus.PUBLISHED)
        return self._session.scalars(stmt).first()

    def list_by_category(
        self,
        category_id,
        skip: int | None = None,
        limit: int | None = None,
    ) -> list[Blog]:
        """Return a page of published posts filed under one category."""
        stmt = self.paginate(
            self.published_select().where(Blog.category_id == category_id), skip, limit
        )
        return list(self._session.scalars(stmt).all())

    def count_by_category(self, category_id) -> int:
        """Return the number of published posts in one category."""
        return self.count(
            Blog.status == BlogStatus.PUBLISHED, Blog.category_id == category_id
        )
