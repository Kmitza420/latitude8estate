/**
 * API wire shapes -> the view models the pages and components already use.
 *
 * The `.astro` components are deliberately untouched by this work: they still
 * take the `Project`, `Post` and `Category` types declared in `src/data/`, and
 * these functions are what make an API record look like one.
 *
 * Where the API has no field for something the design renders — images,
 * prices, taglines, the listing agent — the mapper substitutes a clearly
 * marked stand-in from `placeholders` below. Every one of those is an open
 * item in `web/api/TODO.md`; when a field lands upstream, delete its entry
 * here and read the real value.
 */

import { media, type Media } from "../data/media";
import type { Agent, Facility, NearbyGroup, Project, SpecRow } from "../data/projects";
import type { Post } from "../data/posts";
import type {
  BlogResponseDto,
  FacilitiesDto,
  FeaturesDto,
  InteriorSpacesDto,
  NearbyPlaceDto,
  NearbyPlacesDto,
  OutdoorSpacesDto,
  ProjectLocationDto,
  ProjectResponseDto,
  ProjectStatusDto,
} from "./dto";

/** Rendered where the API simply has no value to give. */
const UNKNOWN = "—";

/**
 * Stand-ins for fields the API does not model yet.
 *
 * Kept together so the cost of the gap is visible in one place rather than
 * scattered through the mapping functions.
 */
const placeholders = {
  /** No price column exists. This is the trade's honest form of "unset". */
  price: "Price on application",
  /** No media table exists, so heroes rotate through the mockup imagery. */
  heroPool: [
    media.estateGlassPavilion,
    media.estateAlpine,
    media.estateOceanfront,
    media.villaSerenity,
    media.apexPenthouse,
    media.clifftopReserve,
  ] as Media[],
  galleryPool: [media.pavilionLiving, media.pavilionKitchen, media.pavilionPool] as Media[],
  articlePool: [
    media.journalBrutalist,
    media.journalKitchen,
    media.journalIsland,
    media.journalTech,
  ] as Media[],
  /** No authors table, so a blog's author_id cannot be resolved to a name. */
  author: "Latitude 8 Estate",
  /** No categories table, so category_id cannot be resolved to a slug. */
  category: "lifestyle",
  /** No agents table. */
  agent: {
    name: "Eleanor Vance",
    email: "eleanor@latitude8estate.com",
    portrait: media.agentPortrait,
  } satisfies Agent,
} as const;

// --- Small formatters ------------------------------------------------------

/**
 * Derive a URL segment from a project name.
 *
 * The API has no slug column for projects and the site routes on slugs, so one
 * has to be manufactured. `listAllProjects` de-duplicates the result, because
 * two projects both called "The Residences" would otherwise generate the same
 * static route and fail the build.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

/** ISO timestamp or date -> the "YYYY-MM-DD" that `formatDate` expects. */
function isoDate(value: string | null): string | null {
  const date = value?.split("T")[0];
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

/** Rotate deterministically through a pool, so a record keeps its image. */
function pick<T>(pool: readonly T[], index: number): T {
  return pool[index % pool.length]!;
}

function present(rows: (SpecRow | null)[]): SpecRow[] {
  return rows.filter((row): row is SpecRow => row !== null);
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

function taglineFor(dto: ProjectResponseDto): string {
  const kind = dto.project_type === "villa" ? "villa" : "condominium development";
  const state =
    dto.status === "completed"
      ? "Completed and ready to view"
      : dto.status === "under_construction"
        ? "Currently under construction"
        : "In planning";
  return `A ${kind} in ${cityLine(dto.location)}. ${state}.`;
}

function bedCount(interior: InteriorSpacesDto): string {
  const total = (interior.guest_bedrooms ?? 0) + (interior.master_bedroom ? 1 : 0);
  return total > 0 ? String(total) : UNKNOWN;
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
  return present([
    { label: "Bedrooms", value: bedCount(interior) },
    {
      label: "Bathrooms",
      value: interior.bathrooms !== null ? String(interior.bathrooms) : UNKNOWN,
    },
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

/**
 * @param index Position in the list. Used only to keep the placeholder imagery
 *   stable and varied until the API returns real media.
 */
export function toProject(dto: ProjectResponseDto, index = 0): Project {
  const interior = dto.features.spaces.interior;

  return {
    slug: slugify(dto.name) || dto.id,
    name: dto.name,
    tagline: taglineFor(dto),
    price: placeholders.price,
    city: cityLine(dto.location),
    badge: badgeFor(dto.status),
    // No `featured` column; `getFeaturedProjects` decides by list position.
    featured: false,
    beds: bedCount(interior),
    baths: interior.bathrooms !== null ? String(interior.bathrooms) : UNKNOWN,
    // No floor-area column at all.
    area: UNKNOWN,
    hero: pick(placeholders.heroPool, index),
    address: addressLines(dto.location),
    quickSpecs: quickSpecs(dto),
    interior: interiorRows(interior),
    exterior: exteriorRows(dto.features.spaces.outdoor),
    facilities: facilityTiles(dto.features.facilities),
    technical: technicalList(dto.features.features),
    nearby: nearbyGroups(dto.features.nearby),
    // No documents table; the section renders empty rather than inventing links.
    documents: [],
    gallery: placeholders.galleryPool,
    agent: placeholders.agent,
  };
}

export function toPost(dto: BlogResponseDto, index = 0): Post {
  const image: Media = dto.featured_image_url
    ? // A bare URL arrives with no alt text, so the title stands in for one.
      { src: dto.featured_image_url, alt: dto.title }
    : pick(placeholders.articlePool, index);

  return {
    slug: dto.slug,
    title: dto.title,
    // `category_id` is an unresolvable UUID until a categories table exists.
    category: placeholders.category,
    excerpt: dto.excerpt ?? "",
    image,
    author: placeholders.author,
    date: isoDate(dto.published_at) ?? isoDate(dto.created_at) ?? "",
    // No `featured` column; `getFeaturedPost` takes the newest instead.
    featured: false,
    // One HTML blob upstream, so there is no interruption and no lower body.
    bodyTop: dto.content,
  };
}

/**
 * Map a list of records, skipping any that cannot be understood.
 *
 * One malformed row — a project whose JSONB `features` predates the current
 * shape, say — should cost that one card, not the whole build.
 */
export function mapAll<D, T>(items: D[], map: (dto: D, index: number) => T, label: string): T[] {
  const mapped: T[] = [];
  items.forEach((item, index) => {
    try {
      mapped.push(map(item, index));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`[services] skipped a malformed ${label} record — ${reason}`);
    }
  });
  return mapped;
}
