"use client";

import { Sparkles } from "lucide-react";
import styles from "@/styles/Loading.module.css";

export default function GlobalLoading() {
  return (
    <div className={styles.loadingOverlay} role="status" aria-label="Loading QuizWeb">
      {/* Ambient background glow */}
      <div className={styles.ambientGlow} />

      <div className={styles.contentCard}>
        {/* Modern Brand Logo with Glowing Emblem */}
        <div className={styles.logoWrapper}>
          <div className={styles.rippleRing} />
          <div className={styles.logoBadge}>
            <Sparkles size={36} className={styles.sparkleIcon} strokeWidth={2.2} />
          </div>
        </div>

        {/* Brand Name & Tag */}
        <div className={styles.brandRow}>
          <h1 className={styles.brandTitle}>QuizWeb</h1>
          <span className={styles.proPill}>PRO</span>
        </div>

        {/* Dynamic Flowing Beam Track */}
        <div className={styles.trackContainer}>
          <div className={styles.flowingBeam} />
        </div>

        {/* Dynamic Status Text */}
        <div className={styles.statusBlock}>
          <p className={styles.statusMain}>
            Loading your quiz experience
            <span className={styles.dotFlashing}>
              <span />
              <span />
              <span />
            </span>
          </p>
          <p className={styles.statusSub}>
            ज्ञान, क्विज़ व सेट्स तैयार किए जा रहे हैं...
          </p>
        </div>
      </div>
    </div>
  );
}
