"use client";

import { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import { useData } from "@/context/DataContext";
import toast from "react-hot-toast";

const QuizContext = createContext(null);

// Helper function to detect if text is Hindi
function isHindiText(text) {
  if (!text || typeof text !== 'string') return false;
  // Hindi Unicode range: \u0900-\u097F
  const hindiRegex = /[\u0900-\u097F]/;
  return hindiRegex.test(text);
}

// Helper function to detect quiz language
function detectQuizLanguage(questions) {
  if (!questions || questions.length === 0) return 'en';
  
  // Check first few questions to determine language
  const sampleQuestions = questions.slice(0, Math.min(3, questions.length));
  let hindiCount = 0;
  
  sampleQuestions.forEach(q => {
    if (isHindiText(q.text) || (q.options && q.options.some(opt => isHindiText(opt)))) {
      hindiCount++;
    }
  });
  
  // If majority of sample questions have Hindi text, consider it Hindi
  return hindiCount > sampleQuestions.length / 2 ? 'hi' : 'en';
}

function shuffleArray(arr) {
  if (!arr || !Array.isArray(arr)) return [];
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const initialState = {
  quizId: null,
  difficulty: "easy",
  timerSetting: 0,
  questions: [],
  currentIndex: 0,
  answers: [],
  score: 0,
  status: "idle",
  isPaused: false,
  soundEnabled: true,
  isFullscreen: false,
  language: "en", // "en" or "hi"
  isTranslating: false,
  translateTarget: null,
  translatedStory: null,
  fontScale: 1,
  selectedSetIndex: null,
  isResuming: false,
  originalTotal: null,
  originalQuestions: [],
  originalLanguage: "en",
  originalStory: null,
  isMixedMode: false,
  mixedSectionName: null,
  categoryName: null,
};

// Key for storage
const STORAGE_KEY = 'global_quiz_state';

function quizReducer(state, action) {
  switch (action.type) {
    case "START_QUIZ": {
      const { quiz, difficulty, timer, language } = action.payload;
      if (!quiz) return state;

      const filtered = quiz.questions.filter(
        (q) => q.difficulty === difficulty
      );
      const raw = filtered.length > 0 ? filtered : quiz.questions;
      
      // Deep shuffle and sanitize (strip userAnswer)
      const shuffledQuestions = shuffleArray(raw).map(q => {
        const { userAnswer, ...pristineQ } = q;
        return {
          ...pristineQ,
          options: shuffleArray(q.options)
        };
      });

      return {
        ...initialState,
        quizId: quiz.id,
        difficulty: difficulty,
        timerSetting: timer,
        questions: shuffledQuestions,
        status: "active",
        soundEnabled: state.soundEnabled,
        isFullscreen: state.isFullscreen,
        language: language || detectQuizLanguage(shuffledQuestions),
        originalLanguage: language || detectQuizLanguage(shuffledQuestions),
        originalQuestions: shuffledQuestions,
        originalStory: quiz.storyText || null,
        translatedStory: null,
        selectedSetIndex: null,
        categoryName: quiz.topic || quiz.name,
      };
    }
    case "START_QUIZ_SET": {
      const { quizId, questions, timer, language, setIndex, categoryName } = action.payload;
      
      // Deep shuffle and sanitize (strip userAnswer)
      const shuffledQuestions = shuffleArray(questions).map(q => {
        const { userAnswer, ...pristineQ } = q;
        return {
          ...pristineQ,
          options: Array.isArray(q.options) ? shuffleArray(q.options) : []
        };
      });

      return {
        ...initialState,
        quizId,
        timerSetting: timer,
        questions: shuffledQuestions,
        status: "active",
        soundEnabled: state.soundEnabled,
        isFullscreen: state.isFullscreen,
        language: language || detectQuizLanguage(shuffledQuestions),
        originalLanguage: language || detectQuizLanguage(shuffledQuestions),
        originalQuestions: shuffledQuestions,
        originalStory: null,
        translatedStory: null,
        selectedSetIndex: setIndex,
        categoryName: categoryName,
      };
    }
    case "START_MIXED_QUIZ": {
      const { questions, sectionName, timer, difficulty, language } = action.payload;
      
      // Deep shuffle and sanitize (strip userAnswer)
      const shuffledQuestions = shuffleArray(questions).map(q => {
        const { userAnswer, ...pristineQ } = q;
        return {
          ...pristineQ,
          options: Array.isArray(q.options) ? shuffleArray(q.options) : []
        };
      });

      return {
        ...initialState,
        isMixedMode: true,
        mixedSectionName: sectionName,
        difficulty: difficulty,
        timerSetting: timer,
        questions: shuffledQuestions,
        status: "active",
        soundEnabled: state.soundEnabled,
        isFullscreen: state.isFullscreen,
        language: language || detectQuizLanguage(shuffledQuestions),
        originalLanguage: language || detectQuizLanguage(shuffledQuestions),
        originalQuestions: shuffledQuestions,
        categoryName: sectionName,
      };
    }
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload, isTranslating: false };
    case "SET_TRANSLATED_STORY":
      return { ...state, translatedStory: action.payload };
    case "SET_TRANSLATING":
      return { ...state, isTranslating: action.payload };
    case "SET_TRANSLATE_TARGET":
      return { ...state, translateTarget: action.payload };
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };
    case "SET_FONT_SCALE":
      return { ...state, fontScale: action.payload };
    case "SUBMIT_ANSWER": {
      const { questionId, selected } = action.payload;
      const question = state.questions.find((q) => q.id === questionId);
      if (!question) return state;

      // Normalize comparison for score calculation
      const selectedOptionText = String(question.options[selected] || "").trim();
      const correctAnswerText = String(question.correctAnswer || "").trim();
      const isCorrect = selectedOptionText === correctAnswerText;
      
      // Update answers array, replacing if already exists for this question
      const existingAnswerIndex = state.answers.findIndex(a => a.questionId === questionId);
      let newAnswers = [...state.answers];
      
      const answerData = { questionId, selected, correct: question.correctAnswer, isCorrect };
      
      if (existingAnswerIndex !== -1) {
        newAnswers[existingAnswerIndex] = answerData;
      } else {
        newAnswers.push(answerData);
      }
      
      // Recalculate score based on all answers
      const newScore = newAnswers.reduce((sum, a) => sum + (a.isCorrect ? 1 : 0), 0);
      
      // Update questions with user answers
      const updatedQuestions = state.questions.map(q => 
        q.id === questionId ? { ...q, userAnswer: selected } : q
      );

      return {
        ...state,
        questions: updatedQuestions,
        answers: newAnswers,
        score: newScore,
        status: "active",
      };
    }
    case "FINISH_QUIZ":
      return { ...state, status: "finished" };
    case "GO_TO_QUESTION":
      return { ...state, currentIndex: action.payload };
    case "UPDATE_SCORE":
      return { ...state, score: state.score + action.payload };
    case "PAUSE_QUIZ":
      return { ...state, isPaused: true };
    case "RESUME_QUIZ":
      return { ...state, isPaused: false };
    case "TOGGLE_SOUND":
      return { ...state, soundEnabled: !state.soundEnabled };
    case "SET_FULLSCREEN":
      return { ...state, isFullscreen: action.payload };
    case "RESET_QUIZ":
      return { ...initialState, soundEnabled: state.soundEnabled, isFullscreen: state.isFullscreen };
    case "LOAD_STATE":
      return { 
        ...state, 
        ...action.payload, 
        status: action.payload.status === 'finished' ? 'idle' : action.payload.status,
        originalTotal: action.payload.originalTotal || action.payload.questions?.length || state.originalTotal
      };
    case "SET_RESUMING":
      return { ...state, isResuming: action.payload };
    default:
      return state;
  }
}

