"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Rocket } from "lucide-react";
import styles from "@/styles/FunFacts.module.css";

export default function FunFactsHub() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fun-facts/categories")
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

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

        <Link href="/fun-facts/voyager">
          <div className={styles.voyagerHero}>
            <div className={styles.voyagerBadge}>LIVE STREAM</div>
            <div className={styles.voyagerIconContainer}>
              <Rocket className={styles.voyagerIcon} />
            </div>
            <div className={styles.voyagerInfo}>
              <span className={styles.voyagerLabel}>Universal Explorer</span>
              <h2 className={styles.voyagerTitle}>The Factify Voyager</h2>
              <p className={styles.voyagerSubtitle}>A non-stop stream of mind-blowing facts from all categories.</p>
              
              {!loading && categories.length > 0 && (
                <div className="flex gap-4 mt-5">
                   <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white font-bold text-sm shadow-sm flex items-center gap-2">
                       {categories.reduce((acc, cat) => acc + (cat._count?.facts || 0), 0)} Total Facts
                   </div>
                   <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white font-bold text-sm shadow-sm flex items-center gap-2">
                       {categories.length} Categories
                   </div>
                </div>
              )}
            </div>
            <div className={styles.exploreLink} style={{ opacity: 1, position: 'relative', bottom: 'auto', right: 'auto', transform: 'none' }}>
              <span>Launch</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </div>
          </div>
        </Link>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className={styles.hubGrid}>
            {categories.map((cat) => (
              <Link key={cat.id} href={`/fun-facts/${cat.slug}`}>
                <div className={styles.categoryCard}>
                  {cat.image && (
                    <div 
                      className={styles.bgImage}
                      style={{ backgroundImage: `url(${cat.image})` }}
                    />
                  )}
                  <div className={styles.cardContent}>
                    <h3 className={styles.categoryTitle}>{cat.name}</h3>
                    <p className={styles.factCount}>
                      {cat._count?.facts || 0} Facts
                    </p>
                  </div>
                  
                  <div className={styles.exploreLink}>
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
