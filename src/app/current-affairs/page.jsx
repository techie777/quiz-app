"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "@/styles/CurrentAffairs.module.css";

function formatDate(d) {
  if (!d) return "";
  try {
    const [y, m, day] = String(d).split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(day));
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export default function CurrentAffairsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [favIds, setFavIds] = useState(new Set());
  const [reading, setReading] = useState(null);
  const [loginPrompt, setLoginPrompt] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [total, setTotal] = useState(0);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedDate) params.set("date", selectedDate);
    if (!selectedDate && selectedMonth) params.set("month", selectedMonth);
    return params.toString();
  }, [page, pageSize, selectedCategory, selectedDate, selectedMonth]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/current-affairs?${query}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(Number(data.total || 0));
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setMonths(Array.isArray(data.months) ? data.months : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedDate, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagination = useMemo(() => {
    const current = clamp(page, 1, totalPages);
    const start = Math.max(1, current - 3);
    const end = Math.min(totalPages, start + 6);
    const nums = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedDate) params.set("date", selectedDate);
    if (!selectedDate && selectedMonth) params.set("month", selectedMonth);
    return `/current-affairs/export?${params.toString()}`;
  }, [selectedCategory, selectedDate, selectedMonth]);

  useEffect(() => {
    const isUser = session?.user && !session.user.isAdmin;
    if (status !== "authenticated" || !isUser) {
      setFavIds(new Set());
      return;
    }
    let cancelled = false;
    async function loadFavs() {
      try {
        const res = await fetch("/api/current-affairs/favourites?ids=1", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setFavIds(new Set(Array.isArray(data.ids) ? data.ids : []));
      } catch {}
    }
    loadFavs();
    return () => {
      cancelled = true;
    };
  }, [session, status]);

  const toggleFav = async (id) => {
    const isUser = session?.user && !session.user.isAdmin;
    if (status !== "authenticated" || !isUser) {
      setLoginPrompt(true);
      return;
    }
    const res = await fetch("/api/current-affairs/favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAffairId: id }),
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    const favourited = !!data?.favourited;
    setFavIds((prev) => {
      const next = new Set(prev);
      if (favourited) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const chipStyle = (label) => {
    const s = String(label || "");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return {
      background: `linear-gradient(135deg, hsla(${h}, 85%, 55%, 0.18), hsla(${(h + 40) % 360}, 85%, 55%, 0.10))`,
      borderColor: `hsla(${h}, 85%, 55%, 0.35)`,
      color: `hsl(${h}, 65%, 40%)`,
    };
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Current Affairs</h1>
          <p className={styles.subtitle}>Browse current affairs date-wise and category-wise.</p>
        </div>
        <a className={styles.exportBtn} href={exportHref} target="_blank" rel="noreferrer">
          Export
        </a>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              if (e.target.value) setSelectedMonth("");
            }}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              if (e.target.value) setSelectedDate("");
            }}
          >
            <option value="">All</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Category</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Current Affairs Category</div>
          <button
            className={`${styles.sideItem} ${selectedCategory === "all" ? styles.sideActive : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`${styles.sideItem} ${selectedCategory === c ? styles.sideActive : ""}`}
              onClick={() => setSelectedCategory(c)}
            >
              {c}
            </button>
          ))}
        </aside>

        <section className={styles.content}>
          {loading ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonImage} />
                  <div className={styles.skeletonBody}>
                    <div className={styles.skeletonTitle} />
                    <div className={styles.skeletonMeta} />
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLineShort} />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>No current affairs found.</div>
          ) : (
            <div className={styles.list}>
              {items.map((it) => (
                <article key={it.id} className={styles.card}>
                  <div className={styles.imageWrap}>
                    {it.image ? (
                      <img src={it.image} alt={it.heading} className={styles.image} />
                    ) : (
                      <div className={styles.imageFallback}>🗞️</div>
                    )}
                    <button
                      className={styles.favOverlay}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFav(it.id);
                      }}
                      title="Favourite"
                    >
                      {favIds.has(it.id) ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <div className={styles.body}>
                    <h3 className={styles.heading}>{it.heading}</h3>
                    <div className={styles.meta}>
                      <span>{formatDate(it.date)}</span>
                      {it.category ? <span className={styles.dot}>•</span> : null}
                      {it.category ? (
                        <span className={styles.chip} style={chipStyle(it.category)}>
                          {it.category}
                        </span>
                      ) : null}
                    </div>
                    <p className={styles.desc}>{it.description}</p>
                    <div className={styles.actionsRow}>
                      <button className={styles.readMoreBtn} onClick={() => setReading(it)}>
                        Read More
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className={styles.pagination}>
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ‹
              </button>
              {pagination.map((n) => (
                <button
                  key={n}
                  className={n === page ? styles.pageActive : ""}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                ›
              </button>
            </div>
          )}
        </section>
      </div>

      {reading && (
        <div className={styles.modalOverlay} onClick={() => setReading(null)}>
          <div className={`${styles.modal} glass-card`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTop}>
              <div className={styles.modalMeta}>
                <span>{formatDate(reading.date)}</span>
                {reading.category ? <span className={styles.dot}>•</span> : null}
                {reading.category ? (
                  <span className={styles.chip} style={chipStyle(reading.category)}>
                    {reading.category}
                  </span>
                ) : null}
              </div>
              <div className={styles.modalBtns}>
                <button className={styles.modalFav} onClick={() => toggleFav(reading.id)}>
                  {favIds.has(reading.id) ? "❤️" : "🤍"}
                </button>
                <button className={styles.modalClose} onClick={() => setReading(null)}>
                  ✕
                </button>
              </div>
            </div>

            <h2 className={styles.modalTitle}>{reading.heading}</h2>

            {reading.image ? <img src={reading.image} alt="" className={styles.modalImage} /> : null}
            <div className={styles.modalDesc}>{reading.description}</div>
          </div>
        </div>
      )}

      {loginPrompt && (
        <div className={styles.loginPromptOverlay} onClick={() => setLoginPrompt(false)}>
          <div className={`${styles.loginPrompt} glass-card`} onClick={(e) => e.stopPropagation()}>
            <p className={styles.loginPromptText}>Sign in to save favourites</p>
            <div className={styles.loginPromptBtns}>
              <button className="btn-primary" onClick={() => router.push("/signin")}>
                Sign In
              </button>
              <button className="btn-secondary" onClick={() => setLoginPrompt(false)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
