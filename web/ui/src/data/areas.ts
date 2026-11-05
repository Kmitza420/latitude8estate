/**
 * Area guides: the stretches of coast where the portfolio sits, written once
 * and reused by the home page, the portfolio index and each listing page.
 *
 * A listing is matched to a guide by the district and city on its record,
 * so a new listing in an existing area picks up its guide automatically and
 * a listing somewhere new simply has no guide until one is written here.
 */

export interface Area {
  slug: string;
  name: string;
  /** One line under the name. */
  strap: string;
  /** Two or three paragraphs of plain prose. */
  body: string[];
  /** Short facts a buyer asks about first. */
  highlights: string[];
  /** Districts (and cities) on the listing record that fall inside this area. */
  districts: string[];
  city: string;
}

export const areas: Area[] = [
  {
    slug: "bang-tao-laguna",
    name: "Bang Tao & Laguna",
    strap: "The established luxury market on Phuket's west coast.",
    body: [
      "Bang Tao is the long western beach north of Surin, and the Laguna resort area behind it is where Phuket's luxury market first matured. It brought a golf course, international restaurants, well-run estates and a critical mass of owners who live here for much of the year, and the headlands at either end of the beach carry some of the best villa sites on the island.",
      "It is the natural choice for a family: UWC Thailand and the island's other international schools are close, Boat Avenue and the Laguna village supply everyday needs, and the airport is around half an hour north. Prices reflect the maturity of the market, and so does the depth of the resale demand.",
    ],
    highlights: [
      "Long west-facing beach with headland villa sites",
      "Laguna Golf Phuket, Boat Avenue and the Laguna village",
      "UWC Thailand and other international schools nearby",
      "About 30 minutes from Phuket International Airport",
    ],
    districts: ["Thalang", "Cherng Talay", "Choeng Thale"],
    city: "Phuket",
  },
  {
    slug: "nai-thon-north",
    name: "Nai Thon & the North",
    strap: "Protected coastline, ten minutes from the airport.",
    body: [
      "North of the airport the coast is protected by the Sirinat National Park, so it cannot be built out. The beaches at Nai Thon and Nai Yang are long, quiet and lined with casuarina trees, and the land behind them comes in parcels large enough to plan properly.",
      "The appeal is permanence and convenience together. An owner who flies in and out regularly is at the terminal in ten to twenty-five minutes, and the view from a house here will be the same view in thirty years. The market has been moving steadily north for several years as the road works that once isolated this stretch have finished.",
    ],
    highlights: [
      "Sirinat National Park protects the shoreline from development",
      "Nai Thon: a single small bay with a handful of restaurants",
      "10 to 25 minutes from Phuket International Airport",
      "Larger land parcels and newer, lower-density projects",
    ],
    districts: ["Sakhu", "Sakoo", "Nai Thon", "Naithon", "Mai Khao"],
    city: "Phuket",
  },
  {
    slug: "kata-kata-noi",
    name: "Kata & Kata Noi",
    strap: "The compact, walkable south-west corner.",
    body: [
      "Kata is a lively beach town on the south-west coast, and Kata Noi, just over the headland, is a single short beach with a few hotels and almost nothing else. Apartments and villas on the wooded slope above Kata Noi hold their value because the beach below them cannot grow.",
      "This is the part of the island for an owner who wants to walk to the sand and to dinner rather than drive. Karon and the services of the south are a short way up the coast road, and Phuket Town, Central Phuket and the British International School are around a quarter of an hour inland.",
    ],
    highlights: [
      "Kata Noi: one short, quiet beach six minutes on foot from the hill",
      "Walkable to restaurants and the larger Kata beach",
      "About 15 minutes to Central Phuket and the British International School",
      "Roughly 30 km from Phuket International Airport",
    ],
    districts: ["Karon", "Kata"],
    city: "Phuket",
  },
  {
    slug: "ao-yon-east-coast",
    name: "Ao Yon & the East Coast",
    strap: "Calm water all year, and the island's marinas.",
    body: [
      "The east coast faces Phang Nga Bay rather than the open Andaman Sea, so the water stays calm through the monsoon months when the west coast surf is up. Ao Yon, a small sheltered bay on the Cape Panwa peninsula, is the quietest sandy beach within fifteen minutes of Phuket Town.",
      "The peninsula is largely residential, with the Phuket Aquarium at its tip, and the island's marinas are a short drive north. It suits owners who keep a boat, or who simply want to swim every day of the year from a house that sits on the water rather than above it.",
    ],
    highlights: [
      "Sheltered bay, swimmable in every season",
      "Royal Phuket Marina and Ao Po Grand Marina within reach",
      "Phuket Town and its restaurants about 15 minutes away",
      "A quiet, residential peninsula with little through traffic",
    ],
    districts: ["Wichit", "Vichit", "Cape Panwa", "Panwa"],
    city: "Phuket",
  },
  {
    slug: "south-samui",
    name: "South Koh Samui",
    strap: "The rural side of the island, an hour's flight east.",
    body: [
      "Koh Samui is a smaller, greener island than Phuket with a different rhythm. The north and east coasts around Bophut and Chaweng carry most of the resorts; the south and west, around Taling Ngam and Laem Sor, remain rural, with coconut plantations running down to long, empty beaches.",
      "We represent houses on the south coast for clients who want somewhere genuinely quiet: a private family house to use for part of the year, or to let privately in between, without the noise of the resort towns. Samui's airport is around forty minutes away by road.",
    ],
    highlights: [
      "Laem Sor and Taling Ngam: the last rural stretch of the coast",
      "Small temples, plantations and long, uncrowded beaches",
      "Around 40 minutes from Samui Airport",
      "Private family houses and small estates rather than condominiums",
    ],
    districts: ["Taling Ngam", "Laem Sor", "Na Mueang", "Namuang"],
    city: "Koh Samui",
  },
];

/** The guide for a listing, matched on its district first and its city second. */
export function areaFor(district: string | null, city: string | null): Area | null {
  const norm = (value: string | null) => (value ?? "").trim().toLowerCase();
  const d = norm(district);
  const c = norm(city);
  if (d) {
    const byDistrict = areas.find((area) => area.districts.some((name) => name.toLowerCase() === d));
    if (byDistrict) return byDistrict;
  }
  // Several Phuket districts share a city, so the city alone only settles Samui.
  return areas.find((area) => area.city.toLowerCase() === c && area.city !== "Phuket") ?? null;
}
