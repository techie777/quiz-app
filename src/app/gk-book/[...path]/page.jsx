"use client";

import React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import GkBookReader from "@/components/gk-book/GkBookReader";

export default function GkBookPathPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // Parse page number (1-indexed in query, 0-indexed in state)
  const pageQuery = searchParams.get("page");
  const initialPage = pageQuery ? Math.max(0, parseInt(pageQuery, 10) - 1) : 0;

  const handleBackToIndex = () => {
    router.push("/gk-book");
  };

  return (
    <GkBookReader
      initialPage={initialPage}
      onBackToIndex={handleBackToIndex}
    />
  );
}
