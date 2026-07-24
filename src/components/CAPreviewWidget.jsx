"use client";

import React, { useState, useEffect } from "react";
import { Newspaper, Calendar, ArrowRight, Sparkles } from "lucide-react";

const HIGHLIGHTS = [
  { id: 1, topic: "राष्ट्रीय सुरक्षा", headline: "भारत की नई डिजिटल सुरक्षा और AI गवर्नेंस नीति 2026 लागू", tag: "National" },
  { id: 2, topic: "विज्ञान एवं प्रौद्योगिकी", headline: "ISRO ने गगनयान मिशन का सफल परीक्षण पूरा किया", tag: "Science & Tech" },
  { id: 3, topic: "आर्थिक समाचार", headline: "RBI ने जारी की वित्तीय समावेशन की नई गाइडलाइन्स", tag: "Economy" },
  { id: 4, topic: "अंतर्राष्ट्रीय मामले", headline: "G20 शिखर सम्मेलन में पर्यावरण सुरक्षा पर बड़ा समझौता", tag: "Global" }
];

export default function CAPreviewWidget() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HIGHLIGHTS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const current = HIGHLIGHTS[index];

  return (
    <div style={{
      width: '100%',
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '16px',
      padding: '12px 14px',
      fontSize: '11px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      border: '1px solid var(--card-border)',
      boxShadow: '0 4px 14px -3px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      color: 'var(--text-primary)',
      position: 'relative'
    }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontWeight: 800, fontSize: '11px' }}>
          <Newspaper size={14} />
          <span>दैनिक करंट अफेयर्स</span>
        </div>
        <span style={{ 
          fontSize: '9px', 
          fontWeight: 800, 
          padding: '2px 8px', 
          borderRadius: '99px', 
          background: '#e0f2fe', 
          color: '#0369a1',
          textTransform: 'uppercase'
        }}>
          {current.tag}
        </span>
      </div>

      {/* Main Snippet */}
      <div style={{ 
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        padding: '8px 10px',
        borderRadius: '10px',
        borderLeft: '3px solid #0284c7'
      }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '12px', lineHeight: 1.35, color: 'var(--text-primary)' }}>
          {current.headline}
        </p>
      </div>

      {/* Footer Dots & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '10px' }}>
          <Calendar size={11} />
          <span>आज के अपडेट्स</span>
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {HIGHLIGHTS.map((_, i) => (
            <div key={i} style={{
              width: i === index ? '12px' : '4px',
              height: '4px',
              borderRadius: '99px',
              backgroundColor: i === index ? '#0284c7' : 'var(--card-border)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
