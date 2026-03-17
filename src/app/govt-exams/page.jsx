"use client";

import Link from "next/link";
import styles from "@/styles/PlaceholderPage.module.css";

export default function GovtExamsPage() {
  return (
    <div className={styles.page}>
      <div className={`${styles.card} glass-card`}>
        <h1 className={styles.title}>Govt exams</h1>
        <p className={styles.subtitle}>Select an exam from the navigation bar.</p>
        <div className={styles.links}>
          <Link href="/govt-exams/upsc" className={styles.link}>UPSC</Link>
          <Link href="/govt-exams/ssc" className={styles.link}>SSC</Link>
          <Link href="/govt-exams/rrb" className={styles.link}>RRB</Link>
          <Link href="/govt-exams/ibp" className={styles.link}>IBP</Link>
        </div>
      </div>
    </div>
  );
}

