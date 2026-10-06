"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import styles from "@/styles/SubCategoryManagerModal.module.css";

export default function SubCategoryManagerModal({
  isOpen,
  onClose,
  category,
  onUpdated,
}) {
  const [activeTab, setActiveTab] = useState("linked"); // "linked", "add_existing", "create_new"
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id or action name
  const [searchQuery, setSearchQuery] = useState("");

  const [parentData, setParentData] = useState(null);
  const [linkedList, setLinkedList] = useState([]);
  const [availableList, setAvailableList] = useState([]);
  const [recommendedList, setRecommendedList] = useState([]);

  // New Sub-Category form
  const [newTopic, setNewTopic] = useState("");
  const [newTopicHi, setNewTopicHi] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");

  const catId = category?.id || category?._id;

  const fetchSubCategories = useCallback(async () => {
    if (!catId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/subcategories?parentId=${catId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setParentData(data.parent || category);
        setLinkedList(data.linkedSubCategories || []);
        setAvailableList(data.availableCategories || []);
        setRecommendedList(data.recommendedSubCategories || []);
      } else {
        toast.error(data.error || "Failed to load sub-categories");
      }
    } catch (err) {
      console.error("Failed to fetch sub-categories:", err);
      toast.error("Network error loading sub-categories");
    } finally {
      setLoading(false);
    }
  }, [catId, category]);

  useEffect(() => {
    if (isOpen && catId) {
      setActiveTab("linked");
      setSearchQuery("");
      setNewTopic("");
      setNewTopicHi("");
      setNewEmoji("📁");
      fetchSubCategories();
    }
  }, [isOpen, catId, fetchSubCategories]);

  // Unlink (Deselect) a sub-category
  const handleUnlink = async (subCatId, subTopic) => {
    if (!catId || !subCatId) return;
    setActionLoading(`unlink-${subCatId}`);
    try {
      const res = await fetch(`/api/admin/categories/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: catId,
          action: "unlink",
          subCategoryId: subCatId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Deselected "${subTopic}"`);
        await fetchSubCategories();
        if (onUpdated) onUpdated();
      } else {
        toast.error(data.error || "Failed to deselect sub-category");
      }
    } catch (err) {
      console.error("Unlink error:", err);
      toast.error("Network error during deselect");
    } finally {
      setActionLoading(null);
    }
  };

  // Link an existing category as a subcategory
  const handleLink = async (subCatId, subTopic) => {
    if (!catId || !subCatId) return;
    setActionLoading(`link-${subCatId}`);
    try {
      const res = await fetch(`/api/admin/categories/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: catId,
          action: "link",
          subCategoryId: subCatId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Linked "${subTopic}" under ${parentData?.topic || category?.topic}`);
        await fetchSubCategories();
        if (onUpdated) onUpdated();
      } else {
        toast.error(data.error || "Failed to link sub-category");
      }
    } catch (err) {
      console.error("Link error:", err);
      toast.error("Network error during link");
    } finally {
      setActionLoading(null);
    }
  };

  // Quick link all recommended canonical subcategories
  const handleQuickLinkAll = async () => {
    if (!catId) return;
    setActionLoading("quick-link-all");
    try {
      const res = await fetch(`/api/admin/categories/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: catId,
          action: "quick_link_recommended",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Linked ${data.linkedCount || 0} recommended sub-categories!`);
        await fetchSubCategories();
        if (onUpdated) onUpdated();
      } else {
        toast.error(data.error || "Failed to quick-link recommended subcategories");
      }
    } catch (err) {
      console.error("Quick link error:", err);
      toast.error("Network error during quick-link");
    } finally {
      setActionLoading(null);
    }
  };

  // Create new subcategory & immediately link
  const handleCreateAndLink = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) {
      toast.error("Please enter a category title (EN)");
      return;
    }
    setActionLoading("create");
    try {
      const res = await fetch(`/api/admin/categories/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: catId,
          action: "create_and_link",
          newCategory: {
            topic: newTopic.trim(),
            topicHi: newTopicHi.trim(),
            emoji: newEmoji.trim() || "📁",
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Created & linked "${data.category?.topic}"!`);
        setNewTopic("");
        setNewTopicHi("");
        setNewEmoji("📁");
        setActiveTab("linked");
        await fetchSubCategories();
        if (onUpdated) onUpdated();
      } else {
        toast.error(data.error || "Failed to create sub-category");
      }
    } catch (err) {
      console.error("Create error:", err);
      toast.error("Network error during creation");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter available categories by search
  const filteredAvailable = useMemo(() => {
    if (!searchQuery.trim()) return availableList;
    const q = searchQuery.toLowerCase();
    return availableList.filter(
      (c) =>
        c.topic?.toLowerCase().includes(q) ||
        c.topicHi?.toLowerCase().includes(q) ||
        c.slug?.toLowerCase().includes(q)
    );
  }, [availableList, searchQuery]);

  // Unlinked recommended items
  const unlinkedRecommended = useMemo(() => {
    return recommendedList.filter((r) => !r.isLinked);
  }, [recommendedList]);

  if (!isOpen) return null;

  const currentParentTitle = parentData?.topic || category?.topic || "Category";
  const currentParentEmoji = parentData?.emoji || category?.emoji || "📁";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>{currentParentEmoji}</div>
            <div className={styles.titleArea}>
              <h2 className={styles.modalTitle}>
                Manage Sub-Categories
                <span className={styles.targetBadge}>{currentParentTitle}</span>
              </h2>
              <p className={styles.modalSubtitle}>
                Add, link, or deselect sub-categories for this master category. Changes update both Customer Web & Admin instantly.
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close Modal">
            ✕
          </button>
        </div>

        {/* Tab Bar */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "linked" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("linked")}
          >
            <span>🔗 Linked Sub-Categories</span>
            <span className={styles.tabBadge}>{linkedList.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "add_existing" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("add_existing")}
          >
            <span>➕ Link Existing Category</span>
            <span className={styles.tabBadge}>{availableList.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "create_new" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("create_new")}
          >
            <span>✍️ Create New Sub-Category</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⏳</div>
              <p>Loading sub-categories data...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: LINKED SUB-CATEGORIES */}
              {activeTab === "linked" && (
                <>
                  {/* Recommended Banner if unlinked recommended sub-categories exist */}
                  {unlinkedRecommended.length > 0 && (
                    <div className={styles.recommendedBanner}>
                      <div className={styles.recommendedTop}>
                        <div className={styles.recommendedTitle}>
                          <span>✨ Standard / Recommended for {currentParentTitle}</span>
                          <span style={{ fontSize: "0.75rem", fontWeight: "normal", color: "#15803d" }}>
                            ({unlinkedRecommended.length} not yet linked)
                          </span>
                        </div>
                        <button
                          type="button"
                          className={styles.quickLinkAllBtn}
                          disabled={actionLoading === "quick-link-all"}
                          onClick={handleQuickLinkAll}
                        >
                          {actionLoading === "quick-link-all" ? "Linking All..." : "⚡ Quick-Link All Recommended"}
                        </button>
                      </div>

                      <div className={styles.recommendedChips}>
                        {recommendedList.map((rec, idx) => (
                          <div
                            key={idx}
                            className={`${styles.recommendedChip} ${rec.isLinked ? styles.chipLinked : ""}`}
                          >
                            <span>{rec.isLinked ? "✓" : "○"}</span>
                            <span>{rec.name}</span>
                            {!rec.isLinked && rec.existingId && (
                              <button
                                type="button"
                                className={styles.chipAddBtn}
                                disabled={actionLoading === `link-${rec.existingId}`}
                                onClick={() => handleLink(rec.existingId, rec.name)}
                                title="Link existing category"
                              >
                                + Link
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* List of currently linked categories */}
                  {linkedList.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>📂</div>
                      <h4 style={{ margin: "4px 0", color: "#0f172a" }}>No Sub-Categories Linked</h4>
                      <p style={{ maxWidth: "420px", margin: "0 auto" }}>
                        Currently &ldquo;{currentParentTitle}&rdquo; has no linked sub-categories. You can link existing categories or create new ones below.
                      </p>
                      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                        {unlinkedRecommended.length > 0 && (
                          <button
                            type="button"
                            className={styles.quickLinkAllBtn}
                            onClick={handleQuickLinkAll}
                            disabled={actionLoading === "quick-link-all"}
                          >
                            ⚡ Quick-Link {unlinkedRecommended.length} Recommended
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => setActiveTab("add_existing")}
                        >
                          ➕ Link Existing
                        </button>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          style={{ background: "#475569" }}
                          onClick={() => setActiveTab("create_new")}
                        >
                          ✍️ Create New
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.listContainer}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>
                          {linkedList.length} sub-categor{linkedList.length === 1 ? "y" : "ies"} linked under &ldquo;{currentParentTitle}&rdquo;
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                          Click &ldquo;Deselect&rdquo; to unlink from this parent
                        </span>
                      </div>

                      {linkedList.map((sub) => {
                        const sets = Math.ceil((sub.questionCount || 0) / 20);
                        const isBusy = actionLoading === `unlink-${sub.id}`;

                        return (
                          <div key={sub.id} className={styles.categoryItem}>
                            <div className={styles.itemLeft}>
                              <div className={styles.itemEmoji}>{sub.emoji || "📁"}</div>
                              <div className={styles.itemTitles}>
                                <span className={styles.itemTitle}>{sub.topic}</span>
                                {sub.topicHi && <span className={styles.itemTitleHi}>{sub.topicHi}</span>}
                                <div className={styles.itemMeta}>
                                  <span className={styles.qBadge}>
                                    {sub.questionCount || 0} Questions ({sets} {sets === 1 ? "Set" : "Sets"})
                                  </span>
                                  {sub.slug && (
                                    <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                                      /{sub.slug}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className={styles.itemRight}>
                              <button
                                type="button"
                                className={styles.unlinkBtn}
                                disabled={isBusy}
                                onClick={() => handleUnlink(sub.id, sub.topic)}
                                title={`Deselect and unlink ${sub.topic} from this parent`}
                              >
                                {isBusy ? "Deselecting..." : "✕ Deselect / Unlink"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: LINK EXISTING CATEGORY */}
              {activeTab === "add_existing" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className={styles.searchBox}>
                    <span>🔍</span>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search categories by name (English or Hindi)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className={styles.listContainer}>
                    {filteredAvailable.length === 0 ? (
                      <div className={styles.emptyState}>
                        <p>No matching categories found to link.</p>
                      </div>
                    ) : (
                      filteredAvailable.map((cat) => {
                        const isBusy = actionLoading === `link-${cat.id}`;
                        return (
                          <div key={cat.id} className={styles.categoryItem}>
                            <div className={styles.itemLeft}>
                              <div className={styles.itemEmoji}>{cat.emoji || "📁"}</div>
                              <div className={styles.itemTitles}>
                                <span className={styles.itemTitle}>{cat.topic}</span>
                                {cat.topicHi && <span className={styles.itemTitleHi}>{cat.topicHi}</span>}
                                {cat.parentName && (
                                  <span className={styles.parentBadge}>
                                    Currently under: <strong>{cat.parentName}</strong>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className={styles.itemRight}>
                              <button
                                type="button"
                                className={styles.linkBtn}
                                disabled={isBusy}
                                onClick={() => handleLink(cat.id, cat.topic)}
                                title={`Link ${cat.topic} as subcategory under ${currentParentTitle}`}
                              >
                                {isBusy ? "Linking..." : "+ Link as Sub-Category"}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: CREATE NEW SUB-CATEGORY */}
              {activeTab === "create_new" && (
                <form className={styles.createCard} onSubmit={handleCreateAndLink}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", color: "#0f172a" }}>
                      Create New Sub-Category directly under &ldquo;{currentParentTitle}&rdquo;
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                      This category will be created with parentId set to &ldquo;{currentParentTitle}&rdquo; and will instantly appear in Customer Web.
                    </p>
                  </div>

                  <div className={styles.createGrid}>
                    <div className={styles.field}>
                      <label>Icon / Emoji</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={newEmoji}
                        onChange={(e) => setNewEmoji(e.target.value)}
                        placeholder="📁"
                        maxLength={4}
                        style={{ textAlign: "center", fontSize: "1.2rem" }}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Title (English) *</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="e.g. Indian Culture"
                        required
                        autoFocus
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Title (Hindi)</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={newTopicHi}
                        onChange={(e) => setNewTopicHi(e.target.value)}
                        placeholder="उदा. भारतीय संस्कृति"
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                    <button
                      type="submit"
                      className={styles.createBtn}
                      disabled={actionLoading === "create" || !newTopic.trim()}
                    >
                      {actionLoading === "create"
                        ? "Creating & Linking..."
                        : `+ Create & Link under ${currentParentTitle}`}
                    </button>
                    <button
                      type="button"
                      className={styles.closeFooterBtn}
                      onClick={() => setActiveTab("linked")}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerText}>
            💡 Sub-categories linked here immediately populate the subcategory filters on Customer Web.
          </div>
          <button type="button" className={styles.closeFooterBtn} onClick={onClose}>
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
}
