"use client";

import { createContext, useContext, useEffect, useState } from "react";

// UI-chrome translations. Proper nouns (stations, places, restaurants) stay in
// English — there's no official transliteration dataset and guessing spellings
// would be worse than none. Data-driven strings (verdicts, notes) stay English.

export type Lang = "en" | "hi";

const DICT = {
  en: {
    nav_home: "Home",
    nav_weather: "Weather",
    nav_events: "Events & Food",
    nav_transport: "Transport",
    brand_sub: "Live public data · plan your day around the city",
    head_weather_t: "🌦️ Weather & Air",
    head_weather_s: "Live conditions in Delhi right now, plus how the past week has felt.",
    head_events_t: "🎫 Local Events & Restaurants",
    head_events_s: "Live listings from around the city, and where the locals actually eat.",
    head_transport_t: "🚇 Transport",
    head_transport_s: "Every live bus in the city, and the full metro network at a glance.",
    hero_kicker: "Should I head out right now?",
    plan_title: "Plan Your Visit",
    plan_where: "Where do you want to go?",
    plan_station: "Metro station near you",
    plan_hub: "Bus stop / area near you",
    near_me: "Near me",
    locating: "Locating…",
    share_plan: "Share plan",
    copied: "Copied ✓",
    by_metro_pre: "By metro → get off at ",
    by_metro_post: "",
    by_bus: "By bus — live matches right now",
    events_pre: "Events near ",
    events_post: "",
    events_citywide: "Events around Delhi",
    food_pre: "Famous food near ",
    food_post: "",
    places_h: "Famous places to visit",
    places_hint: "tap a card to plan your visit",
  },
  hi: {
    nav_home: "होम",
    nav_weather: "मौसम",
    nav_events: "इवेंट्स और खाना",
    nav_transport: "परिवहन",
    brand_sub: "लाइव पब्लिक डेटा · शहर घूमने की पूरी प्लानिंग",
    head_weather_t: "🌦️ मौसम और हवा",
    head_weather_s: "दिल्ली का इस वक़्त का हाल, और बीते हफ्ते का ट्रेंड।",
    head_events_t: "🎫 लोकल इवेंट्स और रेस्टोरेंट",
    head_events_s: "शहर में क्या चल रहा है, और खाने की सबसे मशहूर जगहें।",
    head_transport_t: "🚇 परिवहन",
    head_transport_s: "शहर की हर लाइव बस और पूरा मेट्रो नेटवर्क।",
    hero_kicker: "क्या अभी बाहर निकलना ठीक रहेगा?",
    plan_title: "अपनी सैर प्लान करें",
    plan_where: "कहाँ जाना है?",
    plan_station: "आपके पास का मेट्रो स्टेशन",
    plan_hub: "आपके पास का बस स्टॉप / इलाक़ा",
    near_me: "मेरे पास",
    locating: "ढूँढ रहे हैं…",
    share_plan: "प्लान शेयर करें",
    copied: "कॉपी हो गया ✓",
    by_metro_pre: "मेट्रो से → ",
    by_metro_post: " पर उतरें",
    by_bus: "बस से — अभी लाइव मैच",
    events_pre: "",
    events_post: " के पास इवेंट्स",
    events_citywide: "दिल्ली भर के इवेंट्स",
    food_pre: "",
    food_post: " के पास मशहूर खाना",
    places_h: "घूमने की मशहूर जगहें",
    places_hint: "प्लान करने के लिए किसी कार्ड पर टैप करें",
  },
} as const;

export type TKey = keyof (typeof DICT)["en"];

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
} | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "hi" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const t = (k: TKey) => DICT[lang][k] ?? DICT.en[k];

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}
