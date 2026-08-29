import uuid

from fastapi import APIRouter
from fastapi.exceptions import HTTPException

from core.models.dto import PagninatedResponse, PaginationMetadata, BlogResponse
from web.api.dependencies import BlogServiceDependency


router = APIRouter(prefix="/blogs", tags=["Blogs"])


PaginatedBlogsResponse = PagninatedResponse[BlogResponse]

@router.get("/", response_model=PaginatedBlogsResponse)
async def list_blogs(service: BlogServiceDependency, skip: int = 0, limit: int = 10):
    items = service.list_blogs(skip=skip, limit=limit)
    count = service.count_blogs()
    return PaginatedBlogsResponse(
        items=items,
        metadata=PaginationMetadata(
            total_items=count,
            total_pages=(count + limit - 1) // limit,
            current_page=(skip // limit) + 1,
            skip=skip,
            limit=limit,
        )
    )


@router.get("/{blog_id}", response_model=BlogResponse)
async def get_blog(blog_id: uuid.UUID, service: BlogServiceDependency):
    blog = service.get_blog(blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return blog
