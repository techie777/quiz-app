"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  Image,
  Upload,
  CheckCircle2,
  Save,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

const FORMAT_OPTIONS = ["text", "image", "flag", "logo", "map", "riddle", "fact"];

export default function AdminHotQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hot-quizzes");
      const data = await res.json();
      if (data.success) {
        setQuizzes(data.quizzes || []);
      }
    } catch (e) {
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = (id, field, value) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === id || q.slug === id ? { ...q, [field]: value } : q))
    );
  };

  const handleSaveQuiz = async (quiz) => {
    setSavingId(quiz.id || quiz.slug);
    try {
      const res = await fetch("/api/admin/hot-quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quiz.id || quiz.slug,
          hot: quiz.hot,
          hotRank: quiz.hotRank,
          format: quiz.format,
          coverImage: quiz.coverImage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${quiz.title}" updated!`);
      } else {
        toast.error(data.error || "Save failed");
      }
    } catch (e) {
      toast.error("Error saving quiz");
    } finally {
      setSavingId(null);
    }
  };

  const filteredQuizzes = quizzes.filter(
    (q) =>
      (q.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (q.format || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1E293B", margin: 0 }}>
            Hot Quizzes & Fun Formats Manager
          </h1>
          <p style={{ fontSize: "14px", color: "#64748B", margin: "4px 0 0" }}>
            Control quizzes appearing in the Explorer "🔥 Hot Quizzes" row and the dedicated Fun Quizzes page.
          </p>
        </div>
        <button
          onClick={loadQuizzes}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "10px",
            background: "#F1F5F9",
            border: "1px solid #CBD5E1",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "13px",
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Bulk Upload CSV Specs Info */}
      <div
        style={{
          background: "#EEF2FF",
          border: "1px solid #C7D2FE",
          borderRadius: "16px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#3730A3", margin: "0 0 4px" }}>
            CSV Bulk Upload Media Specifications
          </h3>
          <p style={{ fontSize: "12px", color: "#4F46E5", margin: 0, lineHeight: 1.5 }}>
            CSV format accepts: <code>topic, format, hot, hotRank, coverImage, question, optionLayout, imageUrl, imageAlt, imageCredit</code>. Images must be 16:10 fixed aspect ratio or WebP, max 800px.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "20px", position: "relative", maxWidth: "400px" }}>
        <input
          type="text"
          placeholder="Search quizzes by title or format..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px 10px 38px",
            borderRadius: "12px",
            border: "1px solid #CBD5E1",
            fontSize: "14px",
          }}
        />
        <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "12px" }} />
      </div>

      {/* Quizzes Table */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
          Loading quizzes...
        </div>
      ) : (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "18px",
            border: "1px solid #E2E8F0",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px" }}>Cover</th>
                  <th style={{ padding: "12px 16px" }}>Title</th>
                  <th style={{ padding: "12px 16px" }}>Format</th>
                  <th style={{ padding: "12px 16px" }}>🔥 Hot?</th>
                  <th style={{ padding: "12px 16px" }}>Rank</th>
                  <th style={{ padding: "12px 16px" }}>Cover Image URL</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuizzes.map((quiz) => {
                  const qId = quiz.id || quiz.slug;
                  const isSaving = savingId === qId;
                  return (
                    <tr key={qId} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div
                          style={{
                            width: "48px",
                            height: "32px",
                            borderRadius: "6px",
                            background: "#F1F5F9",
                            overflow: "hidden",
                            border: "1px solid #E2E8F0",
                          }}
                        >
                          {quiz.coverImage ? (
                            <img
                              src={quiz.coverImage}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
                              <Image size={14} />
                            </div>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E293B" }}>
                        <div>{quiz.title}</div>
                        {quiz.titleHi && <div style={{ fontSize: "11px", color: "#64748B" }}>{quiz.titleHi}</div>}
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <select
                          value={quiz.format || "text"}
                          onChange={(e) => handleUpdateField(qId, "format", e.target.value)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            border: "1px solid #CBD5E1",
                            fontSize: "12px",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {FORMAT_OPTIONS.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <input
                          type="checkbox"
                          checked={Boolean(quiz.hot)}
                          onChange={(e) => handleUpdateField(qId, "hot", e.target.checked)}
                          style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#EA580C" }}
                        />
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <input
                          type="number"
                          value={quiz.hotRank || 99}
                          onChange={(e) => handleUpdateField(qId, "hotRank", parseInt(e.target.value, 10))}
                          style={{
                            width: "55px",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid #CBD5E1",
                            fontSize: "12px",
                            textAlign: "center",
                          }}
                        />
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <input
                          type="text"
                          value={quiz.coverImage || ""}
                          placeholder="https://..."
                          onChange={(e) => handleUpdateField(qId, "coverImage", e.target.value)}
                          style={{
                            width: "220px",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid #CBD5E1",
                            fontSize: "11px",
                          }}
                        />
                      </td>

                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => handleSaveQuiz(quiz)}
                          disabled={isSaving}
                          style={{
                            padding: "6px 14px",
                            background: "#4F46E5",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Save size={13} />
                          <span>{isSaving ? "Saving..." : "Save"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
