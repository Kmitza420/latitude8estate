/**
 * Copy for `/property-management`, ported from
 * `web/ui/mockups/property-management.html`.
 *
 * Unlike `projects.ts` and `posts.ts`, nothing here is a fallback fixture —
 * the property-management offer is static marketing copy with no API behind it,
 * so this module is the source of truth rather than a placeholder. It sits in
 * `src/data/` beside `site.ts` for the same reason: the page reads it, and the
 * page is the only reader.
 *
 * The prose is the design tool's, which means it makes specific commercial
 * promises — a 15-minute SLA, a 24-hour reply, certified artisans. Those need
 * confirming against what the agency actually offers before launch.
 */

import { media, type Media } from "./media";

export interface Reason {
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
  /** Short assurance printed below the card's footer rule. */
  badge: string;
}

export interface Service {
  /** Pill over the artwork, e.g. "Infrastructure". */
  category: string;
  title: string;
  body: string;
  image: Media;
  /** Revealed by the card's "More info" disclosure. */
  details: string[];
}

export interface ProcessStep {
  /** Two-digit ordinal, rendered oversized behind the icon. */
  ordinal: string;
  icon: string;
  title: string;
  body: string;
  /** Stage label under the footer rule, e.g. "Step 1: On-Site Evaluation". */
  caption: string;
}

export interface Assurance {
  icon: string;
  title: string;
  body: string;
}

export const hero = {
  eyebrow: "Bespoke Estate Care",
  title: "Comprehensive Property Management.",
  lead: "Preserving architectural excellence, proactive facility engineering, and bespoke property stewardship for the world's most discerning private residences and estates.",
  image: media.heroEstate,
};

export const reasons: Reason[] = [
  {
    icon: "verified_user",
    eyebrow: "Discretion & Trust",
    title: "Absolute Confidentiality",
    body: "Vetted personnel operating under rigorous non-disclosure agreements, guaranteeing flawless privacy for high-profile principals.",
    badge: "Protocol Certified",
  },
  {
    icon: "engineering",
    eyebrow: "Preventative Care",
    title: "Proactive Engineering",
    body: "Continuous sensor telemetry, HVAC calibrations, and structural preventative audits stop complications long before they arise.",
    badge: "Zero Downtime Target",
  },
  {
    icon: "support_agent",
    eyebrow: "Availability",
    title: "24/7 Rapid Response",
    body: "Dedicated estate directors and on-call specialist technicians ready at a moment's notice for urgent mechanical or climate incidents.",
    badge: "15-Minute SLA",
  },
  {
    icon: "architecture",
    eyebrow: "Bespoke Knowledge",
    title: "Master Artisan Care",
    body: "Certified restorers for bespoke Italian marble, museum-grade teak millwork, infinity pool acoustics, and smart automation.",
    badge: "Artisan Certified",
  },
];

export const services: Service[] = [
  {
    category: "Infrastructure",
    title: "Facility & Mechanical Systems",
    body: "Full lifecycle maintenance for whole-home HVAC chillers, backup generators, water desalination, filtration plants, and electrical grid synchronisation.",
    image: media.catCoastal,
    details: [
      "Automated seasonal climate switchovers and air purity diagnostics.",
      "Annual acoustic and vibration dampening testing on heavy plant machinery.",
      "Integration with municipal utilities and off-grid solar battery arrays.",
    ],
  },
  {
    category: "Grounds & Aquatic",
    title: "Architectural Grounds & Pools",
    body: "Meticulous upkeep of geometric gardens, specimen trees, heated saltwater infinity pools, fountains, exterior stone surfaces, and landscape lighting systems.",
    image: media.estateGlassPavilion,
    details: [
      "Bi-weekly mineral balancing and robotic optical pool cleaning.",
      "Horticultural care tailored to rare botanical specimens and topiary forms.",
      "Eco-friendly subterranean irrigation management and moisture sensor tracking.",
    ],
  },
  {
    category: "Technology & Access",
    title: "Smart Home & Security Audits",
    body: "Firmware optimisation, automated shades, Crestron/Lutron lighting matrix updates, perimeter biometrics, and secure encrypted estate network monitoring.",
    image: media.journalTech,
    details: [
      "Cybersecurity hardening for all IoT cameras and internal networks.",
      "Custom multi-room audio calibration and home cinema performance checks.",
      "Integration of biometric access and automated guest vehicle verification.",
    ],
  },
];

export const process: ProcessStep[] = [
  {
    ordinal: "01",
    icon: "search_check",
    title: "Architectural Audit",
    body: "A rigorous multi-day cataloguing of all mechanical assets, finish warranties, structural blueprints, and smart automations.",
    caption: "Step 1: On-Site Evaluation",
  },
  {
    ordinal: "02",
    icon: "rule_settings",
    title: "Custom Protocol",
    body: "Drafting bespoke operating routines, vendor schedules, emergency failover plans, and owner preference binders.",
    caption: "Step 2: Operations Design",
  },
  {
    ordinal: "03",
    icon: "key",
    title: "Dedicated Onboarding",
    body: "Assignment of your dedicated Principal Estate Director and deployment of our encrypted real-time reporting portal.",
    caption: "Step 3: Portal & Team Launch",
  },
  {
    ordinal: "04",
    icon: "military_tech",
    title: "Continuous Vigilance",
    body: "Year-round scheduled maintenance, monthly analytical health scorecards, and immediate emergency deployment.",
    caption: "Step 4: Active Custody",
  },
];

/** The narrative band on the sand ground, between the process and the form. */
export const narrative = {
  eyebrow: "Precision Management",
  title: "Protecting Every Dimension of Your Sanctuary.",
  body: "From monumental cliffside residences to historic European estates, preserving architectural integrity requires more than general contracting — it demands connoisseur-level appreciation and engineering mastery.",
  image: media.estateAlpine,
  /** Overlaid on the lower-left of that image. */
  imageCaption: "Alpine Villa — Full Custody",
  assurances: [
    {
      icon: "diamond",
      title: "Master Craftsmanship",
      body: "Restorative masonry, millwork conditioning, and tailored artisan treatments.",
    },
    {
      icon: "lock",
      title: "Vault-Level Security",
      body: "Discreet monitoring and impenetrable perimeter access controls.",
    },
  ] satisfies Assurance[],
};

/** The closing enquiry section. */
export const enquiry = {
  eyebrow: "Direct Communication",
  title: "Initiate Private Estate Management.",
  body: "Our managing directors personally handle all property management enquiries. Share your estate specifications below to schedule a confidential property walkthrough and tailored proposal.",
  image: media.estateOceanfront,
  imageEyebrow: "Confidential Advisory",
  imageCaption: "Private Estate Concierge & Stewardship",
  /** Printed along the panel's footer rule. */
  guarantees: [
    { icon: "shield", label: "Strict Confidentiality" },
    { icon: "schedule", label: "24hr Guaranteed Reply" },
  ],
  formTitle: "Request Property Evaluation",
  formLead:
    "Please complete the details below. Our executive team will respond within 24 hours.",
  /** Populates the form's subject select, in order. */
  subjects: [
    "Full Estate Stewardship & Operations",
    "Mechanical, HVAC & System Maintenance",
    "Architectural Grounds & Aquatic Care",
    "Smart Home & Cyber Security Infrastructure",
    "Pre-Purchase Architectural Inspection",
    "Other Bespoke Requirement",
  ],
};
