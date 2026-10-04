"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import GkBookIndex from "@/components/gk-book/GkBookIndex";
import GkBookReader from "@/components/gk-book/GkBookReader";

export default function GkBookIndexPage() {
  const router = useRouter();
  const [activeChapter, setActiveChapter] = useState(null);
  const [activePage, setActivePage] = useState(0);

  const handleSelectChapter = (chapterSlug, page) => {
    setActiveChapter(chapterSlug);
    setActivePage(page || 0);
    // Push shallow route or update state
    window.history.pushState(null, "", `/gk-book/${chapterSlug}?page=${(page || 0) + 1}`);
  };

  const handleBackToIndex = () => {
    setActiveChapter(null);
    window.history.pushState(null, "", `/gk-book`);
  };

  if (activeChapter) {
    return (
      <GkBookReader
        chapterSlug={activeChapter}
        initialPage={activePage}
        onBackToIndex={handleBackToIndex}
      />
    );
  }

  return <GkBookIndex onSelectChapter={handleSelectChapter} />;
}
