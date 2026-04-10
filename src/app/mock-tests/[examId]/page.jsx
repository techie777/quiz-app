"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import styles from '@/styles/LandingPage.module.css';

export default function PaperSelection() {
  const { examId } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPapers() {
      try {
        const res = await fetch(`/api/mock-tests/${examId}/papers`);
        const data = await res.json();
        if (data && !data.error) {
          setExam(data);
        }
      } catch (error) {
        console.error("Failed to fetch papers:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPapers();
  }, [examId]);

  if (loading) {
    return (
      <main className={styles.page}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Uplinking to Exam Servers...</p>
        </div>
      </main>
    );
  }

  if (!exam) {
    return (
      <main className={styles.page}>
         <div className="max-w-2xl mx-auto py-20 px-6 text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Signal Lost</h2>
            <p className="text-slate-500 mb-8">The requested exam category could not be reached or does not exist.</p>
            <Link href="/mock-tests" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest">
              Back to Hub
            </Link>
         </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
      </div>

      <section className={styles.container}>
        <div className="mb-12">
            <Link href="/mock-tests" className="inline-flex items-center text-indigo-600 font-black text-xs uppercase tracking-widest hover:gap-2 transition-all gap-1 mb-6">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Command Center
            </Link>
            
            <div className="flex gap-4 items-center">
                <div className="text-4xl bg-indigo-50 p-4 rounded-2xl">
                    {exam.emoji || '📝'}
                </div>
                <div>
                   <h1 className="text-4xl font-black text-slate-900">{exam.name}</h1>
                   <p className="text-slate-500 mt-2">{exam.category?.name} • Choose your target paper to begin</p>
                </div>
            </div>
        </div>
        
        {/* Study Portal Link Block */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 mb-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
             {/* decorative circle */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 pointer-events-none" />
             <div className="relative z-10 text-white">
                 <h3 className="text-2xl font-black mb-2 flex items-center gap-2"><span>📚</span> Need to study first?</h3>
                 <p className="text-indigo-200">Prepare thoroughly with our structured FlexBook notes and topic-wise modules designed specifically for {exam.name}.</p>
             </div>
             <div className="relative z-10 flex-shrink-0">
                 <Link href={`/govt-study/${exam.slug}`} className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors inline-block whitespace-nowrap">
                     Explore Study Material
                 </Link>
             </div>
        </div>

        {/* Papers List */}
        <div className="mb-16">
          {exam.papers?.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
              <span className="text-4xl mb-4 block">⌛</span>
              <p className="text-slate-500 font-bold">New papers are being drafted. Check back shortly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {exam.papers?.map((paper, index) => (
                <motion.div
                  key={paper.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-900 mb-2">{paper.title}</h3>
                      <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                              <span className="text-lg">⏱️</span> {paper.timeLimit} Mins
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                              <span className="text-lg">🎯</span> {paper._count?.questions || 0} Questions
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                              <span className="text-lg">📈</span> {paper.totalMarks} Marks
                          </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden lg:block text-right mr-4">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Marking Scheme</p>
                          <p className="text-xs font-black text-slate-600">+{paper.positiveMarking} / -{paper.negativeMarking}</p>
                      </div>
                      <Link 
                          href={`/mock-tests/paper/${paper.id}/instructions`}
                          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-200 text-center"
                      >
                          START TEST
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* SEO Informative Content Layer */}
        {exam.sections && exam.sections.length > 0 && (
           <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 prose prose-slate max-w-none">
             {exam.sections.map((section) => (
                <div key={section.id} className="mb-10 last:mb-0">
                   <h2 className="text-3xl font-black text-slate-900 border-b-2 border-indigo-50 pb-4 mb-6">{section.title}</h2>
                   {/* We will dangerously output HTML generated from admin */}
                   <div 
                      className="text-slate-600 leading-relaxed space-y-4"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                   />
                </div>
             ))}
           </div>
        )}
      </section>

      <div className="h-20" />
    </main>
  );
}
