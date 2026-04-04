"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import styles from "@/styles/GovtExamManagement.module.css";

export default function GovtExamManagement() {
  const [exams, setExams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('exams'); // 'exams' or 'categories'
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    organization: "",
    governmentType: "Central Govt",
    vacancies: "",
    postNames: "",
    qualification: "",
    ageLimit: "",
    eligibility: "",
    startDate: "",
    lastDate: "",
    quota: {
      gen: 0,
      sc: 0,
      st: 0,
      obc: 0
    },
    syllabus: "",
    applicationFee: "",
    officialWebsite: "",
    description: "",
    status: "active"
  });

  const [categoryFormData, setCategoryFormData] = useState({
    id: "",
    name: "",
    icon: ""
  });

  // Load data from MongoDB on mount
  useEffect(() => {
    fetchExams();
    fetchCategories();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/govt-exams');
      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || data);
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
      // Fallback to localStorage
      const storedExams = localStorage.getItem('govtExams');
      if (storedExams) {
        setExams(JSON.parse(storedExams));
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/exam-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Fallback to localStorage
      const storedCategories = localStorage.getItem('examCategories');
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        // Default categories if none exist
        const defaultCategories = [
          { id: "banking", name: "Banking", icon: "🏦" },
          { id: "railway", name: "Railway", icon: "🚂" },
          { id: "defence", name: "Defence", icon: "🎖️" },
          { id: "teaching", name: "Teaching", icon: "👨‍🏫" },
          { id: "engineering", name: "Engineering", icon: "⚙️" },
          { id: "medical", name: "Medical", icon: "🏥" },
          { id: "civil", name: "Civil Services", icon: "🏛️" }
        ];
        setCategories(defaultCategories);
      }
    }
  };

  const saveExamsToStorage = (data) => {
    // Save to both localStorage and MongoDB
    localStorage.setItem('govtExams', JSON.stringify(data));
    // MongoDB saves are handled by API calls
  };

  const saveCategoriesToStorage = (data) => {
    // Save to both localStorage and MongoDB
    localStorage.setItem('examCategories', JSON.stringify(data));
    // MongoDB saves are handled by API calls
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('quota.')) {
      const quotaField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        quota: {
          ...prev.quota,
          [quotaField]: parseInt(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (editingExam) {
        // Update existing exam
        response = await fetch('/api/govt-exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        // Add new exam
        response = await fetch('/api/govt-exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      if (response.ok) {
        await fetchExams(); // Refresh data
        resetExamForm();
      } else {
        const error = await response.json();
        alert('Failed to save exam: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving exam:', error);
      alert('Failed to save exam. Please try again.');
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (editingCategory) {
        // Update existing category
        response = await fetch('/api/exam-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryFormData)
        });
      } else {
        // Add new category
        response = await fetch('/api/exam-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryFormData)
        });
      }

      if (response.ok) {
        await fetchCategories(); // Refresh data
        resetCategoryForm();
      } else {
        const error = await response.json();
        alert('Failed to save category: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category. Please try again.');
    }
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setFormData(exam);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData(category);
    setIsCategoryModalOpen(true);
  };

  const handleDelete = async (examId) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      try {
        const response = await fetch(`/api/govt-exams?id=${examId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await fetchExams(); // Refresh data
        } else {
          const error = await response.json();
          alert('Failed to delete exam: ' + (error.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Failed to delete exam. Please try again.');
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const response = await fetch(`/api/exam-categories?id=${categoryId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchCategories(); // Refresh data
      } else {
        const error = await response.json();
        if (error.error && error.error.includes('exams in this category')) {
          alert('Cannot delete category. There are exams in this category. Please delete or reassign exams first.');
        } else {
          alert('Failed to delete category: ' + (error.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  const resetExamForm = () => {
    setFormData({
      title: "",
      category: "",
      organization: "",
      governmentType: "Central Govt",
      vacancies: "",
      postNames: "",
      qualification: "",
      ageLimit: "",
      eligibility: "",
      startDate: "",
      lastDate: "",
      quota: {
        gen: 0,
        sc: 0,
        st: 0,
        obc: 0
      },
      syllabus: "",
      applicationFee: "",
      officialWebsite: "",
      description: "",
      status: "active"
    });
    setEditingExam(null);
    setIsModalOpen(false);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      id: "",
      name: "",
      icon: ""
    });
    setEditingCategory(null);
    setIsCategoryModalOpen(false);
  };

  const filteredExams = exams.filter(exam => exam.status !== 'deleted');

  const iconOptions = [
    "🏦", "🚂", "🎖️", "👨‍🏫", "⚙️", "🏥", "🏛️", 
    "🏢", "🏭", "🌾", "🏛️", "🏨", "🏪", "🏬", "🏭"
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.title}>Government Exam Management</h1>
          <p className={styles.subtitle}>Manage government job exams and categories</p>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'exams' ? styles.active : ''}`}
          onClick={() => setActiveTab('exams')}
        >
          📋 Exams ({filteredExams.length})
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'categories' ? styles.active : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          📁 Categories ({categories.length})
        </button>
      </div>

      {/* Exams Tab */}
      {activeTab === 'exams' && (
        <>
          <div className={styles.actions}>
            <button 
              className={styles.addButton}
              onClick={() => setIsModalOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add New Exam
            </button>
            
            <div className={styles.stats}>
              <span className={styles.statItem}>
                Total Exams: <strong>{filteredExams.length}</strong>
              </span>
              <span className={styles.statItem}>
                Active: <strong>{filteredExams.filter(e => e.status === 'active').length}</strong>
              </span>
            </div>
          </div>

          <div className={styles.examGrid}>
            {filteredExams.map((exam, index) => (
              <motion.div
                key={exam.id}
                className={styles.examCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className={styles.examHeader}>
                  <div className={styles.examInfo}>
                    <h3 className={styles.examTitle}>{exam.title}</h3>
                    <div className={styles.examMeta}>
                      <span className={`${styles.category} ${exam.category}`}>
                        {categories.find(cat => cat.id === exam.category)?.icon} {categories.find(cat => cat.id === exam.category)?.name}
                      </span>
                      <span className={`${styles.govtType} ${exam.governmentType.toLowerCase().replace(' ', '-')}`}>
                        {exam.governmentType}
                      </span>
                    </div>
                  </div>
                  <div className={styles.examActions}>
                    <button 
                      className={styles.editButton}
                      onClick={() => handleEdit(exam)}
                      title="Edit Exam"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 0L12 15l-4 1 1-4 2.5a2.121 2.121 0 013 0z"/>
                      </svg>
                    </button>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDelete(exam.id)}
                      title="Delete Exam"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className={styles.examDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Organization:</span>
                    <span className={styles.value}>{exam.organization}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Vacancies:</span>
                    <span className={styles.value}>{exam.vacancies}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Last Date:</span>
                    <span className={styles.value}>
                      {new Date(exam.lastDate).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Status:</span>
                    <span className={`${styles.status} ${exam.status}`}>
                      {exam.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <>
          <div className={styles.actions}>
            <button 
              className={styles.addButton}
              onClick={() => setIsCategoryModalOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add New Category
            </button>
            
            <div className={styles.stats}>
              <span className={styles.statItem}>
                Total Categories: <strong>{categories.length}</strong>
              </span>
            </div>
          </div>

          <div className={styles.categoryGrid}>
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                className={styles.categoryCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryIconLarge}>{category.icon}</span>
                    <h3 className={styles.categoryName}>{category.name}</h3>
                  </div>
                  <div className={styles.categoryActions}>
                    <button 
                      className={styles.editButton}
                      onClick={() => handleEditCategory(category)}
                      title="Edit Category"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 0L12 15l-4 1 1-4 2.5a2.121 2.121 0 013 0z"/>
                      </svg>
                    </button>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDeleteCategory(category.id)}
                      title="Delete Category"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className={styles.categoryDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>ID:</span>
                    <span className={styles.value}>{category.id}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Exams:</span>
                    <span className={styles.value}>
                      {exams.filter(exam => exam.category === category.id).length}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Exam Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={resetExamForm}>
          <motion.div 
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingExam ? 'Edit Exam' : 'Add New Exam'}
              </h2>
              <button className={styles.modalClose} onClick={resetExamForm}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Exam Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={styles.select}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Organization *</label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Government Type *</label>
                  <select
                    name="governmentType"
                    value={formData.governmentType}
                    onChange={handleInputChange}
                    className={styles.select}
                    required
                  >
                    <option value="Central Govt">Central Government</option>
                    <option value="State Govt">State Government</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Vacancies *</label>
                  <input
                    type="text"
                    name="vacancies"
                    value={formData.vacancies}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="e.g., 1500 or Various"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Post Names</label>
                  <textarea
                    name="postNames"
                    value={formData.postNames}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    rows="2"
                    placeholder="e.g., Assistant, Auditor, Accountant"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Educational Qualification *</label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Age Limit</label>
                  <input
                    type="text"
                    name="ageLimit"
                    value={formData.ageLimit}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="e.g., 18-30 years"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Additional Requirements</label>
                  <textarea
                    name="eligibility"
                    value={formData.eligibility}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    rows="2"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Last Date *</label>
                    <input
                      type="date"
                      name="lastDate"
                      value={formData.lastDate}
                      onChange={handleInputChange}
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

                <div className={styles.quotaSection}>
                  <label className={styles.label}>Quota Distribution</label>
                  <div className={styles.quotaGrid}>
                    <div className={styles.quotaItem}>
                      <label>GEN</label>
                      <input
                        type="number"
                        name="quota.gen"
                        value={formData.quota.gen}
                        onChange={handleInputChange}
                        className={styles.quotaInput}
                        min="0"
                      />
                    </div>
                    <div className={styles.quotaItem}>
                      <label>SC</label>
                      <input
                        type="number"
                        name="quota.sc"
                        value={formData.quota.sc}
                        onChange={handleInputChange}
                        className={styles.quotaInput}
                        min="0"
                      />
                    </div>
                    <div className={styles.quotaItem}>
                      <label>ST</label>
                      <input
                        type="number"
                        name="quota.st"
                        value={formData.quota.st}
                        onChange={handleInputChange}
                        className={styles.quotaInput}
                        min="0"
                      />
                    </div>
                    <div className={styles.quotaItem}>
                      <label>OBC</label>
                      <input
                        type="number"
                        name="quota.obc"
                        value={formData.quota.obc}
                        onChange={handleInputChange}
                        className={styles.quotaInput}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Syllabus</label>
                  <textarea
                    name="syllabus"
                    value={formData.syllabus}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    rows="3"
                    placeholder="e.g., General Intelligence, Reasoning, Quantitative Aptitude"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Application Fee</label>
                  <input
                    type="text"
                    name="applicationFee"
                    value={formData.applicationFee}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="e.g., General: ₹100, SC/ST: ₹0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Official Website</label>
                  <input
                    type="url"
                    name="officialWebsite"
                    value={formData.officialWebsite}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="https://example.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    rows="3"
                    placeholder="Brief description of exam and recruitment details"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton}>
                  {editingExam ? 'Update Exam' : 'Add Exam'}
                </button>
                <button type="button" onClick={resetExamForm} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className={styles.modalOverlay} onClick={resetCategoryForm}>
          <motion.div 
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button className={styles.modalClose} onClick={resetCategoryForm}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={categoryFormData.name}
                    onChange={handleCategoryInputChange}
                    className={styles.input}
                    placeholder="e.g., Banking"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Category Icon *</label>
                  <select
                    name="icon"
                    value={categoryFormData.icon}
                    onChange={handleCategoryInputChange}
                    className={styles.select}
                    required
                  >
                    <option value="">Select Icon</option>
                    {iconOptions.map(icon => (
                      <option key={icon} value={icon}>
                        {icon} {icon}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton}>
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                <button type="button" onClick={resetCategoryForm} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
