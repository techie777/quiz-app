"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Users,
  Clock,
  Award,
  AlertTriangle,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  StopCircle,
  FileText,
  Volume2,
  Lock,
  Search,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Smartphone
} from "lucide-react";
import socketService from "@/engine/lib/socket";
import toast from "react-hot-toast";
import axios from "axios";

export default function B2BLiveWarRoom({ session, participants = [], testData, onEndExam, sendAction, onInspectStudent }) {
  const [telemetryMap, setTelemetryMap] = useState({});
  const [incidents, setIncidents] = useState([]);
  const [inspectedStudent, setInspectedStudent] = useState(null);
  const [broadcastText, setBroadcastText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterViolationsOnly, setFilterViolationsOnly] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const socket = socketService.getSocket();
  const testCode = session?.testCode || session?.sessionId || testData?.testCode;

  // Initialize overall timer based on test rules
  useEffect(() => {
    if (testData?.durationMinutes) {
      setTimeRemaining(testData.durationMinutes * 60);
    }
  }, [testData]);

  // Countdown timer for host cockpit
  useEffect(() => {
    if (timeRemaining === null || session?.isPaused) return;
    if (timeRemaining <= 0) {
      toast("समय समाप्त हो गया है! (Exam duration complete)", { icon: "⏱️" });
      return;
    }
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining, session?.isPaused]);

  // Format timer MM:SS
  const formatTimer = (secs) => {
    if (secs === null) return "--:--";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Socket Telemetry Listeners
  useEffect(() => {
    if (!socket) return;

    const handleTelemetry = (data) => {
      if (!data?.userId) return;
      setTelemetryMap((prev) => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          ...data,
          updatedAt: Date.now()
        }
      }));
    };

    const handleTabAlert = (data) => {
      if (!data?.userId) return;
      const incident = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: data.userId,
        userName: data.userName || "Student",
        rollNumber: data.rollNumber || "N/A",
        switchCount: data.switchCount || 1,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      };

      setIncidents((prev) => [incident, ...prev.slice(0, 49)]);
      toast.error(`⚠️ टैब स्विच चेतावनी: ${incident.userName} (${incident.rollNumber}) [${incident.switchCount} बार]`, {
        duration: 4000
      });

      // Update telemetry count
      setTelemetryMap((prev) => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          tabSwitches: data.switchCount
        }
      }));
    };

    const handleSubmission = (data) => {
      toast.success(`🏁 ${data.userName} (${data.rollNumber}) ने परीक्षा जमा की! अंक: ${data.totalScore}`, {
        duration: 4000
      });
      setTelemetryMap((prev) => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          isSubmitted: true,
          score: data.totalScore,
          answers: data.answers
        }
      }));
    };

    socket.on("HOST_TELEMETRY_UPDATE", handleTelemetry);
    socket.on("HOST_TAB_ALERT", handleTabAlert);
    socket.on("EXAM_SUBMISSION_BROADCAST", handleSubmission);

    return () => {
      socket.off("HOST_TELEMETRY_UPDATE", handleTelemetry);
      socket.off("HOST_TAB_ALERT", handleTabAlert);
      socket.off("EXAM_SUBMISSION_BROADCAST", handleSubmission);
    };
  }, [socket]);

  // Combine participants with latest telemetry
  const studentList = useMemo(() => {
    const list = (participants || []).filter((p) => p.role !== "HOST");
    return list.map((p) => {
      const telem = telemetryMap[p.userId] || {};
      return {
        ...p,
        rollNumber: telem.rollNumber || p.rollNumber || "N/A",
        currentIndex: typeof telem.currentIndex !== "undefined" ? telem.currentIndex : (p.progress || 0),
        selectedOption: typeof telem.selectedOption !== "undefined" ? telem.selectedOption : null,
        tabSwitches: telem.tabSwitches || p.tabSwitches || 0,
        isSubmitted: telem.isSubmitted || p.isSubmitted || false,
        score: typeof telem.score !== "undefined" ? telem.score : (p.score || 0),
        lastPulse: telem.updatedAt || null
      };
    });
  }, [participants, telemetryMap]);

  // Filtered List
  const filteredStudents = useMemo(() => {
    return studentList.filter((s) => {
      const matchesSearch =
        s.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesViolation = filterViolationsOnly ? s.tabSwitches > 0 : true;
      return matchesSearch && matchesViolation;
    });
  }, [studentList, searchTerm, filterViolationsOnly]);

  // High-Level Aggregate Metrics
  const totalStudents = studentList.length;
  const totalSubmitted = studentList.filter((s) => s.isSubmitted).length;
  const totalViolations = studentList.reduce((acc, s) => acc + (s.tabSwitches || 0), 0);
  const avgScore = totalStudents > 0
    ? (studentList.reduce((acc, s) => acc + (s.score || 0), 0) / totalStudents).toFixed(1)
    : 0;

  // Broadcast Handler
  const handleSendBroadcast = (e) => {
    if (e) e.preventDefault();
    if (!broadcastText.trim()) return;
    if (socket) {
      socket.emit("SEND_BROADCAST", {
        sessionId: session?.sessionId || testCode,
        text: broadcastText.trim()
      });
      toast.success("सभी छात्रों की स्क्रीन पर निर्देश प्रसारित किया गया! 📢");
      setBroadcastText("");
    }
  };

  const handleQuickPreset = (presetText) => {
    setBroadcastText(presetText);
  };

  const totalQuestionsCount = testData?.questionsCount || testData?.questions?.length || 20;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-5 pb-20 text-slate-800">
      
      {/* 🚀 FRIENDLY EXAMINER LIVE COCKPIT HEADER */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm relative overflow-hidden space-y-5">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Institute & Test Title */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>लाइव परीक्षा कॉकपिट (Live Cockpit)</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold">
                CODE: {testCode}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {testData?.testTitle || testData?.title || "Live Examination Conduction"}
            </h1>

            <p className="text-xs sm:text-sm font-semibold text-slate-500 flex flex-wrap items-center gap-2">
              <span>🏫 {testData?.instituteName || "Premier Coaching Academy"}</span>
              {testData?.batchName && <span>• 🎓 {testData.batchName}</span>}
              {testData?.subject && <span>• 📖 {testData.subject}</span>}
            </p>
          </div>

          {/* Live Exam Timer & Master Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Clock Pill */}
            <div className="flex items-center gap-2.5 bg-amber-50/80 px-4 py-2 rounded-2xl border border-amber-200 shadow-sm">
              <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
              <div>
                <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">परीक्षा समय शेष</div>
                <div className="text-xl sm:text-2xl font-mono font-black text-amber-800 tabular-nums">
                  {formatTimer(timeRemaining)}
                </div>
              </div>
            </div>

            {/* Pause / Resume Button */}
            <button
              onClick={() => {
                sendAction(session?.isPaused ? "RESUME_SESSION" : "PAUSE_SESSION", {
                  isPaused: !session?.isPaused
                });
              }}
              className={`h-11 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                session?.isPaused
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
              }`}
            >
              {session?.isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
              <span>{session?.isPaused ? "परीक्षा जारी रखें" : "परीक्षा रोकें (Pause)"}</span>
            </button>

            {/* End Exam & Generate Ledger */}
            <button
              onClick={() => {
                if (window.confirm("क्या आप निश्चित रूप से परीक्षा समाप्त करके मास्टर परिणाम लेजर देखना चाहते हैं?")) {
                  sendAction("TERMINATE", { status: "TERMINATED" });
                  if (onEndExam) onEndExam();
                }
              }}
              className="h-11 px-4 sm:px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wide uppercase flex items-center gap-2 shadow-sm shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <StopCircle className="w-4 h-4" />
              <span>परीक्षा समाप्त करें (Conclude)</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-blue-950">{totalStudents}</div>
              <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">उपस्थित छात्र (Present)</div>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-950">{totalSubmitted} / {totalStudents}</div>
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">जमा किया (Submitted)</div>
            </div>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-950">{avgScore}</div>
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">औसत अंक (Avg Score)</div>
            </div>
          </div>

          <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-rose-950">{totalViolations}</div>
              <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wide">टैब उल्लंघन (Tab Blur)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 📡 MAIN TWO-COLUMN WORKSPACE: Matrix (Left) + Broadcast & Log (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 items-start">
        
        {/* LEFT COLUMN: LIVE ATTENDANCE MATRIX */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          
          {/* Controls: Search, Filter, Student Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>लाइव परीक्षा उपस्थिति रजिस्टर (Examinee Matrix)</span>
                <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {filteredStudents.length} Students
                </span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="खोजें (Roll / Name)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white outline-none font-medium"
                />
              </div>

              {/* Violations Only Toggle */}
              <button
                onClick={() => setFilterViolationsOnly((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  filterViolationsOnly
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>केवल उल्लंघन ({totalViolations})</span>
              </button>
            </div>
          </div>

          {/* EMPTY STATE */}
          {filteredStudents.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Users className="w-12 h-12 mx-auto text-slate-300 animate-pulse" />
              <p className="text-sm font-bold text-slate-600">कोई छात्र रिकॉर्ड नहीं मिला</p>
              <p className="text-xs text-slate-400">जैसे ही छात्र लिंक से जुड़ेंगे, वे इस रजिस्टर में तुरंत दिखाई देंगे।</p>
            </div>
          ) : (
            <>
              {/* 📱 MOBILE VIEW: RESPONSIVE CARDS (Super Mobile Friendly) */}
              <div className="block md:hidden space-y-3">
                {filteredStudents.map((s, idx) => {
                  const progressPercent = Math.min(
                    100,
                    Math.round(((s.currentIndex + 1) / totalQuestionsCount) * 100)
                  );

                  return (
                    <div
                      key={s.userId}
                      className={`p-4 rounded-2xl border transition-all ${
                        s.tabSwitches > 0
                          ? "bg-rose-50/40 border-rose-200"
                          : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-50"
                      }`}
                    >
                      {/* Top: Name, Roll, Online Indicator */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${s.isSubmitted ? "bg-emerald-500" : s.status === "AWAY" ? "bg-amber-400" : "bg-emerald-500 animate-pulse"}`} />
                            <h3 className="font-bold text-sm text-slate-900">{s.userName}</h3>
                          </div>
                          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                            रोल: {s.rollNumber || "N/A"}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className={`text-base font-mono font-black ${s.score > 0 ? "text-emerald-700" : s.score < 0 ? "text-rose-700" : "text-slate-700"}`}>
                            {s.score > 0 ? `+${s.score}` : s.score} अंक
                          </span>
                          <div className="text-[10px] text-slate-400 font-medium">वर्तमान स्कोर</div>
                        </div>
                      </div>

                      {/* Middle: Progress Bar */}
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                          <span>प्रश्न {s.currentIndex + 1} / {totalQuestionsCount}</span>
                          <span className="font-mono text-slate-500">{progressPercent}% पूर्ण</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              s.isSubmitted ? "bg-emerald-500" : "bg-indigo-600"
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Row: Tab Alert Badge + Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 gap-2">
                        {s.tabSwitches > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{s.tabSwitches} बार टैब बदला</span>
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>सुरक्षित</span>
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setInspectedStudent(s);
                            if (onInspectStudent) onInspectStudent(s);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>लाइव स्क्रीन</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 💻 DESKTOP VIEW: CLEAN HIGH-DENSITY TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/60">
                      <th className="py-2.5 pl-3 rounded-l-xl">#</th>
                      <th className="py-2.5">रोल नंबर (Roll No)</th>
                      <th className="py-2.5">विद्यार्थी का नाम (Student)</th>
                      <th className="py-2.5">प्रगति (Progress)</th>
                      <th className="py-2.5">वर्तमान अंक (Score)</th>
                      <th className="py-2.5">टैब स्विच (Anti-Cheat)</th>
                      <th className="py-2.5">स्थिति (Status)</th>
                      <th className="py-2.5 text-right pr-3 rounded-r-xl">कार्रवाई (Inspect)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStudents.map((s, idx) => {
                      const progressPercent = Math.min(
                        100,
                        Math.round(((s.currentIndex + 1) / totalQuestionsCount) * 100)
                      );

                      return (
                        <tr
                          key={s.userId}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            s.tabSwitches > 0 ? "bg-rose-50/30" : ""
                          }`}
                        >
                          {/* Rank / Index */}
                          <td className="py-3 pl-3 text-slate-400 font-mono">{idx + 1}</td>

                          {/* Roll Number */}
                          <td className="py-3 font-mono font-bold text-indigo-700">
                            {s.rollNumber || "N/A"}
                          </td>

                          {/* Student Name */}
                          <td className="py-3">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{s.userName}</span>
                            </div>
                          </td>

                          {/* Progress */}
                          <td className="py-3 min-w-[130px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-slate-700">Q {s.currentIndex + 1} / {totalQuestionsCount}</span>
                                <span className="text-slate-400 text-[10px]">{progressPercent}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    s.isSubmitted ? "bg-emerald-500" : "bg-indigo-600"
                                  }`}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Current Score */}
                          <td className="py-3 font-mono font-black text-sm">
                            <span className={s.score > 0 ? "text-emerald-700" : s.score < 0 ? "text-rose-700" : "text-slate-700"}>
                              {s.score > 0 ? `+${s.score}` : s.score}
                            </span>
                          </td>

                          {/* Tab Switch Alerts */}
                          <td className="py-3">
                            {s.tabSwitches > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold font-mono">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>{s.tabSwitches} अलर्ट</span>
                              </span>
                            ) : (
                              <span className="text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>सुरक्षित (0)</span>
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3">
                            {s.isSubmitted ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                🏁 जमा किया
                              </span>
                            ) : s.status === "AWAY" ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                🟡 स्क्रीन बाहर
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                                🟢 सक्रिय
                              </span>
                            )}
                          </td>

                          {/* Inspect Action */}
                          <td className="py-3 text-right pr-3">
                            <button
                              onClick={() => {
                                setInspectedStudent(s);
                                if (onInspectStudent) onInspectStudent(s);
                              }}
                              className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer border border-slate-200 hover:border-indigo-600 shadow-xs"
                              title="छात्र की स्क्रीन देखें"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>लाइव देखें</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: BROADCAST & PROCTORING FEED */}
        <div className="space-y-5">
          {/* Examiner Announcement Box */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <Volume2 className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-black uppercase tracking-wider">छात्रों को लाइव निर्देश (Broadcast)</h3>
            </div>

            {/* Quick 1-Click Preset Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset("10 मिनट शेष हैं! कृपया अपना समय प्रबंधित करें।")}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-all cursor-pointer"
              >
                ⏰ 10 मिनट शेष
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("कृपया टैब स्विच न करें, परीक्षा की निगरानी हो रही है।")}
                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold transition-all cursor-pointer"
              >
                ⚠️ टैब स्विच चेतावनी
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("सभी प्रश्नों को ध्यानपूर्वक पढ़ें और उत्तर दें।")}
                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold transition-all cursor-pointer"
              >
                ✍️ ध्यानपूर्वक हल करें
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-2">
              <textarea
                placeholder="छात्रों के लिए निर्देश लिखें..."
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white outline-none resize-none font-medium"
              />
              <button
                type="submit"
                disabled={!broadcastText.trim()}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-40 transition-all active:scale-[0.99]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>निर्देश भेजें (Broadcast to All)</span>
              </button>
            </form>
          </div>

          {/* Real-Time Anti-Cheat Violations Feed */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-black uppercase tracking-wider">एंटी-चीट लाइव लॉग (Incident Feed)</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                {incidents.length} घटनाएं
              </span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {incidents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-60" />
                  <span>कोई नकल या टैब उल्लंघन नहीं पाया गया। सभी छात्र सक्रिय हैं।</span>
                </div>
              ) : (
                incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-0.5 text-xs animate-in slide-in-from-top-2"
                  >
                    <div className="flex items-center justify-between text-rose-900 font-bold">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>{inc.userName}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{inc.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">
                      रोल: <strong className="text-indigo-700 font-mono">{inc.rollNumber}</strong> • टैब बदला (अलर्ट {inc.switchCount})
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 👁️ REAL-TIME TELEMETRY / DOM MIRRORING MODAL */}
      <AnimatePresence>
        {inspectedStudent && (
          <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative text-slate-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-lg">
                    👁️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{inspectedStudent.userName}</h3>
                    <p className="text-xs text-indigo-700 font-mono font-bold">
                      Roll No: {inspectedStudent.rollNumber} • Score: {inspectedStudent.score}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setInspectedStudent(null)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Student Live State Card */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium">वर्तमान प्रश्न (Current Active Question):</span>
                  <span className="font-bold font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                    Question {inspectedStudent.currentIndex + 1} of {totalQuestionsCount}
                  </span>
                </div>

                {/* Inspect Question Text */}
                {testData?.questions && testData.questions[inspectedStudent.currentIndex] ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                      {testData.questions[inspectedStudent.currentIndex].questionText}
                    </p>

                    <div className="space-y-2 pt-2">
                      {testData.questions[inspectedStudent.currentIndex].options?.map((opt, oIdx) => {
                        const optLetter = ["A", "B", "C", "D"][oIdx];
                        const isSelectedByStudent = inspectedStudent.selectedOption === optLetter;

                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 font-medium transition-all ${
                              isSelectedByStudent
                                ? "bg-indigo-50 border-indigo-500 text-indigo-900 font-bold"
                                : "bg-white border-slate-200 text-slate-700"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[10px] ${
                              isSelectedByStudent ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                            }`}>
                              {optLetter}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isSelectedByStudent && (
                              <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md font-bold uppercase">
                                चुना हुआ (Selected)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    छात्र प्रश्न {inspectedStudent.currentIndex + 1} हल कर रहा है।
                  </div>
                )}

                {/* Anti-Cheat telemetry info */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">कुल टैब उल्लंघन (Total Tab Blur Incidents):</span>
                  <span className={`font-bold font-mono ${inspectedStudent.tabSwitches > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {inspectedStudent.tabSwitches} बार
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setInspectedStudent(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs cursor-pointer transition-all"
              >
                निरीक्षण बंद करें (Close Inspection)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
