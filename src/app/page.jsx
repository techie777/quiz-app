"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { motion } from "framer-motion";
import QuizSidebar from "@/components/QuizSidebar";
import styles from "@/styles/LandingPage.module.css";

// Import safe JSON parsing utility
function safeJsonParse(json, fallback = []) {
  if (!json || typeof json !== 'string') return fallback;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.error("JSON parse error in home page:", error, "on string:", json);
    return fallback;
  }
}

// Function to get relevant image based on quiz topic
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

const DEFAULT_CHIPS = ["Science", "History", "GK", "Quick 5 Min"];
const TRENDING_CHIP = "Trending Quiz";

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

export default function LandingPage() {
  const { quizzes, settings, loaded } = useData();
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [sortBy, setSortBy] = useState("default"); // default, newest, popular, alphabetical
  const [difficultyFilter, setDifficultyFilter] = useState("all"); // all, easy, medium, hard
  const [questionCountFilter, setQuestionCountFilter] = useState("all"); // all, small, medium, large
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [userProgress, setUserProgress] = useState({});
  const [previewCategory, setPreviewCategory] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const isLoading = !loaded;

  // Cleanup effect for any timers or animations
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector(`.${styles.searchContainer}`);
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
          cat.description.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 5) // Limit to 5 suggestions
        .map(cat => ({
          id: cat.id,
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

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(value.trim().length > 0);
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
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [showSuggestions, searchSuggestions, selectedSuggestionIndex]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setSearch(suggestion.topic);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  }, []);

  const handlePreviewClick = useCallback((category) => {
    setPreviewCategory(category);
    setShowPreviewModal(true);
  }, []);

  const closePreviewModal = useCallback(() => {
    setShowPreviewModal(false);
    setPreviewCategory(null);
  }, []);

  const chips = useMemo(() => {
    let list = settings?.homeChips 
      ? safeJsonParse(settings.homeChips, DEFAULT_CHIPS) 
      : DEFAULT_CHIPS;
    
    // Ensure trending chip is first
    if (Array.isArray(list)) {
      const cleaned = list.filter((c) => c && typeof c === 'string' && c.trim().length > 0);
      if (cleaned.length > 0) list = cleaned;
    }

    const withoutTrending = list.filter(
      (c) => c.toLowerCase() !== TRENDING_CHIP.toLowerCase()
    );
    return [TRENDING_CHIP, ...withoutTrending];
  }, [settings?.homeChips]);

  // Memoize the daily category IDs to avoid recalculating on every render
  const dailyCategoryIds = useMemo(() => getDailyCategoryIds(quizzes), [quizzes]);

  // Memoize base filtered categories (without search and filters)
  const baseFilteredCategories = useMemo(() => {
    return quizzes.filter((c) => !c.hidden && !c.parentId && !dailyCategoryIds.has(c.id));
  }, [quizzes, dailyCategoryIds]);

  // Memoize search filtered categories
  const searchFilteredCategories = useMemo(() => {
    if (!search.trim()) return baseFilteredCategories;
    const searchTerm = search.toLowerCase();
    return baseFilteredCategories.filter((c) => 
      c.topic.toLowerCase().includes(searchTerm)
    );
  }, [baseFilteredCategories, search]);

  // Final visible categories with all filters applied
  const visibleCategories = useMemo(() => {
    let filtered = searchFilteredCategories;

    // Apply difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(c => {
        const difficulties = c.questions.map(q => q.difficulty);
        return difficulties.includes(difficultyFilter);
      });
    }

    // Apply question count filter
    if (questionCountFilter !== "all") {
      filtered = filtered.filter(c => {
        const count = c.questions.length;
        switch (questionCountFilter) {
          case "small": return count <= 10;
          case "medium": return count > 10 && count <= 25;
          case "large": return count > 25;
          default: return true;
        }
      });
    }

    // Apply active chips filter
    if (activeFilters.length > 0) {
      filtered = filtered.filter(c => {
        const catChips = Array.isArray(c.chips) ? c.chips.map((x) => String(x).toLowerCase()) : [];
        return activeFilters.every((f) => {
          const key = String(f || "").toLowerCase().trim();
          if (!key) return true;
          if (key === TRENDING_CHIP.toLowerCase() || key === "trending") return !!c.isTrending;
          if (key === "gk") return c.topic.toLowerCase() === "general knowledge";
          if (key.includes("quick")) return c.questions.length <= 20;
          return (
            catChips.includes(key) ||
            c.topic.toLowerCase().includes(key) ||
            (c.description || "").toLowerCase().includes(key)
          );
        });
      });
    }

    // Apply sorting
    if (sortBy !== "default") {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "alphabetical":
            return a.topic.localeCompare(b.topic);
          case "newest":
            return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
          case "popular":
            return (b.questions?.length || 0) - (a.questions?.length || 0);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [searchFilteredCategories, sortBy, difficultyFilter, questionCountFilter, activeFilters]);

  return (
    <main className={styles.page}>
      {/* Hidden SEO Content - Visually Hidden for SEO Only */}
      <div className={styles.seoOnlyContent} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <h1>Test Your Knowledge with Thousands of Free Online Quizzes</h1>
        <p>Challenge yourself with our comprehensive collection of educational quizzes. From science and mathematics to history and current affairs, learn new facts and track your progress with detailed analytics.</p>
        <div>
          <span>{quizzes.filter(q => !q.hidden).length} Quiz Categories</span>
          <span>{quizzes.reduce((total, q) => total + (q.questions?.length || 0), 0)} Questions</span>
          <span>Free To Play</span>
        </div>
        <h2>Why Choose Our Online Quiz Platform?</h2>
        <div>
          <h3>Comprehensive Subject Coverage</h3>
          <p>Explore quizzes across Science, Mathematics, History, Geography, Sports, Entertainment, and more. Each category is carefully curated to provide the best learning experience.</p>
          <h3>Track Your Progress</h3>
          <p>Monitor your performance with detailed analytics, identify areas for improvement, and celebrate your achievements as you master different subjects.</p>
          <h3>Competitive Learning</h3>
          <p>Challenge yourself with timed quizzes, compete for high scores, and join a community of knowledge seekers dedicated to continuous learning.</p>
        </div>
        <h2>Explore Quiz Categories</h2>
        <p>Choose from our wide range of educational quizzes. Each category is designed to test your knowledge and help you learn new concepts.</p>
      </div>

      {/* Original Clean Design */}
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
      </div>

      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>
            {isSearching ? "⏳" : "🔍"}
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={isSearching ? "Searching..." : "Search for any topic..."}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => setShowSuggestions(search.trim().length > 0 && searchSuggestions.length > 0)}
            disabled={isLoading}
            aria-label="Search quiz categories"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            role="combobox"
          />
          {search.trim() && (
            <button
              className={styles.clearButton}
              onClick={() => handleSearchChange("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className={styles.suggestionsDropdown}>
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                className={`${styles.suggestionItem} ${
                  index === selectedSuggestionIndex ? styles.selected : ""
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className={styles.suggestionEmoji}>{suggestion.emoji}</span>
                <div className={styles.suggestionContent}>
                  <span className={styles.suggestionName}>{suggestion.topic}</span>
                  <span className={styles.suggestionDesc}>{suggestion.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.filterChips}>
        {chips.map((filter) => (
          <button 
            key={filter}
            className={`${styles.chip} ${activeFilters.includes(filter) ? styles.activeChip : ''}`}
            onClick={() => handleFilterClick(filter)}
            disabled={isLoading}
          >
            {filter.startsWith("#") ? filter : `#${filter}`}
          </button>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>All Categories</h2>
      {isLoading && <div className={styles.loadingHint}>Loading categories…</div>}
      <motion.div 
        className={styles.grid}
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
        <motion.div
          key="daily-quiz"
          className={styles.cardWrapper}
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          layout
        >
          <Link href="/daily" className={styles.card}>
            <div className={styles.cardImageContainer}>
              <div className={styles.mediaFallback}>
                <span className={styles.mediaEmoji}>📅</span>
              </div>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Daily Quiz</h3>
              <p className={styles.cardDesc}>Quiz of the day + Daily current affairs (past & present).</p>
              <div className={styles.cardFooter}>
                <span className={styles.cardInfo}>Daily</span>
                <span className={styles.cardInfo}>Export PDF</span>
              </div>
              <div className={styles.playButton}>▶ Open</div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          key="current-affairs"
          className={styles.cardWrapper}
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          layout
        >
          <Link href="/current-affairs" className={styles.card}>
            <div className={styles.cardImageContainer}>
              <div className={styles.mediaFallback}>
                <span className={styles.mediaEmoji}>🗞️</span>
              </div>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Current Affairs</h3>
              <p className={styles.cardDesc}>Daily current affairs posts with date & category filters.</p>
              <div className={styles.cardFooter}>
                <span className={styles.cardInfo}>Date-wise</span>
                <span className={styles.cardInfo}>Export PDF</span>
              </div>
              <div className={styles.playButton}>▶ Open</div>
            </div>
          </Link>
        </motion.div>

        {isLoading
          ? Array.from({ length: 9 }).map((_, idx) => (
              <motion.div
                key={`sk-${idx}`}
                className={styles.cardWrapper}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                layout
              >
                <div className={`${styles.card} ${styles.skeletonCard}`}>
                  <div className={styles.cardImageContainer}>
                    <div className={styles.skeletonMedia} />
                  </div>
                  <div className={styles.cardContent}>
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
                      className={styles.card}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      layoutId={cat.id}
                    >
                      <Link 
                      href={`/category/${cat.id}`} 
                      className={styles.cardLink}
                      aria-label={`View ${cat.topic} quiz category with ${cat.questions.length} questions`}
                      onClick={() => {
                        // Store the current page as referrer for quiz exit navigation
                        sessionStorage.setItem('quizReferrer', window.location.pathname);
                      }}
                    >
                        <div className={styles.cardImageContainer}>
                          <div className={styles.mediaFallback}>
                            <span className={styles.mediaEmoji}>{getRelevantImage(cat.topic, cat.emoji)}</span>
                          </div>
                          {cat.image && (
                            <img
                              src={cat.image}
                              alt={cat.topic}
                              className={styles.cardImage}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>
                        <div className={styles.cardContent}>
                          <h3 className={styles.cardTitle}>{cat.topic}</h3>
                          <p className={styles.cardDesc}>{cat.description}</p>
                          <div className={styles.cardFooter}>
                            <span className={styles.cardCount}>
                              {cat.questions.length} questions
                            </span>
                            <span className={styles.cardTime}>
                              {estimateTime(cat.questions.length)}
                            </span>
                          </div>
                          
                          {/* Progress Indicator */}
                          {progress > 0 && (
                            <div className={styles.progressContainer}>
                              <div className={styles.progressBar}>
                                <div 
                                  className={styles.progressFill} 
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <span className={styles.progressText}>{progress}%</span>
                            </div>
                          )}
                          
                          {/* Preview Button */}
                          <button
                            className={styles.previewButton}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePreviewClick(cat);
                            }}
                            aria-label={`Preview ${cat.topic} category details`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
      </motion.div>

      {!isLoading && visibleCategories.length === 0 && (
        <p className={styles.empty}>
          {search || activeFilters.length > 0 ? "No categories match your criteria." : "No categories available."}
        </p>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewCategory && (
        <div className={styles.modalOverlay} onClick={closePreviewModal}>
          <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span className={styles.modalEmoji}>{previewCategory.emoji || '📝'}</span>
                {previewCategory.topic || 'Category Preview'}
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
                <h4 className={styles.modalSectionTitle}>📊 Quick Stats</h4>
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
                <h4 className={styles.modalSectionTitle}>📝 Description</h4>
                <p className={styles.modalDescription}>
                  {previewCategory.description || 'No description available for this category.'}
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
                href={`/category/${previewCategory.id}`}
                className={styles.modalPrimaryButton}
                onClick={closePreviewModal}
              >
                🚀 Start Quiz
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
    </main>
  );
}
