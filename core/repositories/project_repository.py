from sqlalchemy.orm import Session

from core.repositories.base import BaseSQLAlchemyRepository
from core.models.db import Project


class ProjectRepository(BaseSQLAlchemyRepository[Project]):

    def __init__(self, session: Session):
        super().__init__(session, Project)