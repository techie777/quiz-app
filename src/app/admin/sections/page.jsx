"use client";

import { useState, useEffect, useRef } from "react";
import { useData } from "@/context/DataContext";
import styles from "@/styles/Admin.module.css";

export default function SectionsAdmin() {
  const { quizzes } = useData();
  const [sections, setSections] = useState([]);
  const [subSections, setSubSections] = useState([]);
  const [editingSection, setEditingSection] = useState(null);
  const [editingSubSection, setEditingSubSection] = useState(null);
  const [newSection, setNewSection] = useState({ name: "", isVisible: true });
  const [newSubSection, setNewSubSection] = useState({ name: "", sectionId: "", isVisible: true, quizIds: [] });
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverItem, setDraggedOverItem] = useState(null);
  const [draggedQuiz, setDraggedQuiz] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [collapsedSubSections, setCollapsedSubSections] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [showNewSubSectionForm, setShowNewSubSectionForm] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  // Load sections and sub-sections from DB
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/sections');
      if (res.ok) {
        const data = await res.json();
        setSections(data);
        // Flatten sub-sections for local state management
        const allSubSections = data.flatMap(s => s.subSections || []);
        setSubSections(allSubSections);
      }
    } catch (error) {
      console.error("Failed to fetch sections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToDb = async (updatedSections, updatedSubSections) => {
    setIsSaving(true);
    // Map sections to include their sub-sections for the bulk save API
    const dataToSave = updatedSections.map(s => ({
      ...s,
      subSections: updatedSubSections.filter(sub => String(sub.sectionId) === String(s.id))
    }));

    try {
      const res = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: dataToSave })
      });
      if (res.ok) {
        // Refresh data to get real IDs from DB
        await fetchSections();
      }
    } catch (error) {
      console.error("Failed to save sections:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSections = (updated) => {
    setSections(updated);
    saveToDb(updated, subSections);
  };

  const saveSubSections = (updated) => {
    setSubSections(updated);
    saveToDb(sections, updated);
  };

  // Section management
  const addSection = () => {
    if (newSection.name.trim()) {
      const updated = [...sections, { 
        ...newSection, 
        id: `temp-${Date.now()}`, 
        order: sections.length + 1 
      }];
      saveSections(updated);
      setNewSection({ name: "", isVisible: true });
      setShowNewSectionForm(false);
    }
  };

  const updateSection = (id, updated) => {
    const index = sections.findIndex(s => s.id === id);
    if (index !== -1) {
      const updatedList = [...sections];
      updatedList[index] = updated;
      saveSections(updatedList);
      setEditingSection(null);
    }
  };

  const deleteSection = (id) => {
    const section = sections.find(s => s.id === id);
    if (!section) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the section "${section.name}"?\n\nThis action cannot be undone and will also delete all sub-sections within this section.`
    );
    
    if (confirmDelete) {
      const updated = sections.filter(s => s.id !== id);
      const updatedSubSections = subSections.filter(sub => String(sub.sectionId) !== String(id));
      
      setSections(updated);
      setSubSections(updatedSubSections);
      saveToDb(updated, updatedSubSections);
    }
  };

  const toggleSectionVisibility = (id) => {
    const updated = sections.map(s => 
      s.id === id ? { ...s, isVisible: !s.isVisible } : s
    );
    saveSections(updated);
  };

  // Sub-section management
  const addSubSection = () => {
    if (newSubSection.name.trim() && newSubSection.sectionId) {
      const updated = [...subSections, { 
        ...newSubSection, 
        id: `temp-${Date.now()}`, 
        order: subSections.length + 1 
      }];
      saveSubSections(updated);
      setNewSubSection({ name: "", sectionId: "", isVisible: true, quizIds: [] });
      setShowNewSubSectionForm(false);
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
    const subSection = subSections.find(s => s.id === id);
    if (!subSection) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the sub-section "${subSection.name}"?\n\nThis action cannot be undone and will remove all quiz assignments for this sub-section.`
    );
    
    if (confirmDelete) {
      const updated = subSections.filter(s => s.id !== id);
      saveSubSections(updated);
    }
  };

  const toggleSubSectionVisibility = (id) => {
    const updated = subSections.map(s => 
      s.id === id ? { ...s, isVisible: !s.isVisible } : s
    );
    saveSubSections(updated);
  };

  // Toggle Collapse
  const toggleSectionCollapse = (id) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSubSectionCollapse = (id) => {
    setCollapsedSubSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Quiz assignment
  const toggleQuizInSubSection = (subSectionId, quizId) => {
    const subSection = subSections.find(s => s.id === subSectionId);
    if (subSection) {
      const quizIds = subSection.quizIds.includes(quizId)
        ? subSection.quizIds.filter(id => id !== quizId)
        : [...subSection.quizIds, quizId];
      
      updateSubSection(subSectionId, { ...subSection, quizIds });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, item, type) => {
    setDraggedItem({ ...item, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, item, type) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverItem({ ...item, type });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverItem(null);
    setDraggedQuiz(null);
  };

  const handleDrop = (e, targetItem, targetType) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.type !== targetType) return;

    if (targetType === 'section') {
      const updatedSections = [...sections];
      const draggedIndex = updatedSections.findIndex(s => s.id === draggedItem.id);
      const targetIndex = updatedSections.findIndex(s => s.id === targetItem.id);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = updatedSections.splice(draggedIndex, 1);
        updatedSections.splice(targetIndex, 0, removed);
        
        // Update order
        updatedSections.forEach((section, index) => {
          section.order = index + 1;
        });
        
        saveSections(updatedSections);
      }
    } else if (targetType === 'subSection') {
      const updatedSubSections = [...subSections];
      const draggedIndex = updatedSubSections.findIndex(s => s.id === draggedItem.id);
      const targetIndex = updatedSubSections.findIndex(s => s.id === targetItem.id);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = updatedSubSections.splice(draggedIndex, 1);
        updatedSubSections.splice(targetIndex, 0, removed);
        
        // Update order
        updatedSubSections.forEach((subSection, index) => {
          subSection.order = index + 1;
        });
        
        saveSubSections(updatedSubSections);
      }
    }
    
    handleDragEnd();
  };

  // Quiz Drag and Drop
  const handleQuizDragStart = (e, subSectionId, index) => {
    setDraggedQuiz({ subSectionId, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleQuizDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleQuizDrop = (e, subSectionId, targetIndex) => {
    e.preventDefault();
    if (!draggedQuiz || draggedQuiz.subSectionId !== subSectionId) return;

    const subSection = subSections.find(s => s.id === subSectionId);
    if (!subSection) return;

    const updatedQuizIds = [...subSection.quizIds];
    const [removed] = updatedQuizIds.splice(draggedQuiz.index, 1);
    updatedQuizIds.splice(targetIndex, 0, removed);

    updateSubSection(subSectionId, { ...subSection, quizIds: updatedQuizIds });
    setDraggedQuiz(null);
  };

  const getSubSectionsForSection = (sectionId) => {
    return subSections
      .filter(sub => sub.sectionId === sectionId)
      .sort((a, b) => a.order - b.order);
  };

  const getQuizzesForSubSection = (subSectionId) => {
    const subSection = subSections.find(s => s.id === subSectionId);
    if (!subSection) return [];
    // Important: Return quizzes in the order of quizIds
    return subSection.quizIds
      .map(id => quizzes.find(q => q.id === id))
      .filter(Boolean);
  };

  if (isLoading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.adminHeader}>
          <h1>Sections Management</h1>
          <p>Loading sections configuration...</p>
        </div>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <h1>Sections Management</h1>
        <p>Create, edit, and manage sections and sub-sections with drag-and-drop functionality</p>
      </div>

      <div className={styles.adminActions}>
        <button 
          onClick={() => setShowNewSectionForm(!showNewSectionForm)} 
          className={styles.primaryButton}
        >
          {showNewSectionForm ? "✕ Cancel" : "+ Add New Section"}
        </button>
        {isSaving && <div className={styles.savingIndicator}>Saving changes...</div>}
      </div>

      {/* Add New Section Modal-like area */}
      {showNewSectionForm && (
        <div className={styles.adminCard}>
          <h2>New Section</h2>
          <div className={styles.formGroupInline}>
            <input
              type="text"
              placeholder="Section Name"
              value={newSection.name}
              onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
              className={styles.formInput}
              autoFocus
            />
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={newSection.isVisible}
                onChange={(e) => setNewSection({ ...newSection, isVisible: e.target.checked })}
              />
              Visible
            </label>
            <button onClick={addSection} className={styles.successButton}>
              Save Section
            </button>
          </div>
        </div>
      )}

      {/* Existing Sections */}
      <div className={styles.sectionsList}>
        {sections.sort((a, b) => a.order - b.order).map((section) => (
          <div
            key={section.id}
            className={`${styles.sectionItem} ${!section.isVisible ? styles.hidden : ''} ${draggedItem?.id === section.id ? styles.dragging : ''}`}
            onDragOver={(e) => handleDragOver(e, section, 'section')}
            onDrop={(e) => handleDrop(e, section, 'section')}
          >
            <div 
              className={styles.dragHandle}
              draggable
              onDragStart={(e) => handleDragStart(e, section, 'section')}
              onDragEnd={handleDragEnd}
            >
              ⋮⋮
            </div>
            
            <div className={styles.sectionContent}>
              {editingSection === section.id ? (
                <div className={styles.editForm}>
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) => {
                      const updated = sections.map(s => s.id === section.id ? { ...s, name: e.target.value } : s);
                      setSections(updated);
                    }}
                    className={styles.formInput}
                  />
                  <div className={styles.buttonGroup}>
                    <button
                      onClick={() => updateSection(section.id, sections.find(s => s.id === section.id))}
                      className={styles.successButton}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSection(null)}
                      className={styles.secondaryButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.sectionHeader}>
                  <div className={styles.headerLeft}>
                    <button 
                      className={`${styles.collapseBtn} ${collapsedSections.has(section.id) ? styles.collapsed : ''}`}
                      onClick={() => toggleSectionCollapse(section.id)}
                      title={collapsedSections.has(section.id) ? "Expand Section" : "Collapse Section"}
                    >
                      {collapsedSections.has(section.id) ? '▶' : '▼'}
                    </button>
                    <h3>{section.name}</h3>
                  </div>
                  <div className={styles.buttonGroup}>
                    <button
                      onClick={() => setEditingSection(section.id)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleSectionVisibility(section.id)}
                      className={`${styles.visibilityButton} ${!section.isVisible ? styles.hidden : ''}`}
                    >
                      {section.isVisible ? '👁️' : '🙈'}
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
              
              {/* Sub-sections for this section */}
              <div className={`${styles.subSectionsList} ${collapsedSections.has(section.id) ? styles.collapsed : ''}`}>
                {getSubSectionsForSection(section.id).map((subSection) => (
                  <div
                    key={subSection.id}
                    className={`${styles.subSectionItem} ${!subSection.isVisible ? styles.hidden : ''} ${draggedItem?.id === subSection.id ? styles.dragging : ''}`}
                    onDragOver={(e) => handleDragOver(e, subSection, 'subSection')}
                    onDrop={(e) => handleDrop(e, subSection, 'subSection')}
                  >
                    <div 
                      className={styles.dragHandleSub}
                      draggable
                      onDragStart={(e) => handleDragStart(e, subSection, 'subSection')}
                      onDragEnd={handleDragEnd}
                    >
                      ⋮⋮
                    </div>
                    
                    <div className={styles.subSectionContent}>
                      <div className={styles.subSectionHeader}>
                        <div className={styles.headerLeft}>
                          <button 
                            className={`${styles.collapseBtn} ${collapsedSubSections.has(subSection.id) ? styles.collapsed : ''}`}
                            onClick={() => toggleSubSectionCollapse(subSection.id)}
                            title={collapsedSubSections.has(subSection.id) ? "Expand Sub-section" : "Collapse Sub-section"}
                          >
                            {collapsedSubSections.has(subSection.id) ? '▶' : '▼'}
                          </button>
                          <h4>{subSection.name}</h4>
                        </div>
                        <div className={styles.buttonGroup}>
                          <button
                            onClick={() => setEditingSubSection(subSection.id)}
                            className={styles.editButton}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleSubSectionVisibility(subSection.id)}
                            className={`${styles.visibilityButton} ${!subSection.isVisible ? styles.hidden : ''}`}
                          >
                            {subSection.isVisible ? '👁️' : '🙈'}
                          </button>
                          <button
                            onClick={() => deleteSubSection(subSection.id)}
                            className={styles.deleteButton}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      {/* Assigned Quizzes Reordering */}
                      <div className={`${styles.quizAssignment} ${collapsedSubSections.has(subSection.id) ? styles.collapsed : ''}`}>
                        <div className={styles.assignmentHeader}>
                          <h5>Assigned Quizzes ({subSection.quizIds.length})</h5>
                        </div>
                        
                        {subSection.quizIds.length > 0 && (
                          <div className={styles.assignedQuizzesList}>
                            {getQuizzesForSubSection(subSection.id).map((quiz, index) => (
                              <div
                                key={quiz.id}
                                className={`${styles.assignedQuizItem} ${draggedQuiz?.index === index && draggedQuiz?.subSectionId === subSection.id ? styles.dragging : ''}`}
                                draggable
                                onDragStart={(e) => handleQuizDragStart(e, subSection.id, index)}
                                onDragOver={handleQuizDragOver}
                                onDrop={(e) => handleQuizDrop(e, subSection.id, index)}
                                onDragEnd={handleDragEnd}
                              >
                                <span className={styles.dragHandleMini}>⋮⋮</span>
                                <span className={styles.assignedQuizName}>{quiz.topic}</span>
                                <button 
                                  className={styles.removeQuizBtn}
                                  onClick={() => toggleQuizInSubSection(subSection.id, quiz.id)}
                                  title="Remove Quiz"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className={styles.availableQuizzesSection}>
                          <h6 className={styles.availableHeader}>Available Quizzes (Check to assign)</h6>
                          <div className={styles.quizGrid}>
                            {quizzes.map((quiz) => (
                              <label key={quiz.id} className={styles.quizCheckbox}>
                                <input
                                  type="checkbox"
                                  checked={subSection.quizIds.includes(quiz.id)}
                                  onChange={() => toggleQuizInSubSection(subSection.id, quiz.id)}
                                />
                                <span>{quiz.topic}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className={styles.subSectionAction}>
                  <button 
                    onClick={() => {
                      setNewSubSection({ ...newSubSection, sectionId: section.id });
                      setShowNewSubSectionForm(section.id);
                    }} 
                    className={styles.secondaryButton}
                  >
                    + Add Sub-section
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Sub-Section Modal-like area */}
      {showNewSubSectionForm && (
        <div className={styles.adminCard}>
          <h2>Add New Sub-Section to {sections.find(s => s.id === showNewSubSectionForm)?.name}</h2>
          <div className={styles.formGroupInline}>
            <input
              type="text"
              placeholder="Sub-Section Name"
              value={newSubSection.name}
              onChange={(e) => setNewSubSection({ ...newSubSection, name: e.target.value })}
              className={styles.formInput}
              autoFocus
            />
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={newSubSection.isVisible}
                onChange={(e) => setNewSubSection({ ...newSubSection, isVisible: e.target.checked })}
              />
              Visible
            </label>
            <div className={styles.buttonGroup}>
              <button onClick={addSubSection} className={styles.successButton}>
                Save Sub-Section
              </button>
              <button onClick={() => setShowNewSubSectionForm(false)} className={styles.secondaryButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
