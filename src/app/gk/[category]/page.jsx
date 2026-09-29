"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function GkCategoryRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const rawCategory = params.category || "india";
    const cat = rawCategory.toLowerCase().includes("world") ? "world" : "india";
    router.replace(`/gk?category=${cat}`);
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-slate-400 font-bold text-xs">
      Loading GK...
    </div>
  );
}
