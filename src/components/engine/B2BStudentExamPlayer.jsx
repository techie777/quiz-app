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
  Home,
  MessageSquare,
  Volume2,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Radio,
  Eye,
  Edit3,
  Share2,
  ArrowLeft,
  Settings,
  Maximize2,
  Minimize2
} from "lucide-react";
import socketService from "@/engine/lib/socket";
import toast from "react-hot-toast";
import axios from "axios";

// ✏️ VIRTUAL SCRATCHPAD COMPONENT FOR ROUGH CALCULATIONS
function VirtualScratchpadModal({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [color, setColor] = useState("#1e293b");
  const [lineWidth, setLineWidth] = useState(2);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [isOpen]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    isDrawingRef.current = true;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    const { x, y } = getCoordinates(e);
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">✏️</span>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">डिजिटल रफ शीट (Rough Work Sheet)</h3>
              <p className="text-[10px] text-slate-500 font-medium">गणित व तार्किक गणना हेतु रफ पैड — बिना परीक्षा छोड़े उपयोग करें</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer transition-all"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500">रंग:</span>
            {[
              { hex: "#1e293b", label: "Black" },
              { hex: "#2563eb", label: "Blue" },
              { hex: "#dc2626", label: "Red" },
              { hex: "#059669", label: "Green" }
            ].map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => { setColor(c.hex); setLineWidth(2); }}
                style={{ backgroundColor: c.hex }}
                className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${color === c.hex && lineWidth === 2 ? "border-indigo-600 scale-125" : "border-white"}`}
                title={c.label}
              />
            ))}
            <div className="h-4 w-px bg-slate-300 mx-1" />
            <button
              type="button"
              onClick={() => { setColor("#ffffff"); setLineWidth(18); }}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${lineWidth === 18 && color === "#ffffff" ? "bg-indigo-600 text-white border-indigo-700" : "bg-white border-slate-300 text-slate-700"}`}
            >
              रबर (Eraser)
            </button>
          </div>

          <button
            type="button"
            onClick={clearCanvas}
            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold cursor-pointer transition-all"
          >
            🗑️ साफ़ करें (Clear)
          </button>
        </div>

        {/* Canvas Surface */}
        <div className="p-3 bg-slate-50 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={520}
            height={320}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-inner cursor-crosshair touch-none w-full max-w-full"
          />
        </div>
      </div>
    </div>
  );
}

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
  
  // Pause states: Master (all students) or Individual (targeted to this student)
  const [isMasterPaused, setIsMasterPaused] = useState(Boolean(session?.isPaused));
  const [isIndividualPaused, setIsIndividualPaused] = useState(false);
  const [isKickedOut, setIsKickedOut] = useState(false);

  // Exam Start timestamp
  const [startedAt, setStartedAt] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`b2b_exam_started_${testCode}`);
      if (saved) return Number(saved);
    }
    return null;
  });

  // Anti-cheat tab tracking
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  // 1-to-1 Teacher Chat & Broadcasts
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [directMessages, setDirectMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadDMs, setUnreadDMs] = useState(0);
  const [latestBroadcast, setLatestBroadcast] = useState("");
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [showBroadcastsModal, setShowBroadcastsModal] = useState(false);

  // 👁️ Live Camera & Audio Proctoring
  const [cameraActive, setCameraActive] = useState(false);
  const [activeAudioCall, setActiveAudioCall] = useState(null); // { isMuted: false }
  const [incomingCall, setIncomingCall] = useState(null); // { fromUserName, offer }
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const chatBottomRef = useRef(null);

  // Student Info (Requires name entry; Roll number is optional)
  const [activeStudentName, setActiveStudentName] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`b2b_student_name_${testCode}`);
      if (saved && saved !== "Student" && saved !== "Anonymous" && saved !== "Guest" && saved.trim().length >= 2) return saved;
      const urlName = new URLSearchParams(window.location.search).get("name");
      if (urlName && urlName !== "Student" && urlName !== "Anonymous" && urlName !== "Guest" && urlName.trim().length >= 2) return urlName;
    }
    if (session?.userName && session.userName !== "Student" && session.userName !== "Anonymous" && session.userName !== "Guest") return session.userName;
    return "";
  });

  const [activeRollNumber, setActiveRollNumber] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`b2b_student_roll_${testCode}`);
      if (saved && saved !== "N/A") return saved;
      const urlRoll = new URLSearchParams(window.location.search).get("roll");
      if (urlRoll) return urlRoll;
    }
    if (session?.rollNumber && session.rollNumber !== "N/A") return session.rollNumber;
    return "";
  });

  const [nameModalInput, setNameModalInput] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`b2b_student_name_${testCode}`) || new URLSearchParams(window.location.search).get("name") || "";
    }
    return "";
  });
  const [rollModalInput, setRollModalInput] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`b2b_student_roll_${testCode}`) || new URLSearchParams(window.location.search).get("roll") || "";
    }
    return "";
  });

  // Student Class / Batch (for Schools & Coaching Batches)
  const [activeStudentClass, setActiveStudentClass] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`b2b_student_class_${testCode}`);
      if (saved && saved !== "N/A") return saved;
      const urlClass = new URLSearchParams(window.location.search).get("class");
      if (urlClass) return urlClass;
    }
    if (session?.studentClass && session.studentClass !== "N/A") return session.studentClass;
    return "";
  });
  const [classModalInput, setClassModalInput] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`b2b_student_class_${testCode}`) || new URLSearchParams(window.location.search).get("class") || "";
    }
    return "";
  });

  const studentName = activeStudentName || "Student";
  const rollNumber = activeRollNumber || "N/A";
  const studentClass = activeStudentClass || "N/A";
  const studentId = session?.userId || (typeof window !== "undefined" ? localStorage.getItem(`quiz_uid_${testCode}`) : `student_${Date.now()}`) || `student_${Date.now()}`;

  // NTA / TCS-iON Standard 5-State Question Tracking
  const [visitedQuestions, setVisitedQuestions] = useState(() => new Set([0]));

  // Virtual Rough Sheet Canvas Modal
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleStudentFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        toast.success("पूर्ण स्क्रीन मोड सक्रिय 🖥️");
      }).catch((e) => {
        console.warn("Fullscreen request error:", e);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((e) => {});
    }
  };

  const isExamPaused = isMasterPaused || isIndividualPaused;

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
        if (parsed.isFinished && parsed.submissionResult) {
          setSubmissionResult(parsed.submissionResult);
          setIsFinished(true);
          return;
        }
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.marked) setMarkedForReview(new Set(parsed.marked));
        if (Array.isArray(parsed.visited)) setVisitedQuestions(new Set(parsed.visited));
        if (typeof parsed.currentIndex === "number") setCurrentIndex(Math.min(parsed.currentIndex, totalQuestions - 1));
        if (typeof parsed.secondsRemaining === "number") setSecondsRemaining(parsed.secondsRemaining);
        if (typeof parsed.tabSwitches === "number") setTabSwitches(parsed.tabSwitches);
        if (typeof parsed.startedAt === "number") setStartedAt(parsed.startedAt);
      } catch (e) {
        console.warn("Failed to parse cached exam state:", e);
      }
    }

    if (!startedAt) {
      const now = Date.now();
      setStartedAt(now);
      localStorage.setItem(`b2b_exam_started_${testCode}`, String(now));
    }

    if (secondsRemaining === null) {
      const initialSeconds = (testData.durationMinutes || 20) * 60;
      setSecondsRemaining(initialSeconds);
    }
  }, [testData, testCode, totalQuestions, startedAt]);

  // Mark question as visited whenever student views it
  useEffect(() => {
    setVisitedQuestions((prev) => new Set([...prev, currentIndex]));
  }, [currentIndex]);

  // 3. Save progress to localStorage on any state change
  useEffect(() => {
    if (!testData || typeof window === "undefined" || isFinished) return;

    const cacheKey = `b2b_exam_state_${testCode}`;
    const stateToSave = {
      answers,
      marked: Array.from(markedForReview),
      visited: Array.from(visitedQuestions),
      currentIndex,
      secondsRemaining,
      tabSwitches,
      startedAt: startedAt || Date.now(),
      isFinished: false
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(stateToSave));
    } catch (e) {}
  }, [answers, markedForReview, visitedQuestions, currentIndex, secondsRemaining, tabSwitches, startedAt, testData, testCode, isFinished]);

  // 🛡️ ANTI-CHEAT KEYBOARD & CONTEXT MENU SHIELD
  useEffect(() => {
    if (!testData || isFinished || isKickedOut) return;

    const handleKeyDown = (e) => {
      // Prevent Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+A, F12, Inspect
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "u" || e.key === "a")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "C" || e.key === "J"))
      ) {
        e.preventDefault();
        toast.error("⚠️ परीक्षा सुरक्षा: शॉर्टकट और टेक्स्ट कॉपी करना प्रतिबंधित है।", { id: "sec-guard" });
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [testData, isFinished, isKickedOut]);

  // 4. Anti-Cheat Screen Change / Tab Switch Monitor
  useEffect(() => {
    if (!testData || isFinished || isKickedOut) return;

    let debounceTimer = null;
    const triggerTabSwitch = () => {
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
      }, 1500);

      setTabSwitches((prev) => {
        const next = prev + 1;
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
      setShowTabWarning(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerTabSwitch();
      }
    };

    const handleWindowBlur = () => {
      triggerTabSwitch();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [testData, isFinished, isKickedOut, socket, testCode, studentId, studentName, rollNumber]);

  // 4. Exam Countdown Timer (Pauses if teacher pauses test)
  useEffect(() => {
    if (secondsRemaining === null || isExamPaused || isFinished || isKickedOut) return;

    if (secondsRemaining <= 0) {
      toast("समय समाप्त हो गया है! परीक्षा स्वतः जमा की जा रही है... ⏱️", { icon: "⌛" });
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, isExamPaused, isFinished, isKickedOut]);

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

  // 5. Socket Listeners for Host Events (Pause, Kick, Terminate, 1-to-1 Chat, Proctor Audio)
  useEffect(() => {
    if (!socket) return;

    // Fetch existing 1-on-1 messages with host
    socket.emit("FETCH_DIRECT_MESSAGES", { sessionId: testCode, userId: studentId });

    const handleStateUpdate = (data) => {
      // Check for Kick event
      if (data?.action === "KICKED" || data?.payload?.status === "KICKED" || data?.payload?.isKicked) {
        setIsKickedOut(true);
        try {
          localStorage.removeItem(`b2b_exam_state_${testCode}`);
        } catch (e) {}
        toast.error("आपको शिक्षक द्वारा परीक्षा से निष्कासित कर दिया गया है।", { duration: 6000 });
        return;
      }

      if (data?.payload?.hasOwnProperty("isPaused")) {
        setIsMasterPaused(Boolean(data.payload.isPaused));
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

    // Targeted Individual Pause
    const handleIndividualPause = (data) => {
      setIsIndividualPaused(Boolean(data.isPaused));
      if (data.isPaused) {
        toast("शिक्षक द्वारा आपकी परीक्षा अस्थायी रूप से रोक दी गई है ⏸️", { duration: 5000 });
      } else {
        toast.success("आपकी परीक्षा पुनः शुरू हो गई है ▶️", { duration: 4000 });
      }
    };

    // 1-to-1 Direct Message from Teacher
    const handleDirectMessage = (dm) => {
      setDirectMessages((prev) => {
        if (prev.some((m) => m.id === dm.id)) return prev;
        return [...prev, dm];
      });

      if (dm.role === "HOST") {
        setUnreadDMs((prev) => prev + 1);
        toast(`👨‍🏫 शिक्षक: ${dm.text.slice(0, 35)}`, {
          icon: "💬",
          duration: 5000
        });
      }
    };

    const handleSyncDMs = (msgs) => {
      if (Array.isArray(msgs)) {
        setDirectMessages(msgs);
      }
    };

    // 📢 1-to-Many Teacher Proclamation / Broadcast
    const handleBroadcast = (data) => {
      const text = typeof data === "string" ? data : data?.text;
      if (text) {
        setBroadcastHistory((prev) => [
          { text, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
          ...prev.slice(0, 19)
        ]);
        setLatestBroadcast(text);
        toast(`📢 शिक्षक निर्देश: ${text}`, { duration: 6000 });
      }
    };

    // 📞 WebRTC Audio Signaling with Teacher
    const handleWebRTCSignal = async (data) => {
      if (!data?.signal && !data?.type) return;
      // Do not process signals emitted by our own student socket
      if (data.fromUserId === studentId) return;
      // Filter targeted signals: must be for this student or ALL
      if (data.toUserId && data.toUserId !== "ALL" && data.toUserId !== studentId && data.toUserId !== rollNumber) return;

      if (data.type === "CALL_INITIATE" || data.signal?.sdp?.type === "offer") {
        pendingCandidatesRef.current = [];
        setIncomingCall({
          fromUserName: data.fromUserName || "शिक्षक (Teacher)",
          offer: data.signal?.sdp
        });
        toast("📞 शिक्षक से ऑडियो कॉल आ रही है...", { icon: "🔔", duration: 6000 });
      } else if (data.signal?.candidate) {
        const cand = new RTCIceCandidate(data.signal.candidate);
        const pc = peerConnectionRef.current;
        if (pc?.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(cand);
          } catch (e) {}
        } else {
          pendingCandidatesRef.current.push(cand);
        }
      } else if (data.signal?.type === "HANGUP" || data.type === "CALL_ENDED") {
        endCallLocally();
        toast("शिक्षक के साथ ऑडियो कॉल समाप्त हुई।", { icon: "📴" });
      }
    };

    socket.on("STATE_UPDATE", handleStateUpdate);
    socket.on("INDIVIDUAL_PAUSE", handleIndividualPause);
    socket.on("DIRECT_MESSAGE", handleDirectMessage);
    socket.on("SYNC_DIRECT_MESSAGES", handleSyncDMs);
    socket.on("MISSION_BROADCAST", handleBroadcast);
    socket.on("PROCTOR_WEBRTC_SIGNAL", handleWebRTCSignal);

    return () => {
      socket.off("STATE_UPDATE", handleStateUpdate);
      socket.off("INDIVIDUAL_PAUSE", handleIndividualPause);
      socket.off("DIRECT_MESSAGE", handleDirectMessage);
      socket.off("SYNC_DIRECT_MESSAGES", handleSyncDMs);
      socket.off("MISSION_BROADCAST", handleBroadcast);
      socket.off("PROCTOR_WEBRTC_SIGNAL", handleWebRTCSignal);
    };
  }, [socket, testCode, studentId, studentName]);

  // Scroll chat drawer
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [directMessages, isChatOpen]);

  // 📞 WebRTC Call Action Handlers (Executed via User Gesture)
  const handleAnswerCall = async () => {
    if (!incomingCall?.offer) return;
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" }
        ]
      });
      peerConnectionRef.current = pc;

      // 1. Acquire mic with user interaction
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = micStream;
        micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));
      } catch (micErr) {
        console.warn("Student microphone permission denied:", micErr);
        toast.error("माइक्रोफ़ोन अनुमति नहीं मिली। कृपया ब्राउज़र में माइक की अनुमति दें।");
      }

      // 2. Play incoming audio
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const audioElem = document.getElementById("student_proctor_audio");
          if (audioElem) {
            audioElem.srcObject = event.streams[0];
            audioElem.play().catch((playErr) => {
              console.warn("Remote student audio play blocked:", playErr);
            });
          }
        }
      };

      // 3. ICE Candidate emission
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("PROCTOR_WEBRTC_SIGNAL", {
            sessionId: testCode,
            toUserId: "HOST",
            fromUserId: studentId,
            fromUserName: studentName,
            signal: { candidate: event.candidate },
            type: "ICE_CANDIDATE"
          });
        }
      };

      // 4. Set remote description
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

      // 5. Drain candidate queue
      while (pendingCandidatesRef.current.length > 0) {
        const cand = pendingCandidatesRef.current.shift();
        try {
          await pc.addIceCandidate(cand);
        } catch (e) {}
      }

      // 6. Create and set local answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // 7. Send answer to HOST
      if (socket) {
        socket.emit("PROCTOR_WEBRTC_SIGNAL", {
          sessionId: testCode,
          toUserId: "HOST",
          fromUserId: studentId,
          fromUserName: studentName,
          signal: { sdp: answer },
          type: "CALL_ANSWER"
        });
      }

      setActiveAudioCall({ isMuted: false, connectedAt: Date.now() });
      setIncomingCall(null);
      toast.success("शिक्षक से ऑडियो कॉल कनेक्ट हो गई है! 🎙️");
    } catch (err) {
      console.error("Error answering call:", err);
      toast.error("कॉल कनेक्ट करने में त्रुटि हुई।");
      setIncomingCall(null);
    }
  };

  const handleDeclineCall = () => {
    if (socket) {
      socket.emit("PROCTOR_WEBRTC_SIGNAL", {
        sessionId: testCode,
        toUserId: "HOST",
        fromUserId: studentId,
        fromUserName: studentName,
        type: "CALL_DECLINED",
        signal: { type: "DECLINED" }
      });
    }
    setIncomingCall(null);
    toast("कॉल अस्वीकार की गई।", { icon: "📴" });
  };

  const endCallLocally = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setActiveAudioCall(null);
    setIncomingCall(null);
  };

  const handleStudentHangup = () => {
    if (socket) {
      socket.emit("PROCTOR_WEBRTC_SIGNAL", {
        sessionId: testCode,
        toUserId: "HOST",
        fromUserId: studentId,
        fromUserName: studentName,
        type: "CALL_ENDED",
        signal: { type: "HANGUP" }
      });
    }
    endCallLocally();
    toast("शिक्षक के साथ ऑडियो कॉल समाप्त हुई।", { icon: "📴" });
  };

  const toggleStudentMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setActiveAudioCall((prev) => (prev ? { ...prev, isMuted: !audioTrack.enabled } : null));
      }
    }
  };

  // 6. Webcam & Proctor Frame Interval Capture
  const startCamera = async (isUserClick = false) => {
    try {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } },
          audio: false
        });
      } catch (errConstraint) {
        // Fallback to standard video constraint if custom dimensions rejected
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      if (isUserClick === true) {
        toast.success("वेबकैम निगरानी सक्रिय है 📹");
      }
    } catch (e) {
      console.warn("Camera permission not granted:", e);
      // ONLY trigger error toast if student explicitly clicked "कैमरा चालू करें"
      // NEVER show scary error toast automatically on initial page load!
      if (isUserClick === true) {
        toast.error("कैमरा अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में कैमरा की अनुमति दें।");
      }
    }
  };

  useEffect(() => {
    // Attempt auto-start camera silently on mount without scaring user
    startCamera(false);

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Periodic frame snapshot capture (emitted every 4 seconds)
  useEffect(() => {
    if (!socket || !cameraActive || isFinished || isKickedOut) return;

    const interval = setInterval(() => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.readyState === 4) {
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, 160, 120);
          const frameData = canvas.toDataURL("image/webp", 0.4);

          socket.emit("PROCTOR_FRAME", {
            sessionId: testCode,
            userId: studentId,
            userName: studentName,
            rollNumber,
            frame: frameData
          });
        }
      } catch (err) {}
    }, 4000);

    return () => clearInterval(interval);
  }, [socket, cameraActive, testCode, studentId, studentName, rollNumber, isFinished, isKickedOut]);

  // 7. Anti-Cheat Visibility / Tab Switch Detection
  useEffect(() => {
    if (isFinished || isKickedOut) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setTabSwitches((prev) => {
          const next = prev + 1;
          setShowTabWarning(true);

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
  }, [socket, testCode, studentId, studentName, rollNumber, isFinished, isKickedOut]);

  // 8. Emit Live Telemetry to Teacher Cockpit
  const currentQ = questions[currentIndex];
  const selectedOpt = answers[currentIndex] || null;

  useEffect(() => {
    if (!socket || isFinished || isKickedOut) return;

    socket.emit("STUDENT_TELEMETRY", {
      sessionId: testCode,
      userId: studentId,
      userName: studentName,
      rollNumber,
      studentClass,
      currentIndex,
      selectedOption: selectedOpt,
      tabSwitches,
      timeRemaining: secondsRemaining,
      isSubmitted: false
    });
  }, [socket, testCode, studentId, studentName, rollNumber, studentClass, currentIndex, selectedOpt, tabSwitches, secondsRemaining, isFinished, isKickedOut]);

  // Option Click Handler
  const handleSelectOption = (optionLetter) => {
    if (isExamPaused || isFinished || isKickedOut) return;
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionLetter
    }));
  };

  // Clear response
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

  // Send Direct Message to Teacher
  const handleSendDMToTeacher = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !socket) return;

    socket.emit("SEND_DIRECT_MESSAGE", {
      sessionId: testCode,
      fromUserId: studentId,
      fromUserName: studentName,
      toUserId: "HOST",
      text: chatInput.trim(),
      role: "STUDENT"
    });

    setChatInput("");
  };

  // NTA / TCS-iON 5-State Counts
  const answeredCount = Object.keys(answers).filter((idx) => !markedForReview.has(Number(idx))).length;
  const markedOnlyCount = Array.from(markedForReview).filter((idx) => typeof answers[idx] === "undefined").length;
  const answeredAndMarkedCount = Array.from(markedForReview).filter((idx) => typeof answers[idx] !== "undefined").length;
  const notAnsweredCount = Array.from(visitedQuestions).filter((idx) => typeof answers[idx] === "undefined" && !markedForReview.has(idx)).length;
  const notVisitedCount = Math.max(0, totalQuestions - visitedQuestions.size);
  const attemptedCount = Object.keys(answers).length;
  const reviewCount = markedForReview.size;
  const unattemptedCount = Math.max(0, totalQuestions - attemptedCount);

  // Status helper for each question
  const getQuestionNtaStatus = (qIdx) => {
    const hasAns = typeof answers[qIdx] !== "undefined";
    const isMarked = markedForReview.has(qIdx);
    const isVis = visitedQuestions.has(qIdx);

    if (hasAns && isMarked) return "ANSWERED_MARKED"; // 🟣🟢
    if (!hasAns && isMarked) return "MARKED"; // 🟣
    if (hasAns) return "ANSWERED"; // 🟢
    if (isVis) return "NOT_ANSWERED"; // 🔴
    return "NOT_VISITED"; // ⚪
  };

  const getNtaBadgeStyle = (status, isCurrent) => {
    const focusRing = isCurrent ? "ring-2 ring-indigo-500 ring-offset-2 scale-105 z-10" : "";
    switch (status) {
      case "ANSWERED":
        return `bg-emerald-600 text-white border-emerald-700 shadow-xs font-bold ${focusRing}`;
      case "NOT_ANSWERED":
        return `bg-rose-500 text-white border-rose-600 shadow-xs font-bold ${focusRing}`;
      case "MARKED":
        return `bg-purple-600 text-white border-purple-700 shadow-xs font-bold ${focusRing}`;
      case "ANSWERED_MARKED":
        return `bg-purple-700 text-white border-purple-900 shadow-xs font-bold relative ${focusRing}`;
      case "NOT_VISITED":
      default:
        return `bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-medium ${focusRing}`;
    }
  };

  // Submit Exam
  const handleAutoSubmit = async () => {
    await performSubmission();
  };

  const performSubmission = async () => {
    setIsSubmitting(true);
    try {
      const submissionTimestamp = Date.now();
      const totalDurationSecs = (testData?.durationMinutes || 20) * 60;
      const timeTakenSeconds = Math.max(1, totalDurationSecs - (secondsRemaining !== null ? secondsRemaining : totalDurationSecs));
      const examStartTime = startedAt || (submissionTimestamp - timeTakenSeconds * 1000);

      const basePayload = {
        sessionId: testCode,
        userId: studentId,
        studentId,
        userName: studentName,
        studentName,
        rollNumber,
        studentClass,
        answers,
        tabSwitches,
        startedAt: examStartTime,
        completedAt: submissionTimestamp,
        timeTakenSeconds
      };

      // 1. Authoritative Server Evaluation
      let evaluationResult = null;
      try {
        const res = await axios.post(`/api/b2b/tests/${testCode}/submit`, basePayload);
        if (res.data?.success && res.data?.result) {
          evaluationResult = res.data.result;
        }
      } catch (postErr) {
        console.warn("API submission sync warning:", postErr);
      }

      // 2. Map detailed answers with guaranteed correct answers & accuracy
      let detailedAnswers = [];
      let totalScore = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let unattemptedCount = 0;
      let accuracy = 0;
      const marksPerQ = Number(testData?.marksCorrect) || 4;
      const negPerQ = Number(testData?.marksNegative) || 0;

      if (evaluationResult && Array.isArray(evaluationResult.evaluatedQuestions)) {
        detailedAnswers = evaluationResult.evaluatedQuestions.map((eq, qIdx) => {
          const studentAns = answers[qIdx] || answers[eq.id] || eq.selectedOption || null;
          const isAttempted = Boolean(studentAns && studentAns !== "SKIP");
          return {
            id: eq.id || qIdx,
            index: qIdx,
            questionText: eq.questionText,
            options: eq.options || [],
            correctAnswer: eq.correctAnswer || "A",
            correctAnswerText: eq.correctAnswerText || "",
            studentAnswer: studentAns,
            selectedOption: studentAns,
            selectedOptionText: eq.selectedOptionText || "",
            isCorrect: Boolean(eq.isCorrect),
            isAttempted,
            status: eq.status || (isAttempted ? (eq.isCorrect ? "CORRECT" : "INCORRECT") : "SKIPPED"),
            marks: typeof eq.marksEarned !== "undefined" ? eq.marksEarned : (eq.isCorrect ? marksPerQ : isAttempted ? -negPerQ : 0),
            explanation: eq.explanation || null
          };
        });

        totalScore = typeof evaluationResult.totalScore === "number" ? evaluationResult.totalScore : 0;
        correctCount = typeof evaluationResult.correctCount === "number" ? evaluationResult.correctCount : 0;
        wrongCount = typeof evaluationResult.incorrectCount === "number" ? evaluationResult.incorrectCount : 0;
        unattemptedCount = typeof evaluationResult.skippedCount === "number" ? evaluationResult.skippedCount : 0;
        accuracy = typeof evaluationResult.accuracy === "number" ? evaluationResult.accuracy : 0;
      } else {
        // Safe fallback
        detailedAnswers = questions.map((q, idx) => {
          const userAns = answers[idx] || null;
          const isAttempted = !!userAns;
          const correctAns = q.correctAnswer || "A";
          const isCorrect = isAttempted && userAns === correctAns;
          const marks = isCorrect ? marksPerQ : (isAttempted ? -negPerQ : 0);
          if (isAttempted) {
            if (isCorrect) correctCount++;
            else wrongCount++;
          } else {
            unattemptedCount++;
          }
          return {
            id: q.id || idx,
            index: idx,
            questionText: q.questionText,
            options: q.options || [],
            correctAnswer: correctAns,
            studentAnswer: userAns,
            selectedOption: userAns,
            isCorrect,
            isAttempted,
            marks
          };
        });
        totalScore = Math.max(0, correctCount * marksPerQ - wrongCount * negPerQ);
        accuracy = (correctCount + wrongCount) > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;
      }

      const fullPayload = {
        ...basePayload,
        detailedAnswers,
        totalScore,
        accuracy,
        grade: evaluationResult?.grade || "N/A",
        gradeRemark: evaluationResult?.gradeRemark || "N/A",
        correctCount,
        wrongCount,
        unattemptedCount,
        totalQuestions,
        maxScore: totalQuestions * marksPerQ,
        submittedAt: new Date(submissionTimestamp).toISOString()
      };

      // 3. Broadcast accurate evaluation to teacher over socket
      if (socket) {
        socket.emit("SUBMIT_EXAM", fullPayload);
      }

      const finalResult = {
        ...fullPayload,
        attemptedCount: correctCount + wrongCount,
        detailedAnswers
      };

      setSubmissionResult(finalResult);
      setIsFinished(true);
      setShowSubmitModal(false);

      if (typeof window !== "undefined") {
        localStorage.setItem(
          `b2b_exam_state_${testCode}`,
          JSON.stringify({
            isFinished: true,
            submissionResult: finalResult
          })
        );
      }

      toast.success("परीक्षा सफलतापूर्वक जमा हो गई! 🏆");
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("जमा करने में समस्या हुई। कृपया पुनः प्रयास करें।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper formatters
  const formatDurationDisplay = (totalSecs) => {
    if (!totalSecs || totalSecs <= 0) return "0 सेकंड";
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m === 0) return `${s} सेकंड`;
    return `${m} मिनट ${s} सेकंड`;
  };

  const formatTimestampDisplay = (ts) => {
    if (!ts) return "N/A";
    try {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    } catch (e) {
      return "N/A";
    }
  };

  // =========================================================================
  // 🚫 KICKED OUT SCREEN
  // =========================================================================
  if (isKickedOut) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-800 border border-rose-500/50 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-3xl mx-auto">
            🚫
          </div>
          <h2 className="text-xl font-black text-rose-400">परीक्षा से निष्कासित (Dismissed)</h2>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            शिक्षक या परीक्षा नियंत्रक द्वारा आपको इस लाइव परीक्षा सत्र से निष्कासित कर दिया गया है। आपकी प्रतिक्रियाएं बंद कर दी गई हैं।
          </p>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-2xl text-xs font-bold transition-all cursor-pointer"
          >
            मुख्य पृष्ठ पर लौटें (Exit to Home)
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 🏁 EXAM RESULT / SCORECARD (Finished)
  // =========================================================================
  if (isFinished && submissionResult) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-3 sm:px-6 flex items-center justify-center text-slate-800">
        <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-5 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto border border-emerald-200/80">
            🎉
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              परीक्षा सफलतापूर्वक संपन्न
            </span>
            <h2 className="text-2xl font-black text-slate-900">{testData?.testTitle || "Live Exam"}</h2>
            <p className="text-xs text-slate-500 font-medium">
              परीक्षार्थी: <strong>{studentName}</strong> • रोल नंबर: <strong>{rollNumber}</strong>
            </p>
          </div>

          {/* 🎓 Academic Grade & Batch Info (CBSE / Govt Exam Standard) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-emerald-50/90 rounded-2xl border border-indigo-100">
            <div className="text-left space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">कक्षा / बैच व अनुक्रमांक</span>
              <p className="text-xs font-black text-slate-800">
                {submissionResult.studentClass || activeStudentClass || "सामान्य बैच"} • Roll: {submissionResult.rollNumber || rollNumber || studentId}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">बोर्ड / परीक्षा ग्रेड</span>
                <span className="text-[11px] font-bold text-slate-700">{submissionResult.gradeRemark || "सफलतापूर्वक पूर्ण"}</span>
              </div>
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-base font-black font-mono shadow-xs">
                {submissionResult.grade || "A"}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">आपका कुल स्कोर</span>
            <p className="text-3xl font-black text-indigo-600 font-mono">
              {submissionResult.totalScore} <span className="text-sm font-semibold text-slate-500">अंक</span>
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-700 font-bold block">सही उत्तर</span>
              <span className="text-lg font-black text-emerald-900 font-mono">{submissionResult.correctCount}</span>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-[10px] text-rose-700 font-bold block">गलत उत्तर</span>
              <span className="text-lg font-black text-rose-900 font-mono">{submissionResult.wrongCount}</span>
            </div>
            <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-600 font-bold block">छोड़ा (Skip)</span>
              <span className="text-lg font-black text-slate-800 font-mono">{submissionResult.unattemptedCount || 0}</span>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <span className="text-[10px] text-indigo-700 font-bold block">सटीकता</span>
              <span className="text-lg font-black text-indigo-900 font-mono">{submissionResult.accuracy}%</span>
            </div>
          </div>

          {/* 📋 QUESTION-BY-QUESTION RESPONSE SHEET (CORRECT & INCORRECT WITH ANSWERS) */}
          {submissionResult.detailedAnswers && submissionResult.detailedAnswers.length > 0 && (
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    📋 प्रश्नवार विस्तृत उत्तर समीक्षा (Response Sheet)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">सही उत्तर व आपकी चुनी हुई प्रतिक्रिया</p>
                </div>
                <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                  कुल {submissionResult.detailedAnswers.length} प्रश्न
                </span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {submissionResult.detailedAnswers.map((ans, qIdx) => {
                  const isSkipped = !ans.isAttempted;
                  return (
                    <div
                      key={qIdx}
                      className={`p-3.5 rounded-2xl border text-xs space-y-2 transition-all ${
                        isSkipped
                          ? "bg-white border-slate-200 text-slate-700"
                          : ans.isCorrect
                          ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                          : "bg-rose-50/80 border-rose-200 text-rose-950"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 leading-snug">
                          प्र. {qIdx + 1}: {ans.questionText}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                            isSkipped
                              ? "bg-slate-200 text-slate-700"
                              : ans.isCorrect
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "bg-rose-600 text-white shadow-2xs"
                          }`}
                        >
                          {isSkipped ? "छोड़ा (0)" : ans.isCorrect ? `✓ सही (+${ans.marks || 4})` : `✗ गलत (${ans.marks || -1})`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                        <div className={`p-2 rounded-xl border ${ans.isCorrect ? "bg-white border-emerald-200" : isSkipped ? "bg-slate-50 border-slate-200" : "bg-white border-rose-200"}`}>
                          <span className="text-slate-500 font-bold block text-[10px] uppercase">आपका उत्तर:</span>
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
                        <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                          <strong className="text-slate-800">व्याख्या:</strong> {ans.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 📋 INDIVIDUAL AUDIT REPORT: SCREEN CHANGES, TIME TAKEN, START TIME, SUBMISSION TIME */}
          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200 text-left space-y-2.5">
            <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/80 pb-1.5">
              <span>📊 परीक्षा समय व स्क्रीन सुरक्षा रिपोर्ट</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">🖥️ स्क्रीन बदली (Screen Change)</span>
                <span className={`text-sm font-mono font-black ${submissionResult.tabSwitches > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {submissionResult.tabSwitches > 0 ? `${submissionResult.tabSwitches} बार` : "0 (कोई नहीं)"}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">⏱️ कुल लिया गया समय</span>
                <span className="text-sm font-mono font-black text-slate-800">
                  {formatDurationDisplay(submissionResult.timeTakenSeconds)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">🚀 परीक्षा शुरू की</span>
                <span className="text-xs font-mono font-bold text-indigo-700">
                  {formatTimestampDisplay(submissionResult.startedAt)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">🏁 परीक्षा जमा की</span>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  {formatTimestampDisplay(submissionResult.completedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-1 flex flex-col gap-2">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `🏆 *परीक्षा परिणाम / Official Report Card*\n\n` +
                `👤 *परीक्षार्थी:* ${studentName}\n` +
                `🏷️ *रोल नंबर:* ${submissionResult.rollNumber || rollNumber}\n` +
                `🏫 *कक्षा / बैच:* ${submissionResult.studentClass || activeStudentClass || "सामान्य"}\n` +
                `📝 *विषय / परीक्षा:* ${testData?.testTitle || 'लाइव परीक्षा'}\n\n` +
                `📊 *प्राप्तांक:* ${submissionResult.totalScore} / ${submissionResult.maxScore || (totalQuestions * 4)} अंक\n` +
                `🎖️ *ग्रेड:* ${submissionResult.grade || "A"} (${submissionResult.gradeRemark || "उत्कृष्ट"})\n` +
                `🎯 *सटीकता:* ${submissionResult.accuracy}%\n` +
                `✅ *सही उत्तर:* ${submissionResult.correctCount} | ❌ *गलत:* ${submissionResult.wrongCount} | ⚪ *स्किप:* ${submissionResult.unattemptedCount || 0}\n` +
                `⏱️ *कुल समय:* ${formatDurationDisplay(submissionResult.timeTakenSeconds)}\n` +
                `🖥️ *स्क्रीन सुरक्षा:* ${submissionResult.tabSwitches > 0 ? `${submissionResult.tabSwitches} बार स्क्रीन बदली` : "100% अनुशासित"}\n\n` +
                `_डिजिटल परीक्षा पोर्टल द्वारा स्वचालित रूप से प्रमाणित।_`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>अभिभावक / WhatsApp पर रिपोर्ट कार्ड शेयर करें (Share on WhatsApp)</span>
            </a>

            <button
              onClick={() => { window.location.href = "/"; }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-all cursor-pointer"
            >
              मुख्य पृष्ठ पर जाएं (Exit to Home)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Gate check: If student hasn't entered their name, REQUIRE it before allowing question view
  if (!activeStudentName || activeStudentName === "Student" || activeStudentName === "Anonymous" || activeStudentName === "Guest" || activeStudentName.trim().length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 text-white select-none relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 bg-slate-900/95 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl mx-auto shadow-lg shadow-indigo-500/30 border border-indigo-400/40">
              🎓
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider">
              <span>{testData?.instituteName || "Premier Coaching Academy"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {testData?.testTitle || "Live Examination"}
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              परीक्षा शुरू करने के लिए कृपया अपना नाम दर्ज करें। रोल नंबर वैकल्पिक है।
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const clean = nameModalInput.trim();
              if (!clean || clean.length < 2) {
                toast.error("कृपया अपना पूरा नाम दर्ज करें (कम से कम 2 अक्षर)");
                return;
              }
              const rollClean = rollModalInput.trim();
              const classClean = classModalInput.trim();
              setActiveStudentName(clean);
              setActiveRollNumber(rollClean || "N/A");
              setActiveStudentClass(classClean || "N/A");

              if (typeof window !== "undefined") {
                localStorage.setItem(`b2b_student_name_${testCode}`, clean);
                if (rollClean) {
                  localStorage.setItem(`b2b_student_roll_${testCode}`, rollClean);
                } else {
                  localStorage.removeItem(`b2b_student_roll_${testCode}`);
                }
                if (classClean) {
                  localStorage.setItem(`b2b_student_class_${testCode}`, classClean);
                } else {
                  localStorage.removeItem(`b2b_student_class_${testCode}`);
                }
                const label = [clean, rollClean ? `R:${rollClean}` : null, classClean ? `C:${classClean}` : null].filter(Boolean).join(" | ");
                localStorage.setItem(`quiz_callsign_${testCode}`, label);
              }
              if (socket) {
                socket.emit("STUDENT_TELEMETRY", {
                  sessionId: testCode,
                  userId: studentId,
                  userName: clean,
                  rollNumber: rollClean || "N/A",
                  studentClass: classClean || "N/A"
                });
                socket.emit("JOIN_SESSION", {
                  sessionId: testCode,
                  role: "GUEST",
                  userId: studentId,
                  userName: clean,
                  rollNumber: rollClean || null,
                  studentClass: classClean || null,
                  isB2B: true
                });
              }
              toast.success(`नमस्ते ${clean}! परीक्षा शुरू हो रही है 🎯`);
            }}
            className="space-y-3.5 pt-1"
          >
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>परीक्षार्थी का नाम (Full Name) <span className="text-rose-400">*</span></span>
                <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">अनिवार्य</span>
              </label>
              <input
                type="text"
                autoFocus
                required
                value={nameModalInput}
                onChange={(e) => setNameModalInput(e.target.value)}
                placeholder="उदा. राहुल शर्मा (Rahul Sharma)"
                className="w-full bg-slate-800/90 border-2 border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition-all shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>रोल नंबर (Roll No)</span>
                  <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">वैकल्पिक</span>
                </label>
                <input
                  type="text"
                  value={rollModalInput}
                  onChange={(e) => setRollModalInput(e.target.value)}
                  placeholder="उदा. 104 या 2026A"
                  className="w-full bg-slate-800/90 border-2 border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white placeholder:text-slate-500 outline-none transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>कक्षा / बैच / सेक्शन</span>
                  <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">वैकल्पिक</span>
                </label>
                <input
                  type="text"
                  value={classModalInput}
                  onChange={(e) => setClassModalInput(e.target.value)}
                  placeholder="उदा. 10th-A / SSC GD"
                  className="w-full bg-slate-800/90 border-2 border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white placeholder:text-slate-500 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-medium text-left">
              * स्कूल / कोचिंग बैच हेतु रोल नंबर व कक्षा दर्ज करना सुगम रहता है।
            </p>

            <button
              type="submit"
              disabled={!nameModalInput.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/30 active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-1"
            >
              <span>परीक्षा में प्रवेश करें (Enter Examination)</span>
              <span className="text-base">→</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !testData || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600">परीक्षा पत्र लोड हो रहा है, कृपया प्रतीक्षा करें...</p>
      </div>
    );
  }

  const currentOptionLetters = ["A", "B", "C", "D"];
  const currentSelectedOpt = answers[currentIndex];
  const isCurrentMarked = markedForReview.has(currentIndex);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 lg:pb-10 select-none relative">
      {/* Hidden audio element for WebRTC audio from teacher */}
      <audio id="student_proctor_audio" autoPlay className="hidden" />

      {/* Hidden canvas for webcam frame snapshot capture */}
      <canvas ref={canvasRef} width="160" height="120" className="hidden" />

      {/* ⏸️ INESCAPABLE PAUSE OVERLAY */}
      <AnimatePresence>
        {isExamPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 text-white text-center"
          >
            <div className="bg-slate-800 border border-amber-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl mx-auto">
                ⏸️
              </div>
              <h2 className="text-xl font-black text-amber-400">परीक्षा अस्थायी रूप से रोक दी गई है</h2>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {isIndividualPaused
                  ? "शिक्षक द्वारा आपकी परीक्षा कुछ समय के लिए रोकी गई है।"
                  : "शिक्षक द्वारा सभी छात्रों की परीक्षा रोकी गई है।"}
                <br />
                आपका परीक्षा समय रुका हुआ है। जैसे ही शिक्षक परीक्षा पुनः शुरू करेंगे, आप वहीं से जारी रख सकेंगे।
              </p>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700 text-xs font-mono text-amber-300 font-bold">
                प्रतीक्षारत... (Waiting for Examiner to Resume)
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ⚠️ ANTI-CHEAT TAB SWITCH / SCREEN CHANGE ALERT MODAL */}
      <AnimatePresence>
        {showTabWarning && (
          <div className="fixed inset-0 z-[9999999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="max-w-md w-full bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 text-white text-center space-y-4 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-3xl mx-auto border border-rose-500/40">
                ⚠️
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-rose-400">स्क्रीन बदलना या टैब स्विच करना निषिद्ध है!</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  आपने परीक्षा स्क्रीन से बाहर निकलने या ऐप बदलने का प्रयास किया है। यह अलर्ट परीक्षा नियंत्रक/शिक्षक को लाइव भेज दिया गया है।
                </p>
              </div>
              <div className="p-3 bg-slate-800 rounded-2xl border border-rose-500/30 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">अब तक स्क्रीन बदली:</span>
                <span className="font-black text-rose-400 font-mono text-sm">{tabSwitches} बार</span>
              </div>
              <button
                onClick={() => setShowTabWarning(false)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-95"
              >
                समझ गया, परीक्षा जारी रखें
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📞 INCOMING CALL MODAL (Teacher calling student) */}
      <AnimatePresence>
        {incomingCall && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl border-2 border-emerald-400"
            >
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
                <div className="relative w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-lg">
                  📞
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  इनकमिंग ऑडियो कॉल
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {incomingCall.fromUserName || "शिक्षक (Teacher)"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  शिक्षक आपसे ऑडियो कॉल पर जुड़ना चाहते हैं।
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleAnswerCall}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>स्वीकार करें</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeclineCall}
                  className="py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs uppercase tracking-wider transition-all border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>अस्वीकार</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎙️ ACTIVE WEBRTC AUDIO CALL BAR */}
      {activeAudioCall && (
        <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span>🎙️ शिक्षक के साथ ऑडियो कॉल जारी है</span>
            {activeAudioCall.isMuted && <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 rounded font-bold">माइक म्यूट</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleStudentMic}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeAudioCall.isMuted ? "bg-amber-400 text-slate-900" : "bg-emerald-700 hover:bg-emerald-800 text-white"
              }`}
              title={activeAudioCall.isMuted ? "अनम्यूट करें" : "माइक म्यूट करें"}
            >
              {activeAudioCall.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleStudentHangup}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
              title="कॉल काटें"
            >
              <PhoneOff className="w-3 h-3" />
              <span>कॉल काटें</span>
            </button>
          </div>
        </div>
      )}

      {/* 📢 FLOATING BROADCAST BANNER */}
      {latestBroadcast && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 sm:px-4 py-2 flex items-center justify-between text-xs font-bold shadow-md">
          <div className="flex items-center gap-2 truncate pr-2">
            <Volume2 className="w-4 h-4 shrink-0 animate-bounce" />
            <span className="truncate">शिक्षक निर्देश: {latestBroadcast}</span>
          </div>
          <button
            onClick={() => setLatestBroadcast("")}
            className="text-white/80 hover:text-white shrink-0 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 🏛️ TOP APP BAR: Test Title, Time Remaining & Examiner Chat Trigger */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Institute / Test Info & Back Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  if (window.confirm("क्या आप वाकई परीक्षा से बाहर निकलना चाहते हैं? आपकी वर्तमान प्रगति सहेजी जा चुकी है।")) {
                    window.location.href = "/";
                  }
                }
              }}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-slate-200/80 shadow-2xs shrink-0"
              title="बाहर निकलें (Exit Exam)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">बाहर</span>
            </button>

            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-sm">
              🎓
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                {testData?.testTitle || "Live Examination"}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">
                {studentName} • रोल: <span className="font-mono text-indigo-700 font-bold">{rollNumber}</span>
              </p>
            </div>
          </div>

          {/* Right Controls: Timer, Scratchpad, Chat, Fullscreen & Submit */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Timer */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/90 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span className="text-xs sm:text-sm font-mono font-black text-amber-900 tabular-nums">
                {formattedTime}
              </span>
            </div>

            {/* ✏️ Virtual Scratchpad (Digital Rough Sheet) */}
            <button
              type="button"
              onClick={() => setShowScratchpad(true)}
              className="px-2 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="डिजिटल रफ शीट (गणित व रीजनिंग रफ वर्क)"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">रफ शीट</span>
            </button>

            {/* 💬 Chat with Teacher Button */}
            <button
              type="button"
              onClick={() => {
                setIsChatOpen(true);
                setUnreadDMs(0);
              }}
              className="px-2 sm:px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer relative shadow-2xs"
              title="शिक्षक से संपर्क करें"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">शिक्षक से पूछें</span>
              {unreadDMs > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[9px] rounded-full font-black animate-pulse">
                  {unreadDMs}
                </span>
              )}
            </button>

            {/* 🖥️ Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleStudentFullscreen}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
              title={isFullscreen ? "फुलस्क्रीन से बाहर निकलें" : "फुलस्क्रीन मोड (Fullscreen)"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Submit Button (Desktop) */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="hidden lg:flex px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              <span>सबमिट</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 💬 FLOATING CHAT BUBBLE FOR STUDENT (Direct 1-to-1 Teacher Chat) */}
      {!isChatOpen && (
        <button
          type="button"
          onClick={() => {
            setIsChatOpen(true);
            setUnreadDMs(0);
          }}
          className="fixed bottom-16 left-3 sm:bottom-4 sm:left-4 z-40 p-3.5 sm:p-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer border-2 border-white/90 group"
          title="शिक्षक से चैट करें"
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
          {unreadDMs > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black ring-2 ring-white animate-bounce shadow-md">
              {unreadDMs}
            </span>
          )}
        </button>
      )}

      {/* 📹 FLOATING PROCTOR WEBCAM PREVIEW (Collapsible) */}
      <div className="fixed bottom-16 right-3 sm:bottom-4 sm:right-4 z-40">
        <div className="w-24 h-18 sm:w-28 sm:h-20 bg-slate-950 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-xl relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 left-1.5 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${cameraActive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span className="text-[8px] font-mono font-bold text-white bg-black/60 px-1 rounded">
              {cameraActive ? "LIVE" : "PAUSED"}
            </span>
          </div>

          {!cameraActive && (
            <button
              type="button"
              onClick={() => startCamera(true)}
              className="absolute inset-0 bg-slate-950/90 text-white flex flex-col items-center justify-center p-1 text-[9px] font-bold text-center gap-1 cursor-pointer hover:bg-slate-900 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              <span>कैमरा चालू करें</span>
            </button>
          )}
        </div>
      </div>

      {/* 📝 MAIN EXAMINATION BODY */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* LEFT COLUMN (Questions & Options): 3 COLUMNS */}
        <div className="lg:col-span-3 space-y-4">
          {/* Question Card */}
          <div className="bg-white rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-sm space-y-5 relative overflow-hidden">
            {/* 🔒 Dynamic Security Anti-Leak Watermark (Anti-Screen Capture / Sharing Shield) */}
            <div className="pointer-events-none select-none absolute inset-0 overflow-hidden opacity-[0.03] flex items-center justify-center -rotate-12 z-0">
              <div className="text-center font-mono font-black text-slate-950 text-xs sm:text-base leading-relaxed tracking-wider">
                {`${studentName} • ${rollNumber || studentId} • ${studentClass || activeStudentClass || "सामान्य बैच"}`}<br/>
                {`GOVT & SCHOOL SECURE EXAM SHIELD • CONFIDENTIAL`}
              </div>
            </div>

            {/* Header: Question Number & Tags */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-black text-xs font-mono shadow-xs">
                  प्रश्न {currentIndex + 1}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  (कुल {totalQuestions} में से)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  +{currentQ?.marks || testData?.marksCorrect || 4} अंक
                </span>
                {Number(testData?.marksNegative) > 0 && (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                    -{testData?.marksNegative} गलत
                  </span>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className="py-2 relative z-10">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                {currentQ?.questionText}
              </h2>
            </div>

            {/* Options List */}
            <div className="space-y-2.5 pt-1 relative z-10">
              {currentOptionLetters.map((optLetter) => {
                const optText = currentQ?.[`option${optLetter}`] || currentQ?.options?.[optLetter.charCodeAt(0) - 65] || "";
                const isSelected = currentSelectedOpt === optLetter;

                return (
                  <button
                    key={optLetter}
                    type="button"
                    onClick={() => handleSelectOption(optLetter)}
                    disabled={isExamPaused}
                    className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer active:scale-99 ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-600 shadow-sm shadow-indigo-600/10 ring-2 ring-indigo-500/20"
                        : "bg-slate-50/70 border-slate-200/90 hover:bg-slate-100/70 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs sm:text-sm shrink-0 transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700"
                      }`}
                    >
                      {optLetter}
                    </span>
                    <span className={`text-xs sm:text-sm flex-1 font-semibold leading-snug ${isSelected ? "text-indigo-950 font-bold" : "text-slate-800"}`}>
                      {optText || `विकल्प ${optLetter}`}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action Bar inside question card (NTA / TCS-iON & School Standard) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100 relative z-10">
              <div className="flex flex-wrap items-center gap-2">
                {/* 🟣 Mark for Review & Next */}
                <button
                  type="button"
                  onClick={() => {
                    handleToggleMarkReview();
                    if (currentIndex < totalQuestions - 1) {
                      setCurrentIndex((prev) => prev + 1);
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCurrentMarked
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                  }`}
                  title="समीक्षा हेतु चिह्नित करें और आगे बढ़ें"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isCurrentMarked ? "★ रिव्यू चिह्नित (अगला)" : "समीक्षा हेतु मार्क करें (Mark for Review)"}</span>
                </button>

                {/* ⚪ Clear Response */}
                {currentSelectedOpt && (
                  <button
                    type="button"
                    onClick={handleClearResponse}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                  >
                    उत्तर हटाएं (Clear)
                  </button>
                )}
              </div>

              {/* Prev / Save & Next Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>पिछला</span>
                </button>

                {currentIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentIndex < totalQuestions - 1) {
                        setCurrentIndex((prev) => prev + 1);
                      }
                    }}
                    className="px-4.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>सुरक्षित करें व आगे बढ़ें (Save & Next)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="px-4.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>परीक्षा जमा करें (Submit)</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Question Palette Grid): NTA 5-STATE COMPLIANT (Desktop) */}
        <div className="hidden lg:block space-y-4">
          <div className="bg-white rounded-3xl p-4.5 border border-slate-200/90 shadow-sm space-y-3.5 sticky top-16">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                प्रश्न तालिका (Palette)
              </h3>
              <span className="font-mono text-indigo-600 font-bold text-xs bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                {attemptedCount}/{totalQuestions} हल
              </span>
            </div>

            {/* 5-State NTA Live Legend */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-slate-600 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5" title="उत्तर दिया गया">
                <span className="w-3 h-3 rounded bg-emerald-600 text-white flex items-center justify-center text-[7px] font-black shrink-0">✓</span>
                <span className="truncate">उत्तर दिया ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5" title="उत्तर नहीं दिया">
                <span className="w-3 h-3 rounded bg-rose-500 text-white flex items-center justify-center text-[7px] font-black shrink-0">✗</span>
                <span className="truncate">उत्तर नहीं दिया ({notAnsweredCount})</span>
              </div>
              <div className="flex items-center gap-1.5" title="समीक्षा हेतु चिह्नित (उत्तर नहीं दिया)">
                <span className="w-3 h-3 rounded bg-purple-600 text-white flex items-center justify-center text-[7px] font-black shrink-0">★</span>
                <span className="truncate">रिव्यू मात्र ({markedOnlyCount})</span>
              </div>
              <div className="flex items-center gap-1.5" title="उत्तर दिया व समीक्षा हेतु चिह्नित (मूल्यांकन में मान्य)">
                <span className="w-3 h-3 rounded bg-purple-700 text-white relative flex items-center justify-center text-[7px] font-black shrink-0">
                  ★<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5" />
                </span>
                <span className="truncate">हल + रिव्यू ({answeredAndMarkedCount})</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2 pt-0.5" title="अभी तक देखा नहीं">
                <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300 text-slate-600 flex items-center justify-center text-[7px] shrink-0">⚪</span>
                <span>देखा नहीं गया ({notVisitedCount})</span>
              </div>
            </div>

            {/* Questions Grid with 5-State Status */}
            <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
              {questions.map((_, qIdx) => {
                const isCurrent = currentIndex === qIdx;
                const status = getQuestionNtaStatus(qIdx);
                const badgeClass = getNtaBadgeStyle(status, isCurrent);

                return (
                  <button
                    key={qIdx}
                    type="button"
                    onClick={() => setCurrentIndex(qIdx)}
                    className={`h-9 rounded-xl border text-xs font-mono transition-all flex items-center justify-center cursor-pointer active:scale-95 relative ${badgeClass}`}
                  >
                    <span>{qIdx + 1}</span>
                    {status === "ANSWERED_MARKED" && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 border border-purple-900 absolute -top-0.5 -right-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <span>परीक्षा समाप्त करें (Submit)</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>

      {/* 📱 MOBILE STICKY FLOATING CONTROL BAR */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 lg:hidden flex items-center justify-between gap-1.5 shadow-lg">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-2.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none border border-slate-200"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">पिछला</span>
        </button>

        {/* ✏️ Mobile Rough Sheet Button */}
        <button
          type="button"
          onClick={() => setShowScratchpad(true)}
          className="px-2.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1 shadow-2xs"
          title="रफ शीट खोलें"
        >
          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
          <span>रफ</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMobilePalette(true)}
          className="flex-1 py-2 px-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <span>📋 Q{currentIndex + 1}/{totalQuestions}</span>
          <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-mono">{attemptedCount} हल</span>
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            type="button"
            onClick={() => {
              if (currentIndex < totalQuestions - 1) setCurrentIndex(prev => prev + 1);
            }}
            className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95"
          >
            <span>अगला</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95"
          >
            <span>जमा</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 📱 MOBILE QUESTION PALETTE DRAWER (NTA 5-STATE) */}
      <AnimatePresence>
        {showMobilePalette && (
          <div className="fixed inset-0 z-[999998] flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl max-h-[82vh] flex flex-col shadow-2xl border-t border-slate-200 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">प्रश्न तालिका (Palette)</h3>
                  <p className="text-[11px] text-slate-500 font-medium">NTA 5-State स्थिति अनुसार प्रश्न चुनें</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobilePalette(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>

              {/* 5-State Mini Legend on Mobile */}
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-1.5 text-[10px] font-bold text-slate-600">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[6px]">✓</span>
                  <span>हल: {answeredCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500 text-white flex items-center justify-center text-[6px]">✗</span>
                  <span>उत्तर नहीं: {notAnsweredCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-purple-600 text-white flex items-center justify-center text-[6px]">★</span>
                  <span>रिव्यू: {markedOnlyCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-purple-700 text-white flex items-center justify-center text-[6px]">★•</span>
                  <span>हल+रिव्यू: {answeredAndMarkedCount}</span>
                </div>
              </div>

              <div className="p-4 overflow-y-auto grid grid-cols-5 gap-2 max-h-[45vh]">
                {questions.map((_, qIdx) => {
                  const isCurrent = currentIndex === qIdx;
                  const status = getQuestionNtaStatus(qIdx);
                  const badgeClass = getNtaBadgeStyle(status, isCurrent);

                  return (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(qIdx);
                        setShowMobilePalette(false);
                      }}
                      className={`h-11 rounded-xl border text-xs font-mono transition-all flex items-center justify-center active:scale-95 relative ${badgeClass}`}
                    >
                      <span>{qIdx + 1}</span>
                      {status === "ANSWERED_MARKED" && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 border border-purple-900 absolute -top-0.5 -right-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

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

      {/* 💬 1-to-1 CHAT DRAWER WITH TEACHER */}
      <AnimatePresence>
        {isChatOpen && (
          <div className="fixed inset-0 z-[999999] flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-200 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    👨‍🏫
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">शिक्षक सहायता चैट (Examiner Desk)</h3>
                    <p className="text-[10px] text-slate-500 font-semibold">1-on-1 गोपनीय बातचीत</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold flex items-center justify-center text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar bg-slate-50/40">
                {directMessages.length === 0 ? (
                  <div className="py-20 text-center text-xs text-slate-400 font-bold space-y-1">
                    <p>💬 शिक्षक को कोई सवाल या तकनीकी समस्या पूछें।</p>
                    <p className="text-[10px] text-slate-400 font-normal">जैसे: &quot;सर, प्रश्न 3 में विकल्प स्पष्ट नहीं है&quot;</p>
                  </div>
                ) : (
                  directMessages.map((m) => {
                    const isMe = m.fromUserId === studentId || m.role === "STUDENT";

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                            isMe
                              ? "bg-indigo-600 text-white rounded-br-none shadow-xs"
                              : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs"
                          }`}
                        >
                          <span className={`text-[9px] block font-bold mb-0.5 ${isMe ? "text-indigo-200" : "text-indigo-600"}`}>
                            {isMe ? "आप (You)" : "शिक्षक (Examiner)"}
                          </span>
                          <p className="font-medium">{m.text}</p>
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

              {/* Input Form */}
              <form onSubmit={handleSendDMToTeacher} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="शिक्षक को संदेश लिखें..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎯 FINAL SUBMIT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl border border-slate-100"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mx-auto border border-indigo-100">
                📊
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">क्या आप परीक्षा समाप्त करना चाहते हैं?</h3>
                <p className="text-xs text-slate-500 font-medium">कृपया जमा करने से पहले अपनी प्रगति की समीक्षा करें:</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold block">हल किए</span>
                  <span className="text-lg font-black text-emerald-900 font-mono">{attemptedCount}</span>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="text-[10px] text-purple-700 font-bold block">रिव्यू</span>
                  <span className="text-lg font-black text-purple-900 font-mono">{reviewCount}</span>
                </div>
                <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-600 font-bold block">शेष प्रश्न</span>
                  <span className="text-lg font-black text-slate-800 font-mono">{unattemptedCount}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={performSubmission}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "जमा हो रहा है..." : "हां, परीक्षा जमा करें (Final Submit)"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  वापस जाएं (Review Questions)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ⚠️ TAB SWITCH WARNING MODAL */}
      <AnimatePresence>
        {showTabWarning && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-rose-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto border border-rose-100 animate-bounce">
                ⚠️
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-rose-600">एंटी-चीट चेतावनी (Warning)</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  आपने परीक्षा स्क्रीन छोड़ी है (टैब स्विच count: {tabSwitches})।
                  यह घटना शिक्षक के पास दर्ज हो गई है। कृपया स्क्रीन न बदलें।
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTabWarning(false)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
              >
                मैं समझ गया, परीक्षा जारी रखें
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ✏️ VIRTUAL SCRATCHPAD MODAL */}
      <VirtualScratchpadModal
        isOpen={showScratchpad}
        onClose={() => setShowScratchpad(false)}
      />
    </div>
  );
}
