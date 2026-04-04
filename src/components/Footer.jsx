"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "@/context/DataContext";
import styles from "@/styles/Footer.module.css";
import { useMemo } from "react";

export default function Footer() {
  const pathname = usePathname();
  const { settings, quizzes } = useData();
  const currentYear = new Date().getFullYear();

  const shouldHide = pathname?.startsWith("/admin") || pathname?.endsWith("/export") || settings?.footerEnabled === false;

  const brandDesc =
    (typeof settings?.footerBrandDesc === "string" && settings.footerBrandDesc.trim()
      ? settings.footerBrandDesc
      : "The ultimate global quiz destination. Empowering learners worldwide with thousands of interactive quizzes, daily insights, and academic resources.");

  // --- Dynamic SEO Data Logic ---
  const dynamicSEOData = useMemo(() => {
    if (!quizzes || quizzes.length === 0) return { popular: [], recent: [], tags: [] };

    const activeQuizzes = quizzes.filter(q => !q.hidden && q.questions && q.questions.length > 0);
    
    // 1. Top 10 Popular Categories (by question count)
    const popular = [...activeQuizzes]
      .sort((a, b) => (b.questions?.length || 0) - (a.questions?.length || 0))
      .slice(0, 10)
      .map(q => ({ id: q.id, label: `${q.topic} Quiz`, href: `/category/${q.id}` }));

    // 2. 6 Most Recent Challenges
    const recent = [...activeQuizzes]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6)
      .map(q => ({ id: q.id, label: q.topic, href: `/category/${q.id}` }));

    // 3. SEO Tag Cloud
    const allTopics = activeQuizzes.map(q => q.topic);
    const tags = Array.from(new Set(allTopics)).sort().slice(0, 20);

    return { popular, recent, tags };
  }, [quizzes]);

  if (shouldHide) {
    return <div style={{ display: 'none' }} />;
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
              <span className={styles.socialHint}>Follow Our Journey</span>
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
            <h3 className={styles.colHeading}>Trending Now</h3>
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
            <h3 className={styles.colHeading}>New Releases</h3>
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
            <h3 className={styles.colHeading}>E-Learning Hub</h3>
            <ul className={styles.linkList}>
              <li><Link href="/daily-quiz" className={styles.navLink}>Daily Quiz Challenge</Link></li>
              <li><Link href="/current-affairs" className={styles.navLink}>Current Affairs Hub</Link></li>
              <li><Link href="/govt-alerts" className={styles.navLink}>Job & Career Alerts</Link></li>
              <li><Link href="/study-material" className={styles.navLink}>Study Resources</Link></li>
              <li><Link href="/blog" className={styles.navLink}>Knowledge Blog</Link></li>
            </ul>
          </div>

          {/* Column 5: Support & Info */}
          <div className={styles.footerColumn}>
            <h3 className={styles.colHeading}>Organization</h3>
            <ul className={styles.linkList}>
              <li><Link href="/about" className={styles.navLink}>Our Story</Link></li>
              <li><Link href="/contact" className={styles.navLink}>Get In Touch</Link></li>
              <li><Link href="/privacy" className={styles.navLink}>Privacy Policy</Link></li>
              <li><Link href="/terms" className={styles.navLink}>Terms of Service</Link></li>
              <li><Link href="/sitemap.xml" className={styles.navLink}>Portal Sitemap</Link></li>
            </ul>
          </div>
        </div>

        {/* --- High Density SEO Tag Cloud --- */}
        <div className={styles.seoCloudArea}>
          <div className={styles.cloudHeader}>
            <span className={styles.cloudLine}></span>
            <h4 className={styles.cloudTitle}>Global Topic Explorer</h4>
            <span className={styles.cloudLine}></span>
          </div>
          <div className={styles.cloudFlex}>
            {dynamicSEOData.tags.map((tag) => (
              <Link key={tag} href={`/?search=${tag}`} className={styles.cloudTag}>
                {tag} Quiz
              </Link>
            ))}
            <span className={styles.cloudTag}>Free Learning</span>
            <span className={styles.cloudTag}>Online Assessment</span>
            <span className={styles.cloudTag}>Daily Trivia</span>
          </div>
        </div>

        {/* --- Global Bottom Bar --- */}
        <div className={styles.footerBottomBar}>
          <div className={styles.bottomMain}>
            <p className={styles.legalNotice}>
              © {currentYear} <strong>QuizWeb International</strong>. Excellence in digital education.
            </p>
            <div className={styles.trustSignals}>
              <span className={styles.signal}>Global Reach</span>
              <span className={styles.signalDivider}>•</span>
              <span className={styles.signal}>Secure Platform</span>
              <span className={styles.signalDivider}>•</span>
              <span className={styles.signal}>Verified Content</span>
            </div>
          </div>
          <div className={styles.footerMissionStatement}>
            Designing a world where knowledge is inclusive, interactive, and entirely accessible to everyone, everywhere.
          </div>
        </div>
      </div>
    </footer>
  );
}
