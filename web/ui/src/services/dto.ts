/**
 * The wire format of `web/api`, mirrored field for field from
 * `core/models/dto.py`.
 *
 * These are the shapes as they arrive — snake_case, nullable where the
 * Pydantic model is `| None`. Nothing outside `mappers.ts` should import from
 * here; the rest of the site works in the camelCase view models declared in
 * `src/data/`. That indirection is the whole point: a rename on the Python
 * side is a one-file change here plus a one-file change in the mapper.
 *
 * Two conventions worth knowing:
 *
 * - **Money and area arrive as strings.** They are `Decimal` on the Python
 *   side and Pydantic serialises a `Decimal` to a JSON string, deliberately —
 *   a float would quietly lose precision on a nine-figure price. Parse at the
 *   point of formatting, never store them as numbers.
 * - **Images are always `{url, alt}`, never a bare URL.** The API resolves
 *   MinIO object keys to absolute URLs on read, and `alt` is required and
 *   non-empty at write time, so there is no such thing as an image here
 *   without an accessible name.
 */

// --- Enums (Python StrEnum, so they arrive as plain strings) ---------------

export type ProjectTypeDto = "condominium" | "villa";
export type ProjectStatusDto = "planned" | "under_construction" | "completed";
export type AreaUnitDto = "sqm" | "sqft";
export type BlogStatusDto = "draft" | "published" | "archived";

// --- Media and documents ---------------------------------------------------

export interface MediaDto {
  /** Absolute and browser-reachable; the object key is resolved server-side. */
  url: string;
  alt: string;
}

export interface DocumentDto {
  title: string;
  url: string;
  size_bytes: number | null;
  content_type: string | null;
}

// --- People ----------------------------------------------------------------

export interface AuthorDto {
  id: string;
  name: string;
  email: string | null;
  bio: string | null;
  portrait: MediaDto | null;
}

export interface AgentDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  portrait: MediaDto | null;
}

// --- Categories ------------------------------------------------------------

export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
  blurb: string | null;
  image: MediaDto | null;
  /** Editorial flag: appears in the tile row on the lifestyle index. */
  featured: boolean;
}

// --- Location --------------------------------------------------------------

