import styles from "@/styles/LandingPage.module.css";

export default function CopyrightPage() {
  return (
    <main className={styles.page}>
      <div style={{ paddingTop: '80px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '24px' }}>Copyright Information</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          All content on QuizWeb is protected by copyright laws. 
          Unless otherwise stated, all materials are owned by QuizWeb.
        </p>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '40px', marginBottom: '20px' }}>Content Ownership</h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          The quizzes, questions, images, and other materials on this website are owned by QuizWeb 
          and may not be used or reproduced without our express written permission.
        </p>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '40px', marginBottom: '20px' }}>Permitted Use</h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          Users are permitted to use the website for personal, non-commercial purposes. 
          Sharing quizzes on social media using our built-in tools is encouraged!
        </p>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '40px', marginBottom: '20px' }}>Reporting Infringements</h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          If you believe any content on our website infringes upon your copyright, please contact us 
          at copyright@quizweb.com.
        </p>
        <p style={{ marginTop: '60px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>© 2026 QuizWeb. All rights reserved.</p>
      </div>
    </main>
  );
}
