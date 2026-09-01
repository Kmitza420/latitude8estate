export interface NavLink {
  label: string;
  href: string;
  /** Material Symbols name, shown beside the label in the hamburger drawer. */
  icon: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: string;
}

export const site = {
  name: "latitude8estate",
  tagline: "latitude8estate — Architectural Masterpieces",
  description:
    "A curated collection of the world's most exceptional private residences. Uncompromising design meets unparalleled exclusivity.",
  copyright: `© ${new Date().getFullYear()} latitude8estate. All rights reserved.`,
};

/**
 * The single category list for the whole site. It drives the top bar, the
 * hamburger drawer, the footer, and the tile grid on the home page, so the four
 * categories stay in step everywhere.
 */
export const categories: NavLink[] = [
  { label: "Home", href: "/home", icon: "home" },
  { label: "Projects", href: "/projects", icon: "domain" },
  { label: "Lifestyle", href: "/lifestyle", icon: "auto_stories" },
  { label: "About Us", href: "/about-us", icon: "groups" },
];

export const cta = { label: "Contact Us", href: "/contact-us" };

export const socials: SocialLink[] = [
  { label: "Instagram", href: "#", icon: "photo_camera" },
  { label: "LinkedIn", href: "#", icon: "work" },
  { label: "Twitter", href: "#", icon: "chat" },
];
