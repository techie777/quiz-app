"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import CategoryCard from "./CategoryCard";
import ArenaPromptCard from "@/components/ArenaPromptCard";
import HotQuizzesRow from "@/components/explorer/HotQuizzesRow";
import MyBooksHomeSection from "./MyBooksHomeSection";
import { MAIN_CATEGORIES } from "@/lib/mainCategoriesConfig";
import {
  getCategoryGroup,
  getCategoryCardImageUrl,
  SLUG_ALIASES,
} from "@/lib/categoryCardImages";

const FILTER_CHIPS = [
  { id: "all", label: "All", labelHi: "सभी" },
  { id: "core", label: "⭐ Popular", labelHi: "⭐ लोकप्रिय" },
  { id: "india", label: "India", labelHi: "भारत" },
  { id: "learn", label: "Learn", labelHi: "ज्ञान" },
  { id: "fun", label: "Fun", labelHi: "मनोरंजन" },
  { id: "world", label: "World", labelHi: "दुनिया" },
];

// Curated live configuration and fallback topics matching QuizWeb – Redesigned Home & active DB content
const KNOWN_LIVE_CONFIG = {
  "india-gk": { status: "live", topics_count: 100 },
  "world-gk": { status: "live", topics_count: 25 },
  "india-history": { status: "live", topics_count: 30 },
  "india-geography": { status: "live", topics_count: 30 },
  "india-sports": { status: "live", topics_count: 20 },
  "sports": { status: "live", topics_count: 20 },
  "technology": { status: "live", topics_count: 25 },
  "science--discovery": { status: "live", topics_count: 50 },
  "science": { status: "live", topics_count: 50 },
  "entertainment": { status: "live", topics_count: 20 },
  "economy--others": { status: "live", topics_count: 20 },
  "economy-others": { status: "live", topics_count: 20 },
  "biology-gk-1": { status: "live", topics_count: 20 },
  "biology-gk": { status: "live", topics_count: 20 },
  "nature-animals": { status: "live", topics_count: 30 },
  "nature-wonders": { status: "live", topics_count: 30 },
  "animals-nature": { status: "live", topics_count: 30 },
  "india-culture": { status: "live", topics_count: 10 },
  "indian-culture": { status: "live", topics_count: 10 },
  "india-polity": { status: "live", topics_count: 20 },
  "politics-government": { status: "live", topics_count: 20 },
  "others": { status: "live", topics_count: 39 },
  "religion-spirituality": { status: "live", topics_count: 40 },
  "general-knowledge": { status: "live", topics_count: 40 },
  "current-affairs": { status: "live", topics_count: 30 },
  "indian-cities": { status: "live", topics_count: 10 },
  "indian-states-uts": { status: "live", topics_count: 75 },
  "history": { status: "live", topics_count: 30 },
  "business-economy": { status: "live", topics_count: 20 },
  "famous-people": { status: "live", topics_count: 20 },
  "brands-companies": { status: "live", topics_count: 15 },
  "lifestyle-everyday-knowledge": { status: "live", topics_count: 15 },
};

