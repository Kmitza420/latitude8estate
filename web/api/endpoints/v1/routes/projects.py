"""
Project (portfolio) routes.

Route order matters here: ``/featured`` and ``/by-slug/{slug}`` are declared
before ``/{project_id}``, because FastAPI matches in declaration order and
``/{project_id}`` would otherwise swallow both and fail UUID validation.
"""

import uuid

from fastapi import APIRouter
from fastapi.exceptions import HTTPException

from core.models.dto import PaginatedResponse, PaginationMetadata, ProjectResponse
from web.api.dependencies import LimitParam, ProjectServiceDependency, SkipParam


router = APIRouter(prefix="/projects", tags=["Projects"])


PaginatedProjectsResponse = PaginatedResponse[ProjectResponse]


@router.get("/", response_model=PaginatedProjectsResponse)
async def list_projects(service: ProjectServiceDependency, skip: SkipParam = 0, limit: LimitParam = 10):
    """Return one page of projects, newest first.

    The ordering is total (``created_at DESC, id``), so paging through the
    portfolio cannot repeat or skip a listing.
    """
    items = service.list_projects(skip=skip, limit=limit)
    count = service.count_projects()
    return PaginatedProjectsResponse(
        items=items,
        metadata=PaginationMetadata.build(total_items=count, skip=skip, limit=limit),
    )


@router.get("/featured", response_model=list[ProjectResponse])
async def list_featured_projects(service: ProjectServiceDependency, limit: LimitParam = 3):
    """Return the projects for the home page rail.

    Unpaginated by design — the layout holds a fixed, small number.
    """
    return service.list_featured_projects(limit=limit)


@router.get("/by-slug/{slug}", response_model=ProjectResponse)
async def get_project_by_slug(slug: str, service: ProjectServiceDependency):
    """Return one project by the slug the site routes on."""
    project = service.get_project_by_slug(slug)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: uuid.UUID, service: ProjectServiceDependency):
    """Return one project by id."""
    project = service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
