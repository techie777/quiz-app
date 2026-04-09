"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import styles from "./LanguageToggle.module.css";

export default function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isHindi = searchParams.get("lang") === "hi";

  const toggleLanguage = () => {
    const newLang = isHindi ? "en" : "hi";
    
    // Create a new URLSearchParams instance and update 'lang'
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", newLang);
    
    const newUrl = `${pathname}?${params.toString()}`;
    router.push(newUrl, { scroll: false });
    
    // Fallback force-refresh if soft navigation fails to trigger SC update in custom server context
    setTimeout(() => {
      const currentParams = new URLSearchParams(window.location.search);
      if (currentParams.get("lang") !== newLang) {
        window.location.href = newUrl;
      }
    }, 300);
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
