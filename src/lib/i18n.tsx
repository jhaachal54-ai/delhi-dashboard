"use client";

import { createContext, useContext, useEffect, useState } from "react";

// UI-chrome translations. Proper nouns (stations, places, restaurants) stay in
// English — there's no official transliteration dataset and guessing spellings
// would be worse than none. Data-driven strings (verdicts, notes) stay English.

export type Lang = "en" | "hi";

const DICT = {
  en: {
    nav_about: "About",
    nav_home: "Home",
    nav_weather: "Weather",
    nav_events: "Events & Food",
    nav_transport: "Transport",
    brand_sub: "NCR · Events · Transit · Rain · Air — the city, live",
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
    plan_station_ph: "Type to search 262 stations…",
    plan_hub: "Bus stop / area near you",
    usual_route: "Your usual route",
    recent_label: "Recent:",
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
    about_tag: "Sanskrit for “the eye”",
    about_lead:
      "Delhi is loud, vast and always moving — smog one hour, a downpour the next, a concert across town and 5,000 buses in between. NETRA is a single, unblinking eye on all of it: live public data, read continuously, explained honestly.",
    about_cta: "Open the dashboard →",
    about_live_h: "Right now, through the eye",
    about_stat_buses: "buses live on the map",
    about_stat_aqi: "current US AQI",
    about_stat_events: "events listed",
    about_stat_temp: "feels like right now",
    about_why_h: "Why “NETRA”?",
    about_why_p:
      "In Sanskrit, नेत्र (netra) means the eye — the organ of seeing, but also of understanding. Indian tradition speaks of a third eye that perceives what ordinary sight cannot; this site aspires to something humbler but similar: seeing through Delhi’s haze, noise and traffic to what the city is actually doing right now. And the name earns its keep twice, because each letter stands for what the eye watches:",
    about_l1_w: "NCR",
    about_l1_b: "Delhi and the whole capital region — Noida, Gurugram, Ghaziabad, Faridabad",
    about_l2_w: "Events",
    about_l2_b: "Live listings, concerts, comedy and exhibitions, plus where the locals eat",
    about_l3_w: "Transit",
    about_l3_b: "Every DTC bus on a live map, and a metro planner across 262 stations",
    about_l4_w: "Rain",
    about_l4_b: "Hour-by-hour weather and a 7-day trend, region by region across the NCR",
    about_l5_w: "Air",
    about_l5_b: "Real-time AQI with a 24-hour forecast and the best time to step outside",
    about_what_h: "What NETRA does",
    about_what_p:
      "Everything below runs on live public data — the same feeds the city itself publishes — polled continuously and shown the moment it changes.",
    about_f1_t: "Should I head out?",
    about_f1_b:
      "One honest number, 0 to 100, blending air quality, heat, rain and what's on tonight — with a plain-language verdict and the best hour to step out.",
    about_f2_t: "Plan your visit",
    about_f2_b:
      "Pick a place — India Gate to Kingdom of Dreams — and your nearest station. NETRA plots the metro route with interchanges, time and fare, matches live buses near you, and suggests events and famous food nearby.",
    about_f3_t: "Every bus, live",
    about_f3_b:
      "Thousands of DTC and DIMTS buses stream their GPS onto a radar-style map of the city. Click any bus to see its painted number, full route and fare.",
    about_f4_t: "The full metro",
    about_f4_b:
      "All 11 lines — DMRC, Aqua and Rapid Metro — with first and last trains, every stop as a DMRC-style timeline, and an interactive network map.",
    about_f5_t: "Air you can act on",
    about_f5_b:
      "Not just today's AQI: a 24-hour pollutant forecast, region-wise readings from 12 points across the NCR, and a 7-day trend of how the week felt.",
    about_f6_t: "Events & food",
    about_f6_b:
      "What's actually happening this week, filterable by genre and date, with one-tap calendar files — beside a curated map of Delhi's genuinely famous eateries.",
    about_honest_h: "Honest about messy data",
    about_honest_p:
      "Real city data is imperfect: GPS fixes go stale, coordinates land in the wrong state, and free APIs run out of quota. NETRA never hides that. Stale buses are dimmed rather than deleted, every panel is labelled live or sample, and when a feed is down you're told exactly what you're looking at. Data comes from Delhi Open Transit Data (bus GPS), the official DMRC timetables (metro), Open-Meteo (weather and air quality) and Google Events — with photos from Wikimedia Commons.",
  },
  hi: {
    nav_about: "परिचय",
    nav_home: "होम",
    nav_weather: "मौसम",
    nav_events: "इवेंट्स और खाना",
    nav_transport: "परिवहन",
    brand_sub: "नेत्र — इवेंट्स · ट्रांज़िट · बारिश · हवा, पूरा एनसीआर लाइव",
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
    plan_station_ph: "262 स्टेशनों में खोजें…",
    plan_hub: "आपके पास का बस स्टॉप / इलाक़ा",
    usual_route: "आपका आम रास्ता",
    recent_label: "हाल के:",
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
    about_tag: "संस्कृत में — “आँख”",
    about_lead:
      "दिल्ली शोर-भरी, विशाल और हर पल बदलती रहती है — एक घंटे स्मॉग, अगले ही पल बारिश, शहर के दूसरे छोर पर कोई कॉन्सर्ट और बीच में 5,000 बसें। NETRA इस सब पर एक अपलक नज़र है: लाइव पब्लिक डेटा, लगातार पढ़ा हुआ, ईमानदारी से समझाया हुआ।",
    about_cta: "डैशबोर्ड खोलें →",
    about_live_h: "इस वक़्त, नेत्र की नज़र से",
    about_stat_buses: "बसें मैप पर लाइव",
    about_stat_aqi: "अभी का US AQI",
    about_stat_events: "इवेंट्स लिस्ट में",
    about_stat_temp: "अभी महसूस हो रहा",
    about_why_h: "“NETRA” ही क्यों?",
    about_why_p:
      "संस्कृत में नेत्र का अर्थ है आँख — देखने का अंग, पर समझने का भी। भारतीय परंपरा तीसरे नेत्र की बात करती है जो वह देख लेता है जो साधारण दृष्टि नहीं देख पाती; यह साइट उससे विनम्र मगर मिलती-जुलती कोशिश है: दिल्ली की धुंध, शोर और ट्रैफ़िक के पार देखना कि शहर इस वक़्त असल में क्या कर रहा है। और यह नाम दोहरा काम करता है, क्योंकि हर अक्षर बताता है कि यह आँख किस पर नज़र रखती है:",
    about_l1_w: "NCR",
    about_l1_b: "दिल्ली और पूरा राजधानी क्षेत्र — नोएडा, गुरुग्राम, ग़ाज़ियाबाद, फ़रीदाबाद",
    about_l2_w: "इवेंट्स",
    about_l2_b: "लाइव लिस्टिंग, कॉन्सर्ट, कॉमेडी और प्रदर्शनियाँ — और लोकल लोग कहाँ खाते हैं",
    about_l3_w: "ट्रांज़िट",
    about_l3_b: "हर DTC बस लाइव मैप पर, और 262 स्टेशनों का मेट्रो प्लानर",
    about_l4_w: "बारिश",
    about_l4_b: "घंटे-दर-घंटे मौसम और 7 दिन का ट्रेंड, NCR के हर इलाक़े का",
    about_l5_w: "हवा",
    about_l5_b: "रियल-टाइम AQI, 24 घंटे का पूर्वानुमान और बाहर निकलने का सबसे सही वक़्त",
    about_what_h: "NETRA क्या करता है",
    about_what_p:
      "नीचे सब कुछ लाइव पब्लिक डेटा पर चलता है — वही फ़ीड जो शहर खुद जारी करता है — लगातार पोल होता हुआ, बदलते ही दिखता हुआ।",
    about_f1_t: "क्या अभी बाहर निकलूँ?",
    about_f1_b:
      "0 से 100 का एक ईमानदार स्कोर — हवा, गर्मी, बारिश और आज रात के इवेंट्स को मिलाकर — साफ़ शब्दों में फ़ैसला और निकलने का सबसे अच्छा घंटा।",
    about_f2_t: "अपनी सैर प्लान करें",
    about_f2_b:
      "कोई जगह चुनिए — इंडिया गेट से किंगडम ऑफ़ ड्रीम्स तक — और अपना नज़दीकी स्टेशन। NETRA इंटरचेंज, समय और किराए के साथ मेट्रो रूट बनाता है, आपके पास की लाइव बसें मिलाता है, और आस-पास के इवेंट्स व मशहूर खाना सुझाता है।",
    about_f3_t: "हर बस, लाइव",
    about_f3_b:
      "हज़ारों DTC और DIMTS बसें अपना GPS शहर के रडार-स्टाइल मैप पर भेजती हैं। किसी भी बस पर क्लिक कर उसका नंबर, पूरा रूट और किराया देखिए।",
    about_f4_t: "पूरी मेट्रो",
    about_f4_b:
      "सभी 11 लाइनें — DMRC, एक्वा और रैपिड मेट्रो — पहली-आख़िरी ट्रेन, हर स्टॉप DMRC-स्टाइल टाइमलाइन में, और इंटरैक्टिव नेटवर्क मैप।",
    about_f5_t: "हवा, जिस पर अमल हो सके",
    about_f5_b:
      "सिर्फ़ आज का AQI नहीं: 24 घंटे का पूर्वानुमान, NCR के 12 इलाक़ों की रीडिंग, और हफ्ते का 7-दिन का ट्रेंड।",
    about_f6_t: "इवेंट्स और खाना",
    about_f6_b:
      "इस हफ्ते असल में क्या हो रहा है — शैली और तारीख़ से फ़िल्टर, एक टैप में कैलेंडर फ़ाइल — साथ में दिल्ली के सचमुच मशहूर ठिकानों की क्यूरेटेड लिस्ट।",
    about_honest_h: "गड़बड़ डेटा के बारे में ईमानदार",
    about_honest_p:
      "असली शहर का डेटा अधूरा होता है: GPS फ़िक्स पुराने पड़ जाते हैं, कोऑर्डिनेट ग़लत जगह गिरते हैं, और मुफ़्त API का कोटा ख़त्म हो जाता है। NETRA यह कभी नहीं छिपाता। पुरानी बसें हटाई नहीं जातीं बल्कि धुंधली दिखती हैं, हर पैनल पर लाइव या सैंपल का लेबल है, और फ़ीड बंद हो तो साफ़ बताया जाता है कि आप क्या देख रहे हैं। डेटा: Delhi Open Transit Data (बस GPS), DMRC की आधिकारिक समय-सारणी (मेट्रो), Open-Meteo (मौसम और हवा) और Google Events — तस्वीरें Wikimedia Commons से।",
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
