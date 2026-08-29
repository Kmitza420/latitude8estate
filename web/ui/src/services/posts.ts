import {
  categories as placeholderCategories,
  posts as placeholderPosts,
  type Category,
  type Post,
} from "../data/posts";
import type { CategoryDto, PageDto, PostDetailDto, PostSummaryDto } from "./dto";
import { apiGet, readWithFallback } from "./http";
import { toCategory, toPost } from "./mappers";

export function getCategories(): Promise<Category[]> {
  return readWithFallback(
    "categories",
    async () => (await apiGet<CategoryDto[]>("/categories")).map(toCategory),
    () => placeholderCategories,
  );
}

/**
 * Slug to display-name lookup, so card components can label a post's category
 * without each one making its own request.
 */
export async function getCategoryLabels(): Promise<Record<string, string>> {
  const all = await getCategories();
  return Object.fromEntries(all.map((category) => [category.slug, category.name]));
}

export function getCategory(slug: string): Promise<Category | undefined> {
  return readWithFallback(
    `category ${slug}`,
    async () => toCategory(await apiGet<CategoryDto>(`/categories/${slug}`)),
    () => placeholderCategories.find((category) => category.slug === slug),
  );
}

/** Every post, for `getStaticPaths` and for the index listings. */
export function getAllPosts(): Promise<Post[]> {
  return readWithFallback(
    "all posts",
    async () => {
      const dto = await apiGet<PageDto<PostSummaryDto>>(
        "/posts?page=1&page_size=500",
      );
      return dto.items.map(toPost);
    },
    () => placeholderPosts,
  );
}

export function getPostsByCategory(categorySlug: string): Promise<Post[]> {
  return readWithFallback(
    `posts in ${categorySlug}`,
    async () => {
      const dto = await apiGet<PageDto<PostSummaryDto>>(
        `/posts?category=${encodeURIComponent(categorySlug)}&page=1&page_size=500`,
      );
      return dto.items.map(toPost);
    },
    () => placeholderPosts.filter((post) => post.category === categorySlug),
  );
}

/** The large hero article on the lifestyle index. */
export function getFeaturedPost(): Promise<Post> {
  return readWithFallback(
    "featured post",
    async () => toPost(await apiGet<PostDetailDto>("/posts/featured")),
    () => placeholderPosts.find((post) => post.featured) ?? placeholderPosts[0],
  );
}

export function getPost(slug: string): Promise<Post | undefined> {
  return readWithFallback(
    `post ${slug}`,
    async () => toPost(await apiGet<PostDetailDto>(`/posts/${slug}`)),
    () => placeholderPosts.find((post) => post.slug === slug),
  );
}

/** Sidebar/rail of other posts, excluding the one being read. */
export async function getRelatedPosts(slug: string, count = 3): Promise<Post[]> {
  const all = await getAllPosts();
  return all.filter((post) => post.slug !== slug).slice(0, count);
}
