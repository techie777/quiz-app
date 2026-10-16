"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSessionEngine } from '@/engine/SessionProvider';
import socketService from '@/engine/lib/socket';
import confetti from 'canvas-confetti';
import ContextualLoader from '@/components/ContextualLoader';
import ChatOverlayModal from '@/components/engine/ChatOverlayModal';
import LiveQuizPerformanceReview from '@/components/engine/LiveQuizPerformanceReview';

/**
 * TACTICAL PLAYER V3.0 - Timing & Grid Edition
 * Supporting mission timers and optimized for Desktop Sidebar layout.
 */

const playTuckSound = () => {
    try {
        if (typeof window === 'undefined') return;
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtxClass) return;
        let ctx = window.__quizAudioCtx;
        if (!ctx || ctx.state === 'closed') {
          ctx = new AudioCtxClass();
          window.__quizAudioCtx = ctx;
        }
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Solid 'Tuck' or 'Thud' sound: 150Hz -> 40Hz
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
};

const triggerHaptic = (type = 'tap') => {
  try {
    if (typeof window === 'undefined' || !window.navigator?.vibrate) return;
    if (type === 'tap') window.navigator.vibrate(15);
    else if (type === 'success') window.navigator.vibrate([25, 35, 25]);
    else if (type === 'streak') window.navigator.vibrate([20, 25, 20, 25, 45]);
    else if (type === 'fail') window.navigator.vibrate(60);
  } catch (e) {}
};

