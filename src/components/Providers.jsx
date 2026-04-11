"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { DataProvider } from "@/context/DataContext";
import { QuizProvider } from "@/context/QuizContext";
import { UIProvider } from "@/context/UIContext";
import { MonetizationProvider } from "@/context/MonetizationContext";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="data-theme" defaultTheme="light">
        <Toaster position="top-right" />
        <UIProvider>
          <DataProvider>
            <MonetizationProvider>
              <QuizProvider>{children}</QuizProvider>
            </MonetizationProvider>
          </DataProvider>
        </UIProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
