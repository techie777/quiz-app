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
  const [showPdfPreview, setShowPdfPreview] = useState(false);

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
      canvas.width = 1080;
      canvas.height = 1080;
      
      // Create premium gradient background (like the card)
      const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grd.addColorStop(0, '#f0f9ff'); // soft light blue
      grd.addColorStop(1, '#e0f2fe'); // deeper light blue
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top banner with Hindi/English title
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, canvas.width, 160);
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(canvas.width - 200, 50, 160, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Outfit", sans-serif';
      ctx.fillText(isHindi ? "दैनिक" : "Daily", canvas.width - 170, 80);
      ctx.fillText(isHindi ? "जानकारी" : "Briefing", canvas.width - 170, 100);

      // Draw Main White Card Content Box
      ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 20;
      
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 80, 220, canvas.width - 160, canvas.height - 380, 30);
      ctx.fill();
      
      // Top blue border on the card
      const accentGrd = ctx.createLinearGradient(80, 220, canvas.width - 80, 220);
      accentGrd.addColorStop(0, '#38bdf8');
      accentGrd.addColorStop(1, '#3b82f6');
      ctx.fillStyle = accentGrd;
      roundRect(ctx, 80, 220, canvas.width - 160, 16, 30);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(80, 236, canvas.width - 160, 20); // Cover bottom curve of the top border

      // Reset shadow for text
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw Date Pill
      ctx.fillStyle = '#e0f2fe'; // var(--bg-secondary)
      roundRect(ctx, 140, 280, 240, 50, 12);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px "Outfit", sans-serif';
      ctx.fillText(`📅 ${formatDate(item.date)}`, 160, 314);
      
      // Draw Category Pill (next to Date)
      ctx.fillStyle = '#e0f2fe';
      roundRect(ctx, 400, 280, 300, 50, 12);
      ctx.fill();
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 22px "Outfit", sans-serif';
      ctx.fillText(`${getCategoryIcon(item.category)} ${item.category.toUpperCase()}`, 420, 314);

      // Draw Quote mark
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.font = 'bold 160px "Georgia", serif';
      ctx.fillText('“', 140, 420);

      // Draw Heading
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 44px "Outfit", sans-serif';
      const headingText = isHindi && item.headingHi ? item.headingHi : item.heading;
      const headingLines = wrapText(ctx, headingText, canvas.width - 280);
      let yPos = 460;
      headingLines.slice(0, 3).forEach(line => {
        ctx.fillText(line, 140, yPos);
        yPos += 60;
      });

      // Draw Description
      ctx.fillStyle = '#475569';
      ctx.font = '28px "Inter", sans-serif';
      const descText = isHindi && item.descriptionHi ? item.descriptionHi : item.description;
      const descLines = wrapText(ctx, descText.substring(0, 300) + '...', canvas.width - 280);
      yPos += 30;
      descLines.slice(0, 5).forEach(line => {
        ctx.fillText(line, 140, yPos);
        yPos += 45;
      });

      // Bottom info section (Footer)
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 80, canvas.height - 140, canvas.width - 160, 100, 20);
      ctx.fill();
      
      // Website info text
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 28px "Outfit", sans-serif';
      ctx.fillText(isHindi ? 'क्विज़वेब पर अधिक दैनिक समसामयिकी पढ़ें' : 'Read more Daily Current Affairs on QuizWeb', 120, canvas.height - 90);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '20px "Inter", sans-serif';
      ctx.fillText(isHindi ? 'नवीनतम राष्ट्रीय और अंतर्राष्ट्रीय विकास के साथ अपडेट रहें।' : 'Stay updated with the latest national and international developments.', 120, canvas.height - 60);
      
      // Website URL link
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 24px "Outfit", sans-serif';
      ctx.fillText(`🌐 ${window.location.host}`, canvas.width - 340, canvas.height - 75);
      
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

  const WallCurrentAffairCard = ({ item, isRead, isFav, toggleFav, handleReadMore, handleShare, isPro, caCount, maxFree, isHindi }) => {
    const displayHeading = isHindi && item.headingHi ? item.headingHi : item.heading;
    const displayDesc = isHindi && item.descriptionHi ? item.descriptionHi : item.description;

    return (
      <motion.div 
        variants={itemVariants}
        className={styles.wallCard}
        layout
      >
        <div className={styles.wallCardContent} style={item.image ? { backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 100%), url('${item.image}')` } : {}} onClick={() => handleReadMore(item)}>
           <div className={styles.actionBadge}>
             <button onClick={(e) => { e.stopPropagation(); toggleFav(item.id); }} className={styles.badgeBtn} title="Favourite">{isFav ? "❤️" : "🤍"}</button>
             <button onClick={(e) => { e.stopPropagation(); handleShare(item); }} className={styles.badgeBtn} title="Share" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
             </button>
           </div>
           
           <div className={styles.quoteWrapper}>
             <span className={styles.quoteMark}>“</span>
             <h3 className={styles.bigCardText}>{displayHeading}</h3>
             <div className={styles.cardDatePill}>
               <span className={styles.calendarIcon}>📅</span> {formatDate(item.date)}
             </div>
           </div>
           
           <p className={styles.cardSummary}>{displayDesc}</p>

           {item.oneLiner && (
             <div style={{ padding: '8px 12px', background: 'var(--accent-light)', borderLeft: '3px solid var(--accent)', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--accent-dark)', fontWeight: '500' }}>
               <strong>💡 One-Liner:</strong> {item.oneLiner}
             </div>
           )}
           
           <div className={styles.cardFooter}>
             <span className={styles.cardCategory}>{getCategoryIcon(item.category)} {item.category}</span>
             <div className="flex gap-2 items-center">
                {isRead && <span className="text-[10px] bg-emerald-500/80 text-white px-2 py-0.5 rounded-full font-bold">READ</span>}
                <button 
                  className={styles.playQuizBtnSmall}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    router.push(`/daily/daily-current-affairs?date=${item.date}`);
                  }}
                >
                  ▶ Play Quiz
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
                      <span className={styles.dateHeaderText}>Current affairs / One liner / MCQ + Play Quiz</span>
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
                          isHindi={isHindi}
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

        {/* Right Sidebar for Archives */}
        <aside className={styles.rightSidebar}>
          <div className={styles.sidebarTitle}>{isHindi ? "पुराने अपडेट्स (Archives)" : "Archives"}</div>
          
          <button
            className={`${styles.sideItem} ${!selectedMonth && selectedDate === getTodayDateString() ? styles.sideActive : ""}`}
            onClick={() => {
              setSelectedMonth("");
              setSelectedDate(getTodayDateString());
            }}
          >
            <span className={styles.sideIcon}>📅</span>
            <span className={styles.sideText}>{isHindi ? "आज के अपडेट्स" : "Today's Updates"}</span>
          </button>

          <div style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }} className={styles.sidebarTitle}>
            {isHindi ? "महीने के अनुसार" : "Month-Wise"}
          </div>

          {months.length > 0 ? months.map((m) => {
            const [y, mo] = m.split("-");
            const dateObj = new Date(Number(y), Number(mo) - 1, 1);
            const label = dateObj.toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', { month: 'long', year: 'numeric' });
            
            return (
              <button
                key={m}
                className={`${styles.sideItem} ${selectedMonth === m ? styles.sideActive : ""}`}
                onClick={() => {
                  setSelectedDate("");
                  setSelectedMonth(m);
                }}
              >
                <span className={styles.sideIcon}>📁</span>
                <span className={styles.sideText}>{label}</span>
              </button>
            );
          }) : (
            <div className={styles.empty} style={{ fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
              {isHindi ? "कोई पुराना डेटा नहीं" : "No archives found"}
            </div>
          )}

          {/* Monthly Archive Section / PDF Generation */}
          <div className={styles.monthlyArchive}>
            <div className={styles.monthlyArchiveTitle}>
              <span>📊</span>
              <span>{isHindi ? "मंथली इनसाइट्स" : "Monthly Insights"}</span>
            </div>
            
            <div className={styles.progressIndicator}>
              <div className={styles.progressLabel}>
                <span>{isHindi ? "डेटा संग्रहण" : "Data Accumulation"}</span>
                <span>{Math.round((items.length / 100) * 100)}%</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${Math.min((items.length / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <button 
              className={styles.generatePdfBtn}
              onClick={() => setShowPdfPreview(true)}
            >
              <span>📄</span>
              <span>{isHindi ? "PDF रिपोर्ट जनरेट करें" : "Generate PDF Report"}</span>
            </button>
          </div>
        </aside>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                {t('ca.prev')}
              </button>
              
              <div className={styles.navInfo}>
                <span>{items.findIndex(item => item.id === reading?.id) + 1} / {items.length}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className={styles.navButton}
                  onClick={navigateToNext}
                  disabled={items.findIndex(item => item.id === reading?.id) === items.length - 1}
                >
                  {t('ca.next')}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
                <button className={styles.navCloseBtn} onClick={() => setReading(null)} title="Close">
                  ✕
                </button>
              </div>
            </div>

            {/* Desktop Absolute Close Button */}
            <button className={`${styles.absoluteCloseBtn} ${styles.desktopOnly}`} onClick={() => setReading(null)} title="Close">
              ✕
            </button>

            {/* Top Row: Compact Date */}
            <div className={styles.modalHeaderCompact}>
              <div className={styles.compactDate}>
                <span className={styles.compactDateIcon}>📅</span>
                {formatDate(reading.date)}
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Previous
              </button>
              
              <div className={styles.navInfo}>
                <span>{items.findIndex(item => item.id === reading?.id) + 1} / {items.length}</span>
              </div>
              
              <button 
                className={styles.navButton}
                onClick={navigateToNext}
                disabled={items.findIndex(item => item.id === reading?.id) === items.length - 1}
              >
                Next
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
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

      {/* PDF Preview Mockup */}
      {showPdfPreview && (
        <div className={styles.pdfPreviewWrapper}>
          <div className={styles.pdfPreview}>
            <button 
              className={styles.pdfPreviewClose}
              onClick={() => setShowPdfPreview(false)}
            >
              ✕
            </button>
            
            <div className={styles.pdfPreviewHeader}>
              <div className={styles.pdfPreviewIcon}>📄</div>
              <div className={styles.pdfPreviewTitle}>Monthly Report Preview</div>
            </div>
            
            <div className={styles.pdfPreviewContent}>
              <div className={styles.pdfPreviewSection}>
                <div className={styles.pdfPreviewSectionTitle}>Daily News</div>
                <div className={styles.pdfPreviewSectionText}>
                  Curated headlines and summaries from {formatDate(selectedDate || getTodayDateString())}
                </div>
              </div>
              
              <div className={styles.pdfPreviewSection}>
                <div className={styles.pdfPreviewSectionTitle}>Quick One-Liners</div>
                <div className={styles.pdfPreviewSectionText}>
                  Bite-sized facts for rapid revision and memorization
                </div>
              </div>
              
              <div className={styles.pdfPreviewSection}>
                <div className={styles.pdfPreviewSectionTitle}>MCQ Practice</div>
                <div className={styles.pdfPreviewSectionText}>
                  Interactive quiz questions to test your knowledge
                </div>
              </div>
            </div>
            
            <a 
              href={exportHref} 
              target="_blank" 
              rel="noreferrer"
              className={styles.generatePdfBtn}
              style={{ marginTop: '1rem' }}
            >
              <span>⬇️</span>
              <span>Download Full PDF</span>
            </a>
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
