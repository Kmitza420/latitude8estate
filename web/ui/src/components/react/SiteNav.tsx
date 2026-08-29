import { useEffect, useState } from "react";

import Icon from "./Icon";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SiteNavProps {
  brand: string;
  links: NavItem[];
  cta: { label: string; href: string };
  /** Path of the current page, used to mark the active link. */
  pathname: string;
}

/** A link is active on its own page and on anything nested beneath it. */
function isActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Top bar plus the hamburger drawer, as one island. The bar sits transparent
 * over each page's hero and drops to solid `primary` once scrolled past it;
 * lettering is gold (`secondary-fixed`) in both states.
 */
export default function SiteNav({ brand, links, cta, pathname }: SiteNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setScrolled(window.scrollY > 50);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    // Stop the page scrolling behind the open drawer.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <nav
        className={`fixed top-0 z-50 flex w-full items-center justify-between px-margin-mobile py-6 transition-colors duration-300 md:px-margin-desktop ${
          scrolled
            ? "bg-primary shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
            : "bg-transparent backdrop-blur-md"
        }`}
      >
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="site-drawer"
            className="text-secondary-fixed transition-opacity hover:opacity-70"
          >
            <Icon name="menu" className="text-3xl" />
          </button>

          <a
            href="/home"
            className="font-headline-sm text-headline-sm tracking-tight text-secondary-fixed"
          >
            {brand}
          </a>
        </div>

        <div className="hidden items-center gap-10 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href, pathname) ? "page" : undefined}
              className={`font-label-md text-label-md text-secondary-fixed transition-opacity hover:opacity-100 ${
                isActive(link.href, pathname)
                  ? "border-b border-secondary-fixed pb-1 opacity-100"
                  : "opacity-75"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href={cta.href}
          className="font-label-md text-label-md hidden rounded-full border border-secondary-fixed px-8 py-3 text-secondary-fixed transition-colors hover:bg-secondary-fixed hover:text-primary lg:block"
        >
          {cta.label}
        </a>
      </nav>

      {/* Drawer */}
      <div
        id="site-drawer"
        onClick={(event) => {
          // Dismiss when the scrim itself is clicked, not the panel.
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className={`fixed inset-0 z-60 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <aside
          aria-label="Site menu"
          aria-hidden={!open}
          className={`fixed top-0 left-0 flex h-dvh w-80 max-w-[85vw] flex-col bg-primary p-10 shadow-2xl transition-transform duration-500 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-12 flex items-center justify-between gap-4">
            {/* Same target as the brand in the top bar and the footer. */}
            <a
              href="/home"
              onClick={() => setOpen(false)}
              className="font-headline-sm text-headline-sm text-secondary-fixed transition-opacity hover:opacity-70"
            >
              {brand}
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="text-secondary-fixed transition-opacity hover:opacity-70"
            >
              <Icon name="close" className="text-2xl" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-6">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href, pathname) ? "page" : undefined}
                className={`font-headline-sm text-headline-sm flex items-center gap-4 text-secondary-fixed transition-all duration-300 hover:pl-2 hover:opacity-100 ${
                  isActive(link.href, pathname) ? "font-bold" : "opacity-75"
                }`}
              >
                <Icon name={link.icon} />
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto border-t border-secondary-fixed/20 pt-8">
            <a
              href={cta.href}
              className="font-label-md text-label-md block rounded-full border border-secondary-fixed px-6 py-4 text-center text-secondary-fixed transition-colors hover:bg-secondary-fixed hover:text-primary"
            >
              {cta.label}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
