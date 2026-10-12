"""Listing agent persistence."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.repositories.base import BaseSQLAlchemyRepository
from core.models.db import Agent


class AgentRepository(BaseSQLAlchemyRepository[Agent]):
    """Reads and writes :class:`~core.models.db.Agent` rows."""

    def __init__(self, session: Session):
        super().__init__(session, Agent)

    def default_select(self):
        """Agents read alphabetically."""
        return select(Agent).order_by(Agent.name, Agent.id)
