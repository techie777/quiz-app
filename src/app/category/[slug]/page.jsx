"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useData } from "@/context/DataContext";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";
import { useMonetization } from "@/context/MonetizationContext";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Check, ChevronDown, ArrowLeft, Play, Eye, Lock, Clock, Sparkles, Tag } from "lucide-react";
import toast from "react-hot-toast";
import styles from "@/styles/CategorySets.module.css";
import ResumeBanner from "@/components/ResumeBanner";
import QuizEmptyState from "@/components/QuizEmptyState";
import SetCard, { FREE_SETS_QUOTA } from "@/components/SetCard";
import SetPreviewModal from "@/components/SetPreviewModal";
import CategoryCard from "@/components/CategoryCard";
import UnifiedPaywallModal from "@/components/UnifiedPaywallModal";
import StickyPaywallCTA from "@/components/StickyPaywallCTA";
import ProBannerStrip from "@/components/monetization/ProBannerStrip";
import { useEntitlement } from "@/context/EntitlementContext";
import ArenaClient from "@/app/arena/ArenaClient";
import CategoryBreadcrumbs from "@/components/category/CategoryBreadcrumbs";
import { getMainCategoryBySlug } from "@/lib/mainCategoriesConfig";
import { orderQuestionsProgressiveDifficulty } from "@/lib/prng";
import { generateSmartQuizSets } from "@/lib/setGenerationRules";

// Helper function to detect if text is Hindi
function isHindiText(text) {
  if (!text || typeof text !== 'string') return false;
  const hindiRegex = /[\u0900-\u097F]/;
  return hindiRegex.test(text);
}

// Helper function to detect quiz language
function detectQuizLanguage(questions) {
  if (!questions || !Array.isArray(questions) || questions.length === 0) return 'en';
  const sampleQuestions = questions.slice(0, Math.min(3, questions.length));
  let hindiCount = 0;
  sampleQuestions.forEach(q => {
    const hasHindi = isHindiText(q.text) || (Array.isArray(q.options) && q.options.some(opt => isHindiText(opt)));
    if (hasHindi) hindiCount++;
  });
  return hindiCount > sampleQuestions.length / 2 ? 'hi' : 'en';
}

const SETS_PER_PAGE = 8;

// Client in-memory cache for ultra-fast 0ms category & set loading
const CLIENT_CATEGORY_CACHE = new Map();

