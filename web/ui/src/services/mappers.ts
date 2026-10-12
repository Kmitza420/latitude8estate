/**
 * API wire shapes -> the view models the pages and components use.
 *
 * Every value below comes from the database. There are no placeholders and no
 * stand-ins: where a record has no value for something, the view model carries
 * `null` and the component omits that piece of the layout rather than
 * inventing a plausible one.
 *
 * Three things here are *derived* rather than stored, and each is derived only
 * from fields the record actually has:
 *
 * - `beds` — `guest_bedrooms + master_bedroom`, because the design shows one
 *   figure and the schema stores the two parts separately.
 * - `tagline` — composed from type, place and status, but **only** when the
 *   record has no tagline of its own.
 * - `badge` — the project status, in words.
 */

import type { Media } from "../data/media";
import type { Agent, Document, Facility, NearbyGroup, Project, SpecRow } from "../data/projects";
import type { Category, Post } from "../data/posts";
import type {
  AgentDto,
  BlogResponseDto,
  BlogSummaryDto,
  CategoryDto,
  DocumentDto,
  FacilitiesDto,
  FeaturesDto,
  InteriorSpacesDto,
  MediaDto,
  NearbyPlaceDto,
  NearbyPlacesDto,
  OutdoorSpacesDto,
  ProjectLocationDto,
  ProjectResponseDto,
  ProjectStatusDto,
} from "./dto";

/** Rendered where a record genuinely has no value for a labelled row. */
const UNKNOWN = "—";

// --- Small formatters ------------------------------------------------------

function titleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDistance(metres: number | null): string {
  if (metres === null || !Number.isFinite(metres)) return UNKNOWN;
  if (metres < 1000) return `${metres} m`;
  return `${(metres / 1000).toFixed(metres % 1000 === 0 ? 0 : 1)} km`;
}

/**
 * Format a price for display.
 *
 * `price_from` is a decimal string, not a number — the API sends it that way
 * so a nine-figure figure cannot lose its last digits to a float. It is parsed
 * here, at the one point where it becomes text.
 */
function formatPrice(amount: string | null, currency: string | null): string | null {
  if (!amount) return null;

  const value = Number(amount);
  if (!Number.isFinite(value)) return null;

  if (currency) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      // An unrecognised ISO code should not take the page down with it.
    }
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

/** "642.00" + "sqm" -> "642 m²". */
function formatArea(area: string | null, unit: string | null): string | null {
  if (!area) return null;

  const value = Number(area);
  if (!Number.isFinite(value)) return null;

  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  return unit === "sqft" ? `${formatted} sq ft` : `${formatted} m²`;
}

