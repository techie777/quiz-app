"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/OnboardingModal.module.css";
import toast from "react-hot-toast";

export default function OnboardingModal({ isOpen, onClose, initialInterests = [] }) {
  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchCurrentInterests();
    }
  }, [isOpen]);

  const fetchCurrentInterests = async () => {
    try {
      const res = await fetch("/api/user/interests");
      if (res.ok) {
        const data = await res.json();
        setSelectedIds(data.interestedCategories || []);
      }
    } catch (error) {
      console.error("Failed to fetch current interests:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      // Increased limit to 100 and added showAll=true to ensure users see many options
      const res = await fetch("/api/categories?limit=100&sortBy=popular&showAll=true");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length < 3) {
      toast.error("Please select at least 3 interests!");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/interests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interestedCategories: selectedIds }),
      });

      if (res.ok) {
        toast.success("Interests updated!");
        onClose();
        window.location.reload();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Could not save your preferences");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Personalize Your Experience</h2>
          <p className={styles.modalSubtitle}>Select at least 3 categories you&apos;re interested in to customize your feed.</p>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
               <p className="text-slate-400 font-medium">Discovering categories...</p>
            </div>
          ) : (
            <div className={styles.categoryGrid}>
              {categories.map((cat) => {
                const isSelected = selectedIds.includes(cat.id);
                return (
                  <div 
                    key={cat.id} 
                    className={`${styles.categoryCard} ${isSelected ? styles.selected : ""}`}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <span className={styles.categoryEmoji}>{cat.emoji || "🎯"}</span>
                    <span className={styles.categoryName}>{cat.topic}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.selectionCount}>
            {selectedIds.length} categories selected
            {selectedIds.length < 3 && <span className="block text-rose-500 text-xs">Pick {3 - selectedIds.length} more</span>}
          </div>
          <button 
            className={styles.saveBtn} 
            onClick={handleSave}
            disabled={selectedIds.length < 3 || saving}
          >
            {saving ? "Saving..." : "Save & Explore"}
          </button>
        </div>
      </div>
    </div>
  );
}
