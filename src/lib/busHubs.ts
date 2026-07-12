// Well-known bus hubs / major stops across Delhi NCR, with coordinates.
// Used to match live bus positions near "where the user is" — the live feed
// gives vehicle GPS, so we find routes actually running near a hub right now.

export interface BusHub {
  key: string;
  name: string;
  lat: number;
  lng: number;
}

export const BUS_HUBS: BusHub[] = [
  { key: "isbt-kashmere-gate", name: "ISBT Kashmere Gate", lat: 28.6675, lng: 77.2295 },
  { key: "connaught-place", name: "Connaught Place / Shivaji Stadium", lat: 28.6292, lng: 77.2115 },
  { key: "karol-bagh", name: "Karol Bagh", lat: 28.6519, lng: 77.1903 },
  { key: "aiims", name: "AIIMS", lat: 28.5681, lng: 77.208 },
  { key: "sarai-kale-khan", name: "Sarai Kale Khan ISBT", lat: 28.5883, lng: 77.2571 },
  { key: "anand-vihar", name: "Anand Vihar ISBT", lat: 28.6468, lng: 77.3157 },
  { key: "mehrauli", name: "Mehrauli Terminal", lat: 28.5142, lng: 77.1784 },
  { key: "saket", name: "Saket", lat: 28.5222, lng: 77.2115 },
  { key: "uttam-nagar", name: "Uttam Nagar Terminal", lat: 28.6218, lng: 77.0563 },
  { key: "janakpuri", name: "Janakpuri", lat: 28.6219, lng: 77.0878 },
  { key: "madhuban-chowk", name: "Madhuban Chowk (Rohini)", lat: 28.7202, lng: 77.1012 },
  { key: "azadpur", name: "Azadpur", lat: 28.7071, lng: 77.1754 },
  { key: "shahdara", name: "Shahdara", lat: 28.6732, lng: 77.2894 },
  { key: "laxmi-nagar", name: "Laxmi Nagar", lat: 28.6304, lng: 77.2775 },
  { key: "nehru-place", name: "Nehru Place Terminal", lat: 28.5494, lng: 77.2537 },
  { key: "munirka", name: "Munirka", lat: 28.5574, lng: 77.174 },
  { key: "vasant-kunj", name: "Vasant Kunj", lat: 28.5205, lng: 77.1551 },
  { key: "ito", name: "ITO", lat: 28.6304, lng: 77.2411 },
  { key: "okhla", name: "Okhla", lat: 28.5352, lng: 77.2745 },
  { key: "punjabi-bagh", name: "Punjabi Bagh", lat: 28.6663, lng: 77.1312 },
  { key: "model-town", name: "Model Town", lat: 28.7025, lng: 77.1934 },
  { key: "dwarka-mor", name: "Dwarka Mor", lat: 28.6192, lng: 77.0332 },
  { key: "badarpur", name: "Badarpur Border", lat: 28.4931, lng: 77.3026 },
  { key: "mayur-vihar", name: "Mayur Vihar Phase-1", lat: 28.6043, lng: 77.2892 },
  { key: "new-delhi-rly", name: "New Delhi Railway Station", lat: 28.643, lng: 77.221 },
  { key: "old-delhi-rly", name: "Old Delhi Railway Station", lat: 28.661, lng: 77.228 },
  { key: "mayur-vihar-3", name: "Mayur Vihar Phase-3", lat: 28.61, lng: 77.335 },
  { key: "noida-sec-37", name: "Noida Sector 37", lat: 28.556, lng: 77.354 },
  { key: "noida-city-centre", name: "Noida City Centre", lat: 28.5745, lng: 77.356 },
  { key: "ghaziabad", name: "Ghaziabad (Old Bus Adda)", lat: 28.665, lng: 77.431 },
  { key: "hauz-khas", name: "Hauz Khas", lat: 28.548, lng: 77.203 },
  { key: "vasant-vihar", name: "Vasant Vihar", lat: 28.557, lng: 77.159 },
  { key: "igi-t3", name: "IGI Airport T3", lat: 28.556, lng: 77.087 },
  { key: "mahipalpur", name: "Mahipalpur", lat: 28.545, lng: 77.125 },
  { key: "kapashera", name: "Kapashera Border", lat: 28.529, lng: 77.07 },
  { key: "gurugram-bus-stand", name: "Gurugram Bus Stand", lat: 28.47, lng: 77.02 },
  { key: "iffco-chowk", name: "IFFCO Chowk (Gurugram)", lat: 28.472, lng: 77.072 },
  { key: "faridabad-old", name: "Old Faridabad", lat: 28.418, lng: 77.31 },
  { key: "kalkaji", name: "Kalkaji", lat: 28.548, lng: 77.259 },
  { key: "ashram", name: "Ashram", lat: 28.576, lng: 77.259 },
  { key: "lajpat-nagar", name: "Lajpat Nagar", lat: 28.57, lng: 77.243 },
  { key: "dhaula-kuan", name: "Dhaula Kuan", lat: 28.592, lng: 77.161 },
  { key: "naraina", name: "Naraina", lat: 28.628, lng: 77.14 },
  { key: "rajouri-garden", name: "Rajouri Garden", lat: 28.649, lng: 77.121 },
  { key: "tilak-nagar", name: "Tilak Nagar", lat: 28.636, lng: 77.096 },
  { key: "peeragarhi", name: "Peeragarhi", lat: 28.672, lng: 77.094 },
  { key: "nangloi", name: "Nangloi", lat: 28.679, lng: 77.067 },
  { key: "mangolpuri", name: "Mangolpuri", lat: 28.693, lng: 77.076 },
  { key: "najafgarh", name: "Najafgarh Terminal", lat: 28.609, lng: 76.986 },
  { key: "dwarka-sec-21", name: "Dwarka Sector 21", lat: 28.552, lng: 77.058 },
  { key: "palam", name: "Palam", lat: 28.589, lng: 77.088 },
  { key: "rohini-west", name: "Rohini West", lat: 28.715, lng: 77.113 },
  { key: "pitampura", name: "Pitampura", lat: 28.703, lng: 77.132 },
  { key: "shalimar-bagh", name: "Shalimar Bagh", lat: 28.716, lng: 77.164 },
  { key: "jahangirpuri", name: "Jahangirpuri", lat: 28.726, lng: 77.163 },
  { key: "burari", name: "Burari", lat: 28.753, lng: 77.199 },
  { key: "narela", name: "Narela Terminal", lat: 28.856, lng: 77.092 },
  { key: "bawana", name: "Bawana", lat: 28.799, lng: 77.033 },
  { key: "karawal-nagar", name: "Karawal Nagar", lat: 28.727, lng: 77.276 },
  { key: "bhajanpura", name: "Bhajanpura", lat: 28.7, lng: 77.258 },
  { key: "seelampur", name: "Seelampur", lat: 28.67, lng: 77.267 },
  { key: "dilshad-garden", name: "Dilshad Garden", lat: 28.686, lng: 77.321 },
];

export const HUB_BY_KEY = new Map(BUS_HUBS.map((h) => [h.key, h]));
