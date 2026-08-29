/**
 * Lifestyle articles (the `blogs` resource in `web/api`) and the categories
 * they are filed under.
 *
 * Two things to know about this module:
 *
 * 1. The API has no notion of *published*. `GET /v1/blogs/` returns drafts and
 *    archived posts alongside live ones, so the filtering happens here. That is
 *    a stopgap — a public site should never receive an unpublished record in
 *    the first place, and moving the filter server-side is on `web/api/TODO.md`.
 *
 * 2. Categories are still fixtures. `Blog.category_id` is a bare UUID with no
 *    `categories` table behind it, so there is nothing to resolve it against.
 *    The category list is served from here anyway, so the pages have a single
 *    import surface and switching to a real endpoint touches only this file.
 */

import {
  categories as fixtureCategories,
  posts as fixturePosts,
  type Category,
  type Post,
} from "../data/posts";
import { BULK_PAGE_SIZE, MAX_BULK_PAGES, endpoints } from "./config";
import type { BlogResponseDto, PaginatedDto } from "./dto";
import { ApiError, apiGet, withFallback } from "./http";
import { mapAll, toPost } from "./mappers";

/** Newest first, which is the order every list on the site renders in. */
function byDateDescending(a: Post, b: Post): number {
  return b.date.localeCompare(a.date);
}

async function fetchBlogPage(page: number, pageSize: number): Promise<PaginatedDto<BlogResponseDto>> {
  return apiGet<PaginatedDto<BlogResponseDto>>(endpoints.blogs, {
    skip: (page - 1) * pageSize,
    limit: pageSize,
  });
}

/**
 * Every published article, newest first.
 *
 * As with projects, the static build wants the whole list once rather than a
 * request per page, so the endpoint is walked to exhaustion.
 */
export async function listAllPosts(): Promise<Post[]> {
  return withFallback(
    "listAllPosts",
    async () => {
      const collected: BlogResponseDto[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const dto = await fetchBlogPage(page, BULK_PAGE_SIZE);
        collected.push(...dto.items);
        totalPages = Math.max(dto.metadata.total_pages, 1);
        page += 1;
      } while (page <= totalPages && page <= MAX_BULK_PAGES);

      const published = collected.filter((blog) => blog.status === "published");
      return mapAll(published, toPost, "blog").sort(byDateDescending);
    },
    () => [...fixturePosts],
  );
}

/**
 * One article by slug, with its full body.
 *
 * The list endpoint happens to return `content` today, but a list route that
 * ships every article's HTML will not survive a real catalogue — so the slug is
 * resolved against the list and the body is read from the detail endpoint,
 * which is where it belongs. A dedicated `GET /v1/blogs/by-slug/{slug}` would
 * collapse this to one request; see `web/api/TODO.md`.
 */
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  return withFallback(
    `getPostBySlug(${slug})`,
    async () => {
      const listing = await fetchBlogPage(1, BULK_PAGE_SIZE);
      const match = listing.items.find(
        (blog) => blog.slug === slug && blog.status === "published",
      );
      if (!match) return undefined;

      try {
        const detail = await apiGet<BlogResponseDto>(endpoints.blog(match.id));
        return toPost(detail);
      } catch (error) {
        // A 404 here means it was deleted between the two calls. Anything else
        // is a real failure and should reach `withFallback`.
        if (error instanceof ApiError && error.isNotFound) return undefined;
        throw error;
      }
    },
    () => fixturePosts.find((post) => post.slug === slug),
  );
}

/**
 * The article that headlines `/lifestyle` and the home page.
 *
 * The fixtures flag one explicitly; the API has no `featured` column, so an
 * API-backed site leads with the newest published article instead.
 */
export async function getFeaturedPost(): Promise<Post | undefined> {
  const posts = await listAllPosts();
  return posts.find((post) => post.featured) ?? posts[0];
}

/** Articles other than `slug`, for the "More from Lifestyle" rail. */
export async function getRelatedPosts(slug: string, count = 3): Promise<Post[]> {
  const posts = await listAllPosts();
  return posts.filter((post) => post.slug !== slug).slice(0, count);
}

/** Published articles filed under one category. */
export async function getPostsByCategory(categorySlug: string): Promise<Post[]> {
  const posts = await listAllPosts();
  return posts.filter((post) => post.category === categorySlug);
}

/**
 * The editorial categories.
 *
 * Fixture-backed for now — see the note at the top of this file. Async anyway,
 * so that the call sites do not have to change when it becomes an endpoint.
 */
export async function listCategories(): Promise<Category[]> {
  return fixtureCategories;
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  const categories = await listCategories();
  return categories.find((category) => category.slug === slug);
}
