/**
 * Site chrome artwork — page hero backgrounds and the four navigation tiles.
 *
 * This file used to be the source of every photograph on the site, generated
 * from the mockups by `scripts/gen-media.mjs` (now deleted) and used to stand
 * in for project and article imagery the API could not supply. It no longer
 * is: record images come from the database as `{url, alt}` pairs, resolved
 * from MinIO object keys server-side.
 *
 * What is left is the eight images that belong to *pages* rather than to
 * records — the kind of thing a designer sets once, not something an editor
 * uploads with a listing.
 *
 * ⚠ These are still temporary `lh3.googleusercontent.com` URLs emitted by the
 * design tool, and they WILL expire. Replace them with permanent assets before
 * launch. The surface is now eight images rather than the entire site, but it
 * is not zero — see `web/api/TODO.md` §5.
 */

export interface Media {
  src: string;
  alt: string;
}

export const media = {
  homeHero: {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkYyVMS9RZ7LFVZoJ7jcCoHRYBuzce6cwZT82081yfjgpV_SxusBYrqYeDxSvgxNPNatgh00SvgO07Cb2r0UkQrcCKUgejTTzPoLMFzGpZxDeJSPXMSdIqdwXqT83Wj82aTIy9TB60Cx6la3nSQm3-M8m2_EntD5mK_vY2Sj_5c0plVaOatWotvY3B3hYbtgDKs1KldAfIrIYdqFeCqY5IIuyguJg5alF0BdQ6bHxdPCAOhlF49X3WIg",
    alt: "A sweeping, majestic wide-angle photograph of an ultra-luxury modern architectural estate situated on a dramatic cliffside overlooking a serene, twilight ocean. The home features expansive floor-to-ceiling glass walls, warm interior lighting glowing against the cool, dark exterior atmosphere. The overall palette emphasizes deep blacks, rich greens, and subtle warm golds. The mood is highly exclusive, aspirational, and peaceful, embodying modern editorial luxury.",
  },
  portfolioHero: {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmujGx3YfS2yZVsVKZmeo5HJkuhGpUgkwkFyrTh2lNLmuPgz3x0N2DVV4m5vge9xEpIiPPDcZWGxspqcLr-mxT34vZvC8aA1-mAsEX5QeWx0lMGBv4v1efedKI79NXnYyCcjmO_0uSIPnECPX6TiTocBOMIKg9LPfVD05NPvXHeMu6Px9Ogi7PuohKC7oDxeG4MRbUDgMpO2Tv1sMPhvO6tdCygYGkfz5u9wnZE1ENY9izge92FBFrHg",
    alt: "A sprawling modern estate nestled in a coastal cliffside. The architecture utilizes expansive glass, raw concrete, and warm timber, harmonizing with the natural rugged landscape. The ocean stretches out to the horizon under a soft, overcast sky, evoking a sense of quiet luxury and secluded prestige. The color palette focuses on earthy tones, deep ocean blues, and warm gold lighting.",
  },
  aboutHero: {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBTOoaGXtJm3ligWUy1A-2vVeJdRA6s2ieaLA9h2VkfXImfpr7jd20yvobbqOO4ic0N9h6A5JG0zl-UeTbfJxP455Jra2dn-5Xig_jq4fATmi0Ongrc4AosY7uJ4Ze3nOleBfRnw7Irh91Kgsr-VVxDdACRUAePaKKXOUOOyaoEDX-f7wPihKCXzyeQN1UUb95ovzB_aUHLl7sxt6C0dv7fqnHV6r_snpu90xtF20vNnGc0nVaf1cxuA",
    alt: "A pristine, minimalist modern living room interior of a luxury estate. White pristine sofas, wide plank oak flooring, and immense windows framing a lush green landscape. Soft, diffused natural light illuminates the space. The aesthetic is clean, sophisticated, and high-end editorial, utilizing a palette of off-whites, warm beiges, and natural greens.",
  },
  contactHero: {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTKOWig-oVnZ0dRq1gj_vQkZ773jKk80jVMclo6g64nyfo92ah_oazb38z_oquo5dup7wldsjGyd3Id9Fl91tRs68aauoaMxuuoJxn7Ar8FUI_HjCHG06QUIyVz7JcHsLXyNcc0aFGkEki01dpOXlzVV71qxE-o23ZQwy2co77sV52MoBH41jC5Ge_5-NCIBcYbg5Qo0EQgkMEySghvRvHyAKm6DZEQDXOu2wQKOppeFUvyxTslR7nKQ",
    alt: "A breathtaking view of a modern infinity pool edge merging with the azure ocean horizon. The sleek lines of a luxury estate's terrace border the pool, featuring crisp white loungers. The sunlight is bright and clear, emphasizing the stark contrast between the deep blue water and pristine white architecture. High-end lifestyle imagery.",
  },
  journalHero: {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfENHt9YO-xkm6xukSDUlNXSL8hFgrN85xWTrY3f1HtIk1GWVmfmqVWScogCFZhPp4MTAEcg8AYDtQcnmwiDZQlvFm27BkZqqAj--0y1GtQ1zocNXTc2vhAoe9CH68SgO8iD6khYkxq21fzQmtnBK6zSrlFz-z8wjryo4NIexbeY44cCc3ACYL9hPKzy4qDKTEw__otTMB8ixKLO7TC-uHc_SCYJRJ0EQ16515gH6dXOTIh7Tean_n4A",
    alt: "A breathtaking, wide-angle architectural photograph of a luxurious, modern estate at dusk. The building features expansive floor-to-ceiling glass walls, warm interior lighting spilling out onto a pristine, reflective infinity pool. The sky is a gradient of deep twilight blues and purples. The composition emphasizes minimal, clean lines and a sense of quiet exclusivity within a lush, dark green forested setting. Editorial luxury style, high contrast, cinematic mood.",
  },
  tileHome: {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQ8G5xfSzXoF1dhTPE_eRsLPRNcT8VO-kmh6idtsVEWrjHc6zxNfIdlaPhOLklKafGjaqCyBI1AmI8v4mzXsUQeThwxzwM4-wMOEMbCz1id4LfWhpA_2cx9fgbriuMQ8hPRjO0J-RLHK2svBWfPs8S66oS114JuOXNWyuxI2AnIxsWNGe_cPGezsdjBAD-BV2B-FvyHbi0BrrM1ZehZiMTFk7FzWYHsD6NwcExnXGmOiwKRkhJ9Dc_5g",
    alt: "A sprawling historic European villa exterior, featuring meticulously manicured geometric gardens and a stately stone facade bathed in warm, golden-hour sunlight. The atmosphere feels timeless, established, and immensely prestigious. The palette leans into earthy beiges, deep greens, and warm sunlight.",
  },
  tileProjects: {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBx9op8J0Z5JTrPXjaxFpfODj0uMX293flvN7k5ko_u-ccIK2GCguiyB_8dxdw_TXqwtilsywAA9VIAQt-Wi3Qk62YZT3kuxc0AkBJiJN7nWfSUDv-eFd7I8s0ZYL7eCWqswsgI6u1s8asDU-D5kcNebmLOXQinQjXSjtgc-L4_L5sljXfSNjNdDjXEWPm_0vR0WInHnsibDsEEgodVCI17aswq6VlWHhHQnep8yHO9A8iQpetDL1nh6g",
    alt: "A sleek, high-altitude luxury penthouse interior overlooking a glittering city skyline at dusk. Dark, rich materials like charcoal stone and deep green velvet upholstery contrast with the sparkling city lights outside. The mood is cosmopolitan, exclusive, and powerful. High contrast, premium editorial style.",
  },
  tileLifestyle: {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCImnzSjEpXdv9_xaSlD0FjAd_Gdzgxe94CCBwbC4GV5yd2Gjej-1paOClNd2Vg2KJTm_t5MZHbYL1Ux4q8eiBz3fgiOSnI2hXRIkdMa7PkSqV-aE8MzxuecRsY0U4DQXj_9NPUAOjpAiriWPBeF7xW0El4UaR0vTNI7fUwwmZ_t1V2VG1rCtIgROG3FCj5pD-_GNTN9zcg7IbaRE7Nf5wTaBC2yBz61OyVqqyx1SaCGVlWbtbao-CuqQ",
    alt: "A beautifully styled detail shot of mid-century modern furniture pieces set against a raw concrete wall in a luxury loft. The focus is on the rich textures of a curved bouclé armchair and a sculptural brass lamp. The lighting is soft and directional, creating a moody, sophisticated editorial atmosphere perfect for an architecture or design blog.",
  },} satisfies Record<string, Media>;

export type MediaKey = keyof typeof media;
