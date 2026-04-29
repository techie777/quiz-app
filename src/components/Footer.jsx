"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { useQuiz } from "@/context/QuizContext";
import styles from "@/styles/Footer.module.css";
import { useMemo } from "react";

export default function Footer() {
  const pathname = usePathname();
  const { settings, quizzes } = useData();
  const { t, isHindi } = useLanguage();
  const currentYear = new Date().getFullYear();

  const { isFullscreen } = useQuiz();
  const shouldHide = isFullscreen || pathname?.startsWith("/admin") || pathname?.startsWith("/live/") || pathname?.includes("/mock-tests/paper/") || pathname?.endsWith("/export") || settings?.footerEnabled === false;

  const brandDesc =
    (typeof settings?.footerBrandDesc === "string" && settings.footerBrandDesc.trim()
      ? settings.footerBrandDesc
      : t('footer.brandDesc'));

  // --- Dynamic SEO Data Logic ---
  const dynamicSEOData = useMemo(() => {
    if (!quizzes || quizzes.length === 0) return { popular: [], recent: [], tags: [] };

    const activeQuizzes = quizzes.filter(q => !q.hidden && q.questions && q.questions.length > 0);
    
    // 1. Top 10 Popular Categories (by question count)
    const popular = [...activeQuizzes]
      .sort((a, b) => (b.questions?.length || 0) - (a.questions?.length || 0))
      .slice(0, 10)
      .map(q => ({ id: q.id, label: `${q.topic} ${isHindi ? 'क्विज़' : 'Quiz'}`, href: `/category/${q.slug || q.id}` }));

    // 2. 6 Most Recent Challenges
    const recent = [...activeQuizzes]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6)
      .map(q => ({ id: q.id, label: q.topic, href: `/category/${q.slug || q.id}` }));

    // 3. SEO Tag Cloud
    const allTopics = activeQuizzes.map(q => q.topic);
    const tags = Array.from(new Set(allTopics)).sort().slice(0, 20);

    return { popular, recent, tags };
  }, [quizzes, isHindi]);

  if (shouldHide) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.contentGrid}>
          {/* Column 1: Brand & Global Presence */}
          <div className={styles.brandBox}>
            <Link href="/" className={styles.footerLogo}>
              <span className={styles.brandEmoji}>🧠</span>
              <span className={styles.brandName}>QuizWeb <span className={styles.brandHighlight}>Pro</span></span>
            </Link>
            <p className={styles.brandStatement}>{brandDesc}</p>
            <div className={styles.socialFollow}>
              <span className={styles.socialHint}>{t('footer.follow')}</span>
              <div className={styles.socialRow}>
                <a href="#" className={styles.socialCircle} aria-label="X">𝕏</a>
                <a href="#" className={styles.socialCircle} aria-label="Facebook">𝑓</a>
                <a href="#" className={styles.socialCircle} aria-label="YouTube">▶</a>
                <a href="#" className={styles.socialCircle} aria-label="LinkedIn">in</a>
              </div>
            </div>
          </div>

          {/* Column 2: Popular Trending */}
          <div className={styles.footerColumn}>
            <h3 className={styles.colHeading}>{t('footer.trending')}</h3>
            <ul className={styles.linkList}>
              {dynamicSEOData.popular.map((l) => (
                <li key={l.id}>
                  <Link href={l.href} className={styles.navLink}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Fresh Additions */}
          <div className={styles.footerColumn}>
            <h3 className={styles.colHeading}>{t('footer.newReleases')}</h3>
            <ul className={styles.linkList}>
              {dynamicSEOData.recent.map((l) => (
                <li key={l.id}>
                  <Link href={l.href} className={styles.navLink}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Global Services */}
          <div className={styles.footerColumn}>
            <h3 className={styles.colHeading}>{t('footer.elearning')}</h3>
            <ul className={styles.linkList}>
              <li><Link href="/daily-quiz" className={styles.navLink}>{t('hub.dailyInsights.links.dailyQuiz')}</Link></li>
              <li><Link href="/current-affairs" className={styles.navLink}>{t('hub.dailyInsights.links.currentAffairs')}</Link></li>
              <li><Link href="/govt-alerts" className={styles.navLink}>{t('hub.resources.links.jobAlerts')}</Link></li>
              <li><Link href="/study-material" className={styles.navLink}>{t('hub.resources.links.schoolStudy')}</Link></li>
              <li><Link href="/blog" className={styles.navLink}>{isHindi ? 'ज्ञान ब्लॉग' : 'Knowledge Blog'}</Link></li>
            </ul>
          </div>

          {/* Column 5: Support & Info */}
          <div className={styles.footerColumn}>
            <h3 className={styles.colHeading}>{t('footer.organization')}</h3>
            <ul className={styles.linkList}>
              <li><Link href="/about" className={styles.navLink}>{isHindi ? 'हमारी कहानी' : 'Our Story'}</Link></li>
              <li><Link href="/donate" className={styles.navLink} style={{ color: '#f43f5e', fontWeight: 'bold' }}>{isHindi ? 'हमारा समर्थन करें' : 'Support Us'} 🧡</Link></li>
              <li><Link href="/contact" className={styles.navLink}>{isHindi ? 'संपर्क करें' : 'Get In Touch'}</Link></li>
              <li><Link href="/privacy" className={styles.navLink}>{isHindi ? 'गोपनीयता नीति' : 'Privacy Policy'}</Link></li>
              <li><Link href="/terms" className={styles.navLink}>{isHindi ? 'सेवा की शर्तें' : 'Terms of Service'}</Link></li>
            </ul>
          </div>
        </div>

        {/* --- High Density SEO Tag Cloud --- */}
        <div className={styles.seoCloudArea}>
          <div className={styles.cloudHeader}>
            <span className={styles.cloudLine}></span>
            <h4 className={styles.cloudTitle}>{t('footer.explorer')}</h4>
            <span className={styles.cloudLine}></span>
          </div>
          <div className={styles.cloudFlex}>
            {dynamicSEOData.tags.map((tag) => (
              <Link key={tag} href={`/?search=${tag}`} className={styles.cloudTag}>
                {tag} {isHindi ? 'क्विज़' : 'Quiz'}
              </Link>
            ))}
            <span className={styles.cloudTag}>{isHindi ? 'मुफ्त शिक्षा' : 'Free Learning'}</span>
            <span className={styles.cloudTag}>{isHindi ? 'ऑनलाइन मूल्यांकन' : 'Online Assessment'}</span>
            <span className={styles.cloudTag}>{isHindi ? 'दैनिक सामान्य ज्ञान' : 'Daily Trivia'}</span>
          </div>
        </div>

        {/* --- Global Bottom Bar --- */}
        <div className={styles.footerBottomBar}>
          <div className={styles.bottomMain}>
            <p className={styles.legalNotice}>
              {t('footer.rights')}
            </p>
            <div className={styles.trustSignals}>
              <span className={styles.signal}>{t('footer.signals.reach')}</span>
              <span className={styles.signalDivider}>•</span>
              <span className={styles.signal}>{t('footer.signals.secure')}</span>
              <span className={styles.signalDivider}>•</span>
              <span className={styles.signal}>{t('footer.signals.verified')}</span>
            </div>
          </div>
          <div className={styles.footerMissionStatement}>
            {t('footer.mission')}
          </div>
        </div>
      </div>
    </footer>
  );
}
