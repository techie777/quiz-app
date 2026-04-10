"use client";

import styles from "../styles/Header.module.css";

export default function GlobalLoading() {
  return (
    <div className="global-loader-container">
      <div className="loader-content">
        <div className="loader-logo">
          <span style={{ fontSize: '3rem' }}>🧠</span>
          <h1 className={styles.logoText} style={{ fontSize: '1.5rem', marginTop: '1rem' }}>QuizWeb</h1>
        </div>
        <div className="loader-progress">
          <div className="loader-bar" />
        </div>
        <p className="loader-text">Initializing knowledge engine...</p>
      </div>

      <style jsx>{`
        .global-loader-container {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          z-index: 9999;
        }

        .loader-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .loader-logo {
          animation: pulse 2s infinite ease-in-out;
        }

        .loader-progress {
          width: 200px;
          height: 4px;
          background: rgba(var(--bg-secondary-rgb), 0.5);
          border-radius: 99px;
          overflow: hidden;
          position: relative;
        }

        .loader-bar {
          position: absolute;
          inset: 0;
          width: 100%;
          background: var(--brand-gradient);
          transform: translateX(-100%);
          animation: shimmer 1.5s infinite linear;
        }

        .loader-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          opacity: 0.8;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 0 rgba(var(--accent-rgb), 0));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 20px rgba(var(--accent-rgb), 0.3));
          }
        }

        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
