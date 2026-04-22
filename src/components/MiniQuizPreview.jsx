"use client";

import React, { useState, useEffect } from "react";

// Content for the mini-quiz
const CONTENT = {
  quiz: [
    { q: "Largest planet?", options: ["Earth", "Jupiter", "Mars"], correct: 1 },
    { q: "Fastest mammal?", options: ["Lion", "Cheetah", "Horse"], correct: 1 },
  ],
  govt: [
    { q: "First PM of India?", options: ["Nehru", "Gandhi", "Patel"], correct: 0 },
    { q: "Article 21 is...?", options: ["Privacy", "Life", "Speech"], correct: 1 },
  ],
  facts: [
    { q: "Hearts in an octopus?", options: ["One", "Two", "Three"], correct: 2 },
    { q: "Is a banana a berry?", options: ["Yes", "No", "Maybe"], correct: 0 },
  ],
  resources: [
    { q: "Latest job alerts?", options: ["SSC", "UPSC", "Both"], correct: 2 },
    { q: "Need study kits?", options: ["Yes", "No", "Later"], correct: 0 },
  ]
};

export default function MiniQuizPreview({ type = "quiz" }) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0); // 0: question, 1: selecting, 2: feedback, 3: score
  const [selected, setSelected] = useState(null);
  
  const questions = CONTENT[type] || CONTENT.quiz;
  const current = questions[index];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => {
        if (prev === 0) return 1;
        if (prev === 1) {
          setSelected(questions[index].correct);
          return 2;
        }
        if (prev === 2) {
          if (index < questions.length - 1) {
            setIndex(index + 1);
            setSelected(null);
            return 0;
          }
          return 3;
        }
        setIndex(0);
        setSelected(null);
        return 0;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [index, questions]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '20px',
      padding: '12px',
      fontSize: '11px',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid var(--card-border)',
      boxShadow: '0 8px 20px -5px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      color: 'var(--text-primary)',
      position: 'relative'
    }}>
      {step === 3 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          <div style={{ fontSize: '24px' }}>🏆</div>
          <div style={{ textAlign: 'left' }}>
            <b style={{ fontSize: '12px', display: 'block' }}>Quiz Done!</b>
            <span style={{ fontSize: '10px', color: '#059669', fontWeight: 'bold' }}>SCORE: 100%</span>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', gap: '12px' }}>
          {/* Left: Question */}
          <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ 
              color: '#6366f1', 
              fontWeight: '900', 
              marginBottom: '4px', 
              textTransform: 'uppercase', 
              fontSize: '8px',
              letterSpacing: '0.05em'
            }}>
              Q{index + 1}
            </div>
            <div style={{ 
              fontWeight: '800', 
              lineHeight: '1.2',
              fontSize: '12px',
              color: 'var(--text-primary)'
            }}>
              {current.q}
            </div>
          </div>

          {/* Right: Options */}
          <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
            {current.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = current.correct === i;
              let bg = 'var(--bg-secondary)';
              let border = 'var(--card-border)';
              let color = 'var(--text-secondary)';

              if (step >= 2 && isSelected) {
                bg = isCorrect ? '#ecfdf5' : '#fef2f2';
                border = isCorrect ? '#10b981' : '#ef4444';
                color = isCorrect ? '#065f46' : '#991b1b';
              } else if (step === 1 && isSelected) {
                border = '#6366f1';
                bg = '#eef2ff';
              }

              return (
                <div key={i} style={{
                  padding: '6px 8px',
                  borderRadius: '10px',
                  border: `1.5px solid ${border}`,
                  backgroundColor: bg,
                  color: color,
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: '700',
                  fontSize: '9px'
                }}>
                  {opt}
                  {step >= 2 && isSelected && (
                    <span>{isCorrect ? '✓' : '✕'}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Mini Progress Dots */}
      <div style={{ 
        display: 'flex', 
        gap: '3px', 
        justifyContent: 'center', 
        marginTop: '8px' 
      }}>
        {questions.map((_, i) => (
          <div key={i} style={{
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            backgroundColor: i === index ? '#6366f1' : 'var(--card-border)'
          }} />
        ))}
      </div>
    </div>


  );
}
