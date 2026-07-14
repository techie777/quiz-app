"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/styles/SignIn.module.css";
import { useState } from "react";

export default function SignInPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setLoading(true);
    if (typeof window !== "undefined") sessionStorage.setItem("auth_toast", "login");
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <main className={styles.page}>
      <div className={`${styles.card} glass-card`}>
        <div className={styles.header}>
          <span className={styles.icon}>👋</span>
          <h1 className={styles.title}>{t('auth.title') || "Welcome Back"}</h1>
          <p className={styles.subtitle}>{t('auth.subtitle') || "Sign in to continue"}</p>
        </div>

        <div className={styles.authFlow} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem' }}>
          
          <button
            className={styles.googleBtn}
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{ width: '100%', maxWidth: '300px', height: '50px', fontSize: '1.1rem' }}
          >
            {loading ? (
              <span>Loading...</span>
            ) : (
              <>
                <svg className={styles.googleIcon} viewBox="0 0 24 24" width="24" height="24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-2.97 0-5.46.98-7.28 2.66l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t('auth.google') || "Continue with Google"}
              </>
            )}
          </button>
        </div>

        <p className={styles.hint} style={{ marginTop: '2rem' }}>
          {t('auth.terms') || "By continuing, you agree to our Terms of Service."}
        </p>

        <Link href="/" className={styles.backLink}>
          ← {t('auth.backHome') || "Back to home"}
        </Link>
      </div>
    </main>
  );
}
