"use client";

import React, { useState } from "react";

export default function LanguageConfirmModal({ isOpen, onConfirm, defaultLang = 'hi' }) {
  const [selected, setSelected] = useState(defaultLang || 'hi');

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(3, 7, 18, 0.8)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999999,
      padding: "20px",
      animation: "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
    }}>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlide {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div style={{
        background: "var(--bg-secondary, #1e293b)",
        border: "1px solid rgba(99, 102, 241, 0.35)",
        borderRadius: "32px",
        padding: "36px 32px",
        maxWidth: "460px",
        width: "100%",
        boxShadow: "0 35px 100px rgba(0, 0, 0, 0.6), 0 0 50px rgba(99, 102, 241, 0.2)",
        position: "relative",
        animation: "modalSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "68px",
            height: "68px",
            margin: "0 auto 16px",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.4)",
            borderRadius: "22px",
            display: "grid",
            placeItems: "center",
            fontSize: "2.2rem",
            boxShadow: "0 8px 24px rgba(99, 102, 241, 0.25)"
          }}>
            🌐
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "1.75rem",
            fontWeight: "900",
            color: "var(--text-primary, #f8fafc)",
            margin: "0 0 8px"
          }}>
            अपनी भाषा चुनें / Language
          </h2>
          <p style={{
            color: "var(--text-secondary, #94a3b8)",
            fontSize: "0.92rem",
            lineHeight: "1.5",
            margin: 0
          }}>
            कृपया आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें।<br/>
            Please choose your preferred language to continue.
          </p>
        </div>

        {/* Language Options Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "30px" }}>
          {/* Hindi Card (Default) */}
          <button
            type="button"
            onClick={() => setSelected('hi')}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 22px",
              borderRadius: "22px",
              background: selected === 'hi' 
                ? "linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.18) 100%)" 
                : "var(--bg-primary, rgba(15, 23, 42, 0.6))",
              border: selected === 'hi' 
                ? "2px solid #6366f1" 
                : "1px solid rgba(255, 255, 255, 0.08)",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: selected === 'hi' 
                ? "0 10px 25px -5px rgba(99, 102, 241, 0.35)" 
                : "none",
              transform: selected === 'hi' ? "translateY(-2px)" : "none",
              textAlign: "left"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "2rem" }}>🇮🇳</span>
              <div>
                <div style={{ 
                  fontSize: "1.2rem", 
                  fontWeight: "900", 
                  color: selected === 'hi' ? "#818cf8" : "var(--text-primary, #f8fafc)",
                  marginBottom: "4px"
                }}>
                  हिन्दी (Hindi)
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted, #64748b)", fontWeight: "700" }}>
                  डिफ़ॉल्ट रूप से चयनित / Default
                </div>
              </div>
            </div>
            <div style={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              border: selected === 'hi' ? "7px solid #6366f1" : "2px solid rgba(255, 255, 255, 0.2)",
              background: selected === 'hi' ? "#fff" : "transparent",
              transition: "all 0.2s"
            }} />
          </button>

          {/* English Card */}
          <button
            type="button"
            onClick={() => setSelected('en')}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 22px",
              borderRadius: "22px",
              background: selected === 'en' 
                ? "linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.18) 100%)" 
                : "var(--bg-primary, rgba(15, 23, 42, 0.6))",
              border: selected === 'en' 
                ? "2px solid #6366f1" 
                : "1px solid rgba(255, 255, 255, 0.08)",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: selected === 'en' 
                ? "0 10px 25px -5px rgba(99, 102, 241, 0.35)" 
                : "none",
              transform: selected === 'en' ? "translateY(-2px)" : "none",
              textAlign: "left"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "2rem" }}>🇬🇧</span>
              <div>
                <div style={{ 
                  fontSize: "1.2rem", 
                  fontWeight: "900", 
                  color: selected === 'en' ? "#818cf8" : "var(--text-primary, #f8fafc)",
                  marginBottom: "4px"
                }}>
                  English
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted, #64748b)", fontWeight: "700" }}>
                  International / Global
                </div>
              </div>
            </div>
            <div style={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              border: selected === 'en' ? "7px solid #6366f1" : "2px solid rgba(255, 255, 255, 0.2)",
              background: selected === 'en' ? "#fff" : "transparent",
              transition: "all 0.2s"
            }} />
          </button>
        </div>

        {/* Launch / Confirm Button */}
        <button
          type="button"
          onClick={() => onConfirm(selected)}
          style={{
            width: "100%",
            padding: "18px 24px",
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "20px",
            fontSize: "1.15rem",
            fontWeight: "900",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: "0 12px 28px -6px rgba(99, 102, 241, 0.5)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px) scale(1.01)";
            e.currentTarget.style.boxShadow = "0 18px 36px -4px rgba(99, 102, 241, 0.7)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 12px 28px -6px rgba(99, 102, 241, 0.5)";
          }}
        >
          <span>🚀</span>
          <span>
            {selected === 'hi' ? "हिन्दी में जारी रखें (Continue)" : "Continue in English"}
          </span>
        </button>

        {/* Footer Hint */}
        <div style={{
          marginTop: "20px",
          textAlign: "center",
          fontSize: "0.82rem",
          color: "var(--text-muted, #64748b)",
          fontWeight: "600",
          lineHeight: "1.4"
        }}>
          💡 आप किसी भी समय ऊपर हेडर से भाषा बदल सकते हैं।<br/>
          You can switch language anytime using the header option.
        </div>
      </div>
    </div>
  );
}
