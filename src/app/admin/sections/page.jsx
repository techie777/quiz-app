"use client";

import { useState, useEffect, useMemo } from "react";
import { useData } from "@/context/DataContext";
import styles from "@/styles/AdminSections.module.css";
import toast, { Toaster } from "react-hot-toast";

export default function SectionsAdmin() {
  const { quizzes } = useData();
  const [sections, setSections] = useState([]);
  const [subSections, setSubSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modals & Drawer States
  const [sectionModal, setSectionModal] = useState(null); // null, { type: "add" } or { type: "edit", id, name, isVisible }
  const [subSectionModal, setSubSectionModal] = useState(null); // null, { type: "add", sectionId } or { type: "edit", id, name, isVisible }
  const [quizPickerSubSectionId, setQuizPickerSubSectionId] = useState(null); // subSectionId or null
  const [quizPickerSearch, setQuizPickerSearch] = useState("");

  // Load sections from DB
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/sections');
      if (res.ok) {
        const data = await res.json();
        setSections(data || []);
        const allSubSections = (data || []).flatMap(s => s.subSections || []);
        setSubSections(allSubSections);
      }
    } catch (error) {
      console.error("Failed to fetch sections:", error);
      toast.error("Failed to load sections.");
    } finally {
      setIsLoading(false);
    }
  };

  // Atomic Save to DB
  const saveToDb = async (updatedSections, updatedSubSections) => {
    setIsSaving(true);
    const dataToSave = updatedSections.map((s, idx) => ({
      ...s,
      order: idx + 1,
      subSections: updatedSubSections
        .filter(sub => String(sub.sectionId) === String(s.id))
        .map((sub, subIdx) => ({
          ...sub,
          order: subIdx + 1
        }))
    }));

    try {
      const res = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: dataToSave })
      });
      if (res.ok) {
        toast.success("Homepage Sections updated!");
        await fetchSections();
      } else {
        toast.error("Failed to save sections.");
      }
    } catch (error) {
      console.error("Failed to save sections:", error);
      toast.error("Error saving sections.");
    } finally {
      setIsSaving(false);
    }
  };

  // Section CRUD
  const handleSaveSectionModal = async (e) => {
    e.preventDefault();
    if (!sectionModal?.name?.trim()) {
      toast.error("Section name is required");
      return;
    }

    let updatedSections = [];
    if (sectionModal.type === "add") {
      const newSec = {
        id: `temp-${Date.now()}`,
        name: sectionModal.name.trim(),
        isVisible: sectionModal.isVisible !== false,
        order: sections.length + 1,
        subSections: []
      };
      updatedSections = [...sections, newSec];
    } else if (sectionModal.type === "edit") {
      updatedSections = sections.map(s =>
        s.id === sectionModal.id ? { ...s, name: sectionModal.name.trim(), isVisible: sectionModal.isVisible } : s
      );
    }

    setSections(updatedSections);
    setSectionModal(null);
    await saveToDb(updatedSections, subSections);
  };

  const handleDeleteSection = async (sectionId) => {
    const sec = sections.find(s => s.id === sectionId);
    if (!sec) return;
    if (!confirm(`Delete section "${sec.name}" and all its sub-sections?`)) return;

    const updatedSections = sections.filter(s => s.id !== sectionId);
    const updatedSubSections = subSections.filter(sub => String(sub.sectionId) !== String(sectionId));

    setSections(updatedSections);
    setSubSections(updatedSubSections);
    await saveToDb(updatedSections, updatedSubSections);
  };

  const handleToggleSectionVisibility = async (sectionId) => {
    const updatedSections = sections.map(s =>
      s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s
    );
    setSections(updatedSections);
    await saveToDb(updatedSections, subSections);
  };

  const handleMoveSection = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const updatedSections = [...sections];
    const temp = updatedSections[index];
    updatedSections[index] = updatedSections[targetIndex];
    updatedSections[targetIndex] = temp;

    setSections(updatedSections);
    await saveToDb(updatedSections, subSections);
  };

  // SubSection CRUD
  const handleSaveSubSectionModal = async (e) => {
    e.preventDefault();
    if (!subSectionModal?.name?.trim()) {
      toast.error("Sub-section name is required");
      return;
    }

    let updatedSubSections = [];
    if (subSectionModal.type === "add") {
      const newSub = {
        id: `temp-sub-${Date.now()}`,
        sectionId: subSectionModal.sectionId,
        name: subSectionModal.name.trim(),
        isVisible: subSectionModal.isVisible !== false,
        order: subSections.filter(s => String(s.sectionId) === String(subSectionModal.sectionId)).length + 1,
        quizIds: []
      };
      updatedSubSections = [...subSections, newSub];
    } else if (subSectionModal.type === "edit") {
      updatedSubSections = subSections.map(sub =>
        sub.id === subSectionModal.id ? { ...sub, name: subSectionModal.name.trim(), isVisible: subSectionModal.isVisible } : sub
      );
    }

    setSubSections(updatedSubSections);
    setSubSectionModal(null);
    await saveToDb(sections, updatedSubSections);
  };

  const handleDeleteSubSection = async (subSectionId) => {
    const sub = subSections.find(s => s.id === subSectionId);
    if (!sub) return;
    if (!confirm(`Delete sub-section "${sub.name}"?`)) return;

    const updatedSubSections = subSections.filter(s => s.id !== subSectionId);
    setSubSections(updatedSubSections);
    await saveToDb(sections, updatedSubSections);
  };

  const handleToggleSubSectionVisibility = async (subSectionId) => {
    const updatedSubSections = subSections.map(sub =>
      sub.id === subSectionId ? { ...sub, isVisible: !sub.isVisible } : sub
    );
    setSubSections(updatedSubSections);
    await saveToDb(sections, updatedSubSections);
  };

  const handleMoveSubSection = async (sectionId, subIndex, direction) => {
    const secSubs = subSections.filter(sub => String(sub.sectionId) === String(sectionId));
    const targetIndex = subIndex + direction;
    if (targetIndex < 0 || targetIndex >= secSubs.length) return;

    const swappedSub1 = secSubs[subIndex];
    const swappedSub2 = secSubs[targetIndex];

    const updatedSubSections = subSections.map(sub => {
      if (sub.id === swappedSub1.id) return { ...sub, order: targetIndex + 1 };
      if (sub.id === swappedSub2.id) return { ...sub, order: subIndex + 1 };
      return sub;
    });

    setSubSections(updatedSubSections);
    await saveToDb(sections, updatedSubSections);
  };

  // Quiz Assignment to SubSection
  const handleToggleQuizAssignment = async (subSectionId, quizId) => {
    const sub = subSections.find(s => s.id === subSectionId);
    if (!sub) return;

    const currentQuizIds = sub.quizIds || [];
    const newQuizIds = currentQuizIds.includes(quizId)
      ? currentQuizIds.filter(id => id !== quizId)
      : [...currentQuizIds, quizId];

    const updatedSubSections = subSections.map(s =>
      s.id === subSectionId ? { ...s, quizIds: newQuizIds } : s
    );

    setSubSections(updatedSubSections);
    await saveToDb(sections, updatedSubSections);
  };

  // Derived KPI Stats
  const totalSubSectionsCount = subSections.length;
  const totalAssignedQuizzesCount = useMemo(() => {
    const set = new Set();
    subSections.forEach(sub => (sub.quizIds || []).forEach(id => set.add(id)));
    return set.size;
  }, [subSections]);
  const hiddenSectionsCount = sections.filter(s => !s.isVisible).length;

  // Active Quiz Picker SubSection Object
  const activeQuizPickerSubSection = useMemo(() => {
    if (!quizPickerSubSectionId) return null;
    return subSections.find(s => s.id === quizPickerSubSectionId) || null;
  }, [quizPickerSubSectionId, subSections]);

  // Filtered Quizzes inside Quiz Picker Drawer
  const filteredQuizzes = useMemo(() => {
    if (!quizPickerSearch.trim()) return quizzes;
    const q = quizPickerSearch.toLowerCase();
    return quizzes.filter(cat =>
      (cat.topic || "").toLowerCase().includes(q) ||
      (cat.description || "").toLowerCase().includes(q)
    );
  }, [quizzes, quizPickerSearch]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyStateCard}>
          <h3>Loading Sections Configuration...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />

      {/* Header Banner */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeHeader}>
            <span>📁 HOMEPAGE SECTIONS & TAXONOMY MANAGER</span>
          </div>
          <h1 className={styles.title}>Homepage Sections</h1>
          <p className={styles.subtitle}>
            Organize main homepage section blocks, sub-sections, and quiz category assignments cleanly.
          </p>
        </div>

        <div className={styles.actionButtonsGroup}>
          <button
            className={styles.primaryBtn}
            onClick={() => setSectionModal({ type: "add", name: "", isVisible: true })}
          >
            <span>⚡ + Add Main Section</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>📁</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{sections.length}</div>
            <div className={styles.kpiLabel}>Main Sections</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>📂</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{totalSubSectionsCount}</div>
            <div className={styles.kpiLabel}>Sub-Sections</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>🎯</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{totalAssignedQuizzesCount}</div>
            <div className={styles.kpiLabel}>Categories Assigned</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>🙈</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{hiddenSectionsCount}</div>
            <div className={styles.kpiLabel}>Hidden Sections</div>
          </div>
        </div>
      </div>

      {/* Main Sections Feed */}
      {sections.length === 0 ? (
        <div className={styles.emptyStateCard}>
          <div style={{ fontSize: "3rem" }}>📁</div>
          <h3 style={{ margin: "0", fontSize: "1.2rem", fontWeight: 800 }}>No Homepage Sections Configured</h3>
          <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.88rem" }}>
            Click below to create your first homepage section block (e.g. Govt Exams, General Knowledge).
          </p>
          <button
            className={styles.primaryBtn}
            onClick={() => setSectionModal({ type: "add", name: "", isVisible: true })}
            style={{ marginTop: "10px" }}
          >
            <span>⚡ + Create Main Section</span>
          </button>
        </div>
      ) : (
        <div className={styles.sectionsFeed}>
          {sections.map((section, secIdx) => {
            const secSubSections = subSections
              .filter(sub => String(sub.sectionId) === String(section.id))
              .sort((a, b) => a.order - b.order);

            return (
              <div
                key={section.id}
                className={`${styles.sectionCard} ${!section.isVisible ? styles.sectionCardHidden : ''}`}
              >
                {/* Section Header Bar */}
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderLeft}>
                    <div className={styles.orderControls}>
                      <button
                        className={styles.orderBtn}
                        disabled={secIdx === 0}
                        onClick={() => handleMoveSection(secIdx, -1)}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        className={styles.orderBtn}
                        disabled={secIdx === sections.length - 1}
                        onClick={() => handleMoveSection(secIdx, 1)}
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>

                    <div className={styles.sectionTitleGroup}>
                      <h3 className={styles.sectionTitle}>{section.name}</h3>

                      <span className={styles.subCountBadge}>
                        {secSubSections.length} {secSubSections.length === 1 ? 'Sub-Section' : 'Sub-Sections'}
                      </span>

                      {section.isVisible ? (
                        <span className={`${styles.badgePill} ${styles.badgeLive}`}>🟢 LIVE</span>
                      ) : (
                        <span className={`${styles.badgePill} ${styles.badgeHidden}`}>🙈 HIDDEN</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.sectionActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => setSubSectionModal({ type: "add", sectionId: section.id, name: "", isVisible: true })}
                    >
                      <span>➕ Sub-Section</span>
                    </button>

                    <button
                      className={styles.actionBtn}
                      onClick={() => setSectionModal({ type: "edit", id: section.id, name: section.name, isVisible: section.isVisible })}
                    >
                      <span>✏️ Rename</span>
                    </button>

                    <button
                      className={styles.actionBtn}
                      onClick={() => handleToggleSectionVisibility(section.id)}
                    >
                      <span>{section.isVisible ? "👁️ Hide" : "🙈 Show"}</span>
                    </button>

                    <button
                      className={styles.actionBtnDelete}
                      onClick={() => handleDeleteSection(section.id)}
                    >
                      <span>🗑️ Delete</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Sections Container */}
                <div className={styles.subSectionsBody}>
                  {secSubSections.length === 0 ? (
                    <div style={{ background: "var(--bg-secondary)", borderRadius: "12px", padding: "16px", textAlignment: "center", color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600 }}>
                      No sub-sections added yet. Click "+ Sub-Section" above to add sub-categories.
                    </div>
                  ) : (
                    secSubSections.map((subSection, subIdx) => {
                      const assignedQuizzes = (subSection.quizIds || [])
                        .map(id => quizzes.find(q => q.id === id))
                        .filter(Boolean);

                      return (
                        <div key={subSection.id} className={styles.subSectionCard}>
                          <div className={styles.subSectionHeader}>
                            <div className={styles.subSectionTitleGroup}>
                              <div className={styles.orderControls}>
                                <button
                                  className={styles.orderBtn}
                                  disabled={subIdx === 0}
                                  onClick={() => handleMoveSubSection(section.id, subIdx, -1)}
                                >
                                  ▲
                                </button>
                                <button
                                  className={styles.orderBtn}
                                  disabled={subIdx === secSubSections.length - 1}
                                  onClick={() => handleMoveSubSection(section.id, subIdx, 1)}
                                >
                                  ▼
                                </button>
                              </div>

                              <h4 className={styles.subSectionTitle}>{subSection.name}</h4>

                              {!subSection.isVisible && (
                                <span className={`${styles.badgePill} ${styles.badgeHidden}`}>🙈 HIDDEN</span>
                              )}
                            </div>

                            <div className={styles.sectionActions}>
                              <button
                                className={styles.primaryBtn}
                                style={{ padding: "6px 14px", fontSize: "0.78rem" }}
                                onClick={() => setQuizPickerSubSectionId(subSection.id)}
                              >
                                <span>🎯 Assign Categories ({assignedQuizzes.length})</span>
                              </button>

                              <button
                                className={styles.actionBtn}
                                onClick={() => setSubSectionModal({ type: "edit", id: subSection.id, name: subSection.name, isVisible: subSection.isVisible })}
                              >
                                ✏️ Edit
                              </button>

                              <button
                                className={styles.actionBtn}
                                onClick={() => handleToggleSubSectionVisibility(subSection.id)}
                              >
                                {subSection.isVisible ? "👁️ Hide" : "🙈 Show"}
                              </button>

                              <button
                                className={styles.actionBtnDelete}
                                onClick={() => handleDeleteSubSection(subSection.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          {/* Assigned Quiz Chips */}
                          <div className={styles.assignedQuizzesRow}>
                            {assignedQuizzes.length === 0 ? (
                              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                No quiz categories assigned. Click "Assign Categories" to add.
                              </span>
                            ) : (
                              assignedQuizzes.map((quiz) => (
                                <span key={quiz.id} className={styles.quizTagChip}>
                                  <span>{quiz.emoji || "📖"} {quiz.topic}</span>
                                  <button
                                    type="button"
                                    className={styles.removeTagBtn}
                                    onClick={() => handleToggleQuizAssignment(subSection.id, quiz.id)}
                                    title="Remove Quiz"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUIZ PICKER DRAWER MODAL (Searchable & Clean!) */}
      {activeQuizPickerSubSection && (
        <div className={styles.sidePanelOverlay}>
          <div className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <div>
                <h2>🎯 Assign Quiz Categories</h2>
                <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Assigning categories to <strong>{activeQuizPickerSubSection.name}</strong>
                </p>
              </div>
              <button className={styles.closeBtn} onClick={() => setQuizPickerSubSectionId(null)}>✕</button>
            </div>

            <div className={styles.sidePanelContent}>
              <input
                type="text"
                className={styles.inputControl}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px" }}
                placeholder="🔍 Search categories by name..."
                value={quizPickerSearch}
                onChange={(e) => setQuizPickerSearch(e.target.value)}
                autoFocus
              />

              <div className={styles.quizPickerList}>
                {filteredQuizzes.map((quiz) => {
                  const isAssigned = (activeQuizPickerSubSection.quizIds || []).includes(quiz.id);

                  return (
                    <div
                      key={quiz.id}
                      className={`${styles.quizPickerItem} ${isAssigned ? styles.quizPickerItemActive : ''}`}
                      onClick={() => handleToggleQuizAssignment(activeQuizPickerSubSection.id, quiz.id)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "1.2rem" }}>{quiz.emoji || "📖"}</span>
                        <div>
                          <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{quiz.topic}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            {quiz.questionCount || 0} Questions
                          </div>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => {}} // handled by parent onClick
                        style={{ width: "18px", height: "18px", accentColor: "#6366f1", cursor: "pointer" }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.sidePanelActions}>
              <button className={styles.primaryBtn} onClick={() => setQuizPickerSubSectionId(null)}>
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION ADD / EDIT MODAL */}
      {sectionModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-primary, #fff)", borderRadius: "18px", padding: "24px", width: "90%", maxWidth: "460px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1.2rem", fontWeight: 800 }}>
              {sectionModal.type === "add" ? "⚡ Add Main Homepage Section" : "✏️ Rename Section"}
            </h3>

            <form onSubmit={handleSaveSectionModal} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Section Name
                </label>
                <input
                  type="text"
                  value={sectionModal.name}
                  onChange={(e) => setSectionModal({ ...sectionModal, name: e.target.value })}
                  placeholder="e.g. Govt Exams, General Knowledge"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid var(--card-border)", fontSize: "0.9rem" }}
                  autoFocus
                  required
                />
              </div>

              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={!!sectionModal.isVisible}
                  onChange={(e) => setSectionModal({ ...sectionModal, isVisible: e.target.checked })}
                />
                <span>Visible on Homepage</span>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setSectionModal(null)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-SECTION ADD / EDIT MODAL */}
      {subSectionModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-primary, #fff)", borderRadius: "18px", padding: "24px", width: "90%", maxWidth: "460px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1.2rem", fontWeight: 800 }}>
              {subSectionModal.type === "add" ? "⚡ Add Sub-Section" : "✏️ Rename Sub-Section"}
            </h3>

            <form onSubmit={handleSaveSubSectionModal} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Sub-Section Name
                </label>
                <input
                  type="text"
                  value={subSectionModal.name}
                  onChange={(e) => setSubSectionModal({ ...subSectionModal, name: e.target.value })}
                  placeholder="e.g. Section A: Static GK"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid var(--card-border)", fontSize: "0.9rem" }}
                  autoFocus
                  required
                />
              </div>

              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={!!subSectionModal.isVisible}
                  onChange={(e) => setSubSectionModal({ ...subSectionModal, isVisible: e.target.checked })}
                />
                <span>Visible on Homepage</span>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setSubSectionModal(null)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Save Sub-Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
