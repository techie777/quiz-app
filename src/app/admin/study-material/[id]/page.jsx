"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from '@/styles/GovtExamManagement.module.css';

export default function StudyBuilder() {
  const { id } = useParams();
  const router = useRouter();
  
  const [subjects, setSubjects] = useState([]);
  const [mockPapers, setMockPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  
  const [subjectForm, setSubjectForm] = useState({ id: '', name: '', sortOrder: 0, materialId: id });
  const [chapterForm, setChapterForm] = useState({ id: '', title: '', slug: '', content: '', videoId: '', sortOrder: 0, subjectId: '', practiceId: '', readTime: '15 Mins', endQuiz: '' });

  useEffect(() => {
    fetchData();
    fetchMockPapers();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/study-hierarchy?materialId=${id}`);
      if (res.ok) setSubjects(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMockPapers = async () => {
    // We fetch a flat list of basic paper details to link to chapters
    try {
      const res = await fetch('/api/admin/papers/basic'); 
      // If we don't have this, we degrade gracefully and just don't show the dropdown.
      // But we better query all papers. Let's make an ad-hoc query here or just leave it empty if API is missing.
      if (res.ok) setMockPapers(await res.json());
    } catch (e) {
      console.log('No paper API yet, dropdown will be empty');
    }
  };

  const handleAction = async (action, payload) => {
    try {
      const res = await fetch('/api/admin/study-hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      if (res.ok) {
        setIsSubjectModalOpen(false);
        setIsChapterModalOpen(false);
        fetchData();
      } else {
        alert("Action failed");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSubject = (subId) => {
    if (confirm('Delete this Subject and ALL its chapters?')) {
      handleAction('deleteSubject', { id: subId });
    }
  };

  const deleteChapter = (chId) => {
    if (confirm('Delete this Chapter?')) {
      handleAction('deleteChapter', { id: chId });
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className="flex justify-between items-center w-full">
          <div>
            <Link href="/admin/study-material" className="text-emerald-600 mb-2 inline-block font-bold">← Back to Library</Link>
            <h1 className={styles.title}>FlexBook Builder</h1>
            <p className={styles.subtitle}>Structure book chapters, estimated read times, end quizzes, and mock practice sets.</p>
          </div>
          <Link 
            href="/govt-exams/ssc-cgl" 
            target="_blank"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-xl shadow-md transition flex items-center gap-2"
          >
            👁️ View Student Digital Reader
          </Link>
        </div>
      </header>

      <div className="mb-8 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
         <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Table of Contents & Assessment Blueprint</h2>
            <button 
               className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold"
               onClick={() => {
                  setSubjectForm({ id: '', name: '', sortOrder: 0, materialId: id });
                  setIsSubjectModalOpen(true);
               }}
            >
               + Add Subject Division
            </button>
         </div>
      </div>

      {loading ? (
         <div className="p-10 text-center text-slate-500 font-bold">Loading Builder Map...</div>
      ) : (
         <div className="space-y-6">
            {subjects.length === 0 && (
               <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-500 font-bold mb-2">This book is empty.</p>
                  <p className="text-sm text-slate-400">Add a Subject Division first (e.g. "General Awareness & Polity").</p>
               </div>
            )}
            
            {subjects.map((subject, sIdx) => (
               <div key={subject.id} className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
                  {/* Subject Header */}
                  <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center group">
                     <h3 className="font-bold text-slate-800 text-lg">Section {sIdx + 1}: {subject.name}</h3>
                     <div className="flex items-center gap-2">
                        <button 
                           onClick={() => {
                              setSubjectForm(subject);
                              setIsSubjectModalOpen(true);
                           }}
                           className="text-slate-500 hover:text-blue-600 px-2 py-1"
                        >
                           Edit
                        </button>
                        <button 
                           onClick={() => deleteSubject(subject.id)}
                           className="text-slate-500 hover:text-red-600 px-2 py-1"
                        >
                           Delete
                        </button>
                        <button 
                           onClick={() => {
                              setChapterForm({ 
                                id: '', 
                                title: '', 
                                slug: '', 
                                content: '', 
                                videoId: '', 
                                sortOrder: 0, 
                                subjectId: subject.id, 
                                practiceId: '',
                                readTime: '15 Mins',
                                endQuiz: ''
                              });
                              setIsChapterModalOpen(true);
                           }}
                           className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg font-bold text-sm ml-4 border border-emerald-200 hover:bg-emerald-200"
                        >
                           + Add Chapter
                        </button>
                     </div>
                  </div>
                  
                  {/* Chapters List */}
                  <div className="p-4">
                     {subject.chapters.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No chapters added yet.</p>
                     ) : (
                        <div className="space-y-3">
                           {subject.chapters.map((chapter, cIdx) => (
                              <div key={chapter.id} className="flex justify-between items-center p-3 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg transition-all">
                                 <div>
                                    <span className="font-bold text-slate-700 mr-2">{sIdx + 1}.{cIdx + 1}</span>
                                    {chapter.title}
                                    {chapter.readTime && (
                                       <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">
                                          ⏱️ {chapter.readTime}
                                       </span>
                                    )}
                                    {chapter.endQuiz && (
                                       <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                                          ⚡ Has End Quiz
                                       </span>
                                    )}
                                    {chapter.practiceId && (
                                       <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase font-bold tracking-widest">
                                          Practice Test Linked
                                       </span>
                                    )}
                                 </div>
                                 <div className="flex gap-2">
                                    <button 
                                       className="text-blue-600 text-sm hover:underline font-semibold"
                                       onClick={() => {
                                          setChapterForm({
                                            ...chapter, 
                                            practiceId: chapter.practiceId || '',
                                            readTime: chapter.readTime || '15 Mins',
                                            endQuiz: typeof chapter.endQuiz === 'object' ? JSON.stringify(chapter.endQuiz, null, 2) : (chapter.endQuiz || '')
                                          });
                                          setIsChapterModalOpen(true);
                                       }}
                                    >
                                       Edit Content & Quiz
                                    </button>
                                    <button 
                                       className="text-red-500 text-sm hover:underline ml-2"
                                       onClick={() => deleteChapter(chapter.id)}
                                    >
                                       Remove
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* Subject Modal */}
      {isSubjectModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
             <h2 className={styles.modalTitle}>{subjectForm.id ? "Edit Subject" : "Add Subject"}</h2>
             <form onSubmit={(e) => { e.preventDefault(); handleAction('saveSubject', subjectForm); }}>
                <div className={styles.formGroup}>
                   <label>Subject Name (e.g. Mathematics)</label>
                   <input type="text" value={subjectForm.name} onChange={e => setSubjectForm(prev => ({...prev, name: e.target.value}))} required className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                   <label>Sort Order</label>
                   <input type="number" value={subjectForm.sortOrder} onChange={e => setSubjectForm(prev => ({...prev, sortOrder: parseInt(e.target.value)}))} className={styles.input} />
                </div>
                <div className={styles.actionButtons}>
                   <button type="button" onClick={() => setIsSubjectModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                   <button type="submit" className={styles.saveBtn}>Save Subject</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Chapter Modal */}
      {isChapterModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} w-full max-w-4xl h-[92vh] flex flex-col`}>
             <h2 className={styles.modalTitle}>{chapterForm.id ? "Edit Chapter & End-Quiz Assessment" : "Add New FlexBook Chapter"}</h2>
             <form className="flex-1 flex flex-col overflow-hidden" onSubmit={(e) => { e.preventDefault(); handleAction('saveChapter', chapterForm); }}>
                <div className="overflow-y-auto pr-2 pb-4 flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className={styles.formGroup}>
                         <label>Chapter Title *</label>
                         <input type="text" value={chapterForm.title} onChange={e => setChapterForm(prev => ({...prev, title: e.target.value}))} required className={styles.input} />
                      </div>
                      <div className={styles.formGroup}>
                         <label>Slug (URL Friendly) *</label>
                         <input type="text" value={chapterForm.slug} onChange={e => setChapterForm(prev => ({...prev, slug: e.target.value}))} required className={styles.input} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className={styles.formGroup}>
                         <label>Estimated Read Time</label>
                         <input type="text" placeholder="e.g. 15 Mins" value={chapterForm.readTime} onChange={e => setChapterForm(prev => ({...prev, readTime: e.target.value}))} className={styles.input} />
                      </div>
                      <div className={styles.formGroup}>
                         <label>YouTube Video ID (Optional)</label>
                         <input type="text" placeholder="dQw4w9WgXcQ" value={chapterForm.videoId} onChange={e => setChapterForm(prev => ({...prev, videoId: e.target.value}))} className={styles.input} />
                      </div>
                      <div className={styles.formGroup}>
                         <label>Link Practice Mock ID (Optional)</label>
                         <input type="text" placeholder="Mock Paper ID..." value={chapterForm.practiceId} onChange={e => setChapterForm(prev => ({...prev, practiceId: e.target.value}))} className={styles.input} />
                      </div>
                    </div>
                    
                    <div className={styles.formGroup}>
                       <label className="flex justify-between">
                         <span>Chapter Theory Content (HTML Formatted)</span>
                         <span className="text-xs text-slate-400">Basic HTML tags (`&lt;h3&gt;`, `&lt;p&gt;`, `&lt;ul&gt;`, `&lt;li&gt;`, `&lt;table&gt;`)</span>
                       </label>
                       <textarea 
                          value={chapterForm.content} 
                          onChange={e => setChapterForm(prev => ({...prev, content: e.target.value}))} 
                          className={`${styles.textarea} font-mono text-xs`} 
                          rows="10"
                       ></textarea>
                    </div>

                    {/* End-of-Chapter Assessment Quiz JSON Editor */}
                    <div className={styles.formGroup}>
                       <div className="flex justify-between items-center mb-1">
                          <label className="font-bold text-slate-700 text-sm">
                            End-of-Chapter Interactive Assessment Quiz (JSON Format)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const sampleQuiz = [
                                {
                                  question: "Sample Question 1: What is the primary focus of this chapter?",
                                  options: ["Option A", "Option B", "Option C", "Option D"],
                                  answer: "Option A",
                                  explanation: "Option A is correct because it directly matches chapter principles."
                                }
                              ];
                              setChapterForm(prev => ({...prev, endQuiz: JSON.stringify(sampleQuiz, null, 2)}));
                            }}
                            className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded font-bold hover:bg-indigo-100 transition"
                          >
                            + Insert Sample Assessment JSON Template
                          </button>
                       </div>
                       <textarea 
                          value={chapterForm.endQuiz} 
                          onChange={e => setChapterForm(prev => ({...prev, endQuiz: e.target.value}))} 
                          placeholder='[{"question": "What is...", "options": ["A", "B"], "answer": "A", "explanation": "..."}]'
                          className={`${styles.textarea} font-mono text-xs bg-slate-900 text-emerald-400`} 
                          rows="6"
                       ></textarea>
                    </div>

                    <div className={styles.formGroup}>
                       <label>Sort Order</label>
                       <input type="number" value={chapterForm.sortOrder} onChange={e => setChapterForm(prev => ({...prev, sortOrder: parseInt(e.target.value)}))} className={styles.input} style={{maxWidth: '150px'}} />
                    </div>
                </div>
                
                <div className={`${styles.actionButtons} mt-4 pt-4 border-t border-slate-200`}>
                   <button type="button" onClick={() => setIsChapterModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                   <button type="submit" className={styles.saveBtn}>Save Chapter & Quiz Content</button>
                </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}
