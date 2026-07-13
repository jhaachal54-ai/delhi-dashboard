// Wikimedia thumbnails for the tourist places (free-licence photos via the
// Wikipedia REST summary API). Places without an article fall back to emoji.
// Run from the project root: node scripts/gen-place-images.mjs
import { existsSync, readFileSync, writeFileSync } from "fs";

const TITLES = {
  "india-gate": "India Gate",
  "red-fort": "Red Fort",
  "jama-masjid": "Jama Masjid, Delhi",
  "chandni-chowk": "Chandni Chowk",
  "qutub-minar": "Qutb Minar",
  "humayun-tomb": "Humayun's tomb",
  "lotus-temple": "Lotus Temple",
  "akshardham": "Swaminarayan Akshardham (Delhi)",
  "connaught-place": "Connaught Place, New Delhi",
  "hauz-khas": "Hauz Khas Complex",
  "lodhi-garden": "Lodhi Gardens",
  "dilli-haat": "Dilli Haat",
  "raj-ghat": "Raj Ghat",
  "purana-qila": "Purana Qila",
  "nehru-planetarium": "Nehru Planetarium",
  "jantar-mantar": "Jantar Mantar, New Delhi",
  "bangla-sahib": "Gurudwara Bangla Sahib",
  "khan-market": "Khan Market",
  "sarojini-nagar": "Sarojini Nagar",
  "select-citywalk": "Select Citywalk",
  "dlf-mall-of-india": "DLF Mall of India",
  "cyberhub": "DLF Cyber City",
  "iskcon-temple": "ISKCON Temple Delhi",
  "five-senses": "Garden of Five Senses",
  "chhatarpur": "Chhatarpur Temple",
  "kingdom-of-dreams": "Kingdom of Dreams",
};

// Resume: keep whatever earlier runs already fetched.
const out = existsSync("src/data/placeImages.json")
  ? JSON.parse(readFileSync("src/data/placeImages.json", "utf8"))
  : {};
for (const [key, title] of Object.entries(TITLES)) {
  if (out[key]) continue;
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`,
      { headers: { "User-Agent": "DelhiCityDashboard/1.0 (personal project)" } }
    );
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();
    const url = j?.thumbnail?.source ?? null;
    if (url) {
      // use the URL exactly as the API returns it — rewriting the size can 400
      out[key] = url;
      console.log("OK  ", key);
    } else {
      console.log("NOIMG", key);
    }
  } catch (e) {
    console.log("FAIL ", key, String(e).slice(0, 40));
  }
  await new Promise((r) => setTimeout(r, 1200)); // stay under Wikipedia's rate limit
}
writeFileSync("src/data/placeImages.json", JSON.stringify(out));
console.log("images:", Object.keys(out).length, "of", Object.keys(TITLES).length);
