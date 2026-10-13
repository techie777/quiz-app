"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  Check,
  X,
  FileText,
  Home
} from "lucide-react";
import socketService from "@/engine/lib/socket";
import toast from "react-hot-toast";
import axios from "axios";

export default function B2BStudentExamPlayer({ session, testData: propTestData, sessionId, onLeave }) {
  const socket = socketService.getSocket();
  const testCode = session?.testCode || sessionId;

  // Local state for test questions & config
  const [testData, setTestData] = useState(propTestData || null);
  const [loading, setLoading] = useState(!propTestData);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Answers Map: { [questionIndex]: "A" | "B" | "C" | "D" }
  const [answers, setAnswers] = useState({});
  // Marked for Review Set: Set of question indices
  const [markedForReview, setMarkedForReview] = useState(new Set());

  // Exam Timer (Seconds remaining for the entire test)
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const [isPaused, setIsPaused] = useState(Boolean(session?.isPaused));

  // Anti-cheat tab tracking
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  // Student Info
  const studentName = session?.userName || (typeof window !== "undefined" ? localStorage.getItem(`b2b_student_name_${testCode}`) : "Student") || "Student";
  const rollNumber = session?.rollNumber || (typeof window !== "undefined" ? localStorage.getItem(`b2b_student_roll_${testCode}`) : "N/A") || "N/A";
  const studentId = session?.userId || (typeof window !== "undefined" ? localStorage.getItem(`quiz_uid_${testCode}`) : `student_${Date.now()}`) || `student_${Date.now()}`;

  // 1. Fetch Test Information if not already present
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/b2b/tests/${testCode}?role=student`);
        if (res.data && !res.data.error) {
          setTestData(res.data);
        }
      } catch (err) {
        console.error("Failed to load exam data:", err);
        toast.error("परीक्षा डेटा लोड करने में समस्या हुई।");
      } finally {
        setLoading(false);
      }
    };

    if (!testData || !testData.questions || testData.questions.length === 0) {
      fetchTest();
    } else {
      setLoading(false);
    }
  }, [testCode]);

  // 2. Initialize / Restore Exam Timer & Answers from localStorage
  const questions = useMemo(() => testData?.questions || [], [testData]);
  const totalQuestions = questions.length || 1;

  useEffect(() => {
    if (!testData || typeof window === "undefined") return;

    const cacheKey = `b2b_exam_state_${testCode}`;
    const saved = localStorage.getItem(cacheKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.answers && typeof parsed.answers === "object") {
          setAnswers(parsed.answers);
        }
        if (Array.isArray(parsed.marked)) {
          setMarkedForReview(new Set(parsed.marked));
        }
        if (typeof parsed.currentIndex === "number" && parsed.currentIndex < totalQuestions) {
          setCurrentIndex(parsed.currentIndex);
        }
        if (typeof parsed.secondsRemaining === "number" && parsed.secondsRemaining > 0) {
          setSecondsRemaining(parsed.secondsRemaining);
        } else if (testData.durationMinutes) {
          setSecondsRemaining(testData.durationMinutes * 60);
        }
        if (typeof parsed.tabSwitches === "number") {
          setTabSwitches(parsed.tabSwitches);
        }
        if (parsed.isFinished && parsed.submissionResult) {
          setIsFinished(true);
          setSubmissionResult(parsed.submissionResult);
        }
        return;
      } catch (e) {
        console.warn("Failed to parse cached exam state:", e);
      }
    }

    // Default timer initialization
    if (secondsRemaining === null) {
      const initialSeconds = (testData.durationMinutes || 20) * 60;
      setSecondsRemaining(initialSeconds);
    }
  }, [testData, testCode, totalQuestions]);

  // 3. Save progress to localStorage on any state change
  useEffect(() => {
    if (!testData || typeof window === "undefined" || isFinished) return;

    const cacheKey = `b2b_exam_state_${testCode}`;
    const stateToSave = {
      answers,
      marked: Array.from(markedForReview),
      currentIndex,
      secondsRemaining,
      tabSwitches,
      isFinished: false
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(stateToSave));
    } catch (e) {}
  }, [answers, markedForReview, currentIndex, secondsRemaining, tabSwitches, testData, testCode, isFinished]);

  // 4. Exam Countdown Timer (Pauses if teacher pauses test)
  useEffect(() => {
    if (secondsRemaining === null || isPaused || isFinished) return;

    if (secondsRemaining <= 0) {
      toast("समय समाप्त हो गया है! परीक्षा स्वतः जमा की जा रही है... ⏱️", { icon: "⌛" });
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, isPaused, isFinished]);

  // Format seconds to MM:SS or HH:MM:SS
  const formattedTime = useMemo(() => {
    if (secondsRemaining === null) return "--:--";
    const h = Math.floor(secondsRemaining / 3600);
    const m = Math.floor((secondsRemaining % 3600) / 60);
    const s = secondsRemaining % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, [secondsRemaining]);

  // 5. Socket Listeners for Host Events (Pause, Terminate, Broadcast)
  useEffect(() => {
    if (!socket) return;

    const handleStateUpdate = (data) => {
      if (data?.payload?.hasOwnProperty("isPaused")) {
        setIsPaused(Boolean(data.payload.isPaused));
        if (data.payload.isPaused) {
          toast("शिक्षक द्वारा परीक्षा रोक दी गई है (Paused) ⏸️", { duration: 4000 });
        } else {
          toast.success("परीक्षा पुनः शुरू हो गई है (Resumed) ▶️", { duration: 3000 });
        }
      }

      if (data?.action === "TERMINATED" || data?.payload?.status === "TERMINATED") {
        toast("शिक्षक द्वारा परीक्षा समाप्त कर दी गई है। परिणाम तैयार किया जा रहा है...", { duration: 4000 });
        handleAutoSubmit();
      }
    };

    socket.on("STATE_UPDATE", handleStateUpdate);

    return () => {
      socket.off("STATE_UPDATE", handleStateUpdate);
    };
  }, [socket]);

  // 6. Anti-Cheat Visibility / Tab Switch Detection
  useEffect(() => {
    if (isFinished) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setTabSwitches((prev) => {
          const next = prev + 1;
          setShowTabWarning(true);

          // Emit alert to examiner war room
          if (socket) {
            socket.emit("TAB_SWITCH_ALERT", {
              sessionId: testCode,
              userId: studentId,
              userName: studentName,
              rollNumber,
              switchCount: next
            });
          }
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [socket, testCode, studentId, studentName, rollNumber, isFinished]);

  // 7. Emit Live Telemetry to Teacher Cockpit
  const currentQ = questions[currentIndex];
  const selectedOpt = answers[currentIndex] || null;

  useEffect(() => {
    if (!socket || isFinished) return;

    socket.emit("STUDENT_TELEMETRY", {
      sessionId: testCode,
      userId: studentId,
      rollNumber,
      currentIndex,
      selectedOption: selectedOpt,
      tabSwitches,
      timeRemaining: secondsRemaining,
      isSubmitted: false
    });
  }, [socket, testCode, studentId, rollNumber, currentIndex, selectedOpt, tabSwitches, secondsRemaining, isFinished]);

  // Option Click Handler
  const handleSelectOption = (optionLetter) => {
    if (isPaused || isFinished) return;
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionLetter
    }));
  };

  // Clear current response
  const handleClearResponse = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentIndex];
      return next;
    });
  };

  // Toggle Mark for Review
  const handleToggleMarkReview = () => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Question Attempt Stats
  const attemptedCount = Object.keys(answers).length;
  const reviewCount = markedForReview.size;
  const unattemptedCount = Math.max(0, totalQuestions - attemptedCount);

  // Submit Handler
  const handleAutoSubmit = () => {
    if (isFinished || isSubmitting) return;
    performFinalSubmission();
  };

  const performFinalSubmission = async () => {
    try {
      setIsSubmitting(true);
      setShowSubmitModal(false);

      // Construct answers payload
      const answersPayload = questions.map((q, idx) => ({
        questionId: q.id,
        index: idx,
        selectedOption: answers[idx] || null
      }));

      const res = await axios.post(`/api/b2b/tests/${testCode}/submit`, {
        studentId,
        studentName,
        rollNumber,
        answers: answersPayload,
        tabSwitches
      });

      if (res.data?.success && res.data?.result) {
        const result = res.data.result;
        setSubmissionResult(result);
        setIsFinished(true);

        // Update localStorage
        if (typeof window !== "undefined") {
          const cacheKey = `b2b_exam_state_${testCode}`;
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              answers,
              marked: Array.from(markedForReview),
              currentIndex,
              secondsRemaining: 0,
              tabSwitches,
              isFinished: true,
              submissionResult: result
            })
          );
        }

        // Emit submit event to teacher
        if (socket) {
          socket.emit("SUBMIT_EXAM", {
            sessionId: testCode,
            userId: studentId,
            userName: studentName,
            rollNumber,
            answers: answersPayload,
            totalScore: result.totalScore,
            accuracy: result.accuracy,
            completedAt: Date.now()
          });
          socket.emit("UPDATE_STATUS", {
            sessionId: testCode,
            userId: studentId,
            status: "DONE"
          });
        }

        toast.success("परीक्षा सफलतापूर्वक जमा कर दी गई! 🏁", { duration: 4000 });
      } else {
        toast.error("जमा करने में समस्या हुई। कृपया पुनः प्रयास करें।");
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("सर्वर त्रुटि: परीक्षा जमा करने में समस्या हुई।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------- RENDER LOADING ----------------
  if (loading || !testData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-800">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-3xl animate-bounce mb-4 text-indigo-600 shadow-sm">
          📝
        </div>
        <p className="text-sm font-bold text-slate-600 animate-pulse tracking-wide">
          प्रश्न पत्र तैयार किया जा रहा है (Loading Examination Paper)...
        </p>
      </div>
    );
  }

  // ---------------- RENDER RESULT CARD (POST-SUBMIT) ----------------
  if (isFinished && submissionResult) {
    const totalPossibleMarks = submissionResult.totalPossibleMarks || (totalQuestions * (testData.marksCorrect || 4));

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-slate-50 to-white text-slate-800 py-8 px-3 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 via-indigo-600 to-amber-400" />
            
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-xs border border-emerald-200">
              🎉
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                परीक्षा संपन्न (EXAM SUBMITTED)
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {testData.testTitle}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                {testData.instituteName} • {studentName} (रोल: {rollNumber})
              </p>
            </div>

            {/* Score & Marks KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                <div className="text-2xl sm:text-3xl font-mono font-black text-indigo-700">
                  {submissionResult.totalScore > 0 ? `+${submissionResult.totalScore}` : submissionResult.totalScore}
                </div>
                <div className="text-[10px] font-bold text-indigo-900 uppercase">प्राप्तांक / {totalPossibleMarks}</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-700">
                  {submissionResult.correctCount}
                </div>
                <div className="text-[10px] font-bold text-emerald-900 uppercase">सही उत्तर (✓)</div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
                <div className="text-2xl sm:text-3xl font-mono font-black text-rose-700">
                  {submissionResult.incorrectCount}
                </div>
                <div className="text-[10px] font-bold text-rose-900 uppercase">गलत उत्तर (✗)</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                <div className="text-2xl sm:text-3xl font-mono font-black text-slate-700">
                  {submissionResult.skippedCount}
                </div>
                <div className="text-[10px] font-bold text-slate-600 uppercase">छोड़े गए प्रश्न</div>
              </div>
            </div>

            {/* Accuracy & Integrity */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 font-medium gap-2">
              <span>🎯 सटीकता (Accuracy): <strong className="text-slate-900 font-bold">{submissionResult.accuracy}%</strong></span>
              <span>🛡️ टैब स्विच अलर्ट: <strong className={tabSwitches > 0 ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>{tabSwitches} बार</strong></span>
            </div>
          </div>

          {/* Solutions & Explanations */}
          {submissionResult.evaluatedQuestions && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>विस्तृत समाधान व उत्तर कुंजी (Solutions & Answer Key)</span>
              </h2>

              <div className="space-y-4">
                {submissionResult.evaluatedQuestions.map((eq, i) => (
                  <div
                    key={eq.id || i}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      eq.status === "CORRECT"
                        ? "bg-emerald-50/40 border-emerald-200"
                        : eq.status === "INCORRECT"
                        ? "bg-rose-50/40 border-rose-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-bold">
                      <span className="font-mono text-slate-500">प्रश्न {i + 1}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                        eq.status === "CORRECT"
                          ? "bg-emerald-100 text-emerald-800"
                          : eq.status === "INCORRECT"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-200 text-slate-700"
                      }`}>
                        {eq.status === "CORRECT" ? "✓ सही (+4)" : eq.status === "INCORRECT" ? "✗ गलत (-1)" : "छोड़ा गया (0)"}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                      {eq.questionText}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {eq.options?.map((opt, oIdx) => {
                        const letter = ["A", "B", "C", "D"][oIdx];
                        const isStudentChoice = eq.selectedOption === letter;
                        const isActualCorrect = eq.correctAnswer === letter;

                        let style = "bg-white border-slate-200 text-slate-700";
                        if (isActualCorrect) style = "bg-emerald-100 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400";
                        else if (isStudentChoice && !isActualCorrect) style = "bg-rose-100 border-rose-400 text-rose-950 font-bold line-through";

                        return (
                          <div key={oIdx} className={`p-2.5 rounded-xl border flex items-center gap-2 ${style}`}>
                            <span className="w-5 h-5 rounded-md bg-white/80 border border-slate-300 flex items-center justify-center font-mono font-bold text-[10px]">
                              {letter}
                            </span>
                            <span className="flex-1 truncate">{opt}</span>
                            {isActualCorrect && <Check className="w-4 h-4 text-emerald-700" />}
                            {isStudentChoice && !isActualCorrect && <X className="w-4 h-4 text-rose-700" />}
                          </div>
                        );
                      })}
                    </div>

                    {eq.explanation && (
                      <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-xs text-indigo-900 leading-relaxed">
                        <strong className="block text-indigo-950 font-bold mb-0.5">स्पष्टीकरण (Explanation):</strong>
                        {eq.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="text-center pt-2">
            <button
              onClick={() => { window.location.href = "/"; }}
              className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>मुख्य पृष्ठ पर वापस जाएं (Back to Home)</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ---------------- RENDER ACTIVE CBT EXAM INTERFACE ----------------
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 select-none pb-20">
      
      {/* 🏛️ TOP CBT HEADER BAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          
          {/* Left: Institute & Test Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                  {testData.testTitle}
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  CBT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {testData.instituteName} • {studentName} ({rollNumber})
              </p>
            </div>
          </div>

          {/* Center/Right: Exam Countdown Timer */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl border transition-all ${
              isPaused
                ? "bg-amber-100 border-amber-300 text-amber-900"
                : secondsRemaining !== null && secondsRemaining <= 300
                ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                : "bg-slate-100 border-slate-200 text-slate-800"
            }`}>
              <Clock className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-400 leading-none">
                  {isPaused ? "परीक्षा रुकी" : "शेष समय"}
                </span>
                <span className="text-sm sm:text-base font-mono font-black tabular-nums">
                  {formattedTime}
                </span>
              </div>
            </div>

            {/* Submit Button in Header */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="px-3.5 sm:px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>जमा करें</span>
              <Send className="w-3.5 h-3.5 hidden sm:inline" />
            </button>
          </div>

        </div>
      </header>

      {/* 📋 MAIN CBT WORKSPACE (Two-Column Layout) */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
          
          {/* LEFT: QUESTION PRESENTATION CARD & CONTROLS */}
          <div className="space-y-4">
            
            {/* Question Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5 relative">
              
              {/* Question Header: Number & Marking Scheme */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl font-mono">
                    प्रश्न {currentIndex + 1} / {totalQuestions}
                  </span>
                  {markedForReview.has(currentIndex) && (
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <Bookmark className="w-3 h-3 fill-purple-600" />
                      <span>रिव्यू चिह्नित</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    +{testData.marksCorrect || 4} सही
                  </span>
                  {(testData.marksNegative > 0) && (
                    <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      -{testData.marksNegative} गलत
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 leading-relaxed">
                  {currentQ?.questionText || `Question ${currentIndex + 1}`}
                </h2>

                {currentQ?.image && (
                  <div className="relative w-full max-h-[260px] rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={currentQ.image}
                      alt="Question attachment"
                      className="max-h-[240px] object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Options (A, B, C, D Radio Cards) */}
              <div className="space-y-3 pt-2">
                {currentQ?.options?.map((opt, oIdx) => {
                  const letter = ["A", "B", "C", "D"][oIdx];
                  const isSelected = selectedOpt === letter;

                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(letter)}
                      className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 active:scale-[0.99] ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-600 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      {/* Letter Circle / Radio indicator */}
                      <span className={`w-8 h-8 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {letter}
                      </span>

                      {/* Option Text */}
                      <span className={`text-xs sm:text-sm font-semibold flex-1 leading-snug ${
                        isSelected ? "text-indigo-950 font-bold" : "text-slate-800"
                      }`}>
                        {opt}
                      </span>

                      {/* Selected Radio Ring */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                      }`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Controls Row */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  {/* Mark for Review */}
                  <button
                    type="button"
                    onClick={handleToggleMarkReview}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      markedForReview.has(currentIndex)
                        ? "bg-purple-100 border-purple-300 text-purple-800"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${markedForReview.has(currentIndex) ? "fill-purple-700" : ""}`} />
                    <span>{markedForReview.has(currentIndex) ? "चिह्नित हटाएं" : "रिव्यू रखें"}</span>
                  </button>

                  {/* Clear Selection */}
                  {selectedOpt && (
                    <button
                      type="button"
                      onClick={handleClearResponse}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>उत्तर हटाएं</span>
                    </button>
                  )}
                </div>

                {/* Prev / Next Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-slate-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>पिछला</span>
                  </button>

                  {currentIndex < totalQuestions - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <span>सहेजें और अगला</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <span>परीक्षा जमा करें</span>
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Helpful Autosave Indicator */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-2 font-medium">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>आपके उत्तर स्वतः सुरक्षित हो रहे हैं (Auto-Saved)</span>
              </span>
              <span>टैब स्विच: {tabSwitches}</span>
            </div>

          </div>

          {/* RIGHT: QUESTION PALETTE (NUMERICAL GRID) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                प्रश्न तालिका (Question Palette)
              </h3>
              <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                {attemptedCount} / {totalQuestions}
              </span>
            </div>

            {/* Palette Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[8px]">✓</span>
                <span>उत्तर दिया ({attemptedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-purple-500 text-white flex items-center justify-center text-[8px]">★</span>
                <span>रिव्यू ({reviewCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300 text-slate-600 flex items-center justify-center text-[8px]">⚪</span>
                <span>शेष ({unattemptedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[8px]">▶</span>
                <span>वर्तमान</span>
              </div>
            </div>

            {/* Question Number Buttons Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {questions.map((_, qIdx) => {
                const isCurrent = currentIndex === qIdx;
                const isAnswered = typeof answers[qIdx] !== "undefined";
                const isMarked = markedForReview.has(qIdx);

                let btnStyle = "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200";
                if (isCurrent) {
                  btnStyle = "bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300 shadow-xs font-black";
                } else if (isMarked) {
                  btnStyle = "bg-purple-100 border-purple-300 text-purple-900 font-bold";
                } else if (isAnswered) {
                  btnStyle = "bg-emerald-100 border-emerald-300 text-emerald-900 font-bold";
                }

                return (
                  <button
                    key={qIdx}
                    type="button"
                    onClick={() => setCurrentIndex(qIdx)}
                    className={`h-9 rounded-xl border text-xs font-mono transition-all flex items-center justify-center cursor-pointer active:scale-95 ${btnStyle}`}
                    title={`प्रश्न ${qIdx + 1}`}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
            </div>

            {/* Quick Submit Test Action */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>परीक्षा समाप्त करें (Submit Exam)</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </main>

      {/* ⚠️ TAB BLUR VIOLATION MODAL */}
      <AnimatePresence>
        {showTabWarning && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-rose-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-2xl mx-auto">
                ⚠️
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">टैब स्विच चेतावनी (Anti-Cheat Alert)</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  परीक्षा के दौरान स्क्रीन छोड़ना या दूसरा ऐप खोलना प्रतिबंधित है। यह घटना शिक्षक के लाइव डैशबोर्ड पर दर्ज हो गई है (अलर्ट संख्या: {tabSwitches})।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTabWarning(false)}
                className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs cursor-pointer transition-all"
              >
                मैं समझ गया, परीक्षा जारी रखें
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🏁 SUBMISSION CONFIRMATION MODAL */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl border border-slate-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center text-2xl mx-auto">
                🏁
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">परीक्षा जमा करें (Submit Confirmation)</h3>
                <p className="text-xs text-slate-500 font-medium">
                  क्या आप निश्चित रूप से परीक्षा समाप्त करके उत्तर जमा करना चाहते हैं?
                </p>
              </div>

              {/* Summary Stats Table */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-center font-bold">
                <div className="bg-emerald-50 rounded-xl p-2 text-emerald-800">
                  <div className="text-lg font-mono font-black">{attemptedCount}</div>
                  <div className="text-[10px] uppercase">हल किए गए</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-2 text-purple-800">
                  <div className="text-lg font-mono font-black">{reviewCount}</div>
                  <div className="text-[10px] uppercase">रिव्यू हेतु</div>
                </div>
                <div className="bg-slate-100 rounded-xl p-2 text-slate-700">
                  <div className="text-lg font-mono font-black">{unattemptedCount}</div>
                  <div className="text-[10px] uppercase">छोड़े गए</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-all border border-slate-200"
                >
                  परीक्षा जारी रखें
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={performFinalSubmission}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "जमा हो रहा है..." : "हाँ, जमा करें"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📱 MOBILE STICKY FLOATING CONTROL BAR */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5 lg:hidden flex items-center justify-between gap-2 shadow-lg">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none border border-slate-200"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>पिछला</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMobilePalette(true)}
          className="flex-1 py-2 px-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <span>📋 प्रश्न {currentIndex + 1}/{totalQuestions}</span>
          <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-mono">{attemptedCount} हल</span>
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95"
          >
            <span>अगला</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95"
          >
            <span>जमा करें</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 📱 MOBILE QUESTION PALETTE BOTTOM DRAWER */}
      <AnimatePresence>
        {showMobilePalette && (
          <div className="fixed inset-0 z-[999998] flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl border-t border-slate-200 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">प्रश्न तालिका (Question Palette)</h3>
                  <p className="text-[11px] text-slate-500 font-medium">सीधे किसी भी प्रश्न पर जाएं</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobilePalette(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Legend */}
              <div className="p-3 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[8px]">✓</span>
                  <span>हल किए ({attemptedCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-purple-500 text-white flex items-center justify-center text-[8px]">★</span>
                  <span>रिव्यू ({reviewCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300 text-slate-600 flex items-center justify-center text-[8px]">⚪</span>
                  <span>शेष ({unattemptedCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[8px]">▶</span>
                  <span>वर्तमान (Q{currentIndex + 1})</span>
                </div>
              </div>

              {/* Drawer Numbers Grid */}
              <div className="p-4 overflow-y-auto grid grid-cols-5 gap-2 max-h-[45vh]">
                {questions.map((_, qIdx) => {
                  const isCurrent = currentIndex === qIdx;
                  const isAnswered = typeof answers[qIdx] !== "undefined";
                  const isMarked = markedForReview.has(qIdx);

                  let btnStyle = "bg-slate-100 text-slate-700 border-slate-200";
                  if (isCurrent) {
                    btnStyle = "bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300 font-black shadow-xs";
                  } else if (isMarked) {
                    btnStyle = "bg-purple-100 border-purple-300 text-purple-900 font-bold";
                  } else if (isAnswered) {
                    btnStyle = "bg-emerald-100 border-emerald-300 text-emerald-900 font-bold";
                  }

                  return (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(qIdx);
                        setShowMobilePalette(false);
                      }}
                      className={`h-11 rounded-xl border text-xs font-mono transition-all flex items-center justify-center active:scale-95 ${btnStyle}`}
                    >
                      {qIdx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer Submit */}
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowMobilePalette(false);
                    setShowSubmitModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>परीक्षा समाप्त करें (Submit Exam)</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
