/**
 * Wire format for the public web API.
 *
 * These types are the contract this UI expects from `web/api`. They are
 * snake_case because that is what FastAPI/Pydantic emits by default; the
 * mappers in `mappers.ts` convert them to the camelCase domain models the
 * components consume, so a change on the wire only touches that one file.
 *
 * The matching TODOs live in `web/api/endpoints/v1/router.py`.
 */

export interface MediaDto {
  url: string;
  alt: string;
}

export interface PageDto<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface SpecDto {
  label: string;
  value: string;
}

export interface FacilityDto {
  icon: string;
  label: string;
}

export interface NearbyGroupDto {
  title: string;
  places: SpecDto[];
}

export interface DocumentDto {
  title: string;
  meta: string;
  url: string;
}

export interface AgentDto {
  name: string;
  email: string;
  portrait: MediaDto;
}

/** Enough to render a card in a grid or rail. */
export interface PropertySummaryDto {
  slug: string;
  name: string;
  tagline: string;
  price: string;
  city: string;
  badge?: string | null;
  featured?: boolean;
  beds: string;
  baths: string;
  area: string;
  hero: MediaDto;
}

/** Everything the property detail page renders. */
export interface PropertyDetailDto extends PropertySummaryDto {
  address: string[];
  quick_specs: SpecDto[];
  interior: SpecDto[];
  exterior: SpecDto[];
  facilities: FacilityDto[];
  technical: string[];
  nearby: NearbyGroupDto[];
  documents: DocumentDto[];
  gallery: MediaDto[];
  agent: AgentDto;
}

export interface CategoryDto {
  slug: string;
  name: string;
  blurb: string;
  image: MediaDto;
  featured?: boolean;
}

export interface PostSummaryDto {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  image: MediaDto;
  author: string;
  /** ISO-8601 date, e.g. "2024-10-24". */
  published_at: string;
  featured?: boolean;
}

export interface PostDetailDto extends PostSummaryDto {
  /** Sanitised HTML rendered above the full-width image break. */
  body_top: string;
  interruption?: {
    image: MediaDto;
    caption: string;
  } | null;
  /** Sanitised HTML rendered below the image break. */
  body_bottom?: string | null;
}

export interface EnquiryRequestDto {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  /** Slug of the property the enquiry came from, when it came from one. */
  property_slug?: string;
}

export interface NewsletterRequestDto {
  email: string;
}

export interface AcceptedDto {
  id: string;
  status: string;
}
