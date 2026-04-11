"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import styles from '@/styles/LandingPage.module.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Download, Rocket, FileText, CheckCircle2, BookOpen, ScrollText, Zap, HelpCircle, Lock, ShoppingCart, ShieldCheck } from "lucide-react";
import { useMonetization } from '@/context/MonetizationContext';
import { useSession } from 'next-auth/react';

export default function PaperSelection() {
  const { examId } = useParams();
  const { isPro, hasPass } = useMonetization();
  const { data: session } = useSession();
  
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); 
  const [showPayWall, setShowPayWall] = useState(false);

  useEffect(() => {
    async function fetchPapers() {
      setLoading(true);
      try {
        const res = await fetch(`/api/mock-tests/${examId}/papers`);
        const data = await res.json();
        if (data && !data.error) {
          setExam(data);
          // Auto-select mocks if info is empty, otherwise info
          if (data.sections?.length === 0) setActiveTab('mocks');
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

  const mocksByYear = (exam.papers || [])
    .filter(p => p.paperType === 'MOCK')
    .reduce((acc, p) => {
      const year = p.year || 2025;
      if (!acc[year]) acc[year] = [];
      acc[year].push(p);
      return acc;
    }, {});

  const pypsByYear = (exam.papers || [])
    .filter(p => p.paperType === 'PYP')
    .reduce((acc, p) => {
      const year = p.year || 2025;
      if (!acc[year]) acc[year] = [];
      acc[year].push(p);
      return acc;
    }, {});

  const sortedMockYears = Object.keys(mocksByYear).sort((a, b) => b - a);
  const sortedPYPYears = Object.keys(pypsByYear).sort((a, b) => b - a);

  const tabs = [
    { id: 'info', label: 'Exam Info', icon: <FileText size={18}/> },
    { id: 'mocks', label: 'Mock Tests', icon: <Rocket size={18}/> },
    { id: 'pyp', label: 'Previous Years', icon: <ScrollText size={18}/> },
    { id: 'quizzes', label: 'Quizzes', icon: <Zap size={18}/> },
    { id: 'study', label: 'Study Material', icon: <BookOpen size={18}/> },
  ];

  const downloadExamInfoPDF = () => {
    if (!exam) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text(exam.name.toUpperCase(), pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${exam.category?.name || "Official"} Preparation Portal`, pageWidth / 2, 28, { align: 'center' });
    
    let currentY = 40;
    
    (exam.sections || []).forEach((sec) => {
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.text(sec.title, 15, currentY);
        currentY += 8;
        
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // Slate 600
        
        if (sec.type === 'TABLE' || sec.content.includes('<table')) {
            // Simplified table extraction would be complex, just add as text blob for now or skip HTML
            const text = sec.content.replace(/<[^>]*>/g, '').trim();
            const splitText = doc.splitTextToSize(text, pageWidth - 30);
            doc.text(splitText, 15, currentY);
            currentY += (splitText.length * 5) + 12;
        } else {
            const text = sec.content.replace(/<[^>]*>/g, '').trim();
            const splitText = doc.splitTextToSize(text, pageWidth - 30);
            doc.text(splitText, 15, currentY);
            currentY += (splitText.length * 5) + 12;
        }
    });

    doc.save(`${exam.slug}-exam-info.pdf`);
  };

  const RenderBlock = ({ section }) => {
    const type = section.type || 'TEXT';
    
    if (type === 'HEADING') {
        return <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-4">{section.title}</h2>;
    }
    
    if (type === 'LIST') {
        let items = [];
        try { items = JSON.parse(section.content); } catch (e) { items = section.content.split('\n'); }
        return (
            <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-slate-50 mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-6 border-l-4 border-indigo-600 pl-4">{section.title}</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((it, idx) => (
                        <li key={idx} className="flex gap-3 text-slate-600">
                            <span className="bg-indigo-50 text-indigo-600 p-1 rounded-full flex-shrink-0 h-fit"><CheckCircle2 size={16}/></span>
                            {it}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
    
    if (type === 'TABLE') {
        return (
            <div className="bg-white p-2 rounded-[2rem] border border-slate-50 mb-6 overflow-hidden shadow-sm">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">{section.title}</h3>
                </div>
                <div className="overflow-x-auto p-4 px-6" dangerouslySetInnerHTML={{ __html: section.content }} />
            </div>
        );
    }

    if (type === 'DATES') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="col-span-full mb-2">
                    <h3 className="text-xl font-bold text-slate-800">{section.title}</h3>
                </div>
                {/* Expected content structure for DATES: JSON { "Event": "Date" } */}
                {Object.entries(JSON.parse(section.content || '{}')).map(([event, date]) => (
                    <div key={event} className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">{event}</p>
                        <p className="text-lg font-black text-indigo-900">{date}</p>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-50 mb-6">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-4">
                <span className="w-1.5 h-10 bg-indigo-600 rounded-full"></span>
                {section.title}
            </h2>
            <div 
                className="text-slate-600 leading-relaxed space-y-4 prose prose-indigo max-w-none"
                dangerouslySetInnerHTML={{ __html: section.content }}
            />
        </div>
    );
  };

  return (
    <main className={styles.page}>
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
      </div>

      <section className={styles.container}>
        <div className="mb-8">
            <Link href="/mock-tests" className="inline-flex items-center text-indigo-600 font-black text-xs uppercase tracking-widest hover:gap-2 transition-all gap-1 mb-6">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Hub
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex gap-6 items-center">
                    <div className="text-5xl bg-white shadow-xl shadow-indigo-50 border border-slate-100 w-24 h-24 rounded-[2rem] flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                        {exam.emoji || '📝'}
                    </div>
                    <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{exam.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Official Hub</span>
                        <p className="text-slate-500 font-bold text-sm tracking-tight">{exam.category?.name} Preparation Portal</p>
                    </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Active Users</div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="font-mono text-xl font-bold text-slate-800">1.2k+</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* STUDY PORTAL CTA (Floating) */}
        {!activeTab.includes('study') && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-50 border-2 border-indigo-100 rounded-3xl p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="text-3xl">📚</div>
                    <div>
                        <h3 className="text-lg font-black text-indigo-900">Need to cover syllabus first?</h3>
                        <p className="text-indigo-600 font-medium text-sm">Access structured FlexBook notes and topic-wise modules for {exam.name}.</p>
                    </div>
                </div>
                <Link href={`/govt-study/${exam.slug}`} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
                    Go to Study Portal
                </Link>
            </motion.div>
        )}

        {/* HIGH DENSITY TAB NAVIGATION */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-4 scrollbar-hide sticky top-0 bg-slate-50/80 backdrop-blur-xl z-20 pt-4 -mx-4 px-4 border-b border-slate-200/50">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                        activeTab === tab.id 
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                        : 'bg-white text-slate-500 border border-slate-100 hover:border-indigo-200'
                    }`}
                >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="whitespace-nowrap">{tab.label}</span>
                </button>
            ))}
        </div>

        {/* PAYWALL OVERLAY FOR PAID CATEGORIES */}
        {((exam.isPaid || exam.category?.isPaid) && !hasPass(exam.id) && !hasPass(exam.categoryId)) && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3rem] p-12 text-white relative overflow-hidden mb-12 shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-500/30">
                            <Lock size={12} /> Premium Category Access
                        </div>
                        <h2 className="text-4xl font-black mb-4 tracking-tight">Unlock {exam.name} Mastery</h2>
                        <p className="text-indigo-200 text-lg mb-8 leading-relaxed font-medium">
                            Join thousands of successful candidates. Get unlimited access to all Mocks, Previous Papers, and Notes for this category.
                        </p>
                        <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                             <div className="flex items-center gap-2 text-sm font-bold text-white/70">
                                <ShieldCheck className="text-emerald-400" size={18} /> Verified Papers
                             </div>
                             <div className="flex items-center gap-2 text-sm font-bold text-white/70">
                                <Zap className="text-amber-400" size={18} /> Detailed Solutions
                             </div>
                        </div>
                    </div>
                    <div className="w-full md:w-80 bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 text-center">
                        <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-2">Category Lifelong Pass</p>
                        <div className="flex items-center justify-center gap-1 mb-6">
                            <span className="text-2xl font-bold opacity-50 italic line-through">₹99</span>
                            <span className="text-5xl font-black text-white">₹{exam.price || exam.category?.price || 49}</span>
                        </div>
                        <button 
                            className="w-full bg-white text-indigo-950 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition shadow-xl mb-4"
                            onClick={() => router.push(`/donate?action=mockpass&targetId=${exam.id}`)}
                        >
                            Get Category Pass
                        </button>
                        <Link href="/pro" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition">
                            Or Unlock Everything with Pro
                        </Link>
                    </div>
                </div>
            </motion.div>
        )}

        {/* TAB CONTENT AREA */}
        <div className="min-h-[50vh]">
            <AnimatePresence mode="wait">
                {activeTab === 'info' && (
                    <motion.div
                        key="info"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-4"
                    >
                        <div className="flex justify-end mb-4">
                            <button 
                                onClick={downloadExamInfoPDF}
                                className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                            >
                                <Download size={16}/>
                                Download Exam Info (PDF)
                            </button>
                        </div>
                        {exam.sections?.length === 0 ? (
                            <div className="bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-slate-100">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Official information processing...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {exam.sections.map((sec) => (
                                    <RenderBlock key={sec.id} section={sec} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'mocks' && (
                    <motion.div
                        key="mocks"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-12"
                    >
                        {sortedMockYears.length === 0 ? (
                            <div className="bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-slate-100">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">New full mocks are being drafted...</p>
                            </div>
                        ) : (
                            sortedMockYears.map((year) => (
                                <div key={year}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <h2 className="text-2xl font-black text-slate-800">Mocks for {year}</h2>
                                        <div className="h-0.5 flex-1 bg-slate-100"></div>
                                        <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {mocksByYear[year].length} Papers
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {mocksByYear[year].map((paper, idx) => (
                                            <PaperCard key={paper.id} paper={paper} index={idx} />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}

                {activeTab === 'pyp' && (
                    <motion.div
                        key="pyp"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-12"
                    >
                        {sortedPYPYears.length === 0 ? (
                            <div className="bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-slate-100">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Archives are being scanned...</p>
                            </div>
                        ) : (
                            sortedPYPYears.map((year) => (
                                <div key={year}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <h2 className="text-2xl font-black text-indigo-900">{year} Previous Papers</h2>
                                        <div className="h-0.5 flex-1 bg-indigo-50"></div>
                                        <div className="bg-indigo-50 px-3 py-1 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                            {pypsByYear[year].length} Papers
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {pypsByYear[year].map((paper, idx) => (
                                            <PaperCard key={paper.id} paper={paper} index={idx} highlight />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}

                {activeTab === 'quizzes' && (
                    <motion.div
                        key="quizzes"
                        initial={{ opacity: 0, y: 20 }}
                        reveal={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {exam.linkedQuizzes?.length > 0 ? (
                            exam.linkedQuizzes.map((quiz, idx) => (
                                <motion.div 
                                    key={quiz.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                                >
                                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{quiz.emoji}</div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2">{quiz.topic}</h3>
                                    <p className="text-slate-500 text-sm line-clamp-2 mb-6">{quiz.description || "Topic-wise specialized practice modules."}</p>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">
                                            {quiz._count?.questions || 0} Questions
                                        </span>
                                    </div>
                                    <Link href={`/category/${quiz.id}`} className="block w-full text-center bg-slate-50 text-slate-800 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition">
                                        Start Quiz Hub
                                    </Link>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-slate-100">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Bite-sized quizzes coming soon...</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'study' && (
                    <motion.div
                        key="study"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                    >
                        {/* 1. Official Links & Linked Resources */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(exam.studyMaterialJson && JSON.parse(exam.studyMaterialJson || '[]').length > 0) ? (
                                JSON.parse(exam.studyMaterialJson || '[]').map((item, idx) => (
                                    <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex justify-between items-center group">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 mb-1">{item.title}</h3>
                                            <p className="text-slate-500 text-sm">{item.description || "Official study resource and links."}</p>
                                        </div>
                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Download size={20}/>
                                        </a>
                                    </div>
                                ))
                            ) : null}
                        </div>

                        {/* 2. Recommended Books Grid */}
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <h2 className="text-2xl font-black text-slate-800">Expert Recommended Resources</h2>
                                <div className="h-0.5 flex-1 bg-slate-100"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {JSON.parse(exam.booksJson || '[]').length > 0 ? (
                                    JSON.parse(exam.booksJson || '[]').map((book, idx) => (
                                        <div key={idx} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 flex flex-col shadow-sm group">
                                            <div className="aspect-[3/4] bg-slate-50 overflow-hidden relative">
                                                {book.image ? (
                                                    <img src={book.image} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">📚</div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                                    <span className="bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Verified Material</span>
                                                </div>
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col">
                                                <h3 className="font-black text-slate-900 text-sm mb-4 line-clamp-2 leading-relaxed">{book.title}</h3>
                                                {book.link && (
                                                    <a href={book.link} target="_blank" rel="noopener noreferrer" className="mt-auto block text-center bg-slate-900 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-black transition">
                                                        Access Materials
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full bg-slate-50 p-12 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Official book suggestions pending...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Deep Study Portal CTA */}
                        <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950 rounded-[3rem] p-12 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                            <div className="relative z-10 max-w-2xl mx-auto">
                                <div className="text-6xl mb-8">🚀</div>
                                <h2 className="text-4xl font-black mb-6 tracking-tight">The Ultimate Study HUB</h2>
                                <p className="text-indigo-200 text-lg mb-10 leading-relaxed font-medium">Don't just practice, MASTER the concepts. Our comprehensive FlexBook system provides topic-wise theory, examples, and shortcuts tailored specifically for {exam.name}.</p>
                                <Link href={`/govt-study/${exam.slug}`} className="inline-block bg-white text-indigo-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform">
                                    Explore Full Study Library
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </section>

      <div className="h-32" />
    </main>
  );
}

function PaperCard({ paper, index, highlight = false }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <div className={`bg-white rounded-3xl p-6 border hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${highlight ? 'border-indigo-100 shadow-indigo-50/50' : 'border-slate-100 shadow-sm'}`}>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{paper.title}</h3>
                        {highlight && <span className="bg-indigo-600 text-white text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded">Verified PYP</span>}
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 px-3 py-1.5 rounded-full">
                            <span className="text-base text-indigo-500">⏱️</span> {paper.timeLimit} Mins
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 px-3 py-1.5 rounded-full">
                            <span className="text-base text-rose-500">🎯</span> {paper._count?.questions || 0} Questions
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 px-3 py-1.5 rounded-full">
                            <span className="text-base text-emerald-500">📈</span> {paper.totalMarks} Marks
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            const doc = new jsPDF();
                            doc.setFontSize(20);
                            doc.text(paper.title, 20, 20);
                            doc.setFontSize(12);
                            doc.text(`Time: ${paper.timeLimit} mins`, 20, 35);
                            doc.text(`Total Marks: ${paper.totalMarks}`, 20, 42);
                            doc.text(`Negative Marking: ${paper.negativeMarking}`, 20, 49);
                            doc.text(`Year: ${paper.year}`, 20, 56);
                            doc.text(`Instructions:`, 20, 70);
                            const splitText = doc.splitTextToSize(paper.instructions || "Standard exam instructions apply.", 170);
                            doc.text(splitText, 20, 77);
                            doc.save(`${paper.slug}-info.pdf`);
                        }}
                        className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        title="Download Info PDF"
                    >
                        <Download size={20}/>
                    </button>
                    <div className="hidden lg:block text-right mr-4 border-r-2 border-slate-100 pr-4">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Standard Scale</p>
                        <p className="text-sm font-black text-slate-700">+{paper.positiveMarking} / -{paper.negativeMarking}</p>
                    </div>
                    <Link 
                        href={`/mock-tests/paper/${paper.id}/instructions`}
                        className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg hover:-translate-y-1 text-center min-w-[180px] ${
                            ((paper.isPaid || paper.exam?.isPaid) && !hasPass(paper.id) && !hasPass(paper.examId))
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                            : highlight 
                                ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700' 
                                : 'bg-slate-900 text-white shadow-slate-200 hover:bg-black'
                        }`}
                    >
                        {((paper.isPaid || paper.exam?.isPaid) && !hasPass(paper.id) && !hasPass(paper.examId)) ? 'LOCKED' : 'START TEST'}
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
