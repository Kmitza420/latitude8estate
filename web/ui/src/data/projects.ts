import { media, type Media } from "./media";

export interface SpecRow {
  label: string;
  value: string;
}

export interface Facility {
  icon: string;
  label: string;
}

export interface NearbyGroup {
  title: string;
  places: SpecRow[];
}

export interface Document {
  title: string;
  meta: string;
  href: string;
}

export interface Agent {
  name: string;
  email: string;
  portrait: Media;
}

export interface Project {
  slug: string;
  name: string;
  /** Short marketing line shown under the hero title. */
  tagline: string;
  price: string;
  city: string;
  /** Badge shown on the home page card, e.g. "New Listing". */
  badge?: string;
  /** Appears in the "Featured Estates" rail on the home page. */
  featured?: boolean;
  beds: string;
  baths: string;
  area: string;
  hero: Media;
  /** Address block on the detail page. */
  address: string[];
  quickSpecs: SpecRow[];
  interior: SpecRow[];
  exterior: SpecRow[];
  facilities: Facility[];
  technical: string[];
  nearby: NearbyGroup[];
  documents: Document[];
  gallery: Media[];
  agent: Agent;
}

const eleanor: Agent = {
  name: "Eleanor Vance",
  email: "eleanor@latitude8estate.com",
  portrait: media.agentPortrait,
};

const standardDocuments: Document[] = [
  { title: "Main Floor Plan", meta: "PDF, 2.4 MB", href: "#" },
  { title: "Property Brochure", meta: "PDF, 8.1 MB", href: "#" },
];

