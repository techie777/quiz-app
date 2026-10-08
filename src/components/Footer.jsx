"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { useQuiz } from "@/context/QuizContext";
import { useTier } from "@/context/TierContext";
import { Sparkles, Heart } from "lucide-react";
import styles from "@/styles/Footer.module.css";
import { useMemo } from "react";

const STATIC_PAGE_ROUTES = [
  "/about",
  "/contact",
  "/privacy",
  "/privacy-policy",
  "/terms",
  "/terms-of-service",
  "/support",
  "/donate",
  "/copyright",
];

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasSavedTier, clearTier } = useTier();
  const { settings, quizzes } = useData();
  const { t, isHindi } = useLanguage();
  const currentYear = new Date().getFullYear();

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (pathname === "/" && !hasSavedTier) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      clearTier();
      if (pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/");
      }
    }
  };

  const { isFullscreen } = useQuiz();
  const isQuizOrExamRoute = pathname?.startsWith("/quiz/") || pathname?.includes("/mock-tests/paper/") || pathname?.startsWith("/live/");
  const isCurrentlyFullscreen = isFullscreen && isQuizOrExamRoute;

  // FOOTER RULE: NO footer inside any tier (home, sets, quiz, results, Learn, Current Affairs, Profile, Arena, etc.)
  const isInsideTier =
    (hasSavedTier && pathname === "/") ||
    pathname?.startsWith("/category") ||
    pathname?.startsWith("/quizzes") ||
    pathname?.startsWith("/sets") ||
    pathname?.startsWith("/quiz") ||
    pathname?.startsWith("/results") ||
    pathname?.startsWith("/learn") ||
    pathname?.startsWith("/current-affairs") ||
    pathname?.startsWith("/daily-current-affairs") ||
    pathname?.startsWith("/daily-quiz") ||
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/wallet") ||
    pathname?.startsWith("/arena") ||
    pathname?.startsWith("/quiz-arena") ||
    pathname?.startsWith("/play") ||
    pathname?.startsWith("/live/") ||
    pathname?.startsWith("/my-favourites") ||
    pathname?.startsWith("/leaderboard") ||
    pathname?.startsWith("/mock-tests") ||
    pathname?.startsWith("/career-guide") ||
    pathname?.startsWith("/design-system") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/fun-facts") ||
    pathname?.startsWith("/true-false") ||
    isCurrentlyFullscreen ||
    settings?.footerEnabled === false;

  if (isInsideTier) {
    return null;
  }

  // FOOTER RULE: The full footer appears ONLY on the master landing page and static pages (About, Contact, Privacy, Terms, Support, Donate)
  const isMasterLandingPage = pathname === "/" && !hasSavedTier;
  const isStaticPage = STATIC_PAGE_ROUTES.some((route) => pathname === route || pathname?.startsWith(`${route}/`));
  const isFullFooterPage = isMasterLandingPage || isStaticPage;

  // --- Dynamic SEO Data Logic (Must be called unconditionally before any early return) ---
  const dynamicSEOData = useMemo(() => {
    // Curated high-relevance fallbacks in case quizzes are loading or not yet cached
    const fallbackCategories = [
      { id: "india-gk", topic: isHindi ? "भारत सामान्य ज्ञान" : "India GK", slug: "india-gk", count: 120 },
      { id: "world-gk", topic: isHindi ? "विश्व सामान्य ज्ञान" : "World GK", slug: "world-gk", count: 80 },
      { id: "indian-history", topic: isHindi ? "भारतीय इतिहास" : "Indian History", slug: "indian-history", count: 95 },
      { id: "indian-geography", topic: isHindi ? "भारतीय भूगोल" : "Indian Geography", slug: "indian-geography", count: 70 },
      { id: "science", topic: isHindi ? "सामान्य विज्ञान" : "Science GK", slug: "science", count: 85 },
      { id: "india-sports", topic: isHindi ? "भारतीय खेल" : "India Sports", slug: "india-sports", count: 60 },
      { id: "technology", topic: isHindi ? "कंप्यूटर व तकनीक" : "Technology", slug: "technology", count: 50 },
      { id: "entertainment", topic: isHindi ? "मनोरंजन व सिनेमा" : "Entertainment", slug: "entertainment", count: 45 },
      { id: "indian-states-uts", topic: isHindi ? "भारतीय राज्य" : "Indian States", slug: "indian-states-uts", count: 65 },
      { id: "space-astronomy", topic: isHindi ? "अंतरिक्ष व खगोल" : "Space & Astronomy", slug: "space-astronomy", count: 40 },
    ];

    const source = Array.isArray(quizzes) && quizzes.length > 0
      ? quizzes.filter((q) => !q.hidden)
      : fallbackCategories;

    const getCount = (q) =>
      q.questionCount ??
      q.count ??
      q.questionsCount ??
      q._count?.questions ??
      (Array.isArray(q.questions) ? q.questions.length : 0);

    // 1. Top 8-10 Popular Categories (by question count)
    const popular = [...source]
      .sort((a, b) => getCount(b) - getCount(a))
      .slice(0, 8)
      .map((q) => ({
        id: q.id || q.slug,
        label: `${q.topicHi && isHindi ? q.topicHi : q.topic || q.name} ${isHindi ? "क्विज़" : "Quiz"}`,
        href: `/category/${q.slug || q.id}`,
      }));

    // 2. 6 Most Recent Additions
    const recent = [...source]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6)
      .map((q) => ({
        id: q.id || q.slug,
        label: q.topicHi && isHindi ? q.topicHi : q.topic || q.name,
        href: `/category/${q.slug || q.id}`,
      }));

    // 3. SEO Tag Cloud
    const allTopics = source.map((q) => (q.topicHi && isHindi ? q.topicHi : q.topic || q.name)).filter(Boolean);
    const tags = Array.from(new Set(allTopics)).sort().slice(0, 16);

    return { popular, recent, tags };
  }, [quizzes, isHindi]);

  // Hub/SEO pages get a slim one-line footer (Privacy · Terms · Support)
  if (!isFullFooterPage) {
    return (
      <footer className={styles.slimFooter}>
        <div className={styles.slimContainer}>
          <Link href="/privacy" className={styles.slimLink}>
            {isHindi ? "गोपनीयता" : "Privacy"}
          </Link>
          <span className={styles.slimDot}>·</span>
          <Link href="/terms" className={styles.slimLink}>
            {isHindi ? "शर्तें" : "Terms"}
          </Link>
          <span className={styles.slimDot}>·</span>
          <Link href="/donate" className={styles.slimLink}>
            {isHindi ? "समर्थन करें" : "Support"}
          </Link>
        </div>
      </footer>
    );
  }

  const brandDesc =
    typeof settings?.footerBrandDesc === "string" && settings.footerBrandDesc.trim()
      ? settings.footerBrandDesc
      : t("footer.brandDesc");

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.contentGrid}>
          {/* Column 1: Brand & Global Presence */}
          <div className={styles.brandBox}>
            <Link href="/" className={styles.footerLogo} onClick={handleLogoClick}>
              <div className={styles.brandIconWrapper}>
                <Sparkles size={20} />
              </div>
              <span className={styles.brandName}>
                QuizWeb <span className={styles.brandHighlight}>Pro</span>
              </span>
            </Link>
            <p className={styles.brandStatement}>{brandDesc}</p>
            <div className={styles.socialFollow}>
              <span className={styles.socialHint}>{t("footer.follow")}</span>
              <div className={styles.socialRow}>
                <a href="#" className={styles.socialCircle} aria-label="X">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" className={styles.socialCircle} aria-label="Facebook">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className={styles.socialCircle} aria-label="YouTube">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a href="#" className={styles.socialCircle} aria-label="LinkedIn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.95 0-1.72-.77-1.72-1.72s.77-1.72 1.72-1.72 1.72.77 1.72 1.72-.77 1.72-1.72 1.72m1.4 9.74v-8.37H5.06v8.37h2.8z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Popular Trending */}
          <div className={styles.footerColumn}>
            <h3 className={styles.colHeading}>{t("footer.trending")}</h3>
            <ul className={styles.linkList}>
              {dynamicSEOData.popular.map((l) => (
                <li key={l.id}>
                  <Link href={l.href} className={styles.navLink}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Fresh Additions */}
          <div className={styles.footerColumn}>
            <h3 className={styles.colHeading}>{t("footer.newReleases")}</h3>
            <ul className={styles.linkList}>
              {dynamicSEOData.recent.map((l) => (
                <li key={l.id}>
                  <Link href={l.href} className={styles.navLink}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Global Services */}
          <div className={styles.footerColumn}>
            <h3 className={styles.colHeading}>{t("footer.elearning")}</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/daily-current-affairs" className={styles.navLink}>
                  {t("hub.dailyInsights.links.dailyQuiz")}
                </Link>
              </li>
              <li>
                <Link href="/current-affairs" className={styles.navLink}>
                  {t("hub.dailyInsights.links.currentAffairs")}
                </Link>
              </li>
              <li>
                <Link href="/govt-jobs-alerts" className={styles.navLink}>
                  {t("hub.resources.links.jobAlerts")}
                </Link>
              </li>
              <li>
                <Link href="/school-study" className={styles.navLink}>
                  {t("hub.resources.links.schoolStudy")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className={styles.navLink}>
                  {isHindi ? "ज्ञान ब्लॉग" : "Knowledge Blog"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Support & Info */}
          <div className={styles.footerColumn}>
            <h3 className={styles.colHeading}>{t("footer.organization")}</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/about" className={styles.navLink}>
                  {isHindi ? "हमारी कहानी" : "Our Story"}
                </Link>
              </li>
              <li>
                <Link
                  href="/donate"
                  className={styles.navLink}
                  style={{ color: "var(--tier-kids, #f59e0b)", fontWeight: 600 }}
                >
                  {isHindi ? "हमारा समर्थन करें" : "Support Us"}
                  <Heart size={14} style={{ display: "inline", marginLeft: 4, verticalAlign: "middle" }} />
                </Link>
              </li>
              <li>
                <Link href="/contact" className={styles.navLink}>
                  {isHindi ? "संपर्क करें" : "Get In Touch"}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={styles.navLink}>
                  {isHindi ? "गोपनीयता नीति" : "Privacy Policy"}
                </Link>
              </li>
              <li>
                <Link href="/terms" className={styles.navLink}>
                  {isHindi ? "सेवा की शर्तें" : "Terms of Service"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* --- High Density SEO Tag Cloud --- */}
        <div className={styles.seoCloudArea}>
          <div className={styles.cloudHeader}>
            <span className={styles.cloudLine}></span>
            <h4 className={styles.cloudTitle}>{t("footer.explorer")}</h4>
            <span className={styles.cloudLine}></span>
          </div>
          <div className={styles.cloudFlex}>
            {dynamicSEOData.tags.map((tag) => (
              <Link key={tag} href={`/?search=${tag}`} className={styles.cloudTag}>
                {tag} {isHindi ? "क्विज़" : "Quiz"}
              </Link>
            ))}
            <span className={styles.cloudTag}>{isHindi ? "मुफ्त शिक्षा" : "Free Learning"}</span>
            <span className={styles.cloudTag}>{isHindi ? "ऑनलाइन मूल्यांकन" : "Online Assessment"}</span>
            <span className={styles.cloudTag}>{isHindi ? "दैनिक सामान्य ज्ञान" : "Daily Trivia"}</span>
          </div>
        </div>

        {/* --- Global Bottom Bar --- */}
        <div className={styles.footerBottomBar}>
          <div className={styles.bottomMain}>
            <p className={styles.legalNotice}>
              {t("footer.rights")}
            </p>
            <div className={styles.trustSignals}>
              <span className={styles.signal}>{t("footer.signals.reach")}</span>
              <span className={styles.signalDivider}>•</span>
              <span className={styles.signal}>{t("footer.signals.secure")}</span>
              <span className={styles.signalDivider}>•</span>
              <span className={styles.signal}>{t("footer.signals.verified")}</span>
            </div>
          </div>
          <div className={styles.footerMissionStatement}>
            {t("footer.mission")}
          </div>
        </div>
      </div>
    </footer>
  );
}
