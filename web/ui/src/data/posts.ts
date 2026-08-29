import { media, type Media } from "./media";

export interface Category {
  /** URL segment under /lifestyle/. */
  slug: string;
  name: string;
  /** Hero copy on the category page. */
  blurb: string;
  image: Media;
  /** Shown in the tile row on the journal index. */
  featured?: boolean;
}

export interface Post {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  image: Media;
  author: string;
  /** ISO date; formatted for display by formatDate(). */
  date: string;
  /** Appears as the large hero article on the journal index. */
  featured?: boolean;
  /** HTML rendered above the full-width image interruption. */
  bodyTop: string;
  interruption?: {
    image: Media;
    caption: string;
  };
  /** HTML rendered below the interruption. */
  bodyBottom?: string;
}

export const categories: Category[] = [
  {
    slug: "architecture",
    name: "Architecture",
    blurb:
      "From brutalism to biophilic design, explore the styles shaping luxury living.",
    image: media.jCatCoastal,
    featured: true,
  },
  {
    slug: "interior",
    name: "Interior",
    blurb:
      "Material, light and proportion: how the world's best interiors are composed.",
    image: media.jCatUrban,
    featured: true,
  },
  {
    slug: "lifestyle",
    name: "Lifestyle",
    blurb:
      "The rituals, places and objects that define life inside an exceptional home.",
    image: media.jCatHistoric,
    featured: true,
  },
  {
    slug: "sustainability",
    name: "Sustainability",
    blurb:
      "Renewable systems, low-carbon materials and the quiet craft of building well.",
    image: media.jCatDesert,
    featured: true,
  },
  {
    slug: "market",
    name: "Market",
    blurb:
      "Intelligence on where value is moving across the world's prime residential markets.",
    image: media.journalIsland,
  },
  {
    slug: "technology",
    name: "Technology",
    blurb:
      "The systems disappearing into the fabric of the modern estate.",
    image: media.journalTech,
  },
];

