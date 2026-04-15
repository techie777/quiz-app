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
  const [globalLang, setGlobalLang] = useState("EN");
  const [readMode, setReadMode] = useState("image"); // image, text
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  // Wall state
  const [facts, setFacts] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingFacts, setLoadingFacts] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCats, setSelectedCats] = useState([]);

  // Initialization
  useEffect(() => {
    const savedLang = localStorage.getItem("factLang") || "EN";
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
    if (activeTab === tab && tab === 'random') {
       setPage(1); setFacts([]); setHasMore(true);
       fetchFacts(1, true);
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
      let url = `/api/fun-facts/list?page=${pageNum}&limit=12&tab=${activeTab}`;
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
  }, [activeTab, selectedCats, searchQuery, page]);

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
        <div className={styles.header}>
          <h1 className={styles.title}>
            <Sparkles className={styles.sparkleIcon} /> Factify
          </h1>
          <p className={styles.description}>
            Expand your mind with bite-sized, mind-blowing facts across diverse categories.
          </p>
        </div>

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
            {facts.map((fact, index) => {
              const isLast = facts.length === index + 1;
              const displayText = globalLang === "HI" && fact.descriptionHi ? fact.descriptionHi : fact.description;
              const hasImg = fact.image && readMode === "image";
              return (
                <Link href={`/fun-facts/read/${fact.id}`} key={fact.id + index}>
                  <div 
                    ref={isLast ? lastFactElementRef : null} 
                    className={`${styles.wallFactCard} hover:-translate-y-1 transition-transform cursor-pointer relative`}
                  >
                    {hasImg && fact.image.startsWith('/uploads') ? (
                        <div className="relative w-full h-full min-h-[300px]">
                           <img src={fact.image} alt="Fun Fact" className="absolute inset-0 w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                              <span className="text-sm font-bold uppercase text-amber-400">• {fact.category?.name}</span>
                           </div>
                        </div>
                    ) : (
                        <div 
                          className={styles.wallFactText}
                          style={hasImg ? { 
                            backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.6) 100%), url('${fact.image}')`, 
                            backgroundSize: 'cover', 
                            backgroundPosition: 'center', 
                            color: 'white', 
                            minHeight: '350px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'flex-end', 
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)' 
                          } : {
                            background: '#f8fafc',
                            minHeight: '200px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            color: '#1e293b'
                          }}
                        >
                          <div className={`font-bold ${hasImg ? 'text-lg md:text-xl' : 'text-lg'}`}>
                            {highlightFactText(displayText, hasImg ? true : false)}
                          </div>
                          <div className={`mt-6 text-xs font-bold uppercase flex items-center justify-between gap-2 ${hasImg ? 'text-amber-400' : 'text-indigo-500'}`}>
                             <div className="flex items-center gap-1"><span>•</span> {fact.category?.name}</div>
                             <div className="flex gap-3 mt-2 text-gray-400 text-[10px]">
                               <span>{(fact._count?.likes || 0) + (fact.hasLiked ? 1 : 0)} ❤️</span>
                               <span>{fact._count?.comments || 0} 💬</span>
                             </div>
                          </div>
                        </div>
                    )}
                  </div>
                </Link>
              );
            })}
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
           {/* Hub view removed to enforce unified social wall approach as requested. */}
      </div>
    </div>
  );
}
