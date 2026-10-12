"""Property project business logic."""

from __future__ import annotations

import uuid

from core.models.db import Project
from core.models.dto import ProjectCreate, ProjectResponse, ProjectUpdate
from core.repositories.project_repository import ProjectRepository
from core.services.base import to_columns

#: Fields on the project DTOs backed by JSONB columns.
_JSONB_FIELDS = {"location", "features", "media", "documents"}


class ProjectService:
    """Reads and writes projects, returning DTOs rather than ORM rows.

    Callers never see a :class:`~core.models.db.Project`. That is what keeps
    the ``MediaRef`` → ``MediaResponse`` resolution — the object key becoming
    a browser-reachable URL — in one place instead of at every call site.
    """

    def __init__(self, project_repository: ProjectRepository):
        self.project_repository = project_repository

    @staticmethod
    def _response(project: Project) -> ProjectResponse:
        """Convert one ORM row into its response DTO."""
        return ProjectResponse.model_validate(project)

    def create_project(self, project_data: ProjectCreate) -> ProjectResponse:
        """Insert a new project."""
        project = self.project_repository.create(**to_columns(project_data, _JSONB_FIELDS))
        return self._response(project)

    def get_project(self, project_id: uuid.UUID) -> ProjectResponse | None:
        """Fetch one project by id."""
        project = self.project_repository.get_by_pk(project_id)
        return self._response(project) if project else None

    def get_project_by_slug(self, slug: str) -> ProjectResponse | None:
        """Fetch one project by the slug the site routes on."""
        project = self.project_repository.get_by_slug(slug)
        return self._response(project) if project else None

    def update_project(self, project_id: uuid.UUID, project_data: ProjectUpdate) -> ProjectResponse | None:
        """Apply a partial update to a project."""
        project = self.project_repository.update(
            project_id, **to_columns(project_data, _JSONB_FIELDS)
        )
        return self._response(project) if project else None

    def delete_project(self, project_id: uuid.UUID) -> bool:
        """Delete a project. Returns ``False`` if it did not exist."""
        return self.project_repository.delete(project_id)

    def list_projects(self, skip: int = 0, limit: int = 10) -> list[ProjectResponse]:
        """Return one page of projects, newest first."""
        return [self._response(p) for p in self.project_repository.list(skip=skip, limit=limit)]

    def count_projects(self) -> int:
        """Return the total number of projects."""
        return self.project_repository.count()

    def list_featured_projects(self, limit: int = 3) -> list[ProjectResponse]:
        """Return the projects for the home page rail.

        Falls back to the newest listings when nothing has been flagged, so
        the rail is never empty on a freshly populated database.
        """
        featured = self.project_repository.list_featured(limit=limit)
        if not featured:
            featured = self.project_repository.list(limit=limit)
        return [self._response(p) for p in featured]
