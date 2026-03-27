import styles from "@/styles/GovtJobsAlerts.module.css";

export default function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonHeader}>
        <div style={{ flex: 1 }}>
          <div className={styles.skeletonTitle}></div>
          <div className={styles.skeletonMeta}></div>
        </div>
        <div className={styles.skeletonCircle}></div>
      </div>
      <div className={styles.skeletonLine}></div>
      <div className={styles.skeletonLineShort}></div>
      <div className={styles.skeletonButton}></div>
      <div className={styles.shimmer}></div>
    </div>
  );
}
