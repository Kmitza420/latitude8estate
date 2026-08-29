import fs from "node:fs";

const names = {
  home: ["logo","heroEstate","catCoastal","catUrban","catHistoric","catDesert","estateGlassPavilion","estateAlpine","estateOceanfront","journalBrutalist","journalKitchen","journalIsland","journalTech","logoAlt"],
  projects: ["portfolioHero","villaSerenity","apexPenthouse","clifftopReserve"],
  project: ["pavilionHero","pavilionLiving","pavilionKitchen","pavilionPool","agentPortrait"],
  blog_home: ["journalHero","jCatCoastal","jCatUrban","jCatHistoric","jCatDesert","featuredBrutalist","latestMinimalist","latestInfinityEdge","latestSubterranean"],
  blog_category: ["categoryHero","cardGlassPavilion","cardVelvet","cardSolar"],
  blog: ["articleHero","articleInterruption","similarJapanese","similarDesert","similarPatina"],
};

const out = {}, alts = {};
for (const [file, keys] of Object.entries(names)) {
  const html = fs.readFileSync(`mockups/${file}.html`, "utf8");
  const tagRe = /<(?:img|div|section|header|article|a)[^>]*>/gi;
  let m, i = 0;
  while ((m = tagRe.exec(html))) {
    const tag = m[0];
    const bg = tag.match(/background-image:\s*url\('([^']+)'\)/);
    const img = tag.match(/<img[^>]*\ssrc="([^"]+)"/);
    const url = bg?.[1] ?? img?.[1];
    if (!url) continue;
    const key = keys[i];
    if (!key) throw new Error(`${file}: image index ${i} has no name`);
    out[key] = url;
    alts[key] = tag.match(/data-alt="([^"]*)"/)?.[1] ?? tag.match(/\salt="([^"]*)"/)?.[1] ?? "";
    i++;
  }
  if (i !== keys.length) throw new Error(`${file}: expected ${keys.length} images, found ${i}`);
}
delete out.logoAlt;
delete alts.logoAlt;

const header = [
  "// Generated from web/ui/mockups/*.html by scripts/gen-media.mjs.",
  "// NOTE: these are temporary googleusercontent URLs emitted by the design tool and WILL expire.",
  "// Replace each entry with a permanent asset before launch.",
  "",
  "export interface Media {",
  "  src: string;",
  "  alt: string;",
  "}",
  "",
  "export const media = {",
].join("\n");

const body = Object.keys(out)
  .map((k) => `  ${k}: {\n    src: ${JSON.stringify(out[k])},\n    alt: ${JSON.stringify(alts[k])},\n  },`)
  .join("\n");

const footer = "\n} satisfies Record<string, Media>;\n\nexport type MediaKey = keyof typeof media;\n";

fs.writeFileSync("src/data/media.ts", `${header}\n${body}${footer}`);
console.log(`wrote src/data/media.ts with ${Object.keys(out).length} entries`);
