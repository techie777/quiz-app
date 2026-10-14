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
  VolumeX,
  Lock,
  Unlock,
  Search,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Smartphone,
  MessageSquare,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  UserX,
  X,
  Radio,
  ChevronRight,
  Copy,
  Share2,
  ArrowLeft,
  Settings,
  Maximize2,
  Minimize2,
  BarChart2,
  PieChart,
  TrendingUp,
  Sliders,
  SlidersHorizontal,
  Layers,
  Bell,
  BellOff,
  HelpCircle,
  Check
} from "lucide-react";
import socketService from "@/engine/lib/socket";
import toast from "react-hot-toast";
import axios from "axios";
import B2BMasterResultLedger from "@/components/engine/B2BMasterResultLedger";

export default function B2BLiveWarRoom({ session, participants = [], pendingParticipants = [], testData, onEndExam, sendAction, onInspectStudent }) {
  // Navigation View: "ROSTER" | "MASTER_REPORT" | "PROCTOR" | "CHAT" | "INCIDENTS"
  const [activeView, setActiveView] = useState("ROSTER");

  // Gatekeeper: Pending Approvals
  const [pendingList, setPendingList] = useState(pendingParticipants || []);

  const [telemetryMap, setTelemetryMap] = useState({});
  const [incidents, setIncidents] = useState([]);
  const [inspectedStudent, setInspectedStudent] = useState(null);
  const [broadcastText, setBroadcastText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterViolationsOnly, setFilterViolationsOnly] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState(false);

  // Latest Exam Submission Alert & Submission History
  const [latestSubmissionAlert, setLatestSubmissionAlert] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);

  // ⚙️ Teacher Settings & Control Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [strictProctoring, setStrictProctoring] = useState(true);
  const [roomLocked, setRoomLocked] = useState(false);
  const [tableDensity, setTableDensity] = useState("comfortable"); // "comfortable" | "compact"
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [desktopNotifications, setDesktopNotifications] = useState(false);

  // Monitor Fullscreen status
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        toast.success("पूर्ण स्क्रीन मोड सक्रिय (Fullscreen Enabled) 🖥️");
      }).catch((e) => {
        console.warn("Fullscreen request prevented:", e);
        toast.error("फुलस्क्रीन शुरू नहीं हो सका");
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        toast("फुलस्क्रीन बंद किया गया", { icon: "🪟" });
      }).catch((e) => {
        console.warn("Exit fullscreen prevented:", e);
      });
    }
  };

  // 1-to-1 Direct Chat State
  const [directMessages, setDirectMessages] = useState([]);
  const [selectedChatStudentId, setSelectedChatStudentId] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [unreadDMs, setUnreadDMs] = useState({});

  // Proctor Vision: Camera Frames & Audio Call State
  const [proctorFrames, setProctorFrames] = useState({});
  const [activeCall, setActiveCall] = useState(null); // { userId, userName, status: 'CALLING' | 'CONNECTED', isMuted: false }
  const peerConnectionRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const localAudioStreamRef = useRef(null);
  const chatBottomRef = useRef(null);

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

  // Sync pending participants prop
  useEffect(() => {
    if (Array.isArray(pendingParticipants)) {
      setPendingList(pendingParticipants);
    }
  }, [pendingParticipants]);

  // Format timer MM:SS
  const formatTimer = (secs) => {
    if (secs === null) return "--:--";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Sound Chime Synthesizer for Submissions
  const playSubmissionChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1 (D5 - 587Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2 (A5 - 880Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.35, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn("Audio chime prevented:", e);
    }
  };

  const playTestChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
      toast.success("🔔 ध्वनि परीक्षण सफल! (Audio Working)");
    } catch (e) {
      toast.error("ऑडियो प्ले नहीं हो सका");
    }
  };

  const formatDurationHindi = (totalSecs) => {
    if (!totalSecs || totalSecs <= 0) return "0 सेकंड";
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m === 0) return `${s} सेकंड`;
    return `${m} मिनट ${s} सेकंड`;
  };

  const formatTimestampFull = (ts) => {
    if (!ts) return "N/A";
    try {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    } catch (e) {
      return "N/A";
    }
  };

  // Socket Telemetry, Alerts, Submissions, DMs & Proctoring Listeners
  useEffect(() => {
    if (!socket) return;

    // Fetch existing DMs
    socket.emit("FETCH_DIRECT_MESSAGES", { sessionId: testCode, userId: "HOST" });

    // Gatekeeper: Sync pending students & join alerts
    const handleSyncPending = (pending) => {
      if (Array.isArray(pending)) {
        setPendingList(pending);
      }
    };

    const handleJoinRequest = (data) => {
      toast(`🔔 नए छात्र का प्रवेश अनुरोध: ${data.guestName || "Student"} ${data.rollNumber ? `(${data.rollNumber})` : ""}`, {
        icon: "🎓",
        duration: 5000
      });
    };

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

      setTelemetryMap((prev) => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          tabSwitches: data.switchCount
        }
      }));
    };

    const handleSubmission = (data) => {
      // 1. Audio notification chime
      playSubmissionChime();

      // 2. High-visibility submission alert banner
      const submissionItem = {
        ...data,
        id: `${Date.now()}_${data.userId}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
      };
      setLatestSubmissionAlert(submissionItem);

      // 3. Keep in submission history
      setSubmissionsList((prev) => {
        const existIdx = prev.findIndex((s) => s.userId === data.userId);
        if (existIdx !== -1) {
          const updated = [...prev];
          updated[existIdx] = submissionItem;
          return updated;
        }
        return [submissionItem, ...prev];
      });

      // 4. Toast notification
      toast.success(`🏁 ${data.userName} (${data.rollNumber}) ने परीक्षा जमा की! अंक: ${data.totalScore}`, {
        duration: 7000,
        icon: "🏆"
      });

      // 5. Update live telemetry
      setTelemetryMap((prev) => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          isSubmitted: true,
          score: data.totalScore,
          accuracy: data.accuracy,
          correctCount: data.correctCount,
          wrongCount: data.wrongCount,
          unattemptedCount: data.unattemptedCount,
          totalQuestions: data.totalQuestions,
          maxScore: data.maxScore,
          tabSwitches: typeof data.tabSwitches !== "undefined" ? data.tabSwitches : (prev[data.userId]?.tabSwitches || 0),
          timeTakenSeconds: data.timeTakenSeconds || prev[data.userId]?.timeTakenSeconds || 0,
          startedAt: data.startedAt || prev[data.userId]?.startedAt || null,
          completedAt: data.completedAt || Date.now(),
          answers: data.answers,
          detailedAnswers: data.detailedAnswers || []
        }
      }));
    };

    // 💬 Direct Messages
    const handleDirectMessage = (dm) => {
      setDirectMessages((prev) => {
        if (prev.some((m) => m.id === dm.id)) return prev;
        return [...prev, dm];
      });

      if (dm.role !== "HOST") {
        setUnreadDMs((prev) => ({
          ...prev,
          [dm.fromUserId]: (prev[dm.fromUserId] || 0) + 1
        }));
        toast(`💬 ${dm.fromUserName}: ${dm.text.slice(0, 30)}`, {
          icon: "📩",
          duration: 4000
        });
      }
    };

    const handleSyncDMs = (msgs) => {
      if (Array.isArray(msgs)) {
        setDirectMessages(msgs);
      }
    };

    // 👁️ Proctor Frame (Camera Snapshots)
    const handleProctorFrame = (data) => {
      if (!data?.userId || !data?.frame) return;
      setProctorFrames((prev) => ({
        ...prev,
        [data.userId]: {
          frame: data.frame,
          timestamp: data.timestamp || Date.now(),
          userName: data.userName,
          rollNumber: data.rollNumber
        }
      }));
    };

    // 📞 WebRTC Audio Signaling with Candidate Queueing
    const handleWebRTCSignal = async (data) => {
      if (!data?.signal && !data?.type) return;
      if (data.fromUserId === "HOST") return;
      if (data.toUserId && data.toUserId !== "HOST" && data.toUserId !== session?.userId) return;

      const pc = peerConnectionRef.current;
      if (!pc) return;

      if (data.signal?.sdp) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
          setActiveCall((prev) => (prev ? { ...prev, status: "CONNECTED" } : null));

          // Drain queued ICE candidates
          while (pendingCandidatesRef.current.length > 0) {
            const cand = pendingCandidatesRef.current.shift();
            try {
              await pc.addIceCandidate(cand);
            } catch (candErr) {}
          }
          toast.success("छात्र से ऑडियो कॉल कनेक्ट हो गई है! 🎙️");
        } catch (e) {
          console.error("Error setting remote description:", e);
        }
      } else if (data.signal?.candidate) {
        const cand = new RTCIceCandidate(data.signal.candidate);
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(cand);
          } catch (e) {}
        } else {
          pendingCandidatesRef.current.push(cand);
        }
      } else if (data.type === "CALL_DECLINED" || data.signal?.type === "DECLINED") {
        endAudioCall();
        toast.error("छात्र ने कॉल अस्वीकार कर दी।");
      } else if (data.signal?.type === "HANGUP" || data.type === "CALL_ENDED") {
        endAudioCall();
      }
    };

    socket.on("SYNC_PENDING", handleSyncPending);
    socket.on("GUEST_JOIN_REQUEST", handleJoinRequest);
    socket.on("HOST_TELEMETRY_UPDATE", handleTelemetry);
    socket.on("HOST_TAB_ALERT", handleTabAlert);
    socket.on("EXAM_SUBMISSION_BROADCAST", handleSubmission);
    socket.on("DIRECT_MESSAGE", handleDirectMessage);
    socket.on("SYNC_DIRECT_MESSAGES", handleSyncDMs);
    socket.on("PROCTOR_FRAME_UPDATE", handleProctorFrame);
    socket.on("PROCTOR_WEBRTC_SIGNAL", handleWebRTCSignal);

    return () => {
      socket.off("SYNC_PENDING", handleSyncPending);
      socket.off("GUEST_JOIN_REQUEST", handleJoinRequest);
      socket.off("HOST_TELEMETRY_UPDATE", handleTelemetry);
      socket.off("HOST_TAB_ALERT", handleTabAlert);
      socket.off("EXAM_SUBMISSION_BROADCAST", handleSubmission);
      socket.off("DIRECT_MESSAGE", handleDirectMessage);
      socket.off("SYNC_DIRECT_MESSAGES", handleSyncDMs);
      socket.off("PROCTOR_FRAME_UPDATE", handleProctorFrame);
      socket.off("PROCTOR_WEBRTC_SIGNAL", handleWebRTCSignal);
    };
  }, [socket, testCode]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [directMessages, selectedChatStudentId]);

  // Combine participants with latest telemetry & submissions
  const studentList = useMemo(() => {
    const list = (participants || []).filter((p) => p.role !== "HOST");
    return list.map((p) => {
      const telem = telemetryMap[p.userId] || {};
      const sub = submissionsList.find((s) => s.userId === p.userId) || {};
      const isSubmitted = Boolean(telem.isSubmitted || p.isSubmitted || sub.completedAt);
      const rawName = p.userName || p.name || telem.userName || sub.userName || "छात्र";
      const rollNumber = telem.rollNumber || p.rollNumber || sub.rollNumber || (rawName.match(/\(([^)]+)\)/)?.[1]) || "";
      const studentClass = telem.studentClass || p.studentClass || sub.studentClass || "";
      const cleanName = rawName.replace(/\s*\([^)]*\)\s*$/, "").trim() || rawName;

      return {
        ...p,
        userName: cleanName,
        rollNumber: rollNumber || "N/A",
        studentClass: studentClass || "",
        grade: telem.grade || p.grade || sub.grade || "",
        gradeRemark: telem.gradeRemark || p.gradeRemark || sub.gradeRemark || "",
        currentIndex: typeof telem.currentIndex !== "undefined" ? telem.currentIndex : (p.progress || 0),
        selectedOption: typeof telem.selectedOption !== "undefined" ? telem.selectedOption : null,
        tabSwitches: typeof telem.tabSwitches !== "undefined" ? telem.tabSwitches : (p.tabSwitches || sub.tabSwitches || 0),
        isSubmitted,
        score: typeof telem.score !== "undefined" ? telem.score : (typeof sub.totalScore !== "undefined" ? sub.totalScore : (p.score || 0)),
        lastPulse: telem.updatedAt || null,
        isIndividualPaused: Boolean(p.isIndividualPaused),
        timeTakenSeconds: telem.timeTakenSeconds || p.timeTakenSeconds || sub.timeTakenSeconds || 0,
        startedAt: telem.startedAt || p.startedAt || sub.startedAt || null,
        completedAt: telem.completedAt || p.completedAt || sub.completedAt || null,
        accuracy: telem.accuracy || p.accuracy || sub.accuracy || 0,
        correctCount: telem.correctCount || p.correctCount || sub.correctCount || 0,
        wrongCount: telem.wrongCount || p.wrongCount || sub.wrongCount || 0,
        unattemptedCount: telem.unattemptedCount || p.unattemptedCount || sub.unattemptedCount || 0,
        answers: telem.answers || p.answers || sub.answers || {},
        detailedAnswers: telem.detailedAnswers || p.detailedAnswers || sub.detailedAnswers || []
      };
    });
  }, [participants, telemetryMap, submissionsList]);

  // Filtered List (Searches Name, Roll Number, and Class/Section)
  const filteredStudents = useMemo(() => {
    return studentList.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        s.userName?.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q) ||
        s.studentClass?.toLowerCase().includes(q);
      const matchesViolation = filterViolationsOnly ? s.tabSwitches > 0 : true;
      return matchesSearch && matchesViolation;
    });
  }, [studentList, searchTerm, filterViolationsOnly]);

  // 🔥 Question Difficulty Heatmap Analytics
  const questionDifficultyHeatmap = useMemo(() => {
    const qs = testData?.questions || [];
    if (qs.length === 0) return [];

    return qs.map((q, idx) => {
      const correctOpt = (q.correctAnswer || "A").trim().toUpperCase();
      let attemptsCount = 0;
      let correctCount = 0;
      let wrongCount = 0;

      studentList.forEach((s) => {
        const studentAns = s.answers?.[idx] || (s.detailedAnswers && s.detailedAnswers[idx]?.selectedOption) || null;
        if (studentAns && studentAns !== "SKIP") {
          attemptsCount++;
          if (studentAns.toString().trim().toUpperCase() === correctOpt) {
            correctCount++;
          } else {
            wrongCount++;
          }
        }
      });

      const accuracy = attemptsCount > 0 ? Math.round((correctCount / attemptsCount) * 100) : null;
      let difficulty = "PENDING";
      if (attemptsCount > 0) {
        if (accuracy < 40) difficulty = "HARD";
        else if (accuracy <= 70) difficulty = "MEDIUM";
        else difficulty = "EASY";
      }

      return {
        index: idx,
        questionNumber: idx + 1,
        questionText: q.questionText || `प्रश्न ${idx + 1}`,
        options: q.options || [],
        correctOpt,
        attemptsCount,
        correctCount,
        wrongCount,
        accuracy,
        difficulty
      };
    });
  }, [testData, studentList]);

  // 📊 Comprehensive Analytics & Graph Data Calculations
  const analyticsData = useMemo(() => {
    const questions = testData?.questions || [];
    const allStudents = studentList || [];
    const submissions = submissionsList || [];

    // 1. Grade Distribution (CBSE letter grades A1 to E)
    const gradeBuckets = {
      A1: { key: "A1", label: "A1 (91-100%)", count: 0, color: "bg-emerald-500", text: "text-emerald-700", bgLight: "bg-emerald-50", border: "border-emerald-200", remark: "उत्कृष्ट (Outstanding)", students: [] },
      A2: { key: "A2", label: "A2 (81-90%)", count: 0, color: "bg-teal-500", text: "text-teal-700", bgLight: "bg-teal-50", border: "border-teal-200", remark: "अति उत्तम (Excellent)", students: [] },
      B1: { key: "B1", label: "B1 (71-80%)", count: 0, color: "bg-sky-500", text: "text-sky-700", bgLight: "bg-sky-50", border: "border-sky-200", remark: "बहुत अच्छा (Very Good)", students: [] },
      B2: { key: "B2", label: "B2 (61-70%)", count: 0, color: "bg-blue-500", text: "text-blue-700", bgLight: "bg-blue-50", border: "border-blue-200", remark: "अच्छा (Good)", students: [] },
      C1: { key: "C1", label: "C1 (51-60%)", count: 0, color: "bg-amber-500", text: "text-amber-700", bgLight: "bg-amber-50", border: "border-amber-200", remark: "संतोषजनक (Satisfactory)", students: [] },
      C2: { key: "C2", label: "C2 (41-50%)", count: 0, color: "bg-orange-500", text: "text-orange-700", bgLight: "bg-orange-50", border: "border-orange-200", remark: "औसत (Average)", students: [] },
      D: { key: "D", label: "D (33-40%)", count: 0, color: "bg-yellow-500", text: "text-yellow-700", bgLight: "bg-yellow-50", border: "border-yellow-200", remark: "उत्तीर्ण (Marginal Pass)", students: [] },
      E: { key: "E", label: "E (<33%)", count: 0, color: "bg-rose-500", text: "text-rose-700", bgLight: "bg-rose-50", border: "border-rose-200", remark: "पुनः प्रयास आवश्यक", students: [] }
    };

    allStudents.forEach((st) => {
      let g = st.grade;
      if (!g) {
        const pct = st.accuracy || 0;
        g = pct >= 91 ? "A1" : pct >= 81 ? "A2" : pct >= 71 ? "B1" : pct >= 61 ? "B2" : pct >= 51 ? "C1" : pct >= 41 ? "C2" : pct >= 33 ? "D" : "E";
      }
      if (gradeBuckets[g]) {
        gradeBuckets[g].count++;
        gradeBuckets[g].students.push(st);
      }
    });

    // 2. Discipline / Malpractice Integrity Distribution
    let cleanCount = 0; // 0 tab switches
    let minorAlertsCount = 0; // 1-2 tab switches
    let criticalAlertsCount = 0; // 3+ tab switches

    allStudents.forEach((st) => {
      const sw = st.tabSwitches || 0;
      if (sw === 0) cleanCount++;
      else if (sw <= 2) minorAlertsCount++;
      else criticalAlertsCount++;
    });

    // 3. Question Performance Comparative Bars
    const questionPerformance = questions.map((q, idx) => {
      const correctOpt = (q.correctAnswer || "A").trim().toUpperCase();
      let correct = 0;
      let wrong = 0;
      let skipped = 0;

      allStudents.forEach((st) => {
        const sub = submissions.find((s) => s.userId === st.userId);
        const eq = sub?.evaluatedQuestions?.[idx];
        if (eq) {
          if (eq.status === "SKIPPED") skipped++;
          else if (eq.isCorrect) correct++;
          else wrong++;
        } else {
          const ans = st.answers?.[idx] || (st.detailedAnswers && st.detailedAnswers[idx]?.selectedOption) || null;
          if (!ans || ans === "SKIP") {
            skipped++;
          } else if (ans.toString().trim().toUpperCase() === correctOpt) {
            correct++;
          } else {
            wrong++;
          }
        }
      });

      const totalAttempts = correct + wrong + skipped;
      const correctPct = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;
      const wrongPct = totalAttempts > 0 ? Math.round((wrong / totalAttempts) * 100) : 0;
      const skippedPct = totalAttempts > 0 ? Math.round((skipped / totalAttempts) * 100) : 100;

      return {
        qIndex: idx + 1,
        questionText: q.questionText || `प्रश्न ${idx + 1}`,
        correct,
        wrong,
        skipped,
        correctPct,
        wrongPct,
        skippedPct,
        totalAttempts
      };
    });

    // 4. Score distribution & summary
    const scores = allStudents.map((s) => s.score || 0).sort((a, b) => a - b);
    const highestScore = scores.length > 0 ? scores[scores.length - 1] : 0;
    const lowestScore = scores.length > 0 ? scores[0] : 0;
    const avgScoreVal = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "0.0";
    const passCount = allStudents.filter((s) => (s.accuracy || 0) >= 33).length;
    const passRate = allStudents.length > 0 ? Math.round((passCount / allStudents.length) * 100) : 0;

    return {
      gradeBuckets,
      cleanCount,
      minorAlertsCount,
      criticalAlertsCount,
      questionPerformance,
      highestScore,
      lowestScore,
      avgScoreVal,
      passRate,
      passCount
    };
  }, [testData, studentList, submissionsList]);

  // High-Level Aggregate Metrics
  const totalStudents = studentList.length;
  const totalSubmitted = studentList.filter((s) => s.isSubmitted).length;
  const totalViolations = studentList.reduce((acc, s) => acc + (s.tabSwitches || 0), 0);
  const avgScore = totalStudents > 0
    ? (studentList.reduce((acc, s) => acc + (s.score || 0), 0) / totalStudents).toFixed(1)
    : 0;

  // 🔍 Authoritatively Resolve Inspected Student's Answers & Scoring
  const resolvedInspectedAnswers = useMemo(() => {
    if (!inspectedStudent) return [];
    const masterQuestions = testData?.questions || [];

    if (inspectedStudent.detailedAnswers && inspectedStudent.detailedAnswers.length > 0) {
      return inspectedStudent.detailedAnswers.map((ans, aIdx) => {
        const qMaster = masterQuestions[aIdx];
        const resolvedCorrect = ans.correctAnswer || qMaster?.correctAnswer || "A";
        const correctOptIdx = ["A", "B", "C", "D"].indexOf(resolvedCorrect);
        const correctText = ans.correctAnswerText || (correctOptIdx >= 0 && qMaster?.options ? qMaster.options[correctOptIdx] : "");

        const studentOpt = ans.selectedOption || ans.studentAnswer;
        const studentOptIdx = studentOpt ? ["A", "B", "C", "D"].indexOf(studentOpt) : -1;
        const studentText = ans.selectedOptionText || (studentOptIdx >= 0 && qMaster?.options ? qMaster.options[studentOptIdx] : "");

        const isAttempted = Boolean(ans.isAttempted ?? (studentOpt && studentOpt !== "SKIP"));
        const isCorrect = isAttempted && (
          ans.isCorrect ?? (
            resolvedCorrect && studentOpt ? (
              studentOpt.trim().toUpperCase() === resolvedCorrect.trim().toUpperCase() ||
              (studentText && correctText && studentText.trim() === correctText.trim())
            ) : false
          )
        );

        return {
          ...ans,
          questionText: ans.questionText || qMaster?.questionText || `Question ${aIdx + 1}`,
          options: ans.options?.length ? ans.options : (qMaster?.options || []),
          correctAnswer: resolvedCorrect,
          correctAnswerText: correctText,
          selectedOption: studentOpt,
          selectedOptionText: studentText,
          isAttempted,
          isCorrect,
          explanation: ans.explanation || qMaster?.explanation || null
        };
      });
    }

    if (inspectedStudent.answers && Object.keys(inspectedStudent.answers).length > 0 && masterQuestions.length > 0) {
      return masterQuestions.map((qMaster, aIdx) => {
        const studentOpt = inspectedStudent.answers[aIdx] || inspectedStudent.answers[qMaster.id] || null;
        const resolvedCorrect = qMaster.correctAnswer || "A";
        const correctOptIdx = ["A", "B", "C", "D"].indexOf(resolvedCorrect);
        const correctText = correctOptIdx >= 0 && qMaster?.options ? qMaster.options[correctOptIdx] : "";

        const studentOptIdx = studentOpt ? ["A", "B", "C", "D"].indexOf(studentOpt) : -1;
        const studentText = studentOptIdx >= 0 && qMaster?.options ? qMaster.options[studentOptIdx] : "";

        const isAttempted = Boolean(studentOpt && studentOpt !== "SKIP");
        const isCorrect = isAttempted && (
          studentOpt.trim().toUpperCase() === resolvedCorrect.trim().toUpperCase() ||
          (studentText && correctText && studentText.trim() === correctText.trim())
        );

        return {
          questionText: qMaster.questionText || `Question ${aIdx + 1}`,
          options: qMaster.options || [],
          correctAnswer: resolvedCorrect,
          correctAnswerText: correctText,
          selectedOption: studentOpt,
          selectedOptionText: studentText,
          isAttempted,
          isCorrect,
          explanation: qMaster.explanation || null
        };
      });
    }

    return [];
  }, [inspectedStudent, testData]);

  const resolvedCorrectCount = useMemo(() => {
    if (resolvedInspectedAnswers.length > 0) {
      return resolvedInspectedAnswers.filter((a) => a.isCorrect).length;
    }
    return inspectedStudent?.correctCount || 0;
  }, [resolvedInspectedAnswers, inspectedStudent]);

  const resolvedWrongCount = useMemo(() => {
    if (resolvedInspectedAnswers.length > 0) {
      return resolvedInspectedAnswers.filter((a) => a.isAttempted && !a.isCorrect).length;
    }
    return inspectedStudent?.wrongCount || 0;
  }, [resolvedInspectedAnswers, inspectedStudent]);

  const resolvedUnattemptedCount = useMemo(() => {
    if (resolvedInspectedAnswers.length > 0) {
      return resolvedInspectedAnswers.filter((a) => !a.isAttempted).length;
    }
    return inspectedStudent?.unattemptedCount || 0;
  }, [resolvedInspectedAnswers, inspectedStudent]);

  // ⏸️ Individual Student Pause / Resume Handler
  const handleTogglePauseStudent = (student) => {
    const nextPaused = !student.isIndividualPaused;
    if (sendAction) {
      sendAction("PAUSE_STUDENT", { userId: student.userId, isPaused: nextPaused });
    } else if (socket) {
      socket.emit("HOST_ACTION", {
        sessionId: testCode,
        action: "PAUSE_STUDENT",
        payload: { userId: student.userId, isPaused: nextPaused }
      });
    }

    if (inspectedStudent?.userId === student.userId) {
      setInspectedStudent((prev) => (prev ? { ...prev, isIndividualPaused: nextPaused } : null));
    }

    toast.success(
      nextPaused
        ? `⏸️ ${student.userName} की परीक्षा अस्थायी रूप से रोक दी गई!`
        : `▶️ ${student.userName} की परीक्षा पुनः शुरू कर दी गई!`
    );
  };

  // 🚫 Individual Student Kick Handler
  const handleKickStudent = (student) => {
    const confirmed = window.confirm(
      `⚠️ क्या आप निश्चित हैं कि आप ${student.userName} (${student.rollNumber}) को परीक्षा से निष्कासित (Kick) करना चाहते हैं?\n\nछात्र की परीक्षा तुरंत समाप्त हो जाएगी।`
    );
    if (!confirmed) return;

    if (sendAction) {
      sendAction("KICK_PARTICIPANT", { userId: student.userId, userName: student.userName });
    } else if (socket) {
      socket.emit("HOST_ACTION", {
        sessionId: testCode,
        action: "KICK_PARTICIPANT",
        payload: { userId: student.userId, userName: student.userName }
      });
    }

    if (inspectedStudent?.userId === student.userId) {
      setInspectedStudent(null);
    }
    toast.error(`🚫 ${student.userName} को परीक्षा से निष्कासित कर दिया गया।`);
  };

  // 📢 Broadcast Handler (1 to Many)
  const handleSendBroadcast = (e) => {
    if (e) e.preventDefault();
    if (!broadcastText.trim()) return;
    if (socket) {
      socket.emit("SEND_BROADCAST", {
        sessionId: testCode,
        text: broadcastText.trim()
      });
      toast.success("सभी छात्रों की स्क्रीन पर निर्देश प्रसारित किया गया! 📢");
      setBroadcastText("");
      setBroadcastFeedback(true);
      setTimeout(() => setBroadcastFeedback(false), 4000);
    }
  };

  const handleQuickPreset = (presetText) => {
    setBroadcastText(presetText);
  };

  // 💬 1-to-1 Direct Chat Handlers
  const handleOpenChatWithStudent = (student) => {
    setSelectedChatStudentId(student.userId);
    setActiveView("CHAT");
    // Clear unread badge
    setUnreadDMs((prev) => ({
      ...prev,
      [student.userId]: 0
    }));
  };

  const handleSendDirectMessage = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !selectedChatStudentId || !socket) return;

    socket.emit("SEND_DIRECT_MESSAGE", {
      sessionId: testCode,
      fromUserId: "HOST",
      fromUserName: session?.userName || "Teacher / Examiner",
      toUserId: selectedChatStudentId,
      text: chatInput.trim(),
      role: "HOST"
    });

    setChatInput("");
  };

  const selectedStudentChatList = useMemo(() => {
    if (!selectedChatStudentId) return [];
    return directMessages.filter(
      (m) =>
        (m.fromUserId === selectedChatStudentId && (m.toUserId === "HOST" || m.toUserId === "all_teachers")) ||
        (m.fromUserId === "HOST" && m.toUserId === selectedChatStudentId)
    );
  }, [directMessages, selectedChatStudentId]);

  const activeChatStudent = useMemo(() => {
    return studentList.find((s) => s.userId === selectedChatStudentId);
  }, [studentList, selectedChatStudentId]);

  // 🎓 Gatekeeper Handlers: Approve / Deny Guest Students
  const handleApproveGuest = (student) => {
    if (sendAction) {
      sendAction("APPROVE_GUEST", { userId: student.userId });
    } else if (socket) {
      socket.emit("HOST_ACTION", {
        sessionId: testCode,
        action: "APPROVE_GUEST",
        payload: { userId: student.userId }
      });
    }
    setPendingList((prev) => prev.filter((p) => p.userId !== student.userId));
    toast.success(`✓ ${student.userName} को परीक्षा में प्रवेश दिया गया!`);
  };

  const handleDenyGuest = (student) => {
    if (sendAction) {
      sendAction("DENY_GUEST", { userId: student.userId });
    } else if (socket) {
      socket.emit("HOST_ACTION", {
        sessionId: testCode,
        action: "DENY_GUEST",
        payload: { userId: student.userId }
      });
    }
    setPendingList((prev) => prev.filter((p) => p.userId !== student.userId));
    toast.error(`✕ ${student.userName} का प्रवेश अस्वीकार किया गया।`);
  };

  const handleApproveAllGuests = () => {
    if (pendingList.length === 0) return;
    if (sendAction) {
      sendAction("APPROVE_ALL_GUESTS", {});
    } else if (socket) {
      socket.emit("HOST_ACTION", {
        sessionId: testCode,
        action: "APPROVE_ALL_GUESTS",
        payload: {}
      });
    }
    const count = pendingList.length;
    setPendingList([]);
    toast.success(`✓ सभी ${count} छात्रों को प्रवेश दे दिया गया!`);
  };

  // 📞 WebRTC Audio Call with Student
  const startAudioCall = async (student) => {
    try {
      pendingCandidatesRef.current = [];
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" }
        ]
      });
      peerConnectionRef.current = pc;

      // Acquire microphone
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localAudioStreamRef.current = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      } catch (micErr) {
        console.warn("Teacher microphone not available:", micErr);
        toast.error("माइक्रोफ़ोन अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में माइक की अनुमति दें।");
      }

      // Handle incoming remote audio
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const audioElem = document.getElementById("proctor_remote_audio");
          if (audioElem) {
            audioElem.srcObject = event.streams[0];
            audioElem.play().catch((playErr) => {
              console.warn("Remote audio play blocked:", playErr);
            });
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("PROCTOR_WEBRTC_SIGNAL", {
            sessionId: testCode,
            toUserId: student.userId,
            fromUserId: "HOST",
            fromUserName: session?.userName || "Teacher",
            signal: { candidate: event.candidate },
            type: "ICE_CANDIDATE"
          });
        }
      };

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);

      if (socket) {
        socket.emit("PROCTOR_WEBRTC_SIGNAL", {
          sessionId: testCode,
          toUserId: student.userId,
          fromUserId: "HOST",
          fromUserName: session?.userName || "Teacher",
          signal: { sdp: offer },
          type: "CALL_INITIATE"
        });
      }

      setActiveCall({
        userId: student.userId,
        userName: student.userName,
        rollNumber: student.rollNumber,
        isMuted: false,
        status: "CALLING"
      });
      toast.success(`${student.userName} को ऑडियो कॉल मिलाई जा रही है... 📞`);
    } catch (err) {
      console.error("Audio call error:", err);
      toast.error("ऑडियो कॉल स्थापित करने में समस्या हुई।");
    }
  };

  const endAudioCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getTracks().forEach((t) => t.stop());
      localAudioStreamRef.current = null;
    }
    if (activeCall && socket) {
      socket.emit("PROCTOR_WEBRTC_SIGNAL", {
        sessionId: testCode,
        toUserId: activeCall.userId,
        fromUserId: "HOST",
        signal: { type: "HANGUP" },
        type: "CALL_ENDED"
      });
    }
    setActiveCall(null);
    toast("ऑडियो कॉल समाप्त हुई।", { icon: "📴" });
  };

  const toggleCallMute = () => {
    if (localAudioStreamRef.current) {
      const audioTrack = localAudioStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setActiveCall((prev) => (prev ? { ...prev, isMuted: !audioTrack.enabled } : null));
      }
    }
  };

  const totalQuestionsCount = testData?.questionsCount || testData?.questions?.length || 20;
  const totalUnreadCount = Object.values(unreadDMs).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-4 sm:space-y-5 pb-20 text-slate-800 px-2 sm:px-4">
      {/* Hidden audio element for WebRTC audio playback */}
      <audio id="proctor_remote_audio" autoPlay className="hidden" />

      {/* 📞 FLOATING ACTIVE AUDIO CALL CONTROLS */}
      {activeCall && (
        <div className="fixed top-4 right-4 z-[999999] bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-indigo-500/50 flex items-center gap-3 animate-in slide-in-from-top-4">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-xs">
            <p className="font-bold">
              {activeCall.status === "CONNECTED" ? "🎙️ ऑडियो कॉल जारी है" : "📞 कॉल मिलाई जा रही है..."}
            </p>
            <p className="text-[11px] text-slate-300">
              {activeCall.userName} ({activeCall.rollNumber})
            </p>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={toggleCallMute}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCall.isMuted ? "bg-amber-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-white"
              }`}
              title={activeCall.isMuted ? "अनम्यूट करें" : "म्यूट करें"}
            >
              {activeCall.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={endAudioCall}
              className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              title="कॉल काटें"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>कॉल समाप्त</span>
            </button>
          </div>
        </div>
      )}

      {/* 🏛️ MODERN STICKY TOP APP BAR (Back, Title, Grouped Sharing, Timer, Controls & Settings Gear) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs -mx-2 sm:-mx-4 -mt-4 sm:-mt-5 px-3 sm:px-6 py-2.5 sm:py-3 mb-4 transition-all">
        <div className="flex items-center justify-between gap-3 max-w-[1700px] mx-auto">
          {/* LEFT: Back Button + Clean Test Title Branding */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  if (window.confirm("क्या आप डैशबोर्ड पर वापस जाना चाहते हैं? (सत्र पृष्ठभूमि में सक्रिय रहेगा)")) {
                    window.location.href = "/institute/create-test";
                  }
                }
              }}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200/80 shadow-2xs shrink-0"
              title="डैशबोर्ड पर वापस जाएं"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline">डैशबोर्ड</span>
            </button>

            <div className="h-6 w-px bg-slate-200 shrink-0 hidden sm:block" />

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xs sm:text-base font-black text-slate-900 truncate tracking-tight">
                  {testData?.testTitle || testData?.title || "Live Examination"}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>लाइव</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      const studentUrl = `${window.location.origin}/live/${testCode}?role=student&b2b=true`;
                      navigator.clipboard.writeText(studentUrl);
                      toast.success("सत्र लिंक कॉपी हो गई! 📋");
                    }
                  }}
                  className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-bold border border-slate-200 transition-all cursor-pointer"
                  title="सत्र कोड कॉपी करें"
                >
                  <span>CODE: {testCode}</span>
                  <Copy className="w-3 h-3 text-slate-500" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold truncate hidden sm:block">
                🏫 {testData?.instituteName || "Premier Coaching"} {testData?.batchName ? `• 🎓 ${testData.batchName}` : ""} {testData?.subject ? `• 📖 ${testData.subject}` : ""}
              </p>
            </div>
          </div>

          {/* RIGHT: Quick Sharing, Timer, Master Controls & Settings Gear */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Grouped Sharing Buttons */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const studentUrl = `${window.location.origin}/live/${testCode}?role=student&b2b=true`;
                    navigator.clipboard.writeText(studentUrl);
                    toast.success("छात्र परीक्षा लिंक कॉपी हो गई! 📋");
                  }
                }}
                className="px-2.5 py-1 rounded-lg hover:bg-white text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="छात्रों के लिए परीक्षा लिंक कॉपी करें"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>छात्र लिंक</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `📢 *लाइव परीक्षा सूचना*\n\nविषय: ${testData?.testTitle || 'लाइव परीक्षा'}\nकोड: ${testCode}\n\n👉 छात्र सीधे नीचे दिए गए लिंक पर क्लिक करके परीक्षा शुरू करें:\n${typeof window !== 'undefined' ? window.location.origin : ''}/live/${testCode}?role=student&b2b=true`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg hover:bg-white text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="व्हाट्सएप पर शेयर करें"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Countdown Timer Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-amber-50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-200 text-amber-900 font-bold text-xs sm:text-sm shadow-2xs">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
              <span className="font-mono font-black tabular-nums">{formatTimer(timeRemaining)}</span>
            </div>

            {/* Pause / Resume Button */}
            <button
              type="button"
              onClick={() => {
                sendAction(session?.isPaused ? "RESUME_SESSION" : "PAUSE_SESSION", {
                  isPaused: !session?.isPaused
                });
              }}
              className={`h-9 px-2.5 sm:px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                session?.isPaused
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
              }`}
              title={session?.isPaused ? "परीक्षा जारी रखें" : "पूरी परीक्षा रोकें"}
            >
              {session?.isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{session?.isPaused ? "जारी रखें" : "रोकें"}</span>
            </button>

            {/* Conclude Exam Button */}
            <button
              type="button"
              onClick={() => setShowTerminateModal(true)}
              className="h-9 px-2.5 sm:px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shadow-rose-600/20"
              title="परीक्षा समाप्त करके लेजर देखें"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">समाप्त</span>
            </button>

            {/* ⚙️ SETTINGS GEAR BUTTON */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs relative"
              title="परीक्षा नियंत्रण व सेटिंग्स (Settings)"
            >
              <Settings className="w-4 h-4" />
              {!soundEnabled && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 🚀 EXAMINER LIVE COCKPIT OVERVIEW CARD */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden space-y-4">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

        {/* Clean Context Ribbon & Quick Analytics Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-indigo-600/20 shrink-0">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {testData?.instituteName || "Premier Coaching"}
                </span>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  {testData?.batchName || "Regular Batch"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                विषय: <span className="font-bold text-slate-700">{testData?.subject || "General Paper"}</span> • कुल प्रश्न: <span className="font-mono font-bold text-slate-900">{totalQuestionsCount}</span> • प्रति प्रश्न: {testData?.marksCorrect || 4} अंक (नेगेटिव: {testData?.marksNegative || 0})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveView((prev) => (prev === "ANALYTICS" ? "ROSTER" : "ANALYTICS"))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                activeView === "ANALYTICS"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>{activeView === "ANALYTICS" ? "📋 रोस्टर देखें" : "📊 एनालिटिक्स ग्राफ"}</span>
            </button>
          </div>
        </div>

        {/* 📊 COMPACT STATISTIC CARDS (88-100px HEIGHT, NEUTRAL SAAS DESIGN) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-3 border-t border-slate-100">
          {/* Card 1: Attendance */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:border-indigo-200 transition-all flex flex-col justify-between min-h-[92px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">उपस्थित छात्र</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-0.5">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {totalStudents < 10 ? `0${totalStudents}` : totalStudents}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">कुल उपस्थित</span>
          </div>

          {/* Card 2: Submissions */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:border-emerald-200 transition-all flex flex-col justify-between min-h-[92px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">जमा किए गए</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-0.5">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {totalSubmitted} / {totalStudents}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">सबमिशन स्थिति</span>
          </div>

          {/* Card 3: Average Score */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:border-amber-200 transition-all flex flex-col justify-between min-h-[92px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">औसत अंक</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-0.5">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {avgScore}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">वर्तमान स्कोर</span>
          </div>

          {/* Card 4: Total Alerts (Clickable Filter) */}
          <button
            type="button"
            onClick={() => {
              setFilterViolationsOnly((prev) => !prev);
              setActiveView("ROSTER");
            }}
            className={`text-left rounded-2xl p-3 sm:p-3.5 shadow-2xs transition-all flex flex-col justify-between min-h-[92px] cursor-pointer border ${
              filterViolationsOnly
                ? "bg-rose-50 border-rose-300 ring-2 ring-rose-200"
                : "bg-white border-slate-200/90 hover:border-rose-300"
            }`}
            title="क्लिक करके उल्लंघन वाले छात्रों को फ़िल्टर करें"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">कुल अलर्ट</span>
                {filterViolationsOnly && (
                  <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-bold uppercase">
                    सक्रिय
                  </span>
                )}
              </div>
              <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-0.5">
              <span className={`text-2xl font-black tracking-tight font-mono ${totalViolations > 0 ? "text-rose-600" : "text-slate-900"}`}>
                {totalViolations}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {totalViolations > 0 ? "समीक्षा आवश्यक (क्लिक करें)" : "सभी सुरक्षित"}
            </span>
          </button>
        </div>

        {/* 📱 NAVIGATION TABS (SUPER MOBILE-FRIENDLY) */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pt-3 border-t border-slate-100 pb-1">
          <button
            onClick={() => setActiveView("ROSTER")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeView === "ROSTER"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>छात्र रजिस्टर ({totalStudents})</span>
          </button>

          <button
            onClick={() => setActiveView("ANALYTICS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeView === "ANALYTICS"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>📊 एनालिटिक्स व ग्राफ (Analytics)</span>
          </button>

          <button
            onClick={() => setActiveView("MASTER_REPORT")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeView === "MASTER_REPORT"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>मास्टर समरी रिपोर्ट ({totalSubmitted} जमा)</span>
          </button>

          <button
            onClick={() => setActiveView("PROCTOR")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer relative ${
              activeView === "PROCTOR"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>प्रॉक्टर विज़न (Live Cameras)</span>
            {Object.keys(proctorFrames).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveView("CHAT");
              if (!selectedChatStudentId && studentList.length > 0) {
                setSelectedChatStudentId(studentList[0].userId);
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer relative ${
              activeView === "CHAT"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>1-to-1 चैट</span>
            {totalUnreadCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] rounded-full font-black animate-pulse">
                {totalUnreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView("INCIDENTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeView === "INCIDENTS"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>अलर्ट्स ({incidents.length})</span>
          </button>

          <button
            onClick={() => setActiveView("HEATMAP")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeView === "HEATMAP"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
            }`}
          >
            <span>🔥 प्रश्न हीटमैप (Heatmap)</span>
          </button>
        </div>
      </div>

      {/* 🔔 LATEST SUBMISSION PROMINENT REAL-TIME ALERT BANNER */}
      {latestSubmissionAlert && (
        <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-indigo-500/20 border-2 border-emerald-500 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
              🏁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                  नया सबमिशन प्राप्त हुआ (New Submission)
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-bold">{latestSubmissionAlert.timestamp}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                {latestSubmissionAlert.userName}{" "}
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  रोल: {latestSubmissionAlert.rollNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span>🏆 स्कोर: <strong className="text-emerald-700 font-mono font-bold">{latestSubmissionAlert.totalScore} अंक</strong> ({latestSubmissionAlert.accuracy || 0}%)</span>
                <span>⏱️ लिया समय: <strong className="text-slate-800 font-mono font-bold">{formatDurationHindi(latestSubmissionAlert.timeTakenSeconds)}</strong></span>
                <span>🖥️ स्क्रीन बदली: <strong className={`font-mono font-bold ${latestSubmissionAlert.tabSwitches > 0 ? "text-rose-600" : "text-emerald-600"}`}>{latestSubmissionAlert.tabSwitches || 0} बार</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => {
                const st = studentList.find((s) => s.userId === latestSubmissionAlert.userId) || latestSubmissionAlert;
                setInspectedStudent(st);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📄 विस्तृत रिपोर्ट देखें</span>
            </button>

            <button
              onClick={() => setLatestSubmissionAlert(null)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs cursor-pointer transition-all"
              title="अलर्ट बंद करें"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 🔔 PENDING STUDENT APPROVALS BANNER (Admission Gatekeeper) */}
      {pendingList.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-indigo-500/15 border-2 border-amber-400/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-md space-y-3 animate-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <h3 className="font-black text-sm sm:text-base text-amber-950">
                🔔 नए छात्र प्रवेश अनुरोध ({pendingList.length} छात्र प्रतीक्षारत)
              </h3>
            </div>
            <button
              type="button"
              onClick={handleApproveAllGuests}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ सभी को प्रवेश दें ({pendingList.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto custom-scrollbar pt-1">
            {pendingList.map((guest) => (
              <div
                key={guest.userId}
                className="bg-white/95 rounded-2xl p-3 border border-amber-200/80 flex items-center justify-between gap-2 shadow-xs"
              >
                <div className="truncate">
                  <p className="font-bold text-xs text-slate-900 truncate">{guest.userName}</p>
                  <p className="text-[10px] font-mono font-bold text-indigo-700">
                    रोल: {guest.rollNumber || "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApproveGuest(guest)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                    title="प्रवेश दें"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>प्रवेश दें</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDenyGuest(guest)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] flex items-center justify-center cursor-pointer transition-all border border-rose-200"
                    title="अस्वीकार करें"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 1: 📋 STUDENT ATTENDANCE & EXAMINATION MATRIX */}
      {/* ============================================================== */}
      {activeView === "ROSTER" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT 2 COLUMNS: ROSTER */}
          <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
            {/* Controls: Search, Filter, Count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>उपस्थिति व लाइव स्थिति (Examinees)</span>
                <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {filteredStudents.length} Students
                </span>
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="छात्र / रोल नंबर खोजें..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-52 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white outline-none font-medium transition-all"
                  />
                </div>

                <button
                  onClick={() => setFilterViolationsOnly((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    filterViolationsOnly
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>उल्लंघन ({totalViolations})</span>
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
                {/* 📱 MOBILE RESPONSIVE CARDS (< 768px) */}
                <div className="block md:hidden space-y-3">
                  {filteredStudents.map((s) => {
                    const progressPercent = Math.min(
                      100,
                      Math.round(((s.currentIndex + 1) / totalQuestionsCount) * 100)
                    );

                    return (
                      <div
                        key={s.userId}
                        className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                          s.isIndividualPaused
                            ? "bg-amber-50/70 border-amber-300"
                            : s.tabSwitches > 0
                            ? "bg-rose-50/50 border-rose-200"
                            : "bg-slate-50/60 border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${s.isSubmitted ? "bg-emerald-500" : s.status === "AWAY" ? "bg-amber-400" : "bg-emerald-500 animate-pulse"}`} />
                              <h3 className="font-bold text-sm text-slate-900">{s.userName}</h3>
                              {s.isIndividualPaused && (
                                <span className="text-[10px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded">
                                  ⏸️ रोका गया
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                                रोल: {s.rollNumber || "N/A"}
                              </span>
                              {s.studentClass && (
                                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block border border-slate-200">
                                  कक्षा: {s.studentClass}
                                </span>
                              )}
                              {s.grade && (
                                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block border border-emerald-200">
                                  ग्रेड: {s.grade}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-base font-mono font-black ${s.score > 0 ? "text-emerald-700" : s.score < 0 ? "text-rose-700" : "text-slate-700"}`}>
                              {s.score > 0 ? `+${s.score}` : s.score} अंक
                            </span>
                            <div className="text-[10px] text-slate-400">स्कोर</div>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                            <span>प्रश्न {s.currentIndex + 1} / {totalQuestionsCount}</span>
                            <span className="font-mono text-slate-500">{progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${s.isSubmitted ? "bg-emerald-500" : "bg-indigo-600"}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Toolbar on Mobile: Pause/Kick/Chat/Inspect/WhatsApp */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setInspectedStudent(s);
                              if (onInspectStudent) onInspectStudent(s);
                            }}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>स्क्रीन</span>
                          </button>

                          <button
                            onClick={() => handleOpenChatWithStudent(s)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer relative"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>चैट</span>
                            {unreadDMs[s.userId] > 0 && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            )}
                          </button>

                          {/* Quick Call Button */}
                          <button
                            onClick={() => startAudioCall(s)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="ऑडियो कॉल करें"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>कॉल</span>
                          </button>

                          {/* 📲 WhatsApp Parent Live Share */}
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                              `📢 *परीक्षा लाइव रिपोर्ट (अभिभावक सूचना)*\n\n` +
                              `👤 छात्र: ${s.userName}\n` +
                              `🏷️ रोल: ${s.rollNumber || "N/A"}\n` +
                              (s.studentClass ? `🏫 कक्षा / बैच: ${s.studentClass}\n` : "") +
                              `📝 परीक्षा: ${testData?.testTitle || 'लाइव परीक्षा'}\n` +
                              `📊 स्थिति: ${s.isSubmitted ? "परीक्षा पूर्ण व जमा" : "वर्तमान में परीक्षा दे रहे हैं"}\n` +
                              `🎯 वर्तमान स्कोर: ${s.score || 0} अंक\n` +
                              `⚠️ सुरक्षा स्थिति: ${s.tabSwitches > 0 ? `चेतावनी (${s.tabSwitches} बार स्क्रीन बदली)` : "100% अनुशासित"}\n\n` +
                              `_शिक्षक / परीक्षा केंद्र द्वारा सीधे प्रेषित।_`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer border border-emerald-200"
                            title="अभिभावक को व्हाट्सएप पर लाइव स्थिति भेजें"
                          >
                            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>अभिभावक</span>
                          </a>

                          {/* Pause / Resume Button */}
                          <button
                            onClick={() => handleTogglePauseStudent(s)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              s.isIndividualPaused
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            }`}
                            title={s.isIndividualPaused ? "पुनः शुरू करें" : "परीक्षा रोकें"}
                          >
                            {s.isIndividualPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                            <span>{s.isIndividualPaused ? "शुरू" : "रोकें"}</span>
                          </button>

                          {/* Kick Button */}
                          <button
                            onClick={() => handleKickStudent(s)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="परीक्षा से निष्कासित करें"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>किक</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 🖥️ DESKTOP RICH TABLE (>= 768px) */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full text-left text-xs min-w-[620px]">
                    <thead className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className={`${tableDensity === "compact" ? "py-1.5" : "py-2.5"} px-3.5 w-[26%]`}>छात्र विवरण</th>
                        <th className={`${tableDensity === "compact" ? "py-1.5" : "py-2.5"} px-2.5 w-[22%]`}>प्रगति</th>
                        <th className={`${tableDensity === "compact" ? "py-1.5" : "py-2.5"} px-2 text-center w-[10%]`}>अंक</th>
                        <th className={`${tableDensity === "compact" ? "py-1.5" : "py-2.5"} px-2 text-center w-[12%]`}>अलर्ट</th>
                        <th className={`${tableDensity === "compact" ? "py-1.5" : "py-2.5"} px-2 text-center w-[12%]`}>स्थिति</th>
                        <th className={`${tableDensity === "compact" ? "py-1.5" : "py-2.5"} px-3 text-right w-[18%]`}>कार्रवाई</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((s) => {
                        const progressPercent = Math.min(
                          100,
                          Math.round(((s.currentIndex + 1) / totalQuestionsCount) * 100)
                        );
                        const cellPy = tableDensity === "compact" ? "py-1.5" : "py-2.5";

                        return (
                          <tr
                            key={s.userId}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              s.isIndividualPaused
                                ? "bg-amber-50/50"
                                : s.tabSwitches > 0
                                ? "bg-rose-50/30"
                                : ""
                            }`}
                          >
                            <td className={`${cellPy} px-3.5`}>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${s.isSubmitted ? "bg-emerald-500" : s.status === "AWAY" ? "bg-amber-400" : "bg-emerald-500 animate-pulse"}`} />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                                    <span>{s.userName}</span>
                                    {s.isIndividualPaused && (
                                      <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.2 rounded">
                                        PAUSED
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                    {s.rollNumber && s.rollNumber !== "N/A" && (
                                      <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                        रोल: {s.rollNumber}
                                      </span>
                                    )}
                                    {s.studentClass && (
                                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                        कक्षा: {s.studentClass}
                                      </span>
                                    )}
                                    {s.grade && (
                                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                        {s.grade}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className={`${cellPy} px-2.5`}>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                  <span className="text-slate-700 font-medium">Q {s.currentIndex + 1} / {totalQuestionsCount}</span>
                                  <span className="text-slate-500 font-bold text-[10px]">{progressPercent}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                  <div
                                    className={`h-full transition-all duration-300 ${s.isSubmitted ? "bg-emerald-500" : "bg-indigo-600"}`}
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className={`${cellPy} px-2 text-center whitespace-nowrap`}>
                              <span className={`font-mono font-black text-sm ${s.score > 0 ? "text-emerald-700" : s.score < 0 ? "text-rose-700" : "text-slate-700"}`}>
                                {s.score > 0 ? `+${s.score}` : s.score}
                              </span>
                            </td>

                            <td className={`${cellPy} px-2 text-center whitespace-nowrap`}>
                              {s.tabSwitches > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setSearchTerm(s.userName)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold font-mono hover:bg-rose-100 cursor-pointer transition-all"
                                  title="इस छात्र के अलर्ट देखने के लिए क्लिक करें"
                                >
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>{s.tabSwitches} अलर्ट</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>सुरक्षित</span>
                                </span>
                              )}
                            </td>

                            <td className={`${cellPy} px-2 text-center whitespace-nowrap`}>
                              {s.isSubmitted ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                  🏁 जमा किया
                                </span>
                              ) : s.status === "AWAY" ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                  🟡 स्क्रीन बाहर
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                                  🟢 सक्रिय
                                </span>
                              )}
                            </td>

                            {/* TEACHER ACTIONS: Compact Icon Toolbar with Tooltips */}
                            <td className={`${cellPy} px-3 text-right whitespace-nowrap`}>
                              <div className="inline-flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                                <button
                                  onClick={() => {
                                    setInspectedStudent(s);
                                    if (onInspectStudent) onInspectStudent(s);
                                  }}
                                  className="p-1.5 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center gap-1 border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs"
                                  title="स्क्रीन व उत्तर पुस्तिका देखें (Inspect)"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline text-[11px]">देखें</span>
                                </button>

                                <button
                                  onClick={() => handleOpenChatWithStudent(s)}
                                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-200 transition-all cursor-pointer relative shadow-2xs"
                                  title="1-to-1 चैट करें"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline text-[11px]">चैट</span>
                                  {unreadDMs[s.userId] > 0 && (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                  )}
                                </button>

                                <button
                                  onClick={() => startAudioCall(s)}
                                  className="p-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                                  title="ऑडियो कॉल करें"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline text-[11px]">कॉल</span>
                                </button>

                                {/* 📲 1-Click WhatsApp Parent Live Update */}
                                <a
                                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                    `📢 *परीक्षा लाइव रिपोर्ट (अभिभावक सूचना)*\n\n` +
                                    `👤 छात्र: ${s.userName}\n` +
                                    `🏷️ रोल: ${s.rollNumber || "N/A"}\n` +
                                    (s.studentClass ? `🏫 कक्षा / बैच: ${s.studentClass}\n` : "") +
                                    `📝 परीक्षा: ${testData?.testTitle || 'लाइव परीक्षा'}\n` +
                                    `📊 स्थिति: ${s.isSubmitted ? "परीक्षा पूर्ण व जमा" : "वर्तमान में परीक्षा दे रहे हैं"}\n` +
                                    `🎯 वर्तमान स्कोर: ${s.score || 0} अंक\n` +
                                    `⚠️ सुरक्षा स्थिति: ${s.tabSwitches > 0 ? `चेतावनी (${s.tabSwitches} बार स्क्रीन बदली)` : "100% अनुशासित"}\n\n` +
                                    `_शिक्षक / परीक्षा केंद्र द्वारा सीधे प्रेषित।_`
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                                  title="अभिभावक को व्हाट्सएप पर लाइव स्थिति भेजें"
                                >
                                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="hidden xl:inline text-[11px]">अभिभावक</span>
                                </a>

                                <button
                                  onClick={() => handleTogglePauseStudent(s)}
                                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border shadow-2xs ${
                                    s.isIndividualPaused
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                                      : "bg-white hover:bg-amber-50 text-amber-700 border-slate-200 hover:border-amber-300"
                                  }`}
                                  title={s.isIndividualPaused ? "परीक्षा पुनः शुरू करें" : "परीक्षा रोकें"}
                                >
                                  {s.isIndividualPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                  <span className="hidden xl:inline text-[11px]">{s.isIndividualPaused ? "शुरू" : "रोकें"}</span>
                                </button>

                                <button
                                  onClick={() => handleKickStudent(s)}
                                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1 border border-slate-200 hover:border-rose-300 shadow-2xs"
                                  title="परीक्षा से निष्कासित करें"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline text-[11px]">किक</span>
                                </button>
                              </div>
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

          {/* RIGHT COLUMN: QUICK BROADCAST & LIVE ACTIVITY FEED */}
          <div className="space-y-4">
            {/* 📢 Live Announcement Box */}
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-slate-900 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider">सामूहिक घोषणा</h3>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  सभी छात्र
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickPreset("10 मिनट शेष हैं! कृपया अपने उत्तरों की समीक्षा करें।")}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-all cursor-pointer"
                >
                  ⏰ 10 मिनट शेष
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset("कृपया टैब स्विच न करें, परीक्षा की निगरानी हो रही है।")}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold transition-all cursor-pointer border border-rose-200"
                >
                  ⚠️ स्क्रीन चेतावनी
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset("शांति बनाए रखें और समय पर सबमिट करें।")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition-all cursor-pointer border border-emerald-200"
                >
                  ✅ शांति बनाए रखें
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSendBroadcast} className="space-y-2">
                <textarea
                  rows={2}
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="सभी छात्रों की स्क्रीन पर तुरंत संदेश भेजें..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white outline-none resize-none font-medium transition-all"
                />

                {/* Delivery Feedback */}
                {broadcastFeedback && (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>✓ संदेश सभी छात्रों को सफलतापूर्वक प्रसारित किया गया!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!broadcastText.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>सभी को प्रसारित करें</span>
                </button>
              </form>
            </div>

            {/* Recent Alert Stream */}
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-slate-900 border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>हालिया उल्लंघन चेतावनी</span>
                </h3>
                <span className="text-[10px] font-bold font-mono text-slate-400">
                  {incidents.length} घटनाएं
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {incidents.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-bold">
                    🛡️ कोई नकल या टैब उल्लंघन नहीं हुआ।
                  </div>
                ) : (
                  incidents.slice(0, 10).map((inc) => (
                    <div
                      key={inc.id}
                      className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-0.5 text-xs"
                    >
                      <div className="flex items-center justify-between text-rose-900 font-bold">
                        <span>{inc.userName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{inc.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        रोल: <strong className="text-indigo-700 font-mono">{inc.rollNumber}</strong> • टैब बदला ({inc.switchCount} बार)
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: 👁️ PROCTOR VISION (LIVE CAMERAS & AUDIO CALLS) */}
      {/* ============================================================== */}
      {activeView === "PROCTOR" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>प्रॉक्टर विज़न: लाइव कैमरा व ऑडियो मॉनिटरिंग</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                छात्रों के वेबकैम स्नैपशॉट वास्तविक समय में यहां दिखाई देते हैं। आप किसी भी छात्र से सीधे ऑडियो कॉल पर बात कर सकते हैं।
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>कैमरा स्ट्रीम सक्रिय: {Object.keys(proctorFrames).length} छात्र</span>
            </div>
          </div>

          {/* Student Camera Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredStudents.map((s) => {
              const frameData = proctorFrames[s.userId];
              const isCallingThisStudent = activeCall?.userId === s.userId;

              return (
                <div
                  key={s.userId}
                  className={`rounded-2xl border overflow-hidden transition-all shadow-xs ${
                    s.isIndividualPaused
                      ? "border-amber-400 bg-amber-50/40"
                      : s.tabSwitches > 0
                      ? "border-rose-300 bg-rose-50/20"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {/* Camera Tile / Snapshot Frame */}
                  <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                    {frameData?.frame ? (
                      <img
                        src={frameData.frame}
                        alt={s.userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 space-y-1.5 text-slate-500">
                        <VideoOff className="w-6 h-6 mx-auto opacity-40 text-slate-400" />
                        <p className="text-[11px] font-bold">कैमरा प्रतीक्षारत...</p>
                      </div>
                    )}

                    {/* Overlay Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${frameData?.frame ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                      <span className="text-[10px] font-mono font-bold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                        {s.rollNumber}
                      </span>
                    </div>

                    {s.tabSwitches > 0 && (
                      <div className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                        ⚠️ {s.tabSwitches} अलर्ट
                      </div>
                    )}

                    {s.isIndividualPaused && (
                      <div className="absolute inset-0 bg-amber-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-black">
                        ⏸️ परीक्षा रोकी गई
                      </div>
                    )}
                  </div>

                  {/* Tile Footer with Student Info & Call Buttons */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 truncate">{s.userName}</h4>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        Q {s.currentIndex + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {isCallingThisStudent ? (
                        <button
                          onClick={endAudioCall}
                          className="col-span-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          <PhoneOff className="w-3.5 h-3.5" />
                          <span>कॉल समाप्त करें</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => startAudioCall(s)}
                          className="py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                          title="इस छात्र से ऑडियो कॉल पर बात करें"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>ऑडियो कॉल</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenChatWithStudent(s)}
                        className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>चैट</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: 💬 1-to-1 DIRECT CHAT (Teacher <-> Student) */}
      {/* ============================================================== */}
      {activeView === "CHAT" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[500px]">
            {/* Student List Selector */}
            <div className="md:col-span-1 border border-slate-200/80 rounded-2xl p-3 space-y-2 bg-slate-50/50">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider px-1">
                छात्र चुनें (Select Student)
              </h3>
              <div className="space-y-1.5 max-h-[460px] overflow-y-auto custom-scrollbar">
                {studentList.map((s) => {
                  const isSelected = s.userId === selectedChatStudentId;
                  const unread = unreadDMs[s.userId] || 0;

                  return (
                    <button
                      key={s.userId}
                      onClick={() => {
                        setSelectedChatStudentId(s.userId);
                        setUnreadDMs((prev) => ({ ...prev, [s.userId]: 0 }));
                      }}
                      className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white font-bold shadow-xs"
                          : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/60"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs font-bold leading-tight truncate">{s.userName}</p>
                        <p className={`text-[10px] font-mono ${isSelected ? "text-indigo-200" : "text-slate-500"}`}>
                          रोल: {s.rollNumber}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shrink-0">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation Window */}
            <div className="md:col-span-2 border border-slate-200/80 rounded-2xl flex flex-col bg-white overflow-hidden">
              {activeChatStudent ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{activeChatStudent.userName}</h4>
                      <p className="text-[11px] text-indigo-700 font-mono font-bold">
                        Roll: {activeChatStudent.rollNumber} • Score: {activeChatStudent.score}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startAudioCall(activeChatStudent)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>ऑडियो कॉल</span>
                      </button>

                      <button
                        onClick={() => handleTogglePauseStudent(activeChatStudent)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeChatStudent.isIndividualPaused
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {activeChatStudent.isIndividualPaused ? "शुरू करें" : "रोकें"}
                      </button>
                    </div>
                  </div>

                  {/* Messages Bubble Stream */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[380px] custom-scrollbar bg-slate-50/30">
                    {selectedStudentChatList.length === 0 ? (
                      <div className="py-16 text-center text-xs text-slate-400 font-bold">
                        💬 इस छात्र के साथ अभी कोई संदेश नहीं है। नीचे से संदेश भेजें।
                      </div>
                    ) : (
                      selectedStudentChatList.map((m) => {
                        const isMe = m.fromUserId === "HOST" || m.role === "HOST";

                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs ${
                                isMe
                                  ? "bg-indigo-600 text-white rounded-br-none shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs"
                              }`}
                            >
                              <p className="font-semibold">{m.text}</p>
                              <span
                                className={`text-[9px] block text-right mt-1 font-mono ${
                                  isMe ? "text-indigo-200" : "text-slate-400"
                                }`}
                              >
                                {new Date(m.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input Box */}
                  <form onSubmit={handleSendDirectMessage} className="p-2.5 bg-slate-100 border-t border-slate-200 flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`${activeChatStudent.userName} को संदेश भेजें...`}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400 text-xs font-bold">
                  👈 बाईं ओर से किसी छात्र को चुनें ताकि उनसे 1-to-1 चैट कर सकें।
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 4: ⚠️ DETAILED INCIDENTS & TAB SWITCH LOG */}
      {/* ============================================================== */}
      {activeView === "INCIDENTS" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>एंटी-चीट टैब स्विच व नकल सतर्कता रजिस्टर</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                जैसे ही कोई छात्र परीक्षा छोड़कर दूसरा टैब या ऐप खोलता है, उसका विस्तृत रिकॉर्ड यहां दर्ज होता है।
              </p>
            </div>
            <span className="text-xs font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-xl">
              कुल {incidents.length} घटनाएं
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
            {incidents.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 font-bold">
                🎉 कोई टैब उल्लंघन नहीं हुआ! सभी छात्र पूरी ईमानदारी से परीक्षा दे रहे हैं।
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black shrink-0">
                      ⚠️
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{inc.userName}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        रोल: <strong className="text-indigo-700 font-mono">{inc.rollNumber}</strong> • टैब बदला ({inc.switchCount} बार)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-[10px] font-mono text-slate-400">{inc.timestamp}</span>
                    <button
                      onClick={() => {
                        const studentObj = studentList.find((s) => s.userId === inc.userId);
                        if (studentObj) handleOpenChatWithStudent(studentObj);
                      }}
                      className="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-50 cursor-pointer"
                    >
                      चेतावनी भेजें
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 5: 📊 MASTER RESULT LEDGER & CLASS SUMMARY VIEW */}
      {/* ============================================================== */}
      {activeView === "MASTER_REPORT" && (
        <div className="space-y-4">
          <B2BMasterResultLedger
            testData={testData}
            participants={studentList}
            submissions={submissionsList}
            onBack={() => setActiveView("ROSTER")}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 6: 🔥 LIVE QUESTION DIFFICULTY HEATMAP & ACCURACY AUDIT */}
      {/* ============================================================== */}
      {activeView === "HEATMAP" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>🔥 लाइव प्रश्न कठिनाई व सटीकता हीटमैप (Question Difficulty Heatmap)</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                देखें किस प्रश्न में छात्रों को सबसे अधिक कठिनाई हो रही है और किन प्रश्नों की सटीकता सबसे कम है।
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                🟢 सरल (&gt;70%)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                🟡 मध्यम (40-70%)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                🔴 कठिन (&lt;40%)
              </span>
            </div>
          </div>

          {/* Question Heatmap Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {questionDifficultyHeatmap.map((item) => {
              const diffBadge =
                item.difficulty === "HARD"
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : item.difficulty === "MEDIUM"
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : item.difficulty === "EASY"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-slate-100 text-slate-600 border-slate-200";

              const diffText =
                item.difficulty === "HARD"
                  ? "कठिन (Low Accuracy)"
                  : item.difficulty === "MEDIUM"
                  ? "मध्यम (Moderate)"
                  : item.difficulty === "EASY"
                  ? "सरल (High Accuracy)"
                  : "प्रतीक्षारत (Pending)";

              return (
                <div
                  key={item.index}
                  className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 space-y-3 hover:border-indigo-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs shadow-2xs">
                      प्रश्न {item.questionNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${diffBadge}`}>
                      {diffText}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed">
                    {item.questionText}
                  </p>

                  {/* Accuracy Bar */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">कक्षा सटीकता:</span>
                      <span className="font-mono text-slate-900">
                        {item.accuracy !== null ? `${item.accuracy}%` : "0% प्रयास"}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          item.difficulty === "HARD"
                            ? "bg-rose-500"
                            : item.difficulty === "MEDIUM"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${item.accuracy || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Attempts breakdown */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block">प्रयास</span>
                      <span className="text-xs font-mono text-slate-800">{item.attemptsCount}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="text-emerald-700 block">सही</span>
                      <span className="text-xs font-mono text-emerald-800">+{item.correctCount}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200">
                      <span className="text-rose-700 block">गलत</span>
                      <span className="text-xs font-mono text-rose-800">-{item.wrongCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW: 📊 COMPREHENSIVE TEACHER ANALYTICS & GRAPH DATA VIEW */}
      {/* ============================================================== */}
      {activeView === "ANALYTICS" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Top KPI Header Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">औसत स्कोर (Avg Score)</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-700">{analyticsData.avgScoreVal}</span>
                <span className="text-xs text-slate-400 font-semibold">अंक</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">कुल {totalStudents} परीक्षार्थियों में</span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">उत्तीर्ण प्रतिशत (Pass Rate)</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600">{analyticsData.passRate}%</span>
                <span className="text-xs text-slate-400 font-semibold">({analyticsData.passCount} पास)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">कटऑफ: 33% उत्तीर्ण मानक</span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">उच्चतम / न्यूनतम अंक</span>
              <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700">{analyticsData.highestScore}</span>
                <span className="text-sm font-bold text-slate-400">/</span>
                <span className="text-lg font-bold text-rose-600">{analyticsData.lowestScore}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">रेंज (Score Spread)</span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">स्क्रीन सुरक्षा दर (Integrity)</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-sky-600">
                  {totalStudents > 0 ? Math.round((analyticsData.cleanCount / totalStudents) * 100) : 100}%
                </span>
                <span className="text-xs text-emerald-700 font-bold">अनुशासित</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">{analyticsData.cleanCount} छात्र 0 टैब स्विच</span>
            </div>
          </div>

          {/* ROW 1: CBSE Grade Distribution Chart & Integrity Donut breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* LEFT 2 COLUMNS: CBSE 8-Level Grade Distribution Visual Bar Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-slate-900">
                      CBSE आधिकारिक ग्रेड वितरण ग्राफ (Letter Grade Distribution)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      अखिल भारतीय बोर्ड ग्रेडिंग स्केल (A1 से E) के अनुसार छात्रों का वर्गीकरण
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {totalStudents} छात्र विश्लेषित
                </span>
              </div>

              {/* Vertical Visual Bars */}
              <div className="pt-2">
                <div className="grid grid-cols-8 gap-2 sm:gap-3 items-end h-52 sm:h-60 pb-3 border-b border-slate-200">
                  {Object.values(analyticsData.gradeBuckets).map((bucket) => {
                    const maxCount = Math.max(...Object.values(analyticsData.gradeBuckets).map((b) => b.count), 1);
                    const barHeightPct = totalStudents > 0 ? Math.max(12, Math.round((bucket.count / maxCount) * 100)) : 12;

                    return (
                      <div key={bucket.key} className="flex flex-col items-center justify-end h-full gap-1.5 group relative">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                          <span>{bucket.label}</span>
                          <span className="text-indigo-300">{bucket.count} छात्र ({totalStudents > 0 ? Math.round((bucket.count / totalStudents) * 100) : 0}%)</span>
                        </div>

                        {/* Student Count on Bar */}
                        <span className="text-[11px] font-black font-mono text-slate-700">
                          {bucket.count > 0 ? bucket.count : ""}
                        </span>

                        {/* Bar Body */}
                        <div className="w-full bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${barHeightPct}%` }}
                            transition={{ duration: 0.5 }}
                            className={`w-full rounded-t-xl ${bucket.color} transition-all relative shadow-xs`}
                          />
                        </div>

                        {/* X-Axis Grade Label */}
                        <span className={`text-xs font-black font-mono ${bucket.text}`}>
                          {bucket.key}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Grade Legend Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                  {Object.values(analyticsData.gradeBuckets).map((bucket) => (
                    <div key={bucket.key} className={`p-2 rounded-xl border ${bucket.border} ${bucket.bgLight} flex items-center justify-between text-xs`}>
                      <div className="truncate">
                        <span className={`font-black font-mono ${bucket.text}`}>{bucket.key}</span>
                        <span className="text-[10px] text-slate-500 font-semibold block truncate">{bucket.remark}</span>
                      </div>
                      <span className="text-xs font-black font-mono text-slate-800 bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200">
                        {bucket.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Anti-Cheat & Proctoring Integrity Health */}
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    परीक्षा अनुशासन स्वास्थ्य (Integrity)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    स्क्रीन/टैब बदलाव का रीयल-टाइम वर्गीकरण
                  </p>
                </div>
              </div>

              {/* Progress Ring / Horizontal Distribution */}
              <div className="space-y-3 pt-1">
                {/* Clean (0 switches) */}
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>पूर्ण अनुशासित (0 उल्लंघन)</span>
                    </span>
                    <span className="font-mono">{analyticsData.cleanCount} छात्र</span>
                  </div>
                  <div className="w-full h-2 bg-emerald-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${totalStudents > 0 ? (analyticsData.cleanCount / totalStudents) * 100 : 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">कोई स्क्रीन विचलन नहीं, 100% अनुपालन</span>
                </div>

                {/* Minor (1-2 switches) */}
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>हल्की चेतावनी (1-2 बार स्क्रीन बदली)</span>
                    </span>
                    <span className="font-mono">{analyticsData.minorAlertsCount} छात्र</span>
                  </div>
                  <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${totalStudents > 0 ? (analyticsData.minorAlertsCount / totalStudents) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium">संभावित नोटिफिकेशन या अनजाने में स्विच</span>
                </div>

                {/* Critical (3+ switches) */}
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <span>गंभीर उल्लंघन (3+ बार स्क्रीन बदली)</span>
                    </span>
                    <span className="font-mono">{analyticsData.criticalAlertsCount} छात्र</span>
                  </div>
                  <div className="w-full h-2 bg-rose-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-600 rounded-full"
                      style={{ width: `${totalStudents > 0 ? (analyticsData.criticalAlertsCount / totalStudents) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-rose-700 font-medium">अनुचित साधनों का संदिग्ध उपयोग (Flagged)</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: Question-by-Question Accuracy Trend Stacked Chart */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    प्रश्न-वार सटीकता व प्रदर्शन तुलना (Question Accuracy Breakdown)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    प्रत्येक प्रश्न पर सही, गलत और छोड़े गए (Skipped) का तुलनात्मक बार ग्राफ
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" />
                  <span>सही (Correct)</span>
                </span>
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-3 h-3 rounded-md bg-rose-500" />
                  <span>गलत (Wrong)</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-md bg-slate-300" />
                  <span>छोड़ा (Skipped)</span>
                </span>
              </div>
            </div>

            {/* Stacked Comparative Bars per Question */}
            <div className="space-y-3.5 pt-2">
              {analyticsData.questionPerformance.map((qp) => (
                <div key={qp.qIndex} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-mono font-bold text-[11px] shrink-0">
                        Q{qp.qIndex}
                      </span>
                      <span className="font-semibold text-slate-800 truncate text-xs">
                        {qp.questionText}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] font-bold">
                      <span className="text-emerald-700">✓ {qp.correct}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-rose-600">✗ {qp.wrong}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">⚪ {qp.skipped}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-900 font-black">
                        {qp.correctPct}% सटीकता
                      </span>
                    </div>
                  </div>

                  {/* Multi-Segment Accuracy Bar */}
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${qp.correctPct}%` }}
                      title={`सही: ${qp.correctPct}%`}
                    />
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${qp.wrongPct}%` }}
                      title={`गलत: ${qp.wrongPct}%`}
                    />
                    <div
                      className="h-full bg-slate-300 transition-all duration-300"
                      style={{ width: `${qp.skippedPct}%` }}
                      title={`छोड़ा: ${qp.skippedPct}%`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 👁️ REAL-TIME TELEMETRY / DOM MIRRORING MODAL (NON-CLIPPING, AUTHORITATIVE RESPONSES) */}
      <AnimatePresence>
        {inspectedStudent && (
          <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl relative text-slate-800 max-h-[88vh] flex flex-col overflow-hidden"
            >
              {/* Sticky Top Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-lg">
                    {inspectedStudent.isSubmitted ? "🏁" : "👁️"}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{inspectedStudent.userName}</h3>
                    <p className="text-xs text-indigo-700 font-mono font-bold">
                      रोल: {inspectedStudent.rollNumber} • कुल अंक: {inspectedStudent.score} ({inspectedStudent.accuracy || 0}%)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setInspectedStudent(null)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer transition-all"
                  title="बंद करें"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body Container */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {/* 🎯 THE 4 CORE INDIVIDUAL METRICS */}
                <div className="bg-gradient-to-br from-indigo-50/60 to-slate-50 rounded-2xl p-3.5 border border-indigo-100 space-y-2.5">
                  <div className="text-[11px] font-black text-indigo-950 uppercase tracking-wider flex items-center justify-between border-b border-indigo-200/60 pb-1.5">
                    <span>📊 छात्र व्यक्तिगत परीक्षा रिपोर्ट (Student Individual Audit)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inspectedStudent.isSubmitted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {inspectedStudent.isSubmitted ? "🏁 परीक्षा जमा की जा चुकी है" : "⏳ परीक्षा अभी जारी है"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Metric 1: Screen Change / Tab Switch Count */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block">🖥️ स्क्रीन बदली (Screen Changes)</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-base font-mono font-black ${inspectedStudent.tabSwitches > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {inspectedStudent.tabSwitches || 0} बार
                        </span>
                        {inspectedStudent.tabSwitches > 0 && (
                          <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded-md">
                            अलर्ट!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metric 2: Total Time Taken */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block">⏱️ कुल लिया गया समय</span>
                      <span className="text-base font-mono font-black text-slate-800 mt-0.5 block">
                        {formatDurationHindi(inspectedStudent.timeTakenSeconds)}
                      </span>
                    </div>

                    {/* Metric 3: Exam Start Time */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block">🚀 परीक्षा शुरू की</span>
                      <span className="text-xs font-mono font-bold text-indigo-700 mt-0.5 block">
                        {formatTimestampFull(inspectedStudent.startedAt)}
                      </span>
                    </div>

                    {/* Metric 4: Exam Submit Time */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block">🏁 परीक्षा जमा की</span>
                      <span className={`text-xs font-mono font-bold mt-0.5 block ${inspectedStudent.isSubmitted ? "text-emerald-700" : "text-amber-700"}`}>
                        {inspectedStudent.isSubmitted ? formatTimestampFull(inspectedStudent.completedAt) : "प्रगति पर है..."}
                      </span>
                    </div>
                  </div>

                  {/* Authoritatively Calculated Score Breakdown Cards */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 font-bold block">✓ सही उत्तर</span>
                      <span className="text-base font-mono font-black text-emerald-900">{resolvedCorrectCount}</span>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                      <span className="text-[10px] text-rose-700 font-bold block">✗ गलत उत्तर</span>
                      <span className="text-base font-mono font-black text-rose-900">{resolvedWrongCount}</span>
                    </div>
                    <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-600 font-bold block">- छोड़ा (Skip)</span>
                      <span className="text-base font-mono font-black text-slate-800">{resolvedUnattemptedCount}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Controls inside modal */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleTogglePauseStudent(inspectedStudent)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs ${
                      inspectedStudent.isIndividualPaused
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                    }`}
                  >
                    {inspectedStudent.isIndividualPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{inspectedStudent.isIndividualPaused ? "पुनः शुरू" : "परीक्षा रोकें"}</span>
                  </button>

                  <button
                    onClick={() => {
                      handleOpenChatWithStudent(inspectedStudent);
                      setInspectedStudent(null);
                    }}
                    className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>चैट करें</span>
                  </button>

                  <button
                    onClick={() => handleKickStudent(inspectedStudent)}
                    className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>किक करें</span>
                  </button>
                </div>

                {/* Camera Preview if available */}
                {proctorFrames[inspectedStudent.userId]?.frame && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video relative shadow-xs">
                    <img
                      src={proctorFrames[inspectedStudent.userId].frame}
                      alt={inspectedStudent.userName}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">
                      🔴 लाइव वेबकैम
                    </span>
                  </div>
                )}

                {/* Detailed Question Responses or Live Active Question */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    <span className="text-slate-700 font-bold">
                      {inspectedStudent.isSubmitted ? "📋 प्रश्नवार छात्र उत्तर पुस्तिका (Response Sheet):" : "वर्तमान सक्रिय प्रश्न:"}
                    </span>
                    <span className="font-bold font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                      {inspectedStudent.isSubmitted
                        ? `कुल ${resolvedInspectedAnswers.length || totalQuestionsCount} प्रश्न`
                        : `Question ${inspectedStudent.currentIndex + 1} of ${totalQuestionsCount}`}
                    </span>
                  </div>

                  {/* Full Authoritative Question Breakdown */}
                  {resolvedInspectedAnswers.length > 0 ? (
                    <div className="space-y-2.5">
                      {resolvedInspectedAnswers.map((ans, aIdx) => {
                        const isSkipped = !ans.isAttempted;
                        return (
                          <div
                            key={aIdx}
                            className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                              isSkipped
                                ? "bg-slate-50 border-slate-200 text-slate-700"
                                : ans.isCorrect
                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                                : "bg-rose-50/70 border-rose-200 text-rose-950"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-900 leading-snug">
                                प्र. {aIdx + 1}: {ans.questionText}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                                  isSkipped
                                    ? "bg-slate-200 text-slate-700"
                                    : ans.isCorrect
                                    ? "bg-emerald-600 text-white shadow-2xs"
                                    : "bg-rose-600 text-white shadow-2xs"
                                }`}
                              >
                                {isSkipped ? "छोड़ा (0)" : ans.isCorrect ? "✓ सही (+4)" : "✗ गलत (-1)"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                              <div className={`p-2 rounded-xl border ${ans.isCorrect ? "bg-white border-emerald-200" : isSkipped ? "bg-slate-50 border-slate-200" : "bg-white border-rose-200"}`}>
                                <span className="text-slate-500 font-bold block text-[10px] uppercase">छात्र का उत्तर:</span>
                                <span className={`font-black ${isSkipped ? "text-slate-400" : ans.isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                                  {ans.selectedOption ? `${ans.selectedOption}${ans.selectedOptionText ? `: ${ans.selectedOptionText}` : ""}` : "कोई उत्तर नहीं दिया (छोड़ा)"}
                                </span>
                              </div>
                              <div className="p-2 rounded-xl bg-white border border-emerald-300 shadow-2xs">
                                <span className="text-slate-500 font-bold block text-[10px] uppercase">सही उत्तर:</span>
                                <span className="font-black text-emerald-800">
                                  {ans.correctAnswer ? `${ans.correctAnswer}${ans.correctAnswerText ? `: ${ans.correctAnswerText}` : ""}` : "A"}
                                </span>
                              </div>
                            </div>

                            {ans.explanation && (
                              <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200 mt-1">
                                <strong className="text-slate-800">व्याख्या:</strong> {ans.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : testData?.questions && testData.questions[inspectedStudent.currentIndex] ? (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                        {testData.questions[inspectedStudent.currentIndex].questionText}
                      </p>

                      <div className="space-y-1.5 pt-1">
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
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[10px] ${
                                  isSelectedByStudent ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {optLetter}
                              </span>
                              <span className="flex-1">{opt}</span>
                              {isSelectedByStudent && (
                                <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md font-bold uppercase">
                                  चुना हुआ
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
                </div>
              </div>

              {/* Sticky Bottom Footer */}
              <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  onClick={() => setInspectedStudent(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer transition-all shadow-xs"
                >
                  निरीक्षण बंद करें (Close Inspection)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🛑 ACCIDENTAL TERMINATION PROTECTION MODAL */}
      <AnimatePresence>
        {showTerminateModal && (
          <div className="fixed inset-0 z-[1000001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative text-slate-800"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
                <StopCircle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-black text-slate-900">
                  क्या आप निश्चित रूप से परीक्षा समाप्त करना चाहते हैं?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  परीक्षा समाप्त करने पर सभी छात्रों के उत्तर तुरंत अंतिम रूप से जमा हो जाएंगे और परीक्षा सत्र बंद हो जाएगा। इसके बाद मास्टर परिणाम लेजर तैयार होगा।
                </p>
              </div>

              {/* Exam Summary Snapshot */}
              <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">कुल उपस्थित</span>
                  <span className="text-sm font-black font-mono text-slate-800">{totalStudents}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">जमा किया</span>
                  <span className="text-sm font-black font-mono text-emerald-700">{totalSubmitted}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">सक्रिय छात्र</span>
                  <span className="text-sm font-black font-mono text-amber-700">{Math.max(0, totalStudents - totalSubmitted)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTerminateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTerminateModal(false);
                    sendAction("TERMINATE", { status: "TERMINATED" });
                    if (onEndExam) onEndExam();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm shadow-rose-600/30 flex items-center justify-center gap-1.5"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>हाँ, परीक्षा समाप्त करें</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ⚙️ TEACHER WAR ROOM SETTINGS & CONTROLS MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-[1000002] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl relative text-slate-800 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      परीक्षा नियंत्रण व सेटिंग्स (War Room Settings)
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      डिस्प्ले, ऑडियो, एंटी-चीट व सत्र प्राथमिकताएं
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer transition-all"
                  title="सेटिंग्स बंद करें"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* 1. Fullscreen Toggle */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">🖥️ पूर्ण स्क्रीन डिस्प्ले (Fullscreen)</span>
                      {isFullscreen && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">सक्रिय</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      ब्राउज़र टूलबार छुपाकर केंद्रित मॉनिटरिंग दृश्य
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                      isFullscreen
                        ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                    }`}
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span>{isFullscreen ? "बाहर निकलें" : "फुलस्क्रीन"}</span>
                  </button>
                </div>

                {/* 2. Sound & Audio Chimes */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">🔊 सबमिशन व अलर्ट ध्वनि (Audio Chime)</span>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${soundEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                          {soundEnabled ? "चालू" : "म्यूट"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        छात्र सबमिशन और टैब-स्विच उल्लंघनों पर ऑडियो बीप
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSoundEnabled((prev) => !prev)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        soundEnabled ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${soundEnabled ? "left-6.5" : "left-0.5"}`} />
                    </button>
                  </div>

                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={playTestChime}
                      className="px-3 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ध्वनि टेस्ट करें (Test Sound 🔔)</span>
                    </button>
                  </div>
                </div>

                {/* 3. Strict Proctoring Mode */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">🛡️ सख्त एंटी-चीट मॉनिटरिंग (Strict Mode)</span>
                      {strictProctoring && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.2 rounded-full font-bold">सुरक्षित</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      छात्र स्क्रीन छोड़ने पर तुरंत लाल अलर्ट और घटना लॉग दर्ज करें
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStrictProctoring((prev) => !prev);
                      toast.success(strictProctoring ? "सख्त मोड बंद किया गया" : "सख्त एंटी-चीट मोड सक्रिय 🛡️");
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      strictProctoring ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${strictProctoring ? "left-6.5" : "left-0.5"}`} />
                  </button>
                </div>

                {/* 4. Room Lock (Admission Gatekeeper) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">🔒 परीक्षा प्रवेश द्वार लॉक (Lock Room)</span>
                      {roomLocked && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full font-bold">लॉक है</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      नए छात्रों के प्रवेश पर रोक लगाएं ताकि परीक्षा में व्यवधान न हो
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRoomLocked((prev) => !prev);
                      toast(roomLocked ? "प्रवेश द्वार अनलॉक किया गया 🔓" : "प्रवेश द्वार लॉक किया गया 🔒", { icon: roomLocked ? "🔓" : "🔒" });
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      roomLocked ? "bg-amber-500" : "bg-slate-300"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${roomLocked ? "left-6.5" : "left-0.5"}`} />
                  </button>
                </div>

                {/* 5. Table Density Toggle */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900">📏 टेबल डिस्प्ले डेंसिटी (Table Density)</span>
                    <p className="text-[11px] text-slate-500">
                      छात्र सूची की पंक्तियों की चौड़ाई और स्पेसिंग चुनें
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setTableDensity("comfortable")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        tableDensity === "comfortable"
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      विस्तृत
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableDensity("compact")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        tableDensity === "compact"
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      कम्पैक्ट
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  पूर्ण (Done)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 💬 FLOATING CHAT NOTIFICATION FOR TEACHER (Only shows when unread messages exist to avoid clutter) */}
      {activeView !== "CHAT" && totalUnreadCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setActiveView("CHAT");
            const unreadStudent = studentList.find((s) => (unreadDMs[s.userId] || 0) > 0);
            if (unreadStudent) setSelectedChatStudentId(unreadStudent.userId);
          }}
          className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border-2 border-white/90 animate-bounce"
          title="नया छात्र संदेश देखें"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs font-bold">{totalUnreadCount} नया संदेश</span>
        </button>
      )}
    </div>
  );
}
