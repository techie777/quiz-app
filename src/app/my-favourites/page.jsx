"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import styles from "@/styles/Notes.module.css";
import Link from "next/link";

function formatDate(d) {
  if (!d) return "";
  try {
    const [y, m, day] = String(d).split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(day));
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export default function FavouritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { quizzes } = useData();
  const [favourites, setFavourites] = useState([]);
  const [caFavourites, setCaFavourites] = useState([]);
  const [quizFavIds, setQuizFavIds] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [section, setSection] = useState("questions"); // "questions" | "currentAffairs" | "quizzes"
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated" && !session?.user?.isAdmin) {
      fetch("/api/favourites")
        .then((r) => r.json())
        .then((data) => { setFavourites(data); })
        .catch(() => setLoading(false));

      fetch("/api/current-affairs/favourites")
        .then((r) => r.json())
        .then((data) => { setCaFavourites(Array.isArray(data.items) ? data.items : []); })
        .catch(() => {});

      fetch("/api/category-favourites")
        .then((r) => r.json())
        .then((data) => { setQuizFavIds(Array.isArray(data.ids) ? data.ids : []); })
        .catch(() => {});

      setLoading(false);
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

  const filteredCA = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return caFavourites;
    return caFavourites.filter((it) => {
      if (it.heading && String(it.heading).toLowerCase().includes(s)) return true;
      if (it.description && String(it.description).toLowerCase().includes(s)) return true;
      if (it.category && String(it.category).toLowerCase().includes(s)) return true;
      return false;
    });
  }, [caFavourites, search]);

  const filteredQuizzes = useMemo(() => {
    const favs = quizzes.filter(q => quizFavIds.includes(q.id));
    const s = search.trim().toLowerCase();
    if (!s) return favs;
    return favs.filter(q => q.topic.toLowerCase().includes(s));
  }, [quizzes, quizFavIds, search]);

  const handleRemove = async (questionId) => {
    await fetch("/api/favourites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    setFavourites((prev) => prev.filter((f) => f.questionId !== questionId));
  };

  const handleRemoveCA = async (currentAffairId) => {
    await fetch("/api/current-affairs/favourites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAffairId }),
    });
    setCaFavourites((prev) => prev.filter((x) => x.id !== currentAffairId));
  };

  const handleRemoveQuiz = async (categoryId) => {
    await fetch("/api/category-favourites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    setQuizFavIds((prev) => prev.filter((id) => id !== categoryId));
  };

  const chipStyle = (label) => {
    const s = String(label || "");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return {
      background: `linear-gradient(135deg, hsla(${h}, 85%, 55%, 0.18), hsla(${(h + 40) % 360}, 85%, 55%, 0.10))`,
      borderColor: `hsla(${h}, 85%, 55%, 0.35)`,
      color: `hsl(${h}, 65%, 40%)`,
    };
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
    doc.text("My Favourites - Saved Content", pageWidth / 2, y, { align: "center" });
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

    doc.save("my-favourites.pdf");
  };

  if (status === "loading" || loading) {
    return <div className={styles.page}><p>Loading...</p></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Favourites</h1>
        <p className={styles.subtitle}>
          {section === "questions" 
            ? `${favourites.length} favourite questions` 
            : section === "quizzes"
              ? `${quizFavIds.length} saved quizzes`
              : `${caFavourites.length} saved articles`}
        </p>
      </div>

      <div className={styles.sectionTabs}>
        <button
          className={`${styles.sectionTab} ${section === "questions" ? styles.sectionTabActive : ""}`}
          onClick={() => {
            setSection("questions");
            setActiveTab("all");
          }}
        >
          Questions
        </button>
        <button
          className={`${styles.sectionTab} ${section === "quizzes" ? styles.sectionTabActive : ""}`}
          onClick={() => {
            setSection("quizzes");
            setActiveTab("all");
          }}
        >
          Quizzes
        </button>
        <button
          className={`${styles.sectionTab} ${section === "currentAffairs" ? styles.sectionTabActive : ""}`}
          onClick={() => {
            setSection("currentAffairs");
            setActiveTab("all");
          }}
        >
          Current Affairs
        </button>
      </div>

      {section === "questions" && favourites.length === 0 ? (
        <div className={styles.empty}>
          <p>No favourite questions yet. Play a quiz and mark questions you want to save!</p>
        </div>
      ) : section === "quizzes" && quizFavIds.length === 0 ? (
        <div className={styles.empty}>
          <p>No favourite quizzes yet. Mark your favourite categories to see them here!</p>
        </div>
      ) : section === "currentAffairs" && caFavourites.length === 0 ? (
        <div className={styles.empty}>
          <p>No saved current affairs yet. Open Current Affairs and tap the heart icon.</p>
        </div>
      ) : (
        <>
          <div className={styles.toolbar}>
            <input
              className={styles.searchInput}
              placeholder={
                section === "questions" 
                  ? "Search favourites..." 
                  : section === "quizzes"
                    ? "Search quizzes..."
                    : "Search current affairs..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {section === "questions" && (
              <button className="btn-primary" onClick={handleExportPDF}>
                📄 Export PDF
              </button>
            )}
          </div>

          {section === "questions" && (
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
          )}

          <div className={styles.list}>
            {section === "questions" ? (
              <>
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
                {filtered.length === 0 && <p className={styles.noMatch}>No favourites match your filters.</p>}
              </>
            ) : section === "quizzes" ? (
              <>
                <div className={styles.quizGrid}>
                  {filteredQuizzes.map((q) => (
                    <div key={q.id} className={`${styles.quizCard} glass-card`}>
                      <div className={styles.quizCardTop}>
                        <span className={styles.quizEmoji}>{q.emoji}</span>
                        <button className={styles.removeBtn} onClick={() => handleRemoveQuiz(q.id)}>
                          ✕ Remove
                        </button>
                      </div>
                      <h3 className={styles.quizTopic}>{q.topic}</h3>
                      <p className={styles.quizDesc}>{q.description?.slice(0, 80)}{q.description?.length > 80 && "..."}</p>
                      <Link href={`/category/${q.id}`} className={styles.playBtn}>
                        Play Quiz
                      </Link>
                    </div>
                  ))}
                </div>
                {filteredQuizzes.length === 0 && <p className={styles.noMatch}>No quizzes match your search.</p>}
              </>
            ) : (
              <>
                {filteredCA.map((it) => (
                  <div key={it.id} className={`${styles.caCard} glass-card`}>
                    <div className={styles.caTop}>
                    <div className={styles.caMeta}>
                        <span>{formatDate(it.date)}</span>
                        {it.category ? (
                          <span className={styles.caChip} style={chipStyle(it.category)}>
                            {it.category}
                          </span>
                        ) : null}
                      </div>
                      <button className={styles.removeBtn} onClick={() => handleRemoveCA(it.id)}>
                        ✕ Remove
                      </button>
                    </div>
                    <div className={styles.caHeading}>{it.heading}</div>
                    <div className={styles.caDesc}>{it.description}</div>
                    <div className={styles.caActions}>
                      <button className={styles.readMoreBtn} onClick={() => setReading(it)}>
                        Read More
                      </button>
                    </div>
                  </div>
                ))}
                {filteredCA.length === 0 && <p className={styles.noMatch}>No current affairs match your search.</p>}
              </>
            )}
          </div>
        </>
      )}

      {reading && (
        <div className={styles.modalOverlay} onClick={() => setReading(null)}>
          <div className={`${styles.modal} glass-card`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTop}>
              <div className={styles.modalMeta}>
                <span>{formatDate(reading.date)}</span>
                {reading.category ? (
                  <span className={styles.caChip} style={chipStyle(reading.category)}>
                    {reading.category}
                  </span>
                ) : null}
              </div>
              <button className={styles.modalClose} onClick={() => setReading(null)}>
                ✕
              </button>
            </div>
            <div className={styles.modalTitle}>{reading.heading}</div>
            {reading.image ? <img src={reading.image} alt="" className={styles.modalImage} /> : null}
            <div className={styles.modalDesc}>{reading.description}</div>
          </div>
        </div>
      )}
    </div>
  );
}
