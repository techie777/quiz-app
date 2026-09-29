// src/lib/gkData.js
import crypto from "crypto";

export const GK_CATEGORIES = {
  INDIA: "India GK",
  WORLD: "World GK",
};

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard", "expert"];

export const DIFFICULTY_CONFIG = {
  easy: {
    key: "easy",
    label: "Easy",
    labelHi: "सरल",
    color: "#16A34A",
    bg: "#DCFCE7",
    border: "#86EFAC",
  },
  medium: {
    key: "medium",
    label: "Medium",
    labelHi: "मध्यम",
    color: "#D97706",
    bg: "#FEF3C7",
    border: "#FDE68A",
  },
  hard: {
    key: "hard",
    label: "Hard",
    labelHi: "कठिन",
    color: "#DC2626",
    bg: "#FEE2E2",
    border: "#FCA5A5",
  },
  expert: {
    key: "expert",
    label: "Expert",
    labelHi: "विशेषज्ञ",
    color: "#7C3AED",
    bg: "#EDE9FE",
    border: "#C4B5FD",
  },
};

/**
 * Normalizes question text and language to produce SHA-1 hash for duplicate detection
 */
export function calculateQuestionHash(text, language = "en") {
  const normalizedText = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s\u0900-\u097F]/g, ""); // Keep alphanumeric & Devanagari
  const lang = String(language || "en").trim().toLowerCase().slice(0, 2);
  return crypto.createHash("sha1").update(`${normalizedText}:::${lang}`).digest("hex");
}

/**
 * Default rules per category and language
 */
export const DEFAULT_GK_RULES = {
  setSize: 20,
  topicSetMix: {
    easy: 7,
    medium: 7,
    hardExpert: 6, // 6 slots distributed between hard and expert
  },
  ramp: [
    { phase: 1, name: "Warm-up", nameHi: "वार्म-अप", fromPct: 0, toPct: 40, easy: 10, medium: 10, hard: 0, expert: 0 },
    { phase: 2, name: "Rising", nameHi: "प्रगतिशील", fromPct: 40, toPct: 75, easy: 7, medium: 7, hard: 4, expert: 2 },
    { phase: 3, name: "Challenge", nameHi: "चुनौती", fromPct: 75, toPct: 100, easy: 4, medium: 6, hard: 6, expert: 4 },
  ],
  maxPerTopicInMasterSet: 3,
};

/**
 * Curated initial topics for India GK and World GK
 */
export const INITIAL_GK_TOPICS = [
  // India GK Topics
  {
    id: "ancient-india-history",
    category: GK_CATEGORIES.INDIA,
    name: "Ancient Indian History",
    nameHi: "प्राचीन भारत का इतिहास",
    icon: "🏛️",
    tint: "#EEF2FF",
    order: 1,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 1,
  },
  {
    id: "medieval-india-history",
    category: GK_CATEGORIES.INDIA,
    name: "Medieval Indian History",
    nameHi: "मध्यकालीन भारत का इतिहास",
    icon: "⚔️",
    tint: "#FEF3C7",
    order: 2,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 2,
  },
  {
    id: "modern-india-national-movement",
    category: GK_CATEGORIES.INDIA,
    name: "Modern India & Freedom Struggle",
    nameHi: "आधुनिक भारत एवं स्वतंत्रता संग्राम",
    icon: "🇮🇳",
    tint: "#FFE4E6",
    order: 3,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 3,
  },
  {
    id: "indian-polity-constitution",
    category: GK_CATEGORIES.INDIA,
    name: "Indian Polity & Constitution",
    nameHi: "भारतीय राजव्यवस्था एवं संविधान",
    icon: "⚖️",
    tint: "#DCFCE7",
    order: 4,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 4,
  },
  {
    id: "indian-geography",
    category: GK_CATEGORIES.INDIA,
    name: "Indian Physical & River Geography",
    nameHi: "भारत का भूगोल एवं नदियां",
    icon: "🏔️",
    tint: "#E0F2FE",
    order: 5,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 5,
  },
  {
    id: "indian-economy",
    category: GK_CATEGORIES.INDIA,
    name: "Indian Economy & Budget",
    nameHi: "भारतीय अर्थव्यवस्था एवं बजट",
    icon: "📈",
    tint: "#F3E8FF",
    order: 6,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 6,
  },
  {
    id: "art-culture-heritage-india",
    category: GK_CATEGORIES.INDIA,
    name: "Indian Art, Culture & Dances",
    nameHi: "भारतीय कला, संस्कृति व नृत्य",
    icon: "🪕",
    tint: "#FCE7F3",
    order: 7,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 7,
  },
  {
    id: "science-technology-india",
    category: GK_CATEGORIES.INDIA,
    name: "Science, ISRO & Defence Tech",
    nameHi: "विज्ञान, इसरो एवं रक्षा तकनीक",
    icon: "🚀",
    tint: "#EEF2FF",
    order: 8,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 8,
  },

  // World GK Topics
  {
    id: "world-history-civilizations",
    category: GK_CATEGORIES.WORLD,
    name: "World History & Civilizations",
    nameHi: "विश्व इतिहास एवं प्राचीन सभ्यताएं",
    icon: "🌍",
    tint: "#FEF3C7",
    order: 1,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 1,
  },
  {
    id: "world-physical-geography",
    category: GK_CATEGORIES.WORLD,
    name: "World Physical Geography & Oceans",
    nameHi: "विश्व भूगोल, महाद्वीप एवं महासागर",
    icon: "🌊",
    tint: "#E0F2FE",
    order: 2,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 2,
  },
  {
    id: "international-organizations",
    category: GK_CATEGORIES.WORLD,
    name: "UN & International Organizations",
    nameHi: "संयुक्त राष्ट्र व अंतर्राष्ट्रीय संगठन",
    icon: "🌐",
    tint: "#DCFCE7",
    order: 3,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 3,
  },
  {
    id: "global-capitals-currencies",
    category: GK_CATEGORIES.WORLD,
    name: "World Capitals & Currencies",
    nameHi: "विश्व की राजधानियां एवं मुद्राएं",
    icon: "💵",
    tint: "#F3E8FF",
    order: 4,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 4,
  },
  {
    id: "global-wonders-monuments",
    category: GK_CATEGORIES.WORLD,
    name: "World Wonders & Famous Landmarks",
    nameHi: "विश्व के आश्चर्य व प्रसिद्ध स्मारक",
    icon: "🗼",
    tint: "#FFE4E6",
    order: 5,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 5,
  },
  {
    id: "global-discoveries-inventions",
    category: GK_CATEGORIES.WORLD,
    name: "Famous Inventions & Nobel Laureates",
    nameHi: "महान आविष्कारक व नोबेल पुरस्कार",
    icon: "💡",
    tint: "#EEF2FF",
    order: 6,
    weight: 1,
    active: true,
    showOnHome: true,
    homeOrder: 6,
  },
];
