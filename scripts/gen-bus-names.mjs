import { readFileSync, writeFileSync, mkdirSync } from "fs";

const src = "C:/Users/USER/Downloads/GTFS/routes.txt";
const outDir = "src/data";
const out = outDir + "/busRouteNames.json";

const lines = readFileSync(src, "utf8").trim().split(/\r?\n/);
const header = lines[0].split(",");
const idIdx = header.indexOf("route_id");
const longIdx = header.indexOf("route_long_name");
const shortIdx = header.indexOf("route_short_name");

const map = {};
let unparsed = 0;
for (const line of lines.slice(1)) {
  const cols = line.split(",");
  const id = cols[idIdx]?.trim();
  if (!id) continue;
  const short = cols[shortIdx]?.trim();
  const long = cols[longIdx]?.trim() ?? "";
  // Public number = long name minus the direction suffix: 828AUP -> 828A, 971DOWN -> 971, 824STLDOWN2 -> 824STL
  let name = short || long.replace(/(UP|DOWN)\d*$/i, "");
  if (!name) { unparsed++; name = long || id; }
  map[id] = name;
}

mkdirSync(outDir, { recursive: true });
writeFileSync(out, JSON.stringify(map));
const numbers = new Set(Object.values(map));
console.log("route_ids:", Object.keys(map).length);
console.log("distinct bus numbers:", numbers.size);
console.log("unparsed:", unparsed);
console.log("samples:", JSON.stringify(Object.entries(map).slice(0, 6)));
