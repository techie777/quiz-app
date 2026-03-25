"use client";

import { createContext, useContext, useReducer, useCallback } from "react";
import { useData } from "@/context/DataContext";

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
};

function quizReducer(state, action) {
  switch (action.type) {
    case "START_QUIZ": {
      const { quiz, difficulty, timer, language } = action.payload;
      if (!quiz) return state;

      const filtered = quiz.questions.filter(
        (q) => q.difficulty === difficulty
      );
      const raw = filtered.length > 0 ? filtered : quiz.questions;
      const questions = shuffleArray(raw);

      return {
        ...initialState,
        quizId: quiz.id,
        difficulty: difficulty,
        timerSetting: timer,
        questions,
        status: "active",
        soundEnabled: state.soundEnabled,
        isFullscreen: state.isFullscreen,
        language: language || "en",
        translatedStory: null,
      };
    }
    case "START_QUIZ_SET": {
      const { quizId, questions, timer, language } = action.payload;
      return {
        ...initialState,
        quizId,
        timerSetting: timer,
        questions: shuffleArray(questions),
        status: "active",
        soundEnabled: state.soundEnabled,
        isFullscreen: state.isFullscreen,
        language: language || "en",
        translatedStory: null,
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

      const isCorrect = selected === question.correctAnswer;
      const newAnswers = [
        ...state.answers,
        { questionId, selected, correct: question.correctAnswer, isCorrect },
      ];
      const newScore = state.score + (isCorrect ? 1 : 0);
      const nextIndex = state.currentIndex + 1;
      const isFinished = nextIndex >= state.questions.length;

      return {
        ...state,
        answers: newAnswers,
        score: newScore,
        currentIndex: isFinished ? state.currentIndex : nextIndex,
        status: isFinished ? "finished" : "active",
      };
    }
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
    default:
      return state;
  }
}

export function QuizProvider({ children }) {
  const { quizzes } = useData();
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const submitAnswer = useCallback((questionId, selected) => {
    dispatch({ type: "SUBMIT_ANSWER", payload: { questionId, selected } });
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
        let tIndex = 0;
        
        const translatedQuestions = questions.map(q => {
          const newQ = { ...q };
          newQ.text = translations[tIndex++];
          newQ.options = q.options.map(() => translations[tIndex++]);
          // Also need to translate correct answer if it matches one of the options
          const originalCorrectIndex = q.options.indexOf(q.correctAnswer);
          if (originalCorrectIndex !== -1) {
            newQ.correctAnswer = newQ.options[originalCorrectIndex];
          }
          return newQ;
        });

        const translatedStory = storyText ? translations[tIndex++] : null;

        dispatch({ type: "SET_QUESTIONS", payload: translatedQuestions });
        dispatch({ type: "SET_TRANSLATED_STORY", payload: translatedStory });
        return translatedStory;
      } else {
        dispatch({ type: "SET_TRANSLATING", payload: false });
      }
    } catch (error) {
      console.error("Translation error:", error);
      dispatch({ type: "SET_TRANSLATING", payload: false });
    }
    return null;
  }, []);

  const toggleLanguage = useCallback(
    async (storyText = null) => {
      if (state.status !== "active") return;
      if (state.isTranslating) return;
      
      // Detect current language of the content
      const currentContentLang = detectQuizLanguage(state.questions);
      const target = currentContentLang === "en" ? "hi" : "en";
      
      console.log(`[Quiz/Toggle] Current content language: ${currentContentLang}, Target: ${target}`);
      
      dispatch({ type: "SET_TRANSLATE_TARGET", payload: target });
      try {
        await translateQuiz(state.questions, currentContentLang, target, storyText);
        dispatch({ type: "SET_LANGUAGE", payload: target });
      } finally {
        dispatch({ type: "SET_TRANSLATE_TARGET", payload: null });
      }
    },
    [state.isTranslating, state.questions, state.status, translateQuiz]
  );

  const toggleFontSize = useCallback(() => {
    const steps = [0.9, 1, 1.12, 1.25];
    const current = Number(state.fontScale || 1);
    const idx = steps.findIndex((s) => Math.abs(s - current) < 0.001);
    const next = steps[(idx >= 0 ? idx + 1 : 1) % steps.length];
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

  const startQuizSet = useCallback(async (quizId, questions, timer, language = "en") => {
    dispatch({ type: "START_QUIZ_SET", payload: { quizId, questions, timer, language } });
    
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
        submitAnswer,
        pauseQuiz,
        resumeQuiz,
        toggleSound,
        setFullscreen,
        resetQuiz,
        toggleLanguage,
        toggleFontSize,
        isTranslating: state.isTranslating,
        language: state.language,
        translateTarget: state.translateTarget,
        translatedStory: state.translatedStory,
        fontScale: state.fontScale,
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