export const OTHERS_QUIZZES_LIST = [
  {
    id: "others-food-spices",
    slug: "others-food-spices",
    href: "/category/others?topic=Food%20%26%20Spices",
    name: "Food & Spices",
    nameHi: "भारतीय खानपान व मसाले",
    icon: "🍲",
    emoji: "🍲",
    description: "Indian Spices, Culinary Traditions & Regional Cuisines",
    descriptionHi: "भारतीय मसाले, पारंपरिक व्यंजन, क्षेत्रीय स्वाद और खानपान का रोचक इतिहास।",
    questionCount: 225,
    status: "live",
    image_url: "/cards/food.webp",
  },
  {
    id: "others-indian-railway",
    slug: "others-indian-railway",
    href: "/category/others?topic=Indian%20Railway",
    name: "Indian Railway",
    nameHi: "भारतीय रेलवे",
    icon: "🚆",
    emoji: "🚆",
    description: "History, Trains, Routes & Achievements of Indian Railways",
    descriptionHi: "भारतीय रेल का इतिहास, सबसे तेज़ ट्रेनें, प्रमुख रूट, ज़ोन और तकनीकी उपलब्धियां।",
    questionCount: 20,
    status: "live",
    image_url: "/cards/indian-railway.webp",
  },
  {
    id: "others-currency-language",
    slug: "others-currency-language",
    href: "/category/others?topic=Currency%20%26%20Language",
    name: "Currency & Language",
    nameHi: "मुद्रा व भाषाएं",
    icon: "🪙",
    emoji: "🪙",
    description: "Indian Rupee, Currency Notes, Official Languages & Scripts",
    descriptionHi: "भारतीय रुपया, नोटों के प्रतीक, आधिकारिक भाषाएं, लिपियां और भाषाई विविधता।",
    questionCount: 20,
    status: "live",
    image_url: "/cards/currency-language.webp",
  },
  {
    id: "others-unique-village",
    slug: "others-unique-village",
    href: "/category/others?topic=Unique%20Village",
    name: "Unique Village",
    nameHi: "अनोखे गांव",
    icon: "🏡",
    emoji: "🏡",
    description: "Extraordinary Villages of India & Unique Traditions",
    descriptionHi: "भारत के अद्भुत और अनोखे गांव—एशिया का सबसे स्वच्छ गांव, करोड़पतियों का गांव और अनूठी परंपराएं।",
    questionCount: 20,
    status: "live",
    image_url: "/cards/unique-village.webp",
  },
  {
    id: "others-post-office-records",
    slug: "others-post-office-records",
    href: "/category/others?topic=Post%20Office%20%26%20Records",
    name: "Post Office & Records",
    nameHi: "डाकघर व रिकॉर्ड",
    icon: "📮",
    emoji: "📮",
    description: "World's Highest Post Office, Floating Post Office & National Records",
    descriptionHi: "फ्लोटिंग पोस्ट ऑफिस, दुनिया का सबसे ऊंचा डाकघर और भारत के अनोखे राष्ट्रीय रिकॉर्ड।",
    questionCount: 20,
    status: "live",
    image_url: "/cards/general-knowledge.webp",
  },
  {
    id: "others-flag-rules",
    slug: "others-flag-rules",
    href: "/category/others?topic=Flag%20%26%20Rules",
    name: "Flag & Rules",
    nameHi: "तिरंगा व नियम",
    icon: "🇮🇳",
    emoji: "🇮🇳",
    description: "National Flag History, Flag Code, Rules & Protocols",
    descriptionHi: "राष्ट्रीय ध्वज तिरंगा का इतिहास, ध्वज संहिता, नियम, प्रतीक और प्रोटोकॉल।",
    questionCount: 20,
    status: "live",
    image_url: "/cards/india-gk.webp",
  },
  {
    id: "others-festivals-traditions",
    slug: "others-festivals-traditions",
    href: "/category/others?topic=Festivals%20%26%20Traditions",
    name: "Festivals & Traditions",
    nameHi: "त्योहार व परंपराएं",
    icon: "🪔",
    emoji: "🪔",
    description: "Major Festivals, Folk Celebrations & Timeless Traditions",
    descriptionHi: "भारत के प्रमुख पर्व, अनूठी लोक परंपराएं, मेले और सांस्कृतिक उत्सव।",
    questionCount: 20,
    status: "live",
    image_url: "/cards/religion.webp",
  },
  {
    id: "others-music-instruments",
    slug: "others-music-instruments",
    href: "/category/others?topic=Music%20%26%20Instruments",
    name: "Music & Instruments",
    nameHi: "संगीत व वाद्य यंत्र",
    icon: "🎵",
    emoji: "🎵",
    description: "Classical Instruments, Maestros & Musical Heritage",
    descriptionHi: "भारतीय शास्त्रीय संगीत, पारंपरिक वाद्य यंत्र (सितार, तबला, शहनाई) और संगीतकार।",
    questionCount: 20,
    status: "live",
    image_url: "/cards/music.webp",
  },
  {
    id: "others-brain-fun",
    slug: "others-brain-fun",
    href: "/category/others?topic=Brain%20%26%20Fun",
    name: "Brain & Fun",
    nameHi: "दिमागी पहेलियां",
    icon: "🧠",
    emoji: "🧠",
    description: "Mind Benders, Logic Riddles & Fun Trivia",
    descriptionHi: "मजेदार पहेलियां, तार्किक सवाल और दिमाग की कसरत कराने वाले रोचक क्विज़।",
    questionCount: 200,
    status: "live",
    image_url: "/cards/brain-riddles.webp",
  },
  {
    id: "others-amazing-facts",
    slug: "others-amazing-facts",
    href: "/category/others?topic=Amazing%20%26%20Curious%20Facts",
    name: "Amazing & Curious Facts",
    nameHi: "अद्भुत व रोचक तथ्य",
    icon: "✨",
    emoji: "✨",
    description: "Astonishing Curiosities & Mind-Blowing Facts of India",
    descriptionHi: "भारत और दुनिया के ऐसे रहस्यमयी और अजब-गजब तथ्य जो आपको हैरान कर देंगे।",
    questionCount: 202,
    status: "live",
    image_url: "/cards/amazing-facts.webp",
  },
];

