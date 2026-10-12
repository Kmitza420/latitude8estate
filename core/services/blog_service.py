"""Blog post business logic."""

from __future__ import annotations

import uuid

from core.models.db import Blog
from core.models.dto import BlogCreate, BlogResponse, BlogStatus, BlogSummary, BlogUpdate
from core.repositories.blog_repository import BlogRepository
from core.services.base import to_columns
from core.services.sanitize import sanitize_html

#: Fields on the blog DTOs backed by JSONB columns.
_JSONB_FIELDS = {"featured_image"}


class BlogService:
    """Reads and writes blog posts, returning DTOs rather than ORM rows.

    Two responsibilities beyond plain delegation:

    * **Sanitisation.** ``content`` is sanitised on the way in and again on
      the way out — see :mod:`core.services.sanitize`.
    * **Summaries.** List calls return :class:`BlogSummary`, which has no
      ``content``. A listing that ships every article's full HTML does not
      survive a real catalogue.
    """

    def __init__(self, blog_repository: BlogRepository):
        self.blog_repository = blog_repository

    @staticmethod
    def _summary(blog: Blog) -> BlogSummary:
        """Convert one ORM row into its summary DTO (no body)."""
        return BlogSummary.model_validate(blog)

    @staticmethod
    def _response(blog: Blog) -> BlogResponse:
        """Convert one ORM row into its full DTO, sanitising the body on read."""
        response = BlogResponse.model_validate(blog)
        return response.model_copy(update={"content": sanitize_html(response.content)})

    def create_blog(self, blog_data: BlogCreate) -> BlogResponse:
        """Insert a new post, sanitising its body first."""
        values = to_columns(blog_data, _JSONB_FIELDS)
        if "content" in values:
            values["content"] = sanitize_html(values["content"])
        return self._response(self.blog_repository.create(**values))

    def get_blog(self, blog_id: uuid.UUID, published_only: bool = True) -> BlogResponse | None:
        """Fetch one post by id, body included.

        Defaults to published-only for the same reason
        :meth:`get_blog_by_slug` does. Filtering the list route but not the
        detail route would leave every draft readable by anyone holding its
        id, which is a link away from being public.
        """
        blog = self.blog_repository.get_by_pk(blog_id)
        if not blog:
            return None
        if published_only and blog.status != BlogStatus.PUBLISHED:
            return None
        return self._response(blog)

    def get_blog_by_slug(self, slug: str, published_only: bool = True) -> BlogResponse | None:
        """Fetch one post by slug, body included.

        Defaults to published-only, which is what the public API wants: an
        unpublished post must read as absent, not as forbidden.
        """
        blog = self.blog_repository.get_by_slug(slug, published_only=published_only)
        return self._response(blog) if blog else None

    def update_blog(self, blog_id: uuid.UUID, blog_data: BlogUpdate) -> BlogResponse | None:
        """Apply a partial update to a post, sanitising the body if it changed."""
        values = to_columns(blog_data, _JSONB_FIELDS)
        if "content" in values:
            values["content"] = sanitize_html(values["content"])
        blog = self.blog_repository.update(blog_id, **values)
        return self._response(blog) if blog else None

    def delete_blog(self, blog_id: uuid.UUID) -> bool:
        """Delete a post. Returns ``False`` if it did not exist."""
        return self.blog_repository.delete(blog_id)

    def list_published(self, skip: int = 0, limit: int = 10) -> list[BlogSummary]:
        """Return one page of published posts, newest first."""
        return [self._summary(b) for b in self.blog_repository.list_published(skip=skip, limit=limit)]

    def count_published(self) -> int:
        """Return the number of published posts."""
        return self.blog_repository.count_published()

    def list_featured(self, limit: int = 1) -> list[BlogSummary]:
        """Return the lead articles for the lifestyle index and home page.

        Falls back to the newest published posts when nothing is flagged.
        """
        featured = self.blog_repository.list_featured(limit=limit)
        if not featured:
            featured = self.blog_repository.list_published(limit=limit)
        return [self._summary(b) for b in featured]

    def list_by_category(
        self, category_id: uuid.UUID, skip: int = 0, limit: int = 10
    ) -> list[BlogSummary]:
        """Return one page of published posts filed under one category."""
        blogs = self.blog_repository.list_by_category(category_id, skip=skip, limit=limit)
        return [self._summary(b) for b in blogs]

    def count_by_category(self, category_id: uuid.UUID) -> int:
        """Return the number of published posts in one category."""
        return self.blog_repository.count_by_category(category_id)
