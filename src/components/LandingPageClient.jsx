"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useData } from "@/context/DataContext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Calendar, Clock, BookOpen, User, ArrowRight, Share2, Heart, Filter, SlidersHorizontal, ChevronDown, ChevronUp, Star, LayoutGrid, List, Sparkles, Trophy, Radio } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { debounce } from "lodash";
import { useSession, signIn } from "next-auth/react";
import { useUI } from "@/context/UIContext";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";
import styles from "@/styles/LandingPage.module.css";
import WelcomePromoPopup from "@/components/WelcomePromoPopup";
import LiveStudyButton from "@/components/engine/LiveStudyButton";
import MixPlayCard from "@/components/MixPlayCard";
import MixQuizModal from "@/components/MixQuizModal";

// Import safe JSON parsing utility
function safeJsonParse(json, fallback = []) {
  if (!json) return fallback;
  if (typeof json !== 'string') return json;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.error("JSON parse error in home page:", error, "on string:", json);
    return fallback;
  }
}


function getRelevantImage(topic, emoji) {
  const topicLower = topic.toLowerCase();
  
  // Science related topics
  if (topicLower.includes('science') || topicLower.includes('physics') || topicLower.includes('chemistry') || topicLower.includes('biology') || topicLower.includes('astronomy')) {
    return '🔬';
  }
  
  // History related topics
  if (topicLower.includes('history') || topicLower.includes('ancient') || topicLower.includes('medieval') || topicLower.includes('war') || topicLower.includes('civilization')) {
    return '📚';
  }
  
  // Geography related topics
  if (topicLower.includes('geography') || topicLower.includes('country') || topicLower.includes('capital') || topicLower.includes('world') || topicLower.includes('map')) {
    return '🌍';
  }
  
  // Technology/Computer topics
  if (topicLower.includes('computer') || topicLower.includes('technology') || topicLower.includes('programming') || topicLower.includes('software') || topicLower.includes('internet')) {
    return '💻';
  }
  
  // Mathematics topics
  if (topicLower.includes('math') || topicLower.includes('mathematics') || topicLower.includes('algebra') || topicLower.includes('geometry') || topicLower.includes('calculation')) {
    return '🔢';
  }
  
  // Sports topics
  if (topicLower.includes('sport') || topicLower.includes('football') || topicLower.includes('cricket') || topicLower.includes('basketball') || topicLower.includes('tennis')) {
    return '⚽';
  }
  
  // Entertainment/Movies topics
  if (topicLower.includes('movie') || topicLower.includes('film') || topicLower.includes('cinema') || topicLower.includes('bollywood') || topicLower.includes('hollywood')) {
    return '🎬';
  }
  
  // Music topics
  if (topicLower.includes('music') || topicLower.includes('song') || topicLower.includes('instrument') || topicLower.includes('singer') || topicLower.includes('melody')) {
    return '🎵';
  }
  
  // Literature/Books topics
  if (topicLower.includes('book') || topicLower.includes('literature') || topicLower.includes('novel') || topicLower.includes('author') || topicLower.includes('poem')) {
    return '📖';
  }
  
  // Art topics
  if (topicLower.includes('art') || topicLower.includes('painting') || topicLower.includes('drawing') || topicLower.includes('sculpture') || topicLower.includes('museum')) {
    return '🎨';
  }
  
  // Food/Cooking topics
  if (topicLower.includes('food') || topicLower.includes('cook') || topicLower.includes('recipe') || topicLower.includes('cuisine') || topicLower.includes('dish')) {
    return '🍳';
  }
  
  // Animals/Nature topics
  if (topicLower.includes('animal') || topicLower.includes('wildlife') || topicLower.includes('nature') || topicLower.includes('forest') || topicLower.includes('ocean')) {
    return '🦁';
  }
  
  // Health/Medical topics
  if (topicLower.includes('health') || topicLower.includes('medical') || topicLower.includes('disease') || topicLower.includes('body') || topicLower.includes('medicine')) {
    return '⚕️';
  }
  
  // Business/Economy topics
  if (topicLower.includes('business') || topicLower.includes('economy') || topicLower.includes('finance') || topicLower.includes('money') || topicLower.includes('market')) {
    return '💰';
  }
  
  // Politics/Government topics
  if (topicLower.includes('politics') || topicLower.includes('government') || topicLower.includes('election') || topicLower.includes('democracy') || topicLower.includes('parliament')) {
    return '🏛️';
  }
  
  // Space/Universe topics
  if (topicLower.includes('space') || topicLower.includes('universe') || topicLower.includes('planet') || topicLower.includes('galaxy') || topicLower.includes('astronaut')) {
    return '🚀';
  }
  
  // Religion/Mythology topics
  if (topicLower.includes('religion') || topicLower.includes('mythology') || topicLower.includes('god') || topicLower.includes('temple') || topicLower.includes('church')) {
    return '⛪';
  }
  
  // Language topics
  if (topicLower.includes('language') || topicLower.includes('english') || topicLower.includes('grammar') || topicLower.includes('vocabulary') || topicLower.includes('speaking')) {
    return '💬';
  }
  
  // General Knowledge topics
  if (topicLower.includes('general') || topicLower.includes('gk') || topicLower.includes('knowledge') || topicLower.includes('trivia') || topicLower.includes('facts')) {
    return '🧠';
  }
  
  // Current Affairs topics
  if (topicLower.includes('current') || topicLower.includes('affairs') || topicLower.includes('news') || topicLower.includes('latest') || topicLower.includes('recent')) {
    return '📰';
  }
  
  // Default fallback to provided emoji or a general quiz emoji
  return emoji || '📝';
}

