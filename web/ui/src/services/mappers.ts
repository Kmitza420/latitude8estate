import type { Media } from "../data/media";
import type { Category, Post } from "../data/posts";
import type { Project } from "../data/projects";
import type {
  CategoryDto,
  MediaDto,
  PostDetailDto,
  PostSummaryDto,
  PropertyDetailDto,
  PropertySummaryDto,
} from "./dto";

/**
 * Wire format to domain model. The components keep consuming the same shapes
 * they always have, so swapping placeholder data for the API touches only this
 * file and the service functions.
 */

export function toMedia(dto: MediaDto): Media {
  return { src: dto.url, alt: dto.alt };
}

/**
 * A summary has no detail sections. The detail page never renders a summary, so
 * the empty collections here are only ever seen by card components.
 */
export function toProject(dto: PropertySummaryDto | PropertyDetailDto): Project {
  const detail = "quick_specs" in dto ? dto : undefined;

  return {
    slug: dto.slug,
    name: dto.name,
    tagline: dto.tagline,
    price: dto.price,
    city: dto.city,
    badge: dto.badge ?? undefined,
    featured: dto.featured,
    beds: dto.beds,
    baths: dto.baths,
    area: dto.area,
    hero: toMedia(dto.hero),
    address: detail?.address ?? [],
    quickSpecs: detail?.quick_specs ?? [],
    interior: detail?.interior ?? [],
    exterior: detail?.exterior ?? [],
    facilities: detail?.facilities ?? [],
    technical: detail?.technical ?? [],
    nearby: detail?.nearby ?? [],
    documents:
      detail?.documents.map((doc) => ({
        title: doc.title,
        meta: doc.meta,
        href: doc.url,
      })) ?? [],
    gallery: detail?.gallery.map(toMedia) ?? [],
    agent: detail
      ? {
          name: detail.agent.name,
          email: detail.agent.email,
          portrait: toMedia(detail.agent.portrait),
        }
      : { name: "", email: "", portrait: { src: "", alt: "" } },
  };
}

export function toCategory(dto: CategoryDto): Category {
  return {
    slug: dto.slug,
    name: dto.name,
    blurb: dto.blurb,
    image: toMedia(dto.image),
    featured: dto.featured,
  };
}

export function toPost(dto: PostSummaryDto | PostDetailDto): Post {
  const detail = "body_top" in dto ? dto : undefined;

  return {
    slug: dto.slug,
    title: dto.title,
    category: dto.category,
    excerpt: dto.excerpt,
    image: toMedia(dto.image),
    author: dto.author,
    date: dto.published_at,
    featured: dto.featured,
    bodyTop: detail?.body_top ?? "",
    interruption: detail?.interruption
      ? {
          image: toMedia(detail.interruption.image),
          caption: detail.interruption.caption,
        }
      : undefined,
    bodyBottom: detail?.body_bottom ?? undefined,
  };
}
