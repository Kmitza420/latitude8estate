"""
Application DTO model definitions.

Domain/validation layer for the ORM models in :mod:`core.models.db`. Nothing
here is persisted directly — the JSONB columns on the ORM models are only ever
written via ``model_dump(mode="json")`` and read back via ``model_validate``,
so a raw dict never reaches the database and a raw dict never leaks back out
to callers.

Three pairs of models recur, and the distinction matters:

``*Ref`` / ``*Response``
    ``MediaRef`` and ``DocumentRef`` are what the database *stores* — an
    object key. ``MediaResponse`` and ``DocumentResponse`` are what the API
    *serves* — an absolute URL, resolved on read through
    :func:`core.clients.storage.public_url`. Storing keys rather than URLs is
    what lets one row serve the correct host in local development, in
    docker-compose and in production.

``*Create`` / ``*Update``
    Write payloads. ``Update`` makes every field optional, since a caller may
    only want to change a subset.

``*Response``
    Read models, all of them ``from_attributes=True`` so an ORM row can be
    passed straight to ``model_validate``.

The project feature vocabulary below is shared by both ``ProjectType.CONDOMINIUM``
and ``ProjectType.VILLA`` projects. Project type determines which fields are
meaningful, not what the fields are called. A "private swimming pool" is
``facilities.pool.private``, not a separate ``private_swimming_pool`` field; a
"rooftop lounge" is ``lounge.rooftop``, not a separate ``rooftop_lounge``
field; and so on for every qualifier below.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator

from core.clients.storage import public_url


# --- Media and documents ---------------------------------------------------


class MediaRef(BaseModel):
    """One image as stored: an object key plus its alt text.

    ``alt`` is required and non-empty by construction. Every image the site
    renders needs an accessible name, and an empty one is a regression no
    reviewer catches by eye — so it is enforced here rather than hoped for.
    """

    key: str = Field(min_length=1, description="Object key in the public bucket, or an absolute URL.")
    alt: str = Field(min_length=1, description="Human-readable description of the image.")


class MediaResponse(BaseModel):
    """One image as served: an absolute URL plus its alt text.

    Accepts either shape on input — a stored ``{"key": ..., "alt": ...}`` is
    resolved to a URL automatically, so ``model_validate`` works directly on
    an ORM row whose JSONB column holds refs.
    """

    model_config = ConfigDict(from_attributes=True)

    url: str
    alt: str

    @model_validator(mode="before")
    @classmethod
    def _resolve_key(cls, value):
        if isinstance(value, MediaRef):
            value = value.model_dump()
        if isinstance(value, dict) and "url" not in value and "key" in value:
            return {"url": public_url(value["key"]), "alt": value.get("alt", "")}
        return value


class DocumentRef(BaseModel):
    """One downloadable document as stored (floor plan, brochure)."""

    title: str = Field(min_length=1)
    key: str = Field(min_length=1)
    size_bytes: int | None = Field(default=None, ge=0)
    content_type: str | None = None


class DocumentResponse(BaseModel):
    """One downloadable document as served."""

    model_config = ConfigDict(from_attributes=True)

    title: str
    url: str
    size_bytes: int | None = None
    content_type: str | None = None

    @model_validator(mode="before")
    @classmethod
    def _resolve_key(cls, value):
        if isinstance(value, DocumentRef):
            value = value.model_dump()
        if isinstance(value, dict) and "url" not in value and "key" in value:
            resolved = dict(value)
            resolved["url"] = public_url(resolved.pop("key"))
            return resolved
        return value


# --- Enums -----------------------------------------------------------------


class ProjectType(StrEnum):
    """Type of property project."""

    CONDOMINIUM = "condominium"
    VILLA = "villa"


class ProjectStatus(StrEnum):
    """Lifecycle status of a project."""

    PLANNED = "planned"
    UNDER_CONSTRUCTION = "under_construction"
    COMPLETED = "completed"


class AreaUnit(StrEnum):
    """Unit that ``floor_area`` is expressed in."""

    SQM = "sqm"
    SQFT = "sqft"


class BlogStatus(StrEnum):
    """Lifecycle status of a blog post."""

    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


# --- People ----------------------------------------------------------------


class AuthorCreate(BaseModel):
    """Payload for creating an :class:`~core.models.db.Author` (a blog byline)."""

    name: str = Field(min_length=1, max_length=255)
    email: str | None = None
    bio: str | None = None
    portrait: MediaRef | None = None


class AuthorUpdate(AuthorCreate):
    """Partial update payload for an author."""

    name: str | None = Field(default=None, min_length=1, max_length=255)


class AuthorResponse(BaseModel):
    """Response model for an :class:`~core.models.db.Author`."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str | None = None
    bio: str | None = None
    portrait: MediaResponse | None = None


