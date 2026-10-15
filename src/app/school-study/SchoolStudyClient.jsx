"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Flame,
  Zap,
  Trophy,
  ChevronRight,
  BookOpen,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Bell,
  SlidersHorizontal,
  X,
  Play,
  RotateCcw,
  Search,
  ChevronDown,
  Layers,
  Clock,
  Award,
  Crown,
  Volume2,
  VolumeX,
  Share2,
  Calendar,
  Check,
  Filter,
  FileText,
  AlertCircle,
  HelpCircle,
  Home,
  Target,
  Swords,
  User
} from 'lucide-react';

// Playful Web Audio API Sound Synthesizer for Study Hub
const playAcademicSound = (type = 'click', soundEnabled = true) => {
  if (!soundEnabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'xp') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.18);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.19);
    }
  } catch (e) {
    // Audio context may require user activation on some mobile devices
  }
};

// Live School Syllabus Subjects with Chapters
const SUBJECTS_DATA = [
  {
    id: 'science',
    name: 'विज्ञान (Science)',
    enSubtitle: 'Physics, Chemistry & Biology',
    icon: '🔬',
    chaptersCount: 15,
    questionsCount: 320,
    progress: 68,
    tag: 'सर्वाधिक महत्वपूर्ण',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    chapters: [
      { id: 'ch1', no: 'अध्याय 1', title: 'हमारे आस-पास के पदार्थ', sets: 4, questions: 80, completed: true, score: '18/20' },
      { id: 'ch2', no: 'अध्याय 2', title: 'क्या हमारे आस-पास के पदार्थ शुद्ध हैं?', sets: 4, questions: 80, completed: true, score: '16/20' },
      { id: 'ch3', no: 'अध्याय 3', title: 'परमाणु एवं अणु (Atoms & Molecules)', sets: 5, questions: 100, completed: false, inProgress: true },
      { id: 'ch4', no: 'अध्याय 4', title: 'परमाणु की संरचना', sets: 4, questions: 80, completed: false },
      { id: 'ch5', no: 'अध्याय 5', title: 'जीवन की मौलिक इकाई (Cell)', sets: 5, questions: 100, completed: false },
      { id: 'ch6', no: 'अध्याय 6', title: 'ऊतक (Tissues)', sets: 4, questions: 80, completed: false },
      { id: 'ch7', no: 'अध्याय 7', title: 'गति (Motion)', sets: 5, questions: 100, completed: false },
      { id: 'ch8', no: 'अध्याय 8', title: 'बल तथा गति के नियम', sets: 4, questions: 80, completed: false }
    ]
  },
  {
    id: 'maths',
    name: 'गणित (Mathematics)',
    enSubtitle: 'NCERT प्रश्नावली व प्रमेय',
    icon: '📐',
    chaptersCount: 12,
    questionsCount: 280,
    progress: 42,
    tag: 'दैनिक अभ्यास',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    chapters: [
      { id: 'm1', no: 'अध्याय 1', title: 'संख्या पद्धति (Number Systems)', sets: 4, questions: 80, completed: true, score: '19/20' },
      { id: 'm2', no: 'अध्याय 2', title: 'बहुपद (Polynomials)', sets: 5, questions: 100, completed: false, inProgress: true },
      { id: 'm3', no: 'अध्याय 3', title: 'निर्देशांक ज्यामिति (Coordinate Geometry)', sets: 3, questions: 60, completed: false },
      { id: 'm4', no: 'अध्याय 4', title: 'दो चरों वाले रैखिक समीकरण', sets: 4, questions: 80, completed: false },
      { id: 'm5', no: 'अध्याय 5', title: 'त्रिभुज एवं रेखाएं (Lines & Angles)', sets: 5, questions: 100, completed: false }
    ]
  },
  {
    id: 'social',
    name: 'सामाजिक विज्ञान (SST)',
    enSubtitle: 'इतिहास, भूगोल, नागरिक शास्त्र व अर्थशास्त्र',
    icon: '🌍',
    chaptersCount: 18,
    questionsCount: 350,
    progress: 25,
    tag: 'स्कोर बूस्टर',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    chapters: [
      { id: 'sst1', no: 'इतिहास 1', title: 'फ्रांसीसी क्रांति (French Revolution)', sets: 4, questions: 80, completed: true, score: '17/20' },
      { id: 'sst2', no: 'भूगोल 1', title: 'भारत: आकार और स्थिति', sets: 4, questions: 80, completed: false, inProgress: true },
      { id: 'sst3', no: 'नागरिक 1', title: 'लोकतंत्र क्या? लोकतंत्र क्यों?', sets: 3, questions: 60, completed: false },
      { id: 'sst4', no: 'अर्थशास्त्र 1', title: 'पालमपुर गाँव की कहानी', sets: 3, questions: 60, completed: false }
    ]
  },
  {
    id: 'hindi',
    name: 'हिंदी व्याकरण व साहित्य',
    enSubtitle: 'क्षितिज, कृतिका व व्यावहारिक व्याकरण',
    icon: '📚',
    chaptersCount: 10,
    questionsCount: 190,
    progress: 80,
    tag: 'टॉप स्कोरिंग',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    chapters: [
      { id: 'h1', no: 'व्याकरण 1', title: 'उपसर्ग, प्रत्यय और समास', sets: 4, questions: 80, completed: true, score: '20/20' },
      { id: 'h2', no: 'व्याकरण 2', title: 'वाक्य भेद व अलंकार', sets: 4, questions: 80, completed: true, score: '18/20' },
      { id: 'h3', no: 'क्षितिज 1', title: 'दो बैलों की कथा (प्रेमचंद)', sets: 3, questions: 60, completed: true, score: '19/20' }
    ]
  },
  {
    id: 'english',
    name: 'English Grammar & Beehive',
    enSubtitle: 'Tenses, Modals, Comprehension & Literature',
    icon: '📝',
    chaptersCount: 8,
    questionsCount: 160,
    progress: 35,
    tag: 'Board Essential',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    chapters: [
      { id: 'e1', no: 'Unit 1', title: 'The Fun They Had & Passive Voice', sets: 4, questions: 80, completed: true, score: '15/20' },
      { id: 'e2', no: 'Grammar', title: 'Tenses, Modals & Determiners', sets: 4, questions: 80, completed: false, inProgress: true },
      { id: 'e3', no: 'Unit 2', title: 'The Sound of Music & Reported Speech', sets: 3, questions: 60, completed: false }
    ]
  }
];

