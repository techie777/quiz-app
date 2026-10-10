"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/CareerGuide.module.css";
import { useLanguage } from "@/context/LanguageContext";
import {
  Search,
  ArrowRight,
  RotateCcw,
  Compass,
  Sparkles,
  Filter,
  Briefcase,
} from "lucide-react";

export default function CareerGuideClient({ categories = [], allCareers = [], translations = {} }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { isHindi } = useLanguage();

  const initialQ = sp.get("q") || "";
  const initialSort = sp.get("sort") || "featured";
  const initialCat = sp.get("cat") || "";

  const [q, setQ] = useState(initialQ);
  const [sort, setSort] = useState(initialSort);
  const [cat, setCat] = useState(initialCat);

  // Sync state with URL without triggering Next.js server fetch
  const updateUrl = (newQ, newSort, newCat) => {
    const nextSp = new URLSearchParams();
    if (newQ) nextSp.set("q", newQ);
    if (newSort && newSort !== "featured") nextSp.set("sort", newSort);
    if (newCat) nextSp.set("cat", newCat);
    const qs = nextSp.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrl(q.trim(), sort, cat);
    }, 300);
    return () => clearTimeout(timer);
  }, [q, sort, cat, pathname]);

  const catOptions = useMemo(() => {
    return (categories || [])
      .filter((c) => !c.hidden)
      .slice()
      .sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0) || (a.pathKey || "").localeCompare(b.pathKey || ""))
      .map((c) => ({
        value: c.pathKey,
        label: (Array.isArray(c.pathSlugs) ? c.pathSlugs.join(" > ") : c.name) || c.name || c.pathKey,
        shortName: c.name || c.pathKey,
      }));
  }, [categories]);

  // Curated popular categories for 1-tap quick pills
  const quickCategories = useMemo(() => {
    const list = [{ key: "", labelEn: "All Careers", labelHi: "सभी करियर" }];
    (categories || []).forEach((c) => {
      if (!c.hidden && (!c.depth || c.depth <= 1)) {
        list.push({
          key: c.pathKey,
          labelEn: c.name || c.pathKey,
          labelHi: c.nameHi || c.name || c.pathKey,
        });
      }
    });
    // If categories is empty, provide sensible defaults
    if (list.length <= 1) {
      return [
        { key: "", labelEn: "All Careers", labelHi: "सभी करियर" },
        { key: "civil-services", labelEn: "Civil Services", labelHi: "सिविल सेवा" },
        { key: "defense", labelEn: "Defense & Police", labelHi: "रक्षा व पुलिस" },
        { key: "banking", labelEn: "Banking & Finance", labelHi: "बैंकिंग व वित्त" },
        { key: "engineering", labelEn: "Engineering", labelHi: "इंजीनियरिंग" },
        { key: "medical", labelEn: "Medical & Health", labelHi: "चिकित्सा" },
        { key: "teaching", labelEn: "Teaching & Edu", labelHi: "शिक्षण" },
      ];
    }
    return list.slice(0, 8);
  }, [categories]);

  const clearAll = () => {
    setQ("");
    setSort("featured");
    setCat("");
  };

  // Local filtering
  const filteredCareers = useMemo(() => {
    let list = [...allCareers];

    // Filter by query
    if (q.trim()) {
      const lowerQ = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(lowerQ)) ||
          (c.description && c.description.toLowerCase().includes(lowerQ)) ||
          (c.category && c.category.toLowerCase().includes(lowerQ))
      );
    }

    // Filter by category
    if (cat) {
      const selectedCatNode = categories.find((c) => c.pathKey === cat);
      if (selectedCatNode) {
        const descendantIds = categories
          .filter(
            (c) =>
              c.pathKey === selectedCatNode.pathKey ||
              (c.pathKey && c.pathKey.startsWith(`${selectedCatNode.pathKey}/`))
          )
          .map((c) => c.id);

        list = list.filter((c) => descendantIds.includes(c.careerCategoryId));
      } else {
        // Fallback filter by string matching in category name/id
        list = list.filter((c) =>
          (c.category || "").toLowerCase().includes(cat.toLowerCase())
        );
      }
    }

    // Sort
    if (sort === "az") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sort === "za") {
      list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    } else if (sort === "newest") {
      list.reverse();
    }

    return list;
  }, [allCareers, categories, q, cat, sort]);

  return (
    <>
      {/* ──────────────── 1. RESPONSIVE SEARCH & FILTER BAR ──────────────── */}
      <div className={styles.filterBar}>
        {/* Controls Row */}
        <div className={styles.filterControlsRow}>
          {/* Search Box */}
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                isHindi
                  ? "करियर खोजें (जैसे: IAS, DSP, बैंक PO, NDA, शिक्षक...)"
                  : "Search careers (IAS, DSP, Bank PO, NDA, Teacher...)"
              }
              aria-label="Search career guides"
              className={styles.searchInput}
            />
          </div>

          {/* Sort Select */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort career guides"
            className={styles.filterSelect}
          >
            <option value="featured">{isHindi ? "⭐ विशेष (Featured)" : "⭐ Featured"}</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="newest">{isHindi ? "नवीनतम (Newest)" : "Newest"}</option>
          </select>

          {/* Category Select */}
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            aria-label="Filter by category"
            className={styles.filterSelect}
          >
            <option value="">{isHindi ? "सभी श्रेणियां (All)" : "All Categories"}</option>
            {catOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Reset Button */}
          {(q || sort !== "featured" || cat) && (
            <button
              type="button"
              onClick={clearAll}
              className={styles.resetBtn}
              title={isHindi ? "फ़िल्टर साफ़ करें" : "Reset filters"}
            >
              <RotateCcw size={14} />
              <span>{isHindi ? "रीसेट" : "Reset"}</span>
            </button>
          )}
        </div>

        {/* 1-Tap Category Quick Pills */}
        <div className={styles.categoryPillsRow}>
          {quickCategories.map((qc) => {
            const isActive = cat === qc.key;
            return (
              <button
                key={qc.key}
                type="button"
                className={`${styles.categoryPill} ${isActive ? styles.categoryPillActive : ""}`}
                onClick={() => setCat(qc.key)}
              >
                <span>{isHindi ? qc.labelHi : qc.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Meta Stats Row */}
        <div className={styles.filterMetaRow}>
          <span>
            {isHindi
              ? `कुल ${filteredCareers.length} करियर रोडमैप उपलब्ध`
              : `Found ${filteredCareers.length} career roadmaps`}
          </span>
          <span className="text-[11px] text-slate-400">
            {isHindi ? "पूर्ण पात्रता, वेतनमान व चयन प्रक्रिया" : "Detailed eligibility, exam path & salary"}
          </span>
        </div>
      </div>

      {/* ──────────────── 2. CAREER CARDS GRID ──────────────── */}
      <div className={styles.careersGrid}>
        {filteredCareers.map((career) => (
          <div key={career.id} className={styles.careerCard}>
            <div className={styles.careerIcon}>
              {career.icon || <Briefcase size={28} className="text-blue-600" />}
            </div>
            <div className={styles.careerCategory}>{career.category}</div>
            <h2 className={styles.careerName}>{career.name}</h2>
            <p className={styles.careerDesc}>{career.description}</p>

            <Link href={`/career-guide/${career.id}`} className={styles.exploreBtn}>
              <span>{isHindi ? "करियर रोडमैप देखें" : "Explore Roadmap"}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ))}

        {/* Rich Empty State */}
        {filteredCareers.length === 0 && (
          <div className={styles.emptyState}>
            <Compass size={44} className="text-slate-400" />
            <h3 className={styles.emptyStateTitle}>
              {isHindi ? "कोई करियर रोडमैप नहीं मिला" : "No Career Roadmaps Found"}
            </h3>
            <p className={styles.emptyStateDesc}>
              {isHindi
                ? "आपके खोजे गए शब्द या चुने गए फ़िल्टर से कोई परिणाम मेल नहीं खाता। कृपया फ़िल्टर रीसेट करें।"
                : "No careers match your search criteria. Try adjusting your query or reset filters."}
            </p>
            <button onClick={clearAll} className={styles.resetBtn}>
              <RotateCcw size={14} />
              <span>{isHindi ? "सभी फ़िल्टर साफ़ करें" : "Reset All Filters"}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
