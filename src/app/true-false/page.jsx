"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Check, X, ArrowRight, Trophy, Heart } from "lucide-react";
import styles from "@/styles/Flashcards.module.css";
import FlashcardHeader from "@/components/flashcards/FlashcardHeader";
import CategorySheet from "@/components/flashcards/CategorySheet";
import FlashDeck from "@/components/flashcards/FlashDeck";
import { CategoryIllustration } from "@/components/flashcards/CategorySVGs";
import { getCategoryBadgeIcon } from "@/components/flashcards/CategoryIcons";

const SESSION_LIMIT = 10;

export default function TrueFalsePage() {
  // Global & Persisted Preferences
  const [language, setLanguage] = useState("EN"); // "EN" or "HI"
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [mode, setMode] = useState("all"); // "all", "random", "daily", "speed"
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  // Deck & State
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userChoice, setUserChoice] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answerFlash, setAnswerFlash] = useState(null); // 'correct' | 'incorrect' | null
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // Stats & Streak
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Categories list
  const [categories, setCategories] = useState([]);

  // Prefetch tracking
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);

  // 1. Initial Load of Persisted Preferences & Categories
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("quizweb_flashcard_lang") || "EN";
      setLanguage(savedLang);

      try {
        const savedCatIds = JSON.parse(localStorage.getItem("quizweb_tf_catIds") || "[]");
        if (Array.isArray(savedCatIds)) {
          setSelectedCategoryIds(savedCatIds);
        }
      } catch (e) {
        const singleCat = localStorage.getItem("quizweb_tf_catId");
        if (singleCat && singleCat !== "null") {
          setSelectedCategoryIds([singleCat]);
        }
      }

      const savedMode = localStorage.getItem("quizweb_tf_mode") || "all";
      setMode(savedMode);

      try {
        const savedFavs = JSON.parse(localStorage.getItem("quizweb_tf_favs") || "[]");
        setFavoriteIds(new Set(savedFavs));
      } catch (e) {}
    }

    fetch("/api/true-false/categories")
      .then((res) => res.json())
      .then((data) => {
        const cats = data.categories || [];
        setCategories(cats);
      })
      .catch((err) => console.error("Error loading TF categories:", err));
  }, []);

  // Save language changes
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("quizweb_flashcard_lang", newLang);
    }
  };

  // 2. Fetch Questions in Batches of 20 with Multi-Category Support
  const fetchQuestionsBatch = useCallback(
    async (pageNum, replace = false) => {
      if (!replace && (isFetchingBatch || !hasMore)) return;
      setIsFetchingBatch(true);
      if (replace) setIsLoading(true);

      try {
        let url = `/api/true-false/list?page=${pageNum}&limit=20&tab=${mode}`;
        if (selectedCategoryIds.length > 0) {
          url += `&categories=${selectedCategoryIds.join(",")}`;
        }
        if (mode === "random" || mode === "speed") {
          url += `&seed=${Date.now()}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.questions) {
          const incoming = data.questions.map((q) => ({
            id: q.id,
            categoryId: q.categoryId,
            categoryName: q.categoryName || q.category?.name || "General",
            categoryNameHi: q.categoryNameHi || q.category?.nameHi || "सामान्य",
            statementEn: q.statementEn || q.statement || "",
            statementHi: q.statementHi || q.statement || "",
            answer: q.answer !== undefined ? q.answer : q.correctAnswer,
            explanationEn: q.explanationEn || q.explanation || "",
            explanationHi: q.explanationHi || "",
            illustrationKey: q.illustrationKey || q.category?.slug || q.category?.name?.toLowerCase() || "",
          }));

          setDeck((prev) => (replace ? incoming : [...prev, ...incoming]));
          setHasMore(data.pagination.page < data.pagination.totalPages);
          setPage(pageNum);

          if (replace) {
            setCurrentIndex(0);
            setIsFlipped(false);
            setIsAnswered(false);
            setUserChoice(null);
            setAnswerFlash(null);
            setReviewedCount(0);
            setCorrectCount(0);
            setStreak(0);
            setIsSessionComplete(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch TF batch:", err);
      } finally {
        setIsFetchingBatch(false);
        setIsLoading(false);
      }
    },
    [isFetchingBatch, hasMore, mode, selectedCategoryIds]
  );

  // Reload deck on category or mode change
  useEffect(() => {
    fetchQuestionsBatch(1, true);
  }, [selectedCategoryIds, mode]);

  // Prefetch next batch when 5 cards remain
  useEffect(() => {
    if (deck.length > 0 && deck.length - currentIndex <= 5 && hasMore && !isFetchingBatch) {
      fetchQuestionsBatch(page + 1, false);
    }
  }, [currentIndex, deck.length, hasMore, isFetchingBatch, page, fetchQuestionsBatch]);

  // Current Card
  const currentCard = useMemo(() => {
    if (deck.length === 0 || currentIndex >= deck.length) return null;
    return deck[currentIndex];
  }, [deck, currentIndex]);

  // Handle User Answer: True or False with green/red flash and flip
  const handleAnswer = (choice) => {
    if (isAnswered || !currentCard) return;

    setUserChoice(choice);
    const correct = choice === Boolean(currentCard.answer);
    setIsCorrect(correct);
    setIsAnswered(true);

    // Green or Red answer flash
    setAnswerFlash(correct ? "correct" : "incorrect");
    setTimeout(() => setAnswerFlash(null), 600);

    if (correct) {
      setCorrectCount((c) => c + 1);
      setStreak((s) => {
        const next = s + 1;
        setMaxStreak((m) => Math.max(m, next));
        return next;
      });
      // Reward coins for correct answer in speed mode
      if (mode === "speed") {
        // Claim 10 coins via wallet API
        (async () => {
          try {
            const res = await fetch("/api/wallet/claim", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ coins: 10, reason: "True/False correct answer" }),
            });
            if (res.ok) {
              toast.success("+10 Coins earned!");
            }
          } catch (e) {
            console.error("Coin claim failed", e);
          }
        })();
      }
    } else {
      setStreak(0);
    }

    // Automatically flip card to the result face
    setIsFlipped(true);
  };

  // Check if current card is favorited
  const isCurrentCardFavorited = useMemo(() => {
    if (!currentCard) return false;
    return favoriteIds.has(currentCard.id);
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
        localStorage.setItem("quizweb_tf_favs", JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  // Multi-Category selection handler
  const handleSelectCategories = (catIds) => {
    setSelectedCategoryIds(catIds);
    if (typeof window !== "undefined") {
      localStorage.setItem("quizweb_tf_catIds", JSON.stringify(catIds));
    }
  };

  // Mode selection handler
  const handleSelectMode = (newMode) => {
    setMode(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("quizweb_tf_mode", newMode);
    }
  };

  // Restart / Reset Session
  const restartSession = () => {
    fetchQuestionsBatch(1, true);
  };

  // Category title display in header
  const categoryTitle = useMemo(() => {
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
  }, [selectedCategoryIds, categories]);

  const progressText = `${Math.min(currentIndex + 1, SESSION_LIMIT)} / ${Math.min(
    deck.length || SESSION_LIMIT,
    SESSION_LIMIT
  )}`;
  // Timer for speed mode
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = React.useRef(null);
  React.useEffect(() => {
    if (mode !== "speed") return;
    // Start timer on first question load
    if (deck.length > 0 && currentIndex === 0 && !timerRef.current) {
      setTimeLeft(60);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            setIsSessionComplete(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mode, deck, currentIndex]);

  const isHindi = language === "HI";

  return (
    <div className={styles.pageContainer}>
      {/* ──────────────── 2. SCREEN LAYOUT: HEADER ROWS ──────────────── */}
      <FlashcardHeader
        activeTab="tf"
        language={language}
        onLanguageChange={handleLanguageChange}
        categoryName={categoryTitle.en}
        categoryNameHi={categoryTitle.hi}
        onOpenCategorySheet={() => setIsCategorySheetOpen(true)}
        progressText={progressText}
        streak={streak}
      />

      {/* ──────────────── 3. FLASHDECK OR SESSION SUMMARY ──────────────── */}
      {isSessionComplete ? (
        <div className={styles.summaryContainer}>
          <div className={styles.summaryCard}>
            <div className={styles.cardBadge}>
              <Trophy size={22} color="#FFFFFF" />
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>
              {isHindi ? "सत्र पूर्ण!" : "Session Complete!"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <p style={{ color: "#1F2430", fontSize: "18px", fontWeight: "600", margin: 0 }}>
                {isHindi ? "सटीकता:" : "Accuracy:"}{" "}
                <span style={{ color: "#0B6B53" }}>
                  {reviewedCount > 0
                    ? Math.round((correctCount / reviewedCount) * 100)
                    : 0}
                  %
                </span>{" "}
                ({correctCount} / {reviewedCount})
              </p>
              {maxStreak >= 2 && (
                <p style={{ color: "#8C5800", fontSize: "14px", fontWeight: "500", margin: 0 }}>
                  🔥 {isHindi ? "सर्वश्रेष्ठ स्ट्रीक:" : "Highest Streak:"} {maxStreak}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "12px" }}>
              <button
                type="button"
                className={styles.smallNextBtn}
                style={{ flex: 1 }}
                onClick={restartSession}
              >
                {isHindi ? "फिर से खेलें" : "Play again"}
              </button>
              <button
                type="button"
                className={styles.smallBackBtn}
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
              setIsAnswered(false);
              setUserChoice(null);
            }
          }}
          isFlipped={isFlipped}
          onFlipChange={setIsFlipped}
          onAnswer={handleAnswer}
          answerFlash={answerFlash}
          cardBg={isAnswered ? (isCorrect ? "correct" : "incorrect") : null}
          enableTapFlip={false}
          renderFront={(card) => (
            <>
              {/* Top row with Heart in top-right */}
              <div className={styles.cardTopRow}>
                <div className={`${styles.cardBadge} ${styles.badgePop}`}>
                  {getCategoryBadgeIcon(card?.categoryName, 18)}
                </div>
                <div className={styles.cardCategoryTitle}>
                  {isHindi
                    ? card?.categoryNameHi || card?.categoryName || "श्रेणी"
                    : card?.categoryName || "Animals"}
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

              {/* Illustration Area with float */}
              <div className={`${styles.cardIllustrationArea} ${styles.illustrationAnimated}`}>
                <CategoryIllustration
                  categoryName={card?.categoryName}
                  illustrationKey={card?.illustrationKey}
                />
              </div>

              {/* Bottom Statement with Fade & Slide Up Reveal */}
              <div className={styles.cardBottomContent}>
                <p
                  key={`statement-${card?.id}-${language}`}
                  className={`${styles.cardMainText} ${styles.textAnimated} ${
                    isHindi ? styles.hindiText : ""
                  }`}
                >
                  {isHindi
                    ? card?.statementHi || card?.statementEn || "लोड हो रहा है..."
                    : card?.statementEn || "Loading statement..."}
                </p>
                <p className={styles.cardFlipHint}>
                  {isHindi
                    ? "सही के लिए True, गलत के लिए False चुनें"
                    : "Tap True or False to answer"}
                </p>
              </div>
            </>
          )}
          renderBack={(card) => (
            <>
              {/* Top row with Heart in top-right */}
              <div className={styles.cardTopRow}>
                <div className={styles.cardBadge}>
                  {isCorrect ? (
                    <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                  ) : (
                    <X size={18} color="#FFFFFF" strokeWidth={2.5} />
                  )}
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

              {/* Back content: Status Badge & Explanations with Transition */}
              <div className={`${styles.backContentScrollable} ${styles.textAnimated}`}>
                <div>
                  <span
                    className={`${styles.resultStatusBadge} ${
                      isCorrect
                        ? styles.resultStatusCorrect
                        : styles.resultStatusIncorrect
                    } ${styles.badgePop}`}
                  >
                    {isCorrect
                      ? isHindi
                        ? "✓ सही उत्तर"
                        : "✓ Correct"
                      : isHindi
                      ? "✕ गलत उत्तर"
                      : "✕ Not quite"}
                  </span>
                </div>

                {/* English Explanation */}
                {card?.explanationEn && (
                  <p className={styles.explanationEn}>{card.explanationEn}</p>
                )}

                {/* Hindi Explanation in #EEF1FF box */}
                {card?.explanationHi && (
                  <div className={styles.explanationHiBox}>
                    {card.explanationHi}
                  </div>
                )}

                {/* Fallback if no explanation exists */}
                {!card?.explanationEn && !card?.explanationHi && (
                  <p className={styles.explanationEn}>
                    {isHindi
                      ? `यह कथन ${card?.answer ? "सही (True)" : "गलत (False)"} है।`
                      : `This statement is ${card?.answer ? "True" : "False"}.`}
                  </p>
                )}
              </div>

              {/* Bottom Answer Reminder */}
              <p className={styles.sourceText}>
                {isHindi ? "सही उत्तर:" : "Correct answer:"}{" "}
                <strong>{card?.answer ? (isHindi ? "सही (True)" : "True") : (isHindi ? "गलत (False)" : "False")}</strong>
              </p>
            </>
          )}
          controls={({ next }) => (
            <div className={styles.controlsSection}>
              {!isAnswered ? (
                /* Front side controls: Small slim True & False buttons */
                <div className={styles.tfButtonsRow}>
                  <button
                    type="button"
                    className={`${styles.tfBtn} ${styles.tfBtnTrue}`}
                    onClick={() => handleAnswer(true)}
                    aria-label="Answer True"
                  >
                    <Check size={18} />
                    <span>{isHindi ? "सही (True)" : "True"}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.tfBtn} ${styles.tfBtnFalse}`}
                    onClick={() => handleAnswer(false)}
                    aria-label="Answer False"
                  >
                    <X size={18} />
                    <span>{isHindi ? "गलत (False)" : "False"}</span>
                  </button>
                </div>
              ) : (
                // Back side controls: Show timer if speed mode
                <div className={styles.controlsSide}>
                  {mode === "speed" && (
                    <div className={styles.timerBadge}>⏱ {timeLeft}s left</div>
                  )}
                  <button
                    type="button"
                    className={styles.smallNextBtn}
                    onClick={() => next("right")}
                    aria-label="Next question"
                  >
                    <span>{isHindi ? "अगला प्रश्न" : "Next"}</span>
                    <ArrowRight size={16} />
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