const AVAILABLE_BOARDS = [
  { id: 'cbse', name: 'CBSE (NCERT)', full: 'Central Board of Secondary Education' },
  { id: 'up', name: 'UP Board (हिंदी माध्यम)', full: 'उत्तर प्रदेश माध्यमिक शिक्षा परिषद्' },
  { id: 'mp', name: 'MP Board (NCERT)', full: 'मध्य प्रदेश माध्यमिक शिक्षा मंडल' },
  { id: 'bihar', name: 'Bihar Board (BSEB)', full: 'बिहार विद्यालय परीक्षा समिति' },
  { id: 'icse', name: 'ICSE Board', full: 'CISCE Curriculum' }
];

const CLASSES_LIST = [
  { grade: 6, title: 'कक्षा 6 (Class 6)', desc: 'फाउंडेशन व बुनियादी अभ्यास' },
  { grade: 7, title: 'कक्षा 7 (Class 7)', desc: 'मिडिल स्कूल संकल्पनाएं' },
  { grade: 8, title: 'कक्षा 8 (Class 8)', desc: 'बोर्ड पूर्व तैयारी व बुनियादी विज्ञान' },
  { grade: 9, title: 'कक्षा 9 (Class 9)', desc: 'सक्रिय कक्षा • माध्यमिक आधार', active: true },
  { grade: 10, title: 'कक्षा 10 (Class 10)', desc: 'बोर्ड परीक्षा स्पेशल मॉक टेस्ट' },
  { grade: 11, title: 'कक्षा 11 (Class 11)', desc: 'साइंस / कॉमर्स / आर्ट्स स्ट्रीम' },
  { grade: 12, title: 'कक्षा 12 (Class 12)', desc: 'बोर्ड टॉपर्स व एंट्रेंस टेस्ट सीरीज' }
];

