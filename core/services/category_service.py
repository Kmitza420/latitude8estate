"""Editorial category business logic."""

from __future__ import annotations

import uuid

from core.models.db import Category
from core.models.dto import CategoryCreate, CategoryResponse, CategoryUpdate
from core.repositories.category_repository import CategoryRepository
from core.services.base import to_columns

#: Fields on the category DTOs backed by JSONB columns.
_JSONB_FIELDS = {"image"}


class CategoryService:
    """Reads and writes the taxonomy behind the lifestyle section."""

    def __init__(self, category_repository: CategoryRepository):
        self.category_repository = category_repository

    @staticmethod
    def _response(category: Category) -> CategoryResponse:
        return CategoryResponse.model_validate(category)

    def create_category(self, category_data: CategoryCreate) -> CategoryResponse:
        """Insert a new category."""
        category = self.category_repository.create(**to_columns(category_data, _JSONB_FIELDS))
        return self._response(category)

    def get_category(self, category_id: uuid.UUID) -> CategoryResponse | None:
        """Fetch one category by id."""
        category = self.category_repository.get_by_pk(category_id)
        return self._response(category) if category else None

    def get_category_by_slug(self, slug: str) -> CategoryResponse | None:
        """Fetch one category by the slug the site routes on."""
        category = self.category_repository.get_by_slug(slug)
        return self._response(category) if category else None

    def update_category(self, category_id: uuid.UUID, category_data: CategoryUpdate) -> CategoryResponse | None:
        """Apply a partial update to a category."""
        category = self.category_repository.update(
            category_id, **to_columns(category_data, _JSONB_FIELDS)
        )
        return self._response(category) if category else None

    def delete_category(self, category_id: uuid.UUID) -> bool:
        """Delete a category. Returns ``False`` if it did not exist."""
        return self.category_repository.delete(category_id)

    def list_categories(self, featured_only: bool = False) -> list[CategoryResponse]:
        """Return the taxonomy, alphabetically.

        Args:
            featured_only: Restrict to the categories flagged for the tile row
                on the lifestyle index.
        """
        categories = (
            self.category_repository.list_featured()
            if featured_only
            else self.category_repository.list()
        )
        return [self._response(c) for c in categories]