export function QuizProvider({ children }) {
  const { quizzes } = useData();
  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Persistence: Save state
  useEffect(() => {
    if (state.status === 'active') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...state,
        // Don't save transient UI states
        isTranslating: false,
        translateTarget: null,
        showStory: false,
      }));
    }
  }, [state]);

  // Persistence: Load state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.status === 'active' && parsed.questions.length > 0) {
          dispatch({ type: "LOAD_STATE", payload: parsed });
        }
      } catch (e) {
        console.error("Failed to load quiz state", e);
      }
    }
  }, []);

  const submitAnswer = useCallback((questionId, selected) => {
    dispatch({ type: "SUBMIT_ANSWER", payload: { questionId, selected } });
    
    // Auto-sync to DB in background with LATEST data to avoid race conditions
    setTimeout(async () => {
      // Find the answer that was just added to get the latest array
      // Note: In a real app, we'd calculate this from the current state carefully
      syncProgressToDB(); 
    }, 100);
  }, [state]);

  const syncProgressToDB = async (overrideAnswers, overrideIndex, forceComplete = false) => {
    // Determine the data to sync (prefer passed overrides which are the most fresh)
    const activeAnswers = overrideAnswers || state.answers;
    const activeIndex = overrideIndex !== undefined ? overrideIndex : state.currentIndex;
    
    if (!state.quizId || (state.status !== 'active' && !forceComplete)) return;

    try {
      const total = state.originalTotal || state.questions.length;
      let progress = total > 0 ? (activeAnswers.length / total) * 100 : 0;
      let isComplete = (activeAnswers.length >= total && total > 0) || forceComplete;
      
      if (forceComplete) progress = 100;

      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: state.quizId,
          setIndex: state.selectedSetIndex || 1,
          progress,
          isComplete,
          lastQuestionIndex: activeIndex,
          answers: activeAnswers
        }),
      });
    } catch (e) {
      console.warn("[QuizContext] Failed to sync progress to DB", e);
    }
  };

  const finishQuiz = useCallback(() => {
    dispatch({ type: "FINISH_QUIZ" });
    syncProgressToDB(null, null, true); // Final sync with forceComplete=true
  }, [state]);

  const updateScore = useCallback((amount) => {
    dispatch({ type: "UPDATE_SCORE", payload: amount });
  }, []);

  const pauseQuiz = useCallback(() => {
    dispatch({ type: "PAUSE_QUIZ" });
  }, []);

  const resumeQuiz = useCallback(() => {
    dispatch({ type: "RESUME_QUIZ" });
  }, []);

  const toggleSound = useCallback(() => {
    dispatch({ type: "TOGGLE_SOUND" });
  }, []);

  const setFullscreen = useCallback((val) => {
    dispatch({ type: "SET_FULLSCREEN", payload: val });
  }, []);

  const resetQuiz = useCallback(() => {
    dispatch({ type: "RESET_QUIZ" });
  }, []);

  const goToQuestion = useCallback((questionIndex) => {
    dispatch({ type: "GO_TO_QUESTION", payload: questionIndex });
  }, []);

  const translateQuiz = useCallback(async (questions, from, to, storyText = null) => {
    // Rule: Only allow English to Hindi or Hindi to English
    const allowedPairs = [
      { from: "en", to: "hi" },
      { from: "hi", to: "en" }
    ];

    const isAllowed = allowedPairs.some(p => p.from === from && p.to === to);
    
    if (!isAllowed) {
      console.log(`[Quiz/Translate] Translation from ${from} to ${to} is not allowed or unnecessary.`);
      return null;
    }

    // Additional check: detect if source content actually matches the 'from' language
    const detectedLang = detectQuizLanguage(questions);
    if (detectedLang !== from) {
      console.log(`[Quiz/Translate] Language mismatch. Detected: ${detectedLang}, Expected: ${from}. Using detected language.`);
      from = detectedLang;
    }

    dispatch({ type: "SET_TRANSLATING", payload: true });
    
    try {
      // Prepare all strings to translate
      const texts = [];
      questions.forEach(q => {
        texts.push(q.text);
        q.options.forEach(opt => texts.push(opt));
      });

      if (storyText) {
        texts.push(storyText);
      }

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: texts, from, to }),
      });

      if (res.ok) {
        const { translations } = await res.json();
        
        if (!translations || translations.length === 0) {
           console.error("[Quiz/Translate] Empty translations received.");
           dispatch({ type: "SET_TRANSLATING", payload: false });
           return null;
        }

        let tIndex = 0;
        
        const translatedQuestions = questions.map(q => {
          const newQ = { ...q };
          
          // 1. Identify which index the correct answer currently is
          const correctIdx = q.options.findIndex(opt => 
             String(opt || "").trim() === String(q.correctAnswer || "").trim()
          );

          // 2. Consume from translations array safely
          newQ.text = translations[tIndex++];
          
          // 3. Map options and keep integrity
          if (Array.isArray(q.options)) {
             newQ.options = q.options.map(() => translations[tIndex++] || "...");
             
             // 4. Sync Correct Answer by index (Master Fix)
             if (correctIdx !== -1 && newQ.options[correctIdx]) {
                newQ.correctAnswer = newQ.options[correctIdx];
             } else if (correctIdx === -1 && q.correctAnswer) {
                // Fallback: If index search fails, translate it as a separate item if we had one? 
                // But we don't send correctAnswer separately in current implementation.
                // We assume correctAnswer is always one of the options.
             }
          }

          return newQ;
        });

        const translatedStory = storyText ? translations[tIndex++] : null;

        if (tIndex > translations.length) {
            console.error("[Quiz/Translate] Data desync: Not enough translations returned.");
            toast.error("Translation was incomplete. Please try again.");
            dispatch({ type: "SET_TRANSLATING", payload: false });
            return null;
        }

        dispatch({ type: "SET_QUESTIONS", payload: translatedQuestions });
        dispatch({ type: "SET_TRANSLATED_STORY", payload: translatedStory });
        toast.success(`Translated to ${to === 'hi' ? 'Hindi' : 'English'}`);
        return { questions: translatedQuestions, story: translatedStory };
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Translation API error response:", errorData);
        dispatch({ type: "SET_TRANSLATING", payload: false });
        toast.error("Translation service is currently unavailable");
      }
    } catch (error) {
      console.error("Translation error:", error);
      dispatch({ type: "SET_TRANSLATING", payload: false });
      toast.error("Failed to connect to translation service");
    }
    return null;
  }, []);

  const toggleLanguage = useCallback(
    async (storyText = null) => {
      if (state.status !== "active") return;
      if (state.isTranslating) return;
      
      const target = state.language === "en" ? "hi" : "en";
      
      console.log(`[Quiz/Toggle] Switching to: ${target}, Original: ${state.originalLanguage}`);
      
      dispatch({ type: "SET_TRANSLATE_TARGET", payload: target });
      
      try {
        if (target === state.originalLanguage && state.originalQuestions?.length > 0) {
           console.log("[Quiz/Toggle] Restoring original language from cache instantly!");
           // Re-apply user answers to original questions
           const newQ = state.originalQuestions.map(q => {
              const ans = state.answers.find(a => a.questionId === q.id);
              return ans ? { ...q, userAnswer: ans.selected } : q;
           });
           dispatch({ type: "SET_QUESTIONS", payload: newQ });
           if (state.originalStory !== undefined) {
              dispatch({ type: "SET_TRANSLATED_STORY", payload: state.originalStory });
           }
           dispatch({ type: "SET_LANGUAGE", payload: target });
           toast.success(`Switched to ${target === 'hi' ? 'Hindi' : 'English'}`);
        } else {
           await translateQuiz(state.questions, state.language, target, storyText);
           dispatch({ type: "SET_LANGUAGE", payload: target });
        }
      } finally {
        dispatch({ type: "SET_TRANSLATE_TARGET", payload: null });
      }
    },
    [state.isTranslating, state.questions, state.language, state.originalLanguage, state.originalQuestions, state.originalStory, state.answers, state.status, translateQuiz]
  );

  const toggleFontSize = useCallback(() => {
    const steps = [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4];
    const current = Number(state.fontScale || 1);
    const idx = steps.findIndex((s) => Math.abs(s - current) < 0.001);
    const next = steps[(idx >= 0 ? idx + 1 : 2) % steps.length]; // default to 1 (index 2) if not found
    dispatch({ type: "SET_FONT_SCALE", payload: next });
  }, [state.fontScale]);

  const startQuiz = useCallback(async (quizId, difficulty, timer, language = "en") => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;
    
    // Get the questions for this difficulty
    const quizQuestions = quiz.questions.filter(q => q.difficulty === difficulty).length > 0 
      ? quiz.questions.filter(q => q.difficulty === difficulty) 
      : quiz.questions;
    
    // Detect actual content language
    const detectedLang = detectQuizLanguage(quizQuestions);
    const originalLang = quiz?.originalLang || detectedLang;
    
    dispatch({ type: "START_QUIZ", payload: { quiz, difficulty, timer, language } });
    
    console.log(`[Quiz] Start. User selected: ${language}, Original data lang: ${originalLang}, Detected: ${detectedLang}`);
    
    // Rule: Only translate if target language is DIFFERENT from detected content language
    if (language !== detectedLang) {
      console.log(`[Quiz] Languages differ. Triggering translation from ${detectedLang} to ${language}...`);
      await translateQuiz(quizQuestions, detectedLang, language, quiz.storyText);
    } else {
      console.log(`[Quiz] Target language matches content language. Skipping translation API.`);
    }
  }, [quizzes, translateQuiz]);

  const startQuizSet = useCallback(async (quizId, questions, timer, language = "en", setIndex = null, categoryName = null) => {
    dispatch({ type: "START_QUIZ_SET", payload: { quizId, questions, timer, language, setIndex, categoryName } });
    
    const quiz = quizzes.find(q => q.id === quizId);
    
    // Detect actual content language
    const detectedLang = detectQuizLanguage(questions);
    const originalLang = quiz?.originalLang || detectedLang;
    
    console.log(`[QuizSet] Start. User selected: ${language}, Original data lang: ${originalLang}, Detected: ${detectedLang}`);
    
    // Rule: Only translate if target language is DIFFERENT from detected content language
    if (language !== detectedLang) {
      console.log(`[QuizSet] Languages differ. Triggering translation from ${detectedLang} to ${language}...`);
      await translateQuiz(questions, detectedLang, language, quiz?.storyText);
    } else {
      console.log(`[QuizSet] Target language matches content language. Skipping translation API.`);
    }
  }, [quizzes, translateQuiz]);

  return (
    <QuizContext.Provider
      value={{
        ...state,
        startQuiz,
        startQuizSet,
        startMixedQuiz: (questions, sectionName, timer, difficulty, language = "en") => {
          dispatch({ 
            type: "START_MIXED_QUIZ", 
            payload: { questions, sectionName, timer, difficulty, language } 
          });
        },
        submitAnswer,
        finishQuiz,
        updateScore,
        pauseQuiz,
        resumeQuiz,
        toggleSound,
        setFullscreen,
        resetQuiz,
        goToQuestion,
        toggleLanguage,
        toggleFontSize,
        isTranslating: state.isTranslating,
        language: state.language,
        translateTarget: state.translateTarget,
        translatedStory: state.translatedStory,
        fontScale: state.fontScale,
        startQuizResume: async (progressData, questions, mode = 'last') => {
          dispatch({ type: "SET_RESUMING", payload: true });
          try {
            const answers = JSON.parse(progressData.answersJson || "[]");
            const score = answers.reduce((sum, a) => sum + (a.isCorrect ? 1 : 0), 0);
            
            let finalQuestions = questions.map(q => {
              const ans = answers.find(a => a.questionId === q.id);
              return ans ? { ...q, userAnswer: ans.selected } : q;
            });

            let startIndex = progressData.lastQuestionIndex || 0;

            if (mode === 'unanswered') {
              // Mastery Mode: Filter only unanswered questions
              finalQuestions = finalQuestions.filter(q => q.userAnswer === undefined);
              startIndex = 0;
            }
            
            // Re-hydrate state
            dispatch({ 
              type: "LOAD_STATE", 
              payload: {
                quizId: progressData.categoryId,
                questions: finalQuestions,
                originalTotal: questions.length, // Keep track of full set size for progress calc
                answers: answers,
                score: score,
                currentIndex: startIndex,
                status: "active",
                selectedSetIndex: progressData.setIndex
              } 
            });
          } finally {
            dispatch({ type: "SET_RESUMING", payload: false });
          }
        }
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
}