/** ISO timestamp or date -> the "YYYY-MM-DD" that `formatDate` expects. */
function isoDate(value: string | null): string | null {
  const date = value?.split("T")[0];
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function present(rows: (SpecRow | null)[]): SpecRow[] {
  return rows.filter((row): row is SpecRow => row !== null);
}

// --- Shared pieces ---------------------------------------------------------

function toMedia(dto: MediaDto): Media {
  return { src: dto.url, alt: dto.alt };
}

export function toCategory(dto: CategoryDto): Category {
  return {
    slug: dto.slug,
    name: dto.name,
    blurb: dto.blurb,
    image: dto.image ? toMedia(dto.image) : null,
    featured: dto.featured,
  };
}

function toAgent(dto: AgentDto): Agent {
  return {
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    portrait: dto.portrait ? toMedia(dto.portrait) : null,
  };
}

function toDocument(dto: DocumentDto): Document {
  // Size is the only metadata worth showing beside the title, and only when
  // the record has it.
  const megabytes = dto.size_bytes ? `${(dto.size_bytes / 1_000_000).toFixed(1)} MB` : null;
  const kind = dto.content_type === "application/pdf" ? "PDF" : null;

  return {
    title: dto.title,
    meta: [kind, megabytes].filter(Boolean).join(", ") || null,
    href: dto.url,
  };
}

// --- Project pieces --------------------------------------------------------

function badgeFor(status: ProjectStatusDto): string | undefined {
  // A finished building is the norm and needs no flag; anything else is
  // information a buyer wants on the card itself.
  return status === "completed" ? undefined : titleCase(status);
}

function cityLine(location: ProjectLocationDto): string {
  return [location.city, location.country].filter(Boolean).join(", ") || location.country;
}

function addressLines(location: ProjectLocationDto): string[] {
  const locality = [location.district, location.city].filter(Boolean).join(", ");
  return [location.address, locality, location.country].filter(
    (line): line is string => Boolean(line),
  );
}

/**
 * The lead line under the hero title.
 *
 * A record with its own tagline uses it. One without gets a sentence composed
 * from three fields it does have — which is a description of the record, not
 * marketing copy written on its behalf.
 */
function taglineFor(dto: ProjectResponseDto): string {
  if (dto.tagline) return dto.tagline;

  const kind = dto.project_type === "villa" ? "villa" : "condominium development";
  const state =
    dto.status === "completed"
      ? "Completed and ready to view"
      : dto.status === "under_construction"
        ? "Currently under construction"
        : "In planning";
  return `A ${kind} in ${cityLine(dto.location)}. ${state}.`;
}

/** Guest bedrooms plus the master, when the record knows either. */
function bedCount(interior: InteriorSpacesDto): string | null {
  if (interior.guest_bedrooms === null && !interior.master_bedroom) return null;
  const total = (interior.guest_bedrooms ?? 0) + (interior.master_bedroom ? 1 : 0);
  return total > 0 ? String(total) : null;
}

function quickSpecs(dto: ProjectResponseDto): SpecRow[] {
  // The spec grid is four across, so take the four most informative that exist.
  return present([
    { label: "Type", value: titleCase(dto.project_type) },
    { label: "Status", value: titleCase(dto.status) },
    dto.total_units !== null ? { label: "Units", value: String(dto.total_units) } : null,
    dto.total_buildings !== null
      ? { label: "Buildings", value: String(dto.total_buildings) }
      : null,
    dto.completion_date !== null
      ? { label: "Completion", value: dto.completion_date.slice(0, 4) }
      : null,
    dto.distance_to_beach_m !== null
      ? { label: "To Beach", value: formatDistance(dto.distance_to_beach_m) }
      : null,
  ]).slice(0, 4);
}

function interiorRows(interior: InteriorSpacesDto): SpecRow[] {
  const beds = bedCount(interior);

  return present([
    beds !== null ? { label: "Bedrooms", value: beds } : null,
    interior.bathrooms !== null ? { label: "Bathrooms", value: String(interior.bathrooms) } : null,
    interior.living_room ? { label: "Living Room", value: "Included" } : null,
    interior.dining_area ? { label: "Dining Area", value: "Included" } : null,
    interior.kitchen ? { label: "Kitchen", value: "Included" } : null,
    interior.walk_in_wardrobe ? { label: "Wardrobe", value: "Walk-in" } : null,
    interior.laundry ? { label: "Laundry", value: "Included" } : null,
    interior.storage ? { label: "Storage", value: "Included" } : null,
    interior.staff_room ? { label: "Staff Room", value: "Included" } : null,
    interior.guest_house ? { label: "Guest House", value: "Included" } : null,
  ]);
}

function exteriorRows(outdoor: OutdoorSpacesDto): SpecRow[] {
  const gardenValue = outdoor.garden.private
    ? "Private"
    : outdoor.garden.tropical
      ? "Tropical"
      : "Included";
  const terraceValue = outdoor.terrace.rooftop
    ? "Rooftop"
    : outdoor.terrace.sea_view
      ? "Sea View"
      : outdoor.terrace.covered
        ? "Covered"
        : "Included";

  return present([
    outdoor.garden.available ? { label: "Garden", value: gardenValue } : null,
    outdoor.terrace.available ? { label: "Terrace", value: terraceValue } : null,
    outdoor.pool_area ? { label: "Pool Area", value: "Included" } : null,
    outdoor.lounge.available
      ? { label: "Lounge", value: outdoor.lounge.rooftop ? "Rooftop" : "Outdoor" }
      : null,
    outdoor.outdoor_dining ? { label: "Outdoor Dining", value: "Included" } : null,
    outdoor.outdoor_kitchen ? { label: "Outdoor Kitchen", value: "Included" } : null,
    outdoor.sala ? { label: "Sala", value: "Included" } : null,
    outdoor.walking_paths ? { label: "Walking Paths", value: "Included" } : null,
    outdoor.children_area ? { label: "Children Area", value: "Included" } : null,
  ]);
}

/**
 * Facility icons are Material Symbols ligature names — the vocabulary
 * `Icon.astro` renders. An unrecognised name draws as literal text, so each
 * one is written out here rather than derived from the field name.
 */
function facilityTiles(facilities: FacilitiesDto): Facility[] {
  const tiles: (Facility | null)[] = [
    facilities.pool.available
      ? { icon: "pool", label: facilities.pool.private ? "Private Pool" : "Swimming Pool" }
      : null,
    facilities.fitness_center ? { icon: "fitness_center", label: "Fitness Center" } : null,
    facilities.wellness.spa ? { icon: "spa", label: "Spa" } : null,
    facilities.wellness.sauna ? { icon: "hot_tub", label: "Sauna" } : null,
    facilities.kids_club ? { icon: "child_care", label: "Kids Club" } : null,
    facilities.cinema ? { icon: "movie", label: "Cinema" } : null,
    facilities.library ? { icon: "local_library", label: "Library" } : null,
    facilities.gaming_room ? { icon: "sports_esports", label: "Gaming Room" } : null,
    facilities.lounge.available
      ? { icon: "weekend", label: facilities.lounge.rooftop ? "Rooftop Lounge" : "Lounge" }
      : null,
    facilities.security.security_24_7 ? { icon: "security", label: "24/7 Security" } : null,
    facilities.security.cctv ? { icon: "videocam", label: "CCTV" } : null,
    facilities.access.key_card ? { icon: "key", label: "Key Card Access" } : null,
    facilities.access.lobby_reception ? { icon: "concierge", label: "Lobby Reception" } : null,
    facilities.parking.garage
      ? { icon: "garage", label: "Garage" }
      : facilities.parking.available
        ? { icon: "directions_car", label: "Parking" }
        : null,
  ];

  return tiles.filter((tile): tile is Facility => tile !== null);
}

function technicalList(features: FeaturesDto): string[] {
  return [
    features.air_conditioning ? "Air Conditioning" : null,
    features.smart_home ? "Smart Home Integration" : null,
    features.jacuzzi ? "Jacuzzi" : null,
    features.wine_cellar ? "Climate-controlled Wine Cellar" : null,
    features.bbq ? "Built-in BBQ" : null,
    features.automatic_gate ? "Automatic Gate" : null,
    ...features.kitchen_appliances,
  ].filter((entry): entry is string => Boolean(entry));
}

const NEARBY_TITLES: Record<keyof NearbyPlacesDto, string> = {
  airports: "Airports",
  international_schools: "International Schools",
  shopping_centers: "Shopping",
  golf_courses: "Golf",
  marinas: "Marinas",
  tourist_attractions: "Attractions",
};

function nearbyGroups(nearby: NearbyPlacesDto): NearbyGroup[] {
  return (Object.keys(NEARBY_TITLES) as (keyof NearbyPlacesDto)[])
    .map((key) => ({
      title: NEARBY_TITLES[key],
      places: (nearby[key] ?? []).map((place: NearbyPlaceDto) => ({
        label: place.name,
        value: formatDistance(place.distance_m),
      })),
    }))
    .filter((group) => group.places.length > 0);
}

// --- Public mappers --------------------------------------------------------

export function toProject(dto: ProjectResponseDto): Project {
  const interior = dto.features.spaces.interior;
  const [hero, ...gallery] = dto.media.map(toMedia);

  return {
    slug: dto.slug,
    name: dto.name,
    tagline: taglineFor(dto),
    price: formatPrice(dto.price_from, dto.price_currency),
    city: cityLine(dto.location),
    badge: badgeFor(dto.status),
    featured: dto.featured,
    beds: bedCount(interior),
    baths: interior.bathrooms !== null ? String(interior.bathrooms) : null,
    area: formatArea(dto.floor_area, dto.floor_area_unit),
    // A listing with no photograph renders as a typographic card rather than
    // borrowing someone else's.
    hero: hero ?? null,
    gallery,
    address: addressLines(dto.location),
    quickSpecs: quickSpecs(dto),
    interior: interiorRows(interior),
    exterior: exteriorRows(dto.features.spaces.outdoor),
    facilities: facilityTiles(dto.features.facilities),
    technical: technicalList(dto.features.features),
    nearby: nearbyGroups(dto.features.nearby),
    documents: dto.documents.map(toDocument),
    agent: dto.agent ? toAgent(dto.agent) : null,
  };
}

/** A list item — everything but the body. */
export function toPost(dto: BlogSummaryDto): Post {
  return {
    slug: dto.slug,
    title: dto.title,
    category: dto.category ? toCategory(dto.category) : null,
    excerpt: dto.excerpt ?? "",
    image: dto.featured_image ? toMedia(dto.featured_image) : null,
    author: dto.author?.name ?? null,
    date: isoDate(dto.published_at) ?? isoDate(dto.created_at) ?? "",
    featured: dto.featured,
    body: null,
  };
}

/** A full article, body included. */
export function toArticle(dto: BlogResponseDto): Post {
  return { ...toPost(dto), body: dto.content };
}

/**
 * Map a list of records, skipping any that cannot be understood.
 *
 * One malformed row — a project whose JSONB `features` predates the current
 * shape, say — should cost that one card, not the whole build.
 */
export function mapAll<D, T>(items: D[], map: (dto: D) => T, label: string): T[] {
  const mapped: T[] = [];
  items.forEach((item) => {
    try {
      mapped.push(map(item));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`[services] skipped a malformed ${label} record — ${reason}`);
    }
  });
  return mapped;
}
