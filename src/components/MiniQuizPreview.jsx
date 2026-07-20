"use client";

import React, { useState, useEffect } from "react";

// Content for the mini-quiz
const CONTENT = {
  quiz: [
    { label: "सवाल जवाब", q: "पत्तियों का हरा रंग किसके कारण होता है?", options: ["हीमोग्लोबिन", "लाइकोपीन", "क्लोरोफिल", "कैरोटीन"], correct: 2 },
    { label: "सवाल जवाब", q: "20 फीट सीढ़ी से गिरी पर चोट नहीं आई?", options: ["सबसे नीचे थी", "जादू था", "सपना था", "हवा में थी"], correct: 0 },
    { label: "सवाल जवाब", q: "भारत का राष्ट्रीय पक्षी कौन सा है?", options: ["मोर", "कबूतर", "तोता", "हंस"], correct: 0 },
    { label: "सवाल जवाब", q: "सौर मंडल का सबसे बड़ा ग्रह कौन सा है?", options: ["पृथ्वी", "बृहस्पति", "मंगल", "शनि"], correct: 1 },
  ],
  govt: [
    { label: "सरकारी परीक्षा", q: "भारत के पहले प्रधानमंत्री कौन थे?", options: ["नेहरू", "गांधी", "पटेल", "बोस"], correct: 0 },
    { label: "सरकारी परीक्षा", q: "अनुच्छेद 21 किससे संबंधित है?", options: ["निजता", "जीवन", "भाषण", "समानता"], correct: 1 },
    { label: "सरकारी परीक्षा", q: "रिजर्व बैंक ऑफ इंडिया की स्थापना कब हुई?", options: ["1935", "1947", "1950", "1920"], correct: 0 },
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
      padding: '12px 16px',
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
            <b style={{ fontSize: '14px', display: 'block' }}>क्विज़ पूरा हुआ!</b>
            <span style={{ fontSize: '12px', color: '#059669', fontWeight: 'bold' }}>स्कोर: 100%</span>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
          {/* Top: Question */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ 
              color: '#6366f1', 
              fontWeight: '900', 
              marginBottom: '6px', 
              textTransform: 'uppercase', 
              fontSize: '10px',
              letterSpacing: '0.05em'
            }}>
              {`Q${index + 1}`}
            </div>
            <div style={{ 
              fontWeight: '800', 
              lineHeight: '1.3',
              fontSize: '15px',
              color: 'var(--text-primary)'
            }}>
              {current.q}
            </div>
          </div>

          {/* Bottom: Options in 2x2 Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
                  padding: '8px 10px',
                  borderRadius: '12px',
                  border: `1.5px solid ${border}`,
                  backgroundColor: bg,
                  color: color,
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontWeight: '700',
                  fontSize: '12px',
                  textAlign: 'center',
                  minHeight: '36px'
                }}>
                  {opt}
                  {step >= 2 && isSelected && (
                    <span style={{ marginLeft: '6px' }}>{isCorrect ? '✓' : '✕'}</span>
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
        gap: '4px', 
        justifyContent: 'center', 
        marginTop: '10px' 
      }}>
        {questions.map((_, i) => (
          <div key={i} style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: i === index ? '#6366f1' : 'var(--card-border)'
          }} />
        ))}
      </div>
    </div>


  );
}
