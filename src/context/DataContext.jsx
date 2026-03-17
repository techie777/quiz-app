"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [quizzes, setQuizzes] = useState([]);
  const [settings, setSettings] = useState({ difficultyEnabled: false });
  const [loaded, setLoaded] = useState(false);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) setSettings(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [catRes, setRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/settings"),
        ]);
        if (catRes.ok) setQuizzes(await catRes.json());
        if (setRes.ok) setSettings(await setRes.json());
      } catch {}
      setLoaded(true);
    }
    load();
  }, []);

  const refreshQuizzes = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) setQuizzes(await res.json());
    } catch {}
  }, []);

  const addCategory = useCallback(async (category) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
    if (res.ok) await refreshQuizzes();
    return res.ok;
  }, [refreshQuizzes]);

  const updateCategory = useCallback(async (id, updates) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) await refreshQuizzes();
    return res.ok;
  }, [refreshQuizzes]);

  const deleteCategory = useCallback(async (id) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) await refreshQuizzes();
    return res.ok;
  }, [refreshQuizzes]);

  const reorderCategories = useCallback(async (newOrder) => {
    setQuizzes(newOrder);
    await fetch("/api/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: newOrder.map((c) => c.id) }),
    });
  }, []);

  const updateSettings = useCallback(async (updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) await refreshSettings();
    return res.ok;
  }, [refreshSettings]);

  const addQuestion = useCallback(async (categoryId, question) => {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...question, categoryId }),
    });
    if (res.ok) await refreshQuizzes();
    return res.ok;
  }, [refreshQuizzes]);

  const updateQuestion = useCallback(async (categoryId, questionId, updates) => {
    const res = await fetch(`/api/questions/${questionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) await refreshQuizzes();
    return res.ok;
  }, [refreshQuizzes]);

  const deleteQuestion = useCallback(async (categoryId, questionId) => {
    const res = await fetch(`/api/questions/${questionId}`, { method: "DELETE" });
    if (res.ok) await refreshQuizzes();
    return res.ok;
  }, [refreshQuizzes]);

  const bulkImport = useCallback(async (importedQuizzes) => {
    const res = await fetch("/api/upload/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: importedQuizzes }),
    });
    if (res.ok) await refreshQuizzes();
    return res.ok;
  }, [refreshQuizzes]);

  const bulkImportQuestions = useCallback(async (categoryId, questions) => {
    const res = await fetch("/api/upload/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, questions }),
    });
    if (res.ok) await refreshQuizzes();
    return res.ok;
  }, [refreshQuizzes]);

  const resetToDefaults = useCallback(async () => {
    await refreshQuizzes();
  }, [refreshQuizzes]);

  const getStats = useCallback(() => {
    const totalQuestions = quizzes.reduce((sum, c) => sum + c.questions.length, 0);
    const totalCategories = quizzes.length;
    const byDifficulty = { easy: 0, medium: 0, hard: 0 };
    quizzes.forEach((cat) =>
      cat.questions.forEach((q) => {
        if (byDifficulty[q.difficulty] !== undefined) byDifficulty[q.difficulty]++;
      })
    );
    return { totalQuestions, totalCategories, byDifficulty };
  }, [quizzes]);

  return (
    <DataContext.Provider
      value={{
        quizzes,
        settings,
        loaded,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        updateSettings,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        bulkImport,
        bulkImportQuestions,
        resetToDefaults,
        refreshQuizzes,
        refreshSettings,
        getStats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
}
