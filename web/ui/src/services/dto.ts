/**
 * The wire format of `web/api`, mirrored field for field from
 * `core/models/dto.py`.
 *
 * These are the shapes as they arrive — snake_case, nullable where the
 * Pydantic model is `| None`. Nothing outside `mappers.ts` should import from
 * here; the rest of the site works in the camelCase view models declared in
 * `src/data/`. That indirection is the whole point: a rename on the Python
 * side is a one-file change here plus a one-file change in the mapper.
 */

// --- Enums (Python StrEnum, so they arrive as plain strings) ---------------

export type ProjectTypeDto = "condominium" | "villa";
export type ProjectStatusDto = "planned" | "under_construction" | "completed";
export type BlogStatusDto = "draft" | "published" | "archived";

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

export interface ProjectResponseDto {
  id: string;
  project_type: ProjectTypeDto;
  name: string;
  status: ProjectStatusDto;
  location: ProjectLocationDto;
  distance_to_beach_m: number | null;
  total_units: number | null;
  total_buildings: number | null;
  /** ISO date, e.g. "2026-11-30". */
  completion_date: string | null;
  features: ProjectFeaturesDto;
  /** ISO 8601 timestamp. */
  created_at: string;
  /** ISO 8601 timestamp. */
  updated_at: string;
}

export interface BlogResponseDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  /** Raw HTML. See the sanitisation note in `web/api/TODO.md`. */
  content: string;
  featured_image_url: string | null;
  status: BlogStatusDto;
  author_id: string;
  category_id: string | null;
  /** ISO 8601 timestamp. */
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
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
