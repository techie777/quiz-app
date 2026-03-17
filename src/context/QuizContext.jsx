"use client";

import { createContext, useContext, useReducer, useCallback } from "react";
import { useData } from "@/context/DataContext";

const QuizContext = createContext(null);

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
  translatedStory: null,
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
          // Also need to translate the correct answer if it matches one of the options
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

  const startQuiz = useCallback(async (quizId, difficulty, timer, language = "en") => {
    const quiz = quizzes.find((q) => q.id === quizId);
    const originalLang = quiz?.originalLang || "en";
    dispatch({ type: "START_QUIZ", payload: { quiz, difficulty, timer, language } });
    
    if (language !== originalLang) {
      const quizQuestions = quiz.questions.filter(q => q.difficulty === difficulty).length > 0 ? quiz.questions.filter(q => q.difficulty === difficulty) : quiz.questions;
      await translateQuiz(quizQuestions, originalLang, language, quiz.storyText);
    }
  }, [quizzes, translateQuiz]);

  const startQuizSet = useCallback(async (quizId, questions, timer, language = "en") => {
    dispatch({ type: "START_QUIZ_SET", payload: { quizId, questions, timer, language } });
    
    const quiz = quizzes.find(q => q.id === quizId);
    const originalLang = quiz?.originalLang || "en";
    
    console.log(`[Quiz] Starting set. UserLang: ${language}, OriginalLang: ${originalLang}`);
    
    if (language !== originalLang) {
      console.log(`[Quiz] Triggering translation to ${language}...`);
      await translateQuiz(questions, originalLang, language, quiz?.storyText);
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
        isTranslating: state.isTranslating,
        language: state.language,
        translatedStory: state.translatedStory,
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
