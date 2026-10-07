"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, CornerDownLeft, Sparkles, BookOpen } from "lucide-react";
import { MAIN_CATEGORIES } from "@/lib/mainCategoriesConfig";
import { useLanguage } from "@/context/LanguageContext";

export default function CategorySearchBar({ dbCategories = [], className = "" }) {
  const router = useRouter();
  const { isHindi } = useLanguage();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Build a lookup map of live database counts by slug
  const dbCountMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(dbCategories)) {
      dbCategories.forEach((c) => {
        if (c.slug) {
          const qCount = c.questionCount ?? c._count?.questions ?? (Array.isArray(c.questions) ? c.questions.length : 0);
          map.set(c.slug, qCount);
        }
      });
    }
    return map;
  }, [dbCategories]);

  // Canonical topic reference chapters and tags dictionary
  const TOPIC_CHAPTERS = useMemo(() => ({
    "Rivers & Lakes": ["Ganga", "Yamuna", "Brahmaputra", "Indus", "Godavari", "Krishna", "Kaveri", "Narmada", "Tapi", "Wular Lake", "Chilika Lake", "Sambhar Lake"],
    "Ganga Basin": ["Ganga", "Bhagirathi", "Alaknanda", "Yamuna", "Haridwar", "Varanasi", "Prayagraj", "Gomti", "Ghaghara", "Sunderbans", "Hooghly"],
    "Indus System": ["Indus", "Jhelum", "Chenab", "Ravi", "Beas", "Sutlej", "Panjnad", "Harappa"],
    "Godavari & Krishna": ["Godavari", "Krishna", "Tungabhadra", "Kaveri", "Nashik", "Rajahmundry", "Mahabaleshwar", "Nagarjuna Sagar"],
    "Narmada & Tapi": ["Narmada", "Tapi", "Amarkantak", "Dhuandhar Falls", "Sardar Sarovar", "Surat", "Jabalpur"],
    "Ancient India": ["Indus Valley", "Harappa", "Mohenjo-daro", "Vedic Period", "Mauryan Empire", "Ashoka", "Gupta Dynasty", "Harshavardhana", "Nalanda"],
    "Medieval India": ["Delhi Sultanate", "Mughal Empire", "Akbar", "Maratha Empire", "Shivaji Maharaj", "Vijayanagara", "Chola Dynasty", "Razia Sultana"],
    "Modern India": ["1857 Revolt", "Freedom Movement", "Mahatma Gandhi", "Subhash Chandra Bose", "Bhagat Singh", "Quit India", "1947 Partition", "Jallianwala Bagh"],
    "Constitution": ["Preamble", "Fundamental Rights", "Directive Principles", "Amendments", "Article 370", "Constituent Assembly", "Dr. Ambedkar"],
    "Parliament": ["Lok Sabha", "Rajya Sabha", "President of India", "Speaker", "Bills & Acts", "No-Confidence Motion"],
    "ISRO & Space": ["Chandrayaan", "Mangalyaan", "Aditya-L1", "Gaganyaan", "PSLV", "GSLV", "Vikram Sarabhai", "Satish Dhawan"],
    "Cricket History": ["1983 World Cup", "2011 World Cup", "2007 T20 World Cup", "Kapil Dev", "Sachin Tendulkar", "MS Dhoni", "Virat Kohli", "Ranji Trophy", "IPL"],
    "Mega Metros": ["Delhi", "Mumbai", "Bengaluru", "Kolkata", "Chennai", "Hyderabad"],
    "Heritage & Cultural Cities": ["Varanasi", "Jaipur", "Udaipur", "Amritsar", "Madurai", "Hampi"],
    "Clean & Smart Cities": ["Indore", "Surat", "Bhopal", "Chandigarh", "Pune", "Navi Mumbai"],
    "Ramayana": ["Lord Rama", "Sita", "Ayodhya", "Lanka", "Hanuman", "Valmiki", "Ravana", "Dandakaranya"],
    "Mahabharata": ["Kurukshetra", "Krishna", "Arjuna", "Bhishma", "Karna", "Pandavas", "Kauravas", "Geeta Updesh"],
    "Physics": ["Optics", "Mechanics", "Thermodynamics", "Electromagnetism", "Nuclear Physics"],
    "Chemistry": ["Periodic Table", "Chemical Reactions", "Organic Chemistry", "Acids and Bases", "Metals"],
    "Biology & Life Sciences": ["Human Body", "Cell Biology", "Genetics", "Plant Kingdom", "Diseases"],
  }), []);

  // Compute search matches across Main Categories, Subcategories, Topics, and Chapters/Tags
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches = [];

    // 1. Check Main Categories
    MAIN_CATEGORIES.forEach((mc) => {
      const nameMatch = mc.name.toLowerCase().includes(q);
      const nameHiMatch = mc.nameHi && mc.nameHi.includes(q);
      const descMatch = mc.description && mc.description.toLowerCase().includes(q);
      const exampleMatch = mc.example && mc.example.toLowerCase().includes(q);

      const qCount = dbCountMap.get(mc.slug) || 0;

      if (nameMatch || nameHiMatch || descMatch || exampleMatch) {
        matches.push({
          type: "main",
          id: `main-${mc.slug}`,
          title: isHindi && mc.nameHi ? mc.nameHi : mc.name,
          subtitle: mc.example,
          emoji: mc.icon || "📚",
          slug: mc.slug,
          qCount,
          href: `/category/${mc.slug}`,
          path: [mc.icon || "📚", isHindi && mc.nameHi ? mc.nameHi : mc.name],
        });
      }

      // 2. Check Subcategories, Topics, and Chapters/Tags under this Main Category
      if (Array.isArray(mc.subcategories)) {
        mc.subcategories.forEach((sub) => {
          const subMatch = sub.name.toLowerCase().includes(q);

          if (subMatch) {
            matches.push({
              type: "subcategory",
              id: `sub-${mc.slug}-${sub.slug}`,
              title: sub.name,
              subtitle: `Under ${mc.name}`,
              emoji: mc.icon || "📁",
              slug: mc.slug,
              subSlug: sub.slug,
              qCount,
              href: `/category/${mc.slug}?sub=${encodeURIComponent(sub.slug)}`,
              path: [mc.icon || "📚", mc.name, sub.name],
            });
          }

          // Check individual topics
          if (Array.isArray(sub.topics)) {
            sub.topics.forEach((topic) => {
              const topicMatch = topic.toLowerCase().includes(q);

              if (topicMatch) {
                matches.push({
                  type: "topic",
                  id: `topic-${mc.slug}-${sub.slug}-${topic}`,
                  title: topic,
                  subtitle: `${sub.name} · ${mc.name}`,
                  emoji: mc.icon || "🎯",
                  slug: mc.slug,
                  subSlug: sub.slug,
                  topicName: topic,
                  qCount,
                  href: `/category/${mc.slug}?sub=${encodeURIComponent(sub.slug)}&topic=${encodeURIComponent(topic)}`,
                  path: [mc.icon || "📚", mc.name, sub.name, topic],
                });
              }

              // 3. Check Chapters / Reference Tags under this topic (e.g. "Ganga")
              const topicTags = Array.from(new Set([
                ...(TOPIC_CHAPTERS[topic] || []),
                ...(Array.isArray(sub.tags) ? sub.tags : []),
                ...(Array.isArray(sub.chapters) ? sub.chapters : []),
                ...(sub.topicTags?.[topic] || []),
              ]));
              topicTags.forEach((tag) => {
                if (tag.toLowerCase().includes(q)) {
                  matches.push({
                    type: "chapter",
                    id: `tag-${mc.slug}-${sub.slug}-${topic}-${tag}`,
                    title: `${tag} (Chapter / Tag)`,
                    subtitle: `🎯 Opens Set with ${tag} · Under ${topic}`,
                    emoji: "🏷️",
                    slug: mc.slug,
                    subSlug: sub.slug,
                    topicName: topic,
                    tagName: tag,
                    qCount,
                    href: `/category/${mc.slug}?sub=${encodeURIComponent(sub.slug)}&topic=${encodeURIComponent(topic)}&tag=${encodeURIComponent(tag)}&set=1`,
                    path: [mc.icon || "📚", mc.name, sub.name, topic, tag],
                    opensSet: true,
                  });
                }
              });
            });
          }
        });
      }
    });

    // Sort to prioritize exact chapter/tag and name matches
    matches.sort((a, b) => {
      const aExact = a.title.toLowerCase().startsWith(q) ? -1 : 1;
      const bExact = b.title.toLowerCase().startsWith(q) ? -1 : 1;
      return aExact - bExact;
    });

    // Return top 8 most relevant matches
    return matches.slice(0, 8);
  }, [query, isHindi, dbCountMap, TOPIC_CHAPTERS]);

  // Click outside to dismiss autocomplete
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "/" && document.activeElement !== inputRef.current && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keyboard navigation within autocomplete dropdown
  const handleKeyDown = (e) => {
    if (!isOpen || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleSelect(searchResults[selectedIndex]);
      } else if (searchResults.length > 0) {
        handleSelect(searchResults[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelect = (item) => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(-1);
    router.push(item.href);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Box */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
          <Search size={20} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isHindi ? "40 मुख्य श्रेणियों व विषयों में खोजें... (उदा: Science, Cricket, Delhi)" : "Search 40 Main Categories & Topics... (e.g. Science, Cricket, Delhi)"}
          className="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 shadow-sm transition-all min-h-[52px]"
          aria-label="Search categories and topics"
          autoComplete="off"
        />

        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Instant Autocomplete Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {searchResults.length > 0 ? (
            <div className="p-2">
              <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>{isHindi ? "सुझाए गए परिणाम" : "Instant Matches"}</span>
                <span>{searchResults.length} {isHindi ? "मिले" : "found"}</span>
              </div>

              <div className="space-y-1 mt-1">
                {searchResults.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      prefetch={true}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 transition-colors no-underline ${
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0 border border-slate-200/60 dark:border-slate-700">
                          {item.emoji}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm truncate">{item.title}</span>
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                              {item.type}
                            </span>
                          </div>

                          {/* Breadcrumb path */}
                          <div className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            {item.path.map((segment, sIdx) => (
                              <React.Fragment key={sIdx}>
                                <span>{segment}</span>
                                {sIdx < item.path.length - 1 && <span className="text-slate-300 dark:text-slate-600">›</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.qCount > 0 ? (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                            {item.qCount} Qs
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/40">
                            {isHindi ? "जल्द आ रहा है" : "Soon"}
                          </span>
                        )}
                        <ArrowRight size={14} className="text-slate-400 group-hover:text-indigo-600" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 px-3 py-1 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">↓</kbd>
                  <span>{isHindi ? "नेविगेट करें" : "navigate"}</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">↵</kbd>
                  <span>{isHindi ? "खोलें" : "open"}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {isHindi ? `"${query}" के लिए कोई विषय नहीं मिला` : `No topics found matching "${query}"`}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isHindi ? "कृपया किसी अन्य शब्द या मुख्य श्रेणी का नाम आज़माएं।" : "Try searching for India GK, Science, Space, Cricket, History..."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
