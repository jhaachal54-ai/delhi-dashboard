// Deterministic inline-SVG placeholder art (data URIs). Same input always yields
// the same colours. Restaurants get a little food illustration chosen from what
// they're known for; news gets a newspaper glyph. No letters.

function hueOf(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  return h % 360;
}

// A CSS gradient string (used for photo-less place cards, rendered in HTML).
export function gradientFor(seed: string): string {
  const h1 = hueOf(seed);
  const h2 = (h1 + 45) % 360;
  return `linear-gradient(135deg, hsl(${h1} 56% 56%), hsl(${h2} 60% 42%))`;
}

function tile(seed: string, inner: string): string {
  const h1 = hueOf(seed);
  const h2 = (h1 + 45) % 360;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='hsl(${h1},56%,57%)'/>` +
    `<stop offset='1' stop-color='hsl(${h2},60%,43%)'/></linearGradient></defs>` +
    `<rect width='96' height='96' fill='url(#g)'/>${inner}</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

// ── Food illustrations (white on the gradient) ──────────────────────────────
const W = "#ffffff";
const BOWL =
  `<path d='M42 30c3-5-2-8 0-12M52 30c3-5-2-8 0-12' stroke='${W}' stroke-width='2.5' fill='none' stroke-linecap='round' opacity='0.75'/>` +
  `<path d='M26 50a22 13 0 0 0 44 0Z' fill='${W}' opacity='0.95'/>` +
  `<ellipse cx='48' cy='50' rx='22' ry='7' fill='${W}'/>` +
  `<path d='M33 49a15 8 0 0 1 30 0Z' fill='${W}' opacity='0.55'/>`;
const SKEWER =
  `<line x1='26' y1='68' x2='72' y2='30' stroke='${W}' stroke-width='3' stroke-linecap='round' opacity='0.85'/>` +
  `<circle cx='40' cy='55' r='7.5' fill='${W}'/>` +
  `<circle cx='51' cy='46' r='7.5' fill='${W}' opacity='0.9'/>` +
  `<circle cx='62' cy='37' r='7.5' fill='${W}'/>`;
const SWEET =
  `<path d='M56 34a13 13 0 1 0 4 12a8 8 0 1 1 -12 -4' fill='none' stroke='${W}' stroke-width='5' stroke-linecap='round'/>`;
const BREAD =
  `<ellipse cx='48' cy='43' rx='23' ry='7' fill='${W}' opacity='0.75'/>` +
  `<ellipse cx='48' cy='53' rx='23' ry='7.5' fill='${W}'/>` +
  `<circle cx='42' cy='53' r='1.6' fill='rgba(0,0,0,0.18)'/>` +
  `<circle cx='53' cy='54' r='1.6' fill='rgba(0,0,0,0.18)'/>`;
const CUP =
  `<path d='M40 30c3-5-2-7 0-10M49 30c3-5-2-7 0-10' stroke='${W}' stroke-width='2.5' fill='none' stroke-linecap='round' opacity='0.75'/>` +
  `<path d='M31 40h28v10a14 14 0 0 1 -28 0Z' fill='${W}'/>` +
  `<path d='M59 42a8 8 0 0 1 0 12' fill='none' stroke='${W}' stroke-width='3'/>`;
const MOMO =
  `<path d='M28 58a20 15 0 0 1 40 0Z' fill='${W}'/>` +
  `<path d='M34 57q4 -9 8 0M46 57q4 -9 8 0' fill='none' stroke='rgba(0,0,0,0.18)' stroke-width='2'/>`;
const PLATE =
  `<circle cx='48' cy='48' r='17' fill='none' stroke='${W}' stroke-width='3'/>` +
  `<circle cx='48' cy='48' r='8' fill='${W}' opacity='0.45'/>` +
  `<line x1='26' y1='32' x2='26' y2='64' stroke='${W}' stroke-width='3' stroke-linecap='round'/>` +
  `<line x1='70' y1='32' x2='70' y2='64' stroke='${W}' stroke-width='3' stroke-linecap='round'/>`;

const FOOD_RULES: [RegExp, string][] = [
  [/kebab|kabab|tikka|seekh|grill|barbeque|bbq|roast|tandoor/, SKEWER],
  [/jalebi|kulfi|sweet|mishti|halwa|rabri|falooda|dessert|kheer|ghee/, SWEET],
  [/paratha|naan|roti|kulcha|bhatur|bread|chur/, BREAD],
  [/coffee|caf|chai|\btea\b|brew|espresso/, CUP],
  [/momo|thukpa|tibetan|dumpling|noodle/, MOMO],
  [/curry|butter chicken|dal|korma|nihari|biryani|makhani|mughlai|chicken|mutton|paneer|thali|gravy|nalli|kadhi|south/, BOWL],
];

export function foodThumb(name: string, knownFor = ""): string {
  const hay = `${name} ${knownFor}`.toLowerCase();
  const icon = FOOD_RULES.find(([re]) => re.test(hay))?.[1] ?? PLATE;
  return tile(name, icon);
}

export function newsThumb(source: string): string {
  const paper =
    `<rect x='30' y='30' width='36' height='36' rx='3' fill='${W}' opacity='0.95'/>` +
    `<rect x='35' y='36' width='16' height='11' rx='1.5' fill='rgba(0,0,0,0.18)'/>` +
    `<line x1='54' y1='37' x2='61' y2='37' stroke='rgba(0,0,0,0.18)' stroke-width='2.5'/>` +
    `<line x1='54' y1='43' x2='61' y2='43' stroke='rgba(0,0,0,0.18)' stroke-width='2.5'/>` +
    `<line x1='35' y1='53' x2='61' y2='53' stroke='rgba(0,0,0,0.14)' stroke-width='2.5'/>` +
    `<line x1='35' y1='59' x2='61' y2='59' stroke='rgba(0,0,0,0.14)' stroke-width='2.5'/>`;
  return tile(source || "news", paper);
}
