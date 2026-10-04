"use client";

import React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import GkBookReader from "@/components/gk-book/GkBookReader";

function GkBookPathContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // Parse page number (1-indexed in query, 0-indexed in state)
  const pageQuery = searchParams.get("page");
  const initialPage = pageQuery ? Math.max(0, parseInt(pageQuery, 10) - 1) : 0;

  const pathArray = params?.path || [];
  const chapterSlug = Array.isArray(pathArray) ? pathArray[pathArray.length - 1] : (pathArray || "sindhu-ghati");

  const handleBackToIndex = () => {
    const parentBook = chapterSlug === "solar-system" ? "world-gk" : "india-gk";
    router.push(`/gk-book?book=${parentBook}`);
  };

  return (
    <GkBookReader
      chapterSlug={chapterSlug}
      initialPage={initialPage}
      onBackToIndex={handleBackToIndex}
    />
  );
}

export default function GkBookPathPage() {
  return (
    <React.Suspense fallback={<div style={{ minHeight: "100vh", background: "#f7f7fd" }} />}>
      <GkBookPathContent />
    </React.Suspense>
  );
}
