"""
Blog (lifestyle) routes.

Every route here is published-only. Filtering by status server-side rather
than in the client is the point: a draft filtered out in the browser has
still been sent to the browser.

As with projects, the specific paths are declared before ``/{blog_id}`` so
that the UUID route does not swallow them.
"""

import uuid

from fastapi import APIRouter
from fastapi.exceptions import HTTPException

from core.models.dto import BlogResponse, BlogSummary, PaginatedResponse, PaginationMetadata
from web.api.dependencies import BlogServiceDependency, LimitParam, SkipParam


router = APIRouter(prefix="/blogs", tags=["Blogs"])


PaginatedBlogsResponse = PaginatedResponse[BlogSummary]


@router.get("/", response_model=PaginatedBlogsResponse)
async def list_blogs(service: BlogServiceDependency, skip: SkipParam = 0, limit: LimitParam = 10):
    """Return one page of published posts, newest first.

    Items are :class:`BlogSummary` — no ``content``. Fetch the body from the
    detail route for the one article being read.
    """
    items = service.list_published(skip=skip, limit=limit)
    count = service.count_published()
    return PaginatedBlogsResponse(
        items=items,
        metadata=PaginationMetadata.build(total_items=count, skip=skip, limit=limit),
    )


@router.get("/featured", response_model=list[BlogSummary])
async def list_featured_blogs(service: BlogServiceDependency, limit: LimitParam = 1):
    """Return the lead article(s) for the lifestyle index and home page."""
    return service.list_featured(limit=limit)


@router.get("/by-slug/{slug}", response_model=BlogResponse)
async def get_blog_by_slug(slug: str, service: BlogServiceDependency):
    """Return one published post, body included, by the slug the site routes on."""
    blog = service.get_blog_by_slug(slug)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return blog


@router.get("/{blog_id}", response_model=BlogResponse)
async def get_blog(blog_id: uuid.UUID, service: BlogServiceDependency):
    """Return one post by id, body included."""
    blog = service.get_blog(blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return blog
