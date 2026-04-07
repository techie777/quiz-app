"use client";

import styles from "@/styles/SchoolStudy.module.css";

export default function SchoolStudyLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div style={{ width: '120px', height: '20px', background: 'rgba(var(--bg-secondary-rgb), 0.5)', borderRadius: '4px', marginBottom: '12px' }} />
        <div style={{ width: '240px', height: '48px', background: 'rgba(var(--bg-secondary-rgb), 0.5)', borderRadius: '8px', marginBottom: '8px' }} />
        <div style={{ width: '320px', height: '24px', background: 'rgba(var(--bg-secondary-rgb), 0.3)', borderRadius: '6px' }} />
      </div>

      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`${styles.card} ${styles.skeletonCard}`}>
            <div className={styles.skeletonIcon} />
            <div className={styles.skeletonInfo}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonSubtitle} />
            </div>
            <div className={styles.skeletonAction} />
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .skeletonCard {
          position: relative;
          overflow: hidden;
          background: rgba(var(--bg-secondary-rgb), 0.4) !important;
          border: 1px solid var(--card-border) !important;
          pointer-events: none;
        }

        .skeletonCard::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.05),
            transparent
          );
          animation: shimmer 1.5s infinite;
        }

        .skeletonIcon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: rgba(var(--bg-primary-rgb), 0.5);
        }

        .skeletonInfo {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeletonTitle {
          width: 60%;
          height: 24px;
          background: rgba(var(--bg-primary-rgb), 0.5);
          border-radius: 4px;
        }

        .skeletonSubtitle {
          width: 80%;
          height: 16px;
          background: rgba(var(--bg-primary-rgb), 0.3);
          border-radius: 4px;
        }

        .skeletonAction {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(var(--bg-primary-rgb), 0.5);
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