class AgentCreate(BaseModel):
    """Payload for creating an :class:`~core.models.db.Agent` (a listing agent)."""

    name: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=1, max_length=255)
    phone: str | None = None
    portrait: MediaRef | None = None


class AgentUpdate(AgentCreate):
    """Partial update payload for an agent."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: str | None = Field(default=None, min_length=1, max_length=255)


class AgentResponse(BaseModel):
    """Response model for an :class:`~core.models.db.Agent`."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str
    phone: str | None = None
    portrait: MediaResponse | None = None


# --- Categories ------------------------------------------------------------


class CategoryCreate(BaseModel):
    """Payload for creating a :class:`~core.models.db.Category`."""

    slug: str = Field(min_length=1, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    name: str = Field(min_length=1, max_length=255)
    blurb: str | None = None
    image: MediaRef | None = None
    featured: bool = False


class CategoryUpdate(CategoryCreate):
    """Partial update payload for a category."""

    slug: str | None = Field(default=None, min_length=1, max_length=255)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    featured: bool | None = None


class CategoryResponse(BaseModel):
    """Response model for a :class:`~core.models.db.Category`.

    ``featured`` drives the tile row on the lifestyle index; it is an
    editorial flag, not a derived one.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name: str
    blurb: str | None = None
    image: MediaResponse | None = None
    featured: bool = False


# --- Project location ------------------------------------------------------


class ProjectLocation(BaseModel):
    """Structured location for a project (never a free-text string)."""

    address: str | None = None
    district: str | None = None
    city: str | None = None
    country: str
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


# --- Facilities: things provided by the project/development ---------------


class PoolFeatures(BaseModel):
    available: bool = False
    private: bool = False
    children: bool = False
    deck: bool = False
    shower: bool = False


class WellnessFeatures(BaseModel):
    sauna: bool = False
    spa: bool = False


class SecurityFeatures(BaseModel):
    security_24_7: bool = False
    cctv: bool = False


class AccessFeatures(BaseModel):
    key_card: bool = False
    lobby_reception: bool = False


class ParkingFeatures(BaseModel):
    available: bool = False
    garage: bool = False


class LoungeFeatures(BaseModel):
    """Canonical lounge concept, shared by facilities and outdoor spaces.

    Replaces the would-be duplicate fields ``lounge``, ``outdoor_lounge``
    and ``rooftop_lounge`` with qualifiers on a single object.
    """

    available: bool = False
    indoor: bool = False
    outdoor: bool = False
    rooftop: bool = False


class Facilities(BaseModel):
    """Things provided by the project/development."""

    pool: PoolFeatures = Field(default_factory=PoolFeatures)
    fitness_center: bool = False
    wellness: WellnessFeatures = Field(default_factory=WellnessFeatures)

    kids_club: bool = False

    cinema: bool = False
    library: bool = False
    gaming_room: bool = False

    lounge: LoungeFeatures = Field(default_factory=LoungeFeatures)

    security: SecurityFeatures = Field(default_factory=SecurityFeatures)
    access: AccessFeatures = Field(default_factory=AccessFeatures)
    parking: ParkingFeatures = Field(default_factory=ParkingFeatures)


# --- Spaces: physical spaces rather than services --------------------------


class InteriorSpaces(BaseModel):
    living_room: bool = False
    dining_area: bool = False
    kitchen: bool = False
    master_bedroom: bool = False
    guest_bedrooms: int | None = Field(default=None, ge=0)
    bathrooms: int | None = Field(default=None, ge=0)
    walk_in_wardrobe: bool = False
    laundry: bool = False
    storage: bool = False
    staff_room: bool = False
    guest_house: bool = False


class GardenFeatures(BaseModel):
    available: bool = False
    private: bool = False
    tropical: bool = False


class TerraceFeatures(BaseModel):
    available: bool = False
    covered: bool = False
    rooftop: bool = False
    sea_view: bool = False


class OutdoorSpaces(BaseModel):
    garden: GardenFeatures = Field(default_factory=GardenFeatures)
    pool_area: bool = False
    terrace: TerraceFeatures = Field(default_factory=TerraceFeatures)
    lounge: LoungeFeatures = Field(default_factory=LoungeFeatures)

    outdoor_dining: bool = False
    outdoor_kitchen: bool = False

    sala: bool = False
    walking_paths: bool = False
    children_area: bool = False


class Spaces(BaseModel):
    interior: InteriorSpaces = Field(default_factory=InteriorSpaces)
    outdoor: OutdoorSpaces = Field(default_factory=OutdoorSpaces)


# --- Features: characteristics that aren't a physical "space" --------------


class Features(BaseModel):
    air_conditioning: bool = False
    smart_home: bool = False
    bbq: bool = False
    jacuzzi: bool = False
    wine_cellar: bool = False
    automatic_gate: bool = False

    kitchen_appliances: list[str] = Field(default_factory=list)


# --- Nearby places -----------------------------------------------------


class NearbyPlace(BaseModel):
    name: str
    distance_m: int | None = Field(default=None, ge=0)


class NearbyPlaces(BaseModel):
    airports: list[NearbyPlace] = Field(default_factory=list)
    international_schools: list[NearbyPlace] = Field(default_factory=list)
    shopping_centers: list[NearbyPlace] = Field(default_factory=list)
    golf_courses: list[NearbyPlace] = Field(default_factory=list)
    marinas: list[NearbyPlace] = Field(default_factory=list)
    tourist_attractions: list[NearbyPlace] = Field(default_factory=list)


# --- Aggregate ---------------------------------------------------------


class ProjectFeatures(BaseModel):
    """The full contents of ``Project.features`` (a single JSONB column)."""

    facilities: Facilities = Field(default_factory=Facilities)
    spaces: Spaces = Field(default_factory=Spaces)
    features: Features = Field(default_factory=Features)
    nearby: NearbyPlaces = Field(default_factory=NearbyPlaces)


# --- Projects --------------------------------------------------------------


class ProjectCreate(BaseModel):
    """Application-level payload for creating a :class:`~core.models.db.Project`."""

    project_type: ProjectType
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    status: ProjectStatus = ProjectStatus.PLANNED
    featured: bool = False

    tagline: str | None = Field(default=None, max_length=500)

    location: ProjectLocation

    price_from: Decimal | None = Field(default=None, ge=0, max_digits=14, decimal_places=2)
    price_currency: str | None = Field(default=None, min_length=3, max_length=3)

    floor_area: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    floor_area_unit: AreaUnit | None = None

    distance_to_beach_m: int | None = Field(default=None, ge=0)
    total_units: int | None = Field(default=None, ge=0)
    total_buildings: int | None = Field(default=None, ge=0)
    completion_date: date | None = None

    agent_id: uuid.UUID | None = None

    features: ProjectFeatures = Field(default_factory=ProjectFeatures)
    media: list[MediaRef] = Field(default_factory=list)
    documents: list[DocumentRef] = Field(default_factory=list)


class ProjectUpdate(ProjectCreate):
    """Application-level payload for updating a :class:`~core.models.db.Project`.

    All fields are optional, since the user may only want to update a subset
    of them.
    """

    project_type: ProjectType | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    status: ProjectStatus | None = None
    featured: bool | None = None

    location: ProjectLocation | None = None

    features: ProjectFeatures | None = None
    media: list[MediaRef] | None = None
    documents: list[DocumentRef] | None = None


class ProjectResponse(BaseModel):
    """Response model for a :class:`~core.models.db.Project`.

    Used for the list route as well as the detail route. Unlike a blog post,
    a project carries no unbounded field — ``features`` is a small, fixed
    vocabulary — so there is no separate summary model, and therefore no
    second shape for a client to keep in step.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID

    project_type: ProjectType
    name: str
    slug: str
    status: ProjectStatus
    featured: bool

    tagline: str | None = None

    location: ProjectLocation

    price_from: Decimal | None = None
    price_currency: str | None = None

    floor_area: Decimal | None = None
    floor_area_unit: AreaUnit | None = None

    distance_to_beach_m: int | None = None
    total_units: int | None = None
    total_buildings: int | None = None
    completion_date: date | None = None

    agent: AgentResponse | None = None

    features: ProjectFeatures
    media: list[MediaResponse] = Field(default_factory=list)
    documents: list[DocumentResponse] = Field(default_factory=list)

    created_at: datetime
    updated_at: datetime


# --- Blogs -----------------------------------------------------------------


class BlogCreate(BaseModel):
    """Application-level payload for creating a :class:`~core.models.db.Blog`."""

    title: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    excerpt: str | None = None
    content: str
    featured_image: MediaRef | None = None

    status: BlogStatus = BlogStatus.DRAFT
    featured: bool = False

    author_id: uuid.UUID
    category_id: uuid.UUID | None = None

    published_at: datetime | None = None

    seo_title: str | None = Field(default=None, max_length=255)
    seo_description: str | None = None


class BlogUpdate(BlogCreate):
    """Application-level payload for updating a :class:`~core.models.db.Blog`.

    All fields are optional, since the user may only want to update a subset
    of them.
    """

    title: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = None

    status: BlogStatus | None = None
    featured: bool | None = None

    author_id: uuid.UUID | None = None


class BlogSummary(BaseModel):
    """A blog post *without* its body.

    The list routes return this. ``content`` is the one genuinely unbounded
    field in the schema, and shipping every article's full HTML on every
    listing does not survive a real catalogue.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID

    title: str
    slug: str
    excerpt: str | None = None
    featured_image: MediaResponse | None = None

    status: BlogStatus
    featured: bool

    author: AuthorResponse | None = None
    category: CategoryResponse | None = None

    published_at: datetime | None = None

    seo_title: str | None = None
    seo_description: str | None = None

    created_at: datetime
    updated_at: datetime


class BlogResponse(BlogSummary):
    """A blog post with its body, returned by the detail routes.

    ``content`` is sanitised HTML — see
    :func:`core.services.sanitize.sanitize_html`. It is rendered into the page
    unescaped, so nothing unsanitised may ever reach this field.
    """

    content: str


# --- Pagination ------------------------------------------------------------


class PaginationMetadata(BaseModel):
    """Describes the pagination state of a list / search response.

    Attributes:
        total_items:  Total number of matching records in the database.
        total_pages:  Total number of pages given the current ``limit``.
        current_page: 1-based page number derived from ``skip`` and ``limit``.
        skip:         The offset that was applied.
        limit:        The maximum number of items per page.
    """

    total_items: int = Field(..., description="Total number of matching records.")
    total_pages: int = Field(..., description="Total number of pages.")
    current_page: int = Field(..., description="Current page number (1-based).")
    skip: int = Field(..., description="Number of records skipped.")
    limit: int = Field(..., description="Maximum records per page.")

    @classmethod
    def build(cls, total_items: int, skip: int, limit: int) -> "PaginationMetadata":
        """Derive the metadata for one page.

        ``limit`` is clamped to at least 1 so this can never divide by zero,
        independently of whatever validation the route layer applies.
        """
        limit = max(limit, 1)
        return cls(
            total_items=total_items,
            total_pages=max((total_items + limit - 1) // limit, 1),
            current_page=(skip // limit) + 1,
            skip=skip,
            limit=limit,
        )


class PaginatedResponse[T: BaseModel](BaseModel):
    """Generic paginated response envelope.

    Type parameter ``T`` is the item model (e.g. ``BlogSummary``).

    Example JSON::

        {
          "metadata": { ... },
          "items": [ ... ]
        }
    """

    metadata: PaginationMetadata = Field(..., description="Pagination metadata.")
    items: list[T] = Field(..., description="Page of result items.")
