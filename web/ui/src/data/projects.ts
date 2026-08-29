/**
 * The `Project` view model.
 *
 * Types only. The records themselves come from `web/api` through
 * `src/services/projects.ts` — there are no fixtures here any more, and there
 * is no fallback to them, so nothing the site renders can be anything other
 * than what the database holds.
 *
 * Every nullable field below is nullable because the record may genuinely not
 * have that value. Components must omit the corresponding piece of layout
 * rather than substituting something plausible.
 */

import type { Media } from "./media";

export interface SpecRow {
  label: string;
  value: string;
}

export interface Facility {
  /** Material Symbols ligature name; see `Icon.astro`. */
  icon: string;
  label: string;
}

export interface NearbyGroup {
  title: string;
  places: SpecRow[];
}

export interface Document {
  title: string;
  /** Format and size, when the record has them. */
  meta: string | null;
  href: string;
}

export interface Agent {
  name: string;
  email: string;
  phone: string | null;
  portrait: Media | null;
}

export interface Project {
  slug: string;
  name: string;
  /** The record's own tagline, or one composed from type, place and status. */
  tagline: string;
  /** Formatted price, or null when no price is published for this listing. */
  price: string | null;
  city: string;
  /** Status badge on the card, e.g. "Under Construction". Absent when completed. */
  badge?: string;
  /** Appears in the "Featured Estates" rail on the home page. */
  featured: boolean;
  beds: string | null;
  baths: string | null;
  /** Formatted floor area, e.g. "642 m²". */
  area: string | null;
  /** First image on the record. Null when the listing has no photography. */
  hero: Media | null;
  /** The remaining images, in the order the editor set. */
  gallery: Media[];
  /** Address block on the detail page. */
  address: string[];
  quickSpecs: SpecRow[];
  interior: SpecRow[];
  exterior: SpecRow[];
  facilities: Facility[];
  technical: string[];
  nearby: NearbyGroup[];
  documents: Document[];
  agent: Agent | null;
}