export const posts: Post[] = [
  {
    slug: "brutalist-elegance",
    title: "The Resurgence of Brutalist Elegance",
    category: "architecture",
    excerpt:
      "Exploring how stark concrete forms are being softened by lush landscapes, creating environments that balance monumental weight with organic tranquility in modern luxury estates.",
    image: media.articleHero,
    author: "The Aesthete Editorial",
    date: "2024-10-24",
    featured: true,
    bodyTop: `<p class="drop-cap mb-8">Brutalism, once maligned as the cold, unforgiving architectural language of utilitarian institutions, is experiencing a profound renaissance within the realm of luxury real estate. This resurgence is not a simple repetition of the past; rather, it is an evolution. Today's brutalism&mdash;what we might term 'warm brutalism' or 'brutalist elegance'&mdash;retains the structural honesty of raw concrete while introducing organic textures, abundant natural light, and meticulous landscaping to soften its edges.</p>
<p class="mb-12">The appeal lies in its unapologetic permanence. In an era often characterized by the ephemeral, there is an immense luxury in a structure that feels inextricably anchored to the earth. The massive forms and austere geometry offer a profound sense of shelter and quietude, creating a sanctuary shielded from the noise of the modern world.</p>
<h2>The Alchemy of Texture</h2>
<p class="mb-12">The modern application of brutalism relies heavily on material contrast. The starkness of board-formed concrete is deliberately offset by the inclusion of rich, tactile materials. Think sweeping panels of warm walnut, expansive use of bronze or brass hardware that will patinate over time, and lush, overgrown indoor gardens. It is the friction between the raw and the refined that elevates the aesthetic to true luxury.</p>`,
    interruption: {
      image: media.articleInterruption,
      caption:
        "The Villa Koshido, Hokkaido. Concrete softened by tactile textiles.",
    },
    bodyBottom: `<h2>Integrating the Environment</h2>
<p class="mb-8">Perhaps the most significant shift in contemporary brutalist design is its relationship with the surrounding landscape. The original brutalist structures often stood in stark defiance of their environment. Today's iterations are designed to frame and absorb it. Expansive, frameless glazing dissolves the boundary between interior and exterior, allowing nature to become a vital, ever-changing component of the architecture itself.</p>
<p>As the concrete weathers, it begins to mimic the natural rock formations of its setting, further blurring the line between the built environment and the organic world. This deep integration is the hallmark of modern brutalist elegance&mdash;a testament to human design yielding to the profound beauty of the natural landscape.</p>`,
  },
  {
    slug: "glass-pavilion-transparency",
    title: "The Glass Pavilion: A Study in Transparency",
    category: "architecture",
    excerpt:
      "How floor-to-ceiling glass is redefining the boundary between nature and shelter, creating homes that breathe with their surroundings.",
    image: media.cardGlassPavilion,
    author: "The Aesthete Editorial",
    date: "2024-10-11",
    bodyTop: `<p class="drop-cap mb-8">The fully glazed pavilion is the most demanding form in residential architecture. With nothing to hide behind, every junction, every reveal and every service run has to be resolved before the first pane is set. What reads as effortless openness is in fact the most disciplined kind of building.</p>
<p class="mb-12">Contemporary glazing systems have made the ambition practical. Structural silicone joints and slimline thermal breaks let a wall span the width of a principal room without a visible mullion, while high-performance coatings keep solar gain within reason.</p>
<h2>Framing, Not Displaying</h2>
<p>The best examples are restrained about what they reveal. Glass is used to frame a single considered view rather than to expose the house on all sides, and solid volumes are kept for the rooms that need repose. Transparency, handled well, is an editing decision.</p>`,
  },
  {
    slug: "velvet-revolution",
    title: "The Velvet Revolution",
    category: "interior",
    excerpt:
      "Rich textures and deep tones are returning to the primary suite, replacing stark minimalism with tactile warmth and cocooning luxury.",
    image: media.cardVelvet,
    author: "The Aesthete Editorial",
    date: "2024-09-28",
    bodyTop: `<p class="drop-cap mb-8">After a decade of pale, hard-edged minimalism, the primary suite has turned inward. Deep greens, oxblood and ink now line the walls, and the surfaces that meet the hand have grown softer: mohair, boucle, brushed linen, velvet in every weight.</p>
<p class="mb-12">The shift is as much acoustic as visual. Heavy textiles absorb the reverberation that plagued the hard-surfaced interiors of the last cycle, and a room that sounds quiet reads as calm long before the eye catches up.</p>
<h2>Depth over Contrast</h2>
<p>The discipline lies in restraint of contrast rather than of color. Tonal layering&mdash;several close values of a single hue across wall, drapery and upholstery&mdash;produces depth without the visual noise of a scheme built on opposition.</p>`,
  },
  {
    slug: "solar-elegance",
    title: "Solar Elegance",
    category: "sustainability",
    excerpt:
      "Integrating renewable energy without compromising aesthetic integrity. A look at the new wave of invisible green technology in luxury estates.",
    image: media.cardSolar,
    author: "The Aesthete Editorial",
    date: "2024-09-14",
    bodyTop: `<p class="drop-cap mb-8">The rooftop array has finally stopped announcing itself. Integrated photovoltaic tiles, glazed spandrel panels and standing-seam roofs with laminated cells now generate at scale while reading, from the ground, as ordinary roofing.</p>
<p class="mb-12">Storage has moved with it. Battery banks sized for a full evening of household load sit in plant rooms alongside the mechanical systems, and load management is handled quietly by the same controller that runs lighting and climate.</p>
<h2>Specifying for Forty Years</h2>
<p>The argument for integration is durability as much as appearance. A system detailed into the building envelope is maintained on the building's schedule, not bolted on and forgotten&mdash;which is what separates a genuine sustainability strategy from a gesture.</p>`,
  },
  {
    slug: "minimalist-sanctuary",
    title: "Curating the Minimalist Sanctuary",
    category: "interior",
    excerpt:
      "How top designers are utilizing negative space and monochromatic palettes to cultivate spaces of ultimate mental clarity.",
    image: media.latestMinimalist,
    author: "The Aesthete Editorial",
    date: "2024-08-30",
    bodyTop: `<p class="drop-cap mb-8">Minimalism at this level is not about owning less. It is about the cost of every remaining object having been argued for. The result is a room in which nothing competes for attention, and the few pieces present carry the whole composition.</p>
<p class="mb-12">Negative space does the structural work. Generous gaps between pieces give each one a field of its own, and the eye moves through the room rather than across a wall of things.</p>
<h2>The Discipline of Storage</h2>
<p>None of it survives daily life without concealed storage planned at the same time as the joinery. The apparent emptiness is the visible half of a system designed to absorb everything else.</p>`,
  },
  {
    slug: "infinity-edge",
    title: "The Art of the Infinity Edge",
    category: "lifestyle",
    excerpt:
      "Examining the psychological impact of boundaryless water features in high-altitude luxury properties.",
    image: media.latestInfinityEdge,
    author: "The Aesthete Editorial",
    date: "2024-08-16",
    bodyTop: `<p class="drop-cap mb-8">A vanishing edge works by removing a line the eye expects to find. With the far coping dropped below the waterline, the pool surface appears to continue into whatever lies beyond it&mdash;a lake, a valley, an ocean horizon.</p>
<p class="mb-12">The effect depends entirely on siting. The edge must be set at, or just below, the viewer's eye level from the primary vantage point, which usually means the pool position is fixed before the house plan is settled.</p>
<h2>Engineering the Illusion</h2>
<p>Behind it sits a catch basin, a balance tank and a pump set matched to the weir length. Undersize any of the three and the edge stutters&mdash;the one failure mode a guest notices immediately.</p>`,
  },
  {
    slug: "subterranean-sophistication",
    title: "Subterranean Sophistication",
    category: "architecture",
    excerpt:
      "The growing trend of expansive, highly designed subterranean spaces, from private galleries to advanced wellness centers.",
    image: media.latestSubterranean,
    author: "The Aesthete Editorial",
    date: "2024-08-02",
    bodyTop: `<p class="drop-cap mb-8">Where planning constraints cap the visible envelope, the ambition goes downward. Basement levels that once held plant and parking now hold galleries, pools, screening rooms and full wellness suites.</p>
<p class="mb-12">Daylight is the whole problem. Lightwells, sunken courtyards and structural glass floors are what separate a genuine lower ground floor from a well-finished cellar.</p>
<h2>Air, Water, Structure</h2>
<p>The three constraints that decide feasibility are ventilation, the water table and the retaining structure. Resolve them early and the space reads as part of the house; resolve them late and it never quite does.</p>`,
  },
  {
    slug: "subtle-luxury-kitchens",
    title: "Mastering the Art of Subtle Luxury in Kitchen Spaces",
    category: "interior",
    excerpt:
      "Seamless integration of dark oak and rare marble, where the craftsmanship is felt long before it is noticed.",
    image: media.journalKitchen,
    author: "The Aesthete Editorial",
    date: "2024-07-19",
    bodyTop: `<p class="drop-cap mb-8">The luxury kitchen has stopped performing. Appliances sit behind matched joinery, extraction is drawn into the ceiling plane, and the working surfaces retreat into a secondary room where the actual cooking happens.</p>
<p class="mb-12">What remains on show is material: a single slab run of marble, book-matched at the return, and cabinetry in a timber chosen for how it will look in fifteen years rather than on delivery day.</p>
<h2>Tolerances</h2>
<p>At this level the work is measured in millimetres. Consistent shadow gaps, grain continued across door faces and a stone seam placed where no one stands are the details that distinguish bespoke joinery from expensive cabinets.</p>`,
  },
  {
    slug: "private-island-retreats",
    title: "The Rising Demand for Ultra-Private Island Retreats",
    category: "market",
    excerpt:
      "Why the most sought-after asset in prime residential property is now measured in nautical miles from anyone else.",
    image: media.journalIsland,
    author: "The Aesthete Editorial",
    date: "2024-07-05",
    bodyTop: `<p class="drop-cap mb-8">Privacy has become the scarcest attribute in the prime market, and nothing supplies it as completely as water. Demand for freehold island holdings has held firm through a soft cycle elsewhere.</p>
<p class="mb-12">Buyers are increasingly sophisticated about what they are acquiring: not simply land, but a self-sufficient operating system of power generation, desalination, waste treatment and staff accommodation.</p>
<h2>The Cost of Independence</h2>
<p>Running costs, not acquisition price, decide whether an island holding is sustainable. The properties that trade well are those where the infrastructure was engineered as carefully as the residence.</p>`,
  },
  {
    slug: "invisible-tech",
    title: "Invisible Tech: The Future of Smart Home Integration",
    category: "technology",
    excerpt:
      "The best home technology is the kind no guest can find, and no owner has to think about.",
    image: media.journalTech,
    author: "The Aesthete Editorial",
    date: "2024-06-21",
    bodyTop: `<p class="drop-cap mb-8">The wall covered in glowing keypads has aged badly. The current generation of integration hides the interface almost entirely, leaving behind scenes that trigger on occupancy, daylight level and time of day.</p>
<p class="mb-12">Speakers are plastered into ceilings, screens rise out of joinery or disappear behind mirrored glass, and the rack lives in a ventilated cupboard alongside the rest of the plant.</p>
<h2>Designing for Replacement</h2>
<p>Because the technology will be superseded long before the building is, the wiring topology matters more than the hardware. Generous containment and a documented patch panel are what let a system be renewed without opening a single wall.</p>`,
  },
  {
    slug: "japanese-minimalism",
    title: "The Art of Japanese Minimalism in Coastal Retreats",
    category: "architecture",
    excerpt:
      "Blonde timber, low horizons and a restraint that makes a small house feel limitless.",
    image: media.similarJapanese,
    author: "The Aesthete Editorial",
    date: "2024-06-07",
    bodyTop: `<p class="drop-cap mb-8">The vocabulary translates unusually well to the coast: a low horizontal roof, deep eaves against glare, and a plan organised around a sequence of thresholds rather than a single grand room.</p>
<p class="mb-12">Timber does most of the work. Light-toned, close-grained boards run from interior lining to soffit, carrying the eye out past the glazing line and dissolving the boundary the wall would otherwise assert.</p>
<h2>Emptiness as Material</h2>
<p>What the tradition contributes is a tolerance for the unfilled room&mdash;an interval that gives the occupied spaces their weight.</p>`,
  },
  {
    slug: "desert-pavilions",
    title: "Desert Pavilions: Living in Glass and Steel",
    category: "architecture",
    excerpt:
      "Building lightly on a landscape that punishes every mistake in orientation and shade.",
    image: media.similarDesert,
    author: "The Aesthete Editorial",
    date: "2024-05-24",
    bodyTop: `<p class="drop-cap mb-8">The desert pavilion is an exercise in shade. A deep cantilevered roof plane, correctly oriented, does more for comfort than any amount of mechanical capacity, and it sets the character of the house at the same time.</p>
<p class="mb-12">Steel allows the spans that make the form possible, but it also demands attention to thermal movement and to the finish, which has to survive a punishing diurnal swing.</p>
<h2>Sitting Lightly</h2>
<p>The strongest examples touch the ground in as few places as they can, leaving the desert floor and its drainage patterns essentially undisturbed beneath the building.</p>`,
  },
  {
    slug: "patina-and-permanence",
    title: "Patina & Permanence: Choosing Timeless Materials",
    category: "interior",
    excerpt:
      "The finishes worth specifying are the ones that look better after a decade of use than they did on handover.",
    image: media.similarPatina,
    author: "The Aesthete Editorial",
    date: "2024-05-10",
    bodyTop: `<p class="drop-cap mb-8">Every material in a house is on a trajectory. Some improve: unlacquered brass, oiled oak, honed limestone, solid bronze. Others begin at their peak and decline from the first day of use.</p>
<p class="mb-12">Specifying for patina means accepting visible change and designing for it&mdash;choosing the finishes that record use as character rather than as damage.</p>
<h2>Repairability</h2>
<p>The second test is whether a surface can be brought back. Solid stone can be rehoned, oiled timber re-oiled, brass left alone entirely. Anything with a wear layer measured in microns fails that test.</p>`,
  },
];

export const featuredPost = posts.find((p) => p.featured) ?? posts[0];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function postsByCategory(slug: string): Post[] {
  return posts.filter((p) => p.category === slug);
}

export function categoryName(slug: string): string {
  return getCategory(slug)?.name ?? slug;
}

/** Posts other than `slug`, for the "More from Lifestyle" rail. */
export function relatedPosts(slug: string, count = 3): Post[] {
  return posts.filter((p) => p.slug !== slug).slice(0, count);
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
