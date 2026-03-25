"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "@/context/DataContext";
import styles from "@/styles/Footer.module.css";

export default function Footer() {
  const pathname = usePathname();
  const { settings, quizzes } = useData();
  const currentYear = new Date().getFullYear();

  const shouldHide = pathname?.startsWith("/admin") || pathname?.endsWith("/export") || settings?.footerEnabled === false;

  const brandDesc =
    (typeof settings?.footerBrandDesc === "string" && settings.footerBrandDesc.trim()
      ? settings.footerBrandDesc
      : "Test your knowledge with thousands of interactive quizzes. From science to history, challenge yourself and learn new facts every day!");

  const bottomText =
    (typeof settings?.footerBottomText === "string" && settings.footerBottomText.trim()
      ? settings.footerBottomText
      : "Empowering learners worldwide with engaging educational content.");

  // Generate quiz categories for SEO
  const popularCategories = quizzes
    .filter(q => !q.hidden && q.questions && q.questions.length > 0)
    .slice(0, 8)
    .map(q => ({
      id: q.id,
      label: q.topic,
      href: `/category/${q.id}`,
      emoji: q.emoji || '📚'
    }));

  // Always return JSX - never return null
  if (shouldHide) {
    return <div style={{ display: 'none' }} />; // Hidden div instead of null
  }

  const sections = (function () {
    const raw = settings?.footerSections;
    if (typeof raw !== "string" || !raw.trim()) {
      return [
        { 
          id: "quizzes", 
          heading: "Popular Quizzes", 
          links: popularCategories.map(cat => ({
            id: cat.id,
            label: `${cat.emoji} ${cat.label}`,
            href: cat.href
          }))
        },
        { 
          id: "topics", 
          heading: "Quiz Topics", 
          links: [
            { id: "science", label: "🔬 Science Quizzes", href: "/?filter=Science" },
            { id: "math", label: "🔢 Mathematics", href: "/?filter=Math" },
            { id: "history", label: "📚 History", href: "/?filter=History" },
            { id: "geography", label: "🌍 Geography", href: "/?filter=Geography" },
            { id: "sports", label: "⚽ Sports", href: "/?filter=Sports" },
            { id: "entertainment", label: "🎬 Entertainment", href: "/?filter=Entertainment" },
          ]
        },
        { 
          id: "resources", 
          heading: "Learning Resources", 
          links: [
            { id: "daily", label: "Daily Quiz", href: "/?filter=Daily" },
            { id: "current", label: "Current Affairs", href: "/?filter=Current" },
            { id: "gk", label: "General Knowledge", href: "/?filter=GK" },
            { id: "practice", label: "Practice Tests", href: "/" },
          ]
        },
        {
          id: "company",
          heading: "About",
          links: [
            { id: "about", label: "About Us", href: "/about" },
            { id: "contact", label: "Contact", href: "/contact" },
            { id: "blog", label: "Quiz Blog", href: "/blog" },
          ],
        },
        {
          id: "legal",
          heading: "Legal",
          links: [
            { id: "terms", label: "Terms of Service", href: "/terms" },
            { id: "privacy", label: "Privacy Policy", href: "/privacy" },
            { id: "cookies", label: "Cookie Policy", href: "/cookies" },
            { id: "sitemap", label: "Sitemap", href: "/sitemap.xml" },
          ],
        },
      ];
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((s) => ({
          id: String(s?.id || s?.heading || Math.random().toString(36).slice(2, 8)).trim(),
          heading: String(s?.heading || "").trim(),
          links: Array.isArray(s?.links)
            ? s.links
                .map((l) => ({
                  id: String(l?.id || l?.label || Math.random().toString(36).slice(2, 8)).trim(),
                  label: String(l?.label || "").trim(),
                  href: String(l?.href || "").trim(),
                }))
                .filter((l) => l.label && l.href)
            : [],
        }))
        .filter((s) => s.heading && s.links.length > 0);
    } catch {
      return [];
    }
  })();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand Section */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoEmoji}>🧠</span>
              <span className={styles.logoText}>QuizWeb</span>
            </Link>
            <p className={styles.brandDesc}>{brandDesc}</p>
            <div className={styles.seoTags}>
              <span className={styles.tag}>#QuizPlatform</span>
              <span className={styles.tag}>#KnowledgeTest</span>
              <span className={styles.tag}>#Learning</span>
              <span className={styles.tag}>#Education</span>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.id} className={styles.section}>
              <h3 className={styles.heading}>{section.heading}</h3>
              <ul className={styles.list}>
                {section.links.map((l) => (
                  <li key={l.id}>
                    <Link href={l.href} className={styles.link}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* SEO Keywords Section */}
        <div className={styles.seoSection}>
          <h4 className={styles.seoTitle}>Popular Quiz Topics</h4>
          <div className={styles.seoKeywords}>
            <span className={styles.keyword}>Science Quiz</span>
            <span className={styles.keyword}>Math Test</span>
            <span className={styles.keyword}>History Questions</span>
            <span className={styles.keyword}>Geography Challenge</span>
            <span className={styles.keyword}>Sports Trivia</span>
            <span className={styles.keyword}>Entertainment Quiz</span>
            <span className={styles.keyword}>Current Affairs</span>
            <span className={styles.keyword}>General Knowledge</span>
            <span className={styles.keyword}>Educational Games</span>
            <span className={styles.keyword}>Online Quiz</span>
            <span className={styles.keyword}>Free Tests</span>
            <span className={styles.keyword}>Learning Platform</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} QuizWeb. {bottomText}
          </p>
          <div className={styles.seoInfo}>
            <span className={styles.seoMeta}>Thousands of quizzes • Free to play • Educational content</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
