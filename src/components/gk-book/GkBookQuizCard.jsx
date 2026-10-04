"use client";

import React, { useState } from "react";
import styles from "@/styles/GkBook.module.css";
import { calculateStars } from "@/lib/gk-book/seedData";

export default function GkBookQuizCard({
  pageIndex = 0,
  questions = [],
  attempts = [],
  onRecordAttempt,
  onResetScore,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [shuffledQuiz, setShuffledQuiz] = useState([]);

  // Compute best score percentage and stars
  const hasAttempted = Array.isArray(attempts) && attempts.length > 0;
  const bestPct = hasAttempted
    ? Math.max(...attempts.map((a) => (a.t > 0 ? (a.s / a.t) * 100 : 0)))
    : 0;
  const lastAttempt = hasAttempted ? attempts[attempts.length - 1] : null;
  const starCount = hasAttempted ? calculateStars(bestPct, 100) : 0;

  // Shuffle questions and options
  const handleStartQuiz = () => {
    if (!questions || questions.length === 0) return;
    
    // Shuffle question list
    const qList = [...questions].sort(() => Math.random() - 0.5).map((q) => {
      const qText = q[0];
      const origOpts = q[1];
      const correctIdx = q[2];
      
      // Pair options with their boolean correctness
      const optPairs = origOpts.map((text, idx) => ({
        text,
        isCorrect: idx === correctIdx,
      })).sort(() => Math.random() - 0.5);

      return {
        question: qText,
        options: optPairs,
      };
    });

    setShuffledQuiz(qList);
    setCurrentQIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
    setScore(0);
    setIsCompleted(false);
    setIsPlaying(true);
  };

  const handleSelectOption = (idx) => {
    if (isAnswered) return;
    setSelectedOptionIndex(idx);
    setIsAnswered(true);

    const currentQ = shuffledQuiz[currentQIndex];
    if (currentQ?.options[idx]?.isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < shuffledQuiz.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
    } else {
      // Finished quiz
      const finalScore = score + (selectedOptionIndex !== null && shuffledQuiz[currentQIndex]?.options[selectedOptionIndex]?.isCorrect ? 0 : 0);
      const attemptData = {
        s: finalScore,
        t: shuffledQuiz.length,
        d: Date.now(),
      };
      if (onRecordAttempt) {
        onRecordAttempt(pageIndex, attemptData);
      }
      setIsCompleted(true);
    }
  };

  const handleCloseOverlay = () => {
    setIsPlaying(false);
    setIsCompleted(false);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
  };

  const handleReset = () => {
    if (window.confirm("इस अध्याय का स्कोर रीसेट करें?")) {
      if (onResetScore) onResetScore(pageIndex);
    }
  };

  return (
    <section className={styles.quizCard} aria-label="अध्याय क्विज़ कार्ड">
      <b className={styles.quizCardTitle}>इस अध्याय का क्विज़</b>
      
      {/* Star display */}
      <div className={styles.stars} aria-label={`${starCount} सितारे`}>
        {"★".repeat(starCount) + "☆".repeat(3 - starCount)}
      </div>

      {/* Meta text */}
      <div className={styles.quizCardMeta}>
        {hasAttempted
          ? `बेस्ट ${Math.round(bestPct)}% · पिछला ${lastAttempt?.s}/${lastAttempt?.t} · ${attempts.length} प्रयास`
          : "अभी तक खेला नहीं"}
      </div>

      {/* Action buttons */}
      <div className={styles.quizCardRow}>
        <button
          type="button"
          className={styles.btn}
          onClick={handleStartQuiz}
        >
          {hasAttempted ? "फिर खेलें" : "क्विज़ खेलें"}
        </button>
        {hasAttempted && (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSec}`}
            onClick={handleReset}
          >
            रीसेट
          </button>
        )}
      </div>

      {/* Full-screen quiz overlay modal */}
      {isPlaying && (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.overlayContent}>
            {!isCompleted ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <b style={{ fontSize: "15px" }}>
                    प्रश्न {currentQIndex + 1} / {shuffledQuiz.length}
                  </b>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={handleCloseOverlay}
                    aria-label="क्विज़ बंद करें"
                  >
                    ✕ बंद
                  </button>
                </div>

                <h2 style={{ fontSize: "20px", margin: "16px 0", color: "var(--tx)", lineHeight: "1.4" }}>
                  {shuffledQuiz[currentQIndex]?.question}
                </h2>

                <div style={{ margin: "14px 0" }}>
                  {shuffledQuiz[currentQIndex]?.options.map((opt, optIdx) => {
                    let optClass = styles.optionBtn;
                    if (isAnswered) {
                      if (opt.isCorrect) {
                        optClass += ` ${styles.optionOk}`;
                      } else if (optIdx === selectedOptionIndex) {
                        optClass += ` ${styles.optionNo}`;
                      }
                    }
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        className={optClass}
                        onClick={() => handleSelectOption(optIdx)}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div style={{ marginTop: "16px" }}>
                    <button
                      type="button"
                      className={styles.btn}
                      onClick={handleNextQuestion}
                      style={{ width: "100%" }}
                    >
                      {currentQIndex < shuffledQuiz.length - 1 ? "आगे →" : "नतीजा देखें"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div className={styles.bigScore}>
                  {score} / {shuffledQuiz.length}
                </div>
                
                {(() => {
                  const finalStars = calculateStars(score, shuffledQuiz.length);
                  return (
                    <>
                      <div className={styles.stars} style={{ fontSize: "32px", textAlign: "center", margin: "8px 0" }}>
                        {"★".repeat(finalStars) + "☆".repeat(3 - finalStars)}
                      </div>
                      <p style={{ textAlign: "center", fontSize: "16px", margin: "12px 0 24px", fontWeight: "600" }}>
                        {finalStars === 3
                          ? "शानदार!"
                          : finalStars >= 1
                          ? "अच्छा प्रयास!"
                          : "अध्याय दोबारा पढ़ें और फिर कोशिश करें।"}
                      </p>
                    </>
                  );
                })()}

                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={handleStartQuiz}
                  >
                    फिर खेलें
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSec}`}
                    onClick={handleCloseOverlay}
                  >
                    किताब पर लौटें
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
