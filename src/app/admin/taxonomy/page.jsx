"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FolderTree,
  Search,
  Layers,
  Tag,
  Hash,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  ExternalLink,
  Edit2,
  Check,
  Sparkles,
  Info,
  RefreshCw,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminTaxonomyPage() {
  const [data, setData] = useState({ categories: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMainCat, setSelectedMainCat] = useState("all");
  const [expandedNodes, setExpandedNodes] = useState(new Set(["india-gk", "india-gk::indian-geography"]));
  const [editingSet, setEditingSet] = useState(null);
  const [setTagsInput, setSetTagsInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // New tag prompt for a topic
  const [addingTagToTopic, setAddingTagToTopic] = useState(null);
  const [newTopicTagInput, setNewTopicTagInput] = useState("");

  const loadHierarchy = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/taxonomy-hierarchy?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        toast.error("Failed to load taxonomy");
      }
    } catch (err) {
      console.error("Error loading taxonomy:", err);
      toast.error("Network error loading taxonomy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHierarchy();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Toggle expansion for any node in the hierarchy
  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set();
    data.categories.forEach((cat) => {
      all.add(cat.slug);
      (cat.subcategories || []).forEach((sub) => {
        all.add(`${cat.slug}::${sub.slug}`);
        (sub.topics || []).forEach((topic) => {
          all.add(`${cat.slug}::${sub.slug}::${topic.slug}`);
        });
      });
    });
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Filtered by selected main category pill
  const displayedCategories = useMemo(() => {
    if (!data.categories) return [];
    if (selectedMainCat === "all") return data.categories;
    return data.categories.filter((c) => c.slug === selectedMainCat);
  }, [data.categories, selectedMainCat]);

  // Open set tag editor
  const handleOpenSetTagEditor = (set, topicName, subName, catSlug) => {
    setEditingSet({
      ...set,
      topicName,
      subName,
      catSlug,
    });
    setSetTagsInput((set.tags || []).join(", "));
  };

  // Save set tags
  const handleSaveSetTags = async () => {
    if (!editingSet) return;
    setIsSaving(true);
    try {
      const tagsArray = setTagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/taxonomy-hierarchy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_set_tags",
          setId: editingSet.id,
          tags: tagsArray,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Tags updated for ${editingSet.title}!`);
        // Update local state
        setData((prev) => {
          const nextCategories = prev.categories.map((c) => ({
            ...c,
            subcategories: (c.subcategories || []).map((sub) => ({
              ...sub,
              topics: (sub.topics || []).map((topic) => ({
                ...topic,
                sets: (topic.sets || []).map((s) =>
                  s.id === editingSet.id ? { ...s, tags: tagsArray } : s
                ),
              })),
            })),
          }));
          return { ...prev, categories: nextCategories };
        });
        setEditingSet(null);
      } else {
        toast.error("Failed to save set tags");
      }
    } catch (err) {
      toast.error("Error saving set tags");
    } finally {
      setIsSaving(false);
    }
  };

  // Add tag to topic
  const handleAddTopicTag = async (catSlug, subSlug, topic) => {
    if (!newTopicTagInput.trim()) return;
    const tagToAdd = newTopicTagInput.trim();
    const updatedTags = Array.from(new Set([...(topic.tags || []), tagToAdd]));
    const topicKey = `${catSlug}::${subSlug}::${topic.name}`;

    try {
      const res = await fetch("/api/admin/taxonomy-hierarchy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_topic_tags",
          topicKey,
          tags: updatedTags,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Tag "${tagToAdd}" added to ${topic.name}!`);
        // Update local state
        setData((prev) => {
          const nextCategories = prev.categories.map((c) => ({
            ...c,
            subcategories: (c.subcategories || []).map((sub) => ({
              ...sub,
              topics: (sub.topics || []).map((t) =>
                t.slug === topic.slug ? { ...t, tags: updatedTags } : t
              ),
            })),
          }));
          return { ...prev, categories: nextCategories };
        });
        setAddingTagToTopic(null);
        setNewTopicTagInput("");
      }
    } catch {
      toast.error("Failed to add topic tag");
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "28px" }}>🗂️</span>
            <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#0F172A", margin: 0 }}>
              Master Taxonomy & Sets Manager
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "#64748B", marginTop: "6px" }}>
            Hierarchical structure: <strong style={{ color: "#4F46E5" }}>Main Category</strong> ➔ <strong style={{ color: "#2563EB" }}>Sub Category</strong> ➔ <strong style={{ color: "#059669" }}>Topics</strong> ➔ <strong style={{ color: "#D97706" }}>Reference Chapters / Tags</strong> ➔ <strong style={{ color: "#7C3AED" }}>Quiz Sets</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link
            href="/admin/dataset-rules"
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              background: "#EEF2FF",
              color: "#4338CA",
              fontWeight: 700,
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid #C7D2FE",
            }}
          >
            <span>🎛️</span>
            <span>Dataset Rules</span>
          </Link>
          <button
            onClick={loadHierarchy}
            disabled={loading}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              fontWeight: 700,
              fontSize: "13px",
              color: "#334155",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Master Categories</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#1E293B", marginTop: "4px" }}>
            {data.stats?.totalCategories || 40}
          </div>
          <div style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, marginTop: "2px" }}>100% Canonical Structure</div>
        </div>

        <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Sub Categories</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#2563EB", marginTop: "4px" }}>
            {data.stats?.totalSubcategories || 180}
          </div>
          <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>Domain Level Partitioning</div>
        </div>

        <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Topics & Subjects</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#059669", marginTop: "4px" }}>
            {data.stats?.totalTopics || 520}
          </div>
          <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>Granular Study Modules</div>
        </div>

        <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Quiz Sets</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#7C3AED", marginTop: "4px" }}>
            {data.stats?.totalSets || 344}
          </div>
          <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>20 Questions / Progressive Difficulty</div>
        </div>

        <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Keyword Reference Tags</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#D97706", marginTop: "4px" }}>
            {data.stats?.totalTags || 1420}
          </div>
          <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>Direct-link search triggers (e.g. Ganga)</div>
        </div>
      </div>

      {/* Control Bar: Search & Category Chips */}
      <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "16px", border: "1px solid #E2E8F0", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category, topic, chapter (e.g. 'Ganga', 'Rivers', 'Ancient India')..."
              style={{
                width: "100%",
                padding: "10px 14px 10px 42px",
                borderRadius: "12px",
                border: "1px solid #CBD5E1",
                fontSize: "14px",
                fontWeight: 600,
                outline: "none",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={expandAll}
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              background: "#F1F5F9",
              border: "none",
              fontSize: "13px",
              fontWeight: 700,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              background: "#F1F5F9",
              border: "none",
              fontSize: "13px",
              fontWeight: 700,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            Collapse All
          </button>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          <button
            onClick={() => setSelectedMainCat("all")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: selectedMainCat === "all" ? "1.5px solid #4F46E5" : "1px solid #E2E8F0",
              background: selectedMainCat === "all" ? "#EEF2FF" : "#F8FAFC",
              color: selectedMainCat === "all" ? "#4F46E5" : "#64748B",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            All Categories ({data.categories?.length || 40})
          </button>
          {(data.categories || []).map((cat) => {
            const isSel = selectedMainCat === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedMainCat(cat.slug)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: isSel ? "1.5px solid #4F46E5" : "1px solid #E2E8F0",
                  background: isSel ? "#EEF2FF" : "#F8FAFC",
                  color: isSel ? "#4F46E5" : "#334155",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{cat.icon || "📚"}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Hierarchical Tree View */}
      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center", background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px auto", color: "#4F46E5" }} />
          <p style={{ fontWeight: 700, color: "#475569" }}>Loading full taxonomy hierarchy & sets...</p>
        </div>
      ) : displayedCategories.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>🔍</div>
          <p style={{ fontWeight: 800, color: "#1E293B", fontSize: "16px" }}>No categories or topics found</p>
          <p style={{ color: "#64748B", fontSize: "13px" }}>Try searching for &quot;Ganga&quot;, &quot;Rivers&quot;, &quot;History&quot;, or clear the search query.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {displayedCategories.map((cat) => {
            const isCatExpanded = expandedNodes.has(cat.slug);
            return (
              <div
                key={cat.slug}
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                {/* LEVEL 1: Master Category Header */}
                <div
                  onClick={() => toggleNode(cat.slug)}
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: isCatExpanded ? "#F8FAFC" : "#FFFFFF",
                    borderBottom: isCatExpanded ? "1px solid #E2E8F0" : "none",
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "background 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                      {isCatExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#EEF2FF", border: "1px solid #E0E7FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
                      {cat.icon || "📚"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px", fontWeight: "900", color: "#0F172A" }}>
                          {cat.name}
                        </span>
                        {cat.nameHi && (
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748B" }}>
                            ({cat.nameHi})
                          </span>
                        )}
                        <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", background: "#ECFDF5", color: "#065F46", padding: "2px 8px", borderRadius: "12px", border: "1px solid #A7F3D0" }}>
                          Level 1 · Master
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                        {cat.example ? `Scope: ${cat.example}` : cat.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", background: "#F1F5F9", color: "#334155", padding: "4px 10px", borderRadius: "10px" }}>
                      {cat.subcategories?.length || 0} Subcategories
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: "700", background: "#F0FDF4", color: "#166534", padding: "4px 10px", borderRadius: "10px" }}>
                      {cat.totalTopics} Topics
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: "700", background: "#FAF5FF", color: "#6B21A8", padding: "4px 10px", borderRadius: "10px" }}>
                      {cat.totalSets} Sets
                    </span>
                    <Link
                      href={`/category/${cat.slug}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      style={{ padding: "6px", borderRadius: "8px", color: "#64748B", display: "flex", alignItems: "center" }}
                      title="Open category web view"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                </div>

                {/* LEVEL 2: Subcategories Accordion */}
                {isCatExpanded && (
                  <div style={{ padding: "16px 20px 20px 48px", background: "#FAFAFA", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {(cat.subcategories || []).map((sub) => {
                      const subNodeId = `${cat.slug}::${sub.slug}`;
                      const isSubExpanded = expandedNodes.has(subNodeId);
                      return (
                        <div
                          key={sub.slug}
                          style={{
                            background: "#FFFFFF",
                            borderRadius: "14px",
                            border: "1px solid #E2E8F0",
                            overflow: "hidden",
                          }}
                        >
                          {/* Subcategory Row */}
                          <div
                            onClick={() => toggleNode(subNodeId)}
                            style={{
                              padding: "12px 16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: isSubExpanded ? "#F1F5F9" : "#FFFFFF",
                              borderBottom: isSubExpanded ? "1px solid #E2E8F0" : "none",
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ color: "#64748B" }}>
                                {isSubExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                              </div>
                              <span style={{ fontSize: "14px", fontWeight: "800", color: "#1E293B" }}>
                                📁 {sub.name}
                              </span>
                              <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", background: "#EFF6FF", color: "#1D4ED8", padding: "2px 6px", borderRadius: "8px" }}>
                                Level 2 · Subcategory
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569" }}>
                                {sub.topics?.length || 0} Topics
                              </span>
                            </div>
                          </div>

                          {/* LEVEL 3 & 4 & 5: Topics, Chapters/Tags, and Sets */}
                          {isSubExpanded && (
                            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                              {(sub.topics || []).map((topic) => {
                                const topicNodeId = `${cat.slug}::${sub.slug}::${topic.slug}`;
                                const isTopicExpanded = expandedNodes.has(topicNodeId);

                                return (
                                  <div
                                    key={topic.slug}
                                    style={{
                                      background: "#F8FAFC",
                                      borderRadius: "12px",
                                      border: "1px solid #E2E8F0",
                                      padding: "12px 14px",
                                    }}
                                  >
                                    {/* Topic Header Row */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                                      <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                          <span style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A" }}>
                                            🎯 {topic.name}
                                          </span>
                                          <span style={{ fontSize: "10px", fontWeight: "700", background: "#ECFDF5", color: "#047857", padding: "2px 6px", borderRadius: "6px" }}>
                                            Level 3 · Topic
                                          </span>
                                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B" }}>
                                            ({topic.sets?.length || 0} Sets)
                                          </span>
                                        </div>

                                        {/* LEVEL 4: Reference Chapters / Subject Tags Chips */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <Tag size={12} /> Reference Tags:
                                          </span>
                                          {(topic.tags || []).map((t) => (
                                            <span
                                              key={t}
                                              style={{
                                                fontSize: "11px",
                                                fontWeight: "700",
                                                background: "#FEF3C7",
                                                color: "#92400E",
                                                padding: "2px 8px",
                                                borderRadius: "12px",
                                                border: "1px solid #FDE68A",
                                              }}
                                            >
                                              🏷️ {t}
                                            </span>
                                          ))}

                                          {/* Add Tag Button */}
                                          {addingTagToTopic === topic.slug ? (
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                              <input
                                                type="text"
                                                value={newTopicTagInput}
                                                onChange={(e) => setNewTopicTagInput(e.target.value)}
                                                placeholder="e.g. Ganga"
                                                style={{
                                                  padding: "2px 8px",
                                                  fontSize: "11px",
                                                  borderRadius: "8px",
                                                  border: "1px solid #CBD5E1",
                                                  outline: "none",
                                                  width: "100px",
                                                }}
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") handleAddTopicTag(cat.slug, sub.slug, topic);
                                                  if (e.key === "Escape") setAddingTagToTopic(null);
                                                }}
                                              />
                                              <button
                                                onClick={() => handleAddTopicTag(cat.slug, sub.slug, topic)}
                                                style={{ padding: "2px 6px", borderRadius: "6px", background: "#059669", color: "#fff", border: "none", fontSize: "11px", cursor: "pointer" }}
                                              >
                                                Add
                                              </button>
                                              <button
                                                onClick={() => setAddingTagToTopic(null)}
                                                style={{ padding: "2px 4px", background: "none", border: "none", color: "#64748B", fontSize: "11px", cursor: "pointer" }}
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => {
                                                setAddingTagToTopic(topic.slug);
                                                setNewTopicTagInput("");
                                              }}
                                              style={{
                                                fontSize: "10px",
                                                fontWeight: "800",
                                                background: "#F1F5F9",
                                                color: "#475569",
                                                border: "1px dashed #CBD5E1",
                                                borderRadius: "10px",
                                                padding: "2px 8px",
                                                cursor: "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "2px",
                                              }}
                                            >
                                              <Plus size={10} /> Add Tag
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      <div style={{ display: "flex", gap: "6px" }}>
                                        <button
                                          onClick={() => toggleNode(topicNodeId)}
                                          style={{
                                            padding: "4px 10px",
                                            borderRadius: "8px",
                                            background: "#FFFFFF",
                                            border: "1px solid #CBD5E1",
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            color: "#334155",
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                          }}
                                        >
                                          {isTopicExpanded ? "Hide Sets" : "Inspect Sets"}
                                          {isTopicExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                        </button>
                                        <Link
                                          href={`/category/${cat.slug}?sub=${encodeURIComponent(sub.slug)}&topic=${encodeURIComponent(topic.name)}`}
                                          target="_blank"
                                          style={{
                                            padding: "4px 8px",
                                            borderRadius: "8px",
                                            background: "#EEF2FF",
                                            border: "1px solid #C7D2FE",
                                            color: "#4338CA",
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            textDecoration: "none",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                          }}
                                        >
                                          <span>Play</span>
                                          <ExternalLink size={10} />
                                        </Link>
                                      </div>
                                    </div>

                                    {/* LEVEL 5: Sets List with Tag Keyword Bindings */}
                                    {isTopicExpanded && (
                                      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #E2E8F0" }}>
                                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748B", textTransform: "uppercase", marginBottom: "8px" }}>
                                          Level 5 · Quiz Sets ({topic.sets?.length || 0})
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                                          {(topic.sets || []).map((s) => (
                                            <div
                                              key={s.id}
                                              style={{
                                                background: "#FFFFFF",
                                                borderRadius: "10px",
                                                border: "1px solid #E2E8F0",
                                                padding: "10px 12px",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "space-between",
                                                gap: "8px",
                                              }}
                                            >
                                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                <div>
                                                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#0F172A" }}>
                                                    {s.title}
                                                  </span>
                                                  <span style={{ fontSize: "11px", color: "#64748B", marginLeft: "6px" }}>
                                                    · {s.questionCount} Questions
                                                  </span>
                                                </div>

                                                <button
                                                  onClick={() => handleOpenSetTagEditor(s, topic.name, sub.name, cat.slug)}
                                                  style={{
                                                    padding: "3px 8px",
                                                    borderRadius: "6px",
                                                    background: "#F1F5F9",
                                                    border: "1px solid #CBD5E1",
                                                    fontSize: "10px",
                                                    fontWeight: "700",
                                                    color: "#334155",
                                                    cursor: "pointer",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                  }}
                                                >
                                                  <Edit2 size={10} /> Edit Tags
                                                </button>
                                              </div>

                                              {/* Progressive Difficulty Indicator */}
                                              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#64748B" }}>
                                                <span style={{ background: "#DCFCE7", color: "#166534", padding: "1px 6px", borderRadius: "6px", fontWeight: "700" }}>
                                                  Easy: {s.difficultyBalance?.easy || 7}
                                                </span>
                                                <span style={{ background: "#FEF9C3", color: "#854D0E", padding: "1px 6px", borderRadius: "6px", fontWeight: "700" }}>
                                                  Med: {s.difficultyBalance?.medium || 7}
                                                </span>
                                                <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "1px 6px", borderRadius: "6px", fontWeight: "700" }}>
                                                  Hard: {s.difficultyBalance?.hard || 6}
                                                </span>
                                              </div>

                                              {/* Set Specific Tags */}
                                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                                                {(s.tags && s.tags.length > 0 ? s.tags : ["Standard"]).map((st) => (
                                                  <span
                                                    key={st}
                                                    style={{
                                                      fontSize: "10px",
                                                      fontWeight: "600",
                                                      background: "#EDE9FE",
                                                      color: "#5B21B6",
                                                      padding: "1px 6px",
                                                      borderRadius: "8px",
                                                    }}
                                                  >
                                                    🏷️ {st}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Set Tag Editor Modal */}
      {editingSet && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setEditingSet(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🏷️</span>
                <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#0F172A", margin: 0 }}>
                  Edit Reference Tags: {editingSet.title}
                </h3>
              </div>
              <button
                onClick={() => setEditingSet(null)}
                style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "16px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "16px", lineHeight: "1.5" }}>
              These reference keyword tags allow users to search for chapters like <strong>&quot;Ganga&quot;</strong> or <strong>&quot;Yamuna&quot;</strong> and deep-link directly into this set. Separate tags with commas.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                Tags (Comma Separated)
              </label>
              <textarea
                value={setTagsInput}
                onChange={(e) => setSetTagsInput(e.target.value)}
                placeholder="e.g. Ganga, Bhagirathi, Alaknanda, Haridwar, Varanasi"
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: "1px solid #CBD5E1",
                  fontSize: "14px",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setEditingSet(null)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: "#F1F5F9",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSetTags}
                disabled={isSaving}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  background: "#4F46E5",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {isSaving ? "Saving..." : "Save Set Tags"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
