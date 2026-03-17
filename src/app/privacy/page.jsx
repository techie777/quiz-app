import styles from "@/styles/LandingPage.module.css";

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <div style={{ paddingTop: '80px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '24px' }}>Privacy Policy</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          Your privacy is important to us. This Privacy Policy explains how we collect, use, and 
          protect your personal information.
        </p>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '40px', marginBottom: '20px' }}>Information We Collect</h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          We collect personal information such as your name and email address when you register for 
          an account. We also collect usage data through cookies.
        </p>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '40px', marginBottom: '20px' }}>How We Use Your Information</h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          We use your information to provide and improve our services, communicate with you, and 
          personalize your experience.
        </p>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '40px', marginBottom: '20px' }}>Data Protection</h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          We implement a variety of security measures to maintain the safety of your personal 
          information when you access our platform.
        </p>
        <p style={{ marginTop: '60px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Last updated: March 16, 2026</p>
      </div>
    </main>
  );
}
