"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "@/styles/AdminCategories.module.css";
import toast from "react-hot-toast";
import { useAdmin } from "@/context/AdminContext";

const EMPTY = { id: "", name: "", slug: "", parentId: "", sortOrder: 0, hidden: false };

function labelFor(cat) {
  const path = Array.isArray(cat?.pathSlugs) ? cat.pathSlugs.join(" > ") : cat?.name;
  return path || cat?.name || "";
}

function buildTree(categories) {
  const byParent = new Map();
  for (const c of categories) {
    const key = c.parentId || "__root__";
    const arr = byParent.get(key) || [];
    arr.push(c);
    byParent.set(key, arr);
  }
  const walk = (parentId, depth) => {
    const nodes = byParent.get(parentId || "__root__") || [];
    nodes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
    return nodes.flatMap((n) => [{ ...n, _depth: depth }, ...walk(n.id, depth + 1)]);
  };
  return walk(null, 0);
}

function CategoryForm({ initial, categories, editingId, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);

  const parentOptions = useMemo(() => {
    const flat = buildTree(categories);
    return flat
      .filter((c) => c.id !== editingId)
      .map((c) => ({ id: c.id, label: `${"—".repeat(Math.min(6, c._depth))} ${c.name}` }));
  }, [categories, editingId]);

  const isNew = !form?.id;

  const save = async () => {
    if (!form.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/career-categories", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isNew ? {} : { id: form.id }),
          name: form.name.trim(),
          slug: form.slug?.trim() || undefined,
          parentId: form.parentId || null,
          sortOrder: Number(form.sortOrder) || 0,
          hidden: !!form.hidden,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.message || data?.error || "Failed to save category");
        return;
      }
      toast.success(isNew ? "Category created" : "Category updated");
      onSaved?.();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.inlineForm}>
      <h2 className={styles.formTitle}>{isNew ? "Add Career Category" : "Edit Career Category"}</h2>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>Name</label>
          <input
            className={styles.input}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Madhya Pradesh (MPPSC)"
          />
        </div>
        <div className={styles.field}>
          <label>Slug (optional)</label>
          <input
            className={styles.input}
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="e.g. madhya-pradesh"
          />
        </div>
        <div className={styles.field}>
          <label>Parent Category</label>
          <select
            className={styles.input}
            value={form.parentId || ""}
            onChange={(e) => setForm({ ...form, parentId: e.target.value || "" })}
          >
            <option value="">None (Top level)</option>
            {parentOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label>Sort Order</label>
          <input
            type="number"
            className={styles.input}
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
          />
        </div>
        <div className={styles.checkboxField}>
          <label>
            <input
              type="checkbox"
              checked={!!form.hidden}
              onChange={(e) => setForm({ ...form, hidden: e.target.checked })}
            />
            <span>Hidden</span>
          </label>
        </div>
      </div>
      <div className={styles.formActions}>
        <button className="btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : isNew ? "Create" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function CareerCategoriesAdminPage() {
  const { adminUser } = useAdmin();
  const allowed = adminUser?.role === "master" || adminUser?.permissions?.careerGuide !== false;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "NEW" | category obj
  const [confirmId, setConfirmId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/career-categories?includeHidden=1");
      const data = await res.json();
      if (data?.success) setCategories(data.categories || []);
      else toast.error(data?.error || "Failed to fetch categories");
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const flat = useMemo(() => buildTree(categories), [categories]);

  const del = async (id) => {
    try {
      const res = await fetch(`/api/admin/career-categories?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.message || data?.error || "Failed to delete");
        return;
      }
      toast.success("Deleted");
      setConfirmId(null);
      fetchAll();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete");
    }
  };

  if (!allowed) {
    return (
      <div className={styles.page}>
        <p>Access denied.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Career Categories</h1>
          <p className={styles.subtitle}>Create infinite nesting for Career Guide</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing("NEW")}>
          + Add Category
        </button>
      </div>

      <div className={styles.list}>
        {editing === "NEW" && (
          <CategoryForm
            initial={EMPTY}
            categories={categories}
            editingId={null}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              fetchAll();
            }}
          />
        )}

        {flat.length === 0 && editing !== "NEW" ? (
          <p className={styles.empty}>No career categories yet. Add one above!</p>
        ) : (
          flat.map((c) => (
            <div key={c.id}>
              <div className={`${styles.row} glass-card`}>
                <div className={styles.rowInfo}>
                  <span className={styles.emoji} aria-hidden="true">
                    {c._depth > 0 ? "↳" : "📁"}
                  </span>
                  <div>
                    <span className={styles.name}>
                      {labelFor(c)}{" "}
                      <span style={{ fontSize: 11, color: "#888", marginLeft: 6 }}>/career-guide/{c.pathKey}</span>
                    </span>
                    <span className={styles.desc}>
                      slug: {c.slug} {c.hidden ? "• hidden" : ""}
                    </span>
                  </div>
                </div>
                <div className={styles.rowMeta}>
                  {c.hidden && <span className={styles.hiddenBadge}>Hidden</span>}
                  <span className={styles.count}>d{c.depth}</span>
                  <div className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => setEditing(c)}>
                      ✏️
                    </button>
                    <button className={styles.deleteBtn} onClick={() => setConfirmId(c.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              {confirmId === c.id && (
                <div className={styles.confirmBar}>
                  <span>{`Delete "${c.name}"?`}</span>
                  <button className={styles.confirmYes} onClick={() => del(c.id)}>
                    Yes, Delete
                  </button>
                  <button className={styles.confirmNo} onClick={() => setConfirmId(null)}>
                    Cancel
                  </button>
                </div>
              )}

              {editing?.id === c.id && (
                <CategoryForm
                  initial={editing}
                  categories={categories}
                  editingId={editing.id}
                  onCancel={() => setEditing(null)}
                  onSaved={() => {
                    setEditing(null);
                    fetchAll();
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

