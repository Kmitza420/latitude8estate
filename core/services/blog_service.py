import uuid

from core.repositories.blog_repository import BlogRepository
from core.models.dto import BlogCreate, BlogUpdate


class BlogService:
    def __init__(self, blog_repository: BlogRepository):
        self.blog_repository = blog_repository

    def create_blog(self, blog_data: BlogCreate):
        return self.blog_repository.create(blog_data.model_dump(exclude_unset=True))

    def get_blog(self, blog_id: uuid.UUID):
        return self.blog_repository.get_by_pk(blog_id)

    def update_blog(self, blog_id: uuid.UUID, blog_data: BlogUpdate):
        return self.blog_repository.update(blog_id, blog_data.model_dump(exclude_unset=True))

    def delete_blog(self, blog_id: uuid.UUID):
        return self.blog_repository.delete(blog_id)
    
    def list_blogs(self, skip: int = 0, limit: int = 10):
        return self.blog_repository.list(skip=skip, limit=limit)
    
    def count_blogs(self):
        return self.blog_repository.count()