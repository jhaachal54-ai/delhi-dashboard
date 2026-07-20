import type { Place } from "./places";

// Heuristic "best time to visit" from a place's name/blurb — no per-place data
// to maintain. Delhi-specific: heat and crowds make mornings best for most.
export function bestTimeFor(p: Place): string {
  const s = `${p.name} ${p.blurb}`.toLowerCase();
  if (/night|hauz khas|cyberhub|kingdom|bar|club/.test(s)) return "Evenings";
  if (/market|bazaar|nagar|citywalk|mall|khan market|haat/.test(s)) return "Late afternoon & evenings";
  if (/garden|park|nursery|lodhi|five senses|zoo/.test(s)) return "Early morning or sunset";
  if (/temple|masjid|gurudwara|dargah|iskcon|lotus|akshardham|birla|bangla/.test(s))
    return "Early morning (calm, cooler)";
  if (/fort|qila|minar|tomb|museum|gate|planetarium|baoli|mandapam|bhavan/.test(s))
    return "Morning (cooler, fewer crowds)";
  return "Morning or late afternoon";
}
