import { PAGE_SIZE } from "../data/pagination";
import {
  projects as placeholderProjects,
  type Project,
} from "../data/projects";
import type { PageDto, PropertyDetailDto, PropertySummaryDto } from "./dto";
import { apiGet, readWithFallback } from "./http";
import { toProject } from "./mappers";

export interface ProjectPage {
  projects: Project[];
  page: number;
  totalPages: number;
  total: number;
}

function placeholderPage(page: number, pageSize: number): ProjectPage {
  const start = (page - 1) * pageSize;
  return {
    projects: placeholderProjects.slice(start, start + pageSize),
    page,
    total: placeholderProjects.length,
    totalPages: Math.max(Math.ceil(placeholderProjects.length / pageSize), 1),
  };
}

/** One page of the portfolio grid. */
export function getProperties(
  page = 1,
  pageSize = PAGE_SIZE,
): Promise<ProjectPage> {
  return readWithFallback(
    `properties page ${page}`,
    async () => {
      const dto = await apiGet<PageDto<PropertySummaryDto>>(
        `/properties?page=${page}&page_size=${pageSize}`,
      );
      return {
        projects: dto.items.map(toProject),
        page: dto.page,
        total: dto.total,
        totalPages: dto.total_pages,
      };
    },
    () => placeholderPage(page, pageSize),
  );
}

/** Every property, for `getStaticPaths` on the detail route. */
export function getAllProperties(): Promise<Project[]> {
  return readWithFallback(
    "all properties",
    async () => {
      const dto = await apiGet<PageDto<PropertySummaryDto>>(
        "/properties?page=1&page_size=500",
      );
      return dto.items.map(toProject);
    },
    () => placeholderProjects,
  );
}

/** The rail on the home page. */
export function getFeaturedProperties(): Promise<Project[]> {
  return readWithFallback(
    "featured properties",
    async () => {
      const dto = await apiGet<PropertySummaryDto[]>("/properties/featured");
      return dto.map(toProject);
    },
    () => placeholderProjects.filter((project) => project.featured),
  );
}

export function getProperty(slug: string): Promise<Project | undefined> {
  return readWithFallback(
    `property ${slug}`,
    async () => toProject(await apiGet<PropertyDetailDto>(`/properties/${slug}`)),
    () => placeholderProjects.find((project) => project.slug === slug),
  );
}
