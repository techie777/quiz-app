"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function CareerGuideDirectoryControls({ categories = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialQ = sp.get("q") || "";
  const initialSort = sp.get("sort") || "featured";
  const initialCat = sp.get("cat") || "";

  const [q, setQ] = useState(initialQ);
  const [sort, setSort] = useState(initialSort);
  const [cat, setCat] = useState(initialCat);

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

  const apply = (next) => {
    const nextSp = new URLSearchParams(sp.toString());
    if (next.q != null) {
      if (next.q) nextSp.set("q", next.q);
      else nextSp.delete("q");
    }
    if (next.sort != null) {
      if (next.sort && next.sort !== "featured") nextSp.set("sort", next.sort);
      else nextSp.delete("sort");
    }
    if (next.cat != null) {
      if (next.cat) nextSp.set("cat", next.cat);
      else nextSp.delete("cat");
    }
    const qs = nextSp.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const clearAll = () => {
    setQ("");
    setSort("featured");
    setCat("");
    startTransition(() => router.replace(pathname));
  };

  return (
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
          onKeyDown={(e) => {
            if (e.key === "Enter") apply({ q: q.trim() });
          }}
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
        <button
          type="button"
          onClick={() => apply({ q: q.trim() })}
          disabled={isPending}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(59,130,246,0.25)",
            background: "#3b82f6",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </div>

      <select
        value={sort}
        onChange={(e) => {
          const v = e.target.value;
          setSort(v);
          apply({ sort: v });
        }}
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
          onChange={(e) => {
            const v = e.target.value;
            setCat(v);
            apply({ cat: v });
          }}
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
          disabled={isPending}
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
        {isPending ? "Updating results..." : "Tip: use categories to create SEO-friendly landing pages."}
      </div>
    </div>
  );
}