export interface ProjectLocationDto {
  address: string | null;
  district: string | null;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

// --- Facilities: things provided by the development ------------------------

export interface PoolFeaturesDto {
  available: boolean;
  private: boolean;
  children: boolean;
  deck: boolean;
  shower: boolean;
}

export interface WellnessFeaturesDto {
  sauna: boolean;
  spa: boolean;
}

export interface SecurityFeaturesDto {
  security_24_7: boolean;
  cctv: boolean;
}

export interface AccessFeaturesDto {
  key_card: boolean;
  lobby_reception: boolean;
}

export interface ParkingFeaturesDto {
  available: boolean;
  garage: boolean;
}

/** One lounge concept, qualified — not three separate lounge fields. */
export interface LoungeFeaturesDto {
  available: boolean;
  indoor: boolean;
  outdoor: boolean;
  rooftop: boolean;
}

export interface FacilitiesDto {
  pool: PoolFeaturesDto;
  fitness_center: boolean;
  wellness: WellnessFeaturesDto;
  kids_club: boolean;
  cinema: boolean;
  library: boolean;
  gaming_room: boolean;
  lounge: LoungeFeaturesDto;
  security: SecurityFeaturesDto;
  access: AccessFeaturesDto;
  parking: ParkingFeaturesDto;
}

// --- Spaces ----------------------------------------------------------------

export interface InteriorSpacesDto {
  living_room: boolean;
  dining_area: boolean;
  kitchen: boolean;
  master_bedroom: boolean;
  guest_bedrooms: number | null;
  bathrooms: number | null;
  walk_in_wardrobe: boolean;
  laundry: boolean;
  storage: boolean;
  staff_room: boolean;
  guest_house: boolean;
}

export interface GardenFeaturesDto {
  available: boolean;
  private: boolean;
  tropical: boolean;
}

export interface TerraceFeaturesDto {
  available: boolean;
  covered: boolean;
  rooftop: boolean;
  sea_view: boolean;
}

export interface OutdoorSpacesDto {
  garden: GardenFeaturesDto;
  pool_area: boolean;
  terrace: TerraceFeaturesDto;
  lounge: LoungeFeaturesDto;
  outdoor_dining: boolean;
  outdoor_kitchen: boolean;
  sala: boolean;
  walking_paths: boolean;
  children_area: boolean;
}

export interface SpacesDto {
  interior: InteriorSpacesDto;
  outdoor: OutdoorSpacesDto;
}

// --- Features --------------------------------------------------------------

export interface FeaturesDto {
  air_conditioning: boolean;
  smart_home: boolean;
  bbq: boolean;
  jacuzzi: boolean;
  wine_cellar: boolean;
  automatic_gate: boolean;
  kitchen_appliances: string[];
}

// --- Nearby ----------------------------------------------------------------

export interface NearbyPlaceDto {
  name: string;
  distance_m: number | null;
}

export interface NearbyPlacesDto {
  airports: NearbyPlaceDto[];
  international_schools: NearbyPlaceDto[];
  shopping_centers: NearbyPlaceDto[];
  golf_courses: NearbyPlaceDto[];
  marinas: NearbyPlaceDto[];
  tourist_attractions: NearbyPlaceDto[];
}

/** The contents of the single `features` JSONB column. */
export interface ProjectFeaturesDto {
  facilities: FacilitiesDto;
  spaces: SpacesDto;
  features: FeaturesDto;
  nearby: NearbyPlacesDto;
}

// --- Top-level responses ---------------------------------------------------

/**
 * A project, as returned by both the list and the detail routes.
 *
 * There is no separate summary shape: a project carries no unbounded field,
 * so the API returns the same model everywhere and there is only one thing
 * to keep in step.
 */
export interface ProjectResponseDto {
  id: string;
  project_type: ProjectTypeDto;
  name: string;
  /** Unique and indexed upstream; the site routes on it. */
  slug: string;
  status: ProjectStatusDto;
  /** Editorial flag behind the "Featured Estates" rail. */
  featured: boolean;
  /** Marketing lead. Null is meaningful — see `taglineFor` in `mappers.ts`. */
  tagline: string | null;
  location: ProjectLocationDto;
  /** Decimal-as-string, e.g. "48500000.00". Null when no price is published. */
  price_from: string | null;
  /** ISO 4217, e.g. "THB". */
  price_currency: string | null;
  /** Decimal-as-string, e.g. "642.00". */
  floor_area: string | null;
  floor_area_unit: AreaUnitDto | null;
  distance_to_beach_m: number | null;
  total_units: number | null;
  total_buildings: number | null;
  /** ISO date, e.g. "2026-11-30". */
  completion_date: string | null;
  agent: AgentDto | null;
  features: ProjectFeaturesDto;
  /** Ordered: the first entry is the hero, the rest are the gallery. */
  media: MediaDto[];
  documents: DocumentDto[];
  /** ISO 8601 timestamp. */
  created_at: string;
  /** ISO 8601 timestamp. */
  updated_at: string;
}

/** A blog post *without* its body, as returned by every list route. */
export interface BlogSummaryDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: MediaDto | null;
  status: BlogStatusDto;
  featured: boolean;
  author: AuthorDto | null;
  category: CategoryDto | null;
  /** ISO 8601 timestamp. */
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * A blog post with its body, as returned by the detail routes.
 *
 * `content` is sanitised server-side against an allowlist, on write and again
 * on read (`core/services/sanitize.py`). The article template injects it with
 * `set:html`, so that guarantee is what makes the template safe.
 */
export interface BlogResponseDto extends BlogSummaryDto {
  content: string;
}

// --- Pagination envelope ---------------------------------------------------

export interface PaginationMetadataDto {
  total_items: number;
  total_pages: number;
  /** 1-based. */
  current_page: number;
  skip: number;
  limit: number;
}

export interface PaginatedDto<T> {
  metadata: PaginationMetadataDto;
  items: T[];
}

// --- Submissions (planned, see `web/api/TODO.md`) --------------------------

export interface EnquiryCreateDto {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  /** Set when the enquiry came from a property page. */
  project_slug?: string;
}

export interface NewsletterSubscriptionCreateDto {
  email: string;
}

export interface SubmissionResponseDto {
  id: string;
  status: string;
}
