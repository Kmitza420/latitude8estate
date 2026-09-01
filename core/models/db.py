"""
SQLAlchemy ORM model definitions.

Five tables: ``authors`` and ``agents`` (the people a record is attributed
to), ``categories`` (the editorial taxonomy behind the lifestyle section),
``projects`` and ``blogs``.

Every JSONB column on these models holds a shape defined in
:mod:`core.models.dto` and must never be assigned a raw dict::

    project.location = project_location.model_dump(mode="json")
    project.media = [m.model_dump(mode="json") for m in media_refs]

    project_location = ProjectLocation.model_validate(project.location)

Media is stored as ``MediaRef`` (an object key), never as an absolute URL —
:func:`core.clients.storage.public_url` resolves it on read, so one row
serves the correct host in every environment.
"""

import datetime as dt
import uuid
from decimal import Decimal

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import (
    UUID,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB

from core.models.dto import AreaUnit, BlogStatus, ProjectStatus, ProjectType


class ORMBase(DeclarativeBase):
    """Base class for all ORM models."""


class Author(ORMBase):
    """A person a blog post is attributed to.

    Replaces the bare ``author_id`` UUID that ``blogs`` used to carry with
    nothing behind it, which left the public site printing a hardcoded
    byline on every article.
    """

    __tablename__ = "authors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    # A MediaRef (see core.models.dto), or NULL.
    portrait: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Agent(ORMBase):
    """The person representing a project — the "Listed By" block on a listing.

    Kept separate from :class:`Author` deliberately: an agent needs a
    reachable email and phone, an author needs a bio, and conflating them
    would make both nullable everywhere.
    """

    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # A MediaRef (see core.models.dto), or NULL.
    portrait: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Category(ORMBase):
    """An editorial category for blog posts.

    ``slug`` is what the site routes on (``/lifestyle/category/{slug}``), so
    it is unique and indexed. ``featured`` is an editorial flag that decides
    which categories appear as tiles on the lifestyle index — it is set by a
    human, not derived from post counts.
    """

    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    blurb: Mapped[str | None] = mapped_column(Text, nullable=True)

    # A MediaRef (see core.models.dto), or NULL.
    image: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Project(ORMBase):
    """Represents a property project (condominium or villa) in the database.

    Condominium and villa projects share a single table and a single
    feature vocabulary — ``project_type`` only determines which parts of
    that vocabulary are meaningful, it never changes what a field is
    called (e.g. a "private pool" is always ``features.facilities.pool.private``,
    never a separate ``private_swimming_pool`` column).

    ``location``, ``features``, ``media`` and ``documents`` are stored as
    JSONB but must never be assigned raw dicts. Always go through the
    Pydantic models in :mod:`core.models.dto`::

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

    # The public site routes on this, so it is unique and indexed rather than
    # derived from `name` at render time — a rename must not silently break
    # every inbound link to the listing.
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)

    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, native_enum=False, length=32, validate_strings=True),
        nullable=False,
        default=ProjectStatus.PLANNED,
        index=True,
    )

    # Editorial flag driving the "Featured Estates" rail on the home page.
    featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

    # Marketing lead. NULL is meaningful: the site falls back to a sentence
    # composed from type, location and status rather than printing nothing.
    tagline: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Structured location (see ProjectLocation) — never a free-text string.
    location: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # "From" price for the development. Numeric, not a display string, so the
    # client formats it for its own locale and currency.
    price_from: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    price_currency: Mapped[str | None] = mapped_column(String(3), nullable=True)

    # Value and unit are stored separately so "12,400" is never ambiguous.
    floor_area: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    floor_area_unit: Mapped[AreaUnit | None] = mapped_column(
        Enum(AreaUnit, native_enum=False, length=8, validate_strings=True),
        nullable=True,
    )

    distance_to_beach_m: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_units: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_buildings: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completion_date: Mapped[dt.date | None] = mapped_column(Date, nullable=True)

    agent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Facilities / spaces / features / nearby-places, consolidated into a
    # single JSONB column (see ProjectFeatures in core.models.dto) rather
    # than four separate columns, since none of them currently need to be
    # queried independently.
    features: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Ordered list of MediaRef. The first entry is the hero; the rest are the
    # gallery. Ordering is the editor's, so it is the list order, not a
    # separate "is_hero" flag that can be set on two rows at once.
    media: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    # Ordered list of DocumentRef (floor plans, brochures).
    documents: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Eager by default: every read of a project renders its agent, so a lazy
    # load would be an N+1 on the list route and a DetachedInstanceError once
    # the request's session closes.
    agent: Mapped["Agent | None"] = relationship(lazy="selectin")


class Blog(ORMBase):
    """Represents a blog post in the database."""

    __tablename__ = "blogs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Sanitised HTML — see core.services.sanitize. The site renders this
    # unescaped, so nothing unsanitised may ever be written here.
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # A MediaRef (see core.models.dto), or NULL. Stored as an object rather
    # than a bare URL so the image always carries its alt text.
    featured_image: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    status: Mapped[BlogStatus] = mapped_column(
        Enum(BlogStatus, native_enum=False, length=20, validate_strings=True),
        nullable=False,
        default=BlogStatus.DRAFT,
        index=True,
    )

    # Editorial flag for the lead article on the lifestyle index and home page.
    featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("authors.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )

    published_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)

    seo_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Eager, for the same reason as Project.agent — every card renders the
    # byline and the category label.
    author: Mapped["Author"] = relationship(lazy="selectin")
    category: Mapped["Category | None"] = relationship(lazy="selectin")
