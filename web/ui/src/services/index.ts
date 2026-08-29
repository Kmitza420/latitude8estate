/**
 * Service layer for the public web API (`web/api`).
 *
 * Pages call these instead of importing `src/data/` directly. Reads happen at
 * build time and fall back to the placeholder content in `src/data/` while the
 * API is still being built; writes happen in the browser and surface failures.
 *
 * The endpoints these expect are listed as TODOs in
 * `web/api/endpoints/v1/router.py`.
 */

export { API_BASE_URL, API_URL, ALLOW_FALLBACK } from "./config";
export { ApiError, isApiUnreachable, resetApiBreaker } from "./http";

export type * from "./dto";

export {
  getAllProperties,
  getFeaturedProperties,
  getProperties,
  getProperty,
  type ProjectPage,
} from "./properties";

export {
  getAllPosts,
  getCategories,
  getCategory,
  getCategoryLabels,
  getFeaturedPost,
  getPost,
  getPostsByCategory,
  getRelatedPosts,
} from "./posts";

export { submitEnquiry, subscribeToNewsletter } from "./forms";
