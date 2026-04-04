"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminCurrentAffairs.module.css";

async function submitPending(type, payload) {
  const res = await fetch("/api/admin/pending", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
  return res.ok;
}

function normalizeString(v) {
  return String(v || "").trim();
}

// Helper function to get today's date in YYYY-MM-DD format (local timezone)
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

const EMPTY = { id: "", date: "", category: "", heading: "", description: "", image: "", hidden: false };

export default function AdminCurrentAffairsPage() {
  const { adminUser } = useAdmin();
  const isMaster = adminUser?.role === "master";
  const allowed = adminUser?.role === "master" || adminUser?.permissions?.currentAffairs !== false;

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    // Set today's date by default (27-03-2026) - use local timezone
    return getTodayDateString();
  });
  const [showHidden, setShowHidden] = useState(true);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState("");

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedDate) params.set("date", selectedDate);
    if (!selectedDate && selectedMonth) params.set("month", selectedMonth);
    return `/current-affairs/export?${params.toString()}`;
  }, [selectedCategory, selectedDate, selectedMonth]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedDate) params.set("date", selectedDate);
    if (!selectedDate && selectedMonth) params.set("month", selectedMonth);
    return params.toString();
  }, [selectedCategory, selectedDate, selectedMonth]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/current-affairs?${query}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data.items) ? data.items : [];
      setItems(list);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setMonths(Array.isArray(data.months) ? data.months : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    fetchItems();
  }, [allowed, query]);

  const visibleItems = useMemo(() => {
    const base = showHidden ? items : items.filter((x) => !x.hidden);
    return base;
  }, [items, showHidden]);

  const openCreate = () => {
    setMsg("");
    setEditing("new");
    setForm({ ...EMPTY, date: getTodayDateString() });
  };

  const openEdit = (it) => {
    setMsg("");
    setEditing(it.id);
    setForm({
      id: it.id,
      date: it.date || "",
      category: it.category || "",
      heading: it.heading || "",
      description: it.description || "",
      image: it.image || "",
      hidden: !!it.hidden,
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, image: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setMsg("");
    const date = normalizeString(form.date);
    const heading = normalizeString(form.heading);
    const description = normalizeString(form.description);
    const category = normalizeString(form.category);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setMsg("Invalid date");
      return;
    }
    if (!heading) {
      setMsg("Heading is required");
      return;
    }
    if (!description) {
      setMsg("Description is required");
      return;
    }

    if (isMaster) {
      if (editing === "new") {
        const res = await fetch("/api/admin/current-affairs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, category, heading, description, image: form.image, hidden: !!form.hidden }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setMsg(data.error || "Failed to save");
          return;
        }
      } else {
        const res = await fetch(`/api/admin/current-affairs/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, category, heading, description, image: form.image, hidden: !!form.hidden }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setMsg(data.error || "Failed to save");
          return;
        }
      }
      setEditing(null);
      await fetchItems();
      return;
    }

    const type = editing === "new" ? "create_current_affair" : "update_current_affair";
    const ok = await submitPending(type, {
      entityType: "currentAffair",
      entityId: editing === "new" ? "" : form.id,
      ...{ id: form.id, date, category, heading, description, image: form.image, hidden: !!form.hidden },
    });
    setEditing(null);
    setMsg(ok ? "Submitted for approval." : "Failed to submit for approval.");
  };

  const remove = async (it) => {
    if (!confirm("Delete this current affair?")) return;
    if (isMaster) {
      const res = await fetch(`/api/admin/current-affairs/${it.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete");
        return;
      }
      await fetchItems();
      return;
    }
    const ok = await submitPending("delete_current_affair", { entityType: "currentAffair", entityId: it.id, id: it.id });
    if (!ok) alert("Failed to submit for approval.");
  };

  const toggleHidden = async (it) => {
    if (isMaster) {
      const res = await fetch(`/api/admin/current-affairs/${it.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !it.hidden }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update");
        return;
      }
      await fetchItems();
      return;
    }
    const ok = await submitPending("update_current_affair", {
      entityType: "currentAffair",
      entityId: it.id,
      id: it.id,
      hidden: !it.hidden,
    });
    if (!ok) alert("Failed to submit for approval.");
  };

  if (!allowed) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>Access denied.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Current Affairs</h1>
          <p className={styles.subtitle}>Create, edit, delete, export and hide current affairs date-wise.</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <a className="btn-secondary" href={exportHref} target="_blank" rel="noreferrer">
            Export
          </a>
          <button className="btn-primary" onClick={openCreate}>
            + Add
          </button>
        </div>
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
        <label className={styles.toggle}>
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
          <span>Show hidden</span>
        </label>
      </div>

      {editing && (
        <div className={`${styles.sidePanelOverlay}`}>
          <div className={`${styles.sidePanel} glass-card`}>
            <div className={styles.sidePanelHeader}>
              <h2>{editing === "new" ? "Add Current Affair" : "Edit Current Affair"}</h2>
              <button className={styles.closeBtn} onClick={() => setEditing(null)}>
                ✕
              </button>
            </div>

            {msg ? <div className={styles.msg}>{msg}</div> : null}

            <div className={styles.sidePanelContent}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>Category</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    placeholder="e.g. Science & Technology"
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label>Heading</label>
                  <input value={form.heading} onChange={(e) => setForm((p) => ({ ...p, heading: e.target.value }))} />
                </div>
                <div className={styles.fieldFull}>
                  <label>Description</label>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label>Image (optional)</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                  {form.image ? (
                    <div className={styles.previewRow}>
                      <img src={form.image} alt="Preview" className={styles.previewImg} />
                      <button className="btn-secondary" type="button" onClick={() => setForm((p) => ({ ...p, image: "" }))}>
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={!!form.hidden} onChange={(e) => setForm((p) => ({ ...p, hidden: e.target.checked }))} />
                  <span>Hidden</span>
                </label>
              </div>

              <div className={styles.sidePanelActions}>
                <button className="btn-primary" onClick={save}>
                  {isMaster ? "Save" : "Submit for approval"}
                </button>
                <button className="btn-secondary" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : visibleItems.length === 0 ? (
        <p className={styles.empty}>No current affairs.</p>
      ) : (
        <>
          {/* Show Today's Current Affairs indicator */}
          {selectedDate && selectedDate === getTodayDateString() && (
            <div className={styles.todayIndicator}>
              <span className={styles.todayBadge}>📅 Today{"'"}s Current Affairs</span>
              <span className={styles.todayDate}>{formatDate(selectedDate)}</span>
            </div>
          )}
          
          <div className={styles.list}>
            {visibleItems.map((it) => (
              <div key={it.id} className={`${styles.card} glass-card`}>
                <div className={styles.cardLeft}>
                  {it.image ? <img src={it.image} alt={it.heading} className={styles.cardImg} /> : <div className={styles.cardImgFallback}>🗞️</div>}
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardTitle}>{it.heading}</div>
                    <div className={styles.badges}>
                      {it.hidden ? <span className={styles.badgeHidden}>Hidden</span> : <span className={styles.badgeLive}>Live</span>}
                    </div>
                  </div>
                  <div className={styles.cardMeta}>
                    <span>{formatDate(it.date)}</span>
                    {it.category ? <span className={styles.dot}>•</span> : null}
                    {it.category ? <span>{it.category}</span> : null}
                  </div>
                  <div className={styles.cardDesc}>{it.description}</div>
                  <div className={styles.cardActions}>
                    <button className="btn-secondary" onClick={() => openEdit(it)}>
                      Edit
                    </button>
                    <button className="btn-secondary" onClick={() => toggleHidden(it)}>
                      {it.hidden ? "Show" : "Hide"}
                    </button>
                    <button className="btn-secondary" onClick={() => remove(it)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
