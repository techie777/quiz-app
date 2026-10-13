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
  Search
} from "lucide-react";
import toast from "react-hot-toast";

export default function B2BMasterResultLedger({ testData, participants = [], submissions = [], onBack }) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  // Construct Ranked Results
  const rankedLedger = useMemo(() => {
    // Merge participants with submissions
    const list = (participants || []).filter((p) => p.role !== "HOST");

    const processed = list.map((p) => {
      const sub = (submissions || []).find((s) => s.userId === p.userId) || {};
      const answers = sub.answers || p.answers || [];

      // Calculate correct / incorrect / skipped
      let correct = 0;
      let incorrect = 0;
      let unattempted = 0;

      answers.forEach((ans) => {
        if (ans.status === "CORRECT" || ans.isCorrect) correct += 1;
        else if (ans.status === "INCORRECT" || (!ans.isCorrect && ans.selectedOption)) incorrect += 1;
        else unattempted += 1;
      });

      const totalQs = testData?.questionsCount || testData?.questions?.length || 20;
      if (answers.length < totalQs) {
        unattempted += totalQs - answers.length;
      }

      const score = typeof sub.totalScore !== "undefined" ? sub.totalScore : (p.score || 0);
      const totalMarksPossible = testData?.totalMarks || (totalQs * (testData?.marksCorrect || 4));
      const percentage = totalMarksPossible > 0 ? Math.max(0, Math.round((score / totalMarksPossible) * 100)) : 0;

      return {
        userId: p.userId,
        userName: p.userName || "Student",
        rollNumber: p.rollNumber || sub.rollNumber || "N/A",
        score,
        correct,
        incorrect,
        unattempted,
        totalQuestions: totalQs,
        percentage,
        tabSwitches: p.tabSwitches || 0,
        completedAt: sub.completedAt || p.completedAt || new Date().toISOString()
      };
    });

    // Sort descending by score, then ascending by tabSwitches
    processed.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.tabSwitches - b.tabSwitches;
    });

    return processed.map((p, idx) => ({ ...p, rank: idx + 1 }));
  }, [participants, submissions, testData]);

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
      (s) => s.userName?.toLowerCase().includes(q) || s.rollNumber?.toLowerCase().includes(q)
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
                <div key={s.userId} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
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
                        <span className="text-xs font-mono font-bold text-indigo-700">रोल: {s.rollNumber}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-mono font-black text-emerald-700">
                        {s.score > 0 ? `+${s.score}` : s.score} अंक
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">{s.percentage}%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200/60 text-xs font-medium">
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
                    <th className="py-2.5">कुल अंक</th>
                    <th className="py-2.5">सही (✓)</th>
                    <th className="py-2.5">गलत (✗)</th>
                    <th className="py-2.5">छोड़ा (Skip)</th>
                    <th className="py-2.5">प्रतिशत (%)</th>
                    <th className="py-2.5 text-right pr-3 rounded-r-xl">एंटी-चीट लॉग</th>
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

                      {/* Score */}
                      <td className="py-3 font-mono font-black text-sm text-emerald-700">
                        {s.score > 0 ? `+${s.score}` : s.score}
                      </td>

                      {/* Correct */}
                      <td className="py-3 text-emerald-700 font-bold">{s.correct}</td>

                      {/* Incorrect */}
                      <td className="py-3 text-rose-700 font-bold">{s.incorrect}</td>

                      {/* Unattempted */}
                      <td className="py-3 text-slate-500">{s.unattempted}</td>

                      {/* Percentage */}
                      <td className="py-3 font-mono font-bold text-slate-900">{s.percentage}%</td>

                      {/* Tab switches */}
                      <td className="py-3 text-right pr-3">
                        {s.tabSwitches > 0 ? (
                          <span className="text-rose-700 text-[11px] font-bold">
                            ⚠️ {s.tabSwitches} अलर्ट
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[11px] font-bold">
                            ✓ सुरक्षित
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
