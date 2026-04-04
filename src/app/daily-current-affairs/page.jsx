"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "@/styles/CurrentAffairs.module.css";

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

const CATEGORY_ICONS = {
  "all": "🌐",
  "science & technology": "🧪",
  "international": "🌍",
  "national": "🇮🇳",
  "sports": "🏆",
  "economy": "📈",
  "polity": "⚖️",
  "environment": "🌿",
  "defense": "🛡️",
  "banking": "🏦",
  "important days": "📅",
  "awards": "🏅"
};

function getCategoryIcon(cat) {
  if (!cat) return "🗞️";
  return CATEGORY_ICONS[cat.toLowerCase()] || "🗞️";
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

// Helper function to get today's date in YYYY-MM-DD format (local timezone)
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DailyCurrentAffairsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [favIds, setFavIds] = useState(new Set());
  const [reading, setReading] = useState(null);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [freeReadsUsed, setFreeReadsUsed] = useState(0);
  const [readItems, setReadItems] = useState(new Set()); // Track read items
  const maxFreeReads = 2; // Allow 2 free reads

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    // Set today's date by default (27-03-2026) - use local timezone
    return getTodayDateString();
  });
  const [total, setTotal] = useState(0);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedDate) params.set("date", selectedDate);
    if (!selectedDate && selectedMonth) params.set("month", selectedMonth);
    return params.toString();
  }, [page, pageSize, selectedCategory, selectedDate, selectedMonth]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/current-affairs?${query}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(Number(data.total || 0));
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setMonths(Array.isArray(data.months) ? data.months : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedDate, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagination = useMemo(() => {
    const current = clamp(page, 1, totalPages);
    const start = Math.max(1, current - 3);
    const end = Math.min(totalPages, start + 6);
    const nums = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedDate) params.set("date", selectedDate);
    if (!selectedDate && selectedMonth) params.set("month", selectedMonth);
    return `/current-affairs/export?${params.toString()}`;
  }, [selectedCategory, selectedDate, selectedMonth]);

  useEffect(() => {
    const isUser = session?.user && !session.user.isAdmin;
    if (status !== "authenticated" || !isUser) {
      setFavIds(new Set());
      return;
    }
    let cancelled = false;
    async function loadFavs() {
      try {
        const res = await fetch("/api/current-affairs/favourites?ids=1", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setFavIds(new Set(Array.isArray(data.ids) ? data.ids : []));
      } catch {}
    }
    loadFavs();
    return () => {
      cancelled = true;
    };
  }, [session, status]);

  const handleReadMore = (item) => {
    const isUser = session?.user && !session.user.isAdmin;
    
    // Check if user is authenticated
    if (status === "authenticated" && isUser) {
      setReading(item);
      setReadItems(prev => new Set([...prev, item.id]));
      return;
    }
    
    // Check if item is already read - if so, allow re-reading without consuming free read
    if (readItems.has(item.id)) {
      setReading(item);
      return;
    }
    
    // Check if free reads are available
    if (freeReadsUsed < maxFreeReads) {
      setReading(item);
      setReadItems(prev => new Set([...prev, item.id]));
      setFreeReadsUsed(prev => prev + 1);
      return;
    }
    
    // Show login prompt
    setLoginPrompt(true);
  };

  // Navigation functions for modal
  const navigateToPrevious = () => {
    const currentIndex = items.findIndex(item => item.id === reading?.id);
    if (currentIndex > 0) {
      const previousItem = items[currentIndex - 1];
      
      // Check if user can read this item
      if (!canReadItem(previousItem)) {
        setLoginPrompt(true);
        return;
      }
      
      setReading(previousItem);
      // Only mark as read and increment counter if it's a new item
      if (!readItems.has(previousItem.id)) {
        setReadItems(prev => new Set([...prev, previousItem.id]));
        setFreeReadsUsed(prev => prev + 1);
      }
    }
  };

  const navigateToNext = () => {
    const currentIndex = items.findIndex(item => item.id === reading?.id);
    if (currentIndex < items.length - 1) {
      const nextItem = items[currentIndex + 1];
      
      // Check if user can read this item
      if (!canReadItem(nextItem)) {
        setLoginPrompt(true);
        return;
      }
      
      setReading(nextItem);
      // Only mark as read and increment counter if it's a new item
      if (!readItems.has(nextItem.id)) {
        setReadItems(prev => new Set([...prev, nextItem.id]));
        setFreeReadsUsed(prev => prev + 1);
      }
    }
  };

  // Helper function to check if user can read an item
  const canReadItem = (item) => {
    const isUser = session?.user && !session.user.isAdmin;
    
    // Authenticated users can read unlimited
    if (status === "authenticated" && isUser) {
      return true;
    }
    
    // Check if item is already read
    if (readItems.has(item.id)) {
      return true;
    }
    
    // Check if free reads are available
    return freeReadsUsed < maxFreeReads;
  };

  // Share functionality
  const handleShare = async (item) => {
    try {
      // Create a canvas to generate the share image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 800;
      canvas.height = 800;
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Website header
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, canvas.width, 100);
      
      // Logo and website name in header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('🧠 QuizWeb', 40, 55);
      
      // Tagline
      ctx.font = '16px Arial';
      ctx.fillText('Education & Exam Preparation Platform', 40, 75);
      
      // Current affairs badge
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(canvas.width - 200, 20, 160, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('Daily Current', canvas.width - 180, 45);
      ctx.fillText('Affairs', canvas.width - 180, 65);
      
      // Main card area
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      roundRect(ctx, 40, 130, canvas.width - 80, 400, 16);
      ctx.fill();
      ctx.stroke();
      
      // Date in card
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(formatDate(item.date), 60, 165);
      
      // Category badge if exists
      if (item.category) {
        ctx.fillStyle = chipStyle(item.category).background;
        ctx.fillRect(60, 180, 120, 30);
        ctx.fillStyle = chipStyle(item.category).color;
        ctx.font = '14px Arial';
        ctx.fillText(item.category, 70, 200);
      }
      
      // Title in card
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 26px Arial';
      const titleLines = wrapText(ctx, item.heading, canvas.width - 120);
      let yPos = 250;
      titleLines.slice(0, 3).forEach(line => {
        ctx.fillText(line, 60, yPos);
        yPos += 35;
      });
      
      // Description in card
      ctx.fillStyle = '#475569';
      ctx.font = '18px Arial';
      const descLines = item.description.split('\n').slice(0, 3);
      yPos += 20;
      descLines.forEach(line => {
        const wrappedLines = wrapText(ctx, line, canvas.width - 120);
        wrappedLines.slice(0, 2).forEach(wrappedLine => {
          ctx.fillText(wrappedLine, 60, yPos);
          yPos += 28;
        });
      });
      
      // Bottom info section
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      roundRect(ctx, 40, 550, canvas.width - 80, 120, 16);
      ctx.fill();
      ctx.stroke();
      
      // Website info
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('Read more Daily Current Affairs on QuizWeb', 60, 590);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '16px Arial';
      ctx.fillText('Stay updated with latest news and exam preparation materials', 60, 615);
      
      // Website URL
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('🌐 quizweb.example.com', 60, 645);
      
      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Arial';
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 60, 780);
      
      // Convert to blob and share
      canvas.toBlob(async (blob) => {
        if (navigator.share && navigator.canShare({ files: [new File([blob], 'current-affair.png', { type: 'image/png' })] })) {
          await navigator.share({
            title: item.heading,
            text: `Daily Current Affairs - ${formatDate(item.date)} | QuizWeb`,
            files: [new File([blob], 'current-affair.png', { type: 'image/png' })]
          });
        } else {
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'current-affair.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Share failed:', error);
      alert('Sharing is not available on this device');
    }
  };

  // Helper function to draw rounded rectangles
  const roundRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Helper function to wrap text
  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const toggleFav = async (id) => {
    const isUser = session?.user && !session.user.isAdmin;
    if (status !== "authenticated" || !isUser) {
      setLoginPrompt(true);
      return;
    }
    const res = await fetch("/api/current-affairs/favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAffairId: id }),
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    const favourited = !!data?.favourited;
    setFavIds((prev) => {
      const next = new Set(prev);
      if (favourited) next.add(id);
      else next.delete(id);
      return next;
    });
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

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.title}>Intelligence Briefing</h1>
            <p className={styles.subtitle}>
              {selectedDate && selectedDate === getTodayDateString()
                ? `Active Directives - ${formatDate(selectedDate)}`
                : selectedDate
                ? `Archived Briefs for ${formatDate(selectedDate)}`
                : 'Browse intelligence feeds date-wise and category-wise.'}
            </p>
          </div>
          <div className={styles.headerFilters}>
            <div className={styles.filterGroup}>
              <label>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) setSelectedMonth("");
                }}
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  if (e.target.value) setSelectedDate("");
                }}
              >
                <option value="">All</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label>Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <a className={styles.exportBtn} href={exportHref} target="_blank" rel="noreferrer">
           <span>📥</span> Export Intel
        </a>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Current Affairs Category</div>
          <button
            className={`${styles.sideItem} ${selectedCategory === "all" ? styles.sideActive : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            <span className={styles.sideIcon}>🌐</span>
            <span className={styles.sideText}>All Intelligence</span>
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`${styles.sideItem} ${selectedCategory === c ? styles.sideActive : ""}`}
              onClick={() => setSelectedCategory(c)}
            >
              <span className={styles.sideIcon}>{getCategoryIcon(c)}</span>
              <span className={styles.sideText}>{c}</span>
            </button>
          ))}
        </aside>

        <section className={styles.content}>
          {loading ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonImage} />
                  <div className={styles.skeletonBody}>
                    <div className={styles.skeletonTitle} />
                    <div className={styles.skeletonMeta} />
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLineShort} />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>No current affairs found.</div>
          ) : (
            <>
              {/* Show Today's Current Affairs indicator */}
              {selectedDate && selectedDate === getTodayDateString() && (
                <div className={styles.todayIndicator}>
                  <span className={styles.todayBadge}>📡 Live Intelligence Stream</span>
                  <span className={styles.todayDate}>{formatDate(selectedDate)}</span>
                </div>
              )}
              
              <div className={styles.list}>
                {items.map((it) => (
                  <article key={it.id} className={styles.card}>
                    <div className={styles.imageWrap}>
                      {it.image ? (
                        <img src={it.image} alt={it.heading} className={styles.image} />
                      ) : (
                        <div className={styles.imageFallback}>
                          <span className={styles.fallbackIcon}>{getCategoryIcon(it.category)}</span>
                        </div>
                      )}
                      <button
                        className={styles.favOverlay}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFav(it.id);
                        }}
                        title="Favourite"
                      >
                        {favIds.has(it.id) ? "❤️" : "🤍"}
                      </button>
                      {readItems.has(it.id) && (
                        <div className={styles.readOverlay} title="Read">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className={styles.body}>
                      <h3 className={styles.heading}>{it.heading}</h3>
                      <div className={styles.meta}>
                        <span>{formatDate(it.date)}</span>
                        {it.category ? <span className={styles.dot}>•</span> : null}
                        {it.category ? (
                          <span className={styles.chip} style={chipStyle(it.category)}>
                            {it.category}
                          </span>
                        ) : null}
                      </div>
                      <p className={styles.desc}>{it.description}</p>
                      <div className={styles.actionsRow}>
                        <button className={styles.readMoreBtn} onClick={() => handleReadMore(it)}>
                          <span>VIEW BRIEF</span>
                          {status !== "authenticated" && (
                            <span className={styles.freeReadIndicator}>
                              {freeReadsUsed < maxFreeReads 
                                ? `(${maxFreeReads - freeReadsUsed} free left)` 
                                : "(Tactical Lock)"
                              }
                            </span>
                          )}
                          <span className={styles.btnArrow}>→</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {!loading && totalPages > 1 && (
            <div className={styles.pagination}>
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ‹
              </button>
              {pagination.map((n) => (
                <button
                  key={n}
                  className={n === page ? styles.pageActive : ""}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                ›
              </button>
            </div>
          )}
        </section>
      </div>

      {reading && (
        <div className={styles.modalOverlay} onClick={() => setReading(null)}>
          <div className={`${styles.modal} glass-card`} onClick={(e) => e.stopPropagation()}>
            {/* Mobile Navigation - Top */}
            <div className={styles.mobileModalNavigation}>
              <button 
                className={styles.navButton}
                onClick={navigateToPrevious}
                disabled={items.findIndex(item => item.id === reading?.id) === 0}
              >
                ← Previous
              </button>
              
              <div className={styles.navInfo}>
                <span>{items.findIndex(item => item.id === reading?.id) + 1} / {items.length}</span>
              </div>
              
              <button 
                className={styles.navButton}
                onClick={navigateToNext}
                disabled={items.findIndex(item => item.id === reading?.id) === items.length - 1}
              >
                Next →
              </button>
            </div>

            {/* Top Row */}
            <div className={styles.modalTopRow}>
              <div className={styles.modalDateTime}>
                <span className={styles.day}>
                  {new Date(reading.date).toLocaleDateString('en-US', { weekday: 'long' })}
                </span>
                <span className={styles.date}>
                  {formatDate(reading.date)}
                </span>
                <span className={styles.time}>
                  {new Date(reading.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div className={styles.modalMetaWithActions}>
                <div className={styles.modalMetaLeft}>
                  <span className={styles.postedBy}>Posted by: Admin</span>
                  <span className={styles.metaSeparator}>•</span>
                  {reading.category && (
                    <>
                      <span className={styles.chip} style={chipStyle(reading.category)}>
                        {reading.category}
                      </span>
                      <span className={styles.metaSeparator}>•</span>
                    </>
                  )}
                  {readItems.has(reading.id) && (
                    <>
                      <span className={styles.readIndicator}>✓ Read</span>
                      <span className={styles.metaSeparator}>•</span>
                    </>
                  )}
                  {status !== "authenticated" && freeReadsUsed < maxFreeReads && (
                    <span className={styles.freeReadsBadge}>
                      {maxFreeReads - freeReadsUsed} free left
                    </span>
                  )}
                </div>
                <div className={styles.modalActions}>
                  <button className={styles.actionButton} onClick={() => handleShare(reading)} title="Share">
                    📤
                  </button>
                  <button className={styles.actionButton} onClick={() => toggleFav(reading.id)} title="Favourite">
                    {favIds.has(reading.id) ? "❤️" : "🤍"}
                  </button>
                  <button className={styles.actionButton} onClick={() => setReading(null)} title="Close">
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className={styles.modalContent}>
              <div className={styles.modalImageContainer}>
                {reading.image ? (
                  <img src={reading.image} alt={reading.heading} className={styles.modalImage} />
                ) : (
                  <div className={styles.modalImageFallback}>
                    <span>🗞️</span>
                  </div>
                )}
              </div>
              
              <div className={styles.modalTextContainer}>
                <h2 className={styles.modalTitle}>{reading.heading}</h2>
                <div className={styles.modalDesc}>
                  {reading.description.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Navigation - Bottom */}
            <div className={styles.modalNavigation}>
              <button 
                className={styles.navButton}
                onClick={navigateToPrevious}
                disabled={items.findIndex(item => item.id === reading?.id) === 0}
              >
                ← Previous
              </button>
              
              <div className={styles.navInfo}>
                <span>{items.findIndex(item => item.id === reading?.id) + 1} / {items.length}</span>
              </div>
              
              <button 
                className={styles.navButton}
                onClick={navigateToNext}
                disabled={items.findIndex(item => item.id === reading?.id) === items.length - 1}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {loginPrompt && (
        <div className={styles.loginPromptOverlay} onClick={() => setLoginPrompt(false)}>
          <div className={`${styles.loginPrompt} glass-card`} onClick={(e) => e.stopPropagation()}>
            <p className={styles.loginPromptText}>
              {freeReadsUsed >= maxFreeReads 
                ? `You've used your ${maxFreeReads} free reads! Sign in to read unlimited current affairs and unlock all features.`
                : "Sign in to save favourites and get unlimited access to current affairs."
              }
            </p>
            <div className={styles.loginPromptBtns}>
              <button className="btn-primary" onClick={() => router.push("/signin")}>
                Sign In
              </button>
              <button className="btn-secondary" onClick={() => setLoginPrompt(false)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
