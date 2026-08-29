import uuid

from fastapi import APIRouter
from fastapi.exceptions import HTTPException

from core.models.dto import PagninatedResponse, PaginationMetadata, ProjectResponse
from web.api.dependencies import ProjectServiceDependency


router = APIRouter(prefix="/blogs", tags=["Blogs"])


PaginatedProjectsResponse = PagninatedResponse[ProjectResponse]

@router.get("/", response_model=PaginatedProjectsResponse)
async def list_projects(service: ProjectServiceDependency, skip: int = 0, limit: int = 10):
    items = service.list_projects(skip=skip, limit=limit)
    count = service.count_projects()
    return PaginatedProjectsResponse(
        items=items,
        metadata=PaginationMetadata(
            total_items=count,
            total_pages=(count + limit - 1) // limit,
            current_page=(skip // limit) + 1,
            skip=skip,
            limit=limit,
        )
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: uuid.UUID, service: ProjectServiceDependency):
    project = service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
