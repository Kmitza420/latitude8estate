"""
Application DTO model definitions.

Domain/validation layer for :class:`core.models.db.Project`. Nothing here
is persisted directly — the JSONB columns on the ORM model are only ever
written via ``ProjectFeatures.model_dump(mode="json")`` and read back via
``ProjectFeatures.model_validate(...)``, so a raw dict never reaches the
database and a raw dict never leaks back out to callers.

The vocabulary here is shared by both ``ProjectType.CONDOMINIUM`` and
``ProjectType.VILLA`` projects. Project type determines which fields are
meaningful, not what the fields are called — see
``core/models/project_entity_guide.md`` for the full rationale. A "private
swimming pool" is ``facilities.pool.private``, not a separate
``private_swimming_pool`` field; a "rooftop lounge" is ``lounge.rooftop``,
not a separate ``rooftop_lounge`` field; and so on for every qualifier
below.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class ProjectType(StrEnum):
    """Type of property project."""

    CONDOMINIUM = "condominium"
    VILLA = "villa"


class ProjectStatus(StrEnum):
    """Lifecycle status of a project."""

    PLANNED = "planned"
    UNDER_CONSTRUCTION = "under_construction"
    COMPLETED = "completed"


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


class ProjectCreate(BaseModel):
    """Application-level payload for creating a :class:`~core.models.db.Project`."""

    project_type: ProjectType
    name: str
    status: ProjectStatus = ProjectStatus.PLANNED

    location: ProjectLocation

    distance_to_beach_m: int | None = Field(default=None, ge=0)
    total_units: int | None = Field(default=None, ge=0)
    total_buildings: int | None = Field(default=None, ge=0)
    completion_date: date | None = None

    features: ProjectFeatures = Field(default_factory=ProjectFeatures)


class ProjectUpdate(ProjectCreate):
    """Application-level payload for updating a :class:`~core.models.db.Project`.

    All fields are optional, since the user may only want to update a subset
    of them.
    """

    project_type: ProjectType | None = None
    name: str | None = None
    status: ProjectStatus | None = None

    location: ProjectLocation | None = None

    distance_to_beach_m: int | None = Field(default=None, ge=0)
    total_units: int | None = Field(default=None, ge=0)
    total_buildings: int | None = Field(default=None, ge=0)
    completion_date: date | None = None

    features: ProjectFeatures | None = None


class ProjectResponse(ProjectCreate):
    """Response model for a :class:`~core.models.db.Project`."""

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class BlogStatus(StrEnum):
    """Lifecycle status of a blog post."""

    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class BlogCreate(BaseModel):
    """Application-level payload for creating a :class:`~core.models.db.Blog`."""

    title: str
    slug: str
    excerpt: str | None = None
    content: str
    featured_image_url: str | None = None

    status: BlogStatus = BlogStatus.DRAFT

    author_id: uuid.UUID
    category_id: uuid.UUID | None = None

    published_at: datetime | None = None

    seo_title: str | None = None
    seo_description: str | None = None


class BlogUpdate(BlogCreate):
    """Application-level payload for updating a :class:`~core.models.db.Blog`.

    All fields are optional, since the user may only want to update a subset
    of them.
    """

    title: str | None = None
    slug: str | None = None
    excerpt: str | None = None
    content: str | None = None
    featured_image_url: str | None = None

    status: BlogStatus | None = None

    author_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None

    published_at: datetime | None = None

    seo_title: str | None = None
    seo_description: str | None = None


class BlogResponse(BlogCreate):
    """Response model for a :class:`~core.models.db.Blog`."""

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


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


class PagninatedResponse[T: BaseModel](BaseModel):
    """Generic paginated response envelope.

    Type parameter ``T`` is the item model (e.g. ``SellerResponse``).

    Example JSON::

        {
          "metadata": { ... },
          "items": [ ... ]
        }
    """

    metadata: PaginationMetadata = Field(..., description="Pagination metadata.")
    items: list[T] = Field(..., description="Page of result items.")
