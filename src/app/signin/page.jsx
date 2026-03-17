"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/SignIn.module.css";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState("email"); // "email" or "pin"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userExists, setUserExists] = useState(false);

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserExists(data.exists);
        setStep("pin");
      } else {
        setError(data.error || "Failed to check email");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setError("");
    if (!pin.trim() || pin.length !== 4) {
      setError("4-digit PIN is required");
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
          <h1 className={styles.title}>Welcome to QuizWeb</h1>
          <p className={styles.subtitle}>Sign in with your 4-digit PIN</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.authFlow}>
          {step === "email" ? (
            <form onSubmit={handleCheckEmail} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Email Address</label>
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
                {loading ? "Checking..." : "Next"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPin} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>
                  {userExists ? "Enter your 4-Digit PIN" : "Set your 4-Digit PIN"}
                </label>
                {!userExists && (
                  <p className={styles.otpHint}>
                    This is your first time signing in with {email}. Please set a PIN.
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
                {loading ? "Verifying..." : userExists ? "Sign In" : "Create Account"}
              </button>
              <button
                type="button"
                className={styles.textBtn}
                onClick={() => setStep("email")}
              >
                Change Email
              </button>
            </form>
          )}

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <button
            className={styles.googleBtn}
            onClick={() => signIn("google", { callbackUrl: "/" })}
            disabled={loading}
          >
            <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className={styles.hint}>
          By signing in, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <Link href="/" className={styles.backLink}>
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
