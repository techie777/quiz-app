"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GkBookShelf from "@/components/gk-book/GkBookShelf";
import GkBookIndex from "@/components/gk-book/GkBookIndex";
import GkBookReader from "@/components/gk-book/GkBookReader";

function GkBookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const bookParam = searchParams.get("book");
  const chapterParam = searchParams.get("chapter");
  const pageParam = searchParams.get("page");

  const [activeBook, setActiveBook] = useState(bookParam || null);
  const [activeChapter, setActiveChapter] = useState(chapterParam || null);
  const [activePage, setActivePage] = useState(
    pageParam ? Math.max(0, parseInt(pageParam, 10) - 1) : 0
  );

  // Sync state if search params change
  useEffect(() => {
    setActiveBook(bookParam || null);
    setActiveChapter(chapterParam || null);
    if (pageParam) {
      setActivePage(Math.max(0, parseInt(pageParam, 10) - 1));
    }
  }, [bookParam, chapterParam, pageParam]);

  const handleSelectBook = (slug) => {
    setActiveBook(slug);
    setActiveChapter(null);
    window.history.pushState(null, "", `/gk-book?book=${slug}`);
  };

  const handleBackToShelf = () => {
    setActiveBook(null);
    setActiveChapter(null);
    window.history.pushState(null, "", `/gk-book`);
  };

  const handleSelectChapter = (chapterSlug, page = 0) => {
    const parentBook =
      activeBook || (chapterSlug === "solar-system" ? "world-gk" : "india-gk");
    setActiveBook(parentBook);
    setActiveChapter(chapterSlug);
    setActivePage(page);
    window.history.pushState(
      null,
      "",
      `/gk-book?book=${parentBook}&chapter=${chapterSlug}&page=${page + 1}`
    );
  };

  const handleBackToIndex = () => {
    setActiveChapter(null);
    const parentBook = activeBook || "india-gk";
    window.history.pushState(null, "", `/gk-book?book=${parentBook}`);
  };

  // 1. If reading a chapter
  if (activeChapter) {
    return (
      <GkBookReader
        chapterSlug={activeChapter}
        initialPage={activePage}
        onBackToIndex={handleBackToIndex}
      />
    );
  }

  // 2. If a specific book's chapter tree index is open
  if (activeBook) {
    return (
      <GkBookIndex
        bookSlug={activeBook}
        onSelectChapter={handleSelectChapter}
        onBackToShelf={handleBackToShelf}
      />
    );
  }

  // 3. Default: Full Bookshelf with all books and top search bar
  return (
    <GkBookShelf
      onSelectBook={handleSelectBook}
      onSelectChapter={handleSelectChapter}
    />
  );
}

export default function GkBookPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f7f7fd",
            fontFamily: "Poppins, sans-serif",
            color: "#6b6b8a",
          }}
        >
          पुस्तकालय लोड हो रहा है…
        </div>
      }
    >
      <GkBookContent />
    </Suspense>
  );
}
