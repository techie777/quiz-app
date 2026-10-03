"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
import styles from "@/styles/Flashcards.module.css";
import FlashcardHeader from "@/components/flashcards/FlashcardHeader";
import CategorySheet from "@/components/flashcards/CategorySheet";
import FlashDeck from "@/components/flashcards/FlashDeck";
import { CategoryIllustration } from "@/components/flashcards/CategorySVGs";
import { getCategoryBadgeIcon } from "@/components/flashcards/CategoryIcons";

const SESSION_LIMIT = 20;

export default function FunFactsPage() {
  // Global & Persisted Preferences
  const [language, setLanguage] = useState("EN"); // "EN" or "HI"
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [mode, setMode] = useState("all"); // "all", "random", "daily"
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isFavoritesOnly, setIsFavoritesOnly] = useState(false);

  // Deck & State
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Categories list
  const [categories, setCategories] = useState([]);

  // Favourites stored in localStorage (set of fact IDs)
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // Prefetch tracking
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);

  // Long-press timer ref for Favourite button
  const longPressTimerRef = useRef(null);

  // 1. Initial Load of Persisted Preferences & Categories
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("quizweb_flashcard_lang") || "EN";
      setLanguage(savedLang);

      try {
        const savedCatIds = JSON.parse(localStorage.getItem("quizweb_fact_catIds") || "[]");
        if (Array.isArray(savedCatIds)) {
          setSelectedCategoryIds(savedCatIds);
        }
      } catch (e) {
        const singleCat = localStorage.getItem("quizweb_fact_catId");
        if (singleCat && singleCat !== "null") {
          setSelectedCategoryIds([singleCat]);
        }
      }

      const savedMode = localStorage.getItem("quizweb_fact_mode") || "all";
      setMode(savedMode);

      try {
        const savedFavs = JSON.parse(localStorage.getItem("quizweb_fact_favs") || "[]");
        setFavoriteIds(new Set(savedFavs));
      } catch (e) {}
    }

    // Fetch categories
    fetch("/api/fun-facts/categories")
      .then((res) => res.json())
      .then((data) => {
        const cats = data.categories || [];
        setCategories(cats);
      })
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  // Save language changes
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("quizweb_flashcard_lang", newLang);
    }
  };

  // 2. Fetch Facts in Batches of 20 with Multi-Category Support
  const fetchFactsBatch = useCallback(
    async (pageNum, replace = false) => {
      if (!replace && (isFetchingBatch || !hasMore)) return;
      setIsFetchingBatch(true);
      if (replace) setIsLoading(true);

      try {
        let url = `/api/fun-facts/list?page=${pageNum}&limit=20&tab=${isFavoritesOnly ? "favorites" : mode}`;
        if (selectedCategoryIds.length > 0) {
          url += `&categories=${selectedCategoryIds.join(",")}`;
        }
        if (mode === "random") {
          url += `&seed=${Date.now()}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.facts) {
          let incoming = data.facts.map((f) => ({
            id: f.id,
            categoryId: f.categoryId,
            categoryName: f.categoryName || f.category?.name || "General",
            categoryNameHi: f.categoryNameHi || f.category?.nameHi || "सामान्य",
            textEn: f.textEn || f.description || "",
            textHi: f.textHi || f.descriptionHi || f.textEn || f.description || "",
            explanationEn: f.explanationEn || f.explanation || "",
            explanationHi: f.explanationHi || "",
            source: f.source || "",
            illustrationKey: f.illustrationKey || f.category?.slug || f.category?.name?.toLowerCase() || "",
            hasFavorited: f.hasFavorited || false,
          }));

          if (isFavoritesOnly) {
            incoming = incoming.filter((f) => favoriteIds.has(f.id));
          }

          setDeck((prev) => (replace ? incoming : [...prev, ...incoming]));
          setHasMore(data.pagination.page < data.pagination.totalPages);
          setPage(pageNum);

          if (replace) {
            setCurrentIndex(0);
            setIsFlipped(false);
            setReviewedCount(0);
            setIsSessionComplete(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch facts batch:", err);
      } finally {
        setIsFetchingBatch(false);
        setIsLoading(false);
      }
    },
    [isFetchingBatch, hasMore, mode, selectedCategoryIds, isFavoritesOnly, favoriteIds]
  );

  // Reload deck on category, mode, or favorites-only change
  useEffect(() => {
    fetchFactsBatch(1, true);
  }, [selectedCategoryIds, mode, isFavoritesOnly]);

  // Prefetch next batch when 5 cards remain
  useEffect(() => {
    if (deck.length > 0 && deck.length - currentIndex <= 5 && hasMore && !isFetchingBatch) {
      fetchFactsBatch(page + 1, false);
    }
  }, [currentIndex, deck.length, hasMore, isFetchingBatch, page, fetchFactsBatch]);

  // Current Card
  const currentCard = useMemo(() => {
    if (deck.length === 0 || currentIndex >= deck.length) return null;
    return deck[currentIndex];
  }, [deck, currentIndex]);

  // Check if current card is favorited
  const isCurrentCardFavorited = useMemo(() => {
    if (!currentCard) return false;
    return favoriteIds.has(currentCard.id) || currentCard.hasFavorited;
  }, [currentCard, favoriteIds]);

  // Toggle Favourite
  const toggleFavorite = () => {
    if (!currentCard) return;
    const cardId = currentCard.id;
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("quizweb_fact_favs", JSON.stringify(Array.from(next)));
      }
      return next;
    });

    fetch("/api/fun-facts/interaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factId: cardId, action: "favorite" }),
    }).catch(() => {});
  };

  // Spaced Repetition Buttons: Again, Good, Easy (calls next() to fly away)
  const handleSpacedRepetition = (rating, nextFn) => {
    if (!currentCard) return;
    const cardToReinsert = { ...currentCard };

    setDeck((prevDeck) => {
      const newDeck = [...prevDeck];
      if (rating === "again") {
        const targetIdx = Math.min(currentIndex + 4, newDeck.length);
        newDeck.splice(targetIdx, 0, cardToReinsert);
      } else if (rating === "good") {
        const targetIdx = Math.min(currentIndex + 11, newDeck.length);
        newDeck.splice(targetIdx, 0, cardToReinsert);
      }
      return newDeck;
    });

    // Anki note: call next() so the card flies away after answer
    if (nextFn) {
      nextFn("right");
    }
  };

  // Multi-Category selection handler
  const handleSelectCategories = (catIds) => {
    setSelectedCategoryIds(catIds);
    if (typeof window !== "undefined") {
      localStorage.setItem("quizweb_fact_catIds", JSON.stringify(catIds));
    }
  };

  // Mode selection handler
  const handleSelectMode = (newMode) => {
    setMode(newMode);
    setIsFavoritesOnly(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("quizweb_fact_mode", newMode);
    }
  };

  // Restart / Reset Session
  const restartSession = () => {
    fetchFactsBatch(1, true);
  };

  // Category title display in header
  const categoryTitle = useMemo(() => {
    if (isFavoritesOnly) return { en: "Favourites", hi: "पसंदीदा" };
    if (selectedCategoryIds.length === 0) return { en: "All categories", hi: "सभी" };
    if (selectedCategoryIds.length === 1) {
      const cat = categories.find((c) => c.id === selectedCategoryIds[0]);
      return {
        en: cat ? cat.name : "Category",
        hi: cat ? cat.nameHi || cat.name : "श्रेणी",
      };
    }
    if (selectedCategoryIds.length === 2) {
      const c1 = categories.find((c) => c.id === selectedCategoryIds[0]);
      const c2 = categories.find((c) => c.id === selectedCategoryIds[1]);
      return {
        en: `${c1?.name || "Cat 1"}, ${c2?.name || "Cat 2"}`,
        hi: `${c1?.nameHi || c1?.name || ""}, ${c2?.nameHi || c2?.name || ""}`,
      };
    }
    return {
      en: `${selectedCategoryIds.length} categories`,
      hi: `${selectedCategoryIds.length} श्रेणियां`,
    };
  }, [selectedCategoryIds, categories, isFavoritesOnly]);

  const progressText = `${Math.min(currentIndex + 1, SESSION_LIMIT)} / ${Math.min(
    deck.length || SESSION_LIMIT,
    SESSION_LIMIT
  )}`;

  const isHindi = language === "HI";

  return (
    <div className={styles.pageContainer}>
      {/* ──────────────── 2. SCREEN LAYOUT: HEADER ROWS ──────────────── */}
      <FlashcardHeader
        activeTab="facts"
        language={language}
        onLanguageChange={handleLanguageChange}
        categoryName={categoryTitle.en}
        categoryNameHi={categoryTitle.hi}
        onOpenCategorySheet={() => setIsCategorySheetOpen(true)}
        progressText={progressText}
      />

      {/* ──────────────── 3. FLASHDECK OR SESSION SUMMARY ──────────────── */}
      {isSessionComplete ? (
        <div className={styles.summaryContainer}>
          <div className={styles.summaryCard}>
            <div className={styles.cardBadge}>
              <Heart size={22} color="#FFFFFF" />
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>
              {isHindi ? "सत्र पूर्ण!" : "Session Complete!"}
            </h2>
            <p style={{ color: "#5B6070", fontSize: "15px", margin: 0 }}>
              {isHindi
                ? `आपने ${reviewedCount} तथ्य सफलतापूर्वक पढ़े हैं।`
                : `You reviewed ${reviewedCount} facts in this session.`}
            </p>
            <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "12px" }}>
              <button
                type="button"
                className={styles.primaryNextBtn}
                style={{ flex: 1 }}
                onClick={restartSession}
              >
                {isHindi ? "फिर से खेलें" : "Play again"}
              </button>
              <button
                type="button"
                className={styles.roundControlBtn}
                style={{ width: "auto", padding: "0 18px", borderRadius: "9999px" }}
                onClick={() => setIsCategorySheetOpen(true)}
              >
                {isHindi ? "श्रेणी बदलें" : "Change category"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <FlashDeck
          cards={deck}
          currentIndex={currentIndex}
          onIndexChange={(nextIdx) => {
            if (nextIdx >= SESSION_LIMIT || nextIdx >= deck.length) {
              setReviewedCount((c) => c + 1);
              setIsSessionComplete(true);
            } else {
              setReviewedCount((c) => c + 1);
              setCurrentIndex(nextIdx);
            }
          }}
          isFlipped={isFlipped}
          onFlipChange={setIsFlipped}
          renderFront={(card) => (
            <>
              {/* Top row with Heart in top-right */}
              <div className={styles.cardTopRow}>
                <div className={`${styles.cardBadge} ${styles.badgePop}`}>
                  {getCategoryBadgeIcon(card?.categoryName, 18)}
                </div>
                <div className={styles.cardCategoryTitle}>
                  {isHindi
                    ? card?.categoryNameHi || card?.categoryName || "तथ्य"
                    : card?.categoryName || "Military"}
                </div>
                <button
                  type="button"
                  className={styles.cardTopRightHeartBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite();
                  }}
                  aria-label={isCurrentCardFavorited ? "Remove from favourites" : "Add to favourites"}
                >
                  <Heart
                    size={20}
                    fill={isCurrentCardFavorited ? "#E11D48" : "none"}
                    color={isCurrentCardFavorited ? "#E11D48" : "#94A3B8"}
                    strokeWidth={2}
                  />
                </button>
              </div>

              {/* Illustration Area with float & pop */}
              <div className={`${styles.cardIllustrationArea} ${styles.illustrationAnimated}`}>
                <CategoryIllustration
                  categoryName={card?.categoryName}
                  illustrationKey={card?.illustrationKey}
                />
              </div>

              {/* Bottom Text with Fade & Slide Up Reveal */}
              <div className={styles.cardBottomContent}>
                <p
                  key={`text-${card?.id}-${language}`}
                  className={`${styles.cardMainText} ${styles.textAnimated} ${
                    isHindi ? styles.hindiText : ""
                  }`}
                >
                  {isHindi
                    ? card?.textHi || card?.textEn || "लोड हो रहा है..."
                    : card?.textEn || "Loading fact..."}
                </p>
                <p className={styles.cardFlipHint}>
                  {isHindi ? "पलटने के लिए कार्ड पर टैप करें" : "Tap card to flip"}
                </p>
              </div>
            </>
          )}
          renderBack={(card) => (
            <>
              {/* Top row with Heart in top-right */}
              <div className={styles.cardTopRow}>
                <div className={styles.cardBadge}>
                  {getCategoryBadgeIcon(card?.categoryName, 18)}
                </div>
                <div className={styles.cardCategoryTitle}>
                  {isHindi ? "और जानें" : "Know more"}
                </div>
                <button
                  type="button"
                  className={styles.cardTopRightHeartBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite();
                  }}
                  aria-label={isCurrentCardFavorited ? "Remove from favourites" : "Add to favourites"}
                >
                  <Heart
                    size={20}
                    fill={isCurrentCardFavorited ? "#E11D48" : "none"}
                    color={isCurrentCardFavorited ? "#E11D48" : "#94A3B8"}
                    strokeWidth={2}
                  />
                </button>
              </div>

              {/* Back content: English & Hindi explanations, source */}
              <div className={`${styles.backContentScrollable} ${styles.textAnimated}`}>
                <span className={styles.knowMoreLabel}>KNOW MORE</span>

                {/* English Explanation */}
                {card?.explanationEn ? (
                  <p className={styles.explanationEn}>{card.explanationEn}</p>
                ) : (
                  <p className={styles.explanationEn}>
                    {card?.textEn}
                  </p>
                )}

                {/* Hindi Explanation in #EEF1FF box */}
                {(card?.explanationHi || card?.textHi) && (
                  <div className={styles.explanationHiBox}>
                    {card.explanationHi || card.textHi}
                  </div>
                )}
              </div>

              {/* Bottom Source */}
              <p className={styles.sourceText}>
                Source: {card?.source || "[add source]"}
              </p>
            </>
          )}
          controls={({ next, prev, isFlipped }) => (
            <div className={styles.controlsSection}>
              {!isFlipped ? (
                /* Front side controls: Sleek small Back & Next buttons */
                <>
                  <button
                    type="button"
                    className={styles.smallBackBtn}
                    onClick={() => prev()}
                    disabled={currentIndex === 0}
                    aria-label="Previous card"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <button
                    type="button"
                    className={styles.smallNextBtn}
                    onClick={() => next("right")}
                    aria-label="Next card"
                  >
                    <span>{isHindi ? "आगे" : "Next"}</span>
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                /* Back side controls: Again, Good, Easy (Anki spaced repetition) */
                <div className={styles.ankiButtonsRow}>
                  <button
                    type="button"
                    className={`${styles.ankiBtn} ${styles.ankiBtnAgain}`}
                    onClick={() => handleSpacedRepetition("again", next)}
                    aria-label="Review Again in 3 cards"
                  >
                    {isHindi ? "फिर से" : "Again"}
                  </button>
                  <button
                    type="button"
                    className={`${styles.ankiBtn} ${styles.ankiBtnGood}`}
                    onClick={() => handleSpacedRepetition("good", next)}
                    aria-label="Good, review in 10 cards"
                  >
                    {isHindi ? "अच्छा" : "Good"}
                  </button>
                  <button
                    type="button"
                    className={`${styles.ankiBtn} ${styles.ankiBtnEasy}`}
                    onClick={() => handleSpacedRepetition("easy", next)}
                    aria-label="Easy, finish for this session"
                  >
                    {isHindi ? "आसान" : "Easy"}
                  </button>
                </div>
              )}
            </div>
          )}
        />
      )}

      {/* ──────────────── 5. CATEGORY SHEET ──────────────── */}
      <CategorySheet
        isOpen={isCategorySheetOpen}
        onClose={() => setIsCategorySheetOpen(false)}
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
        selectedMode={mode}
        onSelectCategories={handleSelectCategories}
        onSelectMode={handleSelectMode}
        isHindi={isHindi}
      />
    </div>
  );
}
