from fastapi import APIRouter

from web.api.endpoints.v1.routes import blogs, categories, projects


router = APIRouter(prefix="/v1")

router.include_router(projects.router)
router.include_router(blogs.router)
router.include_router(categories.router)
