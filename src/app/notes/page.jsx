"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "@/styles/Notes.module.css";

export default function NotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favourites, setFavourites] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated" && !session?.user?.isAdmin) {
      fetch("/api/favourites")
        .then((r) => r.json())
        .then((data) => { setFavourites(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, session, router]);

  const categories = useMemo(() => {
    const cats = {};
    favourites.forEach((f) => {
      const cat = f.question.category;
      if (!cats[cat.id]) cats[cat.id] = { id: cat.id, topic: cat.topic, emoji: cat.emoji };
    });
    return Object.values(cats);
  }, [favourites]);

  const filtered = useMemo(() => {
    return favourites.filter((f) => {
      if (activeTab !== "all" && f.question.categoryId !== activeTab) return false;
      if (search && !f.question.text.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [favourites, activeTab, search]);

  const handleRemove = async (questionId) => {
    await fetch("/api/favourites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    setFavourites((prev) => prev.filter((f) => f.questionId !== questionId));
  };

  const handleExportPDF = async () => {
    const res = await fetch("/api/favourites/export");
    const data = await res.json();
    if (data.error) return;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text(data.companyName || "QuizWeb", pageWidth / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.text("My Notes - Favourite Questions", pageWidth / 2, y, { align: "center" });
    y += 12;

    for (const cat of data.categories) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text(`${cat.topic}`, 14, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      for (let i = 0; i < cat.questions.length; i++) {
        if (y > 270) { doc.addPage(); y = 20; }
        const q = cat.questions[i];
        const lines = doc.splitTextToSize(`${i + 1}. ${q.text}`, pageWidth - 28);
        doc.text(lines, 14, y);
        y += lines.length * 5;
        doc.setFont(undefined, "bold");
        doc.text(`Answer: ${q.correctAnswer}`, 20, y);
        doc.setFont(undefined, "normal");
        y += 8;
      }
      y += 4;
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.text(data.companyWebsite || "", pageWidth / 2, 290, { align: "center" });
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, 290, { align: "right" });
    }

    doc.save("my-notes.pdf");
  };

  if (status === "loading" || loading) {
    return <div className={styles.page}><p>Loading...</p></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Notes</h1>
        <p className={styles.subtitle}>{favourites.length} favourite questions</p>
      </div>

      {favourites.length === 0 ? (
        <div className={styles.empty}>
          <p>No favourite questions yet. Play a quiz and mark questions you want to save!</p>
        </div>
      ) : (
        <>
          <div className={styles.toolbar}>
            <input
              className={styles.searchInput}
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn-primary" onClick={handleExportPDF}>
              📄 Export PDF
            </button>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`${styles.tab} ${activeTab === cat.id ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(cat.id)}
              >
                {cat.emoji} {cat.topic}
              </button>
            ))}
          </div>

          <div className={styles.list}>
            {filtered.map((f) => (
              <div key={f.id} className={`${styles.noteCard} glass-card`}>
                <div className={styles.noteTop}>
                  <span className={styles.catBadge}>
                    {f.question.category.emoji} {f.question.category.topic}
                  </span>
                  <button className={styles.removeBtn} onClick={() => handleRemove(f.questionId)}>
                    ✕ Remove
                  </button>
                </div>
                <p className={styles.questionText}>{f.question.text}</p>
                <p className={styles.answer}>
                  <strong>Answer:</strong> {f.question.correctAnswer}
                </p>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className={styles.noMatch}>No notes match your filters.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
