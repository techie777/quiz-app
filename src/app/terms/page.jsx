import styles from "@/styles/LandingPage.module.css";

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <div style={{ paddingTop: '80px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '24px' }}>Terms of Usage</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          Welcome to QuizWeb. By accessing or using our website, you agree to comply with and be bound 
          by these Terms of Usage.
        </p>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '40px', marginBottom: '20px' }}>1. Acceptance of Terms</h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          By accessing or using our website, you signify that you have read, understood, and agree to 
          be bound by these terms. If you do not agree, please do not use our services.
        </p>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '40px', marginBottom: '20px' }}>2. Use of Services</h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          You agree to use our services for lawful purposes only and in a manner that does not 
          infringe upon the rights of others or restrict their use of the platform.
        </p>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '40px', marginBottom: '20px' }}>3. User Accounts</h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          You are responsible for maintaining the confidentiality of your account credentials and for 
          all activities that occur under your account.
        </p>
        <p style={{ marginTop: '60px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Last updated: March 16, 2026</p>
      </div>
    </main>
  );
}
