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
      <ThemeProvider attribute="data-theme" defaultTheme="light">
        <Toaster position="top-right" />
        <LanguageProvider>
          <UIProvider>
            <DataProvider>
              <MonetizationProvider>
                <QuizProvider>{children}</QuizProvider>
              </MonetizationProvider>
            </DataProvider>
            <GlobalModals />
          </UIProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
