"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

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
        if (catRes.ok) {
          const data = await catRes.json();
          // Handle both array (old) and { categories, total } (new) formats
          if (Array.isArray(data)) {
            setQuizzes(data);
          } else if (data && Array.isArray(data.categories)) {
            setQuizzes(data.categories);
          }
        }
        if (setRes.ok) setSettings(await setRes.json());
      } catch {}
      setLoaded(true);
    }
    load();
  }, []);

  const refreshQuizzes = useCallback(async () => {
    console.log("[DataContext] refreshQuizzes called");
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      console.log("[DataContext] refreshQuizzes status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("[DataContext] refreshQuizzes data length:", Array.isArray(data) ? data.length : data?.categories?.length);
        if (Array.isArray(data)) {
          setQuizzes(data);
        } else if (data && Array.isArray(data.categories)) {
          setQuizzes(data.categories);
        } else {
          console.warn("[DataContext] refreshQuizzes data is not in expected format:", data);
        }
      }
    } catch (error) {
      console.error("[DataContext] refreshQuizzes error:", error);
    }
  }, []);

  const addCategory = useCallback(async (category) => {
    console.log("[DataContext] addCategory called with:", category.topic);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });
      console.log("[DataContext] addCategory response status:", res.status);
      if (res.ok) {
        await refreshQuizzes();
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("[DataContext] addCategory failed:", errData);
        return false;
      }
    } catch (error) {
      console.error("[DataContext] addCategory fetch error:", error);
      return false;
    }
  }, [refreshQuizzes]);

  const updateCategory = useCallback(async (id, updates) => {
    console.log("[DataContext] updateCategory called with:", { id, updates });
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      console.log("[DataContext] updateCategory response status:", res.status);
      
      if (res.ok) {
        await refreshQuizzes();
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("[DataContext] updateCategory failed:", errData);
        toast.error(errData.error || "Failed to update category");
        return false;
      }
    } catch (error) {
      console.error("[DataContext] updateCategory fetch error:", error);
      toast.error("Network error while updating category");
      return false;
    }
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
    console.log("[DataContext] addQuestion called for cat:", categoryId);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...question, categoryId }),
      });
      console.log("[DataContext] addQuestion status:", res.status);
      if (res.ok) {
        await refreshQuizzes();
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("[DataContext] addQuestion failed:", errData);
        return false;
      }
    } catch (error) {
      console.error("[DataContext] addQuestion fetch error:", error);
      return false;
    }
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