export default function CategorySetsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subParam = searchParams?.get("sub") || null;
  const topicParam = searchParams?.get("topic") || null;
  const tagParam = searchParams?.get("tag") || null;
  const setParam = searchParams?.get("set") || null;

  const slugKey = params?.slug;
  const cachedInitial = slugKey ? CLIENT_CATEGORY_CACHE.get(slugKey) : null;

  const [selectedSubCategory, setSelectedSubCategory] = useState(subParam);
  const [selectedTopic, setSelectedTopic] = useState(topicParam);
  const [selectedTag, setSelectedTag] = useState(tagParam);

  const { quizzes } = useData();
  const { startQuizSet, startQuizResume } = useQuiz();
  const { data: session } = useSession();
  const { t, isHindi, language: globalLang } = useLanguage();
  const { tier } = useTier();
  const effectiveSetSize = tier === "kids" ? 10 : 20;

  const [category, setCategory] = useState(cachedInitial?.category || null);

  // Sync state if query params change
  useEffect(() => {
    if (subParam !== selectedSubCategory) setSelectedSubCategory(subParam);
    if (topicParam !== selectedTopic) setSelectedTopic(topicParam);
    if (tagParam !== selectedTag) setSelectedTag(tagParam);
  }, [subParam, topicParam, tagParam]);

  const mainCategoryConfig = useMemo(() => {
    return category?.mainCategoryConfig || getMainCategoryBySlug(params?.slug) || null;
  }, [category, params?.slug]);

  const availableSubCategories = useMemo(() => {
    // 1. From database category subCategories if populated
    if (category && Array.isArray(category.subCategories) && category.subCategories.length > 0) {
      return category.subCategories.map((sc) => ({
        id: sc.id || sc._id || sc.slug,
        name: sc.topic || sc.name,
        nameHi: sc.topicHi || sc.nameHi || "",
        slug: sc.slug,
        topics: Array.isArray(sc.chips) ? sc.chips : (Array.isArray(sc.topics) ? sc.topics : []),
        questionCount: sc.questionCount || 0,
      }));
    }
    // 2. Fallback to mainCategoryConfig taxonomy so official subcategories are always visible & organized
    if (mainCategoryConfig && Array.isArray(mainCategoryConfig.subcategories) && mainCategoryConfig.subcategories.length > 0) {
      return mainCategoryConfig.subcategories.map((sc) => ({
        id: sc.slug,
        name: sc.name,
        nameHi: sc.nameHi || sc.name,
        slug: sc.slug,
        topics: Array.isArray(sc.topics) ? sc.topics : [],
        questionCount: 0,
      }));
    }
    return [];
  }, [category, mainCategoryConfig]);

  const activeSubCategoryObj = useMemo(() => {
    if (!selectedSubCategory) return null;
    return (
      availableSubCategories.find(
        (s) =>
          s.slug === selectedSubCategory ||
          s.name?.toLowerCase() === selectedSubCategory.toLowerCase()
      ) || { name: selectedSubCategory, slug: selectedSubCategory, topics: [] }
    );
  }, [availableSubCategories, selectedSubCategory]);

  const availableTopics = useMemo(() => {
    return activeSubCategoryObj?.topics || [];
  }, [activeSubCategoryObj]);

  const [questions, setQuestions] = useState(cachedInitial?.questions || []);
  const [loading, setLoading] = useState(!cachedInitial);
  const [error, setError] = useState(null);
  const [questionsLoaded, setQuestionsLoaded] = useState(!!cachedInitial);
  const [setSize, setSetSize] = useState(20);
  const [activeModalSet, setActiveModalSet] = useState(null);
  const [previewSet, setPreviewSet] = useState(null);
  const [page, setPage] = useState(1);

  // Scroll to top when page changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  const [timer, setTimer] = useState(0);
  const [language, setLanguage] = useState(globalLang);
  const [learningMode, setLearningMode] = useState("quiz"); // 'quiz' | 'flashcard' | 'read'
  const [selectedSet, setSelectedSet] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [searchQuestion, setSearchQuestion] = useState("");
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());
  const [isTranslatingIndex, setIsTranslatingIndex] = useState(false);
  const [userProgress, setUserProgress] = useState([]);
  const [showResumeChoice, setShowResumeChoice] = useState(false);
  const [isMixMode, setIsMixMode] = useState(false);
  const [numQuestions, setNumQuestions] = useState(20);
  const [difficulty, setDifficulty] = useState("ALL");
  const [activeLayer, setActiveLayer] = useState("standard"); // Rule 6: 'standard' | 'arena'
  const { isPro: isMonetizationPro } = useMonetization();
  const {
    isSetLocked,
    countdownFormatted,
    countdownFormattedHi,
    openLockedSheet,
    isPro: isEntitlementPro,
    freeSetsPerWindow,
  } = useEntitlement();
  const isPro = isEntitlementPro || isMonetizationPro;

  const [paywallModalOpen, setPaywallModalOpen] = useState(false);
  const [paywallItemTitle, setPaywallItemTitle] = useState("");

  const handleLockedClick = (set) => {
    const targetSetId = `${category?.slug || category?.id || params?.slug}-${set?.index || 1}`;
    openLockedSheet(
      {
        ...set,
        categorySlug: category?.slug || category?.id || params?.slug,
        id: targetSetId,
        topic: category?.topic,
      },
      () => {
        handlePlay(set);
      }
    );
  };
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Pre-fetch quiz page route for zero-delay navigation
  useEffect(() => {
    if (category?.slug || category?.id) {
      router.prefetch(`/quiz/${category.slug || category.id}`);
    }
  }, [category, router]);

  useEffect(() => {
    if (selectedSet && (category?.slug || category?.id)) {
      router.prefetch(`/quiz/${category.slug || category.id}`);
    }
  }, [selectedSet, category, router]);

  // Sync index language with quiz context when clicking toggle
  const { translateQuiz } = useQuiz();

  const TIMER_OPTIONS = useMemo(() => [
    { label: "No Timer", value: 0 },
    { label: "30s", value: 30 },
    { label: "60s", value: 60 },
    { label: "90s", value: 90 },
  ], []);

  // Update document title dynamically
  useEffect(() => {
    if (category?.topic) {
      document.title = `${category.topic} | QuizWeb Pro`;
    }
  }, [category, isHindi]);

  // Sync with global language toggle
  useEffect(() => {
    if (globalLang !== language && questionsLoaded) {
      handleLanguageToggle(globalLang);
    }
  }, [globalLang]);

  // Ultra-light single fetch with instant client cache & background revalidation
  useEffect(() => {
    if (!params.slug) return;
    const currentSlug = params.slug;
    const cached = CLIENT_CATEGORY_CACHE.get(currentSlug);

    // If already in client cache, skip spinner and show immediately!
    if (!cached) {
      setLoading(true);
    }
    setError(null);

    fetch(`/api/categories/${currentSlug}?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Category not found");
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);

        let finalCategory = data;
        if (globalLang === "hi" && data.topicHi) {
          finalCategory = {
            ...data,
            topic: data.topicHi,
            description: data.descriptionHi || data.description,
          };
        }

        const qs = Array.isArray(data.questions) ? data.questions : [];

        // Save to client cache for instant 0ms subsequent loads
        CLIENT_CATEGORY_CACHE.set(currentSlug, {
          category: finalCategory,
          questions: qs,
        });

        setCategory(finalCategory);
        setQuestions(qs);
        setQuestionsLoaded(true);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading category data:", err);
        if (!cached) {
          setError(err.message);
          setLoading(false);
        }
      });
  }, [params.slug, globalLang]);

  // Fetch progress
  useEffect(() => {
    if (session?.user && category?.id) {
      fetch(`/api/progress?categoryId=${category.id}`)
        .then(res => res.json())
        .then(data => setUserProgress(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error("Error fetching progress:", err);
        });
    }
  }, [session?.user, category?.id]);

  const displayedQuestions = useMemo(() => {
    if (!questions || !Array.isArray(questions)) return [];
    let list = questions;

    // Filter by selected subcategory or topic if active
    if (selectedTopic) {
      const topLower = selectedTopic.toLowerCase();
      const filtered = list.filter((q) => {
        const full = `${q.text || ""} ${q.explanation || ""} ${q.subjectName || ""} ${q.topicName || ""}`.toLowerCase();
        return full.includes(topLower);
      });
      if (filtered.length > 0) list = filtered;
    } else if (activeSubCategoryObj) {
      const subLower = activeSubCategoryObj.name?.toLowerCase() || "";
      const topicMatches = activeSubCategoryObj.topics || [];
      const filtered = list.filter((q) => {
        const full = `${q.text || ""} ${q.explanation || ""} ${q.subjectName || ""} ${q.topicName || ""}`.toLowerCase();
        return full.includes(subLower) || topicMatches.some((t) => full.includes(t.toLowerCase()));
      });
      if (filtered.length > 0) list = filtered;
    }

    if (!difficulty || difficulty === "ALL") return list;
    return list.filter(
      (q) => (q.difficulty || "").toLowerCase() === difficulty.toLowerCase()
    );
  }, [questions, difficulty, selectedTopic, activeSubCategoryObj]);

  const sets = useMemo(() => {
    if (!category || !effectiveSetSize || effectiveSetSize <= 0) return [];
    const pool = tier === "adults" ? displayedQuestions : questions;
    if (!pool || pool.length === 0) return [];

    const generated = generateSmartQuizSets({
      questions: pool,
      category,
      selectedSubCategory: activeSubCategoryObj?.name || null,
      selectedTopic: selectedTopic || null,
      effectiveSetSize: effectiveSetSize || 20,
      rulesMode: "dynamic",
    });

    const quizSetsList = Array.isArray(category.quizSets) ? category.quizSets : [];
    const quizSetMap = new Map();
    quizSetsList.forEach((qs) => {
      quizSetMap.set(qs.setIndex, qs);
    });

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const nowTime = Date.now();

    return generated.map((s) => {
      const persisted = quizSetMap.get(s.index);

      // Check if persisted set was created in the last 7 days
      const persistedCreatedAt = persisted?.createdAt;
      const isPersistedNew = Boolean(
        persistedCreatedAt &&
        !isNaN(new Date(persistedCreatedAt).getTime()) &&
        (nowTime - new Date(persistedCreatedAt).getTime()) <= SEVEN_DAYS_MS
      );

      // Check if any question in this set was created/added in the last 7 days
      const hasRecentQuestions = Array.isArray(s.questions) && s.questions.some((q) => {
        if (!q?.createdAt) return false;
        const qTime = new Date(q.createdAt).getTime();
        return !isNaN(qTime) && (nowTime - qTime) <= SEVEN_DAYS_MS;
      });

      const isNew = Boolean(persisted?.isNew || isPersistedNew || hasRecentQuestions);

      return {
        ...s,
        title: persisted?.title || s.title,
        titleHi: persisted?.titleHi || s.titleHi,
        createdAt: persistedCreatedAt || (hasRecentQuestions ? new Date() : null),
        isNew: isNew,
      };
    });
  }, [category, displayedQuestions, questions, effectiveSetSize, tier, activeSubCategoryObj, selectedTopic]);

  const topicReferenceTags = useMemo(() => {
    // STRICT RULE: Do not show tags unless specifically entered/tagged by admin
    // for this quiz topic, subcategory, or category, or present in the questions.
    const tagsSet = new Set();

    // 1. Tags explicitly configured for the selected topic
    if (selectedTopic) {
      if (activeSubCategoryObj?.topicTags?.[selectedTopic] && Array.isArray(activeSubCategoryObj.topicTags[selectedTopic])) {
        activeSubCategoryObj.topicTags[selectedTopic].forEach((t) => t && tagsSet.add(String(t).trim()));
      }
      if (category?.customTags?.[selectedTopic] && Array.isArray(category.customTags[selectedTopic])) {
        category.customTags[selectedTopic].forEach((t) => t && tagsSet.add(String(t).trim()));
      }
    }

    // 2. Tags explicitly configured for the active subcategory
    if (activeSubCategoryObj?.tags && Array.isArray(activeSubCategoryObj.tags)) {
      activeSubCategoryObj.tags.forEach((t) => t && tagsSet.add(String(t).trim()));
    }
    if (activeSubCategoryObj?.chapters && Array.isArray(activeSubCategoryObj.chapters)) {
      activeSubCategoryObj.chapters.forEach((t) => t && tagsSet.add(String(t).trim()));
    }
    if (activeSubCategoryObj?.name && category?.customTags?.[activeSubCategoryObj.name] && Array.isArray(category.customTags[activeSubCategoryObj.name])) {
      category.customTags[activeSubCategoryObj.name].forEach((t) => t && tagsSet.add(String(t).trim()));
    }

    // 3. Category level tags specifically added by admin
    if (category?.tags && Array.isArray(category.tags)) {
      category.tags.forEach((t) => t && tagsSet.add(String(t).trim()));
    }

    // 4. Tags present on questions in this current scope
    const relevantQuestions = (questions || []).filter((q) => {
      if (selectedTopic) {
        return q.topic === selectedTopic || q.subTopic === selectedTopic || q.topicName === selectedTopic;
      }
      if (activeSubCategoryObj) {
        return q.subCategory === activeSubCategoryObj.name || q.subjectName === activeSubCategoryObj.name;
      }
      return true;
    });

    for (const q of relevantQuestions) {
      if (Array.isArray(q?.tags)) {
        for (const t of q.tags) {
          if (t && typeof t === "string" && t.trim()) {
            tagsSet.add(t.trim());
          }
        }
      }
    }

    return Array.from(tagsSet).slice(0, 12);
  }, [selectedTopic, activeSubCategoryObj, category, questions]);

  const getSetTags = (set) => {
    // Only return actual tags that were tagged on this set or its questions
    if (Array.isArray(set.tags) && set.tags.length > 0) {
      return set.tags.slice(0, 3);
    }
    const qTags = (set.questions || [])
      .flatMap((q) => (Array.isArray(q.tags) ? q.tags : []))
      .filter(Boolean);
    if (qTags.length > 0) {
      return Array.from(new Set(qTags)).slice(0, 3);
    }
    return [];
  };

  const filteredSets = useMemo(() => {
    if (!selectedTag || selectedTag === "ALL") return sets;
    const tagLower = selectedTag.toLowerCase();
    const matched = sets.filter((s) => {
      const sTags = getSetTags(s).map((t) => t.toLowerCase());
      const hasDirectTag = sTags.some((t) => t.includes(tagLower));
      const hasQMatch = s.questions.some((q) => {
        const text = `${q.text || ""} ${q.explanation || ""}`.toLowerCase();
        return text.includes(tagLower) || (q.tags || []).some((t) => t.toLowerCase().includes(tagLower));
      });
      return hasDirectTag || hasQMatch;
    });
    return matched.length > 0 ? matched : sets;
  }, [sets, selectedTag, topicReferenceTags]);

  useEffect(() => {
    if (setParam && questionsLoaded) {
      setTimeout(() => {
        const el = document.getElementById(`set-tile-${setParam}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [setParam, questionsLoaded]);

  const getSetCompletionInfo = (set) => {
    const progress = Array.isArray(userProgress)
      ? userProgress.find((p) => p.setIndex === set.index)
      : null;

    if (!progress) {
      try {
        const guestScores = JSON.parse(localStorage.getItem("quiz_guest_scores") || "{}");
        const key = `${category?.id || params.slug}_set_${set.index}`;
        if (guestScores[key]) {
          return {
            isComplete: true,
            bestScore: guestScores[key].score,
            total: guestScores[key].total || set.questions.length,
          };
        }
      } catch {}
      return { isComplete: false, bestScore: null, total: set.questions.length };
    }

    const isComplete = Boolean(progress.isComplete);
    let bestScore = progress.score;
    let total = set.questions.length || 20;

    if (progress.answersJson) {
      try {
        const ans = JSON.parse(progress.answersJson);
        if (Array.isArray(ans)) {
          const correct = ans.filter((a) => a.isCorrect).length;
          bestScore = correct;
          total = ans.length || total;
        }
      } catch {}
    }

    return {
      isComplete,
      bestScore: bestScore !== undefined && bestScore !== null ? bestScore : null,
      total,
    };
  };

  const startQuizDirectly = (set) => {
    // Save to recent categories so PLAY centre button knows user's preferred categories
    try {
      const recent = JSON.parse(localStorage.getItem("quiz_recent_categories") || "[]");
      const filtered = recent.filter((id) => id !== category.id && id !== category.slug);
      filtered.unshift(category.slug || category.id);
      localStorage.setItem("quiz_recent_categories", JSON.stringify(filtered.slice(0, 5)));
    } catch {}

    const topicSuffix = ` ${isHindi ? "सेट" : "Set"} ${set.index}`;
    startQuizSet(
      category.id,
      set.questions,
      30,
      language || "en",
      set.index,
      category.topic + topicSuffix,
      true
    );
    router.push(`/quiz/${category.slug || category.id}?set=${set.index}`);
  };

  const handleTileClick = (set) => {
    if (!set || !set.questions || set.questions.length === 0) return;

    const targetSetId = `${category?.slug || category?.id || params?.slug}-${set.index}`;
    const isLocked = isSetLocked ? isSetLocked(set.index, targetSetId) : (set.index > (freeSetsPerWindow || 2) && !isPro);

    if (isLocked) {
      openLockedSheet(
        {
          ...set,
          categorySlug: category?.slug || category?.id || params?.slug,
          id: targetSetId,
          topic: category?.topic,
        },
        () => {
          handlePlay(set);
        }
      );
      return;
    }

    handlePlay(set);
  };

  const paginatedSets = useMemo(() => {
    return sets.map(set => {
      const progress = Array.isArray(userProgress)
        ? userProgress.find(p => p.setIndex === set.index)
        : null;
      return { ...set, progress };
    }).slice((page - 1) * SETS_PER_PAGE, page * SETS_PER_PAGE);
  }, [sets, page, userProgress]);

  const totalPages = Math.ceil(sets.length / SETS_PER_PAGE);

  const filteredQuestions = useMemo(() => {
    if (!searchQuestion.trim()) return questions;
    return questions.filter(q =>
      (q?.text || "").toLowerCase().includes(searchQuestion.toLowerCase()) ||
      (q?.options && Array.isArray(q.options) && q.options.some(opt => (opt || "").toLowerCase().includes(searchQuestion.toLowerCase())))
    );
  }, [questions, searchQuestion]);

  const subCategories = useMemo(() => {
    return category?.subCategories || [];
  }, [category]);

  const handleLivePlay = (set) => {
    const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    toast.success("Creating live room for this set...");
    const setQuery = set ? `&setIndex=${set.index}` : '';
    router.push(`/live/${sessionId}?is_host=true&categoryId=${category?.id || params.slug}${setQuery}`);
  };

  // JSON-LD Schema for SEO
  const jsonLd = useMemo(() => {
    if (!category || !questionsLoaded || !Array.isArray(questions)) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Quiz",
      "name": category.topic || "",
      "description": category.description || "",
      "educationalAlignment": [
        {
          "@type": "AlignmentObject",
          "educationalFramework": "Educational Knowledge",
          "targetName": category.topic || ""
        }
      ],
      "hasPart": questions.slice(0, 50).map((q, idx) => {
        const correctText = String(q?.correctAnswer || "").trim();
        const correctIdx = Array.isArray(q?.options)
          ? q.options.findIndex(opt => String(opt || "").trim() === correctText)
          : -1;

        return {
          "@type": "Question",
          "name": q?.text || "",
          "educationalLevel": category.difficulty || "Beginner",
          "suggestedAnswer": [
            {
              "@type": "Answer",
              "text": (correctIdx !== -1 && Array.isArray(q?.options)) ? q.options[correctIdx] : correctText
            }
          ]
        };
      })
    };
  }, [category, questions, questionsLoaded]);


  const handleLanguageToggle = async (targetLang, overrideQuestions = null) => {
    const qToTranslate = overrideQuestions || questions;
    if (isTranslatingIndex || (targetLang === language && !overrideQuestions)) return;

    // Only translate if actually needed
    const currentContentLang = detectQuizLanguage(qToTranslate);
    
    setIsTranslatingIndex(true);
    try {
      // 1. Translate Metadata if needed
      if (category && targetLang === 'hi' && !isHindiText(category.topic)) {
         const metaRes = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: [category.topic, category.description || ""], from: 'en', to: 'hi' }),
         });
         if (metaRes.ok) {
            const { translations } = await metaRes.json();
            setCategory(prev => ({ ...prev, topic: translations[0], description: translations[1] }));
         }
      }
      
      // 2. Translate Questions
      if (currentContentLang !== targetLang) {
        const result = await translateQuiz(qToTranslate, currentContentLang, targetLang);
        if (result?.questions) {
          setQuestions(result.questions);
        }
      }
      setLanguage(targetLang);
    } catch (e) {
      console.error("Language toggle failed:", e);
    } finally {
      setIsTranslatingIndex(false);
    }
  };

  const handlePlay = (set) => {
    if (!questionsLoaded) {
      toast.error("Loading questions...");
      return;
    }
    setIsStarting(false);
    setIsMixMode(false);
    setSelectedSet(set);
    const detectedLang = detectQuizLanguage(set.questions);
    setLanguage(detectedLang);
    if (category?.slug || category?.id) {
      router.prefetch(`/quiz/${category.slug || category.id}`);
    }
  };

  const handlePlayMix = () => {
    if (!questionsLoaded) {
      toast.error("Loading questions...");
      return;
    }
    setIsStarting(false);
    setIsMixMode(true);
    setSelectedSet({ index: 'mix', questions: [] }); // Dummy set to open modal
    setLanguage(detectQuizLanguage(questions));
    if (category?.slug || category?.id) {
      router.prefetch(`/quiz/${category.slug || category.id}`);
    }
  };

  const handleStart = (mode = 'normal') => {
    if (!selectedSet || !questionsLoaded || isStarting) return;
    setIsStarting(true);

    let targetQuestions = selectedSet.questions;
    let topicSuffix = isMixMode 
      ? ` (${t('quizzes.category.megaMix')})` 
      : ` ${t('live.lobby.selection.set')} ${selectedSet.index}`;

    if (isMixMode) {
      let filtered = [...questions];
      if (difficulty !== "ALL") {
        filtered = filtered.filter(q => (q.difficulty || "").toUpperCase() === difficulty);
      }

      if (filtered.length === 0) {
        toast.error(`No ${difficulty.toLowerCase()} questions found in this category.`);
        setIsStarting(false);
        return;
      }

      const shuffled = filtered.sort(() => 0.5 - Math.random());
      targetQuestions = shuffled.slice(0, numQuestions);
    }

    if (selectedSet.progress && !selectedSet.progress.isComplete && mode !== 'fresh') {
      startQuizResume(selectedSet.progress, targetQuestions, mode);
    } else {
      startQuizSet(category.id, targetQuestions, timer, language, selectedSet.index, category.topic + topicSuffix, true);
    }
    const setIdx = selectedSet.index || 1;
    router.push(`/quiz/${category.slug || category.id}?set=${setIdx}&mode=${learningMode}`);
  };

  const toggleAnswer = (idx) => {
    setRevealedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.skeletonPage}>
          <div className={`${styles.skeletonHeader} ${styles.shimmer}`}></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`${styles.skeletonCard} ${styles.shimmer}`}></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-black text-slate-800">Mystery Not Found</h1>
        <p className="text-slate-500 max-w-md font-medium">
          We couldn&apos;t find the quiz category you&apos;re looking for. It might have moved or disappeared into the void!
        </p>
        <Link href="/" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">
          Back to Safety (Home)
        </Link>
      </div>
    );
  }

  return (
    <main className={styles.page}>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      <div className={styles.contentWrap}>
        {/* Dynamic 4-Level Breadcrumbs (Home > 🔬 Science > Physics > Optics > Lenses) */}
        <CategoryBreadcrumbs
          mainCategory={{
            name: category.topic,
            nameHi: category.topicHi,
            slug: category.slug || params.slug,
            icon: mainCategoryConfig?.icon || (category.emoji === "IN" ? "🇮🇳" : (category.emoji && category.emoji.length > 2 && !category.emoji.startsWith("http") ? category.emoji : (params.slug === "india-gk" ? "🇮🇳" : (category.emoji || "📚")))),
          }}
          subCategory={activeSubCategoryObj}
          topic={selectedTopic}
          onResetSubCategory={() => {
            setSelectedSubCategory(null);
            setSelectedTopic(null);
            setSelectedTag(null);
          }}
          onResetTopic={() => {
            setSelectedTopic(null);
            setSelectedTag(null);
          }}
          className="mb-5 pt-1"
        />

        {/* Step 3: Clean Two-Tab Switcher (Standard Sets | Quiz Arena) */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveLayer("standard")}
              className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeLayer === "standard"
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>📚</span>
              <span>{isHindi ? "स्टैंडर्ड सेट्स (20 प्रश्न)" : "Standard Sets (20 Qs)"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer("arena")}
              className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeLayer === "arena"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>⚡</span>
              <span>{isHindi ? "GK टेस्ट इंजन" : "GK Test Engine"}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            {activeLayer === "standard"
              ? (isHindi ? "📚 20 प्रश्नों के मानक स्टैटिक सेट्स हल करें" : "📚 20-question static sets with instant feedback")
              : (isHindi ? "⚔️ कठिनाई, टाइमर व प्रश्न प्रकार कस्टमाइज़ करके खेलें" : "⚔️ Custom build by difficulty, timer, question type & topics")}
          </p>
        </div>

        {/* Subcategories & Topics Drill-down Bar */}
        {availableSubCategories.length > 0 && activeLayer === "standard" && (
          <div className="mb-6 p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>📁</span>
                <span>{isHindi ? "उप-विषय (Sub-Categories)" : "Drill-Down Subcategories"}</span>
              </span>
              {(selectedSubCategory || selectedTopic) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubCategory(null);
                    setSelectedTopic(null);
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {isHindi ? "सभी प्रश्न दिखाएं" : "Show All Questions"}
                </button>
              )}
            </div>

            {/* Subcategory Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedSubCategory(null);
                  setSelectedTopic(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  !selectedSubCategory
                    ? "bg-indigo-600 text-white font-black shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {isHindi ? "सभी उप-विषय" : "All Subcategories"}
              </button>

              {availableSubCategories.map((sub) => {
                const isSelected = selectedSubCategory === sub.slug || selectedSubCategory === sub.name;
                return (
                  <button
                    key={sub.slug || sub.name}
                    type="button"
                    onClick={() => {
                      setSelectedSubCategory(isSelected ? null : (sub.slug || sub.name));
                      setSelectedTopic(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white font-black shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>

            {/* Topics under selected Subcategory */}
            {availableTopics.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1.5">
                  <span>🔬</span>
                  <span>{isHindi ? "टॉपिक्स (Topics):" : "Specific Topics:"}</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {availableTopics.map((top) => {
                    const isSelected = selectedTopic === top;
                    return (
                      <button
                        key={top}
                        type="button"
                        onClick={() => setSelectedTopic(isSelected ? null : top)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          isSelected
                            ? "bg-purple-600 text-white font-black shadow-xs"
                            : "bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-300"
                        }`}
                      >
                        {top}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reference Tags / Chapters for Fast Search & Set Filtering */}
            {topicReferenceTags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
                  <Tag size={12} /> {isHindi ? "अध्याय / संदर्भ टैग:" : "Chapters / Reference Tags:"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    !selectedTag
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {isHindi ? "सभी" : "All"}
                </button>
                {topicReferenceTags.map((t) => {
                  const isSel = selectedTag === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTag(isSel ? null : t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        isSel
                          ? "bg-amber-500 text-white font-black shadow-xs scale-105"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 hover:border-amber-400"
                      }`}
                    >
                      <span>🏷️</span>
                      <span>{t}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeLayer === "arena" ? (
          <div className="mb-12">
            <ArenaClient
              initialSelectedCategoryIds={[category?.id || category?._id || params?.slug]}
              embedded={true}
            />
          </div>
        ) : (
          <>
            {questionsLoaded && questions.length === 0 ? (
              <QuizEmptyState topic={category.topic} isHindi={isHindi} />
            ) : tier === "adults" ? (
          /* ── Explorer Set List (Step 10): Simple tiles "Set 1 · 20 Qs" with tick & best score, compact difficulty dropdown at top ── */
          <section className="mt-4 mb-10">
            {/* Header: Topic Title & Compact Difficulty Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/")}
                  className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={isHindi ? "होम पर वापस जाएं" : "Back to Home"}
                  aria-label={isHindi ? "होम पर वापस जाएं" : "Back to Home"}
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-2xl">{category.emoji === "IN" ? "🇮🇳" : (category.emoji || "📝")}</span>
                    <span>{category.topic}</span>
                  </h1>
                </div>
              </div>

              {/* Compact Difficulty Dropdown */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <label htmlFor="explorerDifficultySelect" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {isHindi ? "कठिनाई:" : "Difficulty:"}
                </label>
                <div className="relative">
                  <select
                    id="explorerDifficultySelect"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 pr-8 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] cursor-pointer shadow-sm"
                  >
                    <option value="ALL">{isHindi ? "सभी स्तर" : "All"}</option>
                    <option value="easy">{isHindi ? "सरल" : "Easy"}</option>
                    <option value="medium">{isHindi ? "मध्यम" : "Medium"}</option>
                    <option value="hard">{isHindi ? "कठिन" : "Hard"}</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>
            </div>

            {/* Ultra-light skeleton set tiles during initial load */}
            {!questionsLoaded ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 min-h-[52px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800/80"></div>
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800/80 rounded"></div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/60"></div>
                  </div>
                ))}
              </div>
            ) : filteredSets.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredSets.map((set) => {
                    const info = getSetCompletionInfo(set);
                    const targetSetId = `${category?.slug || category?.id || params?.slug}-${set.index}`;
                    const isLocked = isSetLocked ? isSetLocked(set.index, targetSetId) : false;
                    const setTags = getSetTags(set);
                    const isHighlighted = String(setParam) === String(set.index);

                    return (
                      <div
                        key={set.index}
                        id={`set-tile-${set.index}`}
                        onClick={() => handleTileClick(set)}
                        className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all text-left min-h-[52px] select-none cursor-pointer group shadow-sm hover:shadow-md ${
                          isHighlighted
                            ? "ring-2 ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700"
                            : isLocked
                            ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-700"
                            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/40"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                              isLocked
                                ? "bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                                : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40"
                            }`}
                          >
                            {isLocked ? <Lock size={13} strokeWidth={2.5} /> : set.index}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                              <span>{isHindi ? `सेट ${set.index} · ${set.questions.length} प्रश्न` : `Set ${set.index} · ${set.questions.length} Qs`}</span>
                              {(!info.isComplete || set.isNew || set.index <= 3) && (
                                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs tracking-wider inline-flex items-center gap-0.5">
                                  <span>✨</span>
                                  <span>{isHindi ? "नया" : "NEW"}</span>
                                </span>
                              )}
                              {isHighlighted && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                                  MATCH
                                </span>
                              )}
                            </span>
                            {/* Tags under set title (only if specifically tagged) */}
                            {setTags.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {setTags.map((st) => (
                                  <span key={st} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50">
                                    🏷️ {st}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Eye Preview Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewSet(set);
                            }}
                            title={isHindi ? "प्रश्न देखें (प्रिव्यू)" : "Preview Questions"}
                            aria-label="Preview questions"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center shadow-2xs"
                          >
                            <Eye size={16} />
                          </button>

                          {info.isComplete ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <Check size={13} strokeWidth={3} />
                              <span>{info.bestScore !== null ? `${info.bestScore}/${info.total}` : (isHindi ? "पूर्ण" : "Done")}</span>
                            </span>
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 group-hover:shadow-indigo-500/40 transition-all active:scale-95">
                              <Play size={13} fill="currentColor" className="translate-x-0.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {selectedTag
                    ? (isHindi ? `"${selectedTag}" टैग से संबंधित कोई प्रश्न नहीं मिले।` : `No sets found for tag "${selectedTag}".`)
                    : (isHindi ? "इस कठिनाई स्तर के लिए कोई प्रश्न नहीं मिले।" : "No questions found for this difficulty level.")}
                </p>
                <button
                  onClick={() => {
                    setDifficulty("ALL");
                    setSelectedTag(null);
                  }}
                  className="mt-2 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {isHindi ? "सभी स्तर व टैग देखें" : "View all sets & tags"}
                </button>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Sets Section (Seekho Pattern: Vertical Stack of Set Cards below one short intro line) */}
            <section className="mt-8 mb-10">
              <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    🎯 {t('quizzes.category.sets') || (isHindi ? "क्विज़ सेट्स" : "Quiz Sets")}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                    {sets.length} {isHindi ? "सेट्स" : "Sets"}
                  </span>
                </div>
                {/* One short intro line */}
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {isHindi
                    ? `${category.topic} के लिए ${effectiveSetSize}-प्रश्नों के सुनियोजित सेट्स हल करें और ज्ञान बढ़ाएं।`
                    : `Complete each ${effectiveSetSize}-question set to practice and master ${category.topic}.`}
                </p>
              </div>

              {/* Vertical list of Set cards with identical layout */}
              <div className="flex flex-col gap-3 sm:gap-3.5">
                {page === 1 && (
                  <SetCard 
                    isMix={true} 
                    categoryTopic={category.topic} 
                    handlePlayMix={handlePlayMix} 
                    mixQuestions={questions}
                    onPreviewSet={() => setPreviewSet({ index: "Mix", questions: questions.slice(0, 20) })}
                  />
                )}
                {paginatedSets.map((set) => (
                  <SetCard
                    key={set.index}
                    set={set}
                    categoryTopic={category.topic}
                    freeQuota={FREE_SETS_QUOTA}
                    handlePlay={handlePlay}
                    handleLivePlay={handleLivePlay}
                    handleLockedClick={handleLockedClick}
                    onPreviewSet={(s) => setPreviewSet(s)}
                  />
                ))}
              </div>

              {/* Step 10: Compact Pro strip at bottom of set list */}
              <ProBannerStrip />

              {totalPages > 1 && (
                <div className={styles.paginationArea}>
                  <button className={styles.pageArrow} disabled={page === 1} onClick={() => setPage(page - 1)}>&lt;</button>
                  <div className={styles.pageDots}>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button key={i} className={`${styles.pageDot} ${page === i + 1 ? styles.dotActive : ""}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                    ))}
                  </div>
                  <button className={styles.pageArrow} disabled={page === totalPages} onClick={() => setPage(page + 1)}>→</button>
                </div>
              )}
            </section>

            {/* --- Senior Strategy: SEO Question Index --- */}
            <section className={styles.seoIndexSection}>
              <div className={styles.indexHeader}>
                <div className={styles.indexTitleGroup}>
                  <h2 className={styles.indexTitle}>📑 {isHindi ? 'प्रश्न अनुक्रमणिका और अध्ययन मार्गदर्शिका' : 'Question Index & Study Guide'}</h2>
                </div>
                <div className={styles.searchBar}>
                  <span className={styles.searchIcon}>🔍</span>
                  <input
                    type="text"
                    placeholder={isHindi ? 'विशिष्ट प्रश्न खोजें...' : 'Search specific questions...'}
                    className={styles.searchInput}
                    value={searchQuestion}
                    onChange={(e) => setSearchQuestion(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.questionsList}>
                {!questionsLoaded ? <div className={styles.loadingIndex}>{isHindi ? 'प्रश्न अनुक्रमणिका अनुकूलित की जा रही है...' : 'Optimizing question index...'}</div> : (
                  sets.map((set) => {
                    const setQuestions = set.questions.filter(q =>
                      !searchQuestion.trim() ||
                      q.text.toLowerCase().includes(searchQuestion.toLowerCase()) ||
                      (q.options && q.options.some(opt => opt.toLowerCase().includes(searchQuestion.toLowerCase())))
                    );

                    if (setQuestions.length === 0) return null;

                    return (
                      <div key={set.index} className={styles.indexSetGroup}>
                        <div className={styles.indexSetHeader}>
                          <div className={styles.indexSetInfo}>
                            <h3 className={styles.indexSetTitle}>
                              {category.topic} {t('live.lobby.selection.set')} {set.index}
                            </h3>
                            <p className={styles.indexSetSub}>{isHindi ? 'प्रश्न' : 'Questions'} #{set.start + 1} {isHindi ? 'से' : 'to'} #{set.end}</p>
                          </div>
                          <button className={styles.indexPlayBtn} onClick={() => handlePlay(set)}>
                            {isHindi ? 'खेलें' : 'Play'} {category.topic} {isHindi ? 'क्विज़' : 'Quiz'} ({t('live.lobby.selection.set')} {set.index}) →
                          </button>
                        </div>
                        <div className={styles.indexSetQuestions}>
                          {setQuestions.map((q, qOffset) => {
                            const globalIdx = set.start + set.questions.indexOf(q);
                            return (
                              <div key={globalIdx} className={styles.indexItem}>
                                {/* Monetization Slot Placeholder */}
                                {globalIdx > 0 && globalIdx % 10 === 0 && <div className={styles.adPlaceholder}><span>ADVERTISEMENT SLOT</span></div>}

                                <div className={styles.indexQuestion}>
                                  <span className={styles.qNum}>#{globalIdx + 1}</span>
                                  <h3 className={styles.qText}>{q.text}</h3>
                                </div>

                                <ul className={styles.optionsList}>
                                  {q.options.map((opt, oIdx) => {
                                    const isCorrect = String(opt).trim() === String(q.correctAnswer).trim();
                                    const showCorrect = revealedAnswers.has(globalIdx) && isCorrect;
                                    return (
                                      <li key={oIdx} className={showCorrect ? styles.correctOpt : ""}>
                                        {opt} {showCorrect && <span className={styles.check}>✓</span>}
                                      </li>
                                    );
                                  })}
                                </ul>

                                <div className={styles.indexActions}>
                                  <button className={styles.revealBtn} onClick={() => toggleAnswer(globalIdx)}>
                                    {revealedAnswers.has(globalIdx) ? (isHindi ? 'उत्तर छिपाएं' : 'Hide Answer') : (isHindi ? 'उत्तर देखें' : 'View Answer')}
                                  </button>
                                </div>

                                <AnimatePresence>
                                  {revealedAnswers.has(globalIdx) && q.explanation && (
                                    <motion.div
                                      className={styles.expandedDetails}
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                    >
                                      <p className={styles.explanation}><strong>{isHindi ? 'स्पष्टीकरण:' : 'Explanation:'}</strong> {q.explanation}</p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
      </>
    )}
  </div>

      {/* Timer Modal (unchanged logic, updated UI) */}
      {/* Practice Set Configuration Modal (Refined, Sleek, Compact UI) */}
      {selectedSet && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={closeModal}
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>

            {/* Compact, Beautiful Header */}
            <div className={styles.modalHeaderCompact}>
              <div className={styles.modalEmojiBadge}>
                {isMixMode ? "✨" : (category.emoji || "📝")}
              </div>
              <div className={styles.modalHeaderInfo}>
                <h2
                  className={styles.modalTitle}
                  title={isMixMode ? t('quizzes.category.megaMix') : `${category.topic || 'Practice'}: Set ${selectedSet.index}`}
                >
                  {isMixMode 
                    ? t('quizzes.category.megaMix') 
                    : `${category.topic || 'Practice'}: Set ${selectedSet.index}`}
                </h2>
                <div className={styles.modalMetaPills}>
                  <span className={styles.metaChipQuestions}>
                    📝 {tier === 'kids' ? 10 : (selectedSet.questions?.length > 0 ? selectedSet.questions.length : ((selectedSet.end - selectedSet.start) || 20))} {isHindi ? 'प्रश्न' : 'Questions'}
                  </span>
                  <span className={styles.metaChipMode}>
                    {isMixMode ? (isHindi ? 'मिक्स मोड' : 'Mix Rumble') : (isHindi ? 'अभ्यास मोड' : 'Practice Set')}
                  </span>
                </div>
              </div>
            </div>

            {/* Mix Mode Settings */}
            {isMixMode && (
              <div className={styles.mixSettingsContainer}>
                <div className={styles.settingGroup}>
                  <div className={styles.settingLabelRow}>
                    <span className={styles.settingLabelText}>
                      📈 {isHindi ? 'प्रश्नों की संख्या' : 'Question Count'}
                    </span>
                    <span className={styles.sliderBadgeCompact}>
                      ⚡ {numQuestions} {isHindi ? 'प्रश्न' : 'Qs'}
                    </span>
                  </div>
                  <div className={styles.sliderBoxCompact}>
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      step="5" 
                      value={numQuestions} 
                      onChange={(e) => setNumQuestions(parseInt(e.target.value) || 10)} 
                      className={styles.rangeSlider}
                    />
                  </div>
                  <div className={styles.presetChipRow}>
                    {[10, 20, 30, 50].map(n => (
                      <button 
                        key={n} 
                        type="button"
                        className={`${styles.presetChip} ${numQuestions === n ? styles.presetChipActive : ""}`} 
                        onClick={() => setNumQuestions(n)}
                      >
                        ⚡ {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.settingGroup}>
                  <div className={styles.settingLabelRow}>
                    <span className={styles.settingLabelText}>
                      📊 {isHindi ? 'कठिनाई स्तर' : 'Difficulty'}
                    </span>
                  </div>
                  <div className={styles.diffChipRow}>
                    {["ALL", "EASY", "MEDIUM", "HARD"].map(d => (
                      <button 
                        key={d} 
                        type="button"
                        className={`${styles.diffChip} ${difficulty === d ? styles.diffChipActive : ""}`} 
                        onClick={() => setDifficulty(d)}
                      >
                        <span>{d === 'ALL' ? '🌟' : (d === 'EASY' ? '🟢' : (d === 'MEDIUM' ? '🟡' : '🔴'))}</span>
                        <span>{isHindi ? (d === 'ALL' ? 'सभी' : (d === 'EASY' ? 'सरल' : (d === 'MEDIUM' ? 'मध्यम' : 'कठिन'))) : d}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Language Selection */}
            <div className={styles.settingGroup}>
              <div className={styles.settingLabelRow}>
                <span className={styles.settingLabelText}>
                  🌐 {isHindi ? 'भाषा चुनें' : 'Language'}
                </span>
              </div>
              <div className={styles.langGrid}>
                <button 
                  type="button"
                  className={`${styles.langOptionBtn} ${language === "en" ? styles.langOptionActive : ""}`} 
                  onClick={() => setLanguage("en")}
                >
                  <span className={styles.langFlag}>🇬🇧</span>
                  <span className={styles.langName}>English</span>
                </button>
                <button 
                  type="button"
                  className={`${styles.langOptionBtn} ${language === "hi" ? styles.langOptionActive : ""}`} 
                  onClick={() => setLanguage("hi")}
                >
                  <span className={styles.langFlag}>🇮🇳</span>
                  <span className={styles.langName}>हिन्दी</span>
                </button>
              </div>
            </div>

            {/* Pace / Timer Selection (when not Kids tier) */}
            {tier !== "kids" && (
              <div className={styles.settingGroup}>
                <div className={styles.settingLabelRow}>
                  <span className={styles.settingLabelText}>
                    ⏱️ {isHindi ? 'समय सीमा (प्रति प्रश्न)' : 'Pace (Per Question)'}
                  </span>
                </div>
                <div className={styles.timerGridCompact}>
                  {TIMER_OPTIONS.map(o => (
                    <button 
                      key={o.value} 
                      type="button"
                      className={`${styles.timerPillCompact} ${timer === o.value ? styles.timerPillActive : ""}`} 
                      onClick={() => setTimer(o.value)}
                    >
                      <span className={styles.timerIcon}>{o.value === 0 ? '♾️' : '⏳'}</span>
                      <span className={styles.timerText}>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Mode Selection (Quiz / Flashcards / Read) */}
            <div className={styles.settingGroup}>
              <div className={styles.settingLabelRow}>
                <span className={styles.settingLabelText}>
                  🎯 {isHindi ? 'सीखने का तरीका चुनें' : 'Choose Learning Mode'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className={`p-2.5 sm:p-3 rounded-2xl border-2 flex flex-col items-center gap-1 text-center transition-all ${
                    learningMode === "quiz"
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                  onClick={() => setLearningMode("quiz")}
                >
                  <span className="text-xl">🎯</span>
                  <span className="text-xs font-bold">{isHindi ? "क्विज़ मोड" : "Quiz Mode"}</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">4 {isHindi ? "विकल्प" : "Options"}</span>
                </button>

                <button
                  type="button"
                  className={`p-2.5 sm:p-3 rounded-2xl border-2 flex flex-col items-center gap-1 text-center transition-all ${
                    learningMode === "flashcard"
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                  onClick={() => setLearningMode("flashcard")}
                >
                  <span className="text-xl">🗂️</span>
                  <span className="text-xs font-bold">{isHindi ? "फ़्लैशकार्ड्स" : "Flashcards"}</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">{isHindi ? "फ्लिप कार्ड" : "3D Flip"}</span>
                </button>

                <button
                  type="button"
                  className={`p-2.5 sm:p-3 rounded-2xl border-2 flex flex-col items-center gap-1 text-center transition-all ${
                    learningMode === "read"
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                  onClick={() => setLearningMode("read")}
                >
                  <span className="text-xl">📖</span>
                  <span className="text-xs font-bold">{isHindi ? "रीड मोड" : "Read Mode"}</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">{isHindi ? "व्याख्या सहित" : "Study Sheet"}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.modalActionsCompact}>
              <button
                className={styles.btnLaunchCompact}
                onClick={() => handleStart('normal')}
                disabled={!questionsLoaded || isStarting}
                style={isStarting ? { opacity: 0.85, cursor: "wait", pointerEvents: "none" } : {}}
              >
                {isStarting ? (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span className={styles.spinnerInline} />
                    <span>{isHindi ? 'शुरू हो रहा है...' : 'Launching...'}</span>
                  </span>
                ) : (
                  <>🚀 {learningMode === 'flashcard' ? (isHindi ? 'फ़्लैशकार्ड्स शुरू करें' : 'Start Flashcards') : learningMode === 'read' ? (isHindi ? 'रीड मोड खोलें' : 'Open Read Mode') : isMixMode ? (isHindi ? 'चुनौती शुरू करें' : 'Start Challenge') : (selectedSet.progress?.isComplete ? (isHindi ? 'फिर से अभ्यास करें' : 'Practice Again') : (isHindi ? 'अभ्यास शुरू करें' : 'Start Practice'))}</>
                )}
              </button>
              <button className={styles.btnLaterCompact} onClick={closeModal} disabled={isStarting}>
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant Launch Transition Overlay */}
      {isStarting && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff"
          }}
        >
          <div style={{
            width: "56px",
            height: "56px",
            border: "4px solid rgba(99, 102, 241, 0.2)",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: "16px"
          }} />
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 6px" }}>
            {isHindi ? "🚀 अभ्यास सत्र तैयार किया जा रहा है..." : "🚀 Preparing Quiz Engine..."}
          </h3>
          <p style={{ fontSize: "0.88rem", color: "#94a3b8", margin: 0 }}>
            {isHindi ? "बस एक क्षण..." : "Just a moment..."}
          </p>
        </div>
      )}

      {/* Prep Review Modal */}
      {activeModalSet && (
        <div className={styles.overlay} onClick={() => setActiveModalSet(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <button
              className={styles.modalClose}
              onClick={() => setActiveModalSet(null)}
              aria-label="Close"
              title="Close"
              style={{ top: '16px', right: '16px', zIndex: 10 }}
            >
              ✕
            </button>
            <div className={styles.modalHeader} style={{ padding: '24px 24px 0', marginBottom: '16px' }}>
              <span className={styles.modalEmoji}>📝</span>
              <h2 className={styles.modalTitle}>
                {t('quizzes.category.prepReview')} (Set {activeModalSet.index})
              </h2>
            </div>
            
            <div className={styles.accordionList} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px 16px' }}>
              {activeModalSet.questions.map((q, idx) => (
                <div key={q.id || idx} className={styles.accordionItem}>
                  <div className={styles.accordionQ}>
                    <span className={styles.accQNum}>Q{idx + 1}</span>
                    <p className={styles.accQText}>{q.text}</p>
                  </div>
                  <div className={styles.accOptions}>
                    {Array.isArray(q.options) && q.options.map((opt, oIdx) => (
                      <span key={oIdx} className={styles.accOptBadge}>{opt}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.modalActions} style={{ padding: '16px 24px', borderTop: '1px solid var(--card-border)', marginTop: '0', display: 'flex' }}>
               <button 
                 className={styles.playIconButton} 
                 onClick={() => { setActiveModalSet(null); handlePlay(activeModalSet); }}
                 style={{ width: '100%', justifyContent: 'center', height: '56px', fontSize: '1.1rem' }}
               >
                 <span>{t('quizzes.cards.playQuiz')}</span>
                 <span className={styles.playArrow}>&gt;</span>
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky CTA Bar above bottom nav when viewing locked content (Requirement 5) */}
      <StickyPaywallCTA
        hasLockedContent={sets.some((s) => isSetLocked ? isSetLocked(s.index, `${category?.slug || category?.id || params?.slug}-${s.index}`) : false)}
        isPro={isPro}
        onUnlockClick={() => {
          setPaywallItemTitle(category?.topic || "Premium Sets");
          setPaywallModalOpen(true);
        }}
      />

      {/* Unified Paywall Modal (Requirement 4) */}
      <UnifiedPaywallModal
        isOpen={paywallModalOpen}
        onClose={() => setPaywallModalOpen(false)}
        itemTitle={paywallItemTitle}
        itemType="quiz"
      />

      {/* Set Question Preview Modal (Phase D1) */}
      <SetPreviewModal
        isOpen={Boolean(previewSet)}
        onClose={() => setPreviewSet(null)}
        set={previewSet}
        categoryTopic={category?.topic || ""}
        onStartSet={(s) => {
          setPreviewSet(null);
          if (s?.index === "Mix") {
            handlePlayMix();
          } else {
            handlePlay(s);
          }
        }}
      />

      <ResumeBanner />
    </main>
  );

  function closeModal() {
    setSelectedSet(null);
    setTimer(0);
    setIsMixMode(false);
    setIsStarting(false);
  }
}
