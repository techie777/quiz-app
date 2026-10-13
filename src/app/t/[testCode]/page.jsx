"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Clock,
  HelpCircle,
  Award,
  AlertTriangle,
  ShieldCheck,
  User,
  Hash,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
  RotateCcw,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

export default function StudentTestGatewayPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = params?.testCode;
  const testCode = typeof rawCode === "string" ? rawCode.toUpperCase() : "";

  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [error, setError] = useState(null);

  // Student Input State
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [agreeRules, setAgreeRules] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(false);

  useEffect(() => {
    if (!testCode) return;

    // Detect if student already registered for this test
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem(`b2b_student_name_${testCode}`) || "";
      const savedRoll = localStorage.getItem(`b2b_student_roll_${testCode}`) || "";
      if (savedName) setStudentName(savedName);
      if (savedRoll) setRollNumber(savedRoll);
      if (savedName && (savedRoll || !testData?.requireRollNumber)) {
        setHasExistingSession(true);
      }
    }

    const fetchTestDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/b2b/tests/${testCode}?role=student`);
        if (res.data) {
          setTestData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch test info:", err);
        setError(
          err.response?.data?.error ||
            "यह टेस्ट कोड अमान्य है या समाप्त हो चुका है। कृपया अपने शिक्षक से संपर्क करें।"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTestDetails();
  }, [testCode]);

  // Handle rejoining active exam
  const handleResumeExam = () => {
    if (!studentName.trim()) {
      toast.error("कृपया अपना नाम दर्ज करें");
      return;
    }
    const cleanName = studentName.trim();
    const cleanRoll = rollNumber.trim().toUpperCase();
    
    // Maintain stable student ID
    let uniqueId = localStorage.getItem(`quiz_uid_${testCode}`);
    if (!uniqueId) {
      uniqueId = `student_${cleanRoll ? cleanRoll.replace(/[^A-Z0-9]/g, "") : Math.random().toString(36).substring(2, 7)}_${Date.now().toString(36)}`;
      localStorage.setItem(`quiz_uid_${testCode}`, uniqueId);
    }

    localStorage.setItem(`b2b_student_name_${testCode}`, cleanName);
    localStorage.setItem(`b2b_student_roll_${testCode}`, cleanRoll);
    localStorage.setItem(`quiz_callsign_${testCode}`, cleanRoll ? `${cleanName} (${cleanRoll})` : cleanName);

    toast.success("परीक्षा कक्ष में फिर से प्रवेश हो रहा है... 🚀");
    const targetUrl = `/live/${testCode}?role=student&name=${encodeURIComponent(cleanName)}&roll=${encodeURIComponent(cleanRoll)}&b2b=true`;
    router.push(targetUrl);
  };

  const handleJoinExam = (e) => {
    e.preventDefault();

    if (!studentName.trim()) {
      toast.error("कृपया अपना पूरा नाम दर्ज करें (Enter your full name)");
      return;
    }

    if (testData?.requireRollNumber && !rollNumber.trim()) {
      toast.error("रोल नंबर / स्टूडेंट आईडी आवश्यक है (Roll number is required)");
      return;
    }

    if (!agreeRules) {
      toast.error("कृपया परीक्षा नियमों से सहमति की पुष्टि करें (Please check the agreement box)");
      return;
    }

    setSubmitting(true);

    try {
      const cleanName = studentName.trim();
      const cleanRoll = rollNumber.trim().toUpperCase();
      
      // Check if ID already exists, or generate stable unique ID
      let uniqueId = localStorage.getItem(`quiz_uid_${testCode}`);
      if (!uniqueId) {
        uniqueId = `student_${cleanRoll ? cleanRoll.replace(/[^A-Z0-9]/g, "") : Math.random().toString(36).substring(2, 7)}_${Date.now().toString(36)}`;
        localStorage.setItem(`quiz_uid_${testCode}`, uniqueId);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(`b2b_student_name_${testCode}`, cleanName);
        localStorage.setItem(`b2b_student_roll_${testCode}`, cleanRoll);
        localStorage.setItem(`quiz_callsign_${testCode}`, cleanRoll ? `${cleanName} (${cleanRoll})` : cleanName);
      }

      toast.success("सत्यापन सफल! परीक्षा कक्ष में प्रवेश हो रहा है... 🚀");
      const targetUrl = `/live/${testCode}?role=student&name=${encodeURIComponent(cleanName)}&roll=${encodeURIComponent(cleanRoll)}&b2b=true`;
      router.push(targetUrl);
    } catch (err) {
      console.error("Join error:", err);
      toast.error("प्रवेश में समस्या हुई, कृपया पुनः प्रयास करें।");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-3xl animate-bounce mb-4 text-indigo-600 shadow-sm">
          📡
        </div>
        <p className="text-sm font-bold text-slate-600 animate-pulse tracking-wide">
          परीक्षा विवरण लोड हो रहा है (Connecting to Exam Uplink)...
        </p>
      </div>
    );
  }

  if (error || !testData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-lg"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">अमान्य टेस्ट कोड (Invalid Exam)</h2>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              {error || "यह टेस्ट रूम उपलब्ध नहीं है या शिक्षक द्वारा समाप्त कर दिया गया है।"}
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono text-slate-700">
            Room Code: <span className="text-indigo-600 font-bold">{testCode || "N/A"}</span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            होमपेज पर वापस जाएं (Back to Home)
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white text-slate-800 flex flex-col justify-between p-3 sm:p-6 md:p-8">
      {/* Top Brand Bar */}
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between py-2 border-b border-slate-200 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md font-black text-lg">
            E
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>EduTest Live</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                PROCTOR
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">लाइव परीक्षा पोर्टल (Live Exam Gateway)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{testCode}</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto space-y-5"
      >
        {/* REJOIN BANNER (If student visited before) */}
        {hasExistingSession && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center text-lg shrink-0">
                  <RotateCcw className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[11px] font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                    <span>सक्रिय परीक्षा सत्र (Active Session Found)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {studentName} {rollNumber ? `• रोल नंबर: ${rollNumber}` : ""}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResumeExam}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>अपनी परीक्षा जारी रखें (Rejoin Exam)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-emerald-700 leading-tight">
              💡 आप इसी डिवाइस से अपनी परीक्षा बिना किसी रुकावट के तुरंत जारी रख सकते हैं।
            </p>
          </motion.div>
        )}

        {/* Exam Overview Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

          {/* Institute & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-black text-indigo-700 tracking-wide uppercase">
                {testData.instituteName || "Premier Coaching Academy"}
              </span>
              <span title="Verified Institute">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </span>
            </div>

            {testData.batchName && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {testData.batchName}
              </span>
            )}
          </div>

          {/* Test Title & Subject */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {testData.testTitle || testData.title || "Live Competitive Exam"}
            </h2>
            {testData.subject && (
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>विषय (Subject): {testData.subject}</span>
              </p>
            )}
          </div>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center space-y-0.5">
              <div className="flex items-center justify-center text-slate-500">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-base font-black text-slate-900">{testData.questionsCount || testData.questions?.length || 0}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">कुल प्रश्न (Questions)</div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center space-y-0.5">
              <div className="flex items-center justify-center text-slate-500">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-base font-black text-slate-900">
                {testData.timingType === "PER_QUESTION_TIMER"
                  ? `${testData.perQuestionSeconds || 45}s`
                  : `${testData.durationMinutes || 20}m`}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">
                {testData.timingType === "PER_QUESTION_TIMER" ? "प्रति प्रश्न (Per Q)" : "कुल समय (Duration)"}
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 text-center space-y-0.5">
              <div className="flex items-center justify-center text-emerald-600">
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-base font-black text-emerald-700">+{testData.marksCorrect || 4}</div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase">सही उत्तर (Correct)</div>
            </div>

            <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-3 text-center space-y-0.5">
              <div className="flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-base font-black text-rose-700">
                {testData.marksNegative > 0 ? `-${testData.marksNegative}` : "0"}
              </div>
              <div className="text-[10px] font-bold text-rose-600 uppercase">नेगेटिव (Negative)</div>
            </div>
          </div>

          {/* Anti-Cheat Proctor Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900">
            <Lock className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <div className="text-xs leading-relaxed">
              <strong className="font-bold block text-amber-950">लाइव प्रोक्टरिंग सक्रिय (Live Anti-Cheat Guard):</strong>
              परीक्षा के दौरान टैब बदलना या ऐप छोड़ना शिक्षक को सूचित करेगा।{" "}
              {testData.tabSwitchLimit ? `अधिकतम सीमा: ${testData.tabSwitchLimit} बार।` : ""}
            </div>
          </div>
        </div>

        {/* Student Entry Form Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm">
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {hasExistingSession ? "विवरण बदलें या नया प्रवेश करें (Student Details)" : "विद्यार्थी विवरण (Student Verification)"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                परिणाम और उपस्थिति रिपोर्ट के लिए अपना सही नाम व रोल नंबर दर्ज करें।
              </p>
            </div>

            <form onSubmit={handleJoinExam} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>विद्यार्थी का नाम (Full Name) *</span>
                </label>
                <input
                  type="text"
                  placeholder="अपना पूरा नाम लिखें (उदा. राहुल शर्मा)"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>

              {/* Roll Number / ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-purple-600" />
                    <span>रोल नंबर / स्टूडेंट आईडी (Roll No / ID) {testData.requireRollNumber ? "*" : "(ऐच्छिक)"}</span>
                  </label>
                  {testData.requireRollNumber && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      अनिवार्य
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="उदा. 2024-JEE-042 या कक्षा रोल नंबर"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  required={testData.requireRollNumber}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all uppercase"
                />
              </div>

              {/* Rule Confirmation Checkbox */}
              <label className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={agreeRules}
                  onChange={(e) => setAgreeRules(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-600 leading-relaxed font-medium">
                  मैं पुष्टि करता हूँ कि मैं बिना किसी नकल या टैब स्विच के निष्पक्ष रूप से यह परीक्षा दूंगा।
                  (I certify I will take this exam honestly without switching tabs).
                </span>
              </label>

              {/* Action Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 sm:py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>प्रवेश हो रहा है... ⏳</span>
                ) : (
                  <>
                    <span>{hasExistingSession ? "नये विवरण से परीक्षा शुरू करें" : "परीक्षा हॉल में प्रवेश करें (Enter Exam)"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Footer Support Info */}
      <div className="w-full max-w-2xl mx-auto py-4 text-center text-xs text-slate-500 space-y-0.5">
        <p className="font-medium">Powered by EduTest Live Cloud Engine • सुरक्षित लाइव परीक्षा संचालन</p>
        <p className="text-[10px] text-slate-400">Zero Client-Side Trust Architecture • Automatic Session Recovery</p>
      </div>
    </div>
  );
}
