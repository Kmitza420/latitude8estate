from fastapi import APIRouter

from endpoints.v1.routes import projects, blogs


router = APIRouter(prefix="/v1")

router.include_router(projects.router)
router.include_router(blogs.router)
