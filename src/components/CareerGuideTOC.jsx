"use client";

import { useEffect, useMemo, useState } from "react";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CareerGuideTOC({ items }) {
  const toc = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return list
      .map((it) => ({
        id: it?.id || slugify(it?.title),
        title: String(it?.title || "").trim(),
      }))
      .filter((x) => x.id && x.title);
  }, [items]);

  const [activeId, setActiveId] = useState(toc[0]?.id || "");

  useEffect(() => {
    if (toc.length === 0) return;
    const ids = toc.map((t) => t.id);

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (visible?.target?.id && ids.includes(visible.target.id)) {
          setActiveId(visible.target.id);
        }
      },
      { root: null, rootMargin: "-25% 0px -65% 0px", threshold: [0.1, 0.2, 0.35, 0.5] }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    return () => obs.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <nav aria-label="On this page">
      <div style={{ fontWeight: 900, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        On this page
      </div>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        {toc.map((t) => {
          const isActive = t.id === activeId;
          return (
            <a
              key={t.id}
              href={`#${t.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(t.id);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                history.replaceState(null, "", `#${t.id}`);
              }}
              style={{
                textDecoration: "none",
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${isActive ? "rgba(99, 102, 241, 0.35)" : "var(--card-border)"}`,
                background: isActive ? "rgba(99, 102, 241, 0.08)" : "var(--card-bg)",
                color: "var(--text-primary)",
                fontWeight: isActive ? 900 : 700,
                fontSize: 13,
                lineHeight: 1.2,
              }}
            >
              {t.title}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

