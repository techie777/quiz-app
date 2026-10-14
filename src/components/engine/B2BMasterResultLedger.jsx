"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  Search,
  Eye,
  Clock,
  X,
  Share2
} from "lucide-react";
import toast from "react-hot-toast";

export default function B2BMasterResultLedger({ testData, participants = [], submissions = [], onBack }) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [inspectedStudent, setInspectedStudent] = useState(null);
  const [reportCardStudent, setReportCardStudent] = useState(null);

  // Construct Ranked Results
  const rankedLedger = useMemo(() => {
    // Merge participants with submissions
    const list = (participants || []).filter((p) => p.role !== "HOST");

    const processed = list.map((p) => {
      const sub = (submissions || []).find((s) => s.userId === p.userId || s.studentId === p.userId) || {};
      const detailedAns = sub.detailedAnswers || p.detailedAnswers || [];
      const answers = sub.answers || p.answers || [];

      let correct = typeof sub.correctCount === "number" ? sub.correctCount : (typeof p.correctCount === "number" ? p.correctCount : 0);
      let incorrect = typeof sub.wrongCount === "number" ? sub.wrongCount : (typeof p.wrongCount === "number" ? p.wrongCount : 0);
      let unattempted = typeof sub.unattemptedCount === "number" ? sub.unattemptedCount : (typeof p.unattemptedCount === "number" ? p.unattemptedCount : 0);

      if (!correct && !incorrect && !unattempted && detailedAns.length > 0) {
        detailedAns.forEach((ans) => {
          if (!ans.isAttempted) unattempted += 1;
          else if (ans.isCorrect) correct += 1;
          else incorrect += 1;
        });
      }

      const totalQs = testData?.questionsCount || testData?.questions?.length || 20;
      const score = typeof sub.totalScore !== "undefined" ? sub.totalScore : (typeof p.score !== "undefined" ? p.score : 0);
      const totalMarksPossible = testData?.totalMarks || (totalQs * (testData?.marksCorrect || 4));
      const percentage = totalMarksPossible > 0 ? Math.max(0, Math.round((score / totalMarksPossible) * 100)) : 0;
      const accuracy = sub.accuracy || p.accuracy || (correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0);

      const tabSwitches = typeof sub.tabSwitches !== "undefined" ? Number(sub.tabSwitches) : (typeof p.tabSwitches !== "undefined" ? Number(p.tabSwitches) : 0);
      const timeTakenSeconds = typeof sub.timeTakenSeconds !== "undefined" ? Number(sub.timeTakenSeconds) : (typeof p.timeTakenSeconds !== "undefined" ? Number(p.timeTakenSeconds) : 0);
      const startedAt = sub.startedAt || p.startedAt || null;
      const completedAt = sub.completedAt || p.completedAt || null;
      const isSubmitted = Boolean(p.isSubmitted || sub.completedAt || completedAt);

      const studentClass = p.studentClass || sub.studentClass || "";
      let grade = sub.grade || p.grade || "";
      let gradeRemark = sub.gradeRemark || p.gradeRemark || "";

      if (!grade) {
        if (percentage >= 91) { grade = "A1"; gradeRemark = "उत्कृष्ट (Outstanding)"; }
        else if (percentage >= 81) { grade = "A2"; gradeRemark = "बहुत अच्छा (Excellent)"; }
        else if (percentage >= 71) { grade = "B1"; gradeRemark = "सराहनीय (Very Good)"; }
        else if (percentage >= 61) { grade = "B2"; gradeRemark = "अच्छा (Good)"; }
        else if (percentage >= 51) { grade = "C1"; gradeRemark = "संतोषजनक (Above Average)"; }
        else if (percentage >= 41) { grade = "C2"; gradeRemark = "औसत (Average)"; }
        else if (percentage >= 33) { grade = "D"; gradeRemark = "उत्तीर्ण (Passing)"; }
        else { grade = "E"; gradeRemark = "सुधार की आवश्यकता (Needs Improvement)"; }
      }

      return {
        userId: p.userId,
        userName: p.userName || sub.userName || sub.studentName || "Student",
        rollNumber: p.rollNumber || sub.rollNumber || "N/A",
        studentClass,
        grade,
        gradeRemark,
        score,
        correct,
        incorrect,
        unattempted,
        totalQuestions: totalQs,
        percentage,
        accuracy,
        tabSwitches,
        timeTakenSeconds,
        startedAt,
        completedAt,
        isSubmitted,
        detailedAnswers: detailedAns,
        answers
      };
    });

    // Sort descending by score, then ascending by tabSwitches
    processed.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.tabSwitches - b.tabSwitches;
    });

    return processed.map((p, idx) => ({ ...p, rank: idx + 1 }));
  }, [participants, submissions, testData]);

  // Helpers for time formatting
  const formatDurationDisplay = (totalSecs) => {
    if (!totalSecs || totalSecs <= 0) return "0s";
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const formatDurationHindi = (totalSecs) => {
    if (!totalSecs || totalSecs <= 0) return "0 सेकंड";
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m === 0) return `${s} सेकंड`;
    return `${m} मिनट ${s} सेकंड`;
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "N/A";
    try {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    } catch (e) {
      return "N/A";
    }
  };

  // Question-by-Question Class Analytics
  const questionAnalytics = useMemo(() => {
    const questions = testData?.questions || [];
    if (questions.length === 0 || rankedLedger.length === 0) return [];

    return questions.map((q, idx) => {
      let correctStudents = 0;
      let wrongStudents = 0;
      let skippedStudents = 0;

      rankedLedger.forEach((student) => {
        const studentDetail = (student.detailedAnswers || []).find((a) => a.index === idx || a.id === q.id);
        if (studentDetail) {
          if (!studentDetail.isAttempted) skippedStudents++;
          else if (studentDetail.isCorrect) correctStudents++;
          else wrongStudents++;
        } else {
          const ansVal = student.answers?.[idx];
          if (!ansVal) skippedStudents++;
          else if (ansVal === q.correctAnswer) correctStudents++;
          else wrongStudents++;
        }
      });

      const totalAttempted = correctStudents + wrongStudents;
      const correctPercent = rankedLedger.length > 0 ? Math.round((correctStudents / rankedLedger.length) * 100) : 0;

      return {
        index: idx,
        questionText: q.questionText,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        correctStudents,
        wrongStudents,
        skippedStudents,
        correctPercent
      };
    });
  }, [testData, rankedLedger]);

  // Aggregate stats
  const totalStudents = rankedLedger.length;
  const highestScore = rankedLedger.length > 0 ? rankedLedger[0].score : 0;
  const lowestScore = rankedLedger.length > 0 ? rankedLedger[rankedLedger.length - 1].score : 0;
  const averageScore = totalStudents > 0
    ? (rankedLedger.reduce((acc, s) => acc + s.score, 0) / totalStudents).toFixed(1)
    : 0;

  // Filtered view
  const filteredLedger = useMemo(() => {
    if (!filterQuery.trim()) return rankedLedger;
    const q = filterQuery.toLowerCase();
    return rankedLedger.filter(
      (s) =>
        s.userName?.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q) ||
        s.studentClass?.toLowerCase().includes(q)
    );
  }, [rankedLedger, filterQuery]);

  // Export Master PDF Report
  const handleExportPDF = async () => {
    try {
      setExportingPdf(true);
      toast.loading("मास्टर परिणाम रिपोर्ट पीडीएफ तैयार हो रही है...", { id: "pdf_gen" });

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 16;

      // Header Banner
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(14, y, pageWidth - 28, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(testData?.instituteName || "ACADEMY EXAMINATION COUNCIL", pageWidth / 2, y + 10, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Official Result Ledger: ${testData?.testTitle || "Live Examination"}`, pageWidth / 2, y + 18, { align: "center" });

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Exam Code: ${testData?.testCode || "N/A"} | Date: ${new Date().toLocaleDateString("en-IN")}`, pageWidth / 2, y + 24, { align: "center" });

      y += 34;

      // KPI Summary Box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 14, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, y, pageWidth - 28, 14, "S");

      doc.setTextColor(51, 65, 85);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Examinees: ${totalStudents}`, 20, y + 9);
      doc.text(`Highest Marks: +${highestScore}`, 70, y + 9);
      doc.text(`Class Average: ${averageScore}`, 120, y + 9);
      doc.text(`Lowest Marks: ${lowestScore}`, 165, y + 9);

      y += 20;

      // Table Headers
      doc.setFillColor(79, 70, 229); // Indigo-600
      doc.rect(14, y, pageWidth - 28, 8, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Rank", 18, y + 5.5);
      doc.text("Roll No", 32, y + 5.5);
      doc.text("Student Name", 65, y + 5.5);
      doc.text("Score", 115, y + 5.5);
      doc.text("Correct", 135, y + 5.5);
      doc.text("Wrong", 152, y + 5.5);
      doc.text("Tab Blur", 170, y + 5.5);

      y += 8;

      // Table Rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      rankedLedger.forEach((row, i) => {
        if (y > 275) {
          doc.addPage();
          y = 16;
        }

        const isEven = i % 2 === 0;
        if (isEven) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, pageWidth - 28, 7, "F");
        }

        doc.setTextColor(30, 41, 59);
        doc.text(String(row.rank), 18, y + 5);
        doc.text(String(row.rollNumber), 32, y + 5);
        doc.text(String(row.userName).substring(0, 26), 65, y + 5);

        // Score highlighted
        doc.setFont("helvetica", "bold");
        doc.setTextColor(16, 185, 129); // Emerald
        doc.text(row.score > 0 ? `+${row.score}` : String(row.score), 115, y + 5);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(String(row.correct), 135, y + 5);
        doc.text(String(row.incorrect), 152, y + 5);

        if (row.tabSwitches > 0) {
          doc.setTextColor(225, 29, 72); // Rose
          doc.text(`Alert (${row.tabSwitches})`, 170, y + 5);
        } else {
          doc.setTextColor(16, 185, 129);
          doc.text("Clean (0)", 170, y + 5);
        }

        y += 7;
      });

      // Save PDF
      doc.save(`${(testData?.instituteName || "Institute").replace(/\s+/g, "_")}_Result_Ledger_${testData?.testCode || "Exam"}.pdf`);
      toast.success("मास्टर परिणाम पीडीएफ सफलतापूर्वक डाउनलोड हो गया! 📄", { id: "pdf_gen" });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("पीडीएफ तैयार करने में समस्या हुई।", { id: "pdf_gen" });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-24 text-slate-800">
      
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm relative overflow-hidden space-y-5">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-wide uppercase">
                🏁 परीक्षा संपन्न (EXAM CONCLUDED)
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                CODE: {testData?.testCode || "EXAM"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              मास्टर क्लास परिणाम लेजर (Master Result Ledger)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold">
              {testData?.instituteName} • {testData?.testTitle || testData?.title}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>वापस</span>
              </button>
            )}

            <button
              onClick={handleExportPDF}
              disabled={exportingPdf}
              className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-sm shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exportingPdf ? "तैयार हो रहा है..." : "ऑफिशियल पीडीएफ डाउनलोड"}</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
            <div className="text-2xl font-black text-slate-900">{totalStudents}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">कुल परीक्षार्थी (Examinees)</div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 text-center">
            <div className="text-2xl font-black text-emerald-700">+{highestScore}</div>
            <div className="text-[10px] font-bold text-emerald-700 uppercase">सर्वोच्च अंक (Highest)</div>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 text-center">
            <div className="text-2xl font-black text-amber-700">{averageScore}</div>
            <div className="text-[10px] font-bold text-amber-700 uppercase">कक्षा औसत (Class Avg)</div>
          </div>

          <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-3.5 text-center">
            <div className="text-2xl font-black text-rose-700">{lowestScore}</div>
            <div className="text-[10px] font-bold text-rose-700 uppercase">न्यूनतम अंक (Lowest)</div>
          </div>
        </div>
      </div>

      {/* Ledger Section */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>रैंक अनुसार परिणाम तालिका (Class Merit Ranking)</span>
            <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              {filteredLedger.length} Records
            </span>
          </h2>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="छात्र / रोल नंबर खोजें..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 outline-none w-52 font-medium"
            />
          </div>
        </div>

        {filteredLedger.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            कोई परिणाम रिकॉर्ड नहीं मिला।
          </div>
        ) : (
          <>
            {/* 📱 MOBILE CARDS VIEW */}
            <div className="block md:hidden space-y-3">
              {filteredLedger.map((s) => (
                <div key={s.userId} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        s.rank === 1
                          ? "bg-amber-400 text-slate-950 shadow-sm"
                          : s.rank === 2
                          ? "bg-slate-200 text-slate-800"
                          : s.rank === 3
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {s.rank <= 3 ? ["🥇", "🥈", "🥉"][s.rank - 1] : s.rank}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{s.userName}</h4>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="text-xs font-mono font-bold text-indigo-700">रोल: {s.rollNumber}</span>
                          {s.studentClass && (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.2 rounded border border-slate-300">
                              कक्षा: {s.studentClass}
                            </span>
                          )}
                          {s.grade && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-mono border border-emerald-300">
                              {s.grade}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-mono font-black text-emerald-700">
                        {s.score > 0 ? `+${s.score}` : s.score} अंक
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">{s.percentage}%</div>
                    </div>
                  </div>

                  {/* 🎯 Individual Audit Strip (Time, Screen switches, timestamps) */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">⏱️ कुल समय</span>
                      <span className="font-mono font-bold text-slate-800">{formatDurationDisplay(s.timeTakenSeconds)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">🖥️ स्क्रीन बदली</span>
                      <span className={`font-mono font-bold ${s.tabSwitches > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {s.tabSwitches > 0 ? `${s.tabSwitches} बार` : "0 (सुरक्षित)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">🚀 शुरू समय</span>
                      <span className="font-mono text-indigo-700">{formatTimestamp(s.startedAt)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">🏁 जमा समय</span>
                      <span className="font-mono text-emerald-700">{formatTimestamp(s.completedAt)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
                    <div className="bg-emerald-50 rounded-lg py-1 text-emerald-800">
                      ✓ सही: {s.correct}
                    </div>
                    <div className="bg-rose-50 rounded-lg py-1 text-rose-800">
                      ✗ गलत: {s.incorrect}
                    </div>
                    <div className="bg-slate-100 rounded-lg py-1 text-slate-600">
                      छोड़ा: {s.unattempted}
                    </div>
                  </div>

                  {/* Mobile Action Buttons: Report Card, WhatsApp Share, Detailed Audit */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setReportCardStudent(s)}
                      className="py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>🖨️ रिपोर्ट कार्ड</span>
                    </button>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `🏆 *${testData?.instituteName || "परीक्षा संस्थान"} - आधिकारिक रिपोर्ट कार्ड*\n\n` +
                        `👤 *विद्यार्थी:* ${s.userName}\n` +
                        `🏷️ *रोल नंबर:* ${s.rollNumber}\n` +
                        (s.studentClass ? `🏫 *कक्षा / सेक्शन:* ${s.studentClass}\n` : "") +
                        `📝 *विषय / परीक्षा:* ${testData?.testTitle || testData?.title || 'लाइव परीक्षा'}\n` +
                        `🥇 *रैंक:* #${s.rank} / ${totalStudents}\n` +
                        `📊 *प्राप्तांक:* ${s.score} अंक (${s.percentage}%)\n` +
                        `🎖️ *ग्रेड:* ${s.grade} (${s.gradeRemark})\n` +
                        `🎯 *सटीकता:* ${s.accuracy}%\n` +
                        `✅ *सही:* ${s.correct} | ❌ *गलत:* ${s.incorrect} | ⚪ *छोड़ा:* ${s.unattempted}\n` +
                        `⏱️ *समय:* ${formatDurationDisplay(s.timeTakenSeconds)}\n\n` +
                        `_यह रिपोर्ट स्कूल / कोचिंग संस्थान के आधिकारिक ऑनलाइन पोर्टल द्वारा प्रमाणित है।_`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>अभिभावक</span>
                    </a>
                  </div>

                  <button
                    onClick={() => setInspectedStudent(s)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-slate-200"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>📄 विस्तृत उत्तर पुस्तिका देखें</span>
                  </button>
                </div>
              ))}
            </div>

            {/* 💻 DESKTOP TABLE VIEW */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                    <th className="py-2.5 pl-3 rounded-l-xl">रैंक</th>
                    <th className="py-2.5">रोल नंबर</th>
                    <th className="py-2.5">विद्यार्थी का नाम</th>
                    <th className="py-2.5">कक्षा / ग्रेड</th>
                    <th className="py-2.5">कुल अंक</th>
                    <th className="py-2.5">सही (✓)</th>
                    <th className="py-2.5">गलत (✗)</th>
                    <th className="py-2.5">छोड़ा (Skip)</th>
                    <th className="py-2.5">लिया समय</th>
                    <th className="py-2.5">शुरू / जमा</th>
                    <th className="py-2.5">स्क्रीन बदली</th>
                    <th className="py-2.5 text-right pr-3 rounded-r-xl">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLedger.map((s) => (
                    <tr key={s.userId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Rank */}
                      <td className="py-3 pl-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-bold text-xs ${
                          s.rank === 1
                            ? "bg-amber-400 text-slate-950 shadow-sm"
                            : s.rank === 2
                            ? "bg-slate-200 text-slate-800"
                            : s.rank === 3
                            ? "bg-amber-100 text-amber-800"
                            : "text-slate-500"
                        }`}>
                          {s.rank <= 3 ? ["🥇", "🥈", "🥉"][s.rank - 1] : s.rank}
                        </span>
                      </td>

                      {/* Roll No */}
                      <td className="py-3 font-mono font-bold text-indigo-700">{s.rollNumber}</td>

                      {/* Student Name */}
                      <td className="py-3 font-bold text-slate-900">{s.userName}</td>

                      {/* Class & Grade */}
                      <td className="py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {s.studentClass && (
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {s.studentClass}
                            </span>
                          )}
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded-md font-mono border border-emerald-200">
                            {s.grade}
                          </span>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3 font-mono font-black text-sm text-emerald-700">
                        {s.score > 0 ? `+${s.score}` : s.score}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">({s.percentage}%)</span>
                      </td>

                      {/* Correct */}
                      <td className="py-3 text-emerald-700 font-bold">{s.correct}</td>

                      {/* Incorrect */}
                      <td className="py-3 text-rose-700 font-bold">{s.incorrect}</td>

                      {/* Unattempted */}
                      <td className="py-3 text-slate-500">{s.unattempted}</td>

                      {/* Time taken */}
                      <td className="py-3 font-mono font-bold text-slate-800">
                        {formatDurationDisplay(s.timeTakenSeconds)}
                      </td>

                      {/* Started / Submitted */}
                      <td className="py-3 text-[11px] font-mono leading-tight">
                        <div className="text-indigo-700" title="शुरू समय">▶ {formatTimestamp(s.startedAt)}</div>
                        <div className="text-emerald-700" title="जमा समय">🏁 {formatTimestamp(s.completedAt)}</div>
                      </td>

                      {/* Tab switches */}
                      <td className="py-3">
                        {s.tabSwitches > 0 ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 text-[11px] font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            ⚠️ {s.tabSwitches} बार
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[11px] font-bold">
                            ✓ 0 बार
                          </span>
                        )}
                      </td>

                      {/* Action Buttons: Report Card, WhatsApp Share, Detailed Audit */}
                      <td className="py-3 text-right pr-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* 🖨️ Printable Official Report Card */}
                          <button
                            type="button"
                            onClick={() => setReportCardStudent(s)}
                            className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-indigo-200"
                            title="प्रिंट योग्य आधिकारिक रिपोर्ट कार्ड खोलें"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>कार्ड</span>
                          </button>

                          {/* 📲 WhatsApp Parent Dispatch */}
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                              `🏆 *${testData?.instituteName || "परीक्षा संस्थान"} - आधिकारिक रिपोर्ट कार्ड*\n\n` +
                              `👤 *परीक्षार्थी:* ${s.userName}\n` +
                              `🏷️ *रोल नंबर:* ${s.rollNumber}\n` +
                              (s.studentClass ? `🏫 *कक्षा / सेक्शन:* ${s.studentClass}\n` : "") +
                              `📝 *विषय / परीक्षा:* ${testData?.testTitle || testData?.title || 'लाइव परीक्षा'}\n` +
                              `🥇 *रैंक:* #${s.rank} / ${totalStudents}\n` +
                              `📊 *प्राप्तांक:* ${s.score} अंक (${s.percentage}%)\n` +
                              `🎖️ *ग्रेड:* ${s.grade} (${s.gradeRemark})\n` +
                              `🎯 *सटीकता:* ${s.accuracy}%\n` +
                              `✅ *सही:* ${s.correct} | ❌ *गलत:* ${s.incorrect} | ⚪ *छोड़ा:* ${s.unattempted}\n` +
                              `⏱️ *समय:* ${formatDurationDisplay(s.timeTakenSeconds)}\n\n` +
                              `_यह रिपोर्ट स्कूल / कोचिंग संस्थान के आधिकारिक ऑनलाइन पोर्टल द्वारा प्रमाणित है।_`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-emerald-200"
                            title="अभिभावक को WhatsApp पर रिपोर्ट कार्ड भेजें"
                          >
                            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                          </a>

                          {/* 👁️ Detailed Audit Sheet */}
                          <button
                            type="button"
                            onClick={() => setInspectedStudent(s)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-slate-200"
                            title="उत्तर पुस्तिका समीक्षा देखें"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 📊 QUESTION-BY-QUESTION CLASS PERFORMANCE ANALYTICS */}
      {questionAnalytics.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                <span>प्रश्नवार कक्षा प्रदर्शन विश्लेषण (Question-by-Question Analytics)</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                जानें कि किस प्रश्न में छात्रों को सबसे अधिक सफलता मिली और कौन सा प्रश्न कठिन रहा।
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-200">
              कुल {questionAnalytics.length} प्रश्न
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {questionAnalytics.map((q) => (
              <div key={q.index} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      Q{q.index + 1}
                    </span>
                    <p className="font-bold text-slate-900 leading-snug">{q.questionText}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span className="text-[10px] font-bold text-slate-500">सही उत्तर:</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                      विकल्प {q.correctAnswer}
                    </span>
                    <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${q.correctPercent >= 60 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {q.correctPercent}% सफलता
                    </span>
                  </div>
                </div>

                {/* Accuracy progress bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${q.correctPercent}%` }} title={`सही: ${q.correctStudents}`} />
                  <div className="bg-rose-500 h-full" style={{ width: `${totalStudents > 0 ? (q.wrongStudents / totalStudents) * 100 : 0}%` }} title={`गलत: ${q.wrongStudents}`} />
                  <div className="bg-slate-300 h-full" style={{ width: `${totalStudents > 0 ? (q.skippedStudents / totalStudents) * 100 : 0}%` }} title={`छोड़ा: ${q.skippedStudents}`} />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                  <span className="text-emerald-700">✓ सही: {q.correctStudents} छात्र ({q.correctPercent}%)</span>
                  <span className="text-rose-700">✗ गलत: {q.wrongStudents} छात्र</span>
                  <span className="text-slate-500">छोड़ा: {q.skippedStudents} छात्र</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 👁️ INDIVIDUAL STUDENT DETAILED REPORT MODAL */}
      {inspectedStudent && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-4 sm:p-6 space-y-4 shadow-2xl relative text-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-lg">
                  🎓
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{inspectedStudent.userName}</h3>
                  <p className="text-xs text-indigo-700 font-mono font-bold">
                    रोल: {inspectedStudent.rollNumber} • रैंक #{inspectedStudent.rank} • कुल अंक: {inspectedStudent.score} ({inspectedStudent.percentage}%)
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

            {/* 🎯 THE 4 CORE INDIVIDUAL METRICS (USER REQUESTED) */}
            <div className="bg-gradient-to-br from-indigo-50/60 to-slate-50 rounded-2xl p-4 border border-indigo-100 space-y-3">
              <div className="text-[11px] font-black text-indigo-950 uppercase tracking-wider flex items-center justify-between border-b border-indigo-200/60 pb-1.5">
                <span>📊 छात्र व्यक्तिगत परीक्षा ऑडिट रिपोर्ट (Individual Audit)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {inspectedStudent.isSubmitted ? "🏁 परीक्षा जमा की गई" : "प्रगति पर"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {/* 1. Screen Changes */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block">🖥️ स्क्रीन बदली (Screen Changes)</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-base font-mono font-black ${inspectedStudent.tabSwitches > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {inspectedStudent.tabSwitches || 0} बार
                    </span>
                    {inspectedStudent.tabSwitches > 0 && (
                      <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded-md">
                        उल्लंघन!
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Time Taken */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block">⏱️ कुल लिया गया समय (Time Taken)</span>
                  <span className="text-base font-mono font-black text-slate-800 mt-0.5 block">
                    {formatDurationHindi(inspectedStudent.timeTakenSeconds)}
                  </span>
                </div>

                {/* 3. Started At */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block">🚀 कब परीक्षा शुरू की (Started At)</span>
                  <span className="text-xs font-mono font-bold text-indigo-700 mt-0.5 block">
                    {formatTimestamp(inspectedStudent.startedAt)}
                  </span>
                </div>

                {/* 4. Submitted At */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block">🏁 कब परीक्षा जमा की (Submitted At)</span>
                  <span className="text-xs font-mono font-bold text-emerald-700 mt-0.5 block">
                    {inspectedStudent.isSubmitted ? formatTimestamp(inspectedStudent.completedAt) : "अपूर्ण"}
                  </span>
                </div>
              </div>

              {/* Marks breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold block">✓ सही उत्तर</span>
                  <span className="text-sm font-mono font-black text-emerald-900">{inspectedStudent.correct}</span>
                </div>
                <div className="bg-rose-50 p-2 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-rose-700 font-bold block">✗ गलत उत्तर</span>
                  <span className="text-sm font-mono font-black text-rose-900">{inspectedStudent.incorrect}</span>
                </div>
                <div className="bg-slate-100 p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-600 font-bold block">- छोड़ा (Skip)</span>
                  <span className="text-sm font-mono font-black text-slate-800">{inspectedStudent.unattempted}</span>
                </div>
              </div>
            </div>

            {/* Question Breakdown sheet */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 flex items-center justify-between">
                <span>📋 प्रश्नवार विस्तृत उत्तर पुस्तिका (Response Sheet):</span>
                <span className="font-mono text-[11px] text-slate-500">कुल {inspectedStudent.totalQuestions} प्रश्न</span>
              </h4>

              {inspectedStudent.detailedAnswers && inspectedStudent.detailedAnswers.length > 0 ? (
                <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  {inspectedStudent.detailedAnswers.map((ans, aIdx) => {
                    const qMaster = testData?.questions?.[aIdx];
                    const resolvedCorrect = ans.correctAnswer || qMaster?.correctAnswer || "A";
                    const correctOptIdx = ["A", "B", "C", "D"].indexOf(resolvedCorrect);
                    const correctText = ans.correctAnswerText || (correctOptIdx >= 0 && qMaster?.options ? qMaster.options[correctOptIdx] : "");

                    const studentOpt = ans.selectedOption || ans.studentAnswer;
                    const studentOptIdx = studentOpt ? ["A", "B", "C", "D"].indexOf(studentOpt) : -1;
                    const studentText = ans.selectedOptionText || (studentOptIdx >= 0 && qMaster?.options ? qMaster.options[studentOptIdx] : "");

                    const isSkipped = !ans.isAttempted;
                    const isCorrect = !isSkipped && (
                      ans.isCorrect ?? (
                        resolvedCorrect && studentOpt ? (
                          studentOpt.trim().toUpperCase() === resolvedCorrect.trim().toUpperCase() ||
                          (studentText && correctText && studentText.trim() === correctText.trim())
                        ) : false
                      )
                    );

                    return (
                      <div
                        key={aIdx}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          isSkipped
                            ? "bg-slate-50 border-slate-200 text-slate-700"
                            : isCorrect
                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                            : "bg-rose-50/70 border-rose-200 text-rose-950"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 leading-snug">
                            प्र. {aIdx + 1}: {ans.questionText || qMaster?.questionText || `Question ${aIdx + 1}`}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                            isSkipped
                              ? "bg-slate-200 text-slate-700"
                              : isCorrect
                              ? "bg-emerald-600 text-white"
                              : "bg-rose-600 text-white"
                          }`}>
                            {isSkipped ? "छोड़ा (0)" : isCorrect ? "✓ सही (+4)" : "✗ गलत (-1)"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                          <div>
                            <span className="text-slate-500 font-bold block text-[10px] uppercase">छात्र का उत्तर:</span>
                            <span className={`font-black ${isSkipped ? "text-slate-400" : isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                              {studentOpt ? `${studentOpt}${studentText ? `: ${studentText}` : ""}` : "कोई उत्तर नहीं (छोड़ा)"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-bold block text-[10px] uppercase">सही उत्तर:</span>
                            <span className="font-black text-emerald-800">
                              {resolvedCorrect ? `${resolvedCorrect}${correctText ? `: ${correctText}` : ""}` : "A"}
                            </span>
                          </div>
                        </div>
                        {(ans.explanation || qMaster?.explanation) && (
                          <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                            <strong className="text-slate-800">व्याख्या:</strong> {ans.explanation || qMaster?.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                  इस छात्र का विस्तृत प्रश्नवार डेटा उपलब्ध नहीं है।
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setInspectedStudent(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs cursor-pointer transition-all"
            >
              रिपोर्ट बंद करें (Close Report)
            </button>
          </div>
        </div>
      )}

      {/* 🖨️ OFFICIAL SCHOOL & GOVT EXAM PRINTABLE REPORT CARD MODAL */}
      {reportCardStudent && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl relative text-slate-800 max-h-[92vh] overflow-y-auto custom-scrollbar print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none">
            
            {/* Top Toolbar: Actions (Hidden on Print) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  🖨️
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">आधिकारिक परीक्षा रिपोर्ट कार्ड (Official Report Card)</h3>
                  <p className="text-[11px] text-slate-500 font-medium">CBSE / State Board व प्रतियोगी परीक्षा हेतु अधिकृत</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>प्रिंट / PDF सेव करें</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportCardStudent(null)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* PRINTABLE REPORT CARD DOCUMENT (A4 Optimized) */}
            <div id="printable-report-card" className="border-2 border-indigo-900/20 rounded-2xl p-5 sm:p-6 space-y-5 bg-gradient-to-b from-slate-50/50 to-white print:border-2 print:border-slate-800 print:p-6 print:rounded-none">
              
              {/* Institution Header */}
              <div className="text-center pb-4 border-b-2 border-indigo-900/20 space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">🏛️</span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {testData?.instituteName || "Premier Academic & Competitive Examination Portal"}
                  </h2>
                </div>
                <p className="text-xs font-bold text-indigo-800 tracking-wider uppercase">
                  {testData?.testTitle || testData?.title || "सत्र परीक्षा / Live Examination"}
                </p>
                <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-3 pt-0.5">
                  <span>सत्र: 2026-2027</span>
                  <span>•</span>
                  <span>विषय: {testData?.subject || "सामान्य अध्ययन / मुख्य विषय"}</span>
                  <span>•</span>
                  <span>दिनांक: {new Date().toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">विद्यार्थी का नाम</span>
                  <span className="font-black text-slate-900 text-sm">{reportCardStudent.userName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">अनुक्रमांक (Roll No)</span>
                  <span className="font-mono font-black text-indigo-700 text-sm">{reportCardStudent.rollNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">कक्षा / बैच / सेक्शन</span>
                  <span className="font-bold text-slate-800 text-sm">{reportCardStudent.studentClass || "सामान्य"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">कक्षा में रैंक (Rank)</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">#{reportCardStudent.rank} / {totalStudents}</span>
                </div>
              </div>

              {/* Core Scorecard Matrix */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">कुल प्रश्न</span>
                  <span className="text-base font-black text-slate-800 font-mono">{reportCardStudent.totalQuestions}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase block">प्राप्तांक</span>
                  <span className="text-base font-black text-indigo-900 font-mono">{reportCardStudent.score}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[10px] font-bold text-purple-700 uppercase block">प्रतिशत</span>
                  <span className="text-base font-black text-purple-900 font-mono">{reportCardStudent.percentage}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">ग्रेड (Grade)</span>
                  <span className="text-base font-black text-emerald-900 font-mono">{reportCardStudent.grade}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200">
                  <span className="text-[10px] font-bold text-teal-700 uppercase block">सटीकता</span>
                  <span className="text-base font-black text-teal-900 font-mono">{reportCardStudent.accuracy}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">समय लिया</span>
                  <span className="text-xs font-black text-amber-900 font-mono mt-1 block">{formatDurationDisplay(reportCardStudent.timeTakenSeconds)}</span>
                </div>
              </div>

              {/* Grade Remark & Evaluation Banner */}
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-indigo-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">शिक्षक / परीक्षक मूल्यांकन टिप्पणी</span>
                  <span className="font-black text-slate-900 text-sm">{reportCardStudent.gradeRemark || "उत्कृष्ट प्रदर्शन"}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">स्क्रीन अनुशासन स्थिति</span>
                  <span className={`font-bold ${reportCardStudent.tabSwitches > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                    {reportCardStudent.tabSwitches > 0 ? `चेतावनी (${reportCardStudent.tabSwitches} बार स्क्रीन बदली)` : "100% अनुशासित (Zero Violation)"}
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">मूल्यांकन घटक</th>
                      <th className="py-2 px-3 text-center">संख्या</th>
                      <th className="py-2 px-3 text-right">अंक भार</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    <tr>
                      <td className="py-2 px-3 text-emerald-800 font-bold">✓ सही उत्तर (Correct Answers)</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">{reportCardStudent.correct}</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700">+{reportCardStudent.correct * (testData?.marksCorrect || 4)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-rose-800 font-bold">✗ गलत उत्तर (Incorrect Answers)</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-rose-700">{reportCardStudent.incorrect}</td>
                      <td className="py-2 px-3 text-right font-mono text-rose-700">-{reportCardStudent.incorrect * (testData?.marksNegative || 0)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600 font-bold">⚪ अनुत्तरित प्रश्न (Skipped / Unattempted)</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-600">{reportCardStudent.unattempted}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Official Signatures & Seal */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-8">
                  <div className="h-10 border-b border-dashed border-slate-400 w-48 mx-auto" />
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                    हस्ताक्षर परीक्षक / वर्ग शिक्षक (Teacher Signature)
                  </span>
                </div>
                <div className="space-y-8">
                  <div className="h-10 border-b border-dashed border-slate-400 w-48 mx-auto flex items-center justify-center text-slate-300 font-mono text-[10px]">
                    [ स्कूल / कोचिंग मुहर ]
                  </div>
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                    प्राचार्य / संस्थान निदेशक (Director / Stamp)
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions (Hidden on Print) */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100 print:hidden">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `🏆 *${testData?.instituteName || "परीक्षा संस्थान"} - आधिकारिक रिपोर्ट कार्ड*\n\n` +
                  `👤 *परीक्षार्थी:* ${reportCardStudent.userName}\n` +
                  `🏷️ *रोल नंबर:* ${reportCardStudent.rollNumber}\n` +
                  (reportCardStudent.studentClass ? `🏫 *कक्षा / सेक्शन:* ${reportCardStudent.studentClass}\n` : "") +
                  `📝 *विषय / परीक्षा:* ${testData?.testTitle || testData?.title || 'लाइव परीक्षा'}\n` +
                  `🥇 *रैंक:* #${reportCardStudent.rank} / ${totalStudents}\n` +
                  `📊 *प्राप्तांक:* ${reportCardStudent.score} अंक (${reportCardStudent.percentage}%)\n` +
                  `🎖️ *ग्रेड:* ${reportCardStudent.grade} (${reportCardStudent.gradeRemark})\n` +
                  `🎯 *सटीकता:* ${reportCardStudent.accuracy}%\n` +
                  `✅ *सही:* ${reportCardStudent.correct} | ❌ *गलत:* ${reportCardStudent.incorrect} | ⚪ *छोड़ा:* ${reportCardStudent.unattempted}\n` +
                  `⏱️ *समय:* ${formatDurationDisplay(reportCardStudent.timeTakenSeconds)}\n\n` +
                  `_यह रिपोर्ट स्कूल / कोचिंग संस्थान के आधिकारिक ऑनलाइन पोर्टल द्वारा प्रमाणित है।_`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>अभिभावक को WhatsApp भेजें (Send to Parent)</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>प्रिंट निकालें (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
