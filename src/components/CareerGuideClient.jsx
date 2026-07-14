"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/CareerGuide.module.css";

export default function CareerGuideClient({ categories = [], allCareers = [], translations = {} }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

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
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
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
      }));
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
      list = list.filter((c) => 
        (c.name && c.name.toLowerCase().includes(lowerQ)) ||
        (c.description && c.description.toLowerCase().includes(lowerQ)) ||
        (c.category && c.category.toLowerCase().includes(lowerQ))
      );
    }

    // Filter by category
    if (cat) {
      // Find the selected category to get its pathKey
      const selectedCatNode = categories.find((c) => c.pathKey === cat);
      if (selectedCatNode) {
        // Find all descendant category IDs (including self)
        const descendantIds = categories
          .filter(c => c.pathKey === selectedCatNode.pathKey || (c.pathKey && c.pathKey.startsWith(`${selectedCatNode.pathKey}/`)))
          .map(c => c.id);
        
        list = list.filter(c => descendantIds.includes(c.careerCategoryId));
      } else {
        list = []; // Invalid category
      }
    }

    // Sort
    if (sort === "az") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "za") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sort === "newest") {
      // Assuming original order is somewhat chronological or we have updatedAt (not passed initially, but let's assume default is fine or we keep it stable)
      // Since allCareers comes sorted by whatever the server did, if sort isn't supported perfectly locally, we just reverse or keep.
      // But let's just reverse the original list as a simple proxy for newest if we don't have dates.
      list.reverse(); 
    }

    return list;
  }, [allCareers, categories, q, cat, sort]);

  const t = (key) => translations[key] || key;

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 220px 260px",
          gap: 12,
          alignItems: "center",
          maxWidth: 980,
          margin: "0 auto 18px",
          padding: "14px",
          borderRadius: 16,
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          backdropFilter: "var(--card-backdrop)",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search careers (IAS, DSP, SDM...)"
            aria-label="Search career guides"
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid var(--border-color, #e2e8f0)",
              background: "var(--bg-surface, #fff)",
              color: "var(--text-primary, #0f172a)",
              outline: "none",
            }}
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort career guides"
          style={{
            width: "100%",
            padding: "12px 12px",
            borderRadius: 12,
            border: "1px solid var(--border-color, #e2e8f0)",
            background: "var(--bg-surface, #fff)",
          }}
        >
          <option value="featured">Featured</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
          <option value="newest">Newest</option>
        </select>

        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            aria-label="Filter by category"
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid var(--border-color, #e2e8f0)",
              background: "var(--bg-surface, #fff)",
            }}
          >
            <option value="">All categories</option>
            {catOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={clearAll}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid var(--border-color, #e2e8f0)",
              background: "var(--bg-surface, #fff)",
              cursor: "pointer",
              fontWeight: 600,
            }}
            title="Clear filters"
          >
            Reset
          </button>
        </div>

        <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--text-secondary, #64748b)" }}>
          Tip: use categories to create SEO-friendly landing pages.
        </div>
      </div>

      <div className={styles.careersGrid}>
        {filteredCareers.map((career) => (
          <div key={career.id} className={styles.careerCard}>
            <div className={styles.careerIcon}>{career.icon}</div>
            <div className={styles.careerCategory}>{career.category}</div>
            <h2 className={styles.careerName}>{career.name}</h2>
            <p className={styles.careerDesc}>{career.description}</p>
            
            <Link href={`/career-guide/${career.id}`} className={styles.exploreBtn}>
              {t('career.exploreBtn')} <span aria-hidden="true">+'</span>
            </Link>
          </div>
        ))}
        {filteredCareers.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
            No careers found matching your search.
          </div>
        )}
      </div>
    </>
  );
}
