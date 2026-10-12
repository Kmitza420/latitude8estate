import { media, type Media } from "./media";
import { categories, type NavLink } from "./site";

export interface Collection extends NavLink {
  image: Media;
}

/** Tile artwork per category, keyed by route. */
const artwork: Record<string, Media> = {
  "/home": media.tileHome,
  "/projects": media.tileProjects,
  "/property-management": media.tileManagement,
  "/lifestyle": media.tileLifestyle,
  "/about-us": media.aboutHero,
};

/**
 * The tile grid on the home page. Derived from `categories` so the tiles, the
 * top bar, the drawer and the footer can never drift apart.
 */
export const collections: Collection[] = categories.map((category) => ({
  ...category,
  image: artwork[category.href] ?? media.aboutHero,
}));
