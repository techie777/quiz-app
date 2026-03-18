"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "@/styles/CurrentAffairsExport.module.css";

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

export default function CurrentAffairsExportClient() {
  const searchParams = useSearchParams();
  const date = searchParams.get("date") || "";
  const month = searchParams.get("month") || "";
  const category = searchParams.get("category") || "";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", "500");
    if (category) params.set("category", category);
    if (date) params.set("date", date);
    if (!date && month) params.set("month", month);
    return params.toString();
  }, [date, month, category]);

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
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const title = date ? `Current Affairs — ${date}` : month ? `Current Affairs — ${month}` : "Current Affairs";

  return (
    <main className={styles.page}>
      <div className={styles.toolbar}>
        <button className={styles.printBtn} onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>

      <div className={styles.sheet}>
        <h1 className={styles.title}>{title}</h1>
        {category ? <p className={styles.subTitle}>Category: {category}</p> : null}

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : items.length === 0 ? (
          <p className={styles.muted}>No items.</p>
        ) : (
          <div className={styles.list}>
            {items.map((it) => (
              <div key={it.id} className={styles.item}>
                <div className={styles.left}>
                  <div className={styles.date}>{formatDate(it.date)}</div>
                  {it.category ? <div className={styles.category}>{it.category}</div> : null}
                </div>
                <div className={styles.right}>
                  <div className={styles.heading}>{it.heading}</div>
                  <div className={styles.desc}>{it.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

