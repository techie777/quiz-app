"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Compass,
  BookOpen,
  Zap,
  Rocket,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  ArrowLeft,
  Award,
  Clock,
  Briefcase,
  DollarSign,
  Users,
  Sparkles,
  ExternalLink,
  Search,
  Check,
  Bookmark,
  Sun,
  Moon,
  Eye,
  ChevronRight,
  RotateCcw,
  Sparkle,
  Maximize2,
  Minimize2,
  X
} from "lucide-react";
import styles from "@/styles/GovtExams.module.css";

export default function ExamDetailPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic 7 Tabs State: 'details', 'career', 'syllabus', 'study', 'quizzes', 'mocks', 'forum'
  const [activeTab, setActiveTab] = useState("details");

  // Digital Book State & Progress Tracker
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [completedChapters, setCompletedChapters] = useState({});
  const [bookmarkedChapters, setBookmarkedChapters] = useState({});
  const [chapterAnswers, setChapterAnswers] = useState({});
  const [sidebarSearch, setSidebarSearch] = useState("");

  // Reader Customizations (Font Size, E-Reader Theme & Full Screen)
  const [fontSize, setFontSize] = useState(16); // 14, 16, 18
  const [readerTheme, setReaderTheme] = useState("paper"); // 'paper', 'sepia', 'night'
  const [isFullScreen, setIsFullScreen] = useState(false);

  // ESC key & body scrollbar lock handler for Full Screen Mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    if (isFullScreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullScreen]);

  useEffect(() => {
    async function fetchExamDetail() {
      setLoading(true);
      try {
        const res = await fetch(`/api/govt-exams/${slug}`);
        const data = await res.json();
        if (data && !data.error) {
          setExamData(data);
          // Set initial study book selection
          if (data.studyBook?.subjects?.length > 0) {
            const firstSub = data.studyBook.subjects[0];
            setSelectedSubjectId(firstSub.id);
            if (firstSub.chapters?.length > 0) {
              setSelectedChapterId(firstSub.chapters[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch exam detail:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchExamDetail();
  }, [slug]);

  // Compute all chapters flat list
  const allBookChapters = useMemo(() => {
    if (!examData?.studyBook?.subjects) return [];
    const list = [];
    examData.studyBook.subjects.forEach((sub) => {
      sub.chapters?.forEach((chap) => {
        list.push({ ...chap, subjectId: sub.id, subjectName: sub.name });
      });
    });
    return list;
  }, [examData]);

  // Reading Progress Stats Calculations
  const totalChaptersCount = allBookChapters.length;
  const completedChaptersCount = Object.keys(completedChapters).filter(
    (key) => completedChapters[key] === true
  ).length;
  const unreadChaptersCount = Math.max(0, totalChaptersCount - completedChaptersCount);
  const overallProgressPercentage =
    totalChaptersCount > 0
      ? Math.round((completedChaptersCount / totalChaptersCount) * 100)
      : 0;

  if (loading) {
    return (
      <main className={styles.page}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
            Loading Exam Blueprint...
          </p>
        </div>
      </main>
    );
  }

  if (!examData) {
    return (
      <main className={styles.page}>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <h2 className="text-2xl font-black mb-4">Exam Details Not Found</h2>
          <Link href="/govt-exams" className={styles.viewBtn}>
            ← Back to All Exams
          </Link>
        </div>
      </main>
    );
  }

  // 7 Interactive Tabs
  const tabs = [
    { id: "details", label: "Exam Details", icon: <FileText size={16} /> },
    { id: "career", label: "Career Guide", icon: <Compass size={16} /> },
    { id: "syllabus", label: "Syllabus", icon: <BookOpen size={16} /> },
    { id: "study", label: "Study Materials", icon: <BookOpen size={16} /> },
    { id: "quizzes", label: "Quizzes", icon: <Zap size={16} /> },
    { id: "mocks", label: "Mock Tests", icon: <Rocket size={16} /> },
    { id: "forum", label: "Forum", icon: <MessageSquare size={16} /> },
  ];

  // Active Subject & Chapter in Digital Book
  const activeSubject = examData.studyBook?.subjects?.find(
    (s) => s.id === selectedSubjectId
  ) || examData.studyBook?.subjects?.[0];

  const activeChapter = activeSubject?.chapters?.find(
    (c) => c.id === selectedChapterId
  ) || activeSubject?.chapters?.[0];

  // Current Chapter Index for Next/Prev navigation
  const activeChapterIndex = allBookChapters.findIndex(
    (c) => c.id === activeChapter?.id
  );

  const handleQuizOptionSelect = (questionId, optionIdx) => {
    setChapterAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
    // Auto-mark chapter as completed when answering quiz
    if (activeChapter?.id) {
      setCompletedChapters((prev) => ({
        ...prev,
        [activeChapter.id]: true,
      }));
    }
  };

  const toggleChapterCompletion = (chapterId) => {
    setCompletedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const toggleBookmark = (chapterId) => {
    setBookmarkedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const navigateToChapter = (chapter) => {
    setSelectedSubjectId(chapter.subjectId);
    setSelectedChapterId(chapter.id);
  };

  return (
    <main className={styles.page}>
      {/* Background ambient lighting */}
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
      </div>

      {/* Top Navigation */}
      <Link href="/govt-exams" className={styles.backLink}>
        <ArrowLeft size={14} /> Back to Government Exams Hub
      </Link>

      {/* Modern High-Contrast Exam Header Banner */}
      <section className={styles.detailHeader}>
        <div className={styles.detailTitleRow}>
          <div className={styles.detailTitleBox}>
            <div className={styles.detailEmoji}>{examData.emoji || "🏛️"}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={styles.badge}>{examData.category || "Govt Exam"}</span>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={11} /> 2026 Edition
                </span>
              </div>
              <h1 className={styles.detailName}>{examData.name}</h1>
              <p className="text-slate-600 dark:text-slate-300 font-medium text-sm mt-1 max-w-2xl leading-relaxed">
                {examData.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic 7 Tabs Bar */}
      <div className={styles.detailTabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tabBtn} ${
              activeTab === tab.id ? styles.activeTabBtn : ""
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT AREA */}
      <div className="min-h-[50vh]">
        <AnimatePresence mode="wait">
          {/* 1. EXAM DETAILS TAB */}
          {activeTab === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Overview */}
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.titlePill} />
                  <FileText className="text-indigo-600 dark:text-indigo-400" size={22} /> Exam Overview & Profile
                </h2>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium text-base mb-6">
                  {examData.examDetails?.overview}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800/80 dark:to-indigo-950/40 border border-indigo-100 dark:border-slate-700">
                    <span className="text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block mb-1">Total Exam Tiers</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">Tier-I & Tier-II (CBT)</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800/80 dark:to-cyan-950/40 border border-blue-100 dark:border-slate-700">
                    <span className="text-xs font-extrabold uppercase text-blue-600 dark:text-blue-400 tracking-wider block mb-1">Selection Mode</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">Computer Based Test</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800/80 dark:to-emerald-950/40 border border-emerald-100 dark:border-slate-700">
                    <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1">Posting Level</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">Group B & C Executive</span>
                  </div>
                </div>
              </div>

              {/* Eligibility */}
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.titlePill} />
                  <Award className="text-indigo-600 dark:text-indigo-400" size={22} /> Eligibility Requirements
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {examData.examDetails?.eligibility?.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-black flex items-center justify-center text-sm mb-3">
                        {idx + 1}
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-medium">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exam Pattern Table */}
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.titlePill} />
                  <Clock className="text-indigo-600 dark:text-indigo-400" size={22} /> Official Exam Pattern & Scheme
                </h2>
                <div className="overflow-x-auto">
                  <table className={styles.customTable}>
                    <thead>
                      <tr>
                        <th>Exam Stage</th>
                        <th>Test Mode</th>
                        <th>Questions & Marks</th>
                        <th>Duration</th>
                        <th>Subjects Included</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examData.examDetails?.examPattern?.map((stage, idx) => (
                        <tr key={idx}>
                          <td className="font-bold text-slate-900 dark:text-slate-100">{stage.stage}</td>
                          <td>{stage.mode}</td>
                          <td>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{stage.questions} Qs</span> ({stage.marks} Marks)
                          </td>
                          <td>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{stage.duration}</span>
                          </td>
                          <td className="text-xs font-medium">{stage.subjects}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Exam Schedule */}
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.titlePill} />
                  <Clock className="text-indigo-600 dark:text-indigo-400" size={22} /> Important Exam Schedule
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {examData.examDetails?.importantDates?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700"
                    >
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.event}
                      </span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-xl border border-indigo-200/60 dark:border-indigo-800">
                        {item.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. CAREER GUIDE TAB */}
          {activeTab === "career" && (
            <motion.div
              key="career"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.titlePill} />
                  <Compass className="text-indigo-600 dark:text-indigo-400" size={22} /> Career Growth & Job Profile Guide
                </h2>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium text-base mb-6">
                  {examData.careerGuide?.overview}
                </p>

                {/* Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {examData.careerGuide?.highlights?.map((hl, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/5 p-5 rounded-2xl border border-indigo-200/60 dark:border-indigo-800 text-center"
                    >
                      <div className="text-3xl mb-2">{hl.icon}</div>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                        {hl.label}
                      </div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {hl.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Salary Breakdown */}
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <DollarSign size={20} className="text-emerald-500" /> Salary & Allowance Matrix
                </h3>
                <div className="overflow-x-auto mb-8">
                  <table className={styles.customTable}>
                    <thead>
                      <tr>
                        <th>Salary Component</th>
                        <th>X Cities (Metro)</th>
                        <th>Y Cities (Tier-II)</th>
                        <th>Z Cities (Rural/Other)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examData.careerGuide?.salaryBreakdown?.map((row, idx) => (
                        <tr key={idx}>
                          <td className="font-bold text-slate-900 dark:text-slate-100">{row.component}</td>
                          <td className="font-bold text-emerald-600 dark:text-emerald-400">{row.X_City}</td>
                          <td>{row.Y_City}</td>
                          <td>{row.Z_City}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Promotional Pathway */}
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Rocket size={20} className="text-indigo-500" /> Promotion & Hierarchy Steps
                </h3>
                <div className="space-y-4">
                  {examData.careerGuide?.growthPathway?.map((path, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-sm flex-shrink-0 shadow-md">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-black text-slate-900 dark:text-white text-base">
                            {path.title}
                          </span>
                          <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full">
                            {path.stage}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                          {path.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. SYLLABUS TAB */}
          {activeTab === "syllabus" && (
            <motion.div
              key="syllabus"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {examData.syllabus?.map((sec, idx) => (
                  <div key={idx} className={styles.sectionCard}>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
                      <span className="w-2.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                      {sec.subject}
                    </h2>
                    <ul className="space-y-3">
                      {sec.topics?.map((topic, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 4. STUDY MATERIALS (ENHANCED DIGITAL FLEXBOOK READER) TAB */}
          {activeTab === "study" && (
            <motion.div
              key="study"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Overall Book Progress Banner & Reading Summary Stats */}
              <div className={styles.bookProgressBanner}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 mb-1">
                      <BookOpen size={14} /> Official SSC Digital FlexBook Reference
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      {examData.studyBook?.title || `${examData.name} Master Study Reference`}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                      Overall Book Reading Progress
                    </span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 block">
                      {overallProgressPercentage}% Completed
                    </span>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className={styles.progressBarContainer}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${overallProgressPercentage}%` }}
                  />
                </div>

                {/* Read vs Unread Chapter Summary Badges */}
                <div className={styles.bookStatsGrid}>
                  <div className={styles.statCard}>
                    <div className={`${styles.statIcon} bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300`}>
                      📚
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 block">Total Chapters</span>
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {totalChaptersCount} Chapters
                      </span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={`${styles.statIcon} bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300`}>
                      ✅
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 block">Completed (Read)</span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {completedChaptersCount} Read
                      </span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={`${styles.statIcon} bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300`}>
                      ⌛
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 block">Remaining (Unread)</span>
                      <span className="text-base font-black text-amber-600 dark:text-amber-400">
                        {unreadChaptersCount} Unread
                      </span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={`${styles.statIcon} bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300`}>
                      ⚡
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 block">End Quizzes Played</span>
                      <span className="text-base font-black text-purple-600 dark:text-purple-400">
                        {Object.keys(chapterAnswers).length} Answers
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Book Reader Layout (Sidebar + Reader Area) */}
              <div className={styles.bookContainer}>
                {/* Book Navigation Sidebar */}
                <div className={styles.bookSidebar}>
                  <div className={styles.sidebarHeading}>
                    <span>Subjects & Chapters</span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold">
                      {completedChaptersCount}/{totalChaptersCount} Done
                    </span>
                  </div>

                  {/* Sidebar Search Input */}
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search chapters..."
                      className={styles.chapterSearchInput}
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                    />
                  </div>

                  {/* Subject Accordions */}
                  {examData.studyBook?.subjects?.map((sub) => {
                    const filteredChapters = sub.chapters?.filter((c) =>
                      c.title.toLowerCase().includes(sidebarSearch.toLowerCase())
                    );

                    if (sidebarSearch && filteredChapters.length === 0) return null;

                    return (
                      <div key={sub.id} className={styles.subjectAccordion}>
                        <button
                          className={styles.subjectHeaderBtn}
                          onClick={() => setSelectedSubjectId(sub.id)}
                        >
                          <span className="flex items-center gap-2">
                            <span>{sub.icon}</span> {sub.name}
                          </span>
                          <ChevronDown size={14} />
                        </button>

                        {(selectedSubjectId === sub.id || sidebarSearch) && (
                          <div className="pl-1 mt-1 space-y-1">
                            {filteredChapters?.map((chap) => {
                              const isCompleted = completedChapters[chap.id];
                              const isReading = selectedChapterId === chap.id;

                              return (
                                <button
                                  key={chap.id}
                                  onClick={() => {
                                    setSelectedSubjectId(sub.id);
                                    setSelectedChapterId(chap.id);
                                  }}
                                  className={`${styles.chapterBtn} ${
                                    isReading ? styles.activeChapterBtn : ""
                                  }`}
                                >
                                  <span className="truncate pr-2">{chap.title}</span>
                                  {isCompleted ? (
                                    <span className={`${styles.statusPill} ${styles.completedPill}`}>
                                      Read ✅
                                    </span>
                                  ) : isReading ? (
                                    <span className={`${styles.statusPill} ${styles.readingPill}`}>
                                      Reading 📖
                                    </span>
                                  ) : (
                                    <span className={`${styles.statusPill} ${styles.unreadPill}`}>
                                      Unread ⏳
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Main Digital Reader Area */}
                <div
                  className={`${styles.bookContentArea} ${
                    isFullScreen ? styles.fullScreenReader : ""
                  } ${
                    readerTheme === "sepia"
                      ? styles.themeSepia
                      : readerTheme === "night"
                      ? styles.themeNight
                      : ""
                  }`}
                >
                  {/* Sticky Header when in Full Screen Mode */}
                  {isFullScreen ? (
                    <div className={styles.fullScreenHeader}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg flex-shrink-0">📖</span>
                        <div className="min-w-0">
                          <span className="text-[10px] sm:text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block truncate">
                            Distraction-Free Reading Mode
                          </span>
                          <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white truncate">
                            {activeChapter?.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                        {/* Font Controls */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                          <button
                            onClick={() => setFontSize(14)}
                            className={`${styles.readerToolBtn} ${fontSize === 14 ? styles.activeToolBtn : ""}`}
                          >
                            A-
                          </button>
                          <button
                            onClick={() => setFontSize(16)}
                            className={`${styles.readerToolBtn} ${fontSize === 16 ? styles.activeToolBtn : ""}`}
                          >
                            A
                          </button>
                          <button
                            onClick={() => setFontSize(18)}
                            className={`${styles.readerToolBtn} ${fontSize === 18 ? styles.activeToolBtn : ""}`}
                          >
                            A+
                          </button>
                        </div>

                        {/* Theme Badges */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setReaderTheme("paper")}
                            className={`${styles.readerToolBtn} ${readerTheme === "paper" ? styles.activeToolBtn : ""}`}
                          >
                            📄 Paper
                          </button>
                          <button
                            onClick={() => setReaderTheme("sepia")}
                            className={`${styles.readerToolBtn} ${readerTheme === "sepia" ? styles.activeToolBtn : ""}`}
                          >
                            ☕ Sepia
                          </button>
                          <button
                            onClick={() => setReaderTheme("night")}
                            className={`${styles.readerToolBtn} ${readerTheme === "night" ? styles.activeToolBtn : ""}`}
                          >
                            🌙 Night
                          </button>
                        </div>

                        {/* Exit Full Screen Button */}
                        <button
                          onClick={() => setIsFullScreen(false)}
                          className={styles.exitFullScreenBtn}
                        >
                          <X size={15} /> Exit (Esc)
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Reader Controls Toolbar in standard view */
                    <div className={styles.readerToolbar}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Reader Controls:
                        </span>
                        {/* Font Size Adjuster */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                          <button
                            onClick={() => setFontSize(14)}
                            className={`${styles.readerToolBtn} ${fontSize === 14 ? styles.activeToolBtn : ""}`}
                          >
                            A-
                          </button>
                          <button
                            onClick={() => setFontSize(16)}
                            className={`${styles.readerToolBtn} ${fontSize === 16 ? styles.activeToolBtn : ""}`}
                          >
                            A
                          </button>
                          <button
                            onClick={() => setFontSize(18)}
                            className={`${styles.readerToolBtn} ${fontSize === 18 ? styles.activeToolBtn : ""}`}
                          >
                            A+
                          </button>
                        </div>
                      </div>

                      {/* Reading Mode Theme Switcher & Full Screen */}
                      <div className={styles.readerControls}>
                        <button
                          onClick={() => setReaderTheme("paper")}
                          className={`${styles.readerToolBtn} ${
                            readerTheme === "paper" ? styles.activeToolBtn : ""
                          }`}
                        >
                          📄 Paper
                        </button>
                        <button
                          onClick={() => setReaderTheme("sepia")}
                          className={`${styles.readerToolBtn} ${
                            readerTheme === "sepia" ? styles.activeToolBtn : ""
                          }`}
                        >
                          ☕ Sepia
                        </button>
                        <button
                          onClick={() => setReaderTheme("night")}
                          className={`${styles.readerToolBtn} ${
                            readerTheme === "night" ? styles.activeToolBtn : ""
                          }`}
                        >
                          🌙 Night
                        </button>

                        {/* Full Screen Mode Toggle Button */}
                        <button
                          onClick={() => setIsFullScreen(true)}
                          className={styles.readerToolBtn}
                        >
                          <Maximize2 size={14} /> Full Screen
                        </button>

                        {/* Bookmark Button */}
                        {activeChapter && (
                          <button
                            onClick={() => toggleBookmark(activeChapter.id)}
                            className={`${styles.readerToolBtn} ${
                              bookmarkedChapters[activeChapter.id] ? styles.activeToolBtn : ""
                            }`}
                          >
                            <Bookmark size={14} />
                            {bookmarkedChapters[activeChapter.id] ? "Saved" : "Save"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {activeChapter ? (
                    <div>
                      {/* Top Header of Selected Chapter */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <span className={styles.theoryMeta}>
                          ⏱️ Est. Read Time: {activeChapter.readTime || "15 Mins"} • {activeSubject?.name}
                        </span>

                        <button
                          onClick={() => toggleChapterCompletion(activeChapter.id)}
                          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                            completedChapters[activeChapter.id]
                              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-slate-800 dark:text-indigo-300"
                          }`}
                        >
                          <CheckCircle2 size={16} />
                          {completedChapters[activeChapter.id] ? "Marked as Completed" : "Mark as Read"}
                        </button>
                      </div>

                      <h2 className={styles.theoryTitle}>{activeChapter.title}</h2>

                      {/* Dynamic Scaled Theory HTML Body */}
                      <div
                        style={{ fontSize: `${fontSize}px` }}
                        className="prose prose-indigo max-w-none leading-relaxed space-y-4"
                        dangerouslySetInnerHTML={{
                          __html: activeChapter.theoryContent,
                        }}
                      />

                      {/* Interactive Chapter Quiz Component */}
                      {activeChapter.chapterQuiz && (
                        <div className={styles.chapterQuizBox}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                              <Zap size={18} className="text-amber-500" />
                              {activeChapter.chapterQuiz.title}
                            </h3>
                            <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                              Interactive Assessment Quiz
                            </span>
                          </div>

                          <div className="space-y-6">
                            {activeChapter.chapterQuiz.questions?.map(
                              (q, qIdx) => {
                                const selectedOption = chapterAnswers[q.id];
                                const isAnswered = selectedOption !== undefined;

                                return (
                                  <div
                                    key={q.id}
                                    className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
                                  >
                                    <h4 className={styles.quizQuestionTitle}>
                                      Q{qIdx + 1}. {q.text}
                                    </h4>

                                    <div className="space-y-2">
                                      {q.options?.map((opt, optIdx) => {
                                        let btnClass = styles.quizOptionBtn;
                                        if (isAnswered) {
                                          if (optIdx === q.answer) {
                                            btnClass += ` ${styles.correctOpt}`;
                                          } else if (
                                            selectedOption === optIdx
                                          ) {
                                            btnClass += ` ${styles.wrongOpt}`;
                                          }
                                        }

                                        return (
                                          <button
                                            key={optIdx}
                                            disabled={isAnswered}
                                            onClick={() =>
                                              handleQuizOptionSelect(
                                                q.id,
                                                optIdx
                                              )
                                            }
                                            className={btnClass}
                                          >
                                            <span className="font-bold mr-2">
                                              {String.fromCharCode(
                                                65 + optIdx
                                              )}.
                                            </span>
                                            {opt}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Detailed Solution Explanation */}
                                    {isAnswered && q.explanation && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className={styles.explanationBox}
                                      >
                                        <strong>Explanation:</strong> {q.explanation}
                                      </motion.div>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}

                      {/* Next / Previous Page Navigation Footer */}
                      <div className={styles.bookFooterNav}>
                        {activeChapterIndex > 0 ? (
                          <button
                            onClick={() =>
                              navigateToChapter(allBookChapters[activeChapterIndex - 1])
                            }
                            className={`${styles.navChapterBtn} ${styles.prevBtn}`}
                          >
                            <ArrowLeft size={16} /> Previous Chapter
                          </button>
                        ) : <div />}

                        {activeChapterIndex < allBookChapters.length - 1 ? (
                          <button
                            onClick={() => {
                              setCompletedChapters((prev) => ({
                                ...prev,
                                [activeChapter.id]: true,
                              }));
                              navigateToChapter(allBookChapters[activeChapterIndex + 1]);
                            }}
                            className={`${styles.navChapterBtn} ${styles.nextBtn}`}
                          >
                            Complete & Next Chapter <ChevronRight size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setCompletedChapters((prev) => ({
                                ...prev,
                                [activeChapter.id]: true,
                              }));
                            }}
                            className={`${styles.navChapterBtn} ${styles.nextBtn}`}
                          >
                            Finish Book Section ✅
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-400">
                      Select a chapter from the sidebar to start reading.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 5. QUIZZES TAB */}
          {activeTab === "quizzes" && (
            <motion.div
              key="quizzes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white rounded-[2.5rem] p-10 md:p-14 text-center relative overflow-hidden shadow-2xl">
                <div className="relative z-10 max-w-2xl mx-auto">
                  <div className="text-6xl mb-6">🧠</div>
                  <h2 className="text-3xl md:text-4xl font-black mb-4">
                    Govt Exam Practice Quizzes
                  </h2>
                  <p className="text-indigo-200 text-base mb-8 leading-relaxed font-medium">
                    Test your knowledge with topic-wise speed quizzes, daily mini challenges, and dynamic set questions tailored specifically for government exams.
                  </p>
                  <Link
                    href="/quizzes?tab=govt"
                    className="inline-flex items-center gap-3 bg-white text-indigo-950 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                  >
                    Go to Quizzes Hub <ExternalLink size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* 6. MOCK TESTS TAB */}
          {activeTab === "mocks" && (
            <motion.div
              key="mocks"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-gradient-to-br from-purple-900 via-rose-950 to-indigo-950 text-white rounded-[2.5rem] p-10 md:p-14 text-center relative overflow-hidden shadow-2xl">
                <div className="relative z-10 max-w-2xl mx-auto">
                  <div className="text-6xl mb-6">🚀</div>
                  <h2 className="text-3xl md:text-4xl font-black mb-4">
                    {examData.name} Full Length Mock Tests
                  </h2>
                  <p className="text-indigo-200 text-base mb-8 leading-relaxed font-medium">
                    Attempt official pattern simulated online test series, section-wise speed tests, and previous years' question papers with real-time ranking.
                  </p>
                  <Link
                    href={`/mock-tests`}
                    className="inline-flex items-center gap-3 bg-white text-indigo-950 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                  >
                    Start {examData.name} Mock Tests <ExternalLink size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* 7. FORUM TAB */}
          {activeTab === "forum" && (
            <motion.div
              key="forum"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 text-white rounded-[2.5rem] p-10 md:p-14 text-center relative overflow-hidden shadow-2xl">
                <div className="relative z-10 max-w-2xl mx-auto">
                  <div className="w-20 h-20 rounded-3xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
                    💬
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black mb-4">
                    {examData.name} Candidate Discussion Forum
                  </h2>
                  <p className="text-purple-200 text-base mb-8 leading-relaxed font-medium">
                    Connect with fellow aspirants, discuss previous year cut-offs, share preparation strategies, ask doubt questions, and get tips from top scorers.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <span className="text-xs font-bold text-purple-300 block mb-1">💬 Active Discussions</span>
                      <span className="text-sm font-bold text-white">Ask Doubts & Strategy</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <span className="text-xs font-bold text-purple-300 block mb-1">📊 Expected Cut-offs</span>
                      <span className="text-sm font-bold text-white">Analysis & Polls</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <span className="text-xs font-bold text-purple-300 block mb-1">🤝 Aspirants Community</span>
                      <span className="text-sm font-bold text-white">Peer Group Learning</span>
                    </div>
                  </div>

                  <Link
                    href="/forum"
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-9 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-purple-500/25"
                  >
                    Launch Community Forum <ExternalLink size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
