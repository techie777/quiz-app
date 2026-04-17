"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Rocket, LayoutGrid, List } from "lucide-react";
import { highlightFactText } from "@/lib/textUtils";
import styles from "@/styles/FunFacts.module.css";

export default function FunFactsHub() {
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  
  // Navigation & Preferences
  const [activeTab, setActiveTab] = useState("all"); // all, trending, daily, favorites
  const [globalLang, setGlobalLang] = useState("HI");
  const [readMode, setReadMode] = useState("image"); // image, text
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  // Wall state
  const [facts, setFacts] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingFacts, setLoadingFacts] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCats, setSelectedCats] = useState([]);
  const [requestSeed, setRequestSeed] = useState(Date.now().toString());

  const refreshSeed = () => {
    setRequestSeed(Date.now().toString());
    setPage(1); setFacts([]); setHasMore(true);
  };

  // Initialization
  useEffect(() => {
    const savedLang = localStorage.getItem("factLang") || "HI";
    const savedMode = localStorage.getItem("factReadMode") || "image";
    setGlobalLang(savedLang);
    setReadMode(savedMode);
    
    fetch("/api/fun-facts/categories")
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || []);
        setLoadingCats(false);
      });
  }, []);

  // Update URL preferences
  const updatePref = (key, val, setter) => {
    setter(val);
    localStorage.setItem(key, val);
  };

  const toggleCategory = (catId) => {
    setSelectedCats(prev => {
      let next = prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId];
      setPage(1); setFacts([]); setHasMore(true);
      return next;
    });
  };

  const handleTabSwitch = (tab) => {
    if (activeTab === tab) {
       refreshSeed();
    } else {
       setActiveTab(tab);
       setPage(1); setFacts([]); setHasMore(true);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1); setFacts([]); setHasMore(true);
  };

  const fetchFacts = async (pageNum, reset = false) => {
    if (loadingFacts || (!hasMore && !reset)) return;
    setLoadingFacts(true);
    
    try {
      let url = `/api/fun-facts/list?page=${pageNum}&limit=12&tab=${activeTab}&seed=${requestSeed}`;
      if (selectedCats.length > 0) url += `&categories=${selectedCats.join(",")}`;
      if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        setFacts(prev => reset ? data.facts : [...prev, ...data.facts]);
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }
    } catch (err) { console.error(err); }
    
    setLoadingFacts(false);
  };

  // Trigger fetch on dependencies change
  useEffect(() => {
    fetchFacts(page, page === 1);
  }, [activeTab, selectedCats, searchQuery, page, requestSeed]);

  const observer = useRef();
  const lastFactElementRef = useCallback(node => {
    if (loadingFacts) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setPage(prev => prev + 1);
    });
    if (node) observer.current.observe(node);
  }, [loadingFacts, hasMore]);


  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero section removed as per request */}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
          <div className="flex gap-2 p-1 bg-indigo-50/50 border border-indigo-100 rounded-xl overflow-x-auto w-full md:w-auto">
            {["all", "random", "trending", "daily", "favorites"].map(tab => (
              <button 
                key={tab}
                onClick={() => handleTabSwitch(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize whitespace-nowrap transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-600 hover:bg-indigo-100'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex-grow">
              <input 
                type="text" 
                placeholder="Search facts..." 
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full px-4 py-2 border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 text-sm focus:ring-2 focus:ring-indigo-200 transition-all"
              />
            </form>
            <div className="flex gap-1 p-1 bg-indigo-50 border border-indigo-100 rounded-xl shadow-inner">
              <button onClick={() => updatePref('factLang', 'EN', setGlobalLang)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${globalLang === 'EN' ? 'bg-white text-indigo-700 shadow flex items-center justify-center' : 'text-slate-500'}`}>EN</button>
              <button onClick={() => updatePref('factLang', 'HI', setGlobalLang)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${globalLang === 'HI' ? 'bg-white text-indigo-700 shadow flex items-center justify-center' : 'text-slate-500'}`}>HI</button>
            </div>
            <div className="flex gap-1 p-1 bg-indigo-50 border border-indigo-100 rounded-xl shadow-inner hidden md:flex">
                <button onClick={() => updatePref('factReadMode', 'image', setReadMode)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${readMode === 'image' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`}>Image</button>
                <button onClick={() => updatePref('factReadMode', 'text', setReadMode)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${readMode === 'text' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`}>Text</button>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.categoryFilterScroll}>
            <div 
              onClick={() => { setSelectedCats([]); setPage(1); setFacts([]); setHasMore(true); }}
              className={`${styles.filterChip} ${selectedCats.length === 0 ? styles.filterChipActive : ''}`}
            >
              All Categories
            </div>
            {categories.map(cat => (
              <div 
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`${styles.filterChip} ${selectedCats.includes(cat.id) ? styles.filterChipActive : ''}`}
              >
                {cat.name}
              </div>
            ))}
          </div>

          <div className={styles.wallGrid}>
            {facts.map((fact, index) => (
              <WallFactCard 
                key={fact.id + index}
                fact={fact}
                index={index}
                isLast={facts.length === index + 1}
                lastFactElementRef={lastFactElementRef}
                globalLang={globalLang}
                readMode={readMode}
                highlightFactText={highlightFactText}
              />
            ))}
          </div>

             {loadingFacts && (
               <div className="flex justify-center mt-8">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
               </div>
             )}
             
             {!loadingFacts && facts.length === 0 && (
               <div className="text-center py-12 text-slate-500 font-medium">
                 No facts found for the selected categories.
               </div>
             )}
        </div>
      </div>
    </div>
  );
}

function WallFactCard({ fact, index, isLast, lastFactElementRef, globalLang, readMode, highlightFactText }) {
  const [isHidden, setIsHidden] = useState(false);
  const [localLang, setLocalLang] = useState(globalLang);
  
  // Sync with global choice but allow local override
  useEffect(() => {
    setLocalLang(globalLang);
  }, [globalLang]);

  const displayText = localLang === "HI" && fact.descriptionHi ? fact.descriptionHi : fact.description;
  const effectiveImg = fact.image || fact.category?.image;
  const hasImg = effectiveImg && readMode === "image";

  return (
    <div className="relative group">
       <Link href={`/fun-facts/read/${fact.id}`}>
          <div 
            ref={isLast ? lastFactElementRef : null} 
            className={`${styles.wallFactCard} hover:-translate-y-1 transition-all cursor-pointer relative border border-white/10 overflow-hidden ring-1 ring-white/5`}
            style={{ borderRadius: '1.5rem' }}
          >
            <div 
              className={styles.wallFactText}
              style={hasImg ? { 
                backgroundImage: isHidden ? `url('${effectiveImg}')` : `linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.2) 100%), url('${effectiveImg}')`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center', 
                color: 'white', 
                minHeight: '350px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'flex-end', 
                textShadow: isHidden ? 'none' : '0 1px 1px #000, 0 4px 12px rgba(0,0,0,0.8)'
              } : {
                background: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#f8fafc'
              }}
            >
              <div className={`${styles.quoteWrapper} transition-all duration-500 ${isHidden ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <span className={styles.quoteMark}>“</span>
                <div className={`${styles.bigFactText} ${hasImg ? 'text-lg md:text-xl' : ''}`}>
                  {highlightFactText(displayText, hasImg ? true : false)}
                </div>
                <span className={styles.quoteMarkEnd}>”</span>
              </div>
              
              <div className={`mt-6 text-xs font-bold uppercase flex items-center justify-between gap-2 transition-opacity duration-500 ${hasImg ? 'text-amber-400' : 'text-indigo-500'} ${isHidden ? 'opacity-0' : 'opacity-100'}`}>
                 <div className="flex items-center gap-1"><span>•</span> {fact.category?.name}</div>
                 <div className={styles.factStats + (hasImg ? ' text-white' : '')}>
                   <span className={styles.statItem}>
                     <span className={styles.statEmoji}>❤️</span>
                     {(fact._count?.likes || 0) + (fact.hasLiked ? 1 : 0)}
                   </span>
                   <span className={styles.statItem}>
                     <span className={styles.statEmoji}>💬</span>
                     {fact._count?.comments || 0}
                   </span>
                 </div>
              </div>
            </div>
          </div>
       </Link>

       {/* Top Right Action Group */}
       {hasImg && (
         <div className="absolute top-4 right-4 z-20 flex gap-2">
           {/* Language Toggle */}
           <button 
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               setLocalLang(localLang === "HI" ? "EN" : "HI");
             }}
             className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-[10px] font-black text-white px-2.5 py-1.5 rounded-lg transition-all border border-white/10 shadow-lg tracking-widest"
             title="Toggle Local Language"
           >
             {localLang === "HI" ? "HI" : "EN"}
           </button>

           {/* Eye Toggle */}
           <button 
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               setIsHidden(!isHidden);
             }}
             className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white/80 hover:text-white p-2 rounded-full transition-all border border-white/10 shadow-lg"
             title={isHidden ? "Show Text" : "Hide Text"}
           >
             {isHidden ? (
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88 1.39 1.39"/><path d="M2 12s3-7 10-7a6.38 6.38 0 0 1 5.35 2.81"/><path d="M10.46 10.46a2.19 2.19 0 0 0 3.08 3.08"/><path d="M22 12s-3 7-10 7a6.83 6.83 0 0 1-5.65-3.04"/><path d="m22.61 22.61-8.72-8.72"/></svg>
             )}
           </button>
         </div>
       )}
    </div>
  );
}
