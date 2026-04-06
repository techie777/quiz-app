"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminCurrentAffairs.module.css";
import toast, { Toaster } from "react-hot-toast";

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
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());
  const [showHidden, setShowHidden] = useState(true);

  const [editing, setEditing] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState("");

  const fileInputRef = useRef(null);
  const [bulkData, setBulkData] = useState(null);
  const [uploading, setUploading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedDate) params.set("date", selectedDate);
    if (!selectedDate && selectedMonth) params.set("month", selectedMonth);
    return params.toString();
  }, [selectedCategory, selectedDate, selectedMonth]);

  const exportHref = useMemo(() => `/current-affairs/export?${query}`, [query]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/current-affairs?${query}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
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

  const visibleItems = useMemo(() => (showHidden ? items : items.filter((x) => !x.hidden)), [items, showHidden]);

  const openCreate = () => {
    setMsg("");
    setEditing("new");
    setForm({ ...EMPTY, date: selectedDate || getTodayDateString(), category: selectedCategory !== "all" ? selectedCategory : "" });
  };

  const openEdit = (it) => {
    setMsg("");
    setEditing(it.id);
    setForm({ ...it });
  };

  const save = async () => {
    setMsg("");
    const date = normalizeString(form.date);
    const heading = normalizeString(form.heading);
    const description = normalizeString(form.description);
    const category = normalizeString(form.category) || "General";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setMsg("Invalid date"); return; }
    if (!heading) { setMsg("Heading is required"); return; }
    if (!description) { setMsg("Description is required"); return; }

    if (isMaster) {
      const url = editing === "new" ? "/api/admin/current-affairs" : `/api/admin/current-affairs/${form.id}`;
      const method = editing === "new" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category, date, heading, description }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg(data.error || "Failed to save");
        return;
      }
      setEditing(null);
      toast.success(editing === "new" ? "Created successfully" : "Updated successfully");
      await fetchItems();
    } else {
      const type = editing === "new" ? "create_current_affair" : "update_current_affair";
      const ok = await submitPending(type, {
        entityType: "currentAffair",
        entityId: editing === "new" ? "" : form.id,
        ...form, date, category, heading, description
      });
      setEditing(null);
      if (ok) toast.success("Submitted for approval");
      else toast.error("Failed to submit");
    }
  };

  const remove = async (it) => {
    if (!confirm("Delete this current affair?")) return;
    if (isMaster) {
      const res = await fetch(`/api/admin/current-affairs/${it.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted successfully");
        await fetchItems();
      } else {
        toast.error("Failed to delete");
      }
    } else {
      const ok = await submitPending("delete_current_affair", { entityType: "currentAffair", entityId: it.id, id: it.id });
      if (ok) toast.success("Submitted for approval");
      else toast.error("Failed to submit");
    }
  };

  const toggleHidden = async (it) => {
    if (isMaster) {
      await fetch(`/api/admin/current-affairs/${it.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !it.hidden }),
      });
      await fetchItems();
    } else {
      await submitPending("update_current_affair", { entityType: "currentAffair", entityId: it.id, id: it.id, hidden: !it.hidden });
    }
  };

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const data = [
      { Heading: "Sample Heading 1", Description: "Detailed description of the event goes here." },
      { Heading: "Sample Heading 2", Description: "Another description for another current affair." },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Current Affairs");
    XLSX.writeFile(wb, "current-affairs-template.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const XLSX = await import("xlsx");
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setBulkData(data);
    };
    reader.readAsBinaryString(file);
  };

  const processBulkUpload = async () => {
    if (!bulkData || bulkData.length === 0) return;
    setUploading(true);
    try {
      const res = await fetch("/api/admin/current-affairs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          category: selectedCategory !== "all" ? selectedCategory : "General",
          items: bulkData.map(d => ({ heading: d.Heading, description: d.Description }))
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`Successfully uploaded ${result.count} items!`);
        setShowBulk(false);
        setBulkData(null);
        await fetchItems();
      } else {
        toast.error(result.error || "Upload failed");
      }
    } catch (err) {
      toast.error("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  if (!allowed) return <div className={styles.page}><p className={styles.empty}>Access denied.</p></div>;

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Current Affairs</h1>
          <p className={styles.subtitle}>Create, edit, delete, export and hide current affairs date-wise.</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button className="btn-secondary" onClick={() => setShowBulk(true)}>Bulk Upload</button>
          <a className="btn-secondary" href={exportHref} target="_blank" rel="noreferrer">Export</a>
          <button className="btn-primary" onClick={openCreate}>+ Add</button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Date</label>
          <input type="date" value={selectedDate} max={getTodayDateString()} onChange={(e) => { setSelectedDate(e.target.value); if (e.target.value) setSelectedMonth(""); }} />
        </div>
        <div className={styles.filterGroup}>
          <label>Month</label>
          <select value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); if (e.target.value) setSelectedDate(""); }}>
            <option value="">All</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Category</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">All</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <label className={styles.toggle}>
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
          <span>Show hidden</span>
        </label>
      </div>

      {showBulk && (
        <div className={styles.sidePanelOverlay}>
          <div className={`${styles.sidePanel} glass-card`}>
            <div className={styles.sidePanelHeader}>
              <h2>Bulk Upload</h2>
              <button className={styles.closeBtn} onClick={() => { setShowBulk(false); setBulkData(null); }}>✕</button>
            </div>
            <div className={styles.sidePanelContent}>
              <p>Upload current affairs for <strong>{formatDate(selectedDate)}</strong> in category <strong>{selectedCategory !== "all" ? selectedCategory : "General"}</strong>.</p>
              <div className={styles.bulkActions}>
                <button className="btn-secondary" onClick={downloadTemplate}>Download Template</button>
                <div className={styles.fileInputWrapper}>
                  <button className="btn-primary" onClick={() => fileInputRef.current.click()}>Select Excel File</button>
                  <input type="file" ref={fileInputRef} hidden accept=".xlsx,.xls" onChange={handleFileUpload} />
                </div>
              </div>
              {bulkData && (
                <div className={styles.bulkPreview}>
                  <p>Found <strong>{bulkData.length}</strong> items in file.</p>
                  <button className="btn-primary" style={{ width: "100%", marginTop: "1rem" }} onClick={processBulkUpload} disabled={uploading}>
                    {uploading ? "Uploading..." : `Upload ${bulkData.length} Items`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className={styles.sidePanelOverlay}>
          <div className={`${styles.sidePanel} glass-card`}>
            <div className={styles.sidePanelHeader}>
              <h2>{editing === "new" ? "Add Current Affair" : "Edit Current Affair"}</h2>
              <button className={styles.closeBtn} onClick={() => setEditing(null)}>✕</button>
            </div>
            {msg && <div className={styles.msg}>{msg}</div>}
            <div className={styles.sidePanelContent}>
              <div className={styles.formGrid}>
                <div className={styles.field}><label>Date</label><input type="date" value={form.date} max={getTodayDateString()} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></div>
                <div className={styles.field}><label>Category</label><input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Science & Technology" /></div>
                <div className={styles.fieldFull}><label>Heading</label><input value={form.heading} onChange={(e) => setForm((p) => ({ ...p, heading: e.target.value }))} /></div>
                <div className={styles.fieldFull}><label>Description</label><textarea rows={5} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
                <label className={styles.toggle}><input type="checkbox" checked={!!form.hidden} onChange={(e) => setForm((p) => ({ ...p, hidden: e.target.checked }))} /><span>Hidden</span></label>
              </div>
              <div className={styles.sidePanelActions}>
                <button className="btn-primary" onClick={save}>{isMaster ? "Save" : "Submit for approval"}</button>
                <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? <p className={styles.empty}>Loading…</p> : visibleItems.length === 0 ? <p className={styles.empty}>No current affairs.</p> : (
        <div className={styles.list}>
          {visibleItems.map((it) => (
            <div key={it.id} className={`${styles.card} glass-card`}>
              <div className={styles.cardLeft}>{it.image ? <img src={it.image} alt={it.heading} className={styles.cardImg} /> : <div className={styles.cardImgFallback}>🗞️</div>}</div>
              <div className={styles.cardBody}>
                <div className={styles.cardTop}><div className={styles.cardTitle}>{it.heading}</div><div className={styles.badges}>{it.hidden ? <span className={styles.badgeHidden}>Hidden</span> : <span className={styles.badgeLive}>Live</span>}</div></div>
                <div className={styles.cardMeta}><span>{formatDate(it.date)}</span>{it.category && <><span className={styles.dot}>•</span><span>{it.category}</span></>}</div>
                <div className={styles.cardDesc}>{it.description}</div>
                <div className={styles.cardActions}><button className="btn-secondary" onClick={() => openEdit(it)}>Edit</button><button className="btn-secondary" onClick={() => toggleHidden(it)}>{it.hidden ? "Show" : "Hide"}</button><button className="btn-secondary" onClick={() => remove(it)}>Delete</button></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
