"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/styles/Footer.module.css";

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide Footer on admin pages
  if (pathname?.startsWith("/admin")) return null;

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
            <p className={styles.brandDesc}>
              The ultimate platform to test your knowledge across hundreds of categories. 
              Challenge yourself, learn new things, and have fun!
            </p>
          </div>

          {/* Quick Links */}
          <div className={styles.section}>
            <h3 className={styles.heading}>Platform</h3>
            <ul className={styles.list}>
              <li><Link href="/" className={styles.link}>Quizzes</Link></li>
              <li><Link href="/quizzes" className={styles.link}>All Categories</Link></li>
              <li><Link href="/notes" className={styles.link}>My Notes</Link></li>
              <li><Link href="/profile" className={styles.link}>Profile</Link></li>
            </ul>
          </div>

          {/* Company Section */}
          <div className={styles.section}>
            <h3 className={styles.heading}>Company</h3>
            <ul className={styles.list}>
              <li><Link href="/about" className={styles.link}>About Us</Link></li>
              <li><Link href="/contact" className={styles.link}>Contact</Link></li>
              <li><Link href="/careers" className={styles.link}>Careers</Link></li>
            </ul>
          </div>

          {/* Legal Section */}
          <div className={styles.section}>
            <h3 className={styles.heading}>Legal</h3>
            <ul className={styles.list}>
              <li><Link href="/terms" className={styles.link}>Terms of Usage</Link></li>
              <li><Link href="/privacy" className={styles.link}>Privacy Policy</Link></li>
              <li><Link href="/copyright" className={styles.link}>Copyright</Link></li>
              <li><Link href="/cookies" className={styles.link}>Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} QuizWeb. All rights reserved. 
            Designed for knowledge seekers worldwide.
          </p>
          <div className={styles.socials}>
            {/* Social icons could go here */}
          </div>
        </div>
      </div>
    </footer>
  );
}
