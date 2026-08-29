import uuid

from core.repositories.project_repository import ProjectRepository
from core.models.dto import ProjectCreate, ProjectUpdate


class ProjectService:
    def __init__(self, project_repository: ProjectRepository):
        self.project_repository = project_repository

    def create_project(self, project_data: ProjectCreate):
        return self.project_repository.create(project_data.model_dump(exclude_unset=True))

    def get_project(self, project_id: uuid.UUID):
        return self.project_repository.get_by_pk(project_id)

    def update_project(self, project_id: uuid.UUID, project_data: ProjectUpdate):
        return self.project_repository.update(project_id, project_data.model_dump(exclude_unset=True))

    def delete_project(self, project_id: uuid.UUID):
        return self.project_repository.delete(project_id)
    
    def list_projects(self, skip: int = 0, limit: int = 10):
        return self.project_repository.list(skip=skip, limit=limit)
    
    def count_projects(self):
        return self.project_repository.count()