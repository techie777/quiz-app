"use client";

import { useState } from "react";
import styles from "./LanguageToggle.module.css";

export default function LanguageToggle() {
  const [isHindi, setIsHindi] = useState(false);

  const toggleLanguage = () => {
    setIsHindi(!isHindi);
    // In a real app, this would update a global context or i18n store
    // For now, it just toggles the UI button
  };

  return (
    <div className={styles.toggleWrapper}>
      <button 
        className={styles.toggleBtn} 
        onClick={toggleLanguage}
        title={isHindi ? "Switch to English" : "Switch to Hindi"}
      >
        <span aria-hidden="true" style={{ fontSize: '1.2em' }}>
          {isHindi ? "A" : "अ"}
        </span>
        {isHindi ? "English" : "Hindi"}
      </button>
    </div>
  );
}
