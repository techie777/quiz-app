"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const MonetizationContext = createContext();

export const MonetizationProvider = ({ children }) => {
  const { data: session, status } = useSession();
  const [isPro, setIsPro] = useState(false);
  const [purchasedPasses, setPurchasedPasses] = useState([]);
  const [useCounts, setUseCounts] = useState({
    facts: 0,
    ca: 0,
    tf: 0,
    lifeline50: 0,
    lifelinePoll: 0,
  });

  // Load state from session or local storage
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // In a real app, we'd fetch these from the specialized /api/user/profile endpoint
      // For now, we simulate based on session data or a dummy fetch
      const fetchMonetization = async () => {
        try {
          const res = await fetch("/api/user/monetization-status");
          if (res.ok) {
            const data = await res.json();
            setIsPro(data.isPro);
            setPurchasedPasses(data.purchasedPasses || []);
            setUseCounts(prev => ({
              ...prev,
              facts: data.factsReadCount || 0,
              tf: data.tfAnsweredCount || 0,
            }));
          }
        } catch (err) {
          console.error("Failed to fetch monetization status", err);
        }
      };
      fetchMonetization();
    } else {
      // Guest local storage tracking
      const localCounts = JSON.parse(localStorage.getItem("quizweb_usage") || "{}");
      setUseCounts(prev => ({ ...prev, ...localCounts }));
    }
  }, [session, status]);

  // Persistent save for Guest
  useEffect(() => {
    if (status !== "authenticated") {
      localStorage.setItem("quizweb_usage", JSON.stringify(useCounts));
    }
  }, [useCounts, status]);

  const incrementCount = useCallback((type) => {
    setUseCounts(prev => ({ ...prev, [type]: prev[type] + 1 }));
    
    // If authenticated, sync with server in background
    if (status === "authenticated") {
       fetch("/api/user/increment-usage", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ type })
       }).catch(console.error);
    }
  }, [status]);

  const hasPass = useCallback((categoryId) => {
    if (isPro) return true;
    return purchasedPasses.includes(categoryId);
  }, [isPro, purchasedPasses]);

  const value = {
    isPro,
    purchasedPasses,
    useCounts,
    incrementCount,
    hasPass,
    refreshStatus: () => window.location.reload(), // Simple refresh for now
  };

  return (
    <MonetizationContext.Provider value={value}>
      {children}
    </MonetizationContext.Provider>
  );
};

export const useMonetization = () => {
  const context = useContext(MonetizationContext);
  if (!context) throw new Error("useMonetization must be used within MonetizationProvider");
  return context;
};
