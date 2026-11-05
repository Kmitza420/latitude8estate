export interface NavLink {
  label: string;
  href: string;
  /** Material Symbols name, shown beside the label in the hamburger drawer. */
  icon: string;
  /**
   * Shorter wording for the desktop top bar, where five labels share one row.
   * The drawer, the footer and the home tiles always use the full `label`.
   */
  short?: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: string;
}

export const site = {
  name: "latitude8estate",
  /** The name written out, for structured data and page copy. */
  legalName: "Latitude 8 Estate",
  tagline: "latitude8estate — Luxury Villas & Condominiums in Phuket",
  description:
    "Latitude 8 Estate represents architecturally significant villas, estates and condominiums in Phuket and Koh Samui, Thailand, and manages them for owners who live abroad.",
  /**
   * The canonical origin, matching `site` in astro.config.mjs. Used for
   * canonical URLs, Open Graph tags and structured data; `Astro.site` is the
   * same value inside a page.
   */
  url: import.meta.env.PUBLIC_SITE_URL ?? "https://latitude8estate.com",
  locale: "en_GB",
  email: "enquiries@latitude8estate.com",
  /** Where the portfolio actually is; used in structured data and page copy. */
  areaServed: ["Phuket, Thailand", "Koh Samui, Thailand"],
  copyright: `© ${new Date().getFullYear()} latitude8estate. All rights reserved.`,
};

/**
 * The single category list for the whole site. It drives the top bar, the
 * hamburger drawer, the footer, and the tile grid on the home page, so the five
 * categories stay in step everywhere.
 */
export const categories: NavLink[] = [
  { label: "Home", href: "/home", icon: "home" },
  { label: "Projects", href: "/projects", icon: "domain" },
  {
    label: "Property Management",
    short: "Management",
    href: "/property-management",
    icon: "home_repair_service",
  },
  { label: "Lifestyle", href: "/lifestyle", icon: "auto_stories" },
  { label: "About Us", href: "/about-us", icon: "groups" },
];

export const cta = { label: "Contact Us", href: "/contact-us" };

export const socials: SocialLink[] = [
  { label: "Instagram", href: "#", icon: "photo_camera" },
  { label: "LinkedIn", href: "#", icon: "work" },
  { label: "Twitter", href: "#", icon: "chat" },
];
