"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import styles from "@/styles/GkBook.module.css";
import GkBookHeader from "./GkBookHeader";
import GkBookQuizCard from "./GkBookQuizCard";
import {
  SHORT_PAGES,
  FULL_PAGES,
  SOLAR_SYSTEM_SHORT_PAGES,
  SOLAR_SYSTEM_FULL_PAGES,
  CHAPTER_PAGES_MAP,
  STORAGE_KEY,
  sanitizeHtml,
  LIVE_CHAPTER,
} from "@/lib/gk-book/seedData";

export default function GkBookReader({
  initialPage = 0,
  chapterSlug = "sindhu-ghati",
  onBackToIndex,
}) {
  // Local state synced with localStorage "gkbook:v1"
  const [pageIndex, setPageIndex] = useState(initialPage);
  const [isFull, setIsFull] = useState(false);
  const [fontSize, setFontSize] = useState(17);
  const [theme, setTheme] = useState("light");
  const [readPages, setReadPages] = useState({});
  const [attempts, setAttempts] = useState({});
  const [highlights, setHighlights] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [chapterData, setChapterData] = useState(null);

  // Point 1 Ergonomics & Features State
  const [isZenMode, setIsZenMode] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioRate, setAudioRate] = useState(1);
  const [audioStatusText, setAudioStatusText] = useState("");
  const [isBilingual, setIsBilingual] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [notePromptText, setNotePromptText] = useState("");
  const [selectionToolbar, setSelectionToolbar] = useState({
    visible: false,
    x: 0,
    y: 0,
    text: "",
  });

  const quizCardRef = useRef(null);
  const articleAreaRef = useRef(null);

  // Load chapter dynamically from DB API with fallback
  useEffect(() => {
    let isCancelled = false;
    async function loadChapter() {
      try {
        const res = await fetch(`/api/gk-book/chapters/${chapterSlug}`);
        const data = await res.json();
        if (!isCancelled && data.success && data.chapter) {
          setChapterData(data.chapter);
        }
      } catch (err) {
        console.warn("[GkBookReader] Failed to fetch chapter from API, using seed:", err);
      }
    }
    loadChapter();
    return () => {
      isCancelled = true;
    };
  }, [chapterSlug]);

  // Load saved settings & progress from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          if (parsed.read) setReadPages(parsed.read);
          if (parsed.att) setAttempts(parsed.att);
          if (typeof parsed.fs === "number") setFontSize(parsed.fs);
          if (parsed.full !== undefined) setIsFull(Boolean(parsed.full));
          if (Array.isArray(parsed.highlights)) setHighlights(parsed.highlights);
          if (typeof parsed.pg === "number" && parsed.pg >= 0 && parsed.pg < SHORT_PAGES.length) {
            setPageIndex(parsed.pg);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load gkbook:v1 state", e);
    }
  }, []);

  // Save changes to localStorage
  const saveState = (updated) => {
    try {
      const current = {
        read: readPages,
        att: attempts,
        pg: pageIndex,
        fs: fontSize,
        full: isFull ? 1 : 0,
        highlights,
        ...updated,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn("Failed to save gkbook:v1 state", e);
    }
  };

  const isSolar = chapterSlug === "solar-system";
  const defaultShortPages = isSolar ? SOLAR_SYSTEM_SHORT_PAGES : SHORT_PAGES;
  const defaultFullPages = isSolar ? SOLAR_SYSTEM_FULL_PAGES : FULL_PAGES;
  const seedPages = CHAPTER_PAGES_MAP[chapterSlug] || defaultShortPages;

  const dynamicPages = chapterData?.pages && chapterData.pages.length > 0 ? chapterData.pages : seedPages;
  const totalPagesCount = dynamicPages.length > 0 ? dynamicPages.length : 1;
  const chapterDisplayTitle = chapterData?.titleHi || (isSolar ? "सौरमंडल (Solar System)" : LIVE_CHAPTER.title);
  const currentPage = dynamicPages[pageIndex] || dynamicPages[0] || {};

  // Track Smart Resume / Last Read across visits
  useEffect(() => {
    if (!isMounted) return;
    try {
      const lastReadData = {
        bookSlug: isSolar ? "world-gk" : "india-gk",
        bookTitle: isSolar ? "विश्व सामान्य ज्ञान" : "भारत सामान्य ज्ञान",
        chapterSlug,
        chapterTitle: chapterDisplayTitle,
        pageIndex,
        pageTitle: currentPage.t || `पृष्ठ ${pageIndex + 1}`,
        totalPages: totalPagesCount,
        cover: isSolar ? "/images/gk-book/world-gk-cover.jpg" : "/images/gk-book/india-gk-cover.jpg",
        updatedAt: Date.now(),
      };
      localStorage.setItem("gkbook:lastRead", JSON.stringify(lastReadData));
    } catch (e) {
      console.warn("Could not save gkbook:lastRead", e);
    }
  }, [pageIndex, chapterSlug, chapterDisplayTitle, totalPagesCount, isMounted, isSolar, currentPage.t]);

  // Clean audio narration on page change or unmount
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  }, [pageIndex]);

  // Keybindings (Esc for Zen Mode)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isZenMode) {
        setIsZenMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZenMode]);

  // Switch Page
  const goToPage = (newIndex) => {
    if (newIndex < 0 || newIndex >= totalPagesCount) return;
    setPageIndex(newIndex);
    saveState({ pg: newIndex });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Toggle Short / Full
  const handleToggleShortFull = (fullMode) => {
    setIsFull(fullMode);
    saveState({ full: fullMode ? 1 : 0 });
  };

  // Font size change
  const handleFontSizeChange = (newSize) => {
    setFontSize(newSize);
    saveState({ fs: newSize });
  };

  // Theme change
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  // IntersectionObserver: Mark page as read ONLY when user scrolls to quiz card
  useEffect(() => {
    if (!isMounted) return;

    const el = quizCardRef.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      if (!readPages[pageIndex]) {
        const updated = { ...readPages, [pageIndex]: 1 };
        setReadPages(updated);
        saveState({ read: updated });
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !readPages[pageIndex]) {
          const updated = { ...readPages, [pageIndex]: 1 };
          setReadPages(updated);
          saveState({ read: updated });
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [pageIndex, readPages, isMounted]);

  // Record Quiz Attempt
  const handleRecordAttempt = (pIdx, attempt) => {
    const pageAttempts = attempts[pIdx] || [];
    const updated = {
      ...attempts,
      [pIdx]: [...pageAttempts, attempt],
    };
    setAttempts(updated);
    saveState({ att: updated });
  };

  // Reset Quiz Score for this page
  const handleResetScore = (pIdx) => {
    if (!window.confirm("क्या आप वाकई इस पृष्ठ का स्कोर रीसेट करना चाहते हैं?")) {
      return;
    }
    const updated = { ...attempts };
    delete updated[pIdx];
    setAttempts(updated);
    saveState({ att: updated });
  };

  // 1.1 Audio Narration (Web Speech API)
  const toggleAudioNarration = () => {
    if (!("speechSynthesis" in window)) {
      alert("क्षमा करें, आपके डिवाइस ब्राउज़र में टेक्स्ट-टू-स्पीच समर्थित नहीं है।");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsAudioActive(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Extract text from blocks
    const lines = [];
    currentBlocks.forEach((b) => {
      const type = b.type || b[0];
      const val = b.text !== undefined ? b.text : (b.items !== undefined ? b.items : b[1]);
      if (type === "h" && typeof val === "string") lines.push(val.replace(/<[^>]*>/g, ""));
      if (type === "p" && typeof val === "string") lines.push(val.replace(/<[^>]*>/g, ""));
      if (type === "l" && Array.isArray(val)) {
        val.forEach((item) => lines.push(item.replace(/<[^>]*>/g, "")));
      }
    });

    const fullText = lines.join(". ");
    if (!fullText) return;

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = audioRate;

    // Pick Hindi or Indian English voice
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find((v) => v.lang && (v.lang.includes("hi") || v.lang.includes("HI")));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setIsAudioActive(true);
      setAudioStatusText("ऑडियो वाचन जारी है…");
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setAudioStatusText("वाचन पूरा हुआ");
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setAudioStatusText("ऑडियो रुका");
    };

    window.speechSynthesis.speak(utterance);
    setIsAudioActive(true);
  };

  const handleSpeedToggle = () => {
    const nextRate = audioRate === 1 ? 1.25 : audioRate === 1.25 ? 1.5 : 1;
    setAudioRate(nextRate);
    if (isPlayingAudio) {
      // restart with new rate
      window.speechSynthesis.cancel();
      setTimeout(toggleAudioNarration, 100);
    }
  };

  // 1.2 Text Selection & Highlighting
  const handleMouseUpContent = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectionToolbar((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 3) return;

    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionToolbar({
        visible: true,
        x: Math.min(window.innerWidth - 120, Math.max(16, rect.left + rect.width / 2 - 80)),
        y: Math.max(10, rect.top - 46),
        text,
      });
    } catch (e) {
      // ignore
    }
  };

  const addHighlight = (color = "yellow", note = "") => {
    if (!selectionToolbar.text) return;
    const newHl = {
      id: "hl_" + Date.now(),
      text: selectionToolbar.text,
      color,
      note,
      pageIndex,
      chapterSlug,
      chapterTitle: chapterDisplayTitle,
      createdAt: new Date().toLocaleDateString("hi-IN"),
    };
    const updated = [...highlights, newHl];
    setHighlights(updated);
    saveState({ highlights: updated });
    setSelectionToolbar({ visible: false, x: 0, y: 0, text: "" });
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  };

  const deleteHighlight = (id) => {
    const updated = highlights.filter((h) => h.id !== id);
    setHighlights(updated);
    saveState({ highlights: updated });
  };

  // Highlight wrapper for rendered text
  const applyHighlights = (rawText) => {
    if (!rawText || typeof rawText !== "string") return rawText;
    let text = sanitizeHtml(rawText);

    // Apply bilingual helper tags if mode is on
    if (isBilingual) {
      text = text
        .replace(/सिंधु घाटी सभ्यता/g, "सिंधु घाटी सभ्यता <small style='opacity:0.75'>(Indus Valley Civilization)</small>")
        .replace(/हड़प्पा/g, "हड़प्पा <small style='opacity:0.75'>(Harappa)</small>")
        .replace(/मोहनजोदड़ो/g, "मोहनजोदड़ो <small style='opacity:0.75'>(Mohenjo-daro)</small>")
        .replace(/सौरमंडल/g, "सौरमंडल <small style='opacity:0.75'>(Solar System)</small>")
        .replace(/बृहस्पति/g, "बृहस्पति <small style='opacity:0.75'>(Jupiter)</small>")
        .replace(/शुक्र/g, "शुक्र <small style='opacity:0.75'>(Venus)</small>")
        .replace(/नाभिकीय संलयन/g, "नाभिकीय संलयन <small style='opacity:0.75'>(Nuclear Fusion)</small>");
    }

    const currentHls = highlights.filter((h) => h.pageIndex === pageIndex);
    currentHls.forEach((hl) => {
      if (hl.text && text.includes(hl.text)) {
        const cls =
          hl.color === "green"
            ? styles.highlightGreen
            : hl.color === "blue"
            ? styles.highlightBlue
            : styles.highlightYellow;
        text = text.replaceAll(
          hl.text,
          `<mark class="${cls}" title="${hl.note ? 'नोट: ' + hl.note : 'हाइलाइट'}">${hl.text}</mark>`
        );
      }
    });

    return text;
  };

  const shortBlocks = currentPage.P || currentPage.b || [];
  const fullBlocks = currentPage.F || defaultFullPages[pageIndex] || [];
  const currentBlocks = isFull ? (fullBlocks.length > 0 ? fullBlocks : shortBlocks) : shortBlocks;
  const readMin = isFull ? (currentPage.readingTimeFull || (currentPage.m || 3) + 3) : (currentPage.readingTimeShort || currentPage.m || 3);
  const progressPct = ((pageIndex + 1) / totalPagesCount) * 100;
  const currentChapterHighlights = highlights.filter((h) => h.chapterSlug === chapterSlug);

  // Render individual content block
  const renderBlock = (block, idx) => {
    if (!block) return null;
    const type = block.type || block[0];
    const val = block.text !== undefined ? block.text : (block.items !== undefined ? block.items : block[1]);

    if (type === "h") {
      return (
        <h2
          key={idx}
          dangerouslySetInnerHTML={{ __html: applyHighlights(val) }}
        />
      );
    }
    if (type === "p") {
      return (
        <p
          key={idx}
          dangerouslySetInnerHTML={{ __html: applyHighlights(val) }}
        />
      );
    }
    if (type === "f") {
      return (
        <div
          key={idx}
          className={styles.fact}
          dangerouslySetInnerHTML={{ __html: applyHighlights(val) }}
        />
      );
    }
    if (type === "l" && Array.isArray(val)) {
      return (
        <ul key={idx}>
          {val.map((item, i) => (
            <li
              key={i}
              dangerouslySetInnerHTML={{ __html: applyHighlights(item) }}
            />
          ))}
        </ul>
      );
    }
    if (type === "t" && Array.isArray(val)) {
      return (
        <div key={idx} style={{ overflowX: "auto", margin: "14px 0" }}>
          <table className={styles.table}>
            <tbody>
              {val.map((row, rIdx) => (
                <tr key={rIdx}>
                  {Array.isArray(row) &&
                    row.map((cell, cIdx) =>
                      rIdx === 0 ? (
                        <th
                          key={cIdx}
                          dangerouslySetInnerHTML={{ __html: applyHighlights(cell) }}
                        />
                      ) : (
                        <td
                          key={cIdx}
                          dangerouslySetInnerHTML={{ __html: applyHighlights(cell) }}
                        />
                      )
                    )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`${styles.bookWrapper} ${isZenMode ? styles.zenModeActive : ""}`}
      data-theme={theme}
    >
      {/* Floating Zen Mode Exit Button */}
      {isZenMode && (
        <button
          type="button"
          onClick={() => setIsZenMode(false)}
          className={styles.zenExitFloating}
          title="Esc दबाएं या क्लिक करें"
        >
          <span>✕</span>
          <span>ज़ेन मोड से बाहर आएं</span>
        </button>
      )}

      {/* Reader Sticky Header */}
      {!isZenMode && (
        <GkBookHeader
          title={`अध्याय ${pageIndex + 1} / ${totalPagesCount} · ${currentPage.t || currentPage.title || chapterDisplayTitle}`}
          theme={theme}
          onThemeChange={handleThemeChange}
          fontSize={fontSize}
          onFontSizeChange={handleFontSizeChange}
          onToggleAudio={toggleAudioNarration}
          isPlayingAudio={isPlayingAudio}
          onToggleZen={() => setIsZenMode(true)}
          onOpenNotes={() => setIsNotesModalOpen(true)}
          notesCount={currentChapterHighlights.length}
          isBilingual={isBilingual}
          onToggleBilingual={() => setIsBilingual(!isBilingual)}
        />
      )}

      {/* Audio Narration Floating Control Bar */}
      {isAudioActive && (
        <div className={styles.audioBar}>
          <div className={styles.audioInfo}>
            <span className={styles.audioPulse} />
            <span>{audioStatusText}</span>
            <span style={{ fontSize: "11px", color: "var(--mut)" }}>
              ({pageIndex + 1}/{totalPagesCount})
            </span>
          </div>

          <div className={styles.audioActions}>
            <button
              type="button"
              className={styles.audioControlBtn}
              onClick={handleSpeedToggle}
              title="वाचन गति बदलें"
            >
              ⚡ {audioRate}x
            </button>
            <button
              type="button"
              className={styles.audioPlayBtn}
              onClick={toggleAudioNarration}
            >
              {isPlayingAudio ? "⏸ रोकें" : "▶ चलाएं"}
            </button>
            <button
              type="button"
              className={styles.audioControlBtn}
              onClick={() => {
                if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                setIsPlayingAudio(false);
                setIsAudioActive(false);
              }}
              title="ऑडियो बंद करें"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <main className={styles.main}>
        {/* Breadcrumb with Back to Index */}
        {!isZenMode && (
          <div className={styles.crumb}>
            {onBackToIndex ? (
              <button
                type="button"
                onClick={onBackToIndex}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--pri)",
                  cursor: "pointer",
                  font: "inherit",
                  fontWeight: 700,
                  padding: 0,
                }}
              >
                ← अनुक्रमणिका (Index)
              </button>
            ) : (
              <Link href="/gk-book">← अनुक्रमणिका (Index)</Link>
            )}
            <span>›</span>
            <span>{chapterDisplayTitle}</span>
            <span>›</span>
            <span>पृष्ठ {pageIndex + 1}</span>
          </div>
        )}

        {/* Top Prev/Next Navigation Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSec} ${pageIndex === 0 ? styles.btnDisabled : ""}`}
            onClick={() => goToPage(pageIndex - 1)}
            disabled={pageIndex === 0}
            style={{ minHeight: "36px", padding: "6px 14px", fontSize: "13px" }}
          >
            ← पिछला पृष्ठ
          </button>

          <span className={styles.mutedText} style={{ margin: 0, fontSize: "13px" }}>
            पृष्ठ {pageIndex + 1} / {totalPagesCount}
          </span>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnSec} ${pageIndex === totalPagesCount - 1 ? styles.btnDisabled : ""}`}
            onClick={() => goToPage(pageIndex + 1)}
            disabled={pageIndex === totalPagesCount - 1}
            style={{ minHeight: "36px", padding: "6px 14px", fontSize: "13px" }}
          >
            अगला पृष्ठ →
          </button>
        </div>

        {/* Short / Full Reading Mode Switcher */}
        <div className={styles.modeSwitch}>
          <button
            type="button"
            className={`${styles.modeBtn} ${!isFull ? styles.modeBtnActive : ""}`}
            onClick={() => handleToggleShortFull(false)}
            aria-pressed={!isFull}
          >
            संक्षिप्त (Short)
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${isFull ? styles.modeBtnActive : ""}`}
            onClick={() => handleToggleShortFull(true)}
            aria-pressed={isFull}
          >
            विस्तृत (Full)
          </button>
        </div>

        {/* Chapter Title & Reading Time */}
        <h1 className={styles.heading1} style={{ marginTop: "14px" }}>
          {currentPage.t || currentPage.title}
        </h1>
        <div className={styles.mutedText}>
          ⏱ लगभग {readMin} मिनट पठन · {isFull ? "विस्तृत नोट्स (Deep Study)" : "संक्षिप्त नोट्स (Quick Revision)"}
        </div>

        {/* Progress Bar */}
        <div
          className={styles.progressBar}
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span
            className={styles.progressFill}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Page Dots Navigation */}
        <div className={styles.dots} style={{ marginTop: "14px" }}>
          {Array.from({ length: totalPagesCount }).map((_, idx) => {
            const isRead = Boolean(readPages[idx]);
            const isCurrent = idx === pageIndex;
            return (
              <button
                key={idx}
                type="button"
                className={`${styles.dot} ${isRead ? styles.dotRead : ""} ${isCurrent ? styles.dotCurrent : ""}`}
                onClick={() => goToPage(idx)}
                aria-label={`पृष्ठ ${idx + 1}`}
                title={`पृष्ठ ${idx + 1}${isRead ? " (पढ़ा हुआ)" : ""}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Reading Article Area (With Text Selection Tooltip support) */}
        <article
          ref={articleAreaRef}
          onMouseUp={handleMouseUpContent}
          onTouchEnd={handleMouseUpContent}
          className={styles.art}
          style={{ fontSize: `${fontSize}px` }}
        >
          {currentBlocks.map((block, idx) => renderBlock(block, idx))}
        </article>

        {/* Floating Text Selection Highlighter Popup */}
        {selectionToolbar.visible && (
          <div
            className={styles.textSelectionToolbar}
            style={{ left: `${selectionToolbar.x}px`, top: `${selectionToolbar.y}px` }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--mut)" }}>रंग:</span>
            <button
              type="button"
              className={`${styles.hlColorBtn} ${styles.hlColorYellow}`}
              onClick={() => addHighlight("yellow")}
              title="पीला हाइलाइटर"
            />
            <button
              type="button"
              className={`${styles.hlColorBtn} ${styles.hlColorGreen}`}
              onClick={() => addHighlight("green")}
              title="हरा हाइलाइटर"
            />
            <button
              type="button"
              className={`${styles.hlColorBtn} ${styles.hlColorBlue}`}
              onClick={() => addHighlight("blue")}
              title="नीला हाइलाइटर"
            />
            <button
              type="button"
              className={styles.hlActionBtn}
              onClick={() => {
                const note = window.prompt("इस अंश पर अपना व्यक्तिगत नोट लिखें:");
                if (note !== null) {
                  addHighlight("yellow", note);
                }
              }}
              title="नोट जोड़ें"
            >
              📝 नोट
            </button>
            <button
              type="button"
              className={styles.hlActionBtn}
              onClick={() => setSelectionToolbar({ visible: false, x: 0, y: 0, text: "" })}
            >
              ✕
            </button>
          </div>
        )}

        {/* Self-Contained Quiz Card at the End of Every Page */}
        <div ref={quizCardRef} style={{ marginTop: "24px" }}>
          <GkBookQuizCard
            key={`quiz_${pageIndex}`}
            pageIndex={pageIndex}
            chapterSlug={chapterSlug}
            questions={currentPage.q || []}
            pageAttempts={attempts[pageIndex] || []}
            onRecordAttempt={handleRecordAttempt}
            onResetScore={handleResetScore}
          />
        </div>

        {/* Bottom Prev / Next Navigation Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "24px",
          }}
        >
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSec} ${pageIndex === 0 ? styles.btnDisabled : ""}`}
            onClick={() => goToPage(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            ← पिछला पृष्ठ
          </button>

          {pageIndex < totalPagesCount - 1 ? (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPri}`}
              onClick={() => goToPage(pageIndex + 1)}
            >
              अगला पृष्ठ →
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPri}`}
              onClick={onBackToIndex}
            >
              ✓ अध्याय समाप्त (अनुक्रमणिका)
            </button>
          )}
        </div>
      </main>

      {/* My Highlights & Notes Modal / Drawer */}
      {isNotesModalOpen && (
        <div
          className={styles.notesModalOverlay}
          onClick={() => setIsNotesModalOpen(false)}
        >
          <div
            className={styles.notesModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.notesModalHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>
                  📝 मेरे हाइलाइट्स व नोट्स ({currentChapterHighlights.length})
                </h3>
                <small className={styles.mutedText}>
                  {chapterDisplayTitle}
                </small>
              </div>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setIsNotesModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {currentChapterHighlights.length > 0 ? (
              currentChapterHighlights.map((hl) => (
                <div key={hl.id} className={styles.notesItemCard}>
                  <div className={styles.notesItemHeader}>
                    <span>पृष्ठ {hl.pageIndex + 1} · {hl.createdAt}</span>
                    <button
                      type="button"
                      className={styles.notesDeleteBtn}
                      onClick={() => deleteHighlight(hl.id)}
                    >
                      हटाएं
                    </button>
                  </div>
                  <div className={styles.notesItemQuote}>
                    "{hl.text}"
                  </div>
                  {hl.note && (
                    <div className={styles.notesItemNote}>
                      <b>नोट:</b> {hl.note}
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.hlActionBtn}
                    style={{ marginTop: "6px" }}
                    onClick={() => {
                      goToPage(hl.pageIndex);
                      setIsNotesModalOpen(false);
                    }}
                  >
                    इस पृष्ठ पर जाएं ▶
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "28px 12px" }}>
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>🖍️</div>
                <p style={{ fontWeight: 700, margin: "0 0 4px" }}>कोई हाइलाइट नहीं है</p>
                <p className={styles.mutedText} style={{ fontSize: "12px", margin: 0 }}>
                  पढ़ते समय किसी भी वाक्य को सेलेक्ट करके पीला, हरा या नीला रंग दें और अपने नोट्स जोड़ें।
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
