"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [engineTheme, setEngineTheme] = useState("indigo");
  const pathname = usePathname();

  useEffect(() => {
    const savedTheme = localStorage.getItem("quizEngineTheme");
    if (savedTheme) setEngineTheme(savedTheme);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openOnboarding = () => setIsOnboardingOpen(true);
  const closeOnboarding = () => setIsOnboardingOpen(false);

  const updateEngineTheme = (theme) => {
    setEngineTheme(theme);
    localStorage.setItem("quizEngineTheme", theme);
  };

  return (
    <UIContext.Provider
      value={{
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
        isOnboardingOpen,
        openOnboarding,
        closeOnboarding,
        engineTheme,
        updateEngineTheme,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within a UIProvider");
  return context;
}
