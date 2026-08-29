from sqlalchemy.orm import Session

from core.repositories.base import BaseSQLAlchemyRepository
from core.models.db import Blog


class BlogRepository(BaseSQLAlchemyRepository[Blog]):

    def __init__(self, session: Session):
        super().__init__(session, Blog)