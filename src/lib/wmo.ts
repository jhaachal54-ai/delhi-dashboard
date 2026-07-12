// WMO weather interpretation codes -> label + emoji (shared by weather APIs).
export function describeWmo(
  code: number | null,
  isDay: boolean
): { description: string; emoji: string } {
  const day = isDay;
  const map: Record<number, [string, string]> = {
    0: ["Clear sky", day ? "☀️" : "🌙"],
    1: ["Mainly clear", day ? "🌤️" : "🌙"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Fog", "🌫️"],
    48: ["Rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Heavy drizzle", "🌧️"],
    61: ["Light rain", "🌦️"],
    63: ["Rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    66: ["Freezing rain", "🌨️"],
    67: ["Freezing rain", "🌨️"],
    71: ["Light snow", "🌨️"],
    73: ["Snow", "❄️"],
    75: ["Heavy snow", "❄️"],
    80: ["Rain showers", "🌦️"],
    81: ["Rain showers", "🌧️"],
    82: ["Violent showers", "⛈️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm w/ hail", "⛈️"],
    99: ["Thunderstorm w/ hail", "⛈️"],
  };
  if (code == null || !(code in map)) return { description: "—", emoji: day ? "🌡️" : "🌙" };
  const [description, emoji] = map[code];
  return { description, emoji };
}