export default function QuizPlayer({ state, onLeave }) {
  const { participants, session: engineSession, sendAction, playSessionSound, chatMessages, sendReaction } = useSessionEngine();
  const [countdown, setCountdown] = useState(3);
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [comboBanner, setComboBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [isTerminatedByHost, setIsTerminatedByHost] = useState(false);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [soloModeActive, setSoloModeActive] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const lastSeenChatCountRef = useRef(0);
  const [questionHistory, setQuestionHistory] = useState([]);
  const tabSwitchesCountRef = useRef(0);
  const [cheatAlertModal, setCheatAlertModal] = useState(false);
  const isB2B = Boolean(state.isB2B || state.testCode || state.b2bRules || categoryInfo?.timingType);

  // 🛡️ B2B ANTI-CHEAT: Window Blur & Tab Switching Guard
  useEffect(() => {
    if (!isB2B || state.role === 'HOST' || finished) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        tabSwitchesCountRef.current += 1;
        setCheatAlertModal(true);
        const socket = socketService.getSocket();
        if (socket && state.sessionId && engineSession?.userId) {
          socket.emit('TAB_SWITCH_ALERT', {
            sessionId: state.sessionId,
            userId: engineSession.userId,
            userName: engineSession.userName || 'Student',
            rollNumber: state.rollNumber || (typeof window !== 'undefined' ? localStorage.getItem(`b2b_student_roll_${state.sessionId}`) : 'N/A') || 'N/A',
            switchCount: tabSwitchesCountRef.current
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [state.isB2B, state.testCode, state.role, state.sessionId, engineSession, categoryInfo, finished]);

  const questionLimit = state.questionLimit || 10;
  const setIndex = state.setIndex || 1;

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const isB2B = state.isB2B || !!state.testCode || !!state.b2bRules;
        if (isB2B) {
          const testCodeToFetch = state.testCode || state.activeContentId || state.sessionId;
          const res = await axios.get(`/api/b2b/tests/${testCodeToFetch}?role=${state.role === 'HOST' ? 'host' : 'student'}`);
          if (res.data) {
            setCategoryInfo(res.data);
            let b2bQs = res.data.questions || [];
            if (res.data.shuffleQuestions && state.role !== 'HOST') {
              const seedStr = state.rollNumber || state.userId || 'student';
              let seedNum = 0;
              for (let i = 0; i < seedStr.length; i++) seedNum += seedStr.charCodeAt(i);
              b2bQs = [...b2bQs].sort((a, b) => {
                const hA = ((a.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + seedNum) % 100;
                const hB = ((b.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + seedNum) % 100;
                return hA - hB;
              });
            }
            setQuestions(b2bQs);
          }
        } else {
          const res = await axios.get(`/api/categories/${state.activeContentId}`);
          if (res.data) setCategoryInfo(res.data);
          const allQuestions = res.data.questions || [];
          const startIndex = (setIndex - 1) * 20;
          let selected = allQuestions.slice(startIndex, startIndex + questionLimit);
          if (selected.length === 0 && allQuestions.length > 0) {
            selected = allQuestions.slice(0, questionLimit);
          }
          setQuestions(selected);
        }
      } catch (err) {
        console.error('Failed to load quiz questions:', err);
        // Fallback: check if activeContentId was a B2B test code
        try {
          const fallbackRes = await axios.get(`/api/b2b/tests/${state.activeContentId || state.sessionId}?role=student`);
          if (fallbackRes.data && !fallbackRes.data.error) {
            setCategoryInfo(fallbackRes.data);
            setQuestions(fallbackRes.data.questions || []);
            setLoading(false);
            return;
          }
        } catch (e2) {}
        toast.error('क्विज़ लोड करने में त्रुटि हुई।');
      } finally {
        setLoading(false);
      }
    };
    if (state.activeContentId || state.testCode || state.isB2B) fetchContent();
  }, [state.activeContentId, state.testCode, state.isB2B, state.role, state.rollNumber, state.userId, questionLimit, setIndex]);

  // ⚡ RECONNECTION PROGRESS RESTORATION
  const hasRestoredRef = useRef(false);
  const prevSetRef = useRef({ set: state.setIndex, cat: state.activeContentId });

  useEffect(() => {
    // If a brand new set or category is launched by host, reset state
    if (prevSetRef.current.set !== state.setIndex || prevSetRef.current.cat !== state.activeContentId) {
      setCurrentIndex(0);
      setScore(0);
      setStreak(0);
      setHighestStreak(0);
      setComboBanner(null);
      setFinished(false);
      setSelectedOption(null);
      setIsCorrect(null);
      setShowQuestions(false);
      setCountdown(3);
      setQuestionHistory([]);
      prevSetRef.current = { set: state.setIndex, cat: state.activeContentId };
      hasRestoredRef.current = false;
    }
  }, [state.setIndex, state.activeContentId]);

  useEffect(() => {
    if (!loading && questions.length > 0 && !hasRestoredRef.current && typeof window !== 'undefined' && state.sessionId) {
      const activeIdentifier = state.activeContentId || state.testCode || state.sessionId || 'exam';
      const savedKey = `quiz_prog_${state.sessionId}_${activeIdentifier}_${state.setIndex || 1}`;
      const savedScoreKey = `quiz_score_${state.sessionId}_${activeIdentifier}_${state.setIndex || 1}`;
      const savedHistKey = `quiz_hist_${state.sessionId}_${activeIdentifier}_${state.setIndex || 1}`;
      const savedStreakKey = `quiz_streak_${state.sessionId}_${activeIdentifier}_${state.setIndex || 1}`;
      
      const localProg = parseInt(localStorage.getItem(savedKey) || '-1', 10);
      const localScore = parseInt(localStorage.getItem(savedScoreKey) || '-1', 10);
      const localStreak = parseInt(localStorage.getItem(savedStreakKey) || '0', 10);
      if (localStreak > 0) setHighestStreak(localStreak);
      const savedHistRaw = localStorage.getItem(savedHistKey);
      
      if (savedHistRaw) {
        try {
          const parsed = JSON.parse(savedHistRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuestionHistory(parsed);
          }
        } catch (e) {}
      }
      
      const serverProg = typeof state.savedProgress === 'number' ? state.savedProgress : -1;
      const serverScore = typeof state.savedScore === 'number' ? state.savedScore : -1;

      const restoredProg = Math.max(localProg, serverProg);
      const restoredScore = Math.max(localScore, serverScore);

      if (restoredProg > 0 || restoredScore > 0) {
        console.log('⚡ [RECONNECT] Restoring user progress:', { restoredProg, restoredScore });
        const validIdx = Math.min(restoredProg, questions.length - 1);
        setCurrentIndex(validIdx);
        setScore(restoredScore > 0 ? restoredScore : 0);
        setCountdown(0);
        setShowQuestions(true);
        toast.success("परीक्षा सत्र बहाल किया गया! (Exam Session Restored)", { icon: "⚡" });
      }
      hasRestoredRef.current = true;
    }
  }, [loading, questions.length, state.sessionId, state.activeContentId, state.testCode, state.setIndex, state.savedProgress, state.savedScore]);

  // Persist current score and index for resilience
  useEffect(() => {
    if (state.sessionId && typeof window !== 'undefined' && !finished) {
      const activeIdentifier = state.activeContentId || state.testCode || state.sessionId || 'exam';
      const savedKey = `quiz_prog_${state.sessionId}_${activeIdentifier}_${state.setIndex || 1}`;
      const savedScoreKey = `quiz_score_${state.sessionId}_${activeIdentifier}_${state.setIndex || 1}`;
      const savedStreakKey = `quiz_streak_${state.sessionId}_${activeIdentifier}_${state.setIndex || 1}`;
      localStorage.setItem(savedKey, currentIndex.toString());
      localStorage.setItem(savedScoreKey, score.toString());
      localStorage.setItem(savedStreakKey, highestStreak.toString());
    }
  }, [currentIndex, score, highestStreak, state.sessionId, state.activeContentId, state.testCode, state.setIndex, finished]);

  useEffect(() => {
     if (!loading && questions.length > 0 && countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
     } else if (!loading && questions.length > 0 && countdown === 0) {
        setShowQuestions(true);
     }
  }, [countdown, loading, questions]);

  const [timeLeft, setTimeLeft] = useState(state.timeLimit || 0);

  // BROADCAST SCAN: Instant score/progress emission
  useEffect(() => {
    const socket = socketService.getSocket();
    if (socket && engineSession?.userId) {
        // HARDWIRE: Enforce Host submission boundary to prevent local state leaking
        const submitUserId = engineSession.userId || (engineSession.role === 'HOST' ? 'host_base_operator' : 'guest');
        socket.emit('SUBMIT_SCORE', {
            sessionId: engineSession.sessionId,
            userId: submitUserId,
            score,
            progress: currentIndex + (selectedOption ? 1 : 0)
        });
    }
  }, [score, currentIndex, engineSession, selectedOption]);


  // MISSION PULSE: Timer enforcement
  useEffect(() => {
    if (!showQuestions || finished || state.timeLimit === 0 || !!selectedOption || engineSession?.isPaused) return;

    if (timeLeft <= 0) {
        handleAnswer('TIME_EXPIRED');
        return;
    }

    // ⌚ TIC-TIC WARNING ENGINE
    if (timeLeft <= 10 && timeLeft > 0) {
        playSessionSound('tick');
    }

    const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showQuestions, finished, timeLeft, state.timeLimit, selectedOption, engineSession?.isPaused]);

  // Reset timer on question change
  useEffect(() => {
     if (state.timeLimit > 0) setTimeLeft(state.timeLimit);
  }, [currentIndex, state.timeLimit]);

  const currentQuestion = questions[currentIndex];
  const shuffledCurrentOptions = useMemo(() => {
    if (!currentQuestion || !Array.isArray(currentQuestion.options)) return [];
    const opts = [...currentQuestion.options];
    const seedStr = String(currentQuestion.id || currentQuestion.text || '') + String(engineSession?.sessionId || '');
    let hash = 0;
    for (let k = 0; k < seedStr.length; k++) {
      hash = ((hash << 5) - hash) + seedStr.charCodeAt(k);
      hash |= 0;
    }
    let seedNum = Math.abs(hash) || 1;
    const seededRandom = () => {
      const x = Math.sin(seedNum++) * 10000;
      return x - Math.floor(x);
    };

    const indices = opts.map((_, i) => i);
    const shuffled = [...indices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.map(idx => opts[idx]);
  }, [currentQuestion, engineSession?.sessionId]);

  const handleAnswer = (option) => {
    if (selectedOption || engineSession?.isPaused) return;
    const currentQuestion = questions[currentIndex];
    setSelectedOption(option);
    const isSkipped = option === 'TIME_EXPIRED';
    const cleanOption = typeof option === 'string' ? option.trim() : option;
    const cleanCorrect = typeof currentQuestion?.correctAnswer === 'string' ? currentQuestion.correctAnswer.trim() : currentQuestion?.correctAnswer;
    const correct = !isSkipped && cleanOption === cleanCorrect;
    setIsCorrect(correct);

    const isB2B = state.isB2B || !!state.testCode || !!categoryInfo?.timingType;
    const marksCorrect = isB2B ? Number(categoryInfo?.marksCorrect || 4) : 1;
    const marksNegative = isB2B ? Number(categoryInfo?.marksNegative || 0) : 0;

    const timeSpent = state.timeLimit ? Math.max(1, state.timeLimit - timeLeft) : null;
    const isFast = state.timeLimit > 0 && timeSpent !== null && timeSpent <= 3;

    if (correct) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        setHighestStreak(prev => {
          const updated = Math.max(prev, nextStreak);
          if (typeof window !== 'undefined' && state.sessionId) {
            const streakKey = `quiz_streak_${state.sessionId}_${state.activeContentId || 'cat'}_${state.setIndex || 1}`;
            localStorage.setItem(streakKey, updated.toString());
          }
          return updated;
        });

        if (nextStreak >= 2) {
          triggerHaptic('streak');
          setComboBanner(nextStreak >= 5 ? `🔥 ${nextStreak}x MEGA COMBO!` : `🔥 ${nextStreak}x STREAK!`);
          if (nextStreak >= 3) {
            confetti({
              particleCount: 16,
              spread: 60,
              origin: { y: 0.6 }
            });
          }
        } else {
          triggerHaptic('success');
          if (isFast) {
            setComboBanner('⚡ SPEED BONUS!');
          }
        }

        setScore(s => s + marksCorrect);
        playSessionSound('success');
    } else {
        setStreak(0);
        setComboBanner(null);
        if (marksNegative > 0 && !isSkipped) {
          setScore(s => s - marksNegative);
        }
        triggerHaptic('fail');
        playSessionSound('fail');
    }

    // 📋 LIVE HISTORY RECORDING: Immediately record question result
    if (currentQuestion) {
      const historyItem = {
        index: currentIndex,
        questionNumber: currentIndex + 1,
        questionText: currentQuestion.questionText || currentQuestion.question || currentQuestion.text,
        options: currentQuestion.options || [],
        selectedOption: isSkipped ? null : option,
        correctAnswer: currentQuestion.correctAnswer || null,
        isSkipped,
        isCorrect: correct,
        status: isSkipped ? 'skipped' : (correct ? 'correct' : 'incorrect'),
        difficulty: currentQuestion.difficulty || 'medium',
        explanation: currentQuestion.explanation || currentQuestion.explanationHi || null,
        timeTaken: timeSpent
      };

      setQuestionHistory(prev => {
        const filtered = prev.filter(item => item.index !== currentIndex);
        const updated = [...filtered, historyItem];
        if (typeof window !== 'undefined' && state.sessionId) {
          const activeIdentifier = state.activeContentId || state.testCode || state.sessionId || 'exam';
          const histKey = `quiz_hist_${state.sessionId}_${activeIdentifier}_${state.setIndex || 1}`;
          localStorage.setItem(histKey, JSON.stringify(updated));
        }
        return updated;
      });
    }

    // 📡 LIVE EXAM TELEMETRY PULSE
    if (isB2B) {
      const socket = socketService.getSocket();
      if (socket) {
        const calculatedScore = correct ? (score + marksCorrect) : ((marksNegative > 0 && !isSkipped) ? (score - marksNegative) : score);
        socket.emit('STUDENT_TELEMETRY', {
          sessionId: state.sessionId,
          userId: engineSession?.userId || state.userId,
          rollNumber: state.rollNumber || (typeof window !== 'undefined' ? localStorage.getItem(`b2b_student_roll_${state.sessionId}`) : 'N/A') || 'N/A',
          currentIndex,
          selectedOption: isSkipped ? null : option,
          tabSwitches: tabSwitchesCountRef.current,
          score: calculatedScore,
          isSubmitted: false
        });
      }
    }

    setTimeout(() => {
        setComboBanner(null);
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsCorrect(null);
        } else {
            if (isB2B) {
              submitB2bExam();
            } else {
              setFinished(true);
              const socket = socketService.getSocket();
              if (socket && engineSession?.userId) {
                  socket.emit('UPDATE_STATUS', {
                      sessionId: engineSession.sessionId,
                      userId: engineSession.userId,
                      status: 'DONE'
                  });
              }
            }
        }
    }, 1200);
  };

  const submitB2bExam = async () => {
    try {
      const testCode = state.testCode || state.activeContentId || state.sessionId;
      const res = await axios.post(`/api/b2b/tests/${testCode}/submit`, {
        studentId: engineSession?.userId || state.userId,
        studentName: engineSession?.userName || state.userName,
        rollNumber: state.rollNumber || (typeof window !== 'undefined' ? localStorage.getItem(`b2b_student_roll_${state.sessionId}`) : 'N/A') || 'N/A',
        answers: questionHistory,
        tabSwitches: tabSwitchesCountRef.current
      });
      if (res.data?.success && res.data?.result) {
        setScore(res.data.result.totalScore);
        if (res.data.result.evaluatedQuestions) {
          setQuestionHistory(res.data.result.evaluatedQuestions);
        }
      }
    } catch (e) {
      console.error("Evaluation error:", e);
    }
    setFinished(true);
    const socket = socketService.getSocket();
    if (socket && state.sessionId) {
      socket.emit('UPDATE_STATUS', {
        sessionId: state.sessionId,
        userId: engineSession?.userId || state.userId,
        status: 'DONE'
      });
      socket.emit('SUBMIT_EXAM', {
        sessionId: state.sessionId,
        userId: engineSession?.userId || state.userId,
        userName: engineSession?.userName || state.userName,
        rollNumber: state.rollNumber || (typeof window !== 'undefined' ? localStorage.getItem(`b2b_student_roll_${state.sessionId}`) : 'N/A') || 'N/A',
        answers: questionHistory,
        totalScore: score,
        accuracy: questionHistory.length > 0 ? Math.round((questionHistory.filter(q => q.isCorrect).length / questionHistory.length) * 100) : 0,
        completedAt: Date.now()
      });
    }
  };

  // ⌨️ DESKTOP SHORTCUT ENGINE: A/B/C/D or 1/2/3/4 for rapid answering
  useEffect(() => {
    if (!showQuestions || finished || selectedOption || engineSession?.isPaused) return;

    const handleKeyDown = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA' || e.target?.isContentEditable) return;
      const key = (e.key || '').toUpperCase();
      let optIdx = -1;
      if (key === 'A' || key === '1') optIdx = 0;
      else if (key === 'B' || key === '2') optIdx = 1;
      else if (key === 'C' || key === '3') optIdx = 2;
      else if (key === 'D' || key === '4') optIdx = 3;

      if (optIdx >= 0 && optIdx < shuffledCurrentOptions.length) {
        triggerHaptic('tap');
        playSessionSound('click');
        handleAnswer(shuffledCurrentOptions[optIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQuestions, finished, selectedOption, engineSession?.isPaused, shuffledCurrentOptions]);

  // 🎉 CELEBRATION PROTOCOL
  useEffect(() => {
    if (finished) {
        playSessionSound('success');
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#4f46e5', '#818cf8', '#ffffff']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#4f46e5', '#818cf8', '#ffffff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    }
  }, [finished]);

  // 📢 HOST TERMINATION WATCHER: Inform participants and ensure results are visible to all
  useEffect(() => {
    const isTerminated = engineSession?.status === 'TERMINATED' || state?.status === 'TERMINATED';
    if (!isTerminated) return;

    setIsTerminatedByHost(true);

    const isHostRole = engineSession?.role === 'HOST' || state?.role === 'HOST';

    if (isHostRole) {
      // Host always immediately sees Results
      setFinished(true);
      setShowTerminationModal(false);
      return;
    }

    // Participant logic:
    // If already finished or already in solo continuation mode, don't interrupt with modal
    if (finished || soloModeActive) {
      return;
    }

    // Prompt participant with choices: View Results, Continue Solo, or Quit
    setShowTerminationModal(true);
  }, [engineSession?.status, state?.status, engineSession?.role, state?.role, finished, soloModeActive]);

  const handleViewResultsOnTermination = () => {
    setShowTerminationModal(false);
    setFinished(true);
    playSessionSound('success');
    const socket = socketService.getSocket();
    if (socket && engineSession?.userId) {
      socket.emit('UPDATE_STATUS', {
        sessionId: engineSession.sessionId,
        userId: engineSession.userId,
        status: 'DONE'
      });
    }
  };

  const handleContinueSoloOnTermination = () => {
    setShowTerminationModal(false);
    setSoloModeActive(true);
    toast.success('आप अकेले क्विज़ पूरा कर रहे हैं। शुभकामनाएं! 🎯', { duration: 3500 });
  };

  const handleQuitOnTermination = () => {
    setShowTerminationModal(false);
    if (onLeave) {
      onLeave();
    } else {
      window.location.href = '/quizzes';
    }
  };

  // 💬 CHAT UNREAD & NOTIFICATION ENGINE
  useEffect(() => {
    if (!chatMessages) return;
    if (isChatOpen) {
      lastSeenChatCountRef.current = chatMessages.length;
      setUnreadChatCount(0);
    } else {
      const diff = chatMessages.length - lastSeenChatCountRef.current;
      if (diff > 0) {
        setUnreadChatCount(diff);
      }
    }
  }, [chatMessages?.length, isChatOpen]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setUnreadChatCount(0);
    lastSeenChatCountRef.current = chatMessages?.length || 0;
  };

  const scoreboard = useMemo(() => {
     const rawList = (participants || []).map(p => {
        // HARDWIRE: Prevent UI identity bleeding
        const isActuallyYou = engineSession?.role === 'HOST' ? p?.role === 'HOST' : p?.userId === engineSession?.userId;
        const isOffline = p?.isOnline === false || p?.status === 'offline';
        
        return {
           ...p,
           isYou: isActuallyYou,
           displayName: isActuallyYou ? `${p?.userName || 'Operator'} (You)` : (p?.userName || 'Operator'),
           isDone: (p?.progress >= questionLimit) || p?.status === 'DONE',
           status: isOffline ? 'LEFT' : (p?.status || 'ACTIVE')
        };
     });
     
     if (!rawList.find(p => p.isYou)) {
        rawList.push({ 
            userId: engineSession?.userId || 'temp',
            userName: engineSession?.userName || 'Quiz Master', 
            displayName: `${engineSession?.userName || 'Quiz Master'} (You)`,
            score, progress: currentIndex, role: engineSession?.role, isYou: true, isOnline: true,
            status: finished ? 'DONE' : 'ACTIVE'
        });
     }

     const seen = new Set();
     let hostSeen = false;
     const list = [];

     for (const item of rawList) {
        if (!item || item.isOnline === false || item.status === 'offline' || item.status === 'LEFT' || item.status === 'KICKED' || item.status === 'AWAY') continue;
        const key = item.userId || item.userName;
        if (item.role === 'HOST') {
           if (hostSeen) continue;
           hostSeen = true;
        }
        if (seen.has(key)) continue;
        seen.add(key);
        list.push(item);
     }

     return list.sort((a,b) => (b.score || 0) - (a.score || 0));
  }, [participants, engineSession, score, currentIndex, questionLimit, finished]);

  if (loading) return <ContextualLoader type="questions" />;

  if (!loading && questions.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-6 max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-100 shadow-xl animate-in zoom-in duration-300">
             <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-3xl mx-auto">⚠️</div>
             <div className="space-y-2">
                 <h3 className="text-xl font-black text-slate-900 uppercase">कोई प्रश्न नहीं मिला (No Questions Found)</h3>
                 <p className="text-xs text-slate-500 font-bold leading-relaxed">
                     इस श्रेणी या सेट में अभी प्रश्न लोड नहीं हो सके। कृपया दूसरा विषय चुनें।
                 </p>
             </div>
             {engineSession?.role === 'HOST' ? (
                 <button 
                     onClick={() => sendAction('TERMINATE', { status: 'LOBBY' })}
                     className="px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md cursor-pointer"
                 >
                     लॉबी में वापस जाएं (Back to Lobby) 🔄
                 </button>
             ) : (
                 <button 
                     onClick={onLeave}
                     className="px-6 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all cursor-pointer"
                 >
                     रूम से बाहर निकलें (Exit Room) 🚪
                 </button>
             )}
        </div>
    );
  }

  if (!showQuestions) {
    return (
      <div className="py-12 sm:py-16 px-4 flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in-95 duration-400">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
          <span>लाइव मुकाबला शुरू हो रहा है</span>
        </div>

        <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center my-2">
          {/* Ambient Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/15 to-indigo-500/10 blur-xl animate-pulse"></div>
          
          {/* SVG Circular Ring */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-slate-100"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-indigo-600 transition-all duration-700 ease-out"
              strokeWidth="6"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * Math.max(1, countdown || 1)) / 3}
            />
          </svg>

          {/* Center Number with Spring Scale */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span 
              key={countdown} 
              className="text-5xl sm:text-6xl font-black text-indigo-600 tabular-nums animate-in zoom-in-50 duration-300 drop-shadow-xs"
            >
              {countdown}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">सेकंड</span>
          </div>
        </div>

        <div className="space-y-1 max-w-sm">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            तैयार हो जाइए! (Get Ready)
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-relaxed">
            पहला सवाल स्क्रीन पर आ रहा है... गति और सटीकता से जवाब दें!
          </p>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-1.5 pt-1">
          {[3, 2, 1].map((step) => (
            <span
              key={step}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                (countdown || 0) <= step
                  ? 'w-5 bg-indigo-600'
                  : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  const StatusBadge = ({ status }) => {
    const colors = {
        ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
        BUSY: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        LEFT: 'bg-red-500/10 text-red-400 border-red-500/20',
        DONE: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        KICKED: 'bg-red-700/10 text-red-500 border-red-700/20'
    };
    const labels = { ACTIVE: 'Active', BUSY: 'Busy', LEFT: 'Left 💀', DONE: 'Finished', KICKED: 'Kicked Off' };
    const dotColors = { ACTIVE: 'bg-green-500', BUSY: 'bg-orange-500 animate-pulse', LEFT: 'bg-red-600', DONE: 'bg-indigo-500', KICKED: 'bg-red-800' };

    return (
       <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${colors[status] || colors.ACTIVE}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors.ACTIVE}`}></span>
          <span className="text-[7px] font-black uppercase tracking-tighter">{labels[status] || 'Active'}</span>
       </div>
    );
  };

  const handleNextSet = () => {
    sendAction('START_SESSION', { 
        ...state,
        setIndex: (state.setIndex || 1) + 1,
        status: 'ACTIVE'
    });
  };

  const handleBackToLobby = () => {
    sendAction('RESET_TO_LOBBY', { status: 'LOBBY', type: null, activeContentId: null });
  };

  const handleShareResults = () => {
    const accuracy = Math.round((score / questionLimit) * 100);
    const roomCode = engineSession?.sessionId || state?.sessionId || 'BATTLE';
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://quizweb.com';
    const roomUrl = `${currentOrigin}/live/${roomCode}`;
    const shareText = `🏆 लाइव क्विज़ मुकाबला समाप्त!\n━━━━━━━━━━━━━━\n📊 मेरा स्कोर: ${score}/${questionLimit} (${accuracy}% सटीकता)\n🔥 उच्चतम स्ट्रीक: ${highestStreak > 1 ? `${highestStreak}x` : '1x'}\n📍 रूम कोड: ${roomCode}\n━━━━━━━━━━━━━━\nक्या आप मेरा स्कोर तोड़ सकते हैं? अभी खेलें:\n${roomUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'लाइव क्विज़ बैटल परिणाम',
        text: shareText,
        url: roomUrl
      }).catch(() => {});
    } else {
      try {
        navigator.clipboard.writeText(shareText);
        toast.success('परिणाम कॉपी हो गया! व्हाट्सएप या टेलीग्राम पर शेयर करें 📋', { duration: 3500 });
      } catch (e) {}
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
    }
  };

  const userPlayer = scoreboard.find(p => p.isYou) || { displayName: 'आप (You)', userName: 'आप', score: score };
  const rivalPlayer = scoreboard.find(p => !p.isYou) || null;

  return (
    <div className="px-1.5 sm:px-5 md:px-6 pt-0 sm:pt-4 pb-4 sm:pb-6 space-y-2 sm:space-y-4 animate-in fade-in duration-500">
      
      {/* 💬 LIVE STATUS & QUICK CHAT BAR: Clean, prominent bar with live player count & blinking unread chat */}
      {!finished && (
        <div className="flex items-center justify-between px-1 py-0.5 text-xs gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-600 font-bold bg-slate-100/90 px-2.5 py-1.5 rounded-xl border border-slate-200/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>👥 {scoreboard.length} खिलाड़ी लाइव</span>
            </div>
            {streak >= 2 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-xs animate-bounce">
                <span>🔥</span>
                <span>{streak}x Combo</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Quick Floating Emojis Tray */}
            <div className="hidden xs:flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60">
              {['🔥', '👏', '🎯', '❤️'].map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap');
                    sendReaction(em);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white active:scale-90 transition-all text-sm cursor-pointer"
                  title={`रिएक्शन भेजें ${em}`}
                >
                  {em}
                </button>
              ))}
            </div>

            <button
              type="button"
              data-chat-toggle="true"
              onClick={handleOpenChat}
              className={`relative inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer border shadow-2xs ${
                unreadChatCount > 0
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/25 animate-pulse"
                  : "bg-indigo-50 hover:bg-indigo-100/90 text-indigo-700 border-indigo-200/80"
              }`}
              title="लाइव चैट खोलें (Open Live Chat)"
            >
              <span className="text-sm">💬</span>
              <span>लाइव चैट</span>
              {unreadChatCount > 0 ? (
                <span className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80"></span>
                  <span className="relative inline-flex items-center justify-center bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] shadow-xs">
                    {unreadChatCount > 9 ? "9+" : unreadChatCount}
                  </span>
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      )}

      {finished ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-6 animate-in zoom-in duration-500">
              <div className="text-center space-y-1">
                 <div className={`inline-block px-3 py-1 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${
                   isTerminatedByHost ? 'bg-amber-500' : 'bg-emerald-500'
                 }`}>
                   {isTerminatedByHost ? 'होस्ट द्वारा समाप्त (Concluded Early)' : 'क्विज़ समाप्त (Quiz Complete)'}
                 </div>
                 <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                   मुकाबले का परिणाम (Results)
                 </h2>
                 <p className="text-xs sm:text-sm font-semibold text-slate-500">
                   {isTerminatedByHost 
                     ? 'होस्ट ने यह लाइव मुकाबला समाप्त किया है। यहाँ सभी खिलाड़ियों के स्कोर हैं:' 
                     : 'सभी प्रश्न पूरे हो चुके हैं। यहाँ आपका अंतिम प्रदर्शन है:'}
                 </p>
              </div>

              {/* 🏆 OLYMPIC 3D VICTORY PODIUM (When 2 or more participants) */}
              {scoreboard.length >= 2 && (
                <div className="w-full max-w-xl mx-auto bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-5 sm:p-6 text-white border border-indigo-500/30 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-indigo-500 to-purple-500" />
                  <div className="text-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                      🏆 विक्ट्री पोडियम (Victory Podium)
                    </span>
                  </div>

                  <div className="flex items-end justify-center gap-2 sm:gap-3 pt-3 pb-1 px-1">
                    {/* 2nd Place (Silver) */}
                    {scoreboard[1] && (
                      <div className="flex flex-col items-center flex-1 max-w-[110px] animate-in slide-in-from-bottom-4 duration-500">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-500 border-2 border-slate-200 flex items-center justify-center text-sm font-black text-slate-900 shadow-lg relative -mb-2 z-10">
                          {scoreboard[1].userName?.[0] || '2'}
                          <span className="absolute -top-2 -right-1 text-sm sm:text-base">🥈</span>
                        </div>
                        <span className="text-[11px] sm:text-xs font-black text-slate-200 truncate max-w-full mt-3 leading-tight text-center">
                          {scoreboard[1].displayName}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                          {scoreboard[1].score || 0} अंक
                        </span>
                        <div className="w-full h-16 sm:h-20 bg-gradient-to-b from-slate-700/80 to-slate-850 rounded-t-2xl border-t-2 border-slate-400/50 flex flex-col items-center justify-start pt-1.5 mt-1.5 shadow-inner">
                          <span className="text-base sm:text-lg font-black text-slate-300">2</span>
                        </div>
                      </div>
                    )}

                    {/* 1st Place (Gold, Tallest) */}
                    {scoreboard[0] && (
                      <div className="flex flex-col items-center flex-1 max-w-[125px] -mt-3 animate-in slide-in-from-bottom-6 duration-700">
                        <div className="text-lg sm:text-xl animate-bounce mb-0.5">👑</div>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 border-2 border-amber-200 flex items-center justify-center text-base sm:text-lg font-black text-amber-950 shadow-xl shadow-amber-500/25 relative -mb-2 z-10 ring-4 ring-amber-400/20">
                          {scoreboard[0].userName?.[0] || '1'}
                          <span className="absolute -top-2 -right-1 text-base sm:text-lg">🥇</span>
                        </div>
                        <span className="text-xs sm:text-sm font-black text-amber-300 truncate max-w-full mt-3 leading-tight text-center">
                          {scoreboard[0].displayName}
                        </span>
                        <span className="text-[11px] sm:text-xs font-black text-amber-200 tabular-nums">
                          {scoreboard[0].score || 0} अंक
                        </span>
                        <div className="w-full h-24 sm:h-28 bg-gradient-to-b from-amber-500/40 via-amber-600/20 to-slate-900 rounded-t-2xl border-t-2 border-amber-400 flex flex-col items-center justify-start pt-1.5 mt-1.5 shadow-inner">
                          <span className="text-lg sm:text-xl font-black text-amber-400">1</span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-amber-300/80">विजेता</span>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place (Bronze) */}
                    {scoreboard[2] && (
                      <div className="flex flex-col items-center flex-1 max-w-[110px] animate-in slide-in-from-bottom-2 duration-400">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 border-2 border-amber-600 flex items-center justify-center text-sm font-black text-white shadow-lg relative -mb-2 z-10">
                          {scoreboard[2].userName?.[0] || '3'}
                          <span className="absolute -top-2 -right-1 text-sm sm:text-base">🥉</span>
                        </div>
                        <span className="text-[11px] sm:text-xs font-black text-slate-300 truncate max-w-full mt-3 leading-tight text-center">
                          {scoreboard[2].displayName}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                          {scoreboard[2].score || 0} अंक
                        </span>
                        <div className="w-full h-12 sm:h-16 bg-gradient-to-b from-amber-900/60 to-slate-900 rounded-t-2xl border-t-2 border-amber-700/60 flex flex-col items-center justify-start pt-1.5 mt-1.5 shadow-inner">
                          <span className="text-sm sm:text-base font-black text-amber-600">3</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl px-2">
                 <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-center shadow-xl text-white flex flex-col items-center justify-center space-y-2">
                     <p className="text-xs font-black uppercase tracking-widest text-indigo-200">आपका स्कोर</p>
                     <p className="text-5xl font-black tabular-nums">{score} <span className="text-2xl font-bold text-indigo-200">/ {questionLimit}</span></p>
                     <p className="text-sm font-bold text-indigo-100">सफलता दर: {Math.round((score / questionLimit) * 100)}%</p>
                     {highestStreak > 1 && (
                       <span className="text-[11px] bg-amber-400/20 text-amber-200 border border-amber-400/30 px-3 py-1 rounded-full font-black mt-1">
                         🔥 उच्चतम स्ट्रीक: {highestStreak}x
                       </span>
                     )}
                     {isTerminatedByHost && (
                       <span className="text-[11px] bg-white/20 px-3 py-1 rounded-full font-bold mt-1 text-white/95">
                         {currentIndex + 1} में से {score} सही उत्तर
                       </span>
                     )}
                 </div>

                 <div className="bg-slate-50 rounded-3xl border border-slate-200/80 p-4 space-y-2.5 max-h-[260px] overflow-y-auto custom-scrollbar">
                     <p className="text-xs font-black text-slate-400 uppercase px-1">खिलाड़ी रैंकिंग (Standings)</p>
                     {scoreboard.map((p, i) => (
                         <div key={p.userId || i} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                             p.isYou ? 'bg-indigo-50/80 border-indigo-300 shadow-xs' : 'bg-white border-slate-100'
                         }`}>
                             <div className="flex items-center gap-2.5">
                                 <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                                     i === 0 ? 'bg-amber-400 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                                 }`}>
                                   {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                 </div>
                                 <div>
                                     <p className="text-xs font-black text-slate-900 leading-tight">
                                       {p.displayName}
                                     </p>
                                     <div className="flex items-center gap-1 mt-0.5">
                                         <StatusBadge status={p.status} />
                                     </div>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <p className="text-base font-black text-indigo-600 tabular-nums">{p.score || 0}</p>
                                 <p className="text-[9px] font-bold text-slate-400">अंक</p>
                             </div>
                         </div>
                     ))}
                 </div>
              </div>

              {engineSession?.role === 'HOST' ? (
                 <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                     <button 
                       type="button"
                       onClick={handleShareResults} 
                       className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-emerald-200 cursor-pointer flex items-center gap-1.5"
                       title="व्हाट्सएप / सोशल मीडिया पर शेयर करें"
                     >
                        <span>📤</span>
                        <span>परिणाम शेयर करें (Share Result)</span>
                     </button>
                     <button 
                       type="button"
                       onClick={handleNextSet} 
                       className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-200 cursor-pointer"
                     >
                        अगला सेट खेलें (Next Set) 🚀
                     </button>
                     <button 
                       type="button"
                       onClick={handleBackToLobby} 
                       className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md cursor-pointer"
                     >
                        लॉबी में वापस जाएं (Lobby) 🔄
                     </button>
                     <button 
                       type="button"
                       onClick={() => window.location.href = '/arena'} 
                       className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 border border-slate-200 cursor-pointer"
                     >
                        एरीना होम (Arena) 🏠
                     </button>
                 </div>
              ) : (
                 <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full max-w-lg px-4">
                     <button 
                       type="button"
                       onClick={handleShareResults} 
                       className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-emerald-200 cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center"
                       title="व्हाट्सएप / सोशल मीडिया पर शेयर करें"
                     >
                        <span>📤</span>
                        <span>परिणाम शेयर करें (Share Result)</span>
                     </button>
                     {isTerminatedByHost && currentIndex < questions.length - 1 && (
                       <button 
                         type="button"
                         onClick={() => {
                           setFinished(false);
                           setSoloModeActive(true);
                           toast.success('क्विज़ पुनः शुरू की गई! 🎯');
                         }} 
                         className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-indigo-200 cursor-pointer flex items-center gap-1.5"
                       >
                          <span>▶️</span>
                          <span>अकेले पूरा करें (Finish Quiz Solo)</span>
                       </button>
                     )}
                     {!isTerminatedByHost && (
                       <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200/80 text-indigo-700 px-4 py-2.5 rounded-2xl text-xs font-bold animate-pulse text-center w-full sm:w-auto justify-center">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping shrink-0"></span>
                          <span>होस्ट के अगले राउंड शुरू करने की प्रतीक्षा है...</span>
                       </div>
                     )}
                     <button 
                       type="button"
                       onClick={() => {
                         if (onLeave) onLeave();
                         else window.location.href = '/arena';
                       }} 
                       className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 border border-slate-200 cursor-pointer flex items-center gap-1.5 shadow-xs w-full sm:w-auto justify-center"
                     >
                        <span>🚪</span>
                        <span>रूम से बाहर निकलें (Leave Room)</span>
                     </button>
                     <button 
                       type="button"
                       onClick={() => window.location.href = '/'} 
                       className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs w-full sm:w-auto justify-center"
                     >
                        <span>🏠</span>
                        <span>होम पेज</span>
                     </button>
                 </div>
              )}

              {/* 📊 COMPLETE SUMMARY & QUESTIONS REVIEW AT END OF QUIZ */}
              <div className="w-full max-w-4xl mx-auto pt-3">
                <LiveQuizPerformanceReview
                  questionHistory={questionHistory}
                  totalQuestions={questionLimit}
                  currentIndex={currentIndex}
                  sessionData={{ ...state, ...engineSession }}
                  categoryInfo={categoryInfo}
                  allQuestions={questions}
                  score={score}
                  highestStreak={highestStreak}
                />
              </div>
          </div>
      ) : (
         <div className="space-y-3 sm:space-y-4">
            
            {/* 🎯 SOLO CONTINUATION BANNER */}
            {soloModeActive && (
              <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-50 border border-emerald-200/90 rounded-2xl text-emerald-800 text-xs font-bold shadow-xs animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>🎯 सोलो मोड: आप यह क्विज़ अकेले पूरा कर रहे हैं</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFinished(true)}
                  className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-xl font-black transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  परिणाम देखें 📊
                </button>
              </div>
            )}

            {/* ⚔️ B2B EXAM CBT HEADER vs LIVE DUEL HEADER */}
            {isB2B ? (
              <div className="bg-white rounded-2xl p-3 sm:p-3.5 text-slate-800 shadow-sm flex flex-wrap items-center justify-between border border-slate-200/90 gap-3 select-none relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
                
                {/* Student Profile & Roll */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-xs">
                    {userPlayer.userName?.[0] || 'S'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-black truncate max-w-[140px] text-slate-900 leading-tight">
                      {userPlayer.userName || 'Student'}
                    </span>
                    <span className="text-[10px] text-indigo-700 font-mono font-bold">
                      रोल: {state.rollNumber || (typeof window !== 'undefined' ? localStorage.getItem(`b2b_student_roll_${state.sessionId}`) : 'N/A') || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Center: Test Info & Question Counter */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] sm:text-xs font-black text-slate-700 tabular-nums bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    प्रश्न {currentIndex + 1} / {questions.length}
                  </span>
                  {state.timeLimit > 0 && (
                    <span className={`text-[11px] sm:text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1 tabular-nums ${
                      timeLeft <= 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      <span>⏳</span>
                      <span>{timeLeft}s</span>
                    </span>
                  )}
                </div>

                {/* Right: Marking Scheme Badge (+4 / -1) */}
                <div className="flex items-center gap-1.5 shrink-0 text-right">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    +{categoryInfo?.marksCorrect || 4}
                  </span>
                  {(categoryInfo?.marksNegative > 0) && (
                    <span className="text-[10px] sm:text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      -{categoryInfo?.marksNegative}
                    </span>
                  )}
                  <div className="ml-1 pl-2 border-l border-slate-200">
                    <span className="text-xs font-black text-slate-800 tabular-nums">
                      {score} <span className="text-[9px] text-slate-500 font-bold">अंक</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-slate-950 via-[#0f172a] to-slate-950 rounded-2xl p-2.5 sm:p-3 text-white shadow-xl flex items-center justify-between border border-indigo-500/30 gap-2 select-none relative overflow-hidden">
                {/* Subtle top neon accent line */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-indigo-500 via-amber-400 to-purple-500" />

                {/* Player 1: You */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 border border-indigo-400/50 flex items-center justify-center font-black text-xs text-white shadow-md shadow-indigo-500/25 shrink-0">
                    {userPlayer.userName?.[0] || 'आप'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] sm:text-xs font-black truncate max-w-[80px] sm:max-w-[120px] text-indigo-200 leading-tight">
                      {userPlayer.userName || 'आप'}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs sm:text-sm font-black text-white whitespace-nowrap leading-tight tabular-nums">
                        {score} <span className="text-[9px] font-bold text-indigo-300">अंक</span>
                      </span>
                      {streak >= 2 && (
                        <span className="text-[9px] sm:text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.2 rounded-md shadow-xs animate-bounce flex items-center gap-0.5">
                          <span>🔥</span>
                          <span>{streak}x</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center: VS Badge + Progress + Timer */}
                <div className="flex flex-col items-center px-1 shrink-0">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="text-[10px] sm:text-xs font-black bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 px-2 py-0.5 rounded-lg shadow-xs whitespace-nowrap">
                      ⚔️ VS
                    </span>
                    <span className="text-[11px] sm:text-xs font-black text-slate-200 tabular-nums whitespace-nowrap bg-white/10 px-1.5 py-0.5 rounded-md">
                      Q {currentIndex + 1}/{questionLimit}
                    </span>
                    {state.timeLimit > 0 && (
                      <span className={`text-[11px] sm:text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-1 whitespace-nowrap ${
                        timeLeft <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-amber-300 border border-amber-400/20'
                      }`}>
                        <span>⏳</span>
                        <span>{timeLeft}s</span>
                      </span>
                    )}
                  </div>

                  {/* Step indicator dots */}
                  <div className="flex items-center gap-0.5 sm:gap-1 mt-1">
                    {Array.from({ length: Math.min(questionLimit, 10) }).map((_, stepIdx) => (
                      <span
                        key={stepIdx}
                        className={`h-1 rounded-full transition-all ${
                          stepIdx < currentIndex
                            ? 'w-2 bg-emerald-400'
                            : stepIdx === currentIndex
                            ? 'w-3 bg-amber-400 animate-pulse'
                            : 'w-1 bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Player 2: Rival / Leader (Symmetric to Player 1) */}
                <div className="flex items-center gap-2 justify-end min-w-0 flex-1 text-right">
                  <div className="flex flex-col min-w-0 items-end">
                    <span className="text-[11px] sm:text-xs font-black truncate max-w-[80px] sm:max-w-[120px] text-purple-200 leading-tight">
                      {rivalPlayer ? rivalPlayer.userName : 'प्रतिद्वंद्वी'}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-white whitespace-nowrap leading-tight mt-0.5 tabular-nums">
                      {rivalPlayer ? (rivalPlayer.score || 0) : 0} <span className="text-[9px] font-bold text-purple-300">अंक</span>
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 border border-purple-400/50 flex items-center justify-center font-black text-xs text-white shadow-md shadow-purple-500/25 shrink-0">
                    {rivalPlayer ? (rivalPlayer.userName?.[0] || '⚔️') : '⚔️'}
                  </div>
                </div>
              </div>
            )}

            {/* 📋 B2B CBT QUESTION PALETTE */}
            {isB2B && questions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <span>📋</span>
                    <span>प्रश्न तालिका (Question Palette)</span>
                    <span className="text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2 py-0.2 rounded-md font-mono">
                      {questionHistory.filter(h => !h.isSkipped && h.selectedOption).length}/{questions.length} हल किए
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> हल किया</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600"></span> सक्रिय</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200"></span> शेष</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-0.5">
                  {questions.map((_, qIdx) => {
                    const isAnswered = questionHistory.some(h => h.index === qIdx && !h.isSkipped && h.selectedOption);
                    const isActive = qIdx === currentIndex;
                    return (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => {
                          if (!selectedOption) {
                            setCurrentIndex(qIdx);
                          }
                        }}
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50 shadow-xs' 
                            : isAnswered 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-extrabold' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {qIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time progress bar */}
            {state.timeLimit > 0 && (
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${timeLeft < 5 ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'}`} 
                      style={{ width: `${(timeLeft / state.timeLimit) * 100}%` }} 
                    />
                </div>
            )}

            {/* 🔥 FLOATING COMBO / SPEED BONUS BANNER */}
            {comboBanner && !isB2B && (
              <div className="flex justify-center -my-1 animate-in zoom-in-75 duration-300">
                <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-orange-500/25 border border-amber-300/50 animate-bounce">
                  <span>{comboBanner}</span>
                </div>
              </div>
            )}

            {/* ❓ QUESTION CARD (Matching QuestionCardV2 / Website Design) */}
            <div className="bg-white rounded-[20px] border-[1.5px] border-indigo-500/35 shadow-[0_10px_25px_-5px_rgba(99,102,241,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)] p-4 sm:p-6 md:p-7 text-center relative overflow-hidden transition-all">
               {/* Top Badges Row: Left Difficulty, Center Category, Right Counter */}
               <div className="flex items-center justify-between w-full mb-3 gap-2">
                  {/* Difficulty Badge (Left) - emerald pill with dot */}
                  <div className="flex items-center shrink-0">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>
                           {questions[currentIndex]?.difficulty === 'hard' ? 'कठिन' : questions[currentIndex]?.difficulty === 'medium' ? 'मध्यम' : 'सरल'}
                        </span>
                     </span>
                  </div>

                  {/* Centered Category Badge */}
                  <div className="flex-1 flex justify-center px-1 min-w-0">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50/90 text-indigo-700 border border-indigo-200/70 truncate select-none shadow-2xs max-w-[160px] sm:max-w-[240px]">
                        <span className="text-[11px]">🏷️</span>
                        <span className="truncate">{categoryInfo?.nameHi || categoryInfo?.name || state.missionName || state.categoryName || 'सामान्य ज्ञान'}</span>
                     </span>
                  </div>

                  {/* Question Counter (Right) */}
                  <div className="flex items-center shrink-0">
                     <span className="text-xs font-bold text-slate-500 bg-slate-100/90 border border-slate-200/60 px-2.5 py-1 rounded-full tabular-nums">
                        प्रश्न {currentIndex + 1} / {questionLimit}
                     </span>
                  </div>
               </div>

               {/* Question Text */}
               <h3 className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 leading-snug tracking-tight max-w-3xl mx-auto py-2 sm:py-3 px-1 select-none">
                  {questions[currentIndex]?.questionText || questions[currentIndex]?.question || questions[currentIndex]?.text}
               </h3>

               {/* Optional Question Media */}
               {questions[currentIndex]?.image && (
                  <div className="relative w-full aspect-[16/10] max-h-[220px] rounded-xl bg-slate-100 border border-slate-200 overflow-hidden my-3 flex items-center justify-center">
                     <img
                        src={questions[currentIndex].image}
                        alt="Question visual"
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                     />
                  </div>
               )}
            </div>

            {/* 🔠 4 OPTIONS (Vertical stacked cards matching Image 1 with circular letter badge & right radio circle) */}
            <div className="flex flex-col gap-3 sm:gap-3.5 w-full max-w-4xl mx-auto pt-1">
               {shuffledCurrentOptions.map((opt, i) => {
                  const isSelected = selectedOption === opt;
                  const isCorrectAnswer = opt === questions[currentIndex]?.correctAnswer;
                  const letter = String.fromCharCode(65 + i);

                  let cardStyle = "bg-white border-[1.5px] border-slate-200/90 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/15 shadow-2xs";
                  let badgeStyle = "bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5]";
                  let textStyle = "text-slate-800 font-semibold";

                  if (selectedOption) {
                     if (isB2B) {
                        if (isSelected) {
                           cardStyle = "bg-indigo-50/90 border-[1.5px] border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs";
                           badgeStyle = "bg-indigo-600 text-white border-indigo-600 shadow-xs";
                           textStyle = "text-indigo-950 font-bold";
                        } else {
                           cardStyle = "bg-white/60 border border-slate-200 text-slate-400 opacity-60";
                           badgeStyle = "bg-slate-100 text-slate-400 border-slate-200";
                           textStyle = "text-slate-400";
                        }
                     } else {
                        if (isCorrectAnswer) {
                           cardStyle = "bg-emerald-50/80 border-[1.5px] border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs";
                           badgeStyle = "bg-emerald-500 text-white border-emerald-500 shadow-xs";
                           textStyle = "text-emerald-950 font-bold";
                        } else if (isSelected && !isCorrect) {
                           cardStyle = "bg-rose-50/80 border-[1.5px] border-rose-500 ring-2 ring-rose-500/20 shadow-xs";
                           badgeStyle = "bg-rose-500 text-white border-rose-500 shadow-xs";
                           textStyle = "text-rose-950 font-bold";
                        } else {
                           cardStyle = "bg-white/60 border border-slate-200 text-slate-400 opacity-60";
                           badgeStyle = "bg-slate-100 text-slate-400 border-slate-200";
                           textStyle = "text-slate-400";
                        }
                     }
                  }

                  return (
                     <button 
                        key={i} 
                        type="button"
                        onClick={() => { 
                           if (!selectedOption) {
                              triggerHaptic('tap');
                              playSessionSound('click'); 
                              handleAnswer(opt); 
                           }
                        }} 
                        disabled={!!selectedOption} 
                        className={`w-full min-h-[56px] sm:min-h-[60px] p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 sm:gap-4 transition-all duration-200 text-left active:scale-98 cursor-pointer select-none ${cardStyle}`}
                     >
                        {/* Left: Circular Letter Badge (A) + Option Text */}
                        <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
                           <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-extrabold text-xs sm:text-sm shrink-0 transition-all ${badgeStyle}`}>
                              {letter}
                           </div>
                           <span className={`text-sm sm:text-base leading-snug break-words ${textStyle}`}>
                              {opt}
                           </span>
                        </div>

                        {/* Right: Circular Radio Indicator or Reveal Icon */}
                        <div className="shrink-0 flex items-center justify-center gap-2">
                           <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400/80 bg-slate-100 border border-slate-200/80 rounded px-1.5 py-0.5">[{letter}]</span>
                           {selectedOption ? (
                              isB2B ? (
                                 isSelected ? (
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                                       ●
                                    </div>
                                 ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                                 )
                              ) : isCorrectAnswer ? (
                                 <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                                    ✓
                                 </div>
                              ) : isSelected ? (
                                 <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                                    ✗
                                 </div>
                              ) : (
                                 <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                              )
                           ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center">
                                 {/* Clean empty radio circle matching Image 1 */}
                              </div>
                           )}
                        </div>
                     </button>
                  );
               })}
            </div>

            {/* 📊 LIVE PERFORMANCE & PAST QUESTIONS REVIEW DASHBOARD */}
            <LiveQuizPerformanceReview
              questionHistory={questionHistory}
              totalQuestions={questionLimit}
              currentIndex={currentIndex}
              sessionData={{ ...state, ...engineSession }}
              categoryInfo={categoryInfo}
              allQuestions={questions}
              score={score}
              highestStreak={highestStreak}
            />
          </div>
       )}

      {/* 🛡️ ANTI-CHEAT TAB-SWITCH WARNING MODAL */}
      {cheatAlertModal && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border-2 border-rose-500/80 text-center space-y-4 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-xs">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-black text-rose-700 tracking-tight">
                चेतावनी: टैब बदलना वर्जित है!
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed">
                आपकी विंडो स्विच करने की गतिविधि दर्ज कर ली गई है और परीक्षा नियंत्रक (Examiner) को सूचित कर दिया गया है।
              </p>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs font-mono font-bold text-rose-800">
                टैब स्विच गणना: {tabSwitchesCountRef.current} / {categoryInfo?.tabSwitchLimit || 3}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCheatAlertModal(false)}
              className="w-full bg-rose-600 hover:bg-rose-700 active:scale-98 text-white py-3 rounded-2xl font-bold text-sm shadow-md shadow-rose-200 transition-all cursor-pointer"
            >
              समझ गया, परीक्षा जारी रखें (Resume Exam)
            </button>
          </div>
        </div>
      )}

      {/* 📢 TERMINATION NOTIFICATION MODAL FOR PARTICIPANTS */}
      {showTerminationModal && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-150 text-center space-y-5 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            {/* Top decorative stripe */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500"></div>

            {/* Icon */}
            <div className="w-14 h-14 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-xs">
              📢
            </div>

            {/* Text info */}
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                लाइव क्विज़ समाप्त
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-relaxed px-1">
                होस्ट द्वारा यह लाइव मुकाबला समाप्त कर दिया गया है। आप आगे क्या करना चाहते हैं?
              </p>
            </div>

            {/* Current progress badge */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3 flex items-center justify-around text-xs font-bold text-slate-700">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block uppercase">प्रगति (Progress)</span>
                <span className="text-indigo-600 font-black">{currentIndex + 1} / {questions.length} प्रश्न</span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block uppercase">वर्तमान स्कोर</span>
                <span className="text-emerald-600 font-black">{score} अंक</span>
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-2.5 pt-1 text-left">
              {/* Option 1: View Results */}
              <button
                type="button"
                onClick={handleViewResultsOnTermination}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-3.5 rounded-2xl font-bold transition-all active:scale-98 shadow-md shadow-indigo-200 cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg shrink-0">
                    📊
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black leading-tight">परिणाम देखें (View Results)</p>
                    <p className="text-[10px] sm:text-[11px] text-indigo-100 font-medium">अपना स्कोर और लाइव रैंकिंग देखें</p>
                  </div>
                </div>
                <span className="text-sm font-black text-white/80 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>

              {/* Option 2: Continue Solo */}
              <button
                type="button"
                onClick={handleContinueSoloOnTermination}
                className="w-full bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl font-bold transition-all active:scale-98 cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shrink-0 shadow-xs">
                    ▶️
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black leading-tight text-emerald-900">अकेले जारी रखें (Continue Solo)</p>
                    <p className="text-[10px] sm:text-[11px] text-emerald-700 font-medium">बाकी बचे प्रश्न खुद हल करें</p>
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-600 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>

              {/* Option 3: Quit Quiz */}
              <button
                type="button"
                onClick={handleQuitOnTermination}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 p-3 rounded-2xl font-bold transition-all active:scale-98 cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center text-base shrink-0">
                    🚪
                  </div>
                  <div>
                    <p className="text-xs font-black leading-tight text-slate-800">क्विज़ छोड़ें (Quit Quiz)</p>
                    <p className="text-[10px] text-slate-500 font-medium">सत्र से बाहर निकलें</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-400 group-hover:translate-x-0.5 transition-transform">✕</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 💬 INSTANT CHAT OVERLAY POPUP */}
      <ChatOverlayModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          lastSeenChatCountRef.current = chatMessages?.length || 0;
          setUnreadChatCount(0);
        }}
      />
    </div>
  );
}
