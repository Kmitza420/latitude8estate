/**
 * Projects (the portfolio) read from `web/api`.
 *
 * Everything here returns the `Project` view model from `src/data/projects`,
 * so the pages and cards that consume it are unchanged from when the data was
 * a static module.
 *
 * Note that `/v1/projects/` is **not reachable yet**: `web/api` mounts its
 * projects router under the `/blogs` prefix by mistake, so every call here
 * currently fails and falls through to the fixtures. That is the first item in
 * `web/api/TODO.md`, and a one-line fix upstream.
 */

import { projects as fixtureProjects, type Project } from "../data/projects";
import { BULK_PAGE_SIZE, MAX_BULK_PAGES, endpoints } from "./config";
import type { PaginatedDto, ProjectResponseDto } from "./dto";
import { apiGet, withFallback } from "./http";
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
 * Every project, in API order.
 *
 * `getStaticPaths` needs the full list anyway, and a static build runs once, so
 * walking the endpoint to exhaustion is cheaper than the alternative of one
 * request per rendered page.
 */
export async function listAllProjects(): Promise<Project[]> {
  return withFallback(
    "listAllProjects",
    async () => {
      const collected: Project[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const result = await listProjects(page, BULK_PAGE_SIZE);
        collected.push(...result.projects);
        totalPages = result.totalPages;
        page += 1;
      } while (page <= totalPages && page <= MAX_BULK_PAGES);

      return dedupeSlugs(collected);
    },
    () => fixtureProjects,
  );
}

/**
 * Make every slug unique.
 *
 * Slugs are derived from the project name (the API has no slug column), so two
 * identically named projects would otherwise produce two identical static
 * routes and fail the build.
 */
function dedupeSlugs(projects: Project[]): Project[] {
  const seen = new Set<string>();

  return projects.map((project) => {
    if (!seen.has(project.slug)) {
      seen.add(project.slug);
      return project;
    }

    let suffix = 2;
    let candidate = `${project.slug}-${suffix}`;
    while (seen.has(candidate)) {
      suffix += 1;
      candidate = `${project.slug}-${suffix}`;
    }
    seen.add(candidate);
    return { ...project, slug: candidate };
  });
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
 * The fixtures carry an explicit `featured` flag; the API has no such column,
 * so API-backed results fall back to the first few in list order. Give the
 * endpoint a deliberate ordering (see `web/api/TODO.md`) and this becomes
 * meaningful rather than arbitrary.
 */
export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
  const all = await listAllProjects();
  const flagged = all.filter((project) => project.featured);
  return (flagged.length > 0 ? flagged : all).slice(0, limit);
}

/**
 * One project by its slug.
 *
 * There is no `GET /v1/projects/by-slug/{slug}` — and could not be, since the
 * API has no slug column — so this scans the list the same way the routes are
 * generated from it. Returns `undefined` when nothing matches, which is what a
 * detail page should render as a 404.
 */
export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const all = await listAllProjects();
  return all.find((project) => project.slug === slug);
}
