/**
 * The `Post` and `Category` view models.
 *
 * Types and one formatter. The records come from `web/api` through
 * `src/services/posts.ts`.
 *
 * `Post.category` is the resolved category record, not a slug — the API
 * expands it inline, so nothing needs to look a name up from a lookup table
 * that used to live here. The lookup helpers that did that are gone with it.
 */

import type { Media } from "./media";

export interface Category {
  /** URL segment under /lifestyle/category/. */
  slug: string;
  name: string;
  /** Hero copy on the category page. */
  blurb: string | null;
  image: Media | null;
  /** Shown in the tile row on the lifestyle index. */
  featured: boolean;
}

export interface Post {
  slug: string;
  title: string;
  /** Null when the post has not been filed under a category. */
  category: Category | null;
  excerpt: string;
  /** Null when the post has no featured image. */
  image: Media | null;
  /** The author's name. Null when the record has no author. */
  author: string | null;
  /** ISO date; formatted for display by formatDate(). */
  date: string;
  /** Appears as the large hero article on the lifestyle index. */
  featured: boolean;
  /**
   * The article body: sanitised HTML, or null on a list item.
   *
   * List routes return a summary without it — only the detail route carries a
   * body — so a card must never assume this is present.
   */
  body: string | null;
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
