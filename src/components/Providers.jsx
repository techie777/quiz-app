"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { DataProvider } from "@/context/DataContext";
import { QuizProvider } from "@/context/QuizContext";
import { UIProvider } from "@/context/UIContext";
import { MonetizationProvider } from "@/context/MonetizationContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "react-hot-toast";
import GlobalModals from "@/components/GlobalModals";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import toast from "react-hot-toast";

import { TierProvider } from "@/context/TierContext";
import { EntitlementProvider } from "@/context/EntitlementContext";
import LockedSetBottomSheet from "@/components/monetization/LockedSetBottomSheet";
import RewardedAdModal from "@/components/monetization/RewardedAdModal";
import AgeGateModal from "@/components/monetization/AgeGateModal";
import GlobalTouchFeedback from "@/components/GlobalTouchFeedback";

function ProgressSyncHandler() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      try {
        const deviceId = localStorage.getItem("quizweb_device_id");
        const alreadySynced = sessionStorage.getItem("quizweb_device_synced");
        if (deviceId && !alreadySynced) {
          fetch("/api/gk/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "sync", deviceId }),
          })
            .then((r) => r.json())
            .then((res) => {
              if (res.success) {
                sessionStorage.setItem("quizweb_device_synced", "true");
              }
            })
            .catch(() => {});
        }
      } catch {}
    }
  }, [status, session]);

  return null;
}

function AuthToaster() {
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      if (typeof window !== "undefined" && sessionStorage.getItem("auth_toast") === "login") {
        toast.success("Welcome back! Login successful. 🎉", { duration: 4000 });
        sessionStorage.removeItem("auth_toast");
      }
    } else if (status === "unauthenticated") {
      if (typeof window !== "undefined" && sessionStorage.getItem("auth_toast") === "logout") {
        toast.success("You have successfully signed out. 👋", { duration: 4000 });
        sessionStorage.removeItem("auth_toast");
      }
    }
  }, [status]);

  return null;
}

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <AuthToaster />
      <ProgressSyncHandler />
      <ThemeProvider attribute="data-theme" defaultTheme="light">
        <Toaster position="top-right" />
        <LanguageProvider>
          <TierProvider>
            <EntitlementProvider>
              <UIProvider>
                <DataProvider>
                  <MonetizationProvider>
                    <QuizProvider>{children}</QuizProvider>
                  </MonetizationProvider>
                </DataProvider>
                <GlobalModals />
                <LockedSetBottomSheet />
                <RewardedAdModal />
                <AgeGateModal />
                <GlobalTouchFeedback />
              </UIProvider>
            </EntitlementProvider>
          </TierProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
