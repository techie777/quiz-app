"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/styles/SignIn.module.css";

export default function SignInPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState("email"); // "email" or "pin"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userExists, setUserExists] = useState(false);
  const [userHasPin, setUserHasPin] = useState(false);

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError(t('auth.emailRequired') || "Email is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserExists(data.exists);
        setUserHasPin(data.hasPin);
        setStep("pin");
      } else {
        setError(data.error || data.details || "Failed to check email");
      }
    } catch (err) {
      console.error("CheckEmail error:", err);
      setError("Server unreachable. Please check your connection.");
    }
    setLoading(false);
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setError("");
    if (!pin.trim() || pin.length !== 4) {
      setError(t('auth.pinRequired') || "4-digit PIN is required");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn("email-pin", {
        redirect: false,
        email: email.trim().toLowerCase(),
        pin: pin.trim(),
        isNewUser: !userExists,
      });
      if (result?.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(result?.error || "Invalid PIN or failed to sign in");
      }
    } catch (err) {
      console.error("SignIn error:", err);
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <main className={styles.page}>
      <div className={`${styles.card} glass-card`}>
        <div className={styles.header}>
          <span className={styles.icon}>👋</span>
          <h1 className={styles.title}>{t('auth.title')}</h1>
          <p className={styles.subtitle}>{t('auth.subtitle')}</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.authFlow}>
          {step === "email" ? (
            <form onSubmit={handleCheckEmail} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>{t('auth.email')}</label>
                <input
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className={`btn-primary ${styles.submitBtn}`}
                disabled={loading}
              >
                {loading ? t('auth.checking') : t('auth.next')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPin} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>
                  {userHasPin ? t('auth.pinEnter') : t('auth.pinSet')}
                </label>
                {!userHasPin && (
                  <p className={styles.otpHint}>
                    {userExists 
                      ? "You previously used Google. Please set a 4-digit PIN for manual login."
                      : `This is your first time signing in. Please set a PIN for ${email}.`
                    }
                  </p>
                )}
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  className={styles.input}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setPin(val);
                  }}
                  placeholder="0000"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className={`btn-primary ${styles.submitBtn}`}
                disabled={loading}
              >
                {loading ? t('auth.verifying') : userHasPin ? t('auth.signIn') : t('auth.setAndEnter')}
              </button>
              <button
                type="button"
                className={styles.textBtn}
                onClick={() => setStep("email")}
              >
                {t('auth.changeEmail')}
              </button>
            </form>
          )}

          <div className={styles.divider}>
            <span>{t('auth.or')}</span>
          </div>

          <button
            className={styles.googleBtn}
            onClick={() => signIn("google", { callbackUrl: "/" })}
            disabled={loading}
          >
            <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-2.97 0-5.46.98-7.28 2.66l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('auth.google')}
          </button>
        </div>

        <p className={styles.hint}>
          {t('auth.terms')}
        </p>

        <Link href="/" className={styles.backLink}>
          ← {t('auth.backHome')}
        </Link>
      </div>
    </main>
  );
}
