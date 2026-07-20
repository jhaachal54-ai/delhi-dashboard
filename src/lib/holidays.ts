// Major Delhi/India festivals & public holidays. Dates for lunar festivals are
// the widely-observed 2026/2027 dates; fixed-date ones are exact. Used for the
// "upcoming festivals" strip so visitors can plan around closures & crowds.
export interface Holiday {
  date: string; // ISO yyyy-mm-dd
  name: string;
  emoji: string;
  note: string;
}

const HOLIDAYS: Holiday[] = [
  { date: "2026-08-15", name: "Independence Day", emoji: "🇮🇳", note: "Red Fort ceremony; heavy security in central Delhi" },
  { date: "2026-08-16", name: "Janmashtami", emoji: "🪈", note: "Temples decorated; ISKCON & Birla Mandir busy" },
  { date: "2026-10-02", name: "Gandhi Jayanti", emoji: "🕊️", note: "Dry day; Raj Ghat tributes" },
  { date: "2026-10-20", name: "Dussehra", emoji: "🏹", note: "Ramlila grounds; effigy burnings citywide" },
  { date: "2026-11-08", name: "Diwali", emoji: "🪔", note: "Markets peak then shut; expect a big AQI spike after" },
  { date: "2026-11-15", name: "Chhath Puja", emoji: "🌅", note: "Yamuna ghats crowded at sunrise & sunset" },
  { date: "2026-11-24", name: "Guru Nanak Jayanti", emoji: "🙏", note: "Gurudwaras (Bangla Sahib) hold nagar kirtan" },
  { date: "2026-12-25", name: "Christmas", emoji: "🎄", note: "Sacred Heart Cathedral & CP celebrations" },
  { date: "2027-01-26", name: "Republic Day", emoji: "🎖️", note: "Kartavya Path parade; central Delhi restricted" },
];

// Upcoming holidays from `now`, soonest first.
export function upcomingHolidays(now: Date = new Date(), count = 4): Holiday[] {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
  return HOLIDAYS.filter((h) => h.date >= today).slice(0, count);
}

export function daysUntil(dateIso: string, now: Date = new Date()): number {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
  const a = Date.parse(today + "T00:00:00Z");
  const b = Date.parse(dateIso + "T00:00:00Z");
  return Math.round((b - a) / 86400_000);
}

export function holidayLabel(dateIso: string): string {
  return new Date(dateIso + "T00:00:00+05:30").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
