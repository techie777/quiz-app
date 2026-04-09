"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from '@/styles/LandingPage.module.css';

export default function MockTestsHub() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExams() {
      try {
        const res = await fetch('/api/mock-tests/hub');
        const data = await res.json();
        if (Array.isArray(data)) {
          setExams(data);
        }
      } catch (error) {
        console.error("Failed to fetch exams:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchExams();
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
      </div>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <motion.h1 
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Mock Test <span className={styles.heroTitleAccent}>Command Center</span>
          </motion.h1>
          <motion.p 
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            High-fidelity exam simulations with real-time feedback and detailed performance analytics.
          </motion.p>
        </div>
      </section>

      <section className={styles.container}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Hydrating Exam Metadata...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xl max-w-2xl mx-auto">
            <span className="text-6xl mb-6 block">🚧</span>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Hangar is Empty</h2>
            <p className="text-slate-500 mb-8">No mock exams have been deployed yet. The flight crew is preparing the first sets.</p>
            <Link href="/" className="inline-flex bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">
              Return to Base
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/mock-tests/${exam.id}`} className="block h-full group">
                  <div className="bg-white rounded-[2.5rem] p-8 border border-white shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all h-full flex flex-col relative overflow-hidden">
                    {/* Floating Accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors" />
                    
                    <div className="relative z-10">
                      <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">
                        {exam.emoji}
                      </div>
                      
                      <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                        {exam.name}
                      </h3>
                      
                      <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1">
                        {exam.description || `Prepare for ${exam.name} with our full-length timed mock tests.`}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                        <span className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-100">
                          {exam._count?.papers || 0} TESTS AVAILABLE
                        </span>
                        
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform shadow-lg">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Internal Padding */}
      <div className="h-20" />
    </main>
  );
}
