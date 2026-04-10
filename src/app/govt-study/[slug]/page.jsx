"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/styles/GovtStudy.module.css';

export default function StudyMaterialDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [openSubjects, setOpenSubjects] = useState({});

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/govt-study/${slug}`);
        const data = await res.json();
        if (data && !data.error) {
          setMaterial(data);
          // Open first subject by default
          if (data.subjects && data.subjects.length > 0) {
            setOpenSubjects({ [data.subjects[0].id]: true });
          }
        }
      } catch (error) {
        console.error("Failed to fetch material:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [slug]);

  const toggleSubject = (subjectId) => {
    setOpenSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading FlexBook...</p>
        </div>
      </main>
    );
  }

  if (!material) {
    return (
      <main className={styles.page}>
         <div className="max-w-2xl mx-auto py-20 px-6 text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Book Not Found</h2>
            <Link href="/govt-study" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest">
              Back to Library
            </Link>
         </div>
      </main>
    );
  }

  // Find the first chapter to link the "Start" button to
  let firstChapterLink = "#";
  if (material.subjects?.[0]?.chapters?.[0]) {
    firstChapterLink = `/govt-study/${slug}/${material.subjects[0].chapters[0].slug}`;
  }

  return (
    <main className={styles.page}>
      
      {/* Header aligned with CK-12 FlexBook Style */}
      <div className={styles.bookHeader}>
        <div className={styles.bookCover}>
          {material.image ? (
            <img src={material.image} alt={material.name} />
          ) : (
            <div className={styles.bookCoverFallback}>📚</div>
          )}
        </div>
        <div className={styles.bookInfo}>
          <h1 className={styles.bookTitle}>{material.name}</h1>
          <div className={styles.bookMeta}>
            By <strong>{material.authors || "Admin"}</strong> | Aligned to: {material.alignedTo || "Various"}
          </div>
          <div className={styles.tagPublished}>Published</div>
          <p className={styles.bookDescription}>
            {material.description || `Comprehensive FlexBook® covering core concepts for ${material.alignedTo}.`}
          </p>
          <div className={styles.actionRow}>
            {firstChapterLink !== "#" && (
              <Link href={firstChapterLink} className={styles.startBtn}>
                Start
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <div 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </div>
        <div 
          className={`${styles.tab} ${activeTab === 'details' ? styles.active : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl">
        {activeTab === 'overview' && (
          <div>
            {material.subjects?.map((subject, sIdx) => (
              <div key={subject.id} className={styles.subjectBlock}>
                <div 
                  className={styles.subjectHeader}
                  onClick={() => toggleSubject(subject.id)}
                >
                  <span>{sIdx + 1}. {subject.name}</span>
                  <span>{openSubjects[subject.id] ? '▲' : '▼'}</span>
                </div>
                
                <AnimatePresence>
                  {openSubjects[subject.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-white"
                    >
                      <ul className={styles.chapterList}>
                        {subject.chapters?.map((chapter, cIdx) => (
                          <li key={chapter.id} className={styles.chapterItem}>
                            <Link href={`/govt-study/${slug}/${chapter.slug}`} className={styles.chapterLink}>
                              <div className={styles.chapterNumber}>{sIdx + 1}.{cIdx + 1}</div>
                              <span>{chapter.title}</span>
                            </Link>
                          </li>
                        ))}
                        {(!subject.chapters || subject.chapters.length === 0) && (
                          <li className="p-4 text-slate-500 text-sm italic">Sections being published...</li>
                        )}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="bg-white p-8 rounded-xl border border-slate-200">
             <h3 className="text-xl font-bold mb-4">About this Material</h3>
             <p className="text-slate-600 leading-relaxed mb-6">
                This study material provides an in-depth focus on the concepts required for the {material.alignedTo} examination. 
                Complete all chapters and the corresponding practice tests to maximize your score.
             </p>
          </div>
        )}
      </div>

    </main>
  );
}
