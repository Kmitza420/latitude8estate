/**
 * The site's data access layer.
 *
 * Pages import from here and nowhere deeper — `http.ts`, `dto.ts` and
 * `mappers.ts` are implementation detail. Everything returns the view models
 * declared in `src/data/`, so components stay unaware that a network sits
 * behind them.
 *
 *     import { listAllProjects, getFeaturedPost } from "../services";
 *
 * The one exception is the hydrated React islands, which import
 * `services/forms` directly. Going through the barrel would pull the read
 * services — and the placeholder fixtures behind them — into the client bundle.
 *
 * Configuration lives in `src/env.d.ts` and `services/config.ts`; the state of
 * the API behind it is tracked in `web/api/TODO.md`.
 */

export { ALLOW_PLACEHOLDER_FALLBACK, API_BASE_URL, FORMS_ENABLED } from "./config";
export { ApiError } from "./http";

export {
  getFeaturedProjects,
  getProjectBySlug,
  listAllProjects,
  listProjects,
  paginate,
  type ProjectPage,
} from "./projects";

export {
  getCategory,
  getFeaturedPost,
  getPostBySlug,
  getPostsByCategory,
  getRelatedPosts,
  listAllPosts,
  listCategories,
} from "./posts";

export {
  describeSubmitError,
  formsEnabled,
  FormsUnavailableError,
  submitEnquiry,
  subscribeNewsletter,
  type EnquiryInput,
} from "./forms";
