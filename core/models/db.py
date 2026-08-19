"""
SQLAlchemy ORM model definitions.
"""

import datetime as dt
import uuid
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import UUID, String, Text, DateTime, Date, Integer, Enum, func
from sqlalchemy.dialects.postgresql import JSONB

from core.models.dto import ProjectType, ProjectStatus, BlogStatus


class ORMBase(DeclarativeBase):
    """Base class for all ORM models."""


class Project(ORMBase):
    """Represents a property project (condominium or villa) in the database.

    Condominium and villa projects share a single table and a single
    feature vocabulary — ``project_type`` only determines which parts of
    that vocabulary are meaningful, it never changes what a field is
    called (e.g. a "private pool" is always ``features.facilities.pool.private``,
    never a separate ``private_swimming_pool`` column).

    ``location`` and ``features`` are stored as JSONB but must never be
    assigned raw dicts. Always go through the Pydantic models in
    :mod:`core.models.dto`::

        project.location = project_location.model_dump(mode="json")
        project.features = project_features.model_dump(mode="json")

        project_location = ProjectLocation.model_validate(project.location)
        project_features = ProjectFeatures.model_validate(project.features)
    """

    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    project_type: Mapped[ProjectType] = mapped_column(
        Enum(ProjectType, native_enum=False, length=32, validate_strings=True),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, native_enum=False, length=32, validate_strings=True),
        nullable=False,
        default=ProjectStatus.PLANNED,
    )

    # Structured location (see ProjectLocation) — never a free-text string.
    location: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    distance_to_beach_m: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_units: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_buildings: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completion_date: Mapped[dt.date | None] = mapped_column(Date, nullable=True)

    # Facilities / spaces / features / nearby-places, consolidated into a
    # single JSONB column (see ProjectFeatures in core.models.dto) rather
    # than four separate columns, since none of them currently need to be
    # queried independently.
    features: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Blog(ORMBase):
    """Represents a blog post in the database.

    ``author_id`` and ``category_id`` are plain UUID columns rather than
    foreign keys for now, since this project has no ``authors`` or
    ``categories`` table yet. Wire up ``ForeignKey(...)`` constraints once
    those tables exist.
    """

    __tablename__ = "blogs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    featured_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[BlogStatus] = mapped_column(
        Enum(BlogStatus, native_enum=False, length=20, validate_strings=True),
        nullable=False,
        default=BlogStatus.DRAFT,
        index=True,
    )

    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    published_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    seo_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
