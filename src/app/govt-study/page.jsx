"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from '@/styles/GovtStudy.module.css';

export default function GovtStudyHub() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const res = await fetch('/api/govt-study');
        const data = await res.json();
        if (Array.isArray(data)) {
          setMaterials(data);
        }
      } catch (error) {
        console.error("Failed to fetch study materials:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMaterials();
  }, []);

  return (
    <main className={styles.page}>
      
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Govt Exam <span className="text-emerald-600">Study Material</span></h1>
        <p className="text-slate-500">Comprehensive, structured FlexBook guides for your exam preparation.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
          <span className="text-4xl mb-4 block">📚</span>
          <p className="text-slate-500 font-bold">New study materials are being prepared. Check back shortly.</p>
        </div>
      ) : (
        <div className={styles.bookGrid}>
          {materials.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/govt-study/${book.slug}`} className={styles.bookCard}>
                <div className={styles.bookCardCover}>
                  {book.image ? <img src={book.image} alt={book.name} className="w-full h-full object-cover" /> : '📚'}
                </div>
                <div className={styles.bookCardBody}>
                  <h3 className={styles.bookCardTitle}>{book.name}</h3>
                  <p className={styles.bookCardDesc}>{book.description || `Comprehensive guide for ${book.alignedTo || 'Govt Exams'}`}</p>
                  <div className={styles.bookCardFooter}>
                    View FlexBook →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

    </main>
  );
}
