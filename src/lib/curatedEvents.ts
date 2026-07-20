import type { EventItem, EventsData } from "./types";

// A curated baseline of Delhi's genuinely recurring happenings — daily monument
// shows, weekly bazaars & qawwali, annual festivals. Expanded into concrete
// upcoming dated instances so the events section is always populated for free,
// with no external API. Coordinates let the planner match events near a place.

type Rule =
  | { kind: "daily"; closedDow?: number[] } // 0 = Sunday
  | { kind: "weekly"; dow: number[] }
  | { kind: "annual"; from: [number, number]; to: [number, number] }; // [month(1-12), day]

interface Recurring {
  name: string;
  venue: string;
  lat: number;
  lng: number;
  segment: string;
  time: string; // "HH:MM" IST
  rule: Rule;
  free?: boolean;
  url?: string;
}

const CURATED: Recurring[] = [
  {
    name: "Ishq-e-Dilli — Red Fort Sound & Light Show",
    venue: "Red Fort, Old Delhi",
    lat: 28.6562, lng: 77.241, segment: "Arts", time: "19:30",
    rule: { kind: "daily", closedDow: [1] },
  },
  {
    name: "Purana Qila Sound & Light Show",
    venue: "Purana Qila, Mathura Road",
    lat: 28.6096, lng: 77.2437, segment: "Arts", time: "19:00",
    rule: { kind: "daily" },
  },
  {
    name: "Sahaj Anand Water Show",
    venue: "Swaminarayan Akshardham",
    lat: 28.6127, lng: 77.2773, segment: "Arts", time: "19:15",
    rule: { kind: "daily", closedDow: [1] }, url: "https://akshardham.com",
  },
  {
    name: "Dilli Haat — Craft Bazaar & Food Festival",
    venue: "Dilli Haat, INA",
    lat: 28.5738, lng: 77.2088, segment: "Food", time: "11:00",
    rule: { kind: "daily" },
  },
  {
    name: "Thursday Qawwali at Nizamuddin Dargah",
    venue: "Hazrat Nizamuddin Dargah",
    lat: 28.5912, lng: 77.2437, segment: "Music", time: "18:30",
    rule: { kind: "weekly", dow: [4] }, free: true,
  },
  {
    name: "Sunday Book Bazaar",
    venue: "Mahila Haat, Daryaganj",
    lat: 28.643, lng: 77.24, segment: "Arts", time: "10:00",
    rule: { kind: "weekly", dow: [0] }, free: true,
  },
  {
    name: "Sunder Nursery Weekend Bazaar",
    venue: "Sunder Nursery, Nizamuddin",
    lat: 28.5972, lng: 77.247, segment: "Festival", time: "09:00",
    rule: { kind: "weekly", dow: [6, 0] },
  },
  {
    name: "Garden of Five Senses",
    venue: "Said-ul-Ajaib, Saket",
    lat: 28.5106, lng: 77.199, segment: "Arts", time: "16:00",
    rule: { kind: "daily" },
  },
  {
    name: "Ongoing Exhibitions — National Gallery of Modern Art",
    venue: "NGMA, Jaipur House",
    lat: 28.611, lng: 77.2295, segment: "Arts", time: "10:00",
    rule: { kind: "daily", closedDow: [1] },
  },
  {
    name: "Live Craft Demonstrations — Crafts Museum",
    venue: "National Crafts Museum, Pragati Maidan",
    lat: 28.6135, lng: 77.243, segment: "Arts", time: "10:30",
    rule: { kind: "daily", closedDow: [1] },
  },
  {
    name: "Sky Show — Nehru Planetarium",
    venue: "Nehru Planetarium, Teen Murti",
    lat: 28.6015, lng: 77.1975, segment: "Kids", time: "14:00",
    rule: { kind: "daily", closedDow: [1] },
  },
  // Annual — only surface when the date range is within the window.
  {
    name: "Independence Day Celebrations",
    venue: "Red Fort, Old Delhi",
    lat: 28.6562, lng: 77.241, segment: "Festival", time: "07:30",
    rule: { kind: "annual", from: [8, 15], to: [8, 15] }, free: true,
  },
  {
    name: "Republic Day Parade",
    venue: "Kartavya Path",
    lat: 28.6129, lng: 77.2295, segment: "Festival", time: "09:00",
    rule: { kind: "annual", from: [1, 26], to: [1, 26] }, free: true,
  },
  {
    name: "Surajkund International Crafts Mela",
    venue: "Surajkund, Faridabad",
    lat: 28.456, lng: 77.287, segment: "Festival", time: "10:00",
    rule: { kind: "annual", from: [2, 1], to: [2, 16] },
  },
];

const MAX_PER_EVENT = 2;
const MAX_TOTAL = 28;

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function occursOn(rule: Rule, month: number, day: number, dow: number): boolean {
  if (rule.kind === "daily") return !(rule.closedDow ?? []).includes(dow);
  if (rule.kind === "weekly") return rule.dow.includes(dow);
  // annual: month/day within [from, to] (inclusive, same calendar year range)
  const v = month * 100 + day;
  return v >= rule.from[0] * 100 + rule.from[1] && v <= rule.to[0] * 100 + rule.to[1];
}

function label(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function generateEvents(now: Date = new Date(), windowDays = 30): EventsData {
  // Anchor to Delhi's calendar date (IST has no DST, so a fixed +05:30 is safe).
  const istToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
  const [y0, m0, d0] = istToday.split("-").map(Number);
  const base = Date.UTC(y0, m0 - 1, d0);

  const counts = new Map<string, number>();
  const items: EventItem[] = [];

  for (let offset = 0; offset <= windowDays; offset++) {
    const day = new Date(base + offset * 86400_000);
    const y = day.getUTCFullYear();
    const m = day.getUTCMonth() + 1;
    const d = day.getUTCDate();
    const dow = day.getUTCDay();

    for (const ev of CURATED) {
      if ((counts.get(ev.name) ?? 0) >= MAX_PER_EVENT) continue;
      if (!occursOn(ev.rule, m, d, dow)) continue;
      counts.set(ev.name, (counts.get(ev.name) ?? 0) + 1);

      const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${ev.time}:00+05:30`;
      items.push({
        id: `${slug(ev.name)}-${y}${m}${d}`,
        name: ev.name,
        date: iso,
        dateLabel: label(iso),
        venue: ev.venue,
        segment: ev.segment,
        priceLabel: ev.free ? "Free entry" : null,
        url: ev.url ?? null,
        image: null,
        lat: ev.lat,
        lng: ev.lng,
      });
    }
  }

  items.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const events = items.slice(0, MAX_TOTAL);
  return { events, total: events.length };
}
