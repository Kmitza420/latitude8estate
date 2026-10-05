import { media, type Media } from "./media";
import { categories, type NavLink } from "./site";

export interface Collection extends NavLink {
  image: Media;
}

/** Tile artwork per category, keyed by route. */
const artwork: Record<string, Media> = {
  "/home": media.catHistoric,
  "/projects": media.catUrban,
  // Craftsmanship close-up — the nearest the library has to estate care.
  "/property-management": media.journalKitchen,
  "/lifestyle": media.journalBrutalist,
  "/about-us": media.catCoastal,
};

/**
 * The tile grid on the home page. Derived from `categories` so the tiles, the
 * top bar, the drawer and the footer can never drift apart.
 */
export const collections: Collection[] = categories.map((category) => ({
  ...category,
  image: artwork[category.href] ?? media.catCoastal,
}));
