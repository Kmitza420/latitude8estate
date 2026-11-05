/**
 * Small builders for the schema.org objects pages pass to `BaseLayout`.
 *
 * Kept here so a page assembles a graph from values it already has rather
 * than hand-writing JSON in the template, and so the shapes stay consistent
 * between the listing, article and index pages.
 */

import type { Post } from "./posts";
import type { Project } from "./projects";
import { site } from "./site";

export interface Crumb {
  name: string;
  href: string;
}

const abs = (origin: string, path: string) => new URL(path, origin).href;

/** The trail from the home page to the current page. */
export function breadcrumbs(origin: string, crumbs: Crumb[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: abs(origin, crumb.href),
    })),
  };
}

/** A listing: the residence, its location, and the published offer if any. */
export function listingSchema(origin: string, project: Project): Record<string, unknown> {
  const { meta } = project;
  const url = abs(origin, `/projects/${project.slug}`);

  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    addressCountry: meta.country,
  };
  if (meta.city) address.addressLocality = meta.city;
  if (meta.district) address.addressRegion = meta.district;
  if (meta.street) address.streetAddress = meta.street;

  const residence: Record<string, unknown> = {
    "@type": meta.type === "condominium" ? "ApartmentComplex" : "House",
    "@id": `${url}#residence`,
    name: project.name,
    description: project.tagline,
    url,
    address,
  };
  if (meta.latitude !== null && meta.longitude !== null) {
    residence.geo = { "@type": "GeoCoordinates", latitude: meta.latitude, longitude: meta.longitude };
  }
  if (project.hero) residence.image = abs(origin, project.hero.src);
  if (meta.bedrooms !== null) residence.numberOfBedrooms = meta.bedrooms;
  if (meta.bathrooms !== null) residence.numberOfBathroomsTotal = meta.bathrooms;
  if (meta.floorArea !== null && meta.floorAreaUnit) {
    residence.floorSize = { "@type": "QuantitativeValue", value: meta.floorArea, unitText: meta.floorAreaUnit };
  }

  const listing: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${url}#listing`,
    name: project.name,
    description: project.tagline,
    url,
    mainEntity: residence,
    provider: { "@id": `${origin}/#organization` },
  };
  if (meta.priceValue !== null && meta.priceCurrency) {
    listing.offers = {
      "@type": "Offer",
      price: meta.priceValue,
      priceCurrency: meta.priceCurrency,
      availability: "https://schema.org/InStock",
      url,
      seller: { "@id": `${origin}/#organization` },
    };
  }
  return listing;
}

/** A journal article with its author, dates and category. */
export function articleSchema(origin: string, post: Post): Record<string, unknown> {
  const url = abs(origin, `/lifestyle/${post.slug}`);
  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.seoDescription ?? post.excerpt,
    url,
    mainEntityOfPage: url,
    inLanguage: "en",
    publisher: { "@id": `${origin}/#organization` },
    isPartOf: { "@id": `${origin}/#website` },
  };
  if (post.image) article.image = abs(origin, post.image.src);
  if (post.author) article.author = { "@type": "Person", name: post.author };
  if (post.date) {
    article.datePublished = post.date;
    article.dateModified = post.date;
  }
  if (post.category) article.articleSection = post.category.name;
  return article;
}

/** A set of questions and answers, for an FAQ section. */
export function faqSchema(items: { question: string; answer: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** The listings on an index page, in order. */
export function listingIndexSchema(origin: string, projects: Project[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${site.legalName} portfolio`,
    itemListElement: projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: project.name,
      url: abs(origin, `/projects/${project.slug}`),
    })),
  };
}
