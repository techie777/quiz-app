"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "@/styles/HubPage.module.css";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUI } from "@/context/UIContext";
import MiniQuizPreview from "@/components/MiniQuizPreview";

export default function MasterHubPage() {
  const { data: session } = useSession();
  const { openOnboarding } = useUI();
  const [mounted, setMounted] = useState(false);
  const [interests, setInterests] = useState([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchInterests();
    }
  }, [session]);

  const fetchInterests = async () => {
    setIsLoadingInterests(true);
    try {
      const res = await fetch("/api/user/interests");
      const data = await res.json();
      setInterests(data.interestedCategories || []);
    } catch (error) {
      console.error("Failed to fetch interests:", error);
    } finally {
      setIsLoadingInterests(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.heroContent}>

        <div className={styles.grid}>
          {/* Section 1: Quizzes */}
          <div className={`${styles.card} ${styles.cardQuiz}`}>
            <Link href="/quizzes" className={styles.cardBadge}>LIVE NOW</Link>
            <div className={styles.cardBody}>
              <div className={styles.cardIcon}>🧠</div>
              <div className={styles.previewWrapper}>
                {mounted ? <MiniQuizPreview type="quiz" /> : <div className="animate-pulse bg-slate-100 rounded-2xl w-full h-full" />}
              </div>
              <h2 className={styles.cardTitle}>Quiz Hub</h2>

              <p className={styles.cardDescription}>
                Play dynamic quizzes, compete with friends, and master 
                hundreds of topics including Science, History, and GK.
              </p>
              <div className={styles.linksGrid}>
                <Link href="/quizzes" className={styles.linkItem}>
                  <span className={styles.linkIcon}>🏆</span> Quiz
                </Link>
                <Link href="/fun-facts" className={styles.linkItem}>
                  <span className={styles.linkIcon}>✨</span> Fun facts
                </Link>
                <Link href="/true-false" className={styles.linkItem}>
                  <span className={styles.linkIcon}>✅</span> True & False
                </Link>
                <Link href="/sawal-jawab" className={styles.linkItem}>
                  <span className={styles.linkIcon}>❓</span> Sawal Jawab
                </Link>
              </div>
            </div>
            <Link href="/quizzes" className={styles.mainAction}>
              <span className={styles.viewAll}>Enter the Quiz Hub <ArrowRight size={20} /></span>
            </Link>
          </div>

          {/* Section 2: Govt Exams */}
          <div className={`${styles.card} ${styles.cardGovt}`}>
            <Link href="/mock-tests" className={styles.cardBadge}>NEW EXAMS</Link>
            <div className={styles.cardBody}>
              <div className={styles.cardIcon}>🏛️</div>
              <div className={styles.previewWrapper}>
                {mounted ? <MiniQuizPreview type="govt" /> : <div className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl w-full h-full" />}
              </div>
              <h2 className={styles.cardTitle}>Govt Exams</h2>

              <p className={styles.cardDescription}>
                Targeted preparation for SSC, IBPS, Railways and more. 
                Full simulations with TCS/NTA style interfaces.
              </p>
              <div className={styles.linksGrid}>
                <Link href="/mock-tests" className={styles.linkItem}>
                  <span className={styles.linkIcon}>✍️</span> Mock Tests
                </Link>
                <Link href="/mock-tests" className={styles.linkItem}>
                  <span className={styles.linkIcon}>📜</span> PYP Papers
                </Link>
                <Link href="/govt-study" className={styles.linkItem}>
                  <span className={styles.linkIcon}>📚</span> Study Material
                </Link>
                <Link href="/career-guide" className={styles.linkItem}>
                  <span className={styles.linkIcon}>🧭</span> Career Guide
                </Link>
              </div>
            </div>
            <Link href="/mock-tests" className={styles.mainAction}>
              <span className={styles.viewAll}>Start Preparing <ArrowRight size={20} /></span>
            </Link>
          </div>

          {/* Section 3: Modern Info */}
          <div className={`${styles.card} ${styles.cardInfo}`}>
            <Link href="/fun-facts" className={styles.cardBadge}>FACTS REVEALED</Link>
            <div className={styles.cardBody}>
              <div className={styles.cardIcon}>✨</div>
              <div className={styles.previewWrapper}>
                {mounted ? <MiniQuizPreview type="facts" /> : <div className="animate-pulse bg-slate-100 rounded-2xl w-full h-full" />}
              </div>
              <h2 className={styles.cardTitle}>Daily Insights</h2>

              <p className={styles.cardDescription}>
                Fascinating fun facts, quick True/False challenges, and 
                daily current affairs to keep you updated.
              </p>
              <div className={styles.linksGrid}>
                <Link href="/current-affairs" className={styles.linkItem}>
                  <span className={styles.linkIcon}>📰</span> Current affairs
                </Link>
                <Link href="/quizzes" className={styles.linkItem}>
                  <span className={styles.linkIcon}>🕙</span> Daily Quiz
                </Link>
                <Link href="/fun-facts" className={styles.linkItem}>
                  <span className={styles.linkIcon}>✨</span> Fun facts
                </Link>
                <Link href="/sawal-jawab" className={styles.linkItem}>
                  <span className={styles.linkIcon}>❓</span> Sawal & Jawab
                </Link>
              </div>
            </div>
            <Link href="/fun-facts" className={styles.mainAction}>
              <span className={styles.viewAll}>Explore Facts <ArrowRight size={20} /></span>
            </Link>
          </div>

          {/* Section 4: Others */}
          <div className={`${styles.card} ${styles.cardOthers}`}>
            <Link href="/book-my-course" className={styles.cardBadge}>UTILITIES</Link>
            <div className={styles.cardBody}>
              <div className={styles.cardIcon}>🎓</div>
              <div className={styles.previewWrapper}>
                {mounted ? <MiniQuizPreview type="resources" /> : <div className="animate-pulse bg-slate-100 rounded-2xl w-full h-full" />}
              </div>
              <h2 className={styles.cardTitle}>Resources</h2>

              <p className={styles.cardDescription}>
                Access school curriculum revisions, order official books, 
                and get the latest government job notifications.
              </p>
              <div className={styles.linksGrid}>
                <Link href="/govt-jobs-alerts" className={styles.linkItem}>
                  <span className={styles.linkIcon}>💼</span> Job Alerts
                </Link>
                <Link href="/book-my-course" className={styles.linkItem}>
                  <span className={styles.linkIcon}>🎒</span> Book Courses
                </Link>
                <Link href="/school-study" className={styles.linkItem}>
                  <span className={styles.linkIcon}>📖</span> School Study
                </Link>
              </div>
            </div>
            <Link href="/book-my-course" className={styles.mainAction}>
              <span className={styles.viewAll}>View Resources <ArrowRight size={20} /></span>
            </Link>
          </div>
        </div>

        {/* Optional Personalization Prompt */}
        {mounted && session && interests.length === 0 && !isLoadingInterests && (
          <div className="mt-12 p-8 rounded-[40px] bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex-1">
              <h3 className="text-2xl font-black text-white mb-2">Want a personalized experience?</h3>
              <p className="text-slate-400">Tell us what you like and we&apos;ll tailor your quiz feed to your interests. You can always change this later.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={openOnboarding}
                className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black rounded-2xl transition-all hover:scale-105"
              >
                Personalize Now
              </button>
            </div>
          </div>
        )}

        {/* New Mission / Donation Banner */}
        <Link href="/donate" className="block mt-16 p-1 rounded-3xl bg-gradient-to-r from-orange-400 to-rose-400 hover:scale-[1.01] transition-transform shadow-xl dark:shadow-none shadow-rose-100 group">
          <div className="bg-white dark:bg-slate-900 rounded-2xl px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform">🧡</div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Support Free Education</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">Help us keep QuizWeb free and ad-free for students worldwide. Your small support makes a global difference.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest text-sm relative z-10">
              Learn How to Support <ArrowRight size={18} />
            </div>
            {/* Abstract Background Shapes */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-rose-50 dark:bg-rose-900/10 rounded-full blur-3xl opacity-50" />
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-orange-50 dark:bg-orange-900/10 rounded-full blur-3xl opacity-50" />
          </div>
        </Link>
      </main>
    </div>
  );
}
