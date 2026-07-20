"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/locales/language_translations';
import LanguageConfirmModal from '@/components/LanguageConfirmModal';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('hi');
  const [mounted, setMounted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language');
    const isConfirmed = localStorage.getItem('app-language-confirmed');

    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi')) {
      setLanguage(savedLanguage);
    } else {
      setLanguage('hi');
    }

    if (!isConfirmed) {
      setShowConfirmModal(true);
    }

    setMounted(true);
  }, []);

  const confirmLanguageSelection = (selectedLang) => {
    setLanguage(selectedLang);
    localStorage.setItem('app-language', selectedLang);
    localStorage.setItem('app-language-confirmed', 'true');
    document.cookie = `app-language=${selectedLang}; path=/; max-age=31536000`;
    setShowConfirmModal(false);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
    localStorage.setItem('app-language', newLang);
    localStorage.setItem('app-language-confirmed', 'true');
    document.cookie = `app-language=${newLang}; path=/; max-age=31536000`; // 1 year
  };

  const t = (path) => {
    const keys = path.split('.');
    
    // Attempt primary language lookup
    let result = translations[language];
    let found = true;
    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        found = false;
        break;
      }
    }
    
    if (found && result !== undefined) {
      return result;
    }

    // Fallback to English lookup if primary language missed
    if (language !== 'en') {
      let enResult = translations['en'];
      let enFound = true;
      for (const key of keys) {
        if (enResult && enResult[key] !== undefined) {
          enResult = enResult[key];
        } else {
          enFound = false;
          break;
        }
      }
      if (enFound && enResult !== undefined) {
        return enResult;
      }
    }

    console.warn(`Translation path not found: ${path} for language: ${language}`);
    return path;
  };

  const value = {
    language,
    toggleLanguage,
    confirmLanguageSelection,
    t,
    isHindi: language === 'hi',
    mounted
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <LanguageConfirmModal
        isOpen={showConfirmModal && mounted}
        onConfirm={confirmLanguageSelection}
        defaultLang={language}
      />
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    return {
      language: 'hi',
      toggleLanguage: () => {},
      t: (path) => {
        const keys = path.split('.');
        let result = translations['hi'];
        let found = true;
        for (const key of keys) {
          if (result && result[key] !== undefined) {
            result = result[key];
          } else {
            found = false;
            break;
          }
        }
        if (found && result !== undefined) return result;
        
        let enResult = translations['en'];
        for (const key of keys) {
          if (enResult && enResult[key] !== undefined) {
            enResult = enResult[key];
          } else {
            return path;
          }
        }
        return enResult;
      },
      isHindi: true,
      mounted: false
    };
  }
  return context;
}