export default function SchoolStudyClient() {
  const router = useRouter();

  // Navigation & Preferences
  const [activeBottomNav, setActiveBottomNav] = useState('school');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [studentXP, setStudentXP] = useState(1450);
  const [selectedClass, setSelectedClass] = useState('Class 9');
  const [selectedBoard, setSelectedBoard] = useState('CBSE (NCERT)');

  // Modals & Sheets
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isTestEngineOpen, setIsTestEngineOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isDailyTestOpen, setIsDailyTestOpen] = useState(false);
  const [isPastTestsOpen, setIsPastTestsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [upcomingNotified, setUpcomingNotified] = useState(false);

  // Active Daily Quiz Question Simulation
  const [dailyQStep, setDailyQStep] = useState(0);
  const [dailySelectedOpt, setDailySelectedOpt] = useState(null);

  const triggerSound = (type = 'click') => {
    playAcademicSound(type, soundEnabled);
  };

  const handleOpenSubject = (subject) => {
    triggerSound('click');
    setSelectedSubject(subject);
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 flex justify-center text-slate-800 antialiased font-sans select-none">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-[430px] min-h-screen bg-slate-50 flex flex-col relative shadow-2xl border-x border-slate-200 overflow-x-hidden">
        
        {/* ================= 1. ACADEMIC TOP HEADER ================= */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shadow-2xs">
          {/* Logo & Study Tag */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer" onClick={() => triggerSound('click')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
              <GraduationCap className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-900">
                  Quiz<span className="text-indigo-600">Web</span>
                </span>
                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded-md">
                  छात्र हब
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">कक्षा 6–12 अध्ययन</p>
            </div>
          </Link>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playAcademicSound('click', true);
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${
                soundEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'ध्वनि चालू' : 'ध्वनि बंद'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notification Bell with Badge */}
            <button
              onClick={() => {
                triggerSound('click');
                setIsNotificationsOpen(true);
              }}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/70 flex items-center justify-center text-slate-700 relative active:scale-95 transition"
              aria-label="सूचनाएं"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse" />
            </button>

            {/* Student Profile Avatar with Level Badge */}
            <div
              onClick={() => {
                triggerSound('xp');
                setIsLeaderboardOpen(true);
              }}
              className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl cursor-pointer active:scale-95 transition"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-black shadow-2xs">
                9वीं
              </div>
              <span className="text-[11px] font-black text-amber-900 font-mono">L6</span>
            </div>
          </div>
        </header>

        {/* ================= PINNED CURRICULUM ANCHOR BANNER ================= */}
        <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50 to-indigo-50/60 border-b border-indigo-100/80 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                सक्रिय पाठ्यक्रम व बोर्ड
              </span>
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                {selectedClass} — {selectedBoard}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerSound('click');
              setIsClassModalOpen(true);
            }}
            className="text-[11px] font-black text-indigo-700 bg-white hover:bg-indigo-50 active:scale-95 px-2.5 py-1.5 rounded-xl border border-indigo-200 shadow-2xs flex items-center gap-1 transition"
          >
            <SlidersHorizontal className="w-3 h-3 text-indigo-600" />
            <span>कक्षा बदलें</span>
          </button>
        </div>

        {/* ================= MAIN SCROLL CONTENT ================= */}
        <main className="flex-1 px-3.5 pt-3 pb-32 space-y-4 overflow-y-auto">

          {/* ================= 2. GAMIFIED STUDY STREAK & XP DECK ================= */}
          <section className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm relative overflow-hidden">
            {/* Ambient Background Aura */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-amber-50 rounded-full blur-2xl pointer-events-none -ml-8 -mb-8" />

            <div className="relative z-10 space-y-3">
              {/* Header: Streak & XP Counter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
                    <Flame className="w-6 h-6 fill-amber-500 text-amber-500 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 leading-tight flex items-center gap-1.5">
                      <span>5 दिन की पढ़ाई स्ट्रीक!</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md">सक्रिय</span>
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      लगातार अभ्यास से परीक्षा में 25% अधिक अंक पाएं!
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => {
                    triggerSound('xp');
                    setStudentXP((x) => x + 10);
                  }}
                  className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-xl text-xs font-black text-indigo-700 cursor-pointer active:scale-95 transition shadow-2xs font-mono"
                  title="+10 XP बोनस"
                >
                  <Zap className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
                  <span>{studentXP} XP</span>
                </div>
              </div>

              {/* Scholar Level Progress Bar */}
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                    लेवल 6 स्कॉलर (Scholar)
                  </span>
                  <span className="text-indigo-600 font-bold text-[11px] font-mono">
                    72% (550 XP to Level 7)
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 h-1.5 rounded-full transition-all duration-700"
                    style={{ width: '72%' }}
                  />
                </div>
              </div>

              {/* Mon to Sun Milestone Dots */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {[
                  { day: 'सोम', done: true },
                  { day: 'मंगल', done: true },
                  { day: 'बुध', done: true },
                  { day: 'गुरु', done: true },
                  { day: 'शुक्र', today: true, active: true },
                  { day: 'शनि', done: false },
                  { day: 'रवि', done: false }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-slate-400">{item.day}</span>
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                        item.done
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : item.today
                          ? 'bg-amber-400 text-amber-950 shadow-sm ring-2 ring-amber-300 animate-bounce'
                          : 'bg-slate-100 text-slate-300 border border-slate-200/70'
                      }`}
                      style={{ animationDuration: '3s' }}
                    >
                      {item.done ? '✓' : item.today ? '🔥' : '·'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Leaderboard CTA Button */}
              <button
                onClick={() => {
                  triggerSound('click');
                  setIsLeaderboardOpen(true);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-200/80 transition active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>🏆 क्लास 9 लीडरबोर्ड व अपनी रैंक देखें →</span>
              </button>
            </div>
          </section>

          {/* ================= 3. DAILY SPRINT & CUSTOM TEST ENGINE ================= */}
          <section className="grid grid-cols-2 gap-2.5">
            {/* Daily Chapter Test Card */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/40 to-white rounded-3xl p-3.5 border border-amber-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    दैनिक टारगेट
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">10 प्रश्न</span>
                </div>
                <h3 className="text-xs font-black text-slate-900 leading-snug">
                  आज का अभ्यास (Daily Test)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  कक्षा 9 विज्ञान व गणित स्पेशल
                </p>
              </div>

              <div className="mt-3 flex items-center gap-1.5">
                <button
                  onClick={() => {
                    triggerSound('click');
                    setIsDailyTestOpen(true);
                  }}
                  className="flex-1 py-2 px-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>शुरू करें ▶</span>
                </button>
                <button
                  onClick={() => {
                    triggerSound('click');
                    setIsPastTestsOpen(true);
                  }}
                  className="w-8 h-8 rounded-xl bg-white border border-amber-200 hover:bg-amber-50 text-amber-800 text-xs font-bold flex items-center justify-center shadow-2xs active:scale-95 transition shrink-0"
                  title="पुराने पेपर्स"
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Custom GK & Test Engine Card */}
            <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-50/40 to-white rounded-3xl p-3.5 border border-indigo-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                    कस्टम टेस्ट
                  </span>
                  <span className="text-[9px] font-black text-white bg-indigo-600 px-1.5 py-0.2 rounded font-sans">
                    NEW
                  </span>
                </div>
                <h3 className="text-xs font-black text-slate-900 leading-snug">
                  GK व टेस्ट इंजन
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  2 टैप में मनचाहा टेस्ट सेट बनाएं
                </p>
              </div>

              <div className="mt-3">
                <button
                  onClick={() => {
                    triggerSound('click');
                    setIsTestEngineOpen(true);
                  }}
                  className="w-full py-2 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3 fill-white" />
                  <span>टेस्ट बनाएं →</span>
                </button>
              </div>
            </div>
          </section>

          {/* ================= 4. SCHOOL SYLLABUS SUBJECT CARDS ================= */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>स्कूल पाठ्यक्रम (School Syllabus)</span>
                </h2>
                <p className="text-[10px] text-slate-400 font-medium">
                  NCERT व बोर्ड अनुसार अध्याय-वार वस्तुनिष्ठ प्रश्न
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-xl border border-indigo-100">
                5 सक्रिय विषय
              </span>
            </div>

            {/* List of Active Subjects */}
            <div className="space-y-2.5">
              {SUBJECTS_DATA.map((subject) => (
                <div
                  key={subject.id}
                  onClick={() => handleOpenSubject(subject)}
                  className="bg-white rounded-3xl p-3.5 border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform shrink-0">
                      {subject.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {subject.name}
                        </h3>
                        {subject.tag && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border ${subject.badgeColor}`}>
                            {subject.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                        {subject.chaptersCount} अध्याय • {subject.questionsCount} प्रश्न
                      </p>

                      {/* Mini Progress Bar */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${subject.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold font-mono">
                          {subject.progress}% पूरा
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-black text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white px-2.5 py-1.5 rounded-xl border border-indigo-100 transition-all shrink-0">
                    <span>अभ्यास</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Consolidated Single Upcoming Subjects Banner */}
            <div className="bg-gradient-to-r from-slate-100/90 via-indigo-50/50 to-slate-100/90 border border-dashed border-slate-300 rounded-3xl p-3.5 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs font-black text-slate-700">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>अन्य विषय (संस्कृत, कंप्यूटर, अर्थशास्त्र...) जल्द उपलब्ध</span>
              </div>
              <p className="text-[11px] text-slate-500">
                हमारे शिक्षक नवीनतम NCERT पैटर्न के आधार पर नए सेट्स तैयार कर रहे हैं।
              </p>

              <button
                onClick={() => {
                  triggerSound('success');
                  setUpcomingNotified(!upcomingNotified);
                }}
                className={`text-xs font-black px-3.5 py-1.5 rounded-xl border transition-all active:scale-95 ${
                  upcomingNotified
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-white text-indigo-700 border-slate-200 hover:bg-indigo-50'
                }`}
              >
                {upcomingNotified ? '✓ नोटिफिकेशन सेट हो गया!' : '🔔 नया विषय जुड़ते ही मुझे बताएं'}
              </button>
            </div>
          </section>

          {/* ================= 5. MASTER FEATURES & PREPARATION HUBS ================= */}
          <section className="space-y-2.5">
            <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5 px-1">
              <span>🎯</span>
              <span>मास्टर फीचर्स व परीक्षा हब (Exam Hubs)</span>
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Olympiad Hub */}
              <div 
                onClick={() => {
                  triggerSound('click');
                  alert("🏛️ ओलंपियाड व NTSE टेस्ट सीरीज लोड हो रही है...");
                }}
                className="p-3 bg-white border border-slate-200/90 rounded-2xl hover:border-indigo-300 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">🏛️</span>
                  <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">40+ EXAMS</span>
                </div>
                <h3 className="text-xs font-black text-slate-900 leading-tight">ओलंपियाड व NTSE</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">राष्ट्रीय छात्रवृत्ति व PYQ</p>
              </div>

              {/* Student GK & News */}
              <div 
                onClick={() => {
                  triggerSound('click');
                  alert("📰 दैनिक बाल करंट अफेयर्स टेस्ट खुल रहा है...");
                }}
                className="p-3 bg-white border border-slate-200/90 rounded-2xl hover:border-indigo-300 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">📰</span>
                  <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">DAILY</span>
                </div>
                <h3 className="text-xs font-black text-slate-900 leading-tight">दैनिक करंट अफेयर्स</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">आज के 10 मुख्य सवाल व टेस्ट</p>
              </div>

              {/* 60s True/False Drill */}
              <div 
                onClick={() => {
                  triggerSound('click');
                  alert("⚡ 60s सही या गलत रैपिड फायर शुरू हो रहा है!");
                }}
                className="p-3 bg-white border border-slate-200/90 rounded-2xl hover:border-indigo-300 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">⚡</span>
                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">RAPID</span>
                </div>
                <h3 className="text-xs font-black text-slate-900 leading-tight">60s सही या गलत</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">रैपिड फायर स्पीड ड्रिल</p>
              </div>

              {/* KBC Style Trivia */}
              <div 
                onClick={() => {
                  triggerSound('click');
                  alert("🧠 रोचक तथ्य व KBC ट्रिविया मोड सक्रिय!");
                }}
                className="p-3 bg-white border border-slate-200/90 rounded-2xl hover:border-indigo-300 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">🧠</span>
                  <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">TRIVIA</span>
                </div>
                <h3 className="text-xs font-black text-slate-900 leading-tight">रोचक तथ्य व KBC</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">1,000+ अद्भुत ज्ञान प्रश्न</p>
              </div>
            </div>
          </section>

        </main>

        {/* ================= MODAL 1: CLASS & BOARD SELECTION ================= */}
        {isClassModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    🎓
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">अपनी कक्षा व बोर्ड चुनें</h3>
                    <p className="text-[10px] text-slate-400">कक्षा के अनुसार प्रश्न बदल जाएंगे</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsClassModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Board Selector Pills */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">परीक्षा बोर्ड:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {AVAILABLE_BOARDS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        triggerSound('click');
                        setSelectedBoard(b.name);
                      }}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all ${
                        selectedBoard === b.name
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Classes List */}
              <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                <label className="text-[11px] font-bold text-slate-700">कक्षा चुनें (Classes):</label>
                <div className="space-y-1.5">
                  {CLASSES_LIST.map((cls) => {
                    const isSelected = selectedClass.includes(`${cls.grade}`);
                    return (
                      <div
                        key={cls.grade}
                        onClick={() => {
                          triggerSound('click');
                          setSelectedClass(`Class ${cls.grade}`);
                          setIsClassModalOpen(false);
                          alert(`🎉 पाठ्यक्रम बदलकर "Class ${cls.grade} — ${selectedBoard}" कर दिया गया है!`);
                        }}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] ${
                          isSelected
                            ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/15 shadow-2xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className={`text-xs font-black ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                            {cls.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{cls.desc}</p>
                        </div>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 2: CHAPTER & TEST SET SELECTOR ================= */}
        {selectedSubject && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-slate-100 max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl p-1 bg-slate-50 rounded-2xl border border-slate-200">
                    {selectedSubject.icon}
                  </span>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{selectedSubject.name}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">{selectedSubject.enSubtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Summary Pill */}
              <div className="bg-indigo-50/80 p-2.5 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-900">कुल तैयारी:</span>
                <span className="font-black text-indigo-700 font-mono">
                  {selectedSubject.progress}% पूरा ({selectedSubject.chaptersCount} अध्याय)
                </span>
              </div>

              {/* Chapter Items List */}
              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                <p className="text-xs font-black text-slate-700">अध्याय चुनें (Select Chapter):</p>
                {selectedSubject.chapters.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => {
                      triggerSound('success');
                      alert(`🚀 "${ch.title}" का 20 प्रश्नों का अभ्यास टेस्ट शुरू हो रहा है!`);
                      setSelectedSubject(null);
                    }}
                    className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200/90 hover:border-indigo-300 rounded-2xl cursor-pointer transition-all flex items-center justify-between group active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-indigo-600 bg-white border border-indigo-100 px-1.5 py-0.2 rounded">
                          {ch.no}
                        </span>
                        {ch.completed && (
                          <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                            {ch.score} ⭐
                          </span>
                        )}
                        {ch.inProgress && (
                          <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                            चालू
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1 group-hover:text-indigo-600 transition-colors">
                        {ch.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {ch.sets} सेट्स • {ch.questions} प्रश्न उपलब्ध
                      </p>
                    </div>

                    <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Launch Button */}
              <button
                onClick={() => {
                  triggerSound('success');
                  alert(`🎯 "${selectedSubject.name}" का रैंडम 20 प्रश्नों का मॉक टेस्ट लोड हो रहा है...`);
                  setSelectedSubject(null);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>पूरे विषय का रैंडम टेस्ट दें</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL 3: LEADERBOARD ================= */}
        {isLeaderboardOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Trophy className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">क्लास 9 टॉप स्कॉलर्स</h3>
                    <p className="text-[10px] text-slate-500 font-medium">साप्ताहिक अध्ययन रैंक</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLeaderboardOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Top 3 Podium */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 flex flex-col items-center">
                  <span className="text-xl">🥈</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 line-clamp-1">प्रिया श.</p>
                  <span className="text-[10px] font-bold text-indigo-600 font-mono">1,820 XP</span>
                </div>
                <div className="bg-gradient-to-b from-amber-50 to-white border-2 border-amber-300 rounded-2xl p-2.5 flex flex-col items-center -mt-2 shadow-sm">
                  <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <p className="text-xs font-black text-slate-900 mt-0.5 line-clamp-1">आदित्य व.</p>
                  <span className="text-[10px] font-black text-amber-800 font-mono">2,140 XP</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 flex flex-col items-center">
                  <span className="text-xl">🥉</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 line-clamp-1">रोहन सिंह</p>
                  <span className="text-[10px] font-bold text-indigo-600 font-mono">1,690 XP</span>
                </div>
              </div>

              {/* Your Rank Card */}
              <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-[11px] font-mono">
                    #8
                  </span>
                  <div>
                    <p className="font-black text-slate-900">आपकी रैंक (कक्षा 9)</p>
                    <p className="text-[10px] text-slate-500">टॉप 5% विद्यार्थियों में</p>
                  </div>
                </div>
                <span className="font-black text-indigo-700 font-mono">{studentXP} XP</span>
              </div>

              <button
                onClick={() => setIsLeaderboardOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                बंद करें
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL 4: TEST ENGINE QUICK MAKER ================= */}
        {isTestEngineOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-indigo-200 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Zap className="w-4 h-4 fill-indigo-600" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900">कस्टम टेस्ट इंजन</h3>
                </div>
                <button
                  onClick={() => setIsTestEngineOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">प्रश्नों की संख्या चुनें:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[10, 20, 30].map((q) => (
                      <button
                        key={q}
                        className="py-2 rounded-xl border border-slate-200 font-black text-slate-800 hover:border-indigo-600 hover:bg-indigo-50"
                      >
                        {q} प्रश्न
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">शामिल विषय:</label>
                  <div className="space-y-1">
                    {['विज्ञान (Science)', 'गणित (Maths)', 'सामाजिक विज्ञान'].map((sub, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-800">{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerSound('success');
                  alert("⚡ आपका कस्टमाइज्ड मॉक टेस्ट तैयार हो गया है!");
                  setIsTestEngineOpen(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95"
              >
                मॉक टेस्ट शुरू करें 🚀
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL 5: DAILY TEST INTERACTIVE RUNNER ================= */}
        {isDailyTestOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  दैनिक टेस्ट • प्रश्न 1/10
                </span>
                <button
                  onClick={() => {
                    setIsDailyTestOpen(false);
                    setDailySelectedOpt(null);
                  }}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500">कक्षा 9 विज्ञान (अध्याय 1)</h4>
                <p className="text-sm font-black text-slate-900 leading-snug">
                  पदार्थ के कणों के बीच क्या होता है?
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2 text-xs">
                {[
                  'A) केवल आकर्षण बल',
                  'B) रिक्त स्थान और निरंतर गति',
                  'C) कोई गति नहीं होती',
                  'D) स्थिर स्थिति'
                ].map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      triggerSound('click');
                      setDailySelectedOpt(i);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left font-bold transition-all ${
                      dailySelectedOpt === i
                        ? i === 1
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                          : 'border-rose-400 bg-rose-50 text-rose-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{opt}</span>
                  </button>
                ))}
              </div>

              {dailySelectedOpt !== null && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-bold">
                  {dailySelectedOpt === 1 ? '🎉 सही उत्तर! (+10 XP प्राप्त)' : 'गलत उत्तर! सही विकल्प B है।'}
                </div>
              )}

              <button
                onClick={() => {
                  triggerSound('xp');
                  alert("🌟 दैनिक टेस्ट पूर्ण हुआ! आपने 10 में से 9 प्रश्न सही किए (+40 XP)।");
                  setStudentXP((x) => x + 40);
                  setIsDailyTestOpen(false);
                  setDailySelectedOpt(null);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-xs"
              >
                सबमिट करें
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL 6: PAST TESTS ARCHIVE ================= */}
        {isPastTestsOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>पुराने दैनिक टेस्ट</span>
                </h3>
                <button onClick={() => setIsPastTestsOpen(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs font-bold">
                {[
                  { date: 'कल (Yesterday)', score: '9/10 ⭐', status: 'पूर्ण' },
                  { date: '14 अक्टूबर 2026', score: '10/10 🌟', status: 'पूर्ण' },
                  { date: '13 अक्टूबर 2026', score: '8/10 ⭐', status: 'पूर्ण' },
                  { date: '12 अक्टूबर 2026', score: 'छूट गया', status: 'दोबारा दें' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span>{item.date}</span>
                    <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 7: NOTIFICATIONS ================= */}
        {isNotificationsOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-indigo-600" />
                  <span>अध्ययन सूचनाएं</span>
                </h3>
                <button onClick={() => setIsNotificationsOpen(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="font-black text-indigo-950">🔥 स्ट्रीक रिमाइंडर</p>
                  <p className="text-slate-600 mt-0.5">आज का अभ्यास पूरा करके अपनी 5 दिन की स्ट्रीक को सुरक्षित रखें!</p>
                </div>
                <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="font-black text-amber-950">📐 नया अध्याय जोड़ा गया</p>
                  <p className="text-slate-600 mt-0.5">गणित: "निर्देशांक ज्यामिति" के 60 नए प्रश्न अब उपलब्ध हैं।</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
