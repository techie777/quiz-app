"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Globe,
  Landmark,
  Languages,
  LayoutDashboard,
  FolderTree,
  Sliders,
  Wand2,
  Layers,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Eye,
  ArrowUpDown,
  Download,
  Upload,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Pin,
  Check,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { GK_CATEGORIES, DIFFICULTY_CONFIG } from "@/lib/gkData";

export default function AdminGkPage() {
  // Top-level category and language switcher
  const [category, setCategory] = useState(GK_CATEGORIES.INDIA);
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState("overview");

  // Tab 1: Overview State
  const [overviewData, setOverviewData] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Tab 2: Topics State
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicNameHi, setNewTopicNameHi] = useState("");
  const [newTopicIcon, setNewTopicIcon] = useState("🏛️");
  const [editingTopic, setEditingTopic] = useState(null);

  // Tab 3: Rules State
  const [rules, setRules] = useState(null);
  const [feasibility, setFeasibility] = useState(null);
  const [loadingRules, setLoadingRules] = useState(false);
  const [savingRules, setSavingRules] = useState(false);

  // Tab 4: Set Builder State
  const [dryRunResult, setDryRunResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [builderScope, setBuilderScope] = useState("all"); // "topic" | "master" | "all"
  const [allowPartialFinal, setAllowPartialFinal] = useState(false);
  const [regenerateUnlockedOnly, setRegenerateUnlockedOnly] = useState(true);

  // Tab 5: Sets State
  const [sets, setSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [setFilterScope, setSetFilterScope] = useState("all");
  const [selectedPreviewSet, setSelectedPreviewSet] = useState(null);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [editingTagsSet, setEditingTagsSet] = useState(null);
  const [tagsInput, setTagsInput] = useState("");
  const [swapModal, setSwapModal] = useState(null); // { set, oldQ }
  const [swapSearch, setSwapSearch] = useState("");
  const [swapCandidates, setSwapCandidates] = useState([]);

  // Tab 6: Questions State
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [qPage, setQPage] = useState(1);
  const [qTotalPages, setQTotalPages] = useState(1);
  const [qTotalCount, setQTotalCount] = useState(0);
  const [qSearch, setQSearch] = useState("");
  const [qTopicFilter, setQTopicFilter] = useState("all");
  const [qDiffFilter, setQDiffFilter] = useState("all");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [bulkEditField, setBulkEditField] = useState("difficulty");
  const [bulkEditValue, setBulkEditValue] = useState("medium");

  // Initial fetch on category or language change
  useEffect(() => {
    if (activeTab === "overview") fetchOverview();
    if (activeTab === "topics") fetchTopics();
    if (activeTab === "rules") fetchRules();
    if (activeTab === "builder") { fetchRules(); fetchTopics(); }
    if (activeTab === "sets") fetchSets();
    if (activeTab === "questions") fetchQuestions(1);
  }, [category, language, activeTab]);

  // ── API: FETCH OVERVIEW ──
  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await fetch(`/api/admin/gk/overview?category=${encodeURIComponent(category)}&language=${language}`);
      const data = await res.json();
      if (res.ok) setOverviewData(data);
    } catch (e) {
      toast.error("Failed to load GK overview");
    } finally {
      setLoadingOverview(false);
    }
  };

  // ── API: FETCH TOPICS ──
  const fetchTopics = async () => {
    setLoadingTopics(true);
    try {
      const res = await fetch(`/api/admin/gk/topics?category=${encodeURIComponent(category)}&language=${language}`);
      const data = await res.json();
      if (res.ok) setTopics(data.topics || []);
    } catch (e) {
      toast.error("Failed to load topics");
    } finally {
      setLoadingTopics(false);
    }
  };

  // ── API: FETCH RULES ──
  const fetchRules = async () => {
    setLoadingRules(true);
    try {
      const res = await fetch(`/api/admin/gk/rules?category=${encodeURIComponent(category)}&language=${language}`);
      const data = await res.json();
      if (res.ok) {
        setRules(data.rules);
        setFeasibility(data.feasibility);
      }
    } catch (e) {
      toast.error("Failed to load rules");
    } finally {
      setLoadingRules(false);
    }
  };

  // ── API: SAVE RULES ──
  const handleSaveRules = async () => {
    setSavingRules(true);
    try {
      const res = await fetch("/api/admin/gk/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, language, rules }),
      });
      if (res.ok) {
        toast.success("Rules saved successfully!");
        fetchRules();
      } else {
        toast.error("Failed to save rules");
      }
    } catch (e) {
      toast.error("Error saving rules");
    } finally {
      setSavingRules(false);
    }
  };

  // ── API: FETCH SETS ──
  const fetchSets = async () => {
    setLoadingSets(true);
    try {
      let url = `/api/admin/gk/sets?category=${encodeURIComponent(category)}&language=${language}`;
      if (setFilterScope !== "all") url += `&scope=${setFilterScope}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setSets(data.sets || []);
    } catch (e) {
      toast.error("Failed to load sets");
    } finally {
      setLoadingSets(false);
    }
  };

  // ── API: FETCH QUESTIONS ──
  const fetchQuestions = async (page = 1) => {
    setLoadingQuestions(true);
    try {
      let url = `/api/admin/gk/questions?category=${encodeURIComponent(category)}&language=${language}&page=${page}&limit=25`;
      if (qSearch.trim()) url += `&search=${encodeURIComponent(qSearch.trim())}`;
      if (qTopicFilter !== "all") url += `&topicId=${qTopicFilter}`;
      if (qDiffFilter !== "all") url += `&difficulty=${qDiffFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
        setQTotalPages(data.totalPages || 1);
        setQTotalCount(data.total || 0);
        setQPage(page);
      }
    } catch (e) {
      toast.error("Failed to load questions");
    } finally {
      setLoadingQuestions(false);
    }
  };

  // ── SET BUILDER: DRY RUN ──
  const handleDryRun = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/gk/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "dry_run",
          category,
          language,
          type: builderScope,
          allowPartialFinalSet: allowPartialFinal,
          regenerateUnlockedOnly,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDryRunResult(data.preview);
        toast.success("Dry-run preview generated!");
      } else {
        toast.error(data.error || "Dry run failed");
      }
    } catch (e) {
      toast.error("Dry run error");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── SET BUILDER: EXECUTE SAVE ──
  const handleExecuteGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/gk/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          category,
          language,
          type: builderScope,
          allowPartialFinalSet: allowPartialFinal,
          regenerateUnlockedOnly,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Generated & saved ${data.summary.savedCount} sets!`);
        setDryRunResult(null);
        fetchOverview();
      } else {
        toast.error(data.error || "Generation failed");
      }
    } catch (e) {
      toast.error("Generation error");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── SETS: PREVIEW QUESTIONS ──
  const handlePreviewSet = async (setDoc) => {
    setSelectedPreviewSet(setDoc);
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/admin/gk/sets?setId=${setDoc.id}`);
      const data = await res.json();
      if (res.ok) {
        setPreviewQuestions(data.questions || []);
      }
    } catch (e) {
      toast.error("Failed to load set preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  // ── SETS: TOGGLE PUBLISH ──
  const handleTogglePublishSet = async (setDoc) => {
    const isCurrentlyPublished = setDoc.status === "published";
    const nextAction = isCurrentlyPublished ? "unpublish" : "publish";

    try {
      const res = await fetch("/api/admin/gk/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextAction, setId: setDoc.id }),
      });
      if (res.ok) {
        toast.success(isCurrentlyPublished ? "Set unpublished (Draft)" : "Set published & locked!");
        fetchSets();
      }
    } catch (e) {
      toast.error("Failed to toggle publish status");
    }
  };

  // ── TOPICS: DRAG & DROP ORDER UPDATE ──
  const handleMoveTopic = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= topics.length) return;

    const newTopics = [...topics];
    const temp = newTopics[index];
    newTopics[index] = newTopics[targetIdx];
    newTopics[targetIdx] = temp;

    const reordered = newTopics.map((t, idx) => ({ id: t.id, order: idx + 1 }));
    setTopics(newTopics.map((t, idx) => ({ ...t, order: idx + 1 })));

    try {
      await fetch("/api/admin/gk/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", items: reordered }),
      });
      toast.success("Topic order saved");
    } catch (e) {
      toast.error("Failed to save order");
    }
  };

  // ── TOPICS: TOGGLE HOME PIN ──
  const handleToggleHomePin = async (topicDoc) => {
    try {
      await fetch("/api/admin/gk/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: topicDoc.id,
          updates: { showOnHome: !topicDoc.showOnHome },
        }),
      });
      toast.success(topicDoc.showOnHome ? "Unpinned from home" : "Pinned to home!");
      fetchTopics();
    } catch (e) {
      toast.error("Failed to update home pin");
    }
  };

  // ── TOPICS: BULK PIN TO HOME ──
  const handleBulkPinToHome = async () => {
    if (selectedTopicIds.length === 0) return;
    try {
      await fetch("/api/admin/gk/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin_home", topicIds: selectedTopicIds, showOnHome: true }),
      });
      toast.success(`Pinned ${selectedTopicIds.length} topics to home!`);
      setSelectedTopicIds([]);
      fetchTopics();
    } catch (e) {
      toast.error("Failed to bulk pin");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <Toaster position="top-right" />

      {/* ── TOP HEADER & DUAL SWITCHERS ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-black tracking-wide uppercase mb-2">
              <Sparkles size={13} />
              <span>GK MANAGEMENT SUITE</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              General Knowledge Engine
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Control India GK & World GK topics, 20-question sets, difficulty ramps, and Play All master paths.
            </p>
          </div>

          {/* Category & Language Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Segmented Control: India GK | World GK */}
            <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCategory(GK_CATEGORIES.INDIA)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  category === GK_CATEGORIES.INDIA
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Landmark size={14} />
                <span>India GK</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory(GK_CATEGORIES.WORLD)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  category === GK_CATEGORIES.WORLD
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Globe size={14} />
                <span>World GK</span>
              </button>
            </div>

            {/* Language Segmented Control: Hindi | English */}
            <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                  language === "en"
                    ? "bg-white text-indigo-700 dark:bg-slate-900 dark:text-indigo-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                  language === "hi"
                    ? "bg-white text-indigo-700 dark:bg-slate-900 dark:text-indigo-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>

        {/* ── SUB-NAVIGATION TABS (6 TABS) ── */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800 pt-4">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "topics", label: "Topics (100)", icon: FolderTree },
            { id: "rules", label: "Rules & Feasibility", icon: Sliders },
            { id: "builder", label: "Set Builder", icon: Wand2 },
            { id: "sets", label: "Sets Management", icon: Layers },
            { id: "questions", label: "Questions Browser", icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {loadingOverview ? (
            <div className="p-12 text-center text-slate-400 font-bold text-sm">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
              Loading {category} overview...
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 block mb-1">
                    Total Questions
                  </span>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {overviewData?.totals?.questions?.toLocaleString() || 0}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 mt-1 block">
                    {category} · {language.toUpperCase()}
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] font-black uppercase text-purple-600 dark:text-purple-400 block mb-1">
                    Active Topics
                  </span>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {overviewData?.totals?.topics || 0}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 mt-1 block">
                    Controlled Rotation
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-1">
                    Published Sets
                  </span>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {overviewData?.totals?.sets || 0}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 mt-1 block">
                    Topic & Master Sets
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 block mb-1">
                    Unassigned Pool
                  </span>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {overviewData?.totals?.unassigned || 0}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 mt-1 block">
                    Available for Sets
                  </span>
                </div>
              </div>

              {/* Difficulty Breakdown Bar */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Questions by Difficulty Level
                    </h3>
                    <p className="text-xs text-slate-500">
                      Standardized 4 levels including Expert purple
                    </p>
                  </div>
                  <span className="text-xs font-black text-slate-600">
                    Total: {overviewData?.difficultyBreakdown?.total || 0}
                  </span>
                </div>

                {/* Stacked bar */}
                <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                  {["easy", "medium", "hard", "expert"].map((diff) => {
                    const count = overviewData?.difficultyBreakdown?.[diff] || 0;
                    const total = overviewData?.difficultyBreakdown?.total || 1;
                    const pct = Math.max(0, (count / total) * 100);
                    const color =
                      diff === "easy"
                        ? "#16A34A"
                        : diff === "medium"
                        ? "#D97706"
                        : diff === "hard"
                        ? "#DC2626"
                        : "#7C3AED";
                    return (
                      <div
                        key={diff}
                        style={{ width: `${pct}%`, backgroundColor: color }}
                        title={`${diff.toUpperCase()}: ${count} (${pct.toFixed(1)}%)`}
                        className="h-full transition-all duration-300"
                      />
                    );
                  })}
                </div>

                {/* Legend Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {[
                    { key: "easy", label: "Easy", count: overviewData?.difficultyBreakdown?.easy || 0, cfg: DIFFICULTY_CONFIG.easy },
                    { key: "medium", label: "Medium", count: overviewData?.difficultyBreakdown?.medium || 0, cfg: DIFFICULTY_CONFIG.medium },
                    { key: "hard", label: "Hard", count: overviewData?.difficultyBreakdown?.hard || 0, cfg: DIFFICULTY_CONFIG.hard },
                    { key: "expert", label: "Expert", count: overviewData?.difficultyBreakdown?.expert || 0, cfg: DIFFICULTY_CONFIG.expert },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="p-3 rounded-2xl border flex items-center justify-between"
                      style={{ backgroundColor: item.cfg.bg, borderColor: item.cfg.border }}
                    >
                      <span className="text-xs font-black" style={{ color: item.cfg.color }}>
                        {item.label}
                      </span>
                      <span className="text-sm font-black" style={{ color: item.cfg.color }}>
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings List */}
              {overviewData?.warnings?.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-900/60 p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-black text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <span>Topic Warnings ({overviewData.warnings.length})</span>
                  </h3>

                  <div className="divide-y divide-amber-100 dark:divide-amber-950/40 text-xs">
                    {overviewData.warnings.slice(0, 10).map((w, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between gap-3">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{w.message}</span>
                        <Link
                          href={`/admin/upload`}
                          className="text-[11px] font-bold text-indigo-600 hover:underline shrink-0"
                        >
                          Upload Questions →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: TOPICS MANAGEMENT (UP TO 100 TOPICS)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "topics" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {category} Topics Order & Home Pins
              </h3>
              <p className="text-xs text-slate-500">
                Drag or reorder topics. Order controls Play All rotation. Toggle &apos;Show on Home&apos; for Explorer home grid.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkPinToHome}
                disabled={selectedTopicIds.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold disabled:opacity-40"
              >
                <Pin size={13} />
                <span>Pin Selected to Home ({selectedTopicIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddTopicModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-sm"
              >
                <Plus size={14} />
                <span>Add Topic</span>
              </button>
            </div>
          </div>

          {/* Topics Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-black text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="p-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={selectedTopicIds.length === topics.length && topics.length > 0}
                        onChange={(e) =>
                          setSelectedTopicIds(e.target.checked ? topics.map((t) => t.id) : [])
                        }
                      />
                    </th>
                    <th className="p-3.5 w-16">Order</th>
                    <th className="p-3.5">Topic Name</th>
                    <th className="p-3.5">Hindi Name</th>
                    <th className="p-3.5 text-center">Difficulty Mix</th>
                    <th className="p-3.5 text-center">Total Qs</th>
                    <th className="p-3.5 text-center">Sets</th>
                    <th className="p-3.5 text-center">Weight</th>
                    <th className="p-3.5 text-center">Show on Home</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  {topics.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={selectedTopicIds.includes(t.id)}
                          onChange={(e) =>
                            setSelectedTopicIds(
                              e.target.checked
                                ? [...selectedTopicIds, t.id]
                                : selectedTopicIds.filter((id) => id !== t.id)
                            )
                          }
                        />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 font-mono text-slate-500 font-bold">
                          <span>#{t.order || idx + 1}</span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleMoveTopic(idx, -1)}
                              disabled={idx === 0}
                              className="text-[10px] text-slate-400 hover:text-slate-800 disabled:opacity-20"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveTopic(idx, 1)}
                              disabled={idx === topics.length - 1}
                              className="text-[10px] text-slate-400 hover:text-slate-800 disabled:opacity-20"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{t.icon || "📚"}</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{t.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-500">{t.nameHi || "-"}</td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1 text-[10px] font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {t.stats?.easy || 0}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            {t.stats?.medium || 0}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                            {t.stats?.hard || 0}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                            {t.stats?.expert || 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-bold">{t.questionCount || 0}</td>
                      <td className="p-3.5 text-center font-bold text-indigo-600">{t.setsCount || 0}</td>
                      <td className="p-3.5 text-center">
                        <input
                          type="number"
                          defaultValue={t.weight || 1}
                          min="1"
                          max="10"
                          onBlur={async (e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            await fetch("/api/admin/gk/topics", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "update", id: t.id, updates: { weight: val } }),
                            });
                          }}
                          className="w-12 text-center p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-bold"
                        />
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleHomePin(t)}
                          className={`p-1.5 rounded-xl transition-all ${
                            t.showOnHome
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                          title={t.showOnHome ? "Pinned on Home" : "Click to Pin on Home"}
                        >
                          <Pin size={15} />
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`Delete topic '${t.name}'?`)) return;
                            await fetch("/api/admin/gk/topics", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "delete", id: t.id }),
                            });
                            fetchTopics();
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: RULES & FEASIBILITY CHECK
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          {loadingRules || !rules ? (
            <div className="p-12 text-center text-slate-400 font-bold text-sm">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
              Loading rules & feasibility check...
            </div>
          ) : (
            <>
              {/* Feasibility Check Card */}
              {feasibility && (
                <div
                  className={`p-6 rounded-3xl border shadow-sm ${
                    feasibility.possibleSets > 0
                      ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-600" />
                      <span>Set Feasibility Check ({category} · {language.toUpperCase()})</span>
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-white dark:bg-slate-900 text-xs font-black border border-slate-200 dark:border-slate-800">
                      Possible Master Sets: {feasibility.possibleSets}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80">
                      <span className="text-slate-400 block text-[10.5px]">Easy Questions</span>
                      <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                        {feasibility.available?.easy || 0} / req {feasibility.required?.easy || 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80">
                      <span className="text-slate-400 block text-[10.5px]">Medium Questions</span>
                      <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                        {feasibility.available?.medium || 0} / req {feasibility.required?.medium || 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80">
                      <span className="text-slate-400 block text-[10.5px]">Hard Questions</span>
                      <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                        {feasibility.available?.hard || 0} / req {feasibility.required?.hard || 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80">
                      <span className="text-slate-400 block text-[10.5px]">Expert Questions</span>
                      <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                        {feasibility.available?.expert || 0} / req {feasibility.required?.expert || 0}
                      </div>
                    </div>
                  </div>

                  {feasibility.warnings?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                      {feasibility.warnings.map((w, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle size={13} />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Set Configuration Form */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Topic Set Mix Configuration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Each topic set is 20 questions = 7 Easy + 7 Medium + 6 Hard/Expert
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase text-slate-500 block mb-1">Set Size</label>
                    <input
                      type="number"
                      value={rules.setSize || 20}
                      onChange={(e) => setRules({ ...rules, setSize: parseInt(e.target.value, 10) || 20 })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase text-emerald-600 block mb-1">Easy Qs</label>
                    <input
                      type="number"
                      value={rules.topicSetMix?.easy ?? 7}
                      onChange={(e) =>
                        setRules({
                          ...rules,
                          topicSetMix: { ...rules.topicSetMix, easy: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase text-amber-600 block mb-1">Medium Qs</label>
                    <input
                      type="number"
                      value={rules.topicSetMix?.medium ?? 7}
                      onChange={(e) =>
                        setRules({
                          ...rules,
                          topicSetMix: { ...rules.topicSetMix, medium: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase text-purple-600 block mb-1">Hard + Expert Qs</label>
                    <input
                      type="number"
                      value={rules.topicSetMix?.hardExpert ?? 6}
                      onChange={(e) =>
                        setRules({
                          ...rules,
                          topicSetMix: { ...rules.topicSetMix, hardExpert: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Difficulty Ramp Table (Play All Master Path) */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Play All Difficulty Ramp Table (Master Path)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        First 40% = Phase 1 (Easy + Medium only); rising to Hard & Expert in Phases 2 & 3.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-black text-slate-600">
                        <tr>
                          <th className="p-3">Phase</th>
                          <th className="p-3">Name</th>
                          <th className="p-3">% Range</th>
                          <th className="p-3 text-emerald-600">Easy</th>
                          <th className="p-3 text-amber-600">Medium</th>
                          <th className="p-3 text-rose-600">Hard</th>
                          <th className="p-3 text-purple-600">Expert</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold">
                        {(rules.ramp || []).map((phase, pIdx) => (
                          <tr key={pIdx}>
                            <td className="p-3">Phase {phase.phase}</td>
                            <td className="p-3">{phase.name} ({phase.nameHi})</td>
                            <td className="p-3">{phase.fromPct}% – {phase.toPct}%</td>
                            <td className="p-3 text-emerald-600">{phase.easy}</td>
                            <td className="p-3 text-amber-600">{phase.medium}</td>
                            <td className="p-3 text-rose-600">{phase.hard}</td>
                            <td className="p-3 text-purple-600">{phase.expert}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveRules}
                  disabled={savingRules}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {savingRules ? "Saving..." : "Save Rules Configuration"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: SET BUILDER (DRY RUN & GENERATOR)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "builder" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Automated Set Generator & Set Builder
              </h3>
              <p className="text-xs text-slate-500">
                Rule 3.1 & 3.2: Generates 20-question sets with strict difficulty ordering (easy → expert).
              </p>
            </div>

            {/* Scope Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "all", title: "Generate All Sets", desc: "Topic Sets + Play All Master Path" },
                { id: "topic", title: "Topic Sets Only", desc: "7 easy + 7 medium + 6 hard/expert per topic" },
                { id: "master", title: "Play All Path Only", desc: "Even topic distribution with difficulty ramp" },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setBuilderScope(opt.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    builderScope === opt.id
                      ? "bg-purple-50/90 dark:bg-purple-950/40 border-2 border-purple-600 shadow-xs"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="text-xs font-black text-slate-900 dark:text-white mb-0.5">{opt.title}</div>
                  <div className="text-[11px] text-slate-500">{opt.desc}</div>
                </div>
              ))}
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regenerateUnlockedOnly}
                  onChange={(e) => setRegenerateUnlockedOnly(e.target.checked)}
                />
                <span>Regenerate unlocked sets only (protect published user progress)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPartialFinal}
                  onChange={(e) => setAllowPartialFinal(e.target.checked)}
                />
                <span>Allow final partial set (min 10 questions)</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDryRun}
                disabled={isGenerating}
                className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black transition-colors"
              >
                <span>🔍 Dry-Run Preview (No Save)</span>
              </button>

              <button
                type="button"
                onClick={handleExecuteGenerate}
                disabled={isGenerating}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-500/20 transition-all active:scale-95"
              >
                <span>⚡ Execute & Save Sets</span>
              </button>
            </div>
          </div>

          {/* Dry Run Preview Results Card */}
          {dryRunResult && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-200 dark:border-purple-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-purple-600" />
                  <span>Dry-Run Generation Preview</span>
                </h4>
                <div className="text-xs font-bold text-slate-500">
                  {dryRunResult.topicSets?.length || 0} Topic Sets · {dryRunResult.masterSets?.length || 0} Master Sets
                </div>
              </div>

              {/* Leftovers stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-400 block text-[10.5px]">Leftover Easy Qs</span>
                  <span className="font-extrabold text-sm">{dryRunResult.leftovers?.easy || 0}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-400 block text-[10.5px]">Leftover Medium Qs</span>
                  <span className="font-extrabold text-sm">{dryRunResult.leftovers?.medium || 0}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-400 block text-[10.5px]">Leftover Hard Qs</span>
                  <span className="font-extrabold text-sm">{dryRunResult.leftovers?.hard || 0}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-400 block text-[10.5px]">Leftover Expert Qs</span>
                  <span className="font-extrabold text-sm">{dryRunResult.leftovers?.expert || 0}</span>
                </div>
              </div>

              {/* Sample Sets Preview List */}
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {[...(dryRunResult.masterSets || []), ...(dryRunResult.topicSets || [])].slice(0, 15).map((s, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-slate-900 dark:text-white">
                        {s.scope === "master" ? `Play All Set ${s.number}` : `${s.topicName || "Topic"} Set ${s.number}`}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Tags: [{s.tags?.join(", ") || "-"}] · Mix: {s.mix?.easy}E / {s.mix?.medium}M / {s.mix?.hard}H / {s.mix?.expert}Ex
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                      {s.scope}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 5: SETS MANAGEMENT
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "sets" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {category} Sets Library ({sets.length} Sets)
              </h3>
              <p className="text-xs text-slate-500">
                Inspect 20 questions per set, preview, publish, lock status, and edit set tags.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={setFilterScope}
                onChange={(e) => setSetFilterScope(e.target.value)}
                className="text-xs font-bold p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none"
              >
                <option value="all">All Scopes</option>
                <option value="master">Play All (Master Path)</option>
                <option value="topic">Topic Sets</option>
              </select>
            </div>
          </div>

          {/* Sets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.map((setDoc) => (
              <div
                key={setDoc.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {setDoc.scope === "master" ? `Play All Set ${setDoc.number}` : `Set ${setDoc.number}`}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {setDoc.locked ? (
                        <span className="p-1 rounded-md bg-slate-100 text-slate-500" title="Locked (Published)">
                          <Lock size={12} />
                        </span>
                      ) : (
                        <span className="p-1 rounded-md bg-amber-100 text-amber-600" title="Unlocked (Draft)">
                          <Unlock size={12} />
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          setDoc.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {setDoc.status || "draft"}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1 mb-3">
                    {(setDoc.tags || []).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Difficulty Mix Bar */}
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 mb-1">
                    <div style={{ width: `${((setDoc.mix?.easy || 0) / 20) * 100}%` }} className="bg-emerald-500 h-full" />
                    <div style={{ width: `${((setDoc.mix?.medium || 0) / 20) * 100}%` }} className="bg-amber-500 h-full" />
                    <div style={{ width: `${((setDoc.mix?.hard || 0) / 20) * 100}%` }} className="bg-rose-500 h-full" />
                    <div style={{ width: `${((setDoc.mix?.expert || 0) / 20) * 100}%` }} className="bg-purple-600 h-full" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>{setDoc.mix?.easy || 0}E / {setDoc.mix?.medium || 0}M / {setDoc.mix?.hard || 0}H / {setDoc.mix?.expert || 0}Ex</span>
                    <span>20 Qs</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handlePreviewSet(setDoc)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    <Eye size={13} />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePublishSet(setDoc)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${
                      setDoc.status === "published"
                        ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <span>{setDoc.status === "published" ? "Unpublish" : "Publish"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Set Questions Preview Modal */}
          {selectedPreviewSet && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Preview: Set {selectedPreviewSet.number} ({selectedPreviewSet.scope})
                    </h3>
                    <p className="text-xs text-slate-500">20 Questions in play order (Easy → Expert)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewSet(null)}
                    className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 py-3 space-y-2">
                  {loadingPreview ? (
                    <div className="p-8 text-center text-slate-400 font-bold">Loading questions...</div>
                  ) : (
                    previewQuestions.map((q, idx) => (
                      <div key={q.id || idx} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2 flex-1">
                          <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{q.text}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Ans: <span className="font-bold text-emerald-600">{q.correctAnswer}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                            q.difficulty === "easy"
                              ? "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]"
                              : q.difficulty === "hard"
                              ? "bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]"
                              : q.difficulty === "expert"
                              ? "bg-[#EDE9FE] text-[#7C3AED] border-[#C4B5FD]"
                              : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                          }`}
                        >
                          {q.difficulty?.toUpperCase()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 6: QUESTIONS BROWSER
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "questions" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchQuestions(1)}
                  placeholder="Search question text in GK bank..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={qTopicFilter}
                onChange={(e) => setQTopicFilter(e.target.value)}
                className="text-xs font-bold p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none"
              >
                <option value="all">All Topics</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select
                value={qDiffFilter}
                onChange={(e) => setQDiffFilter(e.target.value)}
                className="text-xs font-bold p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>

              <button
                type="button"
                onClick={() => fetchQuestions(1)}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0"
              >
                Search
              </button>
            </div>

            {/* Bulk Action Controls */}
            {selectedQuestionIds.length > 0 && (
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between gap-3 text-xs">
                <span className="font-extrabold text-purple-900 dark:text-purple-200">
                  {selectedQuestionIds.length} questions selected
                </span>

                <div className="flex items-center gap-2">
                  <select
                    value={bulkEditValue}
                    onChange={(e) => setBulkEditValue(e.target.value)}
                    className="p-1.5 rounded-xl border text-xs font-bold"
                  >
                    <option value="easy">Set Easy</option>
                    <option value="medium">Set Medium</option>
                    <option value="hard">Set Hard</option>
                    <option value="expert">Set Expert</option>
                  </select>

                  <button
                    type="button"
                    onClick={async () => {
                      await fetch("/api/admin/gk/questions", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "bulk_edit",
                          questionIds: selectedQuestionIds,
                          updates: { difficulty: bulkEditValue },
                        }),
                      });
                      toast.success("Difficulty updated!");
                      setSelectedQuestionIds([]);
                      fetchQuestions(qPage);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold"
                  >
                    Apply
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`Delete ${selectedQuestionIds.length} questions?`)) return;
                      await fetch("/api/admin/gk/questions", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "delete", questionIds: selectedQuestionIds }),
                      });
                      toast.success("Deleted questions");
                      setSelectedQuestionIds([]);
                      fetchQuestions(qPage);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Questions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-black text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="p-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.length === questions.length && questions.length > 0}
                        onChange={(e) =>
                          setSelectedQuestionIds(e.target.checked ? questions.map((q) => q.id) : [])
                        }
                      />
                    </th>
                    <th className="p-3.5">Question Text</th>
                    <th className="p-3.5">Correct Answer</th>
                    <th className="p-3.5">Difficulty</th>
                    <th className="p-3.5">Exam Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  {questions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.includes(q.id)}
                          onChange={(e) =>
                            setSelectedQuestionIds(
                              e.target.checked
                                ? [...selectedQuestionIds, q.id]
                                : selectedQuestionIds.filter((id) => id !== q.id)
                            )
                          }
                        />
                      </td>
                      <td className="p-3.5 max-w-md">
                        <div className="font-extrabold text-slate-900 dark:text-white line-clamp-2">{q.text}</div>
                        {q.explanation && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">💡 {q.explanation}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-emerald-600 font-bold">{q.correctAnswer}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            q.difficulty === "easy"
                              ? "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]"
                              : q.difficulty === "hard"
                              ? "bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]"
                              : q.difficulty === "expert"
                              ? "bg-[#EDE9FE] text-[#7C3AED] border-[#C4B5FD]"
                              : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                          }`}
                        >
                          {q.difficulty?.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(q.examTags || []).map((tag, tIdx) => (
                            <span key={tIdx} className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Total {qTotalCount} questions</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchQuestions(qPage - 1)}
                  disabled={qPage <= 1}
                  className="px-3 py-1.5 rounded-xl border disabled:opacity-30"
                >
                  Previous
                </button>
                <span>
                  Page {qPage} of {qTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => fetchQuestions(qPage + 1)}
                  disabled={qPage >= qTotalPages}
                  className="px-3 py-1.5 rounded-xl border disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Topic */}
      {showAddTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Add New Topic</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Topic Name (English)</label>
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="e.g. Indian Polity & Governance"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Topic Name (Hindi)</label>
                <input
                  type="text"
                  value={newTopicNameHi}
                  onChange={(e) => setNewTopicNameHi(e.target.value)}
                  placeholder="e.g. भारतीय राजव्यवस्था"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Icon Emoji</label>
                <input
                  type="text"
                  value={newTopicIcon}
                  onChange={(e) => setNewTopicIcon(e.target.value)}
                  className="w-16 p-2 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-lg font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddTopicModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!newTopicName.trim()) return;
                  await fetch("/api/admin/gk/topics", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "bulk_add",
                      category,
                      topics: [{ name: newTopicName, nameHi: newTopicNameHi, icon: newTopicIcon }],
                    }),
                  });
                  toast.success("Topic added!");
                  setShowAddTopicModal(false);
                  setNewTopicName("");
                  setNewTopicNameHi("");
                  fetchTopics();
                }}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                Save Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
