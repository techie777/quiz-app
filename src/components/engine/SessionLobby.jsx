"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSessionEngine } from '@/engine/SessionProvider';
import { useLanguage } from '@/context/LanguageContext';
import socketService from '@/engine/lib/socket';
import toast from 'react-hot-toast';
import axios from 'axios';
import { GraduationCap, ShieldCheck, Clock, Award, AlertTriangle, Users, Copy, Share2, Play, CheckCircle2, Lock } from 'lucide-react';

/**
 * SESSION LOBBY V7.0 - COMPACT & ORGANIZED EDITION
 * - Centered max-w-4xl container (no wide desktop stretching)
 * - 52px slim status header with outlined safe exit button
 * - Combined single-card Invite Box (Room Code + Copy + Link + WhatsApp)
 * - Sets Grid (3-4 cols desktop, 2 cols mobile, ~76px card height)
 * - Sets Range Tabs (1-24, 25-48...) & Set Number quick search
 * - Single-row compact Timer selector (zero broken Hindi letter-spacing)
 * - Desktop sticky sidebar start panel & mobile sticky bottom action bar
 * - Clean Question Preview drawer/modal
 */

export default function SessionLobby({ sessionId, isHost, onApproveGuest, onDenyGuest, sessionDuration = 0, onLeave }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const { participants, pendingParticipants, session, sendAction, syncSquad, sessionReady, playSessionSound } = useSessionEngine();
  const { t, isHindi } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const prevParticipantsCount = useRef(participants.length);

  // Categories & Set Selection state
  const [maxQuestions, setMaxQuestions] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [navStack, setNavStack] = useState([]);
  const [currentParentId, setCurrentParentId] = useState(null);
  
  // Set Pagination / Filter state
  const [selectedSetIndex, setSelectedSetIndex] = useState(1);
  const [setRangePage, setSetRangePage] = useState(0);
  const [setFilterText, setSetFilterText] = useState('');
  
  // Question Preview state
  const [previewSetIndex, setPreviewSetIndex] = useState(null);
  const [previewQuestions, setPreviewQuestions] = useState({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const isInitialLoad = useRef(true);

  // B2B Live Exam State
  const [b2bTest, setB2bTest] = useState(null);
  const [isB2BMode, setIsB2BMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('b2b') === 'true' || (sessionId && sessionId.includes('-'));
    }
    return false;
  });
  const [b2bLoading, setB2bLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('b2b') === 'true' || (sessionId && sessionId.includes('-'));
    }
    return false;
  });

  useEffect(() => {
    const checkB2B = async () => {
      try {
        const res = await axios.get(`/api/b2b/tests/${sessionId}?role=${isHost ? 'host' : 'student'}`);
        if (res.data && !res.data.error) {
          setB2bTest(res.data);
          setIsB2BMode(true);
          if (typeof window !== 'undefined') {
            setInviteUrl(`${window.location.origin}/t/${sessionId}`);
          }
        } else {
          setIsB2BMode(false);
        }
      } catch (err) {
        setIsB2BMode(false);
      } finally {
        setB2bLoading(false);
      }
    };
    if (sessionId) checkB2B();
  }, [sessionId, isHost]);

  // Sync squad periodically for host
  useEffect(() => {
    if (isHost && sessionId) {
      const interval = setInterval(() => {
        syncSquad();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isHost, sessionId, syncSquad]);

  // Toast on participant departure
  useEffect(() => {
    if (participants.length < prevParticipantsCount.current) {
      toast(t('live.lobby.toasts.left'), { icon: '👋', duration: 2500 });
    }
    prevParticipantsCount.current = participants.length;
  }, [participants.length, t]);

  // Initialize and register visibility listener
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/live/${sessionId}`;
      setInviteUrl(url);

      const handleVisibility = () => {
        socketService.getSocket()?.emit('USER_STATUS_UPDATE', { 
          sessionId, 
          status: document.visibilityState === 'visible' ? 'active' : 'idle' 
        });
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
    }
  }, [sessionId]);

  // Fetch preview questions on demand
  const fetchPreviewQuestions = async (setIdx) => {
    if (previewQuestions[setIdx]) {
      setPreviewSetIndex(previewSetIndex === setIdx ? null : setIdx);
      return;
    }

    setPreviewLoading(true);
    setPreviewSetIndex(setIdx);
    try {
      const skip = (setIdx - 1) * 20;
      if (selectedCategory?.questions?.length > 0) {
        const sliced = selectedCategory.questions.slice(skip, skip + 20);
        if (sliced.length > 0) {
          setPreviewQuestions(prev => ({ ...prev, [setIdx]: sliced }));
          return;
        }
      }
      const targetCatId = selectedCategory?.id || selectedCategory?.slug;
      const res = await axios.get(`/api/questions?categoryId=${targetCatId}&limit=20&skip=${skip}`);
      const qs = Array.isArray(res.data) ? res.data : (res.data?.questions || []);
      setPreviewQuestions(prev => ({ ...prev, [setIdx]: qs }));
    } catch (err) {
      toast.error(t('live.lobby.toasts.decryptFail'));
    } finally {
      setPreviewLoading(false);
    }
  };

  // Fetch categories with deep link handling
  useEffect(() => {
    const fetchCategories = async (parentId = null) => {
      if (!isHost) return;
      setLoading(true);
      try {
        const urlCategoryId = searchParams.get('categoryId');
        const urlSetParam = searchParams.get('setIndex');
        if (urlSetParam) {
          const parsedSet = parseInt(urlSetParam, 10);
          if (!isNaN(parsedSet) && parsedSet > 0) setSelectedSetIndex(parsedSet);
        }
        const targetId = parentId || currentParentId;

        // 1. Authoritative Deep Link Check
        if (urlCategoryId && isInitialLoad.current) {
          try {
            const directRes = await axios.get(`/api/categories/${urlCategoryId}`);
            if (directRes.data && !directRes.data.error) {
              const cat = directRes.data;
              setSelectedCategory(cat);
              setNavStack([cat]);
              if (cat.parentId) setCurrentParentId(cat.parentId);
            }
          } catch (e) {
            const res = await axios.get(`/api/categories?id=${urlCategoryId}&limit=1`);
            if (res.data.categories?.length > 0) {
              const cat = res.data.categories[0];
              setSelectedCategory(cat);
              setNavStack([cat]);
              if (cat.parentId) setCurrentParentId(cat.parentId);
            }
          }
          isInitialLoad.current = false;
        }

        // 2. Standard Category Retrieval
        let results = [];
        if (targetId) {
          const res = await axios.get(`/api/categories?parentId=${targetId}&limit=100`);
          results = res.data.categories || [];
          if (results.length === 0) {
            const leaf = navStack.find(n => n.id === targetId);
            if (leaf) {
              setSelectedCategory(leaf);
            } else {
              try {
                const directCat = await axios.get(`/api/categories/${targetId}`);
                if (directCat.data && !directCat.data.error) setSelectedCategory(directCat.data);
              } catch (e) {
                const resCat = await axios.get(`/api/categories?id=${targetId}&limit=1`);
                if (resCat.data.categories?.length > 0) setSelectedCategory(resCat.data.categories[0]);
              }
            }
          }
        } else {
          const res = await axios.get('/api/categories?limit=100&sortBy=popular');
          results = res.data.categories || [];
        }
        setCategories(results);
      } catch (err) {
        toast.error(t('live.lobby.toasts.desync'));
      } finally {
        setLoading(false);
        isInitialLoad.current = false;
      }
    };
    fetchCategories();
  }, [sessionId, isHost, currentParentId, searchParams, t, navStack]);

  const filteredCategories = useMemo(() => {
    const list = categories.length > 0 ? categories : [];
    if (!search) {
      return [...list].sort((a, b) => (b.questionCount || 0) - (a.questionCount || 0)).slice(0, 16);
    }
    return list.filter(c => (c?.topic || c?.name || '').toLowerCase().includes(search.toLowerCase())).slice(0, 16);
  }, [categories, search]);

  const hostMember = useMemo(() => {
    return (participants || []).find(p => p.role === 'HOST' || p.isHost);
  }, [participants]);

  const squadMembers = useMemo(() => {
    const seen = new Set();
    const unique = [];

    for (const p of (participants || [])) {
      if (!p) continue;
      if (p.role === 'HOST' || p.isHost) continue;
      if (isHost && (p.userId === session?.userId)) continue;
      if (p.isOnline === false || p.status === 'offline' || p.status === 'LEFT' || p.status === 'KICKED') continue;

      const key = p.userId || p.userName;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(p);
    }
    return unique;
  }, [participants, session?.userId, isHost]);

  const totalPlayerCount = useMemo(() => {
    return (hostMember || isHost ? 1 : 0) + squadMembers.length;
  }, [hostMember, isHost, squadMembers]);

  // Set Calculations: 24 sets per range tab
  const totalSets = useMemo(() => {
    return Math.ceil((selectedCategory?.questionCount || 0) / 20) || 1;
  }, [selectedCategory?.questionCount]);

  const SETS_PER_PAGE = 24;
  const totalRangeTabs = Math.ceil(totalSets / SETS_PER_PAGE);

  // Sync setRangePage when selectedSetIndex changes
  useEffect(() => {
    if (selectedSetIndex) {
      const pageForSet = Math.floor((selectedSetIndex - 1) / SETS_PER_PAGE);
      if (pageForSet !== setRangePage && !setFilterText) {
        setSetRangePage(pageForSet);
      }
    }
  }, [selectedSetIndex]);

  const displayedSets = useMemo(() => {
    if (setFilterText.trim()) {
      const q = setFilterText.trim();
      const matches = [];
      for (let i = 1; i <= totalSets; i++) {
        if (i.toString().includes(q)) matches.push(i);
      }
      return matches.slice(0, 48);
    }

    const start = setRangePage * SETS_PER_PAGE + 1;
    const end = Math.min(start + SETS_PER_PAGE - 1, totalSets);
    const list = [];
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  }, [totalSets, setFilterText, setRangePage]);

  const handleStart = () => {
    if (!selectedCategory) return toast.error(t('live.lobby.toasts.noTopic'));
    if (timeLimit === null) return toast.error(t('live.lobby.toasts.noTimer'));

    sendAction('START_SESSION', { 
      status: 'ACTIVE', 
      type: 'QUIZ', 
      activeContentId: selectedCategory?.id,
      missionName: selectedCategory?.topic || selectedCategory?.name,
      questionLimit: maxQuestions,
      timeLimit: timeLimit,
      setIndex: selectedSetIndex
    });
  };

  const handleStartB2B = () => {
    if (!b2bTest) return;
    playSessionSound('launch');
    sendAction('START_SESSION', { 
      status: 'ACTIVE', 
      type: 'QUIZ', 
      isB2B: true,
      testCode: sessionId,
      activeContentId: sessionId,
      missionName: b2bTest.testTitle || b2bTest.title,
      questionLimit: b2bTest.questionsCount || b2bTest.questions?.length || 20,
      b2bRules: b2bTest
    });
  };

  if (!mounted) return null;

  if (b2bLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse text-indigo-600 font-bold space-y-3 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-3xl shadow-sm">
          📡
        </div>
        <span className="text-sm">परीक्षा कक्ष लोड हो रहा है (Connecting to Exam Room)...</span>
      </div>
    );
  }

  // 🎓 B2B EXAM LOBBY VIEW
  if (isB2BMode && b2bTest) {
    const studentUrl = typeof window !== 'undefined' ? `${window.location.origin}/t/${sessionId}` : inviteUrl;
    const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `🎯 *${b2bTest.instituteName}* का लाइव टेस्ट शुरू होने वाला है!\n📝 टेस्ट: *${b2bTest.testTitle || b2bTest.title}*\n👉 टेस्ट में शामिल होने के लिए नीचे दिए गए लिंक पर क्लिक करें और अपना नाम व रोल नंबर दर्ज करें:\n${studentUrl}`
    )}`;

    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 px-3 sm:px-4 py-4 pb-28 text-slate-800">
        {/* Top Header Bar */}
        <div className="w-full bg-slate-900 text-white px-4 py-3 rounded-2xl flex items-center justify-between gap-3 border border-slate-800 shadow-md">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{isHost ? "परीक्षा नियंत्रक कक्ष" : "परीक्षा हॉल"}</span>
            </span>
            <span className="text-xs font-mono font-bold text-slate-300 bg-white/10 px-2.5 py-1 rounded-xl">
              CODE: {sessionId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
              👥 {totalPlayerCount} उपस्थित
            </span>
            {onLeave && (
              <button
                type="button"
                onClick={onLeave}
                className="px-3 py-1 rounded-xl text-xs font-bold text-slate-300 hover:text-red-400 hover:bg-red-500/10 border border-slate-700 transition-all cursor-pointer"
              >
                बाहर निकलें 🚪
              </button>
            )}
          </div>
        </div>

        {/* Institute & Test Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span className="text-xs sm:text-sm font-black text-indigo-600 tracking-wide uppercase">
                  {b2bTest.instituteName}
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {b2bTest.testTitle || b2bTest.title}
              </h1>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-2">
                {b2bTest.subject && <span>📖 {b2bTest.subject}</span>}
                {b2bTest.batchName && <span>• 🎓 {b2bTest.batchName}</span>}
              </p>
            </div>

            {/* Anti-cheat badge */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-800 text-xs font-bold shrink-0">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>लाइव प्रोक्टरिंग सक्रिय (Anti-Cheat Active)</span>
            </div>
          </div>

          {/* Test Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <div className="text-base font-black text-slate-900">
                {b2bTest.questionsCount || b2bTest.questions?.length || 20}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">कुल प्रश्न (Questions)</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <div className="text-base font-black text-slate-900">
                {b2bTest.timingType === "PER_QUESTION_TIMER"
                  ? `${b2bTest.perQuestionSeconds || 45}s`
                  : `${b2bTest.durationMinutes || 20}m`}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">
                {b2bTest.timingType === "PER_QUESTION_TIMER" ? "प्रति प्रश्न समय" : "कुल समय (Duration)"}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <div className="text-base font-black text-emerald-600">+{b2bTest.marksCorrect || 4}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">सही उत्तर अंक</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <div className="text-base font-black text-rose-600">
                {b2bTest.marksNegative > 0 ? `-${b2bTest.marksNegative}` : "0"}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">नेगेटिव मार्किंग</div>
            </div>
          </div>
        </div>

        {/* HOST VIEW: INVITE BOX & STUDENT ATTENDANCE ROSTER */}
        {isHost ? (
          <div className="space-y-5">
            {/* Share Link Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  <span>छात्रों को आमंत्रित करें (Student Link & WhatsApp)</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">Zero-Login Portal</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-indigo-600 truncate">
                  {studentUrl}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(studentUrl);
                      toast.success("छात्र टेस्ट लिंक कॉपी हो गया! 📋");
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>कॉपी लिंक</span>
                  </button>

                  <a
                    href={waShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <span>📲 WhatsApp पर भेजें</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Live Student Attendance Register */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    उपस्थित छात्र उपस्थिति रजिस्टर (Connected Examinees)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {squadMembers.length} विद्यार्थी
                </span>
              </div>

              {squadMembers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Users className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
                  <p className="text-xs font-bold text-slate-600">कोई छात्र अभी तक नहीं जुड़ा है</p>
                  <p className="text-[11px] text-slate-400">
                    ऊपर दिए गए लिंक को छात्रों को भेजें। जैसे-जैसे वे नाम व रोल नंबर भरकर प्रवेश करेंगे, वे यहाँ लाइव दिखाई देंगे।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {squadMembers.map((s, idx) => (
                    <div
                      key={s.userId || idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                          {s.userName?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{s.userName}</p>
                          <p className="text-[10px] font-mono font-bold text-indigo-600 truncate">
                            Roll: {s.rollNumber || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />
                        {onDenyGuest && (
                          <button
                            type="button"
                            onClick={() => onDenyGuest(s.userId)}
                            className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-500 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                            title="Remove Student"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Start Exam Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 shadow-2xl flex items-center justify-center">
              <button
                type="button"
                onClick={handleStartB2B}
                className="w-full max-w-md py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>लाइव परीक्षा शुरू करें (Start Live Exam)</span>
              </button>
            </div>
          </div>
        ) : (
          /* STUDENT WAITING ROOM */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-sm">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <span className="absolute inset-0 rounded-3xl bg-indigo-100 animate-ping opacity-60"></span>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl shadow-xl shadow-indigo-500/30">
                ⏳
              </div>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                शिक्षक के परीक्षा शुरू करने की प्रतीक्षा है...
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                आप परीक्षा हॉल में सफलतापूर्वक कनेक्टेड हैं। जैसे ही शिक्षक परीक्षा शुरू करेंगे, प्रश्न आपकी स्क्रीन पर अपने-आप लोड हो जाएंगे।
              </p>
            </div>

            {/* Student verified card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-flex items-center gap-4 text-xs text-left max-w-sm w-full mx-auto">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shrink-0">
                ✓
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">सत्यापित परीक्षार्थी</span>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {session?.userName || (typeof window !== 'undefined' ? localStorage.getItem(`b2b_student_name_${sessionId}`) : "") || "Student"}
                </p>
                <p className="text-[10px] font-mono text-indigo-600 font-bold">
                  Roll: {session?.rollNumber || (typeof window !== 'undefined' ? localStorage.getItem(`b2b_student_roll_${sessionId}`) : "") || "N/A"}
                </p>
              </div>
            </div>

            <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-2xl max-w-md mx-auto">
              ⚠️ ध्यान दें: परीक्षा के दौरान टैब न बदलें। सभी गतिविधियाँ शिक्षक द्वारा लाइव प्रोक्टर की जा रही हैं।
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pending guest approval state (Compact & clean)
  if (!isHost && session?.status === 'PENDING') {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center space-y-6 border border-slate-200 mt-8">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">{t('live.lobby.pending.title')}</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {t('live.lobby.pending.desc').replace('{host}', sessionId)}
          </p>
        </div>
        <div>
          <button 
            type="button"
            onClick={onLeave}
            className="text-xs font-bold text-red-500 hover:text-red-700 p-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition-all cursor-pointer"
          >
            {t('live.lobby.controls.exit')} 🚪
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 sm:gap-5 px-3 sm:px-4 py-3 sm:py-5 pb-24 lg:pb-6">
      
      {/* 🔴 SLIM TOP HEADER (Sleek Gaming Bar) */}
      <div className="w-full bg-gradient-to-r from-slate-950 via-[#0f172a] to-slate-950 text-white px-4 py-3 rounded-2xl flex items-center justify-between gap-3 border border-slate-800 shadow-md min-h-[52px] select-none">
        {/* Left: Status & Stats */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap min-w-0">
          <div className="flex items-center gap-2 shrink-0 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black text-emerald-300">
              {isHindi ? "लाइव रूम" : "Live Room"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl">
            <span className="text-slate-400 font-medium">{isHindi ? "समय:" : "Time:"}</span>
            <span className="font-mono font-black text-white tabular-nums">{formatDuration(sessionDuration)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl">
            <span className="text-slate-400 font-medium">{isHindi ? "खिलाड़ी:" : "Players:"}</span>
            <span className="font-black text-amber-300 tabular-nums">{totalPlayerCount}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isHost ? (
            <>
              <button
                type="button"
                onClick={() => { socketService.getSocket()?.emit('FORCE_ROOM_SYNC', { sessionId }); toast.success(t('live.lobby.toasts.syncComplete')); }}
                className="h-8.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title={t('live.lobby.controls.sync')}
              >
                <span>🔄</span>
                <span className="hidden sm:inline">{t('live.lobby.controls.sync')}</span>
              </button>

              <button
                type="button"
                onClick={() => { if(window.confirm(t('live.lobby.controls.terminateConfirm'))) sendAction('TERMINATE', { status: 'LOBBY' }); }}
                className="h-8.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title={t('live.lobby.controls.terminate')}
              >
                <span>🛑</span>
                <span>{isHindi ? "समाप्त करें" : "End Session"}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onLeave}
              className="h-8.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <span>🚪</span>
              <span>{t('live.lobby.controls.exit')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 👥 SECTION: COMBINED INVITE & PLAYERS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-start">
        
        {/* COMBINED INVITE CARD (8 cols on desktop) */}
        <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-3.5 select-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug tracking-tight">
                {isHindi ? "दोस्तों को आमंत्रित करें" : "Invite Friends"}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                {isHindi ? "रूम कोड या लिंक शेयर करके लाइव मुकाबला शुरू करें" : "Share room code or invite link to battle live"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-500/20">
              🚀
            </div>
          </div>

          {/* Room Code Banner - Electric Sharp Gradient */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50/60 to-pink-50/50 border border-indigo-200/90 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-indigo-200/90 text-indigo-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
                🔑
              </div>
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block leading-none mb-1">
                  ROOM CODE
                </span>
                <span className="font-mono font-black text-2xl sm:text-3xl text-slate-900 tracking-wider select-all leading-none">
                  {sessionId}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playSessionSound('click');
                navigator.clipboard.writeText(sessionId);
                toast.success(isHindi ? "रूम कोड कॉपी हो गया!" : "Room Code copied!");
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-indigo-600/25 flex items-center gap-1.5 active:scale-95"
            >
              <span>📋</span>
              <span>{isHindi ? "कोड कॉपी" : "Copy Code"}</span>
            </button>
          </div>

          {/* Action Row: Link Copy + WhatsApp Share */}
          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={() => {
                playSessionSound('click');
                navigator.clipboard.writeText(inviteUrl);
                toast.success(isHindi ? "आमंत्रण लिंक कॉपी हो गया!" : "Link copied!");
              }}
              className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer shadow-2xs"
            >
              <span>🔗</span>
              <span className="truncate">{isHindi ? "लिंक कॉपी करें" : "Copy Link"}</span>
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent((isHindi ? `🎮 मेरे साथ लाइव क्विज़ खेलें! रूम कोड: ${sessionId}\nलिंक: ` : `🎮 Play live quiz with me! Room Code: ${sessionId}\nLink: `) + inviteUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <span className="text-sm">💬</span>
              <span className="truncate">{isHindi ? "WhatsApp शेयर" : "WhatsApp"}</span>
            </a>
          </div>
        </div>

        {/* ACTIVE PLAYERS SIDEBAR (4 cols on desktop) */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3 select-none">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-base">👥</span>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                {isHindi ? "सक्रिय खिलाड़ी" : "Active Players"}
              </h3>
            </div>
            <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded-full">
              {totalPlayerCount}
            </span>
          </div>

          <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-0.5">
            {/* Host item */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-indigo-50/90 to-purple-50/40 border border-indigo-200/90 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  👑
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-indigo-950 truncate">
                    {isHost ? (isHindi ? "आप (होस्ट)" : "You (Host)") : (hostMember?.userName || "Host")}
                  </p>
                </div>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            {/* Squad members */}
            {squadMembers.map(p => (
              <div key={p.userId} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {p.userName?.[0] || 'P'}
                  </div>
                  <p className="text-xs font-medium text-slate-800 truncate">
                    {p.userName} {p.userId === session?.userId && `(${isHindi ? 'आप' : 'You'})`}
                  </p>
                </div>
                {isHost && (
                  <button
                    type="button"
                    onClick={() => sendAction('KICK_PARTICIPANT', { userId: p.userId })}
                    className="text-slate-400 hover:text-red-600 text-xs px-1 cursor-pointer"
                    title="हटाएं"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {squadMembers.length === 0 && (
              <p className="text-[11px] text-slate-400 text-center py-2">
                {isHindi ? "अन्य खिलाड़ियों के जुड़ने की प्रतीक्षा..." : "Waiting for players to join..."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 🎯 MAIN WORKSPACE: HOST (Topic/Set Selection) OR GUEST (Waiting State) */}
      {isHost ? (
        <div className="space-y-4">
          
          {/* STAGE 1: TOPIC SELECTION (When no category selected) */}
          {!selectedCategory ? (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5 sm:p-5 space-y-3.5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    {isHindi ? "क्विज़ विषय चुनें" : "Select Quiz Topic"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isHindi ? "लाइव मुकाबले के लिए एक विषय चुनें" : "Choose a topic to battle live"}
                  </p>
                </div>

                {/* Compact search input */}
                <div className="relative w-full sm:w-64">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                  <input
                    placeholder={isHindi ? "विषय खोजें..." : "Search topics..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {loading && categories.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
                  {isHindi ? "विषय लोड हो रहे हैं..." : "Loading topics..."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredCategories.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        playSessionSound('click');
                        setNavStack(prev => [...prev, c]);
                        setCurrentParentId(c.id);
                        setSelectedCategory(c);
                        setSelectedSetIndex(1);
                        setSetRangePage(0);
                        setSetFilterText('');
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/20 text-slate-900 transition-all text-left cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                        {c.emoji || '📚'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {c.topic || c.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {c.questionCount} {isHindi ? "प्रश्न" : "Questions"}
                        </p>
                      </div>
                      <span className="text-slate-300 group-hover:text-indigo-600 text-xs">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            
            /* STAGE 2: SET SELECTION (Desktop 2-column: Left = Sets Grid, Right = Sticky Timer & Start) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
              
              {/* LEFT COLUMN: Sets Grid (8 cols on desktop) */}
              <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5 sm:p-4 space-y-3.5">
                
                {/* Active Category Header + Change Button */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => { setSelectedCategory(null); setNavStack([]); setCurrentParentId(null); setPreviewSetIndex(null); }}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 cursor-pointer"
                      title={isHindi ? "विषय सूची पर वापस जाएं" : "Back to topics"}
                    >
                      ←
                    </button>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {selectedCategory.topic || selectedCategory.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {selectedCategory.questionCount} {isHindi ? "प्रश्न उपलब्ध" : "Questions"} • {totalSets} {isHindi ? "सेट" : "Sets"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setSelectedCategory(null); setNavStack([]); setCurrentParentId(null); setPreviewSetIndex(null); }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 shrink-0 cursor-pointer"
                  >
                    {isHindi ? "बदलें" : "Change"}
                  </button>
                </div>

                {/* Range Tabs & Quick Set Search */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    
                    {/* Range Tabs (e.g. 1-24, 25-48...) */}
                    {totalRangeTabs > 1 && (
                      <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
                        {Array.from({ length: totalRangeTabs }).map((_, tabIdx) => {
                          const start = tabIdx * SETS_PER_PAGE + 1;
                          const end = Math.min(start + SETS_PER_PAGE - 1, totalSets);
                          const isActive = setRangePage === tabIdx && !setFilterText;

                          return (
                            <button
                              key={tabIdx}
                              type="button"
                              onClick={() => {
                                setSetFilterText('');
                                setSetRangePage(tabIdx);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                isActive
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {start}–{end}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick Set Number Filter */}
                    <div className="relative w-full sm:w-44 shrink-0">
                      <input
                        placeholder={isHindi ? "सेट नं. ढूंढें (उदा. 5)..." : "Set no. (e.g. 5)..."}
                        value={setFilterText}
                        onChange={(e) => setSetFilterText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                      />
                      {setFilterText && (
                        <button
                          type="button"
                          onClick={() => setSetFilterText('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 🎴 SETS RESPONSIVE GRID (3 cols desktop, 2 cols mobile, ~80px height) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {displayedSets.map(setNum => {
                    const isSelected = selectedSetIndex === setNum;
                    const isPreviewing = previewSetIndex === setNum;

                    return (
                      <div
                        key={setNum}
                        onClick={() => {
                          playSessionSound('click');
                          setSelectedSetIndex(setNum);
                        }}
                        className={`min-h-[78px] p-2.5 sm:p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none relative overflow-hidden active:scale-98 ${
                          isSelected
                            ? 'bg-gradient-to-br from-indigo-50/95 via-purple-50/40 to-white border-indigo-600 text-indigo-950 shadow-md shadow-indigo-500/15 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-2xs text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs sm:text-sm font-black tracking-tight ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {isHindi ? `सेट ${setNum}` : `Set ${setNum}`}
                          </span>
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-200" />
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100/90">
                          <span className="font-bold text-slate-400">20 {isHindi ? "प्रश्न" : "Q"}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSessionSound('click');
                              fetchPreviewQuestions(setNum);
                            }}
                            className={`px-2 py-0.5 rounded-md font-bold text-[10.5px] transition-all flex items-center gap-1 cursor-pointer ${
                              isPreviewing
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 border border-slate-200/80'
                            }`}
                          >
                            <span>{isPreviewing ? (isHindi ? 'बंद' : 'Hide') : (isHindi ? 'देखें' : 'View')}</span>
                            <span className="text-[10px]">👁</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {displayedSets.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">
                    {isHindi ? "कोई सेट नहीं मिला।" : "No sets found."}
                  </p>
                )}
              </div>

              {/* RIGHT COLUMN: STICKY PANEL (Timer + Start Button + Question Preview) */}
              <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-3">
                
                {/* Compact Timer Selector */}
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <span>⏱️</span>
                      <span>{isHindi ? "प्रति प्रश्न समय" : "Question Timer"}</span>
                    </span>
                    <span className="text-xs font-bold text-indigo-600">
                      {timeLimit === 0 ? (isHindi ? "टाइमर बंद" : "Off") : `${timeLimit}s`}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 15, 30, 60].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => { playSessionSound('click'); setTimeLimit(val); }}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          timeLimit === val
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {val === 0 ? (isHindi ? "बंद" : "Off") : `${val}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Set Summary & Desktop Start Button */}
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{isHindi ? "चुना गया सेट:" : "Selected:"}</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {isHindi ? `सेट ${selectedSetIndex}` : `Set ${selectedSetIndex}`}
                    </span>
                  </div>

                  {/* Desktop Start Button (hidden on mobile, shown in lg) */}
                  <button
                    type="button"
                    onClick={() => { playSessionSound('launch'); handleStart(); }}
                    disabled={!selectedCategory || timeLimit === null}
                    className={`w-full h-12 rounded-xl text-sm font-black tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                      selectedCategory && timeLimit !== null
                        ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 active:scale-[0.98]'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-base">🚀</span>
                    <span>{isHindi ? "क्विज़ शुरू करें" : "Start Live Quiz"}</span>
                  </button>
                </div>

                {/* Question Preview Box (Shown when a set is being previewed) */}
                {previewSetIndex && (
                  <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-3.5 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-xs font-bold text-indigo-700">
                        {isHindi ? `सेट ${previewSetIndex} के प्रश्न` : `Set ${previewSetIndex} Questions`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewSetIndex(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        ✕ {isHindi ? "बंद करें" : "Close"}
                      </button>
                    </div>

                    {previewLoading && (
                      <p className="text-xs text-slate-400 text-center py-4 animate-pulse">
                        {isHindi ? "प्रश्न लोड हो रहे हैं..." : "Loading questions..."}
                      </p>
                    )}

                    <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-0.5">
                      {(previewQuestions[previewSetIndex] || []).map((q, idx) => (
                        <div key={q.id || idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                          <p className="font-bold text-slate-800 leading-snug">
                            {idx + 1}. {q.text}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(q.options || []).map((opt, oi) => (
                              <span key={oi} className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                                {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MOBILE STICKY BOTTOM ACTION BAR (Shown on small screens, hidden on desktop) */}
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-40 lg:hidden shadow-xl">
            <button
              type="button"
              onClick={() => { playSessionSound('launch'); handleStart(); }}
              disabled={!selectedCategory || timeLimit === null}
              className={`w-full h-12 rounded-xl text-sm font-black tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                selectedCategory && timeLimit !== null
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 active:scale-[0.98]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className="text-base">🚀</span>
              <span>{isHindi ? "क्विज़ शुरू करें" : "Start Live Quiz"}</span>
            </button>
          </div>
        </div>
      ) : (
        
        /* GUEST WAITING VIEW (Clean & non-bulky) */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 sm:p-10 text-center space-y-4 max-w-md mx-auto my-4">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-xs">
            🎮
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {isHindi ? "होस्ट का इंतज़ार है..." : "Waiting for Host..."}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isHindi 
                ? "होस्ट विषय और सेट चुन रहे हैं। मुकाबला जल्द शुरू होगा!" 
                : "Host is choosing topic and set. Battle will start shortly!"}
            </p>
          </div>
          <div className="flex justify-center gap-1.5 pt-2">
            {[1, 2, 3].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" style={{ animationDelay: `${i * 180}ms` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
