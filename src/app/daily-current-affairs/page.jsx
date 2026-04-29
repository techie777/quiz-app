"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMonetization } from "@/context/MonetizationContext";
import { motion, AnimatePresence } from "framer-motion";
import AdGate from "@/components/monetization/AdGate";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/styles/CurrentAffairs.module.css";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

// ... existing formatDate, etc ...

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

function adjustDate(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
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
  const { t, isHindi } = useLanguage();
  const { isPro, useCounts, incrementCount } = useMonetization();
  const [readItems, setReadItems] = useState(new Set()); 
  const [showAdGate, setShowAdGate] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [reading, setReading] = useState(null);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const maxFreeReads = 2; 

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // Initialize empty for hydration safety
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  // Group items by date uniquely
  const groupedItems = useMemo(() => {
    const groups = {};
    // Double-layered uniqueness check: ID + (Heading + Date)
    const seenIds = new Set();
    const seenBriefings = new Set();
    
    items.forEach(item => {
      const briefingKey = `${item.date}-${item.heading}`;
      if (seenIds.has(item.id) || seenBriefings.has(briefingKey)) return;
      
      seenIds.add(item.id);
      seenBriefings.add(briefingKey);
      
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
    });
    return groups;
  }, [items]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => b.localeCompare(a));
  }, [groupedItems]);

  // Load items
  const loadItems = async (pageNum, reset = false) => {
    if (pageNum > 1 && !hasMore) return;
    
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(pageNum));
    params.set("pageSize", String(pageSize));
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    
    const activeDate = selectedDate || getTodayDateString();

    if (selectedDate) {
      params.set("date", selectedDate);
      if (pageNum === 1) params.set("fallback", "true");
    } else if (selectedMonth) {
      params.set("month", selectedMonth);
    }

    try {
      const res = await fetch(`/api/current-affairs?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      
      const newItems = Array.isArray(data.items) ? data.items : [];
      
      if (reset) {
        setItems(newItems);
      } else {
        setItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const filteredNew = newItems.filter(i => !existingIds.has(i.id));
          return [...prev, ...filteredNew];
        });
      }

      setHasMore(newItems.length === pageSize);
      setTotal(Number(data.total || 0));
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setMonths(Array.isArray(data.months) ? data.months : []);

      if (data.date && data.date !== selectedDate && pageNum === 1 && selectedDate) {
        setSelectedDate(data.date);
      }
    } catch (err) {
      console.error("Load Items Error:", err);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Set initial state on client to avoid hydration mismatch
  useEffect(() => {
    setHasMounted(true);
    if (!selectedDate) {
      setSelectedDate(getTodayDateString());
    }
  }, []);

  // Initial load or filter change
  useEffect(() => {
    if (!hasMounted || selectedDate === "") return;
    setPage(1);
    loadItems(1, true);
  }, [selectedCategory, selectedDate, selectedMonth, hasMounted]);

  // Infinite Scroll Trigger
  useEffect(() => {
    if (loading || !hasMore || (page === 1 && isInitialLoad)) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          setPage(prev => {
            const nextPage = prev + 1;
            loadItems(nextPage);
            return nextPage;
          });
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '400px' 
      }
    );

    const target = document.getElementById('load-more-trigger');
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [loading, hasMore, isInitialLoad, page]);

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
    // Pro users or already read items can be accessed unconditionally
    if (isPro || readItems.has(item.id)) {
      setReading(item);
      return;
    }
    
    // Check if free reads are available (Limit 2)
    if (useCounts.ca < maxFreeReads) {
      setReading(item);
      setReadItems(prev => new Set([...prev, item.id]));
      incrementCount("ca");
      return;
    }
    
    // If limit reached, show Ad Gate
    setPendingItem(item);
    setShowAdGate(true);
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
        incrementCount("ca");
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
        incrementCount("ca");
      }
    }
  };

  // Helper function to check if user can read an item
  const canReadItem = (item) => {
    if (isPro) return true;
    if (readItems.has(item.id)) return true;
    return useCounts.ca < maxFreeReads;
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
      
      // Tagline
      ctx.font = '16px Arial';
      ctx.fillText(t('ca.shareTagline'), 40, 75);
      
      // Current affairs badge
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(canvas.width - 200, 20, 160, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(isHindi ? "दैनिक" : 'Daily Current', canvas.width - 180, 45);
      ctx.fillText(isHindi ? "जानकारी" : 'Affairs', canvas.width - 180, 65);
      
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
      ctx.fillText(t('ca.readMore'), 60, 590);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '16px Arial';
      ctx.fillText(t('ca.subtitle'), 60, 615);
      
      // Website URL
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`🌐 ${window.location.host}`, 60, 645);
      
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

  const WallCurrentAffairCard = ({ item, isRead, isFav, toggleFav, handleReadMore, handleShare, isPro, caCount, maxFree }) => {
    const [localLang, setLocalLang] = useState("EN");
    
    const displayHeading = localLang === "HI" && item.headingHi ? item.headingHi : item.heading;
    const displayDesc = localLang === "HI" && item.descriptionHi ? item.descriptionHi : item.description;

    return (
      <motion.div 
        variants={itemVariants}
        className={styles.wallCard}
        layout
      >
        <div className={styles.actionBadge}>
          <button 
             onClick={(e) => { e.stopPropagation(); setLocalLang(localLang === "EN" ? "HI" : "EN"); }} 
             className={styles.badgeBtn}
          >
            {localLang}
          </button>
          <button 
             onClick={(e) => { e.stopPropagation(); toggleFav(item.id); }} 
             className={styles.badgeBtn}
          >
            {isFav ? "❤️" : "🤍"}
          </button>
        </div>

        <div 
          className={`${styles.wallCardContent} ${item.image ? styles.wallCardContentWithImg : ''}`}
          style={item.image ? { backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 100%), url('${item.image}')` } : {}}
          onClick={() => handleReadMore(item)}
        >
           <div className={styles.quoteWrapper}>
             <span className={styles.quoteMark}>“</span>
             <h3 className={styles.bigCardText}>{displayHeading}</h3>
           </div>
           
           <div className={styles.cardFooter}>
             <span className={styles.cardCategory}>{getCategoryIcon(item.category)} {item.category}</span>
             <div className="flex gap-2 items-center">
                {isRead && <span className="text-[10px] bg-emerald-500/80 text-white px-2 py-0.5 rounded-full font-bold">READ</span>}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleShare(item); }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  📤
                </button>
             </div>
           </div>
        </div>
      </motion.div>
    );
  };

  if (!hasMounted) {
    return (
      <main className={styles.page}>
        <div className={styles.header}>
           <h1 className={styles.title}>{hasMounted ? t('ca.title') : 'Intelligence Briefing'}</h1>
           <div className={styles.skeletonTitle} style={{ width: '200px', height: '20px' }}></div>
        </div>
        <div className={styles.skeletonList}>
           <div className={styles.skeletonCard} style={{ height: '400px' }}></div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {/* Date Navigation Ribbon - Now includes Export */}
      <div className={styles.dateRibbon}>
        <button 
           className={styles.ribbonBtn} 
           onClick={() => setSelectedDate(prev => adjustDate(prev || getTodayDateString(), -1))}
           title="Previous Day"
        >
          ←
        </button>
        
        <div className={styles.ribbonCenter}>
           <input 
              type="date" 
              value={selectedDate} 
              max={getTodayDateString()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer"
           />
           <div className={styles.selectedDateText}>
              {formatDate(selectedDate || getTodayDateString())}
           </div>
        </div>

        <button 
           className={styles.ribbonBtn} 
           onClick={() => setSelectedDate(prev => adjustDate(prev || getTodayDateString(), 1))}
           disabled={(selectedDate || getTodayDateString()) >= getTodayDateString()}
           title="Next Day"
        >
          →
        </button>

        <button 
           className={styles.todayBtn}
           onClick={() => setSelectedDate(getTodayDateString())}
        >
          {t('ca.today')}
        </button>

        <a className={styles.exportBtnSmall} href={exportHref} target="_blank" rel="noreferrer" title="Export Intelligence">
           📥
        </a>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>{t('ca.sidebarTitle')}</div>
          <button
            className={`${styles.sideItem} ${selectedCategory === "all" ? styles.sideActive : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            <span className={styles.sideIcon}>🌐</span>
            <span className={styles.sideText}>{t('ca.all')}</span>
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
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard} style={{ height: '320px', borderRadius: '1.5rem' }}>
                  <div className={styles.skeletonBody}>
                    <div className={styles.skeletonTitle} />
                    <div className={styles.skeletonMeta} />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>{t('ca.noResults')}</div>
          ) : (
            <div className={styles.feedContainer}>
              <AnimatePresence mode="popLayout">
                {sortedDates.map(date => (
                  <motion.div 
                    key={date} 
                    className={styles.dateGroup}
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    layout
                  >
                    <div className={styles.dateHeader}>
                      <span className={styles.dateHeaderIcon}>📅</span>
                      <span className={styles.dateHeaderText}>{t('ca.dateHeader').replace('{date}', formatDate(date))}</span>
                      <div className={styles.dateHeaderLine}></div>
                    </div>
                    
                    <motion.div className={styles.wallGrid} layout>
                      {groupedItems[date].map((it) => (
                        <WallCurrentAffairCard 
                          key={it.id} 
                          item={it}
                          isRead={readItems.has(it.id)}
                          isFav={favIds.has(it.id)}
                          toggleFav={toggleFav}
                          handleReadMore={handleReadMore}
                          handleShare={handleShare}
                          isPro={isPro}
                          caCount={useCounts.ca}
                          maxFree={maxFreeReads}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <div id="load-more-trigger" className={styles.loadMoreTrigger}>
                {loading && !isInitialLoad && (
                  <div className={styles.miniLoader}>
                    <div className={styles.briefingSpinner}></div>
                    <span>{t('ca.loading')}</span>
                  </div>
                )}
                {!hasMore && items.length > 0 && (
                  <div className={styles.endOfFeed}>
                    <span>{t('ca.end')}</span>
                  </div>
                )}
              </div>
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
                ← {t('ca.prev')}
              </button>
              
              <div className={styles.navInfo}>
                <span>{items.findIndex(item => item.id === reading?.id) + 1} / {items.length}</span>
              </div>
              
              <button 
                className={styles.navButton}
                onClick={navigateToNext}
                disabled={items.findIndex(item => item.id === reading?.id) === items.length - 1}
              >
                {t('ca.next')} →
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
                  <span className={styles.postedBy}>{t('ca.postedBy')}: Admin</span>
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
                      <span className={styles.readIndicator}>✓ {t('ca.read')}</span>
                      <span className={styles.metaSeparator}>•</span>
                    </>
                  )}
                  {!isPro && useCounts.ca < maxFreeReads && (
                    <span className={styles.freeReadsBadge}>
                      {maxFreeReads - useCounts.ca} free left
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
                Sign in to save favourites and get unlimited access to current affairs.
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

      <AdGate 
        isOpen={showAdGate}
        onClose={() => {
            setShowAdGate(false);
            setPendingItem(null);
        }}
        onComplete={() => {
            setShowAdGate(false);
            if (pendingItem) {
                setReading(pendingItem);
                setReadItems(prev => new Set([...prev, pendingItem.id]));
                incrementCount("ca"); // Increment but let them read after ad
                setPendingItem(null);
            }
        }}
        title={hasMounted ? t('ca.title') : "Intelligence Briefing"}
      />
    </main>
  );
}
