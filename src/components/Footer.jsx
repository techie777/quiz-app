"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "@/context/DataContext";
import styles from "@/styles/Footer.module.css";

export default function Footer() {
  const pathname = usePathname();
  const { settings } = useData();
  const currentYear = new Date().getFullYear();

  // Hide Footer on admin and export pages
  if (pathname?.startsWith("/admin") || pathname?.endsWith("/export")) return null;
  if (settings?.footerEnabled === false) return null;

  const brandDesc =
    (typeof settings?.footerBrandDesc === "string" && settings.footerBrandDesc.trim()
      ? settings.footerBrandDesc
      : "The ultimate platform to test your knowledge across hundreds of categories. Challenge yourself, learn new things, and have fun!");

  const bottomText =
    (typeof settings?.footerBottomText === "string" && settings.footerBottomText.trim()
      ? settings.footerBottomText
      : "All rights reserved. Designed for knowledge seekers worldwide.");

  const sections = (function () {
    const raw = settings?.footerSections;
    if (typeof raw !== "string" || !raw.trim()) {
      return [
        { id: "platform", heading: "Platform", links: [{ id: "home", label: "Quizzes", href: "/" }] },
        { id: "company", heading: "Company", links: [{ id: "about", label: "About Us", href: "/about" }] },
        {
          id: "legal",
          heading: "Legal",
          links: [
            { id: "terms", label: "Terms of Usage", href: "/terms" },
            { id: "privacy", label: "Privacy Policy", href: "/privacy" },
            { id: "copyright", label: "Copyright", href: "/copyright" },
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

        {/* Bottom Bar */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} QuizWeb. {bottomText}
          </p>
          <div className={styles.socials}>
            {/* Social icons could go here */}
          </div>
        </div>
      </div>
    </footer>
  );
}
