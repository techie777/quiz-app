import { useState, useEffect } from "react";
import styles from "@/styles/AdOverlay.module.css";
import { useMonetization } from "@/context/MonetizationContext";

export default function AdOverlay({ onComplete, duration = 5, title = "ADVERTISEMENT", message = "Support us by watching this short ad simulation." }) {
  const [countdown, setCountdown] = useState(duration);
  const { isPro } = useMonetization();

  useEffect(() => {
    // If Pro user, instantly bypass the ad logic entirely!
    if (isPro) {
      onComplete();
      return;
    }

    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown, isPro, onComplete]);

  // If Pro, the state might render for a split millisecond before unmounting, return null
  if (isPro) return null;

  return (
    <div className={styles.adOverlay}>
      <div className={`${styles.adContent} glass-card`}>
        <div className={styles.adHeader}>
          <span className={styles.adBadge}>{title}</span>
          <div className={styles.adTimer}>
            {countdown > 0 ? `Wait ${countdown}s` : (
              <button className={styles.adCloseBtn} onClick={onComplete}>
                Close ×
              </button>
            )}
          </div>
        </div>
        <div className={styles.adBody}>
          <div className={styles.adPlaceholder}>
             <h3>Unlock Premium Features</h3>
             <p>{message}</p>
             <div className={styles.adVisual}>
                <div className={styles.adPulse} />
             </div>
             <p style={{fontSize: '10px', color: '#94a3b8', marginTop: '15px'}}>Upgrade to Pro for an Ad-Free Experience</p>
          </div>
        </div>
      </div>
    </div>
  );
}
