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
  "general-knowledge": { status: "live", topics_count: 40 },
  "current-affairs": { status: "live", topics_count: 30 },
  "indian-cities": { status: "live", topics_count: 10 },
  "indian-states-uts": { status: "live", topics_count: 75 },
  "religion-spirituality": { status: "live", topics_count: 40 },
  "entertainment": { status: "live", topics_count: 20 },
  "sports": { status: "live", topics_count: 20 },
  "science": { status: "live", topics_count: 30 },
  "technology": { status: "live", topics_count: 25 },
  "history": { status: "live", topics_count: 30 },
  "business-economy": { status: "live", topics_count: 20 },
  "politics-government": { status: "live", topics_count: 20 },
  "famous-people": { status: "live", topics_count: 20 },
  "brands-companies": { status: "live", topics_count: 15 },
  "lifestyle-everyday-knowledge": { status: "live", topics_count: 15 },
};

export default function ExplorerHomeSection({
  dbCategories = [],
  dataLoaded = true,
  isHindi = false,
}) {
  const [selectedChip, setSelectedChip] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
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

      // Topics count: DB computed, question sets, or live reference topics
      let topicsCount = dbCat?.topics_count || 0;
      if (!topicsCount) {
        if (qCount > 0) {
          topicsCount = Math.max(1, Math.min(100, Math.ceil(qCount / 10) * 10));
        } else if (liveCfg?.topics_count) {
          topicsCount = liveCfg.topics_count;
        } else {
          const configTopicsCount =
            mainCat.subcategories?.reduce(
              (acc, s) => acc + (s.topics?.length || 1),
              0
            ) || 0;
          topicsCount = configTopicsCount;
        }
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

  const hasResults = liveCategories.length > 0 || soonCategories.length > 0;

  return (
    <div className="w-full max-w-[1100px] mx-auto px-1 sm:px-2 pb-16">
      {/* 1. Greeting + Title */}
      <header className="pt-2 sm:pt-4 pb-2 text-left">
        <small
          className="block text-xs sm:text-sm font-medium"
          style={{ color: "var(--mute, #6b7190)" }}
        >
          {isHindi ? "नमस्ते 👋" : "Namaste 👋"}
        </small>
        <h1
          className="text-xl sm:text-2xl font-bold leading-tight mt-0.5"
          style={{ color: "var(--ink, #14162b)" }}
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

      {/* 2. Instant Search Bar (Fixed/Sticky under top header on scroll) */}
      <div
        className="sticky z-40 py-2 backdrop-blur-md transition-all"
        style={{
          top: "56px",
          background: "var(--bg, #f6f7fc)",
          borderBottom: "1px solid var(--line, #e8eaf5)",
          marginLeft: "-6px",
          marginRight: "-6px",
          paddingLeft: "6px",
          paddingRight: "6px",
        }}
      >
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
          style={{
            background: "var(--card, #ffffff)",
            border: "1px solid var(--line, #e8eaf5)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <Search
            size={18}
            style={{ color: "var(--mute, #6b7190)", flexShrink: 0 }}
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
            style={{
              border: 0,
              outline: 0,
              background: "transparent",
              color: "var(--ink, #14162b)",
              fontSize: "14px",
              fontWeight: 500,
              width: "100%",
              fontFamily: "inherit",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                color: "var(--mute, #6b7190)",
                background: "var(--soft, #eef0ff)",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Filter Chips */}
      <div
        className="chips-wrapper flex gap-2 overflow-x-auto py-2 mb-3.5 no-scrollbar"
        style={{
          position: "relative",
          marginRight: "-4px",
          marginLeft: "-4px",
          paddingRight: "4px",
          paddingLeft: "4px",
        }}
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = selectedChip === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setSelectedChip(chip.id)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
              style={{
                borderRadius: "99px",
                padding: "7px 14px",
                fontSize: "12.5px",
                fontWeight: 600,
                background: isActive
                  ? "linear-gradient(135deg, var(--pri, #4f46e5), var(--pri2, #7c5cff))"
                  : "var(--card, #ffffff)",
                color: isActive ? "#ffffff" : "var(--mute, #6b7190)",
                border: isActive
                  ? "1px solid var(--pri, #4f46e5)"
                  : "1px solid var(--line, #e8eaf5)",
                boxShadow: isActive
                  ? "0 4px 12px rgba(79, 70, 229, 0.25)"
                  : "none",
              }}
            >
              {isHindi ? chip.labelHi : chip.label}
            </button>
          );
        })}
      </div>

      {/* ── CONDITIONAL RENDER: DEDICATED FILTER SCREEN vs MAIN HOME CONTENT ── */}
      {searchQuery.trim().length > 0 ? (
        <section className="py-2 animate-fadeIn">
          {/* Header Bar: Back to Home + Result Counter */}
          <div 
            className="flex items-center justify-between gap-3 mb-4 p-3 rounded-2xl"
            style={{
              background: "var(--card, #ffffff)",
              border: "1px solid var(--line, #e8eaf5)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
            }}
          >
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95"
              style={{
                background: "var(--soft, #eef0ff)",
                color: "var(--pri, #4f46e5)",
                border: "1px solid rgba(79, 70, 229, 0.2)"
              }}
            >
              ← {isHindi ? "होम पर लौटें" : "Back to Home"}
            </button>
            <div className="text-right">
              <span className="text-xs font-bold block" style={{ color: "var(--mute, #6b7190)" }}>
                {isHindi ? "फ़िल्टर परिणाम" : "Filter Screen"}
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--ink, #14162b)" }}>
                {filteredCategories.length} {isHindi ? "श्रेणियां मिलीं" : "categories found"}
              </span>
            </div>
          </div>

          {/* Filtered Results Grid */}
          {filteredCategories.length > 0 ? (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
              style={{ gap: "12px" }}
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
              className="py-16 text-center rounded-3xl p-6"
              style={{
                background: "var(--card, #ffffff)",
                border: "1px solid var(--line, #e8eaf5)"
              }}
            >
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-base font-bold mb-1" style={{ color: "var(--ink, #14162b)" }}>
                {isHindi ? "कोई परिणाम नहीं मिला" : "No matching categories found"}
              </h3>
              <p className="text-xs mb-4" style={{ color: "var(--mute, #6b7190)" }}>
                {isHindi
                  ? `"${searchQuery}" के लिए कोई श्रेणी नहीं मिली। लोकप्रिय विषय चुनें:`
                  : `No categories match "${searchQuery}". Try popular topics:`}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["India GK", "Science", "Sports", "History", "Cities"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full transition-all"
                    style={{
                      background: "var(--soft, #eef0ff)",
                      color: "var(--pri, #4f46e5)",
                      border: "1px solid rgba(79, 70, 229, 0.15)"
                    }}
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
          {/* 4. Daily Quiz Banner */}
          <div
            className="hero-daily-banner flex justify-between items-center p-4 rounded-2xl mb-4 text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--pri, #4f46e5), var(--pri2, #7c5cff))",
              borderRadius: "20px",
              padding: "16px",
              boxShadow: "0 8px 24px rgba(79, 70, 229, 0.22)",
            }}
          >
            <div>
              <b className="text-base sm:text-lg font-bold block">
                ⚡ {isHindi ? "दैनिक क्विज़" : "Daily Quiz"}
              </b>
              <p className="text-xs opacity-90 mt-0.5">
                {isHindi ? "10 प्रश्न · 3 मिनट" : "10 questions · 3 mins"}
              </p>
            </div>
            <Link
              href="/daily-quiz"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-indigo-600 active:scale-95 transition-transform"
              style={{
                border: 0,
                background: "#ffffff",
                color: "var(--pri, #4f46e5)",
                font: "700 13px Poppins, sans-serif",
                borderRadius: "12px",
                padding: "10px 16px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {isHindi ? "अभी खेलें" : "Play now"}
            </Link>
          </div>

          {/* 📚 My Books Section: India GK + Upcoming MP GK / UP GK */}
          <MyBooksHomeSection isHindi={isHindi} />

          {/* Quiz Arena compact card for Explorer (kept in position) */}
          <ArenaPromptCard audience="explorer" className="mb-3" />

          {/* Hot Quizzes Row (kept in position) */}
          <div className="mb-4">
            <HotQuizzesRow />
          </div>

          {/* 5. Play now Section: Live categories first */}
          {liveCategories.length > 0 && (
            <section className="mb-6">
              <h2
                className="flex items-center justify-between text-sm sm:text-base font-bold my-2 px-1"
                style={{ color: "var(--ink, #14162b)" }}
              >
                <span>{isHindi ? "अभी खेलें" : "Play now"}</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--mute, #6b7190)" }}
                >
                  {liveCategories.length} {isHindi ? "लाइव" : "live"}
                </span>
              </h2>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                style={{ gap: "12px" }}
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

          {/* 6. Coming soon Section: The rest */}
          {soonCategories.length > 0 && (
            <section className="mb-6">
              <h2
                className="flex items-center justify-between text-sm sm:text-base font-bold my-2 px-1"
                style={{ color: "var(--ink, #14162b)" }}
              >
                <span>{isHindi ? "जल्द आ रहा है" : "Coming soon"}</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--mute, #6b7190)" }}
                >
                  {soonCategories.length} {isHindi ? "श्रेणियां" : "categories"}
                </span>
              </h2>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                style={{ gap: "12px" }}
              >
                {soonCategories.map((category) => (
                  <CategoryCard
                    key={category.slug}
                    category={category}
                    isHindi={isHindi}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
