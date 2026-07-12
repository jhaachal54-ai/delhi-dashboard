// US EPA AQI band colour, shared by every AQI display.
export function aqiColor(aqi: number | null): string {
  if (aqi == null) return "#97a1c0";
  if (aqi <= 50) return "#4ade80";
  if (aqi <= 100) return "#facc15";
  if (aqi <= 150) return "#fb923c";
  if (aqi <= 200) return "#fb7185";
  if (aqi <= 300) return "#c084fc";
  return "#f43f5e";
}
