"""
Editorial category routes.

The lifestyle section routes on ``/lifestyle/category/{slug}``, so these are
what turn ``Blog.category_id`` from an opaque UUID into a name, a blurb and
an image the site can render.
"""

from fastapi import APIRouter, Query
from fastapi.exceptions import HTTPException

from core.models.dto import (
    BlogSummary,
    CategoryResponse,
    PaginatedResponse,
    PaginationMetadata,
)
from web.api.dependencies import (
    BlogServiceDependency,
    CategoryServiceDependency,
    LimitParam,
    SkipParam,
)


router = APIRouter(prefix="/categories", tags=["Categories"])


PaginatedBlogsResponse = PaginatedResponse[BlogSummary]


@router.get("/", response_model=list[CategoryResponse])
async def list_categories(
    service: CategoryServiceDependency,
    featured_only: bool = Query(False, description="Only categories flagged for the tile row."),
):
    """Return the taxonomy, alphabetically.

    Unpaginated: a taxonomy that needs paging is not a taxonomy.
    """
    return service.list_categories(featured_only=featured_only)


@router.get("/{slug}", response_model=CategoryResponse)
async def get_category(slug: str, service: CategoryServiceDependency):
    """Return one category by the slug the site routes on."""
    category = service.get_category_by_slug(slug)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.get("/{slug}/blogs", response_model=PaginatedBlogsResponse)
async def list_category_blogs(
    slug: str,
    category_service: CategoryServiceDependency,
    blog_service: BlogServiceDependency,
    skip: SkipParam = 0,
    limit: LimitParam = 10,
):
    """Return one page of published posts filed under a category.

    Filtering server-side keeps the category page from having to pull the
    whole catalogue to render one section of it.
    """
    category = category_service.get_category_by_slug(slug)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    items = blog_service.list_by_category(category.id, skip=skip, limit=limit)
    count = blog_service.count_by_category(category.id)
    return PaginatedBlogsResponse(
        items=items,
        metadata=PaginationMetadata.build(total_items=count, skip=skip, limit=limit),
    )
