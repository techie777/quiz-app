"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "@/styles/AdminGkBook.module.css";
import GkBookReader from "@/components/gk-book/GkBookReader";

export default function GkBookAdminManager() {
  const [activeTab, setActiveTab] = useState("editor"); // "editor" | "importer"
  const [chaptersTree, setChaptersTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("sindhu-ghati");
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Chapter state
  const [chapterForm, setChapterForm] = useState({
    titleHi: "",
    titleEn: "",
    slug: "",
    subCategory: "प्राचीन भारत का इतिहास",
    topic: "सिंधु घाटी एवं प्रागैतिहासिक काल",
    subject: "सिंधु घाटी सभ्यता",
    summary: "",
    status: "published",
    sortOrder: 1,
    pages: [],
  });

  const [selectedPageIndex, setSelectedPageIndex] = useState(0);

  // Markdown importer state
  const [importText, setImportText] = useState("");
  const [importParsedPreview, setImportParsedPreview] = useState(null);

  // Fetch chapters catalog
  const fetchChapters = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gk-book/chapters");
      const data = await res.json();
      if (data.success && data.tree) {
        setChaptersTree(data.tree);
      }
    } catch (e) {
      console.error("Failed to load GK Book tree:", e);
    } finally {
      setLoading(false);
    }
  };

  // Load single chapter
  const loadChapter = async (slug) => {
    try {
      setLoading(true);
      setSelectedSlug(slug);
      const res = await fetch(`/api/gk-book/chapters/${slug}`);
      const data = await res.json();
      if (data.success && data.chapter) {
        const ch = data.chapter;
        setChapterForm({
          titleHi: ch.title || ch.titleHi || "",
          titleEn: ch.titleEn || "",
          slug: ch.slug || slug,
          subCategory: ch.subCategory || "प्राचीन भारत का इतिहास",
          topic: ch.topic || "सिंधु घाटी एवं प्रागैतिहासिक काल",
          subject: ch.subject || "सिंधु घाटी सभ्यता",
          summary: ch.summary || "",
          status: ch.status || "published",
          sortOrder: ch.sortOrder || 1,
          pages: ch.pages || [],
        });
        setSelectedPageIndex(0);
      }
    } catch (e) {
      console.error("Failed to load chapter:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
    loadChapter("sindhu-ghati");
  }, []);

  // Save chapter to DB
  const handleSaveChapter = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/gk-book/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chapterForm),
      });
      const data = await res.json();
      if (data.success) {
        alert("अध्याय सफलतापूर्वक सहेजा गया! (Chapter saved successfully)");
        fetchChapters();
      } else {
        alert("त्रुटि: " + (data.error || "Save failed"));
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // New Chapter reset
  const handleNewChapter = () => {
    const newSlug = "chapter-" + Date.now().toString(36);
    setSelectedSlug(newSlug);
    setChapterForm({
      titleHi: "नया अध्याय",
      titleEn: "New Chapter",
      slug: newSlug,
      subCategory: "प्राचीन भारत का इतिहास",
      topic: "विषय",
      subject: "अध्याय",
      summary: "",
      status: "draft",
      sortOrder: 1,
      pages: [
        {
          title: "पृष्ठ 1 — परिचय",
          pageNumber: 1,
          readingTimeShort: 1,
          readingTimeFull: 2,
          P: [
            { type: "h", text: "1. मुख्य परिचय" },
            { type: "p", text: "यहाँ संक्षिप्त विवरण लिखें..." },
            { type: "f", title: "परीक्षा दृष्टि", text: "प्रमुख परीक्षा बिंदु..." },
          ],
          F: [
            { type: "h", text: "1. विस्तृत ऐतिहासिक विश्लेषण" },
            { type: "p", text: "यहाँ विस्तृत जानकारी लिखें..." },
          ],
          q: [
            {
              id: "q1",
              text: "इस अध्याय का मुख्य प्रश्न क्या है?",
              options: ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"],
              answer: 0,
              explanation: "विकल्प 1 सही उत्तर है।",
            },
          ],
        },
      ],
    });
    setSelectedPageIndex(0);
  };

  // Page manipulation
  const activePage = chapterForm.pages[selectedPageIndex] || {
    title: "",
    P: [],
    F: [],
    q: [],
  };

  const handleUpdateActivePage = (field, value) => {
    setChapterForm((prev) => {
      const nextPages = [...prev.pages];
      nextPages[selectedPageIndex] = {
        ...nextPages[selectedPageIndex],
        [field]: value,
      };
      return { ...prev, pages: nextPages };
    });
  };

  const handleAddPage = () => {
    const nextNum = chapterForm.pages.length + 1;
    const newPage = {
      title: `पृष्ठ ${nextNum}`,
      pageNumber: nextNum,
      readingTimeShort: 1,
      readingTimeFull: 2,
      P: [{ type: "p", text: "संक्षिप्त विवरण..." }],
      F: [{ type: "p", text: "विस्तृत विवरण..." }],
      q: [],
    };
    setChapterForm((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage],
    }));
    setSelectedPageIndex(chapterForm.pages.length);
  };

  const handleDeleteActivePage = () => {
    if (chapterForm.pages.length <= 1) {
      alert("कम से कम 1 पृष्ठ होना आवश्यक है।");
      return;
    }
    if (!confirm("क्या आप वाकई इस पृष्ठ को हटाना चाहते हैं?")) return;

    setChapterForm((prev) => {
      const nextPages = prev.pages.filter((_, idx) => idx !== selectedPageIndex);
      return { ...prev, pages: nextPages };
    });
    setSelectedPageIndex(Math.max(0, selectedPageIndex - 1));
  };

  // Quiz Question manipulation within the active page
  const handleAddQuizQuestion = () => {
    const newQ = {
      id: "q_" + Date.now(),
      text: "नया प्रश्न",
      options: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
      answer: 0,
      explanation: "व्याख्या यहाँ लिखें...",
    };
    const currentQ = activePage.q || [];
    handleUpdateActivePage("q", [...currentQ, newQ]);
  };

  const handleUpdateQuizQuestion = (qIndex, field, value) => {
    const currentQ = [...(activePage.q || [])];
    currentQ[qIndex] = {
      ...currentQ[qIndex],
      [field]: value,
    };
    handleUpdateActivePage("q", currentQ);
  };

  const handleUpdateQuizOption = (qIndex, optIndex, optVal) => {
    const currentQ = [...(activePage.q || [])];
    const opts = [...(currentQ[qIndex].options || ["", "", "", ""])];
    opts[optIndex] = optVal;
    currentQ[qIndex].options = opts;
    handleUpdateActivePage("q", currentQ);
  };

  const handleDeleteQuizQuestion = (qIndex) => {
    const currentQ = (activePage.q || []).filter((_, idx) => idx !== qIndex);
    handleUpdateActivePage("q", currentQ);
  };

  // Parse structured Markdown text into chapter & pages
  const handleParseImport = () => {
    if (!importText.trim()) return;

    const lines = importText.split("\n");
    let titleHi = "आयातित अध्याय";
    let subCategory = "प्राचीन भारत का इतिहास";
    let topic = "विषय";
    let subject = "अध्याय";

    const parsedPages = [];
    let currentPage = null;
    let currentMode = "P"; // 'P' or 'F' or 'Q'

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith("[अध्याय]")) {
        titleHi = trimmed.replace("[अध्याय]", "").trim();
      } else if (trimmed.startsWith("[उप-श्रेणी]")) {
        subCategory = trimmed.replace("[उप-श्रेणी]", "").trim();
      } else if (trimmed.startsWith("[विषय]")) {
        topic = trimmed.replace("[विषय]", "").trim();
      } else if (trimmed.startsWith("[शीर्षक]")) {
        subject = trimmed.replace("[शीर्षक]", "").trim();
      } else if (trimmed.startsWith("[पृष्ठ") || trimmed.startsWith("## पृष्ठ")) {
        if (currentPage) parsedPages.push(currentPage);
        const pTitle = trimmed.replace(/\[पृष्ठ \d+\]|## पृष्ठ \d+/g, "").replace(/^[:\-—\s]+/, "") || `पृष्ठ ${parsedPages.length + 1}`;
        currentPage = {
          title: pTitle,
          pageNumber: parsedPages.length + 1,
          readingTimeShort: 1,
          readingTimeFull: 2,
          P: [],
          F: [],
          q: [],
        };
        currentMode = "P";
      } else if (trimmed === "[संक्षिप्त]") {
        currentMode = "P";
      } else if (trimmed === "[विस्तृत]") {
        currentMode = "F";
      } else if (trimmed === "[क्विज़]") {
        currentMode = "Q";
      } else if (currentPage) {
        if (currentMode === "P") {
          if (trimmed.startsWith("#")) {
            currentPage.P.push({ type: "h", text: trimmed.replace(/^#+\s*/, "") });
          } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            currentPage.P.push({ type: "l", items: [trimmed.replace(/^[-*]\s*/, "")] });
          } else if (trimmed.startsWith(">")) {
            currentPage.P.push({ type: "f", title: "परीक्षा दृष्टि", text: trimmed.replace(/^>\s*/, "") });
          } else {
            currentPage.P.push({ type: "p", text: trimmed });
          }
        } else if (currentMode === "F") {
          if (trimmed.startsWith("#")) {
            currentPage.F.push({ type: "h", text: trimmed.replace(/^#+\s*/, "") });
          } else {
            currentPage.F.push({ type: "p", text: trimmed });
          }
        }
      }
    });

    if (currentPage) parsedPages.push(currentPage);

    setImportParsedPreview({
      titleHi,
      subCategory,
      topic,
      subject,
      pages: parsedPages,
    });
  };

  const handleApplyImport = () => {
    if (!importParsedPreview) return;
    setChapterForm((prev) => ({
      ...prev,
      titleHi: importParsedPreview.titleHi,
      subCategory: importParsedPreview.subCategory,
      topic: importParsedPreview.topic,
      subject: importParsedPreview.subject,
      pages: importParsedPreview.pages,
    }));
    setActiveTab("editor");
    setSelectedPageIndex(0);
    alert("आयातित सामग्री संपादक में लोड कर दी गई है! समीक्षा करके 'सहेजें' पर क्लिक करें।");
  };

  // Filter chapter list in sidebar
  const flatChaptersList = [];
  chaptersTree.forEach((sc) => {
    sc.topics?.forEach((top) => {
      top.subjects?.forEach((subj) => {
        subj.chapters?.forEach((ch) => {
          flatChaptersList.push({
            ...ch,
            subCategory: sc.title,
            topic: top.title,
            subject: subj.title,
          });
        });
      });
    });
  });

  const filteredChapters = flatChaptersList.filter(
    (c) =>
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.titleEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>
            <span>📖</span> डिजिटल जीके बुक प्रबंधन (GK Book Manager)
          </h1>
          <p>
            संरचित डिजिटल पुस्तक: उप-श्रेणी &gt; विषय &gt; शीर्षक &gt; अध्याय &gt; पृष्ठ (संक्षिप्त/विस्तृत एवं स्व-निहित क्विज़)
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/gk-book" target="_blank" className={styles.btnSecondary}>
            <span>👁️</span> रीडर खोलें (Open Reader)
          </Link>
          <button
            onClick={() => setShowPreviewModal(true)}
            className={styles.btnSecondary}
          >
            <span>📱</span> लाइव पूर्वावलोकन (Preview)
          </button>
          <button
            onClick={handleSaveChapter}
            disabled={saving}
            className={styles.btnPrimary}
          >
            <span>💾</span> {saving ? "सहेजा जा रहा है..." : "अध्याय सहेजें (Save)"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "editor" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("editor")}
        >
          <span>✍️</span> अध्याय एवं पृष्ठ संपादक (Editor)
        </button>
        <button
          className={`${styles.tab} ${activeTab === "importer" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("importer")}
        >
          <span>📥</span> मार्कडाउन आयात (Markdown Importer)
        </button>
      </div>

      {activeTab === "importer" ? (
        <div className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>मार्कडाउन / टेक्स्ट द्वारा बल्क आयात</div>
            <button onClick={handleParseImport} className={styles.btnPrimary}>
              <span>⚡</span> पार्स करें (Parse Text)
            </button>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              नीचे अध्याय का संरचित टेक्स्ट पेस्ट करें (Format: [अध्याय], [उप-श्रेणी], [पृष्ठ 1], [संक्षिप्त], [विस्तृत]):
            </label>
            <textarea
              className={styles.textarea}
              style={{ minHeight: "280px", fontFamily: "monospace" }}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`[अध्याय] मौर्य साम्राज्य का उत्थान\n[उप-श्रेणी] प्राचीन भारत का इतिहास\n[विषय] मौर्य एवं उत्तर मौर्य काल\n[शीर्षक] मौर्य साम्राज्य\n\n[पृष्ठ 1] चंद्रगुप्त मौर्य एवं चाणक्य\n[संक्षिप्त]\nचंद्रगुप्त मौर्य ने 322 ई.पू. में मौर्य साम्राज्य की स्थापना की...\n\n[विस्तृत]\nविस्तृत विवरण एवं विश्लेषण...`}
            />
          </div>

          {importParsedPreview && (
            <div style={{ marginTop: "20px", padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 700, marginBottom: "8px", color: "#166534" }}>
                ✓ सफलतापूर्वक पार्स हुआ: {importParsedPreview.titleHi} ({importParsedPreview.pages.length} पृष्ठ)
              </div>
              <p style={{ fontSize: "13px", color: "#64748b" }}>
                उप-श्रेणी: {importParsedPreview.subCategory} | विषय: {importParsedPreview.topic} | शीर्षक: {importParsedPreview.subject}
              </p>
              <button onClick={handleApplyImport} className={styles.btnPrimary} style={{ marginTop: "12px" }}>
                संपादक में लोड करें और संपादित करें (Load into Editor)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Editor Mode */
        <div className={styles.grid}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarTitle}>
              <span>अध्याय सूची ({flatChaptersList.length})</span>
              <button
                onClick={handleNewChapter}
                className={styles.btnPrimary}
                style={{ padding: "4px 8px", fontSize: "12px" }}
              >
                + नया
              </button>
            </div>

            <div className={styles.searchBox}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="अध्याय खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.chapterList}>
              {filteredChapters.map((ch) => (
                <div
                  key={ch.slug}
                  onClick={() => loadChapter(ch.slug)}
                  className={`${styles.chapterItem} ${selectedSlug === ch.slug ? styles.chapterItemActive : ""}`}
                >
                  <div className={styles.chapterItemTitle}>{ch.title}</div>
                  <div className={styles.chapterItemMeta}>
                    <span>{ch.pages || 5} पृष्ठ</span>
                    <span className={ch.status === "published" ? styles.badgePublished : styles.badgeDraft}>
                      {ch.status === "published" ? "प्रकाशित" : "ड्राफ्ट"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Chapter Form */}
          <div className={styles.mainCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>अध्याय विवरण (Chapter Details)</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span className={chapterForm.status === "published" ? styles.badgePublished : styles.badgeDraft}>
                  स्थिति: {chapterForm.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
            </div>

            {/* Hierarchy Row */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>1. उप-श्रेणी (Sub-Category)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={chapterForm.subCategory}
                  onChange={(e) => setChapterForm({ ...chapterForm, subCategory: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>2. विषय (Topic)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={chapterForm.topic}
                  onChange={(e) => setChapterForm({ ...chapterForm, topic: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>3. शीर्षक / मूल विषय (Subject)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={chapterForm.subject}
                  onChange={(e) => setChapterForm({ ...chapterForm, subject: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>URL स्लग (Slug)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={chapterForm.slug}
                  onChange={(e) => setChapterForm({ ...chapterForm, slug: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>अध्याय का शीर्षक (Hindi)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={chapterForm.titleHi}
                  onChange={(e) => setChapterForm({ ...chapterForm, titleHi: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>अध्याय का शीर्षक (English)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={chapterForm.titleEn}
                  onChange={(e) => setChapterForm({ ...chapterForm, titleEn: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>संक्षिप्त सारांश (Summary)</label>
              <textarea
                className={styles.textarea}
                value={chapterForm.summary}
                onChange={(e) => setChapterForm({ ...chapterForm, summary: e.target.value })}
                placeholder="इस अध्याय का संक्षिप्त सारांश..."
              />
            </div>

            {/* Pages Section */}
            <div className={styles.pagesSection}>
              <div className={styles.pagesHeader}>
                <div className={styles.cardTitle} style={{ fontSize: "16px" }}>
                  अध्याय के पृष्ठ ({chapterForm.pages.length})
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleAddPage} className={styles.btnSecondary} style={{ fontSize: "12px", padding: "6px 12px" }}>
                    + पृष्ठ जोड़ें (Add Page)
                  </button>
                  <button onClick={handleDeleteActivePage} className={styles.btnDanger}>
                    🗑️ यह पृष्ठ हटाएं
                  </button>
                </div>
              </div>

              {/* Page Tabs */}
              <div className={styles.pageTabs}>
                {chapterForm.pages.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPageIndex(idx)}
                    className={`${styles.pageTabBtn} ${selectedPageIndex === idx ? styles.pageTabBtnActive : ""}`}
                  >
                    पृष्ठ {idx + 1}
                  </button>
                ))}
              </div>

              {/* Active Page Editor */}
              {activePage && (
                <div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>पृष्ठ का शीर्षक</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={activePage.title || ""}
                        onChange={(e) => handleUpdateActivePage("title", e.target.value)}
                        placeholder={`पृष्ठ ${selectedPageIndex + 1} का शीर्षक`}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>पठन समय (Short / Full मिनट)</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="number"
                          className={styles.input}
                          value={activePage.readingTimeShort || 1}
                          onChange={(e) => handleUpdateActivePage("readingTimeShort", parseInt(e.target.value) || 1)}
                          placeholder="Short Min"
                        />
                        <input
                          type="number"
                          className={styles.input}
                          value={activePage.readingTimeFull || 2}
                          onChange={(e) => handleUpdateActivePage("readingTimeFull", parseInt(e.target.value) || 2)}
                          placeholder="Full Min"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Short Content Editor */}
                  <div className={styles.blockEditorBox}>
                    <div className={styles.blockBoxHeader}>
                      <div className={styles.blockBoxTitle}>
                        <span>⚡</span> संक्षिप्त पाठ्य सामग्री (Short Mode - JSON Blocks)
                      </div>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        ब्लॉक्स: h (शीर्षक), p (पैराग्राफ), l (सूची), f (परीक्षा दृष्टि), t (तालिका)
                      </span>
                    </div>
                    <textarea
                      className={styles.textarea}
                      style={{ minHeight: "160px", fontFamily: "monospace", fontSize: "13px" }}
                      value={JSON.stringify(activePage.P || [], null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          handleUpdateActivePage("P", parsed);
                        } catch (err) {
                          // Allow typing while invalid json
                        }
                      }}
                    />
                  </div>

                  {/* Full Content Editor */}
                  <div className={styles.blockEditorBox}>
                    <div className={styles.blockBoxHeader}>
                      <div className={styles.blockBoxTitle}>
                        <span>📖</span> विस्तृत पाठ्य सामग्री (Full Mode - JSON Blocks)
                      </div>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        सम्पूर्ण एवं गहन विश्लेषण युक्त पाठ
                      </span>
                    </div>
                    <textarea
                      className={styles.textarea}
                      style={{ minHeight: "160px", fontFamily: "monospace", fontSize: "13px" }}
                      value={JSON.stringify(activePage.F || [], null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          handleUpdateActivePage("F", parsed);
                        } catch (err) {
                          // Allow typing
                        }
                      }}
                    />
                  </div>

                  {/* Self-Contained Page Quiz Manager */}
                  <div className={styles.quizManagerBox}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div className={styles.quizManagerTitle}>
                          <span>🎯</span> इस पृष्ठ का क्विज़ कार्ड (Page Quiz Card)
                        </div>
                        <div className={styles.quizManagerDesc}>
                          यह क्विज़ स्व-निहित (Self-contained) है और सीधे इस पृष्ठ के अंत में दिखाई देता है।
                        </div>
                      </div>
                      <button
                        onClick={handleAddQuizQuestion}
                        className={styles.btnPrimary}
                        style={{ fontSize: "12px", padding: "6px 12px", background: "#4f46e5" }}
                      >
                        + प्रश्न जोड़ें
                      </button>
                    </div>

                    {(activePage.q || []).length === 0 ? (
                      <div style={{ textAlign: "center", padding: "20px", color: "#6366f1", fontSize: "13px" }}>
                        इस पृष्ठ पर अभी कोई प्रश्न नहीं है। &quot;+ प्रश्न जोड़ें&quot; पर क्लिक करके प्रश्न जोड़ें।
                      </div>
                    ) : (
                      (activePage.q || []).map((question, qIdx) => (
                        <div key={qIdx} className={styles.questionCard}>
                          <div className={styles.questionCardHeader}>
                            <span style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>
                              प्रश्न {qIdx + 1}
                            </span>
                            <button
                              onClick={() => handleDeleteQuizQuestion(qIdx)}
                              className={styles.btnDanger}
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                            >
                              हटाएं
                            </button>
                          </div>

                          <div className={styles.formGroup}>
                            <input
                              type="text"
                              className={styles.input}
                              value={question.text || ""}
                              onChange={(e) => handleUpdateQuizQuestion(qIdx, "text", e.target.value)}
                              placeholder="प्रश्न यहाँ लिखें..."
                            />
                          </div>

                          <div className={styles.optionsGrid}>
                            {(question.options || ["", "", "", ""]).map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className={`${styles.optionInputWrap} ${question.answer === optIdx ? styles.optionInputCorrect : ""}`}
                              >
                                <input
                                  type="radio"
                                  name={`correct_q_${qIdx}`}
                                  checked={question.answer === optIdx}
                                  onChange={() => handleUpdateQuizQuestion(qIdx, "answer", optIdx)}
                                />
                                <span style={{ fontWeight: 600, fontSize: "12px", color: "#64748b" }}>
                                  {["A", "B", "C", "D"][optIdx]}:
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleUpdateQuizOption(qIdx, optIdx, e.target.value)}
                                  placeholder={`विकल्प ${optIdx + 1}`}
                                />
                              </div>
                            ))}
                          </div>

                          <div className={styles.formGroup}>
                            <input
                              type="text"
                              className={styles.input}
                              style={{ fontSize: "12px" }}
                              value={question.explanation || ""}
                              onChange={(e) => handleUpdateQuizQuestion(qIdx, "explanation", e.target.value)}
                              placeholder="व्याख्या (Explanation)..."
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPreviewModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ fontWeight: 700, fontSize: "16px" }}>
                📱 रीडर लाइव पूर्वावलोकन — {chapterForm.titleHi} (पृष्ठ {selectedPageIndex + 1})
              </div>
              <button onClick={() => setShowPreviewModal(false)} className={styles.closeBtn}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <GkBookReader initialPage={selectedPageIndex} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
