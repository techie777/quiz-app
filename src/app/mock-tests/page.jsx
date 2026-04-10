"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/styles/MockTestsHub.module.css'; // I will create this new CSS module

export default function MockTestsHub() {
  const [categories, setCategories] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchHubData() {
      try {
        const res = await fetch('/api/mock-tests/hub');
        const data = await res.json();
        if (data.categories) setCategories(data.categories);
        if (data.exams) setExams(data.exams);
      } catch (error) {
        console.error("Failed to fetch hub data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHubData();
  }, []);

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const matchesSearch = exam.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            exam.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || exam.categoryId === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exams, activeCategory, searchQuery]);

  return (
    <main className={styles.page}>
      
      {/* Header Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Free Mock <span className={styles.textAccent}>Tests</span></h1>
          <p className={styles.subtitle}>Supercharge your Govt Exam preparation with real-time simulations.</p>
          
          <div className={styles.searchWrapper}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.searchIcon}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Search for an exam (e.g. SSC CGL)..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {loading ? (
        <div className={styles.loaderArea}>
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <section className={styles.mainLayout}>
          
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Categories</h3>
            <div className={styles.categoryList}>
              <button 
                className={`${styles.categoryItem} ${activeCategory === 'all' ? styles.activeCategory : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                <span>🌍</span> All Exams
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  className={`${styles.categoryItem} ${activeCategory === cat.id ? styles.activeCategory : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span>{cat.icon}</span> {cat.name}
                </button>
              ))}
            </div>
          </aside>

          {/* Exam Grid */}
          <div className={styles.contentArea}>
            <div className={styles.resultsHeader}>
              <h2>Showing {filteredExams.length} Exams</h2>
            </div>
            
            {filteredExams.length === 0 ? (
              <div className={styles.emptyState}>
                <span className="text-6xl mb-4 block">🔍</span>
                <h3>No Exams Found</h3>
                <p>Try adjusting your search criteria or category filter.</p>
              </div>
            ) : (
              <div className={styles.examGrid}>
                <AnimatePresence>
                  {filteredExams.map((exam, i) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      key={exam.id}
                      className={styles.examCardWrapper}
                    >
                      <Link href={`/mock-tests/${exam.id}`} className={styles.examCard}>
                        <div className={styles.examCardTop}>
                          <div className={styles.iconBox}>{exam.emoji || '📝'}</div>
                          {exam.category && (
                            <span className={styles.cardBadge}>{exam.category.name}</span>
                          )}
                        </div>
                        <h4 className={styles.examName}>{exam.name}</h4>
                        <p className={styles.examDesc}>
                          {exam.description || `Prepare for ${exam.name} with full-length mocks.`}
                        </p>
                        <div className={styles.examFooter}>
                          <div className={styles.testCount}>
                            <span>📋</span> {exam._count?.papers || 0} Tests
                          </div>
                          <div className={styles.viewBtn}>View details →</div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
          
        </section>
      )}
      
      <div className="h-20" />
    </main>
  );
}
