"use client";

import { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import styles from "@/styles/Admin.module.css";

export default function SubSectionsAdmin() {
  const { quizzes } = useData();
  const [subSections, setSubSections] = useState([]);
  const [newSubSection, setNewSubSection] = useState({ name: "", categories: [] });
  const [editingSubSection, setEditingSubSection] = useState(null);

  // Load sub-sections from localStorage (in real app, this would be from API)
  useEffect(() => {
    const saved = localStorage.getItem('subSections');
    if (saved) {
      setSubSections(JSON.parse(saved));
    }
  }, []);

  const saveSubSections = (updated) => {
    setSubSections(updated);
    localStorage.setItem('subSections', JSON.stringify(updated));
  };

  const addSubSection = () => {
    if (newSubSection.name.trim()) {
      const updated = [...subSections, { ...newSubSection, id: Date.now() }];
      saveSubSections(updated);
      setNewSubSection({ name: "", categories: [] });
    }
  };

  const updateSubSection = (id, updated) => {
    const index = subSections.findIndex(s => s.id === id);
    if (index !== -1) {
      const updatedList = [...subSections];
      updatedList[index] = updated;
      saveSubSections(updatedList);
      setEditingSubSection(null);
    }
  };

  const deleteSubSection = (id) => {
    const updated = subSections.filter(s => s.id !== id);
    saveSubSections(updated);
  };

  const toggleCategoryInSubSection = (subSectionId, categoryId) => {
    const subSection = subSections.find(s => s.id === subSectionId);
    if (subSection) {
      const categories = subSection.categories.includes(categoryId)
        ? subSection.categories.filter(c => c !== categoryId)
        : [...subSection.categories, categoryId];
      
      updateSubSection(subSectionId, { ...subSection, categories });
    }
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <h1>Sub-Sections Management</h1>
        <p>Create, edit, and manage quiz sub-sections</p>
      </div>

      {/* Add New Sub-Section */}
      <div className={styles.adminCard}>
        <h2>Add New Sub-Section</h2>
        <div className={styles.formGroup}>
          <input
            type="text"
            placeholder="Sub-Section Name"
            value={newSubSection.name}
            onChange={(e) => setNewSubSection({ ...newSubSection, name: e.target.value })}
            className={styles.formInput}
          />
        </div>
        <button onClick={addSubSection} className={styles.primaryButton}>
          Add Sub-Section
        </button>
      </div>

      {/* Existing Sub-Sections */}
      <div className={styles.adminCard}>
        <h2>Existing Sub-Sections</h2>
        {subSections.map((subSection) => (
          <div key={subSection.id} className={styles.subSectionItem}>
            {editingSubSection === subSection.id ? (
              <div className={styles.editForm}>
                <input
                  type="text"
                  value={subSection.name}
                  onChange={(e) => {
                    const updated = subSections.find(s => s.id === subSection.id);
                    updated.name = e.target.value;
                    setSubSections([...subSections]);
                  }}
                  className={styles.formInput}
                />
                <div className={styles.buttonGroup}>
                  <button
                    onClick={() => updateSubSection(subSection.id, subSections.find(s => s.id === subSection.id))}
                    className={styles.successButton}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingSubSection(null)}
                    className={styles.secondaryButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.subSectionHeader}>
                <h3>{subSection.name}</h3>
                <div className={styles.buttonGroup}>
                  <button
                    onClick={() => setEditingSubSection(subSection.id)}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSubSection(subSection.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
            
            {/* Category Assignment */}
            <div className={styles.categoryAssignment}>
              <h4>Assign Categories:</h4>
              <div className={styles.categoryGrid}>
                {quizzes.map((quiz) => (
                  <label key={quiz.id} className={styles.categoryCheckbox}>
                    <input
                      type="checkbox"
                      checked={subSection.categories.includes(quiz.id)}
                      onChange={() => toggleCategoryInSubSection(subSection.id, quiz.id)}
                    />
                    <span>{quiz.topic}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
