// Delhi Metro (DMRC + associated NMRC) network — static reference data.
// There is no public real-time DMRC line-status / disruption API, so this panel
// shows the accurate network plus a Running/Closed state that is genuinely
// derived from each line's operating hours and the current IST time.

export interface MetroLine {
  key: string;
  name: string;
  color: string;
  dark: boolean; // true if the colour needs dark text on it
  from: string;
  to: string;
  stations: number;
  open: number; // service start, minutes from midnight (IST)
  close: number; // service end, minutes from midnight (IST)
}

const H = (h: number, m = 0) => h * 60 + m;

export const METRO_LINES: MetroLine[] = [
  { key: "red", name: "Red", color: "#e2231a", dark: false, from: "Rithala", to: "Shaheed Sthal", stations: 29, open: H(6), close: H(23) },
  { key: "yellow", name: "Yellow", color: "#ffcc00", dark: true, from: "Samaypur Badli", to: "Millennium City Centre", stations: 37, open: H(6), close: H(23) },
  { key: "blue", name: "Blue", color: "#0068b3", dark: false, from: "Dwarka Sec 21", to: "Noida Electronic City", stations: 50, open: H(6), close: H(23) },
  { key: "green", name: "Green", color: "#00a651", dark: false, from: "Inderlok / Kirti Nagar", to: "Brig. Hoshiar Singh", stations: 24, open: H(6), close: H(23) },
  { key: "violet", name: "Violet", color: "#79378b", dark: false, from: "Kashmere Gate", to: "Raja Nahar Singh", stations: 34, open: H(6), close: H(23) },
  { key: "pink", name: "Pink", color: "#e6308a", dark: false, from: "Majlis Park", to: "Shiv Vihar", stations: 38, open: H(6), close: H(23) },
  { key: "magenta", name: "Magenta", color: "#b6329c", dark: false, from: "Janakpuri West", to: "Botanical Garden", stations: 25, open: H(6), close: H(23) },
  { key: "grey", name: "Grey", color: "#8a8d8f", dark: false, from: "Dwarka", to: "Dhansa Bus Stand", stations: 4, open: H(6), close: H(23) },
  { key: "airport", name: "Airport Express", color: "#f36f21", dark: false, from: "New Delhi", to: "Yashobhoomi (Dwarka 25)", stations: 8, open: H(4, 45), close: H(23, 40) },
  { key: "aqua", name: "Aqua (Noida)", color: "#00b7c3", dark: false, from: "Noida Sec 51", to: "Depot Station", stations: 21, open: H(6), close: H(22) },
  { key: "rapid", name: "Rapid Metro (Gurugram)", color: "#5b7c99", dark: false, from: "Sector 55-56", to: "Phase 3", stations: 11, open: H(6), close: H(23) },
];

// Current minutes-from-midnight in IST, robust to the viewer's own timezone.
export function istMinutesNow(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m;
}

export interface MetroStatus {
  running: boolean;
  label: string; // "Running" | "Closed" | "Closing soon"
}

export function lineStatus(line: MetroLine, nowMin = istMinutesNow()): MetroStatus {
  const running = nowMin >= line.open && nowMin < line.close;
  if (!running) return { running: false, label: "Closed" };
  if (line.close - nowMin <= 30) return { running: true, label: "Closing soon" };
  return { running: true, label: "Running" };
}
