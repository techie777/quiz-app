"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DailyIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/quizzes");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-slate-400 font-black uppercase tracking-[0.3em]">
        Redirecting to Quizzes...
      </div>
    </div>
  );
}

