"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "@/styles/HubPage.module.css";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUI } from "@/context/UIContext";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import MiniQuizPreview from "@/components/MiniQuizPreview";

export default function MasterHubPage() {
  const { data: session } = useSession();
  const { openOnboarding } = useUI();
  const { settings } = useData();
  const { t } = useLanguage();
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

  let visibleCardsCount = 1;
  if (settings?.showGovtExams) visibleCardsCount += 1;
  if (settings?.showOtherOptions) visibleCardsCount += 2;

  return (
    <div className={styles.container}>
      <main className={styles.heroContent}>
        
        {/* Hero Headline */}
        <div className={styles.heroHeader}>
          <h1 className={styles.heroTitle}>{mounted ? t('hub.hero.title') : 'Master Your Exams & Trivia'}</h1>
          <p className={styles.heroSubtitle}>{mounted ? t('hub.hero.subtitle') : 'Choose your path to get started.'}</p>
        </div>

        <div className={visibleCardsCount === 1 ? styles.singleCardGrid : styles.grid}>
          {/* Section 1: Quizzes */}
          <div className={`${styles.card} ${styles.cardQuiz}`}>
            <div className={styles.cardBody}>
              <div className={styles.cardIcon}>🧠</div>
              <h2 className={styles.cardTitle}>{t('hub.quizHub.title')}</h2>

              <p className={styles.cardDescription}>
                {t('hub.quizHub.desc')}
              </p>
              
              <div className={styles.previewWrapperInline}>
                {mounted ? <MiniQuizPreview type="quiz" /> : <div className="animate-pulse bg-slate-100 rounded-2xl w-full h-full" />}
              </div>
            </div>
            <Link href="/quizzes" className={styles.mainAction}>
              <span className={styles.viewAll}>{mounted ? t('hub.quizHub.links.action') : 'Start Playing Trivia'} <ArrowRight size={20} /></span>
            </Link>
          </div>

          {/* Section 2: Govt Exams */}
          {settings?.showGovtExams === true && (
            <div className={`${styles.card} ${styles.cardGovt}`}>
              <Link href="/govt-exams" className={styles.cardBadge}>{t('hub.newExams')}</Link>
              <div className={styles.cardBody}>
                <div className={styles.cardIcon}>🏛️</div>
                <h2 className={styles.cardTitle}>{t('hub.govtExams.title')}</h2>

                <p className={styles.cardDescription}>
                  {t('hub.govtExams.desc')}
                </p>
                
                <div className={styles.previewWrapperInline}>
                  {mounted ? <MiniQuizPreview type="govt" /> : <div className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl w-full h-full" />}
                </div>
              </div>
              <Link href="/govt-exams" className={styles.mainAction}>
                <span className={styles.viewAll}>{mounted ? t('hub.govtExams.links.action') : 'Explore Exam Prep'} <ArrowRight size={20} /></span>
              </Link>
            </div>
          )}

          {/* Section 3: Modern Info */}
          {settings?.showOtherOptions === true && (
            <div className={`${styles.card} ${styles.cardInfo}`}>
              <Link href="/fun-facts" className={styles.cardBadge}>{t('hub.factsRevealed')}</Link>
              <div className={styles.cardBody}>
              <div className={styles.cardIcon}>💡</div>
                <h2 className={styles.cardTitle}>{t('hub.dailyInsights.title')}</h2>

                <p className={styles.cardDescription}>
                  {t('hub.dailyInsights.desc')}
                </p>
              </div>
              <Link href="/fun-facts" className={styles.mainAction}>
                <span className={styles.viewAll}>{mounted ? t('hub.dailyInsights.links.action') : 'Explore Facts'} <ArrowRight size={20} /></span>
              </Link>
            </div>
          )}

          {/* Section 4: Others */}
          {settings?.showOtherOptions === true && (
            <div className={`${styles.card} ${styles.cardOthers}`}>
              <Link href="/book-my-course" className={styles.cardBadge}>{t('hub.utilities')}</Link>
              <div className={styles.cardBody}>
                <div className={styles.cardIcon}>🎓</div>
                <h2 className={styles.cardTitle}>{t('hub.resources.title')}</h2>

                <p className={styles.cardDescription}>
                  {t('hub.resources.desc')}
                </p>
              </div>
              <Link href="/book-my-course" className={styles.mainAction}>
                <span className={styles.viewAll}>{mounted ? t('hub.resources.links.action') : 'View Resources'} <ArrowRight size={20} /></span>
              </Link>
            </div>
          )}
        </div>

        {/* Optional Personalization Prompt */}
        {mounted && session && interests.length === 0 && !isLoadingInterests && (
          <div className="mt-12 p-8 rounded-[40px] bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex-1">
              <h3 className="text-2xl font-black text-white mb-2">{t('hub.personalize.title')}</h3>
              <p className="text-slate-400">{t('hub.personalize.desc')}</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={openOnboarding}
                className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black rounded-2xl transition-all hover:scale-105"
              >
                {t('hub.personalize.action')}
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
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{t('hub.support.title')}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">{t('hub.support.desc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest text-sm relative z-10">
              {t('hub.support.action')} <ArrowRight size={18} />
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