export default function ExplorerHomeSection({
  dbCategories = [],
  dataLoaded = true,
  isHindi = false,
}) {
  const [selectedChip, setSelectedChip] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [localCategories, setLocalCategories] = useState(
    Array.isArray(dbCategories) && dbCategories.length > 0 ? dbCategories : []
  );

  // Sync when prop updates
  useEffect(() => {
    if (Array.isArray(dbCategories) && dbCategories.length > 0) {
      setLocalCategories(dbCategories);
    }
  }, [dbCategories]);

  // Proactive client-side fallback fetch if initial props were empty
  useEffect(() => {
    if (localCategories.length === 0) {
      let isMounted = true;
      fetch("/api/categories")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isMounted || !data) return;
          const items = Array.isArray(data)
            ? data
            : Array.isArray(data.categories)
            ? data.categories
            : [];
          if (items.length > 0) {
            setLocalCategories(items);
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [localCategories.length]);

  // Build dual-indexed map for direct slug and short alias lookups
  const dbCategoryMap = useMemo(() => {
    const map = new Map();
    const sourceList =
      localCategories.length > 0 ? localCategories : dbCategories || [];
    if (Array.isArray(sourceList)) {
      sourceList.forEach((c) => {
        if (c.slug) {
          const s = c.slug.toLowerCase().trim();
          map.set(s, c);
        }
      });
    }
    return map;
  }, [localCategories, dbCategories]);

  // Merge canonical 40 main categories with live DB status, counts, and images
  const allCategories = useMemo(() => {
    return MAIN_CATEGORIES.map((mainCat) => {
      const slug = mainCat.slug.toLowerCase().trim();
      const alias = (SLUG_ALIASES && SLUG_ALIASES[slug]) || null;
      const dbCat =
        dbCategoryMap.get(slug) ||
        (alias ? dbCategoryMap.get(alias) : null);

      const liveCfg =
        KNOWN_LIVE_CONFIG[slug] ||
        (alias ? KNOWN_LIVE_CONFIG[alias] : null);

      const qCount = dbCat
        ? dbCat.questionCount ??
          dbCat._count?.questions ??
          (Array.isArray(dbCat.questions) ? dbCat.questions.length : 0)
        : 0;

      // Group: from DB or category groups mapping
      const group = dbCat?.group || getCategoryGroup(slug);

      // Status: live if explicitly in DB, has questions, or in live config
      let status = dbCat?.status;
      if (!status || status === "coming_soon") {
        if (qCount > 0 || liveCfg?.status === "live") {
          status = "live";
        } else {
          status = "coming_soon";
        }
      }

      // Sort order
      const sortOrder =
        dbCat?.sort_order ?? dbCat?.sortOrder ?? mainCat.id ?? 0;

      // Image URL
      const imageUrl =
        dbCat?.image_url ||
        dbCat?.imageUrl ||
        getCategoryCardImageUrl({ slug, image: dbCat?.image });

      // Topics count: DB computed or question sets
      let topicsCount = dbCat?.topics_count ?? 0;
      if (!topicsCount && qCount > 0) {
        topicsCount = Math.max(1, Math.min(100, Math.ceil(qCount / 10) * 10));
      }

      return {
        id: dbCat?.id || mainCat.id,
        slug: mainCat.slug,
        name: mainCat.name,
        nameHi: mainCat.nameHi,
        topic: mainCat.name,
        topicHi: mainCat.nameHi,
        icon: mainCat.icon,
        emoji: mainCat.icon,
        example: mainCat.example,
        description: mainCat.description,
        descriptionHi: mainCat.descriptionHi,
        group,
        status,
        sort_order: sortOrder,
        image_url: imageUrl,
        questionCount: qCount,
        topics_count: topicsCount,
      };
    });
  }, [dbCategoryMap]);

  // Filter categories by chip and search query
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allCategories.filter((cat) => {
      // Chip match
      const chipMatch = selectedChip === "all" || cat.group === selectedChip;
      if (!chipMatch) return false;

      // Search match: English title, Hindi title, and subtitle/example
      if (!q) return true;
      const enMatch = (cat.name || "").toLowerCase().includes(q);
      const hiMatch = (cat.nameHi || "").toLowerCase().includes(q);
      const subMatch =
        (cat.example || "").toLowerCase().includes(q) ||
        (cat.description || "").toLowerCase().includes(q);
      return enMatch || hiMatch || subMatch;
    });
  }, [allCategories, selectedChip, searchQuery]);

  // Split into Live and Coming Soon
  const liveCategories = useMemo(() => {
    return filteredCategories.filter(
      (c) => c.status === "live" || c.questionCount > 0
    );
  }, [filteredCategories]);

  const soonCategories = useMemo(() => {
    return filteredCategories.filter(
      (c) => !(c.status === "live" || c.questionCount > 0)
    );
  }, [filteredCategories]);

  const othersQuizzes = useMemo(() => {
    if (selectedChip !== "all" && selectedChip !== "india" && selectedChip !== "fun") {
      return [];
    }
    return OTHERS_QUIZZES_LIST;
  }, [selectedChip]);

  const hasResults = liveCategories.length > 0 || soonCategories.length > 0 || othersQuizzes.length > 0;

  return (
    <div className="w-full max-w-[1100px] mx-auto px-1 sm:px-2 pb-24 sm:pb-28">
      {/* 1. Greeting + Title */}
      <header className="pt-2 sm:pt-4 pb-2 text-left">
        <small
          className="block text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400"
        >
          {isHindi ? "नमस्ते 👋" : "Namaste 👋"}
        </small>
        <h1
          className="text-xl sm:text-2xl font-extrabold leading-tight mt-0.5 text-slate-900 dark:text-white"
        >
          {isHindi ? (
            "आज आप क्या खेलना चाहेंगे?"
          ) : (
            <>
              What do you want to
              <br />
              play today?
            </>
          )}
        </h1>
      </header>

      {/* 2. Instant Search Bar (Sticky with Glassmorphism) */}
      <div
        className="sticky top-[52px] sm:top-[56px] z-30 py-2.5 backdrop-blur-md transition-all -mx-2 px-2 border-b border-slate-200/70 dark:border-slate-800/70 bg-[#f6f7fc]/90 dark:bg-[#090e20]/90"
      >
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#0f1424] border border-slate-200/90 dark:border-slate-800/80 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/25 focus-within:border-indigo-500 transition-all"
        >
          <Search
            size={18}
            className="text-slate-400 dark:text-slate-500 shrink-0"
          />
          <input
            id="q"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isHindi
                ? "40+ क्विज़ श्रेणियां खोजें..."
                : "Search 40+ quiz categories"
            }
            className="w-full bg-transparent border-0 outline-none text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="text-xs px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Filter Chips with Mobile Scroll Fade Indicator */}
      <div className="relative mb-3.5">
        <div
          className="chips-wrapper flex gap-2 overflow-x-auto py-2 no-scrollbar -mx-1 px-1"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {FILTER_CHIPS.map((chip) => {
            const isActive = selectedChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedChip(chip.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25 border border-indigo-600"
                    : "bg-white dark:bg-[#0f1424] text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs"
                }`}
              >
                {isHindi ? chip.labelHi : chip.label}
              </button>
            );
          })}
        </div>
        {/* Subtle right fade hint for horizontal scroll */}
        <div
          className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-[#f6f7fc] dark:from-[#090e20] to-transparent sm:hidden"
          aria-hidden="true"
        />
      </div>

      {/* ── CONDITIONAL RENDER: DEDICATED FILTER SCREEN vs MAIN HOME CONTENT ── */}
      {searchQuery.trim().length > 0 ? (
        <section className="py-2 animate-fadeIn">
          {/* Header Bar: Back to Home + Result Counter */}
          <div 
            className="flex items-center justify-between gap-3 mb-4 p-3 rounded-2xl bg-white dark:bg-[#0f1424] border border-slate-200/90 dark:border-slate-800 shadow-xs"
          >
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 transition-all active:scale-95"
            >
              ← {isHindi ? "होम पर लौटें" : "Back to Home"}
            </button>
            <div className="text-right">
              <span className="text-xs font-bold block text-slate-400 dark:text-slate-500">
                {isHindi ? "फ़िल्टर परिणाम" : "Filter Screen"}
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {filteredCategories.length} {isHindi ? "श्रेणियां मिलीं" : "categories found"}
              </span>
            </div>
          </div>

          {/* Filtered Results Grid */}
          {filteredCategories.length > 0 ? (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5"
            >
              {filteredCategories.map((category) => (
                <CategoryCard
                  key={category.slug}
                  category={category}
                  isHindi={isHindi}
                />
              ))}
            </div>
          ) : (
            <div
              className="py-16 text-center rounded-3xl p-6 bg-white dark:bg-[#0f1424] border border-slate-200/90 dark:border-slate-800"
            >
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">
                {isHindi ? "कोई परिणाम नहीं मिला" : "No matching categories found"}
              </h3>
              <p className="text-xs mb-4 text-slate-500 dark:text-slate-400">
                {isHindi
                  ? `"${searchQuery}" के लिए कोई श्रेणी नहीं मिली। लोकप्रिय विषय चुनें:`
                  : `No categories match "${searchQuery}". Try popular topics:`}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["India GK", "India Sports", "Science", "History", "Cities"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* 4. Action Strip: Daily Quiz + Arena Prompt Card Consolidated in 2-Col Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Daily Quiz Hero Banner */}
            <div
              className="hero-daily-banner flex justify-between items-center p-4 rounded-2xl text-white relative overflow-hidden shadow-md shadow-indigo-600/15"
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #7c5cff 100%)",
              }}
            >
              <div>
                <b className="text-base sm:text-lg font-bold block leading-tight">
                  ⚡ {isHindi ? "दैनिक क्विज़" : "Daily Quiz"}
                </b>
                <p className="text-xs opacity-90 mt-0.5">
                  {isHindi ? "10 प्रश्न · 3 मिनट · स्ट्रीक बढ़ाएं" : "10 questions · 3 mins"}
                </p>
              </div>
              <Link
                href="/daily-quiz"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all shadow-sm shrink-0 whitespace-nowrap"
              >
                {isHindi ? "अभी खेलें" : "Play now"}
              </Link>
            </div>

            {/* Quiz Arena compact card for Explorer */}
            <ArenaPromptCard audience="explorer" className="mb-0 h-full flex items-center" />
          </div>

          {/* Hot Quizzes Row */}
          <div className="mb-4">
            <HotQuizzesRow />
          </div>

          {/* 5. Play now Section: Live categories first (Immediate Access!) */}
          {liveCategories.length > 0 && (
            <section className="mb-6">
              <h2
                className="flex items-center justify-between text-sm sm:text-base font-bold my-2 px-1 text-slate-900 dark:text-white"
              >
                <span className="flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>{isHindi ? "अभी खेलें (लाइव श्रेणियां)" : "Play now"}</span>
                </span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  {liveCategories.length} {isHindi ? "लाइव" : "live"}
                </span>
              </h2>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5"
              >
                {liveCategories.map((category) => (
                  <CategoryCard
                    key={category.slug}
                    category={category}
                    isHindi={isHindi}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 📚 My Books Section: India GK + Upcoming MP GK / UP GK */}
          <div className="my-6">
            <MyBooksHomeSection isHindi={isHindi} />
          </div>

          {/* 5.5. Others Quizzes Section: Quizzes from India > GK > Others */}
          {othersQuizzes.length > 0 && (
            <section className="mb-6">
              <h2
                className="flex items-center justify-between text-sm sm:text-base font-bold my-2 px-1 text-slate-900 dark:text-white"
              >
                <span className="flex items-center gap-1.5">
                  <span>📦</span>
                  <span>{isHindi ? "अन्य (Others) क्विज़" : "Others Quizzes"}</span>
                </span>
                <span
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400"
                >
                  {othersQuizzes.length} {isHindi ? "क्विज़" : "quizzes"}
                </span>
              </h2>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5"
              >
                {othersQuizzes.map((quizItem) => (
                  <CategoryCard
                    key={quizItem.id || quizItem.slug}
                    category={quizItem}
                    isHindi={isHindi}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 6. Coming soon Section: Clean collapsible accordion */}
          {soonCategories.length > 0 && (
            <section className="mb-8 pt-2">
              <div 
                className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0f1424]/60 backdrop-blur-xs"
              >
                <button
                  type="button"
                  onClick={() => setShowComingSoon((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-sm">
                      ⏳
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{isHindi ? "आगामी श्रेणियां (जल्द आ रही हैं)" : "Upcoming Categories (Coming Soon)"}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {soonCategories.length}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isHindi
                          ? "इन विषयों के प्रश्न तैयार किए जा रहे हैं। टैप करके देखें।"
                          : "Curated questions being prepared for these topics."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 transition-colors shrink-0">
                    <span>{showComingSoon ? (isHindi ? "छुपाएं ▲" : "Hide ▲") : (isHindi ? "देखें ▼" : "View ▼")}</span>
                  </div>
                </button>

                {showComingSoon && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5 mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                    {soonCategories.map((category) => (
                      <CategoryCard
                        key={category.slug}
                        category={category}
                        isHindi={isHindi}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
