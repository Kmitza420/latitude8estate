/**
 * Lifestyle articles (the `blogs` resource in `web/api`) and the categories
 * they are filed under.
 *
 * Both are fully API-backed now. Two things that used to be worked around here
 * no longer are:
 *
 * 1. **Publication status is the API's job.** `GET /v1/blogs/` returns
 *    published posts only, on the list and the detail routes alike. The client
 *    no longer filters, because a draft filtered out in the browser has still
 *    been sent to the browser.
 * 2. **Categories are real records.** `Blog.category_id` is a foreign key to a
 *    `categories` table, expanded inline on the response, so a post carries its
 *    category's name, blurb and artwork rather than an opaque UUID.
 */

import type { Category, Post } from "../data/posts";
import { BULK_PAGE_SIZE, MAX_BULK_PAGES, endpoints } from "./config";
import type { BlogResponseDto, BlogSummaryDto, CategoryDto, PaginatedDto } from "./dto";
import { apiGet, optional } from "./http";
import { mapAll, toArticle, toCategory, toPost } from "./mappers";

async function fetchBlogPage(
  page: number,
  pageSize: number,
): Promise<PaginatedDto<BlogSummaryDto>> {
  return apiGet<PaginatedDto<BlogSummaryDto>>(endpoints.blogs, {
    skip: (page - 1) * pageSize,
    limit: pageSize,
  });
}

/**
 * Every published article, newest first.
 *
 * The API orders on `published_at DESC`, so the order here is the API's and
 * the site does not re-sort. As with projects, the static build wants the whole
 * list once rather than a request per page.
 */
export async function listAllPosts(): Promise<Post[]> {
  const collected: BlogSummaryDto[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const dto = await fetchBlogPage(page, BULK_PAGE_SIZE);
    collected.push(...dto.items);
    totalPages = Math.max(dto.metadata.total_pages, 1);
    page += 1;
  } while (page <= totalPages && page <= MAX_BULK_PAGES);

  return mapAll(collected, toPost, "blog");
}

/**
 * One article by slug, with its full body.
 *
 * A single request: `slug` is unique and indexed upstream and there is a route
 * for it, so this no longer resolves slug → id against the list first.
 */
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const dto = await optional(() => apiGet<BlogResponseDto>(endpoints.blogBySlug(slug)));
  return dto ? toArticle(dto) : undefined;
}

/**
 * The article that headlines `/lifestyle` and the home page.
 *
 * Backed by the `featured` flag on the record; the API falls back to the
 * newest published article when nothing is flagged.
 */
export async function getFeaturedPost(): Promise<Post | undefined> {
  const items = await apiGet<BlogSummaryDto[]>(endpoints.featuredBlogs, { limit: 1 });
  return items[0] ? toPost(items[0]) : undefined;
}

/** Articles other than `slug`, for the "More from Lifestyle" rail. */
export async function getRelatedPosts(slug: string, count = 3): Promise<Post[]> {
  const posts = await listAllPosts();
  return posts.filter((post) => post.slug !== slug).slice(0, count);
}

/** Published articles filed under one category, newest first. */
export async function getPostsByCategory(categorySlug: string): Promise<Post[]> {
  const dto = await apiGet<PaginatedDto<BlogSummaryDto>>(endpoints.categoryBlogs(categorySlug), {
    limit: BULK_PAGE_SIZE,
  });
  return mapAll(dto.items, toPost, "blog");
}

/** The editorial categories, alphabetically. */
export async function listCategories(): Promise<Category[]> {
  const items = await apiGet<CategoryDto[]>(endpoints.categories);
  return items.map(toCategory);
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  const dto = await optional(() => apiGet<CategoryDto>(endpoints.category(slug)));
  return dto ? toCategory(dto) : undefined;
}
