import React, { Suspense } from "react";
import ChallengeClient from "./ChallengeClient";

export const metadata = {
  title: "1v1 Quiz Challenge | QuizWeb",
  description: "Challenge your friends to beat your quiz score on QuizWeb!",
};

export default function ChallengePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-8 h-8 border-3 border-purple-500/20 border-t-purple-600 rounded-full animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Loading Challenge...
          </p>
        </div>
      }
    >
      <ChallengeClient />
    </Suspense>
  );
}
