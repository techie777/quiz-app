import Link from "next/link";
import styles from "@/styles/NotFound.module.css";

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-card`}>
        <div className={styles.emojiWrapper}>
          🐶
        </div>
        <div className={styles.errorCode}>Error 404</div>
        <h1 className={styles.title}>Oops! This page went for a walk...</h1>
        <p className={styles.message}>
          We&apos;re so sorry, but we can&apos;t seem to find the page you&apos;re looking for. 
          It might have moved or is simply taking a nap.
        </p>
        <Link href="/" className={styles.homeBtn}>
          Return Home
        </Link>
      </div>
    </div>
  );
}
