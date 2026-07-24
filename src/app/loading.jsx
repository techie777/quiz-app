"use client";

import styles from "../styles/Header.module.css";

export default function GlobalLoading() {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        zIndex: 9999
      }}
    >
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '3rem', display: 'block' }}>🧠</span>
          <h1 className={styles.logoText} style={{ fontSize: '1.5rem', marginTop: '1rem' }}>QuizWeb</h1>
        </div>
        <div 
          style={{
            width: '200px',
            height: '4px',
            background: 'rgba(99, 102, 241, 0.15)',
            borderRadius: '99px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              background: 'linear-gradient(90deg, #6366f1, #a855f7)',
              borderRadius: '99px'
            }} 
          />
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.8 }}>
          Initializing knowledge engine...
        </p>
      </div>
    </div>
  );
}
