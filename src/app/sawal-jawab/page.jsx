"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Sparkles, HelpCircle } from 'lucide-react';
import SawalJawabCard from '@/components/SawalJawabCard';
import styles from '@/styles/SawalJawab.module.css';

const LanguageToggle = ({ lang, onChange }) => (
  <div 
    className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700 cursor-pointer w-24 relative overflow-hidden"
    onClick={() => onChange(lang === 'EN' ? 'HI' : 'EN')}
  >
    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-blue-600 rounded-lg transition-all duration-300 ${lang === 'HI' ? 'translate-x-full' : 'translate-x-0'}`}></div>
    <div className={`flex-1 text-center text-[10px] font-black z-10 ${lang === 'EN' ? 'text-white' : 'text-slate-400'}`}>EN</div>
    <div className={`flex-1 text-center text-[10px] font-black z-10 ${lang === 'HI' ? 'text-white' : 'text-slate-400'}`}>HI</div>
  </div>
);

export default function SawalJawabPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lang, setLang] = useState('HI');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Fetch Categories
  useEffect(() => {
    fetch('/api/sawal-jawab/categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(err => console.error(err));
  }, []);

  const fetchItems = async (pageNum, catId, reset = false) => {
    if (loadingMore || (!hasMore && !reset)) return;
    setLoadingMore(true);
    
    try {
      const res = await fetch(`/api/sawal-jawab/list?page=${pageNum}&categoryId=${catId}&limit=12`);
      const data = await res.json();
      
      if (res.ok) {
        setItems(prev => reset ? data.items : [...prev, ...data.items]);
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    fetchItems(1, selectedCategory, true);
  }, [selectedCategory]);

  const observer = useRef();
  const lastElementRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const next = prev + 1;
          fetchItems(next, selectedCategory);
          return next;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, selectedCategory]);

  return (
    <div className={styles.page} suppressHydrationWarning>
      <div className={styles.container}>
        {!hasMounted ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500 font-bold">Unlocking Mysteries...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-white dark:bg-slate-900/40 p-4 rounded-3xl border border-black/5 dark:border-white/5 backdrop-blur-xl">
               <div className={styles.categoryFilterScroll}>
                  <div 
                    className={`${styles.filterChip} ${selectedCategory === 'all' ? styles.filterChipActive : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    All Mysteries
                  </div>
                  {categories.map(cat => (
                    <div 
                      key={cat.id}
                      className={`${styles.filterChip} ${selectedCategory === cat.id ? styles.filterChipActive : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {lang === 'HI' && cat.nameHi ? cat.nameHi : cat.name}
                    </div>
                  ))}
               </div>
               <div className="flex items-center gap-4">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:block">Global Lang:</span>
                 <LanguageToggle lang={lang} onChange={setLang} />
               </div>
            </div>

            {loading && items.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="h-64 rounded-3xl bg-slate-800/50 animate-pulse border border-white/5"></div>
                ))}
              </div>
            ) : (
              <>
                <div className={styles.wallGrid}>
                  {items.map((item, idx) => (
                    <div key={item.id + idx} ref={items.length === idx + 1 ? lastElementRef : null}>
                      <SawalJawabCard item={item} lang={lang} />
                    </div>
                  ))}
                </div>

                {items.length === 0 && !loading && (
                  <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-white/10">
                    <HelpCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">No tricky questions found in this category yet.</p>
                  </div>
                )}
              </>
            )}

            {loadingMore && (
              <div className="flex justify-center py-12">
                 <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <div className="text-center py-10 mt-10 border-t border-white/5">
                 <span className="bg-slate-800/50 px-6 py-2 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                   The End of Mystery
                 </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
