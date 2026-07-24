"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/styles/SignIn.module.css";
import { useState } from "react";
import { Sparkles, CheckCircle2, ShieldCheck, Zap, ArrowLeft } from "lucide-react";

export default function SignInPage() {
  const { t, isHindi } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setLoading(true);
    if (typeof window !== "undefined") sessionStorage.setItem("auth_toast", "login");
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        
        {/* Left Hero Showcase */}
        <div className={styles.showcase}>
          <div className={styles.badge}>
            <Sparkles size={14} />
            <span>{isHindi ? "ऑल-इन-वन लर्निंग हब" : "All-in-One Learning Hub"}</span>
          </div>

          <h1 className={styles.heroTitle}>
            {isHindi ? (
              <>अपनी तैयारी को <span className={styles.heroTitleHighlight}>नया स्तर</span> दें</>
            ) : (
              <>Master Exams with <span className={styles.heroTitleHighlight}>Smart Practice</span></>
            )}
          </h1>

          <p className={styles.heroSub}>
            {isHindi 
              ? "SSC, बैंकिंग, रेलवे एवं पुलिस भर्ती परीक्षाओं के लिए 50+ विषयवार क्विज़ और ऑल इंडिया लाइव मॉक टेस्ट सीरीज़।"
              : "Access 50+ subject quizzes, daily current affairs digests, and TCS bilingual live mock test series."}
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>🧠</div>
              <div className={styles.featureText}>
                <span className={styles.featureTitle}>{isHindi ? "50+ क्विज़ वर्टिकल्स" : "50+ Quiz Verticals"}</span>
                <span className={styles.featureDesc}>{isHindi ? "रीड मोड, टाइम्ड सेट और विस्तृत हिंदी व इंग्लिश समाधान" : "Interactive practice sets, read mode & timed subject quizzes."}</span>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>🏆</div>
              <div className={styles.featureText}>
                <span className={styles.featureTitle}>{isHindi ? "TCS पैटर्न मॉक टेस्ट सीरीज़" : "TCS Pattern Live Mocks"}</span>
                <span className={styles.featureDesc}>{isHindi ? "द्विभाषी स्विच, नेगेटिव मार्किंग और ऑल इंडिया रैंक" : "Real TCS exam simulator, section cutoff & rank analytics."}</span>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>📰</div>
              <div className={styles.featureText}>
                <span className={styles.featureTitle}>{isHindi ? "दैनिक समसामयिकी वन-लाइनर्स" : "Daily Current Affairs"}</span>
                <span className={styles.featureDesc}>{isHindi ? "परीक्षा उपयोगी दैनिक नोट्स और मासिक संग्रह" : "Exam-oriented daily news digests & calendar archives."}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sign-in Card */}
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logoBadge}>🎓</div>
            <h2 className={styles.title}>{t('auth.title') || (isHindi ? "साइन इन करें" : "Welcome Back")}</h2>
            <p className={styles.subtitle}>{t('auth.subtitle') || (isHindi ? "अपनी लर्निंग यात्रा जारी रखने के लिए लॉगिन करें" : "Sign in to access quizzes & test series")}</p>
          </div>

          <div className={styles.authFlow}>
            <button
              className={styles.googleBtn}
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <span>{isHindi ? "सत्यापन हो रहा है..." : "Authenticating..."}</span>
              ) : (
                <>
                  <svg className={styles.googleIcon} viewBox="0 0 24 24" width="22" height="22">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-2.97 0-5.46.98-7.28 2.66l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>{t('auth.google') || (isHindi ? "Google के साथ साइन इन करें" : "Continue with Google")}</span>
                </>
              )}
            </button>
          </div>

          <div className={styles.benefitsBox}>
            <div className={styles.benefitItem}>
              <span className={styles.benefitCheck}>✓</span>
              <span>{isHindi ? "100% फ्री प्रैक्टिस एवं मॉक टेस्ट" : "100% Free Practice & Trial Tests"}</span>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.benefitCheck}>✓</span>
              <span>{isHindi ? "सुरक्षित एवं वन-क्लिक Google साइन इन" : "Instant & Secure 1-Click Authentication"}</span>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.benefitCheck}>✓</span>
              <span>{isHindi ? "पर्सनलाइज़्ड डैशबोर्ड और स्ट्रिक ट्रैकिंग" : "Personalized Progress & Streak Tracking"}</span>
            </div>
          </div>

          <p className={styles.hint}>
            {t('auth.terms') || (isHindi ? "साइन इन करके आप हमारी सेवा की शर्तों और गोपनीयता नीति से सहमत होते हैं।" : "By continuing, you agree to our Terms of Service & Privacy Policy.")}
          </p>

          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>{t('auth.backHome') || (isHindi ? "मुख्य पृष्ठ पर लौटें" : "Return to Home")}</span>
          </Link>
        </div>

      </div>
    </main>
  );
}
