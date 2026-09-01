/**
 * Projects (the portfolio) read from `web/api`.
 *
 * Everything here returns the `Project` view model from `src/data/projects`,
 * so the pages and cards that consume it stay unaware that a network sits
 * behind them.
 *
 * There are no fixtures behind these calls. A failure propagates and stops the
 * build, which is the intended behaviour — a site that silently published
 * placeholder content because the API was briefly down would be worse.
 */

import type { Project } from "../data/projects";
import { BULK_PAGE_SIZE, MAX_BULK_PAGES, endpoints } from "./config";
import type { PaginatedDto, ProjectResponseDto } from "./dto";
import { apiGet, optional } from "./http";
import { mapAll, toProject } from "./mappers";

export interface ProjectPage {
  projects: Project[];
  /** 1-based. */
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * One page straight from the endpoint, with the API's own pagination metadata.
 *
 * The static build does not use this — it takes the whole list once and slices
 * locally, so that `/projects` and `/projects/page/2` can never disagree about
 * where the boundary falls. It is the primitive `listAllProjects` is built
 * from, and the one to reach for if the site ever moves to SSR.
 */
export async function listProjects(page = 1, pageSize = BULK_PAGE_SIZE): Promise<ProjectPage> {
  const dto = await apiGet<PaginatedDto<ProjectResponseDto>>(endpoints.projects, {
    skip: (page - 1) * pageSize,
    limit: pageSize,
  });

  return {
    projects: mapAll(dto.items, toProject, "project"),
    page: dto.metadata.current_page,
    pageSize: dto.metadata.limit,
    total: dto.metadata.total_items,
    totalPages: Math.max(dto.metadata.total_pages, 1),
  };
}

/**
 * Every project, in API order (newest first).
 *
 * `getStaticPaths` needs the full list anyway, and a static build runs once, so
 * walking the endpoint to exhaustion is cheaper than one request per rendered
 * page.
 */
export async function listAllProjects(): Promise<Project[]> {
  const collected: Project[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await listProjects(page, BULK_PAGE_SIZE);
    collected.push(...result.projects);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages && page <= MAX_BULK_PAGES);

  return collected;
}

/** Slice a full list into one page of the portfolio grid. */
export function paginate(projects: Project[], page: number, pageSize: number): ProjectPage {
  const totalPages = Math.max(Math.ceil(projects.length / pageSize), 1);

  return {
    projects: projects.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: projects.length,
    totalPages,
  };
}

/**
 * The estates on the home page rail.
 *
 * Backed by the `featured` flag on the record. The API falls back to the
 * newest listings when nothing has been flagged, so the rail is never empty.
 */
export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
  const items = await apiGet<ProjectResponseDto[]>(endpoints.featuredProjects, { limit });
  return mapAll(items, toProject, "project");
}

/**
 * One project by its slug.
 *
 * `slug` is a real, unique, indexed column now, so this is a single lookup
 * rather than a scan of the whole list. Returns `undefined` when nothing
 * matches, which is what a detail page should render as a 404.
 */
export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const dto = await optional(() => apiGet<ProjectResponseDto>(endpoints.projectBySlug(slug)));
  return dto ? toProject(dto) : undefined;
}

/**
 * Aggregate figures over the whole portfolio.
 *
 * Used by the band on `/home` and the statistics on `/about-us`. Both slots
 * previously held invented numbers; these are counted from the records that
 * are actually published.
 */
export interface PortfolioSummary {
  total: number;
  markets: number;
  completed: number;
  underConstruction: number;
  /** Distinct "City, Country" lines, alphabetically. */
  marketNames: string[];
}

export function summarise(projects: Project[]): PortfolioSummary {
  const marketNames = [...new Set(projects.map((project) => project.city))].sort();

  return {
    total: projects.length,
    markets: marketNames.length,
    completed: projects.filter((project) => project.badge === undefined).length,
    underConstruction: projects.filter((project) => project.badge === "Under Construction").length,
    marketNames,
  };
}