const HOME_CHIPS = ["General Knowledge", "Others"];

// Helper function to identify daily categories dynamically
const getDailyCategoryIds = (quizzes) => {
  const dailyIds = new Set();
  
  quizzes.forEach(category => {
    // Identify Quiz of the Day by topic or specific properties
    if (category.topic.toLowerCase().includes('quiz of the day') || 
        category.topic.toLowerCase().includes('daily quiz') ||
        category.categoryClass?.includes('daily-quiz')) {
      dailyIds.add(category.id);
    }
    
    // Identify Daily Current Affairs by topic or specific properties
    if (category.topic.toLowerCase().includes('current affairs') || 
        category.topic.toLowerCase().includes('daily current') ||
        category.categoryClass?.includes('current-affairs')) {
      dailyIds.add(category.id);
    }
  });
  
  return dailyIds;
};

const estimateTime = (numQuestions) => {
  const seconds = numQuestions * 18; // Avg 18s per question
  const minutes = Math.round(seconds / 60);
  return minutes < 1 ? "< 1 min" : `~${minutes} mins`;
};

// Calculate progress for a category
const calculateProgress = (categoryId, totalQuestions) => {
  // This would normally come from user data/API
  // For demo, we'll use localStorage to simulate progress (client-side only)
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`quiz-progress-${categoryId}`);
      if (saved) {
        const { completed = 0, total = totalQuestions } = JSON.parse(saved);
        return total > 0 ? Math.round((completed / total) * 100) : 0;
      }
    } catch (error) {
      console.error('Error reading localStorage:', error);
    }
  }
  return 0; // Default to 0% progress
};

