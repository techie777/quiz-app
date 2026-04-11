"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight, Brain } from "lucide-react";
import styles from "@/styles/TrueFalse.module.css";

export default function TrueFalseHub() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/true-false/categories")
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
            <CheckCircle className={styles.checkIcon} /> True/False
          </h1>
          <p className={styles.description}>
            Test your knowledge with interactive true/false questions across diverse categories. Challenge yourself and learn new facts!
          </p>
        </div>

        <Link href="/true-false/voyager">
          <div className={styles.voyagerHero}>
            <div className={styles.voyagerBadge}>LIVE STREAM</div>
            <div className={styles.voyagerIconContainer}>
              <Brain className={styles.voyagerIcon} />
            </div>
            <div className={styles.voyagerInfo}>
              <span className={styles.voyagerLabel}>Continuous Challenge</span>
              <h2 className={styles.voyagerTitle}>The True/False Voyager</h2>
              <p className={styles.voyagerSubtitle}>A non-stop stream of true/false questions from all categories.</p>
              
              {!loading && categories.length > 0 && (
                <div className="flex gap-4 mt-5">
                   <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white font-bold text-sm shadow-sm flex items-center gap-2">
                       {categories.reduce((acc, cat) => acc + (cat._count?.questions || 0), 0)} Total Questions
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
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
          </div>
        ) : (
          <div className={styles.hubGrid}>
            {categories.map((cat) => (
              <Link key={cat.id} href={`/true-false/${cat.slug}`}>
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
                      {cat._count?.questions || 0} Questions
                    </p>
                  </div>
                  
                  <div className={styles.exploreLink}>
                    <span>Challenge</span>
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
