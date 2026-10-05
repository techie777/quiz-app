"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DailyQuizRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/daily-quiz/past");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Loading Daily Quiz...
        </p>
      </div>
    </div>
  );
}
