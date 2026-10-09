import { Suspense } from "react";
import ArenaClient from "./ArenaClient";

export const metadata = {
  title: "GK Test Engine - Custom Quiz Practice | QuizWeb",
  description: "GK Test Engine on QuizWeb. Select categories, question count, difficulty, and timer settings.",
  alternates: {
    canonical: "https://quizweb.in/arena",
  },
  openGraph: {
    title: "GK Test Engine - Custom Quiz Practice | QuizWeb",
    description: "GK Test Engine on QuizWeb. Select categories, question count, difficulty, and timer settings.",
    url: "https://quizweb.in/arena",
    siteName: "QuizWeb",
    type: "website",
  },
};

export default function ArenaPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#EEF4FF] via-[#E0EBFF] to-[#D5E5FF] dark:from-[#080E1E] dark:via-[#0F1B38] dark:to-[#0A1226] text-slate-900 dark:text-slate-100 transition-colors">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      }>
        <ArenaClient />
      </Suspense>
    </main>
  );
}