export const projects: Project[] = [
  {
    slug: "glass-pavilion",
    name: "The Glass Pavilion",
    tagline:
      "A masterpiece of contemporary architecture seamlessly integrating minimal design with the surrounding natural beauty of the Malibu coastline.",
    price: "$12,500,000",
    city: "Malibu, California",
    badge: "New Listing",
    featured: true,
    beds: "5",
    baths: "6.5",
    area: "12,400 sqft",
    hero: media.pavilionHero,
    address: [
      "29400 Pacific Coast Hwy",
      "Western Malibu District",
      "Malibu, California",
      "United States",
    ],
    quickSpecs: [
      { label: "Status", value: "Available" },
      { label: "Completion Date", value: "2023" },
      { label: "Distance to Beach", value: "0.1 Miles" },
      { label: "Total Units", value: "1 Single Family" },
    ],
    interior: [
      { label: "Bedrooms", value: "5" },
      { label: "Bathrooms", value: "6.5" },
      { label: "Living Room", value: "Open Plan" },
      { label: "Dining Room", value: "Formal" },
    ],
    exterior: [
      { label: "Terrace", value: "Cantilevered" },
      { label: "Garden", value: "Landscaped" },
      { label: "Outdoor Kitchen", value: "Included" },
    ],
    facilities: [
      { icon: "pool", label: "Infinity Pool" },
      { icon: "fitness_center", label: "Fitness Center" },
      { icon: "security", label: "24/7 Security" },
      { icon: "directions_car", label: "4-Car Garage" },
    ],
    technical: [
      "Smart Home Integration",
      "Central AC",
      "Chef's Kitchen Appliances",
      "Climate-controlled Wine Cellar",
    ],
    nearby: [
      {
        title: "Transportation",
        places: [{ label: "LAX Airport", value: "22 Miles" }],
      },
      {
        title: "Education & Recreation",
        places: [
          { label: "Malibu High School", value: "3.5 Miles" },
          { label: "Malibu Golf Club", value: "8 Miles" },
        ],
      },
    ],
    documents: standardDocuments,
    gallery: [media.pavilionLiving, media.pavilionKitchen, media.pavilionPool],
    agent: eleanor,
  },
  {
    slug: "alpine-sanctuary",
    name: "Alpine Sanctuary",
    tagline:
      "A timber-and-stone retreat carved into the Aspen treeline, where every principal room opens onto uninterrupted mountain light.",
    price: "$32,000,000",
    city: "Aspen, Colorado",
    featured: true,
    beds: "7",
    baths: "9",
    area: "15,200 sqft",
    hero: media.estateAlpine,
    address: [
      "1180 Red Mountain Road",
      "Red Mountain",
      "Aspen, Colorado",
      "United States",
    ],
    quickSpecs: [
      { label: "Status", value: "Available" },
      { label: "Completion Date", value: "2021" },
      { label: "Distance to Lifts", value: "1.2 Miles" },
      { label: "Total Units", value: "1 Single Family" },
    ],
    interior: [
      { label: "Bedrooms", value: "7" },
      { label: "Bathrooms", value: "9" },
      { label: "Great Room", value: "Double Height" },
      { label: "Screening Room", value: "12 Seat" },
    ],
    exterior: [
      { label: "Terrace", value: "Heated Stone" },
      { label: "Grounds", value: "4.2 Acres" },
      { label: "Ski Room", value: "Included" },
    ],
    facilities: [
      { icon: "hot_tub", label: "Spa & Hammam" },
      { icon: "fitness_center", label: "Fitness Center" },
      { icon: "security", label: "24/7 Security" },
      { icon: "directions_car", label: "5-Car Garage" },
    ],
    technical: [
      "Snow-melt Driveway",
      "Geothermal Heating",
      "Chef's Kitchen Appliances",
      "Climate-controlled Wine Cellar",
    ],
    nearby: [
      {
        title: "Transportation",
        places: [{ label: "Aspen/Pitkin County Airport", value: "5 Miles" }],
      },
      {
        title: "Education & Recreation",
        places: [
          { label: "Aspen Country Day School", value: "4 Miles" },
          { label: "Aspen Golf Club", value: "3 Miles" },
        ],
      },
    ],
    documents: standardDocuments,
    gallery: [media.catHistoric, media.estateOceanfront, media.journalKitchen],
    agent: eleanor,
  },
  {
    slug: "oceanfront-reserve",
    name: "Oceanfront Reserve",
    tagline:
      "A shingled modernist compound on a protected Hamptons dune, with a private boardwalk to the Atlantic.",
    price: "$18,900,000",
    city: "Hamptons, New York",
    featured: true,
    beds: "5",
    baths: "6",
    area: "8,900 sqft",
    hero: media.estateOceanfront,
    address: ["72 Further Lane", "East Hampton", "New York", "United States"],
    quickSpecs: [
      { label: "Status", value: "Available" },
      { label: "Completion Date", value: "2019" },
      { label: "Distance to Beach", value: "Direct Access" },
      { label: "Total Units", value: "1 Single Family" },
    ],
    interior: [
      { label: "Bedrooms", value: "5" },
      { label: "Bathrooms", value: "6" },
      { label: "Living Room", value: "Double Aspect" },
      { label: "Wine Cellar", value: "1,800 Bottle" },
    ],
    exterior: [
      { label: "Terrace", value: "Ipe Deck" },
      { label: "Grounds", value: "2.1 Acres" },
      { label: "Pool House", value: "Included" },
    ],
    facilities: [
      { icon: "pool", label: "Heated Pool" },
      { icon: "sports_tennis", label: "Tennis Court" },
      { icon: "security", label: "Gated Entry" },
      { icon: "directions_car", label: "3-Car Garage" },
    ],
    technical: [
      "Smart Home Integration",
      "Whole-house Generator",
      "Chef's Kitchen Appliances",
      "Outdoor Sound System",
    ],
    nearby: [
      {
        title: "Transportation",
        places: [{ label: "East Hampton Airport", value: "6 Miles" }],
      },
      {
        title: "Education & Recreation",
        places: [
          { label: "Ross School", value: "4 Miles" },
          { label: "Maidstone Club", value: "2 Miles" },
        ],
      },
    ],
    documents: standardDocuments,
    gallery: [media.catCoastal, media.journalIsland, media.estateGlassPavilion],
    agent: eleanor,
  },
  {
    slug: "villa-serenity",
    name: "Villa Serenity",
    tagline:
      "A restored lakeside villa above Como, pairing nineteenth-century stonework with a wholly contemporary interior.",
    price: "$12,500,000",
    city: "Lake Como, Italy",
    beds: "5",
    baths: "6",
    area: "8,200 sqft",
    hero: media.villaSerenity,
    address: ["Via Regina 44", "Tremezzina", "Lake Como", "Italy"],
    quickSpecs: [
      { label: "Status", value: "Available" },
      { label: "Restoration", value: "2020" },
      { label: "Distance to Lake", value: "Direct Access" },
      { label: "Total Units", value: "1 Villa" },
    ],
    interior: [
      { label: "Bedrooms", value: "5" },
      { label: "Bathrooms", value: "6" },
      { label: "Salon", value: "Frescoed" },
      { label: "Library", value: "Original Panelling" },
    ],
    exterior: [
      { label: "Terraces", value: "Three Levels" },
      { label: "Gardens", value: "1.4 Hectares" },
      { label: "Boathouse", value: "Private Mooring" },
    ],
    facilities: [
      { icon: "pool", label: "Infinity Pool" },
      { icon: "directions_boat", label: "Private Dock" },
      { icon: "security", label: "Gated Entry" },
      { icon: "directions_car", label: "3-Car Garage" },
    ],
    technical: [
      "Smart Home Integration",
      "Underfloor Heating",
      "Chef's Kitchen Appliances",
      "Climate-controlled Wine Cellar",
    ],
    nearby: [
      {
        title: "Transportation",
        places: [{ label: "Milan Malpensa Airport", value: "48 Miles" }],
      },
      {
        title: "Education & Recreation",
        places: [
          { label: "International School of Como", value: "18 Miles" },
          { label: "Circolo Golf Villa d'Este", value: "9 Miles" },
        ],
      },
    ],
    documents: standardDocuments,
    gallery: [media.catHistoric, media.catCoastal, media.journalKitchen],
    agent: eleanor,
  },
  {
    slug: "apex-penthouse",
    name: "The Apex Penthouse",
    tagline:
      "A full-floor residence eighty storeys above Midtown, wrapped on all four sides by the skyline.",
    price: "$18,200,000",
    city: "New York City, USA",
    beds: "4",
    baths: "4.5",
    area: "6,500 sqft",
    hero: media.apexPenthouse,
    address: ["217 West 57th Street", "Midtown", "New York", "United States"],
    quickSpecs: [
      { label: "Status", value: "Available" },
      { label: "Completion Date", value: "2022" },
      { label: "Floor", value: "80th" },
      { label: "Total Units", value: "1 Full Floor" },
    ],
    interior: [
      { label: "Bedrooms", value: "4" },
      { label: "Bathrooms", value: "4.5" },
      { label: "Great Room", value: "Corner Aspect" },
      { label: "Study", value: "Private" },
    ],
    exterior: [
      { label: "Terrace", value: "Wraparound" },
      { label: "Outlook", value: "Four Exposures" },
      { label: "Outdoor Kitchen", value: "Included" },
    ],
    facilities: [
      { icon: "pool", label: "Residents Pool" },
      { icon: "fitness_center", label: "Fitness Center" },
      { icon: "concierge", label: "24/7 Concierge" },
      { icon: "directions_car", label: "Valet Parking" },
    ],
    technical: [
      "Smart Home Integration",
      "Central AC",
      "Chef's Kitchen Appliances",
      "Private Elevator Landing",
    ],
    nearby: [
      {
        title: "Transportation",
        places: [{ label: "JFK International Airport", value: "17 Miles" }],
      },
      {
        title: "Education & Recreation",
        places: [
          { label: "Central Park", value: "0.2 Miles" },
          { label: "Lincoln Center", value: "0.8 Miles" },
        ],
      },
    ],
    documents: standardDocuments,
    gallery: [media.catUrban, media.journalTech, media.journalBrutalist],
    agent: eleanor,
  },
  {
    slug: "clifftop-reserve",
    name: "Clifftop Reserve",
    tagline:
      "Concrete, glass and warm timber cantilevered over the Pacific, on one of the last undeveloped Malibu bluffs.",
    price: "$24,000,000",
    city: "Malibu, California",
    beds: "7",
    baths: "9",
    area: "12,000 sqft",
    hero: media.clifftopReserve,
    address: [
      "33500 Pacific Coast Hwy",
      "Encinal Bluffs",
      "Malibu, California",
      "United States",
    ],
    quickSpecs: [
      { label: "Status", value: "Available" },
      { label: "Completion Date", value: "2024" },
      { label: "Distance to Beach", value: "Private Stair" },
      { label: "Total Units", value: "1 Single Family" },
    ],
    interior: [
      { label: "Bedrooms", value: "7" },
      { label: "Bathrooms", value: "9" },
      { label: "Living Room", value: "Open Plan" },
      { label: "Gallery", value: "Museum Lit" },
    ],
    exterior: [
      { label: "Terrace", value: "Cantilevered" },
      { label: "Grounds", value: "5.6 Acres" },
      { label: "Outdoor Kitchen", value: "Included" },
    ],
    facilities: [
      { icon: "pool", label: "Infinity Pool" },
      { icon: "fitness_center", label: "Fitness Center" },
      { icon: "security", label: "24/7 Security" },
      { icon: "directions_car", label: "6-Car Garage" },
    ],
    technical: [
      "Smart Home Integration",
      "Solar Array & Battery",
      "Chef's Kitchen Appliances",
      "Climate-controlled Wine Cellar",
    ],
    nearby: [
      {
        title: "Transportation",
        places: [{ label: "LAX Airport", value: "34 Miles" }],
      },
      {
        title: "Education & Recreation",
        places: [
          { label: "Malibu High School", value: "9 Miles" },
          { label: "Malibu Golf Club", value: "14 Miles" },
        ],
      },
    ],
    documents: standardDocuments,
    gallery: [media.catDesert, media.pavilionPool, media.estateGlassPavilion],
    agent: eleanor,
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