// Sub-section component for categorized quizzes
const SubSection = React.memo(({ title, quizzes, onViewAll, showMixCard, sectionName, onOpenMixModal }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const { data: session } = useSession();
  const { t, isHindi } = useLanguage();

  const handleShare = useCallback((e, quiz) => {
    e.preventDefault();
    e.stopPropagation();

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/category/${quiz.slug || quiz.id}`;
    const text = `${quiz.topic} - ${quiz.questionCount || 0} questions`;

    async function shareLinkOnly() {
      if (navigator.share) {
        await navigator.share({ title: quiz.topic, text, url });
        return true;
      }
      await navigator.clipboard?.writeText(url);
      toast.success("Link copied");
      return true;
    }

    async function shareImageIfPossible() {
      if (!navigator.canShare) return false;
      // Minimal, reliable fallback: do not attempt image generation without a dedicated renderer
      return false;
    }

    (async () => {
      try {
        const didImage = await shareImageIfPossible();
        if (didImage) return;
        await shareLinkOnly();
      } catch {
        try {
          await shareLinkOnly();
        } catch {}
      }
    })();
  }, []);

  // Load favorites from server (signed-in users) or localStorage (guests)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (session?.user && !session.user.isAdmin) {
          const res = await fetch("/api/category-favourites?ids=1", { cache: "no-store" });
          const data = await res.json().catch(() => ({}));
          const ids = Array.isArray(data?.ids) ? data.ids : [];
          if (!cancelled) setFavorites(new Set(ids));
          return;
        }
      } catch {}

      try {
        const saved = localStorage.getItem("favorite_quizzes");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && !cancelled) setFavorites(new Set(parsed));
        }
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [session]);

  const toggleFavorite = useCallback((e, quizId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user || session.user.isAdmin) {
      setShowSignInModal(true);
      return;
    }

    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(quizId)) next.delete(quizId);
      else next.add(quizId);
      return next;
    });

    fetch("/api/category-favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: quizId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.favourited === "boolean") {
          setFavorites((prev) => {
            const next = new Set(prev);
            if (data.favourited) next.add(quizId);
            else next.delete(quizId);
            return next;
          });
        }
      })
      .catch(() => {});
  }, [session]);

  // Get relevant icon for the sub-section
  const getTranslatedTopic = useCallback((topic, topicHi) => {
    if (isHindi && topicHi) return topicHi;
    if (!isHindi) return topic;
    
    // Fallback dictionary for common topics if topicHi is missing
    const fallbacks = {
      "General Knowledge": "सामान्य ज्ञान",
      "GK": "सामान्य ज्ञान",
      "India": "भारत",
      "World": "विश्व",
      "History": "इतिहास",
      "Sports": "खेल",
      "Computer": "कंप्यूटर",
      "Technology": "तकनीक",
      "Economy": "अर्थव्यवस्था",
      "Polity": "राजव्यवस्था",
      "Chemistry": "रसायन विज्ञान",
      "Physics": "भौतिकी",
      "Biology": "जीव विज्ञान",
      "Bollywood": "बॉलीवुड",
      "Entertainment": "मनोरंजन",
      "Others": "अन्य"
    };
    
    return fallbacks[topic] || topic;
  }, [isHindi]);

  const getSubSectionIcon = useCallback((title) => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('general knowledge') || titleLower.includes('gk')) return '🧠';
    if (titleLower.includes('india')) return '🇮🇳';
    if (titleLower.includes('world')) return '🌍';
    if (titleLower.includes('history')) return '📚';
    if (titleLower.includes('sports')) return '⚽';
    if (titleLower.includes('computer') || titleLower.includes('technology')) return '💻';
    if (titleLower.includes('economy')) return '💰';
    if (titleLower.includes('polity')) return '🏛️';
    if (titleLower.includes('chemistry')) return '⚗️';
    if (titleLower.includes('physics')) return '⚛️';
    if (titleLower.includes('biology')) return '🧬';
    if (titleLower.includes('bollywood') || titleLower.includes('entertainment')) return '🎬';
    if (titleLower.includes('company') || titleLower.includes('ceo')) return '🏢';
    if (titleLower.includes('others')) return '📋';
    
    return '📝'; // Default icon
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const router = useRouter();
  const handleLivePlay = useCallback((e, quizId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    toast.success("Creating live room...");
    router.push(`/live/${sessionId}?is_host=true${quizId ? `&categoryId=${quizId}` : ''}`);
  }, [router]);

  if (!quizzes || quizzes.length === 0) return null;

  return (
    <div className={styles.subSection}>
      <div className={styles.subSectionHeader}>
        <div className={styles.subSectionTitleContainer}>
          <span className={styles.subSectionIcon}>{getSubSectionIcon(title)}</span>
          <h3 className={styles.subSectionTitle}>
            {getTranslatedTopic(title, null)}
            <span className={styles.subSectionCount}>({quizzes.length} {t('quizzes.cards.quizzes') || 'quizzes'})</span>
          </h3>
        </div>
        <button className={styles.viewAllButton} onClick={toggleExpand}>
          {isExpanded ? (
            <>
              {t('common.collapse') || 'Collapse'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '6px'}}>
                <path d="M5 15l7-7 7 7"/>
              </svg>
            </>
          ) : (
            <>
              {t('common.expand') || 'Expand'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '6px'}}>
                <path d="M19 9l-7 7-7-7"/>
              </svg>
            </>
          )}
        </button>
      </div>
      <div className={`${styles.subSectionGrid} ${!isExpanded ? styles.collapsed : ''}`}>
        {showMixCard && <MixPlayCard sectionName={sectionName} onOpenModal={onOpenMixModal} />}
        {(quizzes || []).map((quiz) => (
          <motion.div
            key={quiz.id}
            className={styles.subSectionCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href={`/category/${quiz.slug || quiz.id}`} className={styles.subSectionCardLink}>
              <div className={styles.subSectionCardImage}>
                {quiz.image ? (
                  <img 
                    src={quiz.image} 
                    alt={quiz.topic} 
                    className={styles.subSectionCardImg}
                    loading="lazy"
                  />
                ) : (
                  <span className={styles.subSectionCardEmoji}>
                    {getRelevantImage(quiz.topic, quiz.emoji)}
                  </span>
                )}
                <div className={styles.cardActions}>
                  <button 
                    className={`${styles.favoriteBtn} ${favorites.has(quiz.id) ? styles.isFavorite : ''}`}
                    onClick={(e) => toggleFavorite(e, quiz.id)}
                    title={favorites.has(quiz.id) ? (t('common.removeFav') || "Remove from favorites") : (t('common.addFav') || "Add to favorites")}
                  >
                    <Heart size={16} fill={favorites.has(quiz.id) ? "currentColor" : "none"} />
                  </button>
                  <button
                    className={styles.shareBtn}
                    onClick={(e) => handleShare(e, quiz)}
                    title={t('common.share') || "Share"}
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
              <div className={styles.subSectionCardContent}>
                <h4 className={styles.subSectionCardTitle}>{getTranslatedTopic(quiz.topic, quiz.topicHi)}</h4>
                
                {/* Play Quiz Button */}
                <div className={styles.setCardActions}>
                  <button
                    className={styles.playQuizButton}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `/category/${quiz.slug || quiz.id}`;
                    }}
                    aria-label={`${t('quizzes.cards.playQuiz')} ${quiz.topic}`}
                  >
                    {t('quizzes.cards.playQuiz')}
                  </button>
                  <button
                    className={styles.liveButtonStyle}
                    onClick={(e) => handleLivePlay(e, quiz.id)}
                  >
                    <span className={styles.liveDot}></span>
                    {t('quizzes.cards.playLive')}
                  </button>
                </div>

                <div className={styles.subSectionCardFooter}>
                  <span className={styles.subSectionCardCount}>
                    {quiz.questionCount || 0} {t('quizzes.cards.questions')}
                  </span>
                  <span className={styles.subSectionCardTime}>
                    {Math.max(1, Math.round((quiz.questionCount || 0) / 10))} {t('quizzes.cards.minPerSet')}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
});
SubSection.displayName = "SubSection";

// Function to categorize quizzes based on sections
function categorizeQuizzes(quizzes, sections) {
  const categorized = [];
  const matchedQuizIds = new Set();
  
  sections.forEach(section => {
    const sectionData = {
      id: section.id,
      name: section.name,
      nameHi: section.nameHi,
      subSections: []
    };
    
    section.subSections.forEach(subSection => {
      const quizIds = subSection.quizIds || [];
      const subSectionQuizzes = quizzes.filter(quiz => quizIds.includes(quiz.id));
      
      if (subSectionQuizzes.length > 0) {
        subSectionQuizzes.forEach(q => matchedQuizIds.add(q.id));
        sectionData.subSections.push({
          title: subSection.name,
          titleHi: subSection.nameHi,
          quizzes: subSectionQuizzes,
          order: subSection.order
        });
      }
    });
    
    if (sectionData.subSections.length > 0) {
      // Sort subsections by order
      sectionData.subSections.sort((a, b) => a.order - b.order);
      categorized.push(sectionData);
    }
  });

  // Collect quizzes that are not in any section
  const uncategorized = quizzes.filter(quiz => !matchedQuizIds.has(quiz.id));
  if (uncategorized.length > 0) {
    categorized.push({
      id: "uncategorized",
      name: "Other Quizzes",
      nameHi: "अन्य क्विज़",
      subSections: [{
        title: "General",
        titleHi: "सामान्य",
        quizzes: uncategorized,
        order: 999
      }]
    });
  }
  
  return categorized;
}

// Main Category Section component
const MainCategorySection = React.memo(({ section, sectionIds, onOpenMixModal, isFirstSection }) => {
  const { isHindi } = useLanguage();
  const subSections = section.subSections || [];
  
  if (subSections.length === 0) return null;
  
  return (
    <div className={styles.mainCategorySection} id={sectionIds?.[section.name] || undefined}>
      <h2 className={styles.sectionTitle}>
        {isHindi && section.nameHi ? section.nameHi : section.name}
      </h2>
      
      {subSections.map((subSection, index) => (
        <SubSection
          key={subSection.title}
          title={isHindi && subSection.titleHi ? subSection.titleHi : subSection.title}
          quizzes={subSection.quizzes}
          showMixCard={isFirstSection && index === 0}
          sectionName={section.name}
          onOpenMixModal={onOpenMixModal}
        />
      ))}
    </div>
  );
});
MainCategorySection.displayName = "MainCategorySection";

export default function LandingPage({ initialCategories = [] }) {
  const { data: session } = useSession();
  const { settings, loaded, quizzes } = useData();
  const { openOnboarding } = useUI();
  const { t } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sections, setSections] = useState([]);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const quizSectionRef = useRef(null);

  const scrollToQuizzes = () => {
    quizSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // New state for paginated data
  const [visibleCategories, setVisibleCategories] = useState(initialCategories);
  const [totalCategories, setTotalCategories] = useState(initialCategories.length || 0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const itemsPerPage = 12;

  // Debounced search logic
  const debouncedSearchHandler = useCallback(
    debounce((value) => {
      setDebouncedSearch(value);
      setPage(1); // Reset to first page on search
    }, 500),
    []
  );

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    debouncedSearchHandler(value);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(value.trim().length > 0);
  }, [debouncedSearchHandler]);

  // Fetch sections from DB
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections', { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSections(data);
        }
      } catch (error) {
        console.error("Failed to fetch sections:", error);
      } finally {
        setSectionsLoaded(true);
      }
    };
    fetchSections();
  }, []);

  const [activeFilters, setActiveFilters] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [sortBy, setSortBy] = useState("default"); // default, newest, popular, alphabetical
  const [difficultyFilter, setDifficultyFilter] = useState("all"); // all, easy, medium, hard
  const [questionCountFilter, setQuestionCountFilter] = useState("all"); // all, small, medium, large
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [userInterestsCount, setUserInterestsCount] = useState(0);
  const [userInterests, setUserInterests] = useState([]);

  // Check for interests on load
  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/user/interests")
        .then(r => r.json())
        .then(data => {
          const interests = data.interestedCategories || [];
          setUserInterests(interests);
          setUserInterestsCount(interests.length);
          if (interests.length > 0) {
            setIsPersonalized(true); // Default to personalized if they have interests
          }
        })
        .catch(() => {});
    }
  }, [session?.user?.id]);

  const [userProgress, setUserProgress] = useState({});
  const [previewCategory, setPreviewCategory] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Mixed Mode State
  const [showMixModal, setShowMixModal] = useState(false);
  const [activeMixSection, setActiveMixSection] = useState(null);

  const handleOpenMixModal = useCallback((sectionName) => {
    setActiveMixSection(sectionName);
    setShowMixModal(true);
  }, []);

  // Fetch paginated categories
  const fetchCategories = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setVisibleCategories([]); // Clear immediately for visual feedback
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = reset ? 1 : page;
      const skip = (currentPage - 1) * itemsPerPage;
      
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        skip: skip.toString(),
        search: debouncedSearch,
        sortBy: sortBy,
        difficulty: difficultyFilter,
        questionCount: questionCountFilter,
        chips: activeFilters.join(","),
        personalized: isPersonalized.toString()
      });

      const res = await fetch(`/api/categories?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setVisibleCategories(data.categories || []);
        } else {
          setVisibleCategories(prev => [...prev, ...(data.categories || [])]);
        }
        setTotalCategories(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, debouncedSearch, sortBy, difficultyFilter, questionCountFilter, activeFilters, isPersonalized]);

  useEffect(() => {
    fetchCategories(true);
  }, [debouncedSearch, sortBy, difficultyFilter, questionCountFilter, activeFilters, isPersonalized]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 1) {
      fetchCategories(false);
    }
  }, [page]);

  // Cleanup effect for any timers or animations
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector(`.${styles.heroSearchWrapper}`);
      if (searchContainer && !searchContainer.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
      
      const advancedFiltersPanel = document.querySelector(`.${styles.advancedFiltersPanel}`);
      if (advancedFiltersPanel && showAdvancedFilters && !advancedFiltersPanel.contains(event.target)) {
        const advancedFiltersToggle = document.querySelector(`.${styles.advancedFiltersToggle}`);
        if (advancedFiltersToggle && !advancedFiltersToggle.contains(event.target)) {
          setShowAdvancedFilters(false);
        }
      }
    };

    // Keyboard navigation handler
    const handleKeyDown = (event) => {
      // Escape key closes dropdowns and filters
      if (event.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        if (showAdvancedFilters) {
          setShowAdvancedFilters(false);
        }
      }
      
      // Tab navigation for cards
      if (event.key === 'Tab' && !event.shiftKey) {
        const focusableElements = document.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])');
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
        const nextIndex = (currentIndex + 1) % focusableElements.length;
        focusableElements[nextIndex]?.focus();
        event.preventDefault();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAdvancedFilters]);

  // Debounced search effect
  useEffect(() => {
    if (!search.trim()) {
      setIsSearching(false);
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      return;
    }
    
    setIsSearching(true);
    const timer = setTimeout(() => {
      // Generate search suggestions from available categories
      const suggestions = quizzes
        .filter(cat => 
          cat.topic.toLowerCase().includes(search.toLowerCase()) ||
          cat.description.toLowerCase().includes(search.toLowerCase()) ||
          (Array.isArray(cat.chips) && cat.chips.some((chip) => String(chip || "").toLowerCase().includes(search.toLowerCase())))
        )
        .slice(0, 12) // Limit to 12 suggestions
        .map(cat => ({
          id: cat.id,
          slug: cat.slug,
          topic: cat.topic,
          description: cat.description,
          emoji: cat.emoji
        }));
      
      setSearchSuggestions(suggestions);
      setIsSearching(false);
    }, 300); // Debounce search for 300ms

    return () => clearTimeout(timer);
  }, [search, quizzes]);

  const handleFilterClick = useCallback((filter) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  }, []);

  const handleSearchKeyDown = useCallback((e) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedSuggestion = searchSuggestions[selectedSuggestionIndex];
          setSearch(selectedSuggestion.topic);
          setDebouncedSearch(selectedSuggestion.topic);
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          router.push(`/category/${selectedSuggestion.slug || selectedSuggestion.id}`);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [showSuggestions, searchSuggestions, selectedSuggestionIndex, router]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setSearch(suggestion.topic);
    setDebouncedSearch(suggestion.topic);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    router.push(`/category/${suggestion.slug || suggestion.id}`);
  }, [router]);

  const handlePreviewClick = useCallback((category) => {
    setPreviewCategory(category);
    setShowPreviewModal(true);
  }, []);

  const closePreviewModal = useCallback(() => {
    setShowPreviewModal(false);
    setPreviewCategory(null);
  }, []);

  const chips = useMemo(() => HOME_CHIPS, []);

  const sectionIds = useMemo(() => {
    const ids = {};
    (sections || []).forEach((s) => {
      const key = String(s?.name || "").trim();
      if (!key) return;
      ids[key] = `section-${key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
    });
    return ids;
  }, [sections]);

  const scrollToSection = useCallback((sectionName) => {
    const id = sectionIds[sectionName];
    if (!id) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }, [sectionIds]);

  const handleHomeChipClick = useCallback((chip) => {
    const list = (sections || []).map((s) => String(s?.name || "")).filter(Boolean);
    if (list.length === 0) return;

    const isGk = (name) => {
      const n = String(name || "").toLowerCase();
      return n.includes("general knowledge") || n === "gk" || n.includes(" gk") || n.includes("gk ");
    };

    let target = null;
    if (chip === "General Knowledge") {
      target = list.find(isGk) || null;
    } else {
      target = list.find((n) => !isGk(n)) || null;
    }

    if (target) {
      const ok = scrollToSection(target);
      if (!ok) {
        // fallback: jump near main list
        document.querySelector(`.${styles.allSubSections}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [sections, scrollToSection]);

  // For sections, we still use the full list for now as they are specialized
  // but we should eventually optimize /api/sections to return only what's needed.
  const dailyCategoryIds = useMemo(() => getDailyCategoryIds(quizzes), [quizzes]);
  const baseFilteredCategories = useMemo(() => {
    let list = quizzes.filter((c) => !c.hidden && !dailyCategoryIds.has(c.id));
    
    // Apply Personalization to the base list if active
    if (isPersonalized && userInterests.length > 0) {
      list = list.filter(c => userInterests.includes(c.id));
    } else {
      // If not personalized, only show top-level categories or those marked for home
      list = list.filter(c => !c.parentId || c.showSubCategoriesOnHome);
    }

    // Apply Advanced Filters to the main view as well
    if (difficultyFilter !== "all") {
      list = list.filter(c => c.questions?.some(q => q.difficulty === difficultyFilter));
    }
    
    if (questionCountFilter !== "all") {
      list = list.filter(c => {
        const count = c.questions?.length || 0;
        if (questionCountFilter === "small") return count >= 1 && count <= 10;
        if (questionCountFilter === "medium") return count >= 11 && count <= 25;
        if (questionCountFilter === "large") return count >= 26;
        return true;
      });
    }

    if (sortBy === "alphabetical") {
      list = [...list].sort((a, b) => a.topic.localeCompare(b.topic));
    } else if (sortBy === "newest") {
      list = [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (sortBy === "popular") {
      list = [...list].sort((a, b) => (b.questions?.length || 0) - (a.questions?.length || 0));
    }

    return list;
  }, [quizzes, dailyCategoryIds, difficultyFilter, questionCountFilter, sortBy, isPersonalized, userInterests]);

  const categorizedQuizzes = useMemo(() => {
    return categorizeQuizzes(baseFilteredCategories, sections);
  }, [baseFilteredCategories, sections]);

  return (
    <main className={styles.page}>
      {/* Search Orbs & Hero Section - Removed for cleaner look */}


      <motion.section 
        className={styles.hero}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.heroContent}>
          <div className="mb-6">
            <div className={styles.feedTabs}>
              <button 
                className={`${styles.feedTab} ${!isPersonalized ? styles.active : ''}`}
                onClick={() => {
                  setIsPersonalized(false);
                  scrollToQuizzes();
                }}
              >
                <span className={styles.tabIcon}><LayoutGrid size={18} /></span>
                {t('quizzes.tabs.all')}
              </button>
              <button 
                className={`${styles.feedTab} ${isPersonalized ? styles.active : ''}`}
                onClick={() => {
                  if (userInterestsCount === 0) {
                    openOnboarding();
                  } else {
                    setIsPersonalized(true);
                    scrollToQuizzes();
                  }
                }}
              >
                <span className={styles.tabIcon}><Star size={18} /></span>
                {t('quizzes.tabs.forYou')} {mounted && userInterestsCount > 0 && <span className={styles.sparkle}>👤</span>}
              </button>
              <button 
                className={styles.feedTab}
                onClick={() => {
                  const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
                  toast.success(t('common.creatingRoom') || "Creating live room...");
                  router.push(`/live/${sessionId}?is_host=true`);
                }}
              >
                <span className={styles.tabIcon}><Radio size={18} /></span>
                {t('quizzes.tabs.playLive')} <span className={`${styles.liveDot} animate-pulse`} />
              </button>
            </div>
          </div>

          {/* Integrated Search Command Center */}
          <div className={styles.heroSearchWrapper}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>
                {mounted ? (loading ? "⏳" : <Search size={20} />) : null}
              </span>
              <input
                id="search-box"
                type="text"
                className={styles.searchInput}
                placeholder={loading ? (t('common.searching') || "Searching...") : (t('quizzes.search.placeholder') || 'Search for quizzes...')}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setShowSuggestions(search.trim().length > 0 && searchSuggestions.length > 0)}
                disabled={loading}
              />
              {search.trim() && (
                <button
                  className={styles.clearButton}
                  onClick={() => handleSearchChange("")}
                >✕</button>
              )}
            </div>
            
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className={styles.suggestionsDropdown}>
                <div className={styles.suggestionsHeader}>
                  <span>{t('quizzes.search.results')}</span>
                  <span className={styles.suggestionCount}>{searchSuggestions.length} {t('quizzes.search.found')}</span>
                </div>
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    className={`${styles.suggestionItem} ${
                      index === selectedSuggestionIndex ? styles.selected : ""
                    }`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <span className={styles.suggestionEmoji}>{suggestion.emoji || "📝"}</span>
                    <div className={styles.suggestionContent}>
                      <strong className={styles.suggestionName}>
                        {isHindi && suggestion.topicHi ? suggestion.topicHi : suggestion.topic}
                      </strong>
                      <p className={styles.suggestionDescription}>
                        {(() => {
                          const desc = (isHindi && suggestion.descriptionHi) ? suggestion.descriptionHi : suggestion.description;
                          if (!desc) return t('quizzes.search.defaultDesc');
                          return desc.length > 70 ? desc.substring(0, 70) + "..." : desc;
                        })()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>







        </div>
      </motion.section>

      {/* Main Category Sections */}
      {!search && !activeFilters.length && (
        <div className={styles.allSubSections}>
          {/* Daily Spotlight Section */}
          <div className={styles.mainCategorySection}>
            <h2 className={styles.sectionTitle}>{t('quizzes.spotlight.title')}</h2>
            <div className={styles.spotlightGrid}>
              {/* Quiz of the Day Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Link href="/category/quiz-of-the-day" className={styles.spotlightCard}>
                  <div className={styles.spotlightIcon}>🌟</div>
                  <div className={styles.spotlightInfo}>
                    <h4 className={styles.spotlightTitle}>{t('quizzes.spotlight.qotd')}</h4>
                    <div className={styles.spotlightMeta}>
                      <span>{t('quizzes.spotlight.curated')}</span>
                      <span>•</span>
                      <span>5 {t('common.mins') || 'mins'}</span>
                    </div>
                  </div>
                  <div className={styles.spotlightPlay}>
                    <ArrowRight size={18} />
                  </div>
                </Link>
              </motion.div>

              {/* Daily Current Affairs Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Link href="/current-affairs" className={styles.spotlightCard}>
                  <div className={styles.spotlightIcon}>🗞️</div>
                  <div className={styles.spotlightInfo}>
                    <h4 className={styles.spotlightTitle}>{t('quizzes.spotlight.dailyCa')}</h4>
                    <div className={styles.spotlightMeta}>
                      <span>{t('quizzes.spotlight.latest')}</span>
                      <span>•</span>
                      <span>{t('quizzes.spotlight.newToday')}</span>
                    </div>
                  </div>
                  <div className={styles.spotlightPlay}>
                    <ArrowRight size={18} />
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Scroll Anchor for Main Quizzes (e.g., General Knowledge) */}
          <div ref={quizSectionRef} className="h-0 w-0 pointer-events-none -mt-8" />

          {categorizedQuizzes.map((section) => (
            <MainCategorySection 
              key={section.id}
              section={section} 
              sectionIds={sectionIds}
              onOpenMixModal={handleOpenMixModal}
              isFirstSection={true}
            />
          ))}
        </div>
      )}

      <MixQuizModal 
        isOpen={showMixModal} 
        onClose={() => setShowMixModal(false)} 
        sectionName={activeMixSection} 
      />

      {/* All Categories Section (shown when searching or filtering) */}
      {(search || activeFilters.length > 0) && (
        <>
          <h2 className={styles.sectionTitle}>{t('quizzes.sections.all')}</h2>
            {loading && visibleCategories.length === 0 && <div className={styles.loadingHint}>{t('quizzes.sections.loading')}</div>}
          <motion.div 
            className={styles.subSectionGrid}
            variants={{ 
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.05 }
              }
            }}
            initial="hidden"
            animate="show"
          >
            {/* For You Welcome Banner */}
      {isPersonalized && userInterestsCount > 0 && (
        <div className="max-w-6xl mx-auto mb-10 p-6 rounded-3xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/20">👤</div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">{t('banners.personalized.title')}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t('banners.personalized.subtitle').replace('{count}', userInterestsCount)}</p>
            </div>
          </div>
          <button 
            onClick={openOnboarding}
            className="px-6 py-2 bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform"
          >
            {t('banners.personalized.btn')}
          </button>
        </div>
      )}
            {/* Regular Quiz Cards */}
            {loading && visibleCategories.length === 0
              ? Array.from({ length: 9 }).map((_, idx) => (
                  <motion.div
                    key={`sk-${idx}`}
                    className={styles.subSectionCard}
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    layout
                  >
                    <div className={`${styles.subSectionCard} ${styles.skeletonCard}`}>
                      <div className={styles.subSectionCardImage}>
                        <div className={styles.skeletonMedia} />
                      </div>
                      <div className={styles.subSectionCardContent}>
                        <div className={styles.skeletonTitle} />
                        <div className={styles.skeletonLine} />
                        <div className={styles.skeletonLineShort} />
                        <div className={styles.skeletonFooter} />
                        <div className={styles.skeletonButton} />
                      </div>
                    </div>
                  </motion.div>
                ))
              : visibleCategories.map((cat, index) => {
                  const progress = calculateProgress(cat.id, cat.questions.length);
                  return (
                    <motion.div
                      key={cat.id}
                      className={styles.subSectionCard}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      layoutId={cat.id}
                    >
                      <Link
                        href={`/category/${cat.slug || cat.id}`}
                        className={styles.subSectionCardLink}
                        aria-label={`View ${cat.topic} quiz category with ${cat.questions.length} questions`}
                        onClick={() => {
                          sessionStorage.setItem("quizReferrer", window.location.pathname);
                        }}
                      >
                        <div className={styles.subSectionCardImage}>
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.topic}
                              className={styles.subSectionCardImg}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className={styles.subSectionCardEmoji}>
                              {getRelevantImage(cat.topic, cat.emoji)}
                            </span>
                          )}
                        </div>
                        <div className={styles.subSectionCardContent}>
                          <h4 className={styles.subSectionCardTitle}>
                            {isHindi && cat.topicHi ? cat.topicHi : cat.topic}
                          </h4>
                          <button
                            className={styles.playQuizButton}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `/category/${cat.slug || cat.id}`;
                            }}
                            aria-label={`${t('quizzes.cards.playQuiz')} ${cat.topic}`}
                          >
                            {t('quizzes.cards.playQuiz')}
                          </button>
                          <div className={styles.subSectionCardFooter}>
                            <span className={styles.subSectionCardCount}>
                              {cat.questions.length} {t('quizzes.cards.questions')}
                            </span>
                            <span className={styles.subSectionCardTime}>
                              {estimateTime(cat.questions.length)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
          </motion.div>

          {/* Load More Button */}
          {visibleCategories.length < totalCategories && (
            <div className={styles.loadMoreContainer}>
              <button 
                className={styles.loadMoreButton} 
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <span className={styles.loader}></span>
                    {t('common.loading') || 'Loading...'}
                  </>
                ) : (
                  t('quizzes.sections.loadMore')
                )}
              </button>
            </div>
          )}
        </>
      )}

      {!loading && visibleCategories.length === 0 && (search || activeFilters.length > 0) && (
        <p className={styles.empty}>
          {t('quizzes.sections.noMatch')}
        </p>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewCategory && (
        <div className={styles.modalOverlay} onClick={closePreviewModal}>
          <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span className={styles.modalEmoji}>{previewCategory.emoji || '📝'}</span>
                {isHindi && previewCategory.topicHi ? previewCategory.topicHi : previewCategory.topic}
              </h3>
              <button 
                className={styles.modalClose}
                onClick={closePreviewModal}
                aria-label="Close preview modal"
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.modalSection}>
                <h4 className={styles.modalSectionTitle}>📊 {t('modals.preview.stats')}</h4>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Questions</span>
                    <span className={styles.statValue}>{previewCategory.questions?.length || 0}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Est. Time</span>
                    <span className={styles.statValue}>{estimateTime(previewCategory.questions?.length || 0)}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Progress</span>
                    <span className={styles.statValue}>
                      {calculateProgress(previewCategory.id, previewCategory.questions?.length || 0)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.modalSection}>
                <h4 className={styles.modalSectionTitle}>📝 {t('modals.preview.description') || 'Description'}</h4>
                <p className={styles.modalDescription}>
                  {(isHindi && previewCategory.descriptionHi) ? previewCategory.descriptionHi : (previewCategory.description || t('modals.preview.noDesc') || 'No description available for this category.')}
                </p>
              </div>
              
              <div className={styles.modalSection}>
                <h4 className={styles.modalSectionTitle}>🎯 Difficulty</h4>
                <div className={styles.difficultyBadges}>
                  {['easy', 'medium', 'hard'].map(difficulty => {
                    const hasDifficulty = previewCategory.difficulty?.toLowerCase() === difficulty;
                    return (
                      <span
                        key={difficulty}
                        className={`${styles.difficultyBadge} ${hasDifficulty ? styles.difficultyBadgeActive : ''}`}
                      >
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <Link 
                href={`/category/${previewCategory.slug || previewCategory.id}`}
                className={styles.modalPrimaryButton}
                onClick={closePreviewModal}
              >
                Start Quiz
              </Link>
              <button 
                className={styles.modalSecondaryButton}
                onClick={closePreviewModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sign In Modal */}
      {showSignInModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSignInModal(false)}>
          <div className={styles.signInModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{t('modals.signin.title')}</h3>
              <button className={styles.modalClose} onClick={() => setShowSignInModal(false)}>✕</button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalDescription}>
                {t('modals.signin.desc')}
              </p>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl mb-6 text-sm text-indigo-700 dark:text-indigo-300">
                <strong>{t('modals.signin.why')}</strong>
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  {(t('modals.signin.benefits') || []).map((benefit, bIdx) => (
                    <li key={bIdx}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalPrimaryButton}
                onClick={() => signIn(undefined, { callbackUrl: window.location.pathname })}
              >
                {t('modals.signin.btn')}
              </button>
              <button 
                className={styles.modalSecondaryButton}
                onClick={() => setShowSignInModal(false)}
              >
                {t('modals.signin.later')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
