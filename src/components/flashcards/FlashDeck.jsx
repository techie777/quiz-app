"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import "@/styles/FlashDeck.css";
import CardDecorations from "@/components/flashcards/CardDecorations";

/**
 * Reusable FlashDeck Component
 * Implements tactile 3-layer card deck, 3D flip with vertical lift,
 * drag-to-swipe with dynamic tilt, fly-away exit, deck advance,
 * settle bounce, return from left, phone vibration, and keyboard navigation.
 */
export default function FlashDeck({
  cards = [],
  currentIndex: externalIndex = null,
  onIndexChange = null,
  isFlipped: externalIsFlipped = null,
  onFlipChange = null,
  renderFront,
  renderBack,
  controls,
  onNext = null,
  onPrev = null,
  onAnswer = null, // for True/False: (boolean) => void
  answerFlash = null, // 'correct' | 'incorrect' | null
  cardBg = null, // 'correct' | 'incorrect' | null
  enableTapFlip = true,
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [internalFlipped, setInternalFlipped] = useState(false);

  const currentIndex = externalIndex !== null ? externalIndex : internalIndex;
  const isFlipped = externalIsFlipped !== null ? externalIsFlipped : internalFlipped;

  const [isAdvancing, setIsAdvancing] = useState(false);
  const [enterAnimation, setEnterAnimation] = useState(""); // 'enter-settle' | 'enter-left' | ''
  const [flyClass, setFlyClass] = useState(""); // 'is-flying-right' | 'is-flying-left' | ''
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const cardRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const isPointerDownRef = useRef(false);

  const currentCard = cards[currentIndex] || null;

  // Trigger tactile vibration on phone if supported
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch (e) {}
    }
  }, []);

  // Flip toggle
  const flip = useCallback(() => {
    triggerHaptic();
    const nextFlipped = !isFlipped;
    if (onFlipChange) {
      onFlipChange(nextFlipped);
    } else {
      setInternalFlipped(nextFlipped);
    }
  }, [isFlipped, onFlipChange, triggerHaptic]);

  // Next action (fly out + deck advance + settle bounce)
  const next = useCallback(
    (direction = "right") => {
      if (isAdvancing || flyClass) return;

      // Card flies away in specified direction
      setFlyClass(direction === "left" ? "is-flying-left" : "is-flying-right");
      // Deck behind steps forward
      setIsAdvancing(true);

      setTimeout(() => {
        const nextIdx = currentIndex + 1;
        if (onIndexChange) {
          onIndexChange(nextIdx);
        } else {
          setInternalIndex(nextIdx);
        }

        if (onNext) onNext(nextIdx);

        // Reset flip to front
        if (onFlipChange) {
          onFlipChange(false);
        } else {
          setInternalFlipped(false);
        }

        setFlyClass("");
        setIsAdvancing(false);
        // Settle animation with gentle bounce
        setEnterAnimation("enter-settle");
      }, 600);
    },
    [currentIndex, isAdvancing, flyClass, onIndexChange, onNext, onFlipChange]
  );

  // Prev action (slides in from left like returned card)
  const prev = useCallback(() => {
    if (currentIndex <= 0 || isAdvancing || flyClass) return;

    const prevIdx = currentIndex - 1;
    if (onIndexChange) {
      onIndexChange(prevIdx);
    } else {
      setInternalIndex(prevIdx);
    }

    if (onPrev) onPrev(prevIdx);

    // Reset flip to front
    if (onFlipChange) {
      onFlipChange(false);
    } else {
      setInternalFlipped(false);
    }

    setFlyClass("");
    setEnterAnimation("enter-left");
  }, [currentIndex, isAdvancing, flyClass, onIndexChange, onPrev, onFlipChange]);

  // Clear enter animations after completion
  useEffect(() => {
    if (enterAnimation) {
      const timer = setTimeout(() => setEnterAnimation(""), 760);
      return () => clearTimeout(timer);
    }
  }, [enterAnimation]);

  // Pointer / Mouse / Touch Drag handlers
  const handlePointerDown = (e) => {
    // Ignore clicks on buttons, inputs or links inside the card
    if (e.target.closest("button, a, input, select, textarea")) return;

    isPointerDownRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Start dragging after 6px movement threshold
    if (!isDragging && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      setIsDragging(true);
    }

    if (isDragging || Math.abs(dx) > 6) {
      setDragOffset({ x: dx, y: dy });
    }
  };

  const handlePointerUp = (e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const dt = Date.now() - dragStartRef.current.time;

    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });

    // Tap detected
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 400) {
      if (enableTapFlip) {
        flip();
      }
      return;
    }

    // Swipe threshold (past 90px it flies away)
    if (Math.abs(dx) > 90) {
      if (onAnswer && !isFlipped) {
        // True / False mode: swipe right = True, swipe left = False
        onAnswer(dx > 0);
      } else {
        // Fun facts mode: both swipe directions advance forward natural fly-out
        next(dx > 0 ? "right" : "left");
      }
    }
  };

  // Keyboard navigation: Space = flip, Arrow keys = prev/next
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when focusing an input or textarea
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        flip();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (onAnswer && !isFlipped) {
          onAnswer(true);
        } else {
          next("right");
        }
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (onAnswer && !isFlipped) {
          onAnswer(false);
        } else {
          prev();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flip, next, prev, onAnswer, isFlipped]);

  // Compute inline drag transform
  let dragStyle = {};
  if (isDragging && !flyClass) {
    const rotation = dragOffset.x * 0.08;
    dragStyle = {
      transform: `rotate(-1deg) translate(${dragOffset.x}px, ${dragOffset.y * 0.25}px) rotate(${rotation}deg)`,
      transition: "none",
    };
  }

  // Answer flash class
  let flashClass = "";
  if (answerFlash === "correct") flashClass = "flash-correct";
  if (answerFlash === "incorrect") flashClass = "flash-incorrect";

  // Answer background fill class (light green upon correct, light red upon incorrect)
  let cardBgClass = "";
  if (cardBg === "correct") cardBgClass = "card-bg-correct";
  if (cardBg === "incorrect") cardBgClass = "card-bg-incorrect";

  return (
    <>
      <div className="fd-deck-wrapper">
        <div
          className={`fd-deck ${isAdvancing ? "is-advancing" : ""}`}
          tabIndex={0}
          role="region"
          aria-label="Flashcard Deck"
        >
          {/* Deck layer 2: Lavender card behind (-3deg) */}
          <div className="fd-peek fd-peek--2" aria-hidden="true" />

          {/* Deck layer 1: Peach card behind (+4deg) */}
          <div className="fd-peek fd-peek--1" aria-hidden="true" />

          {/* Top Active Card */}
          <div
            ref={cardRef}
            className={`fd-card ${isDragging ? "is-dragging" : ""} ${enterAnimation} ${flyClass} ${flashClass} ${cardBgClass}`}
            style={dragStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="fd-lift">
              <div className={`fd-flip ${isFlipped ? "is-flipped" : ""}`}>
                {/* Front Face with ambient sparkles, blinking stars, and clouds */}
                <div className="fd-face fd-front">
                  <CardDecorations showCloud={true} showSparkles={true} />
                  {renderFront && currentCard ? (
                    renderFront(currentCard, { isFlipped, flip, next, prev })
                  ) : (
                    <div className="cardLoadingContainer">
                      <div className="skeletonBadge" />
                      <div className="skeletonIllustration" />
                      <div className="skeletonTextWrap">
                        <div className="skeletonTextLine" style={{ width: "85%" }} />
                        <div className="skeletonTextLine" style={{ width: "65%" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Back Face with ambient sparkles */}
                <div className="fd-face fd-back">
                  <CardDecorations showCloud={false} showSparkles={true} />
                  {renderBack && currentCard && renderBack(currentCard, { isFlipped, flip, next, prev })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* External Controls */}
      {controls && controls({ next, prev, isFlipped, flip, currentIndex })}
    </>
  );
}
