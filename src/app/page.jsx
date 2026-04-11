import Link from "next/link";
import { ArrowRight, Sparkles, Rocket, Zap, Globe } from "lucide-react";
import styles from "@/styles/HubPage.module.css";

export const revalidate = 3600;

export default function MasterHubPage() {
  return (
    <div className={styles.container}>
      <main className={styles.heroContent}>
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>
            Level Up Your <br />
            Knowledge Today
          </h1>
          <p className={styles.welcomeSubtitle}>
            Your all-in-one destination for competitive exam preparation, 
            daily learning, and interactive entertainment.
          </p>
        </div>

        {/* New Mission / Donation Banner */}
        <Link href="/donate" className="block mb-12 p-1 rounded-3xl bg-gradient-to-r from-orange-400 to-rose-400 hover:scale-[1.01] transition-transform shadow-xl shadow-rose-100 group">
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform">🧡</div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Support Free Education</h3>
                <p className="text-slate-500 text-sm max-w-md">Help us keep QuizWeb free and ad-free for students worldwide. Your small support makes a global difference.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-black text-rose-500 uppercase tracking-widest text-sm relative z-10">
              Learn How to Support <ArrowRight size={18} />
            </div>
            {/* Abstract Background Shapes */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-rose-50 rounded-full blur-3xl opacity-50" />
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-orange-50 rounded-full blur-3xl opacity-50" />
          </div>
        </Link>

        <div className={styles.grid}>
          {/* Section 1: Quizzes */}
          <Link href="/quizzes" className={`${styles.card} ${styles.cardQuiz}`}>
            <div className={styles.cardBadge}>LIVE NOW</div>
            <div>
              <div className={styles.cardIcon}>🧠</div>
              <h2 className={styles.cardTitle}>Quiz Hub</h2>
              <p className={styles.cardDescription}>
                Play dynamic quizzes, compete with friends, and master 
                hundreds of topics including Science, History, and GK.
              </p>
              <div className={styles.linksGrid}>
                <div className={styles.linkItem}>
                  <span className={styles.linkIcon}>🏆</span> Daily Quiz
                </div>
                <div className={styles.linkItem}>
                  <span className={styles.linkIcon}>⚡</span> Live Play
                </div>
              </div>
            </div>
            <div className={styles.mainAction}>
              <span className={styles.viewAll}>Enter the Quiz Hub <ArrowRight size={20} /></span>
            </div>
          </Link>

          {/* Section 2: Govt Exams */}
          <Link href="/mock-tests" className={`${styles.card} ${styles.cardGovt}`}>
            <div className={styles.cardBadge}>NEW EXAMS</div>
            <div>
              <div className={styles.cardIcon}>🏛️</div>
              <h2 className={styles.cardTitle}>Govt Exams</h2>
              <p className={styles.cardDescription}>
                Targeted preparation for SSC, IBPS, Railways and more. 
                Full simulations with TCS/NTA style interfaces.
              </p>
              <div className={styles.linksGrid}>
                <div className={styles.linkItem}>
                  <span className={styles.linkIcon}>✍️</span> Mock Tests
                </div>
                <div className={styles.linkItem}>
                  <span className={styles.linkIcon}>📜</span> PYP Papers
                </div>
                <div className={styles.linkItem}>
                  <span className={styles.linkIcon}>📚</span> Study Material
                </div>
                <div className={styles.linkItem}>
                  <span className={styles.linkIcon}>🧭</span> Career Guide
                </div>
              </div>
            </div>
            <div className={styles.mainAction}>
              <span className={styles.viewAll}>Start Preparing <ArrowRight size={20} /></span>
            </div>
          </Link>

          {/* Section 3: Modern Info */}
          <Link href="/fun-facts" className={`${styles.card} ${styles.cardInfo}`}>
            <div className={styles.cardBadge}>FACTS REVEALED</div>
            <div>
              <div className={styles.cardIcon}>✨</div>
              <h2 className={styles.cardTitle}>Daily Insights</h2>
              <p className={styles.cardDescription}>
                Fascinating fun facts, quick True/False challenges, and 
                daily current affairs to keep you updated.
              </p>
              <div className={styles.linksGrid}>
                <div className={styles.linkItem}>
                  <span className={styles.linkIcon}>🔍</span> Fun facts
                </div>
                <div className={styles.linkItem}>
                  <span className={styles.linkIcon}>✅</span> True / False
                </div>
                <div className={styles.linkItem}>
                  <span className={styles.linkIcon}>📰</span> Current Affairs
                </div>
                <div className={styles.linkItem}>
                  <span className={styles.linkIcon}>🕙</span> Daily Quiz
                </div>
              </div>
            </div>
            <div className={styles.mainAction}>
              <span className={styles.viewAll}>Explore Facts <ArrowRight size={20} /></span>
            </div>
          </Link>

          {/* Section 4: Others */}
          <Link href="/book-my-course" className={`${styles.card} ${styles.cardOthers}`}>
            <div className={styles.cardBadge}>UTILITIES</div>
            <div>
              <div className={styles.cardIcon}>🎓</div>
              <h2 className={styles.cardTitle}>Resources</h2>
              <p className={styles.cardDescription}>
                Access school curriculum revisions, order official books, 
                and get the latest government job notifications.
              </p>
              <div className={styles.linksGrid}>
                <div className={styles.linkItem}>
                  <span className={styles.linkIcon}>💼</span> Job Alerts
                </div>
                <div className={styles.linkItem}>
                  <span className={styles.linkIcon}>🎒</span> Book Courses
                </div>
                <div className={styles.linkItem}>
                  <span className={styles.linkIcon}>📖</span> School Study
                </div>
              </div>
            </div>
            <div className={styles.mainAction}>
              <span className={styles.viewAll}>View Resources <ArrowRight size={20} /></span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
