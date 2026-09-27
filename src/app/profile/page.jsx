"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Crown, Trophy, ArrowRight, History, CheckCircle2, Clock, FileText } from "lucide-react";
import styles from "@/styles/Profile.module.css";
import { useTier } from "@/context/TierContext";

import { useUI } from "@/context/UIContext";

export default function ProfilePage() {
  const { t, isHindi } = useLanguage();
  const { tier } = useTier();
  const { data: session, status } = useSession();
  const { engineTheme, updateEngineTheme } = useUI();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [nickname, setNickname] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("indigo");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [attemptFilter, setAttemptFilter] = useState("ALL"); // ALL, QUIZ_SET, MOCK_EXAM

  const defaultAvatars = [
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%236366f1"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">🦊</text></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23f43f5e"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">🐼</text></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2310b981"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">🐸</text></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23f59e0b"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">🦁</text></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%238b5cf6"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">🦉</text></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ec4899"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">🦄</text></svg>`
  ];

  const patternClasses = {
    indigo: "theme-pattern-indigo",
    midnight: "theme-pattern-midnight",
    sunset: "theme-pattern-sunset",
    emerald: "theme-pattern-emerald",
  };

  const themes = [
    { id: "indigo", name: "Classic Indigo", color: "#6366f1" },
    { id: "midnight", name: "Midnight Aurora", color: "#a855f7" },
    { id: "sunset", name: "Sunset Flare", color: "#f43f5e" },
    { id: "emerald", name: "Emerald Cyber", color: "#10b981" },
  ];

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated" && !session?.user?.isAdmin) {
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data) => {
          setProfile(data);
          setNickname(data.nickname || data.name || "");
          setAvatarPreview(data.avatar || data.image || "");
          setSelectedTheme(data.engineTheme || "indigo");
          if (data.engineTheme) updateEngineTheme(data.engineTheme);
        });
    }
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/user/attempts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.attempts) {
          setAttempts(data.attempts);
        }
      })
      .catch((err) => console.error("Failed to load attempts:", err))
      .finally(() => setLoadingAttempts(false));
  }, [session]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    
    // Only send avatar if it has actually changed from what we loaded
    const currentAvatar = profile?.avatar || profile?.image || "";
    const hasAvatarChanged = avatarPreview !== currentAvatar;

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          avatar: hasAvatarChanged ? avatarPreview : undefined,
          engineTheme: selectedTheme,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMsg(t('quizzes.profile.toasts.updated') || "Profile updated!");
        setProfile(data); 
        updateEngineTheme(selectedTheme);
      } else {
        setMsg(data.error || t('quizzes.profile.toasts.failed') || "Failed to update profile");
      }
    } catch (error) {
      setMsg(t('quizzes.profile.toasts.error') || "Connection error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
  };

  if (status === "loading" || !profile) {
    return <div className={styles.page}><p>Loading...</p></div>;
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.card} glass-card`}>
        <div className="flex items-center gap-3 mb-4">
          <h1 className={styles.title}>{t('quizzes.profile.title')}</h1>
          {session?.user?.isPro && (
            <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
              <Crown size={14} className="text-amber-500" />
              Pro Member
            </div>
          )}
        </div>
        <div className={styles.avatarSection}>
          <img
            src={avatarPreview || "/default-avatar.svg"}
            alt="Avatar"
            className={styles.avatar}
          />
          <label className={styles.uploadBtn}>
            {t('quizzes.profile.changePhoto')}
            <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
          </label>
        </div>

        <div className={styles.defaultAvatarsSection} style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <p style={{ width: '100%', textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>OR CHOOSE A COOL DEFAULT AVATAR</p>
          {defaultAvatars.map((url, idx) => (
            <img 
              key={idx}
              src={url} 
              alt="Default Avatar"
              onClick={() => setAvatarPreview(url)}
              style={{
                width: '40px', 
                height: '40px', 
                cursor: 'pointer',
                borderRadius: '50%',
                border: avatarPreview === url ? '2px solid #6366f1' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            />
          ))}
        </div>

        <div className={styles.field}>
          <label>{t('auth.email')}</label>
          <input value={profile.email} disabled className={styles.input} />
        </div>
        <div className={styles.field}>
          <label>{t('quizzes.profile.nickname')}</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className={styles.input}
            placeholder={t('quizzes.profile.nicknamePlaceholder')}
          />
        </div>

        <div className={styles.themeSection}>
          <label>{t('quizzes.profile.theme')}</label>
          <div className="flex items-center gap-2 mb-3">
             <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">{t('quizzes.profile.livePreview')}</span>
             <p className="text-[10px] text-slate-400 font-medium">{t('quizzes.profile.themeDesc')}</p>
          </div>

          {/* Theme Preview Mockup */}
          <div className={`${styles.previewContainer} ${patternClasses[selectedTheme] || patternClasses.indigo} ${selectedTheme === 'midnight' ? 'text-white' : ''}`}>
             <div className={styles.previewMiniPlayer}>
                <div className={styles.previewHeader}>
                   <div className={styles.previewDot} />
                   <div className={styles.previewLine} />
                   <div className={styles.previewDot} />
                </div>
                <div className={styles.previewQuestion} />
                <div className={styles.previewQuestionShort} />
                <div className={styles.previewOptions}>
                   <div className={styles.previewOption} />
                   <div className={`${styles.previewOption} ${styles.previewOptionSelected}`} style={{ color: themes.find(t => t.id === selectedTheme)?.color }} />
                   <div className={styles.previewOption} />
                   <div className={styles.previewOption} />
                </div>
             </div>
          </div>

          <div className={styles.themeGrid}>
            {themes.map((t) => (
              <div 
                key={t.id} 
                className={`${styles.themeOption} ${selectedTheme === t.id ? styles.active : ""}`}
                onClick={() => handleThemeSelect(t.id)}
              >
                <div className={styles.themeSwatch} style={{ backgroundColor: t.color }} />
                <span className={styles.themeName}>{t.name}</span>
              </div>
            ))}
          </div>
        </div>

        {msg && <div className={styles.msg}>{msg}</div>}

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? t('common.saving') : t('common.saveChanges')}
        </button>

        <div className={styles.quickLinks}>
          <Link href="/my-favourites" className={styles.quickLink}>
            ❤️ {t('quizzes.profile.favourites')}
          </Link>
        </div>

        {/* Leaderboard / Friend Challenges Stub Card (Requirement 5) */}
        <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-sky-50/80 dark:from-slate-800/80 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {tier === "students" 
                    ? (isHindi ? "कक्षा लीडरबोर्ड व फ्रेंड चैलेंज" : "Class Leaderboard & Friend Challenge")
                    : (isHindi ? "लीडरबोर्ड व चैलेंज" : "Leaderboards & Challenges")}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                  {isHindi ? "शीघ्र आ रहा है" : "Leaderboards coming soon"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                {tier === "students"
                  ? (isHindi 
                      ? "अपने बोर्ड व कक्षा के सहपाठियों के साथ XP स्कोर की तुलना करें और 1v1 क्विज़ बैटल खेलें।" 
                      : "Compete with classmates across your board, compare XP scores, and challenge friends to 1v1 quiz duels.")
                  : (isHindi
                      ? "ग्लोबल रैंकिंग और दोस्तों के साथ ज्ञान मुकाबले में भाग लें।"
                      : "Climb the rankings and test your speed in upcoming multiplayer challenge duels.")}
              </p>
            </div>
          </div>

          <Link
            href="/leaderboard"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black text-center shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span>{isHindi ? "लीडरबोर्ड देखें" : "View Leaderboard"}</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Unified Attempt History Section (Requirement 3) */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <History size={18} className="text-indigo-600 dark:text-indigo-400" />
                <span>{isHindi ? "प्रयास इतिहास व प्रगति" : "Attempt History & Progress"}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHindi
                  ? "आपके द्वारा हल किए गए सामान्य क्विज़ सेट्स और सरकारी परीक्षा मॉक टेस्ट।"
                  : "Track all your general quiz sets and government exam mock tests in one place."}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setAttemptFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  attemptFilter === "ALL"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {isHindi ? "सभी" : "All"} ({attempts.length})
              </button>
              <button
                type="button"
                onClick={() => setAttemptFilter("QUIZ_SET")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  attemptFilter === "QUIZ_SET"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                🎯 {isHindi ? "क्विज़" : "Quizzes"} ({attempts.filter((a) => a.type === "QUIZ_SET").length})
              </button>
              <button
                type="button"
                onClick={() => setAttemptFilter("MOCK_EXAM")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  attemptFilter === "MOCK_EXAM"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                🏛️ {isHindi ? "मॉक टेस्ट" : "Mocks"} ({attempts.filter((a) => a.type === "MOCK_EXAM").length})
              </button>
            </div>
          </div>

          {/* List of attempts */}
          {loadingAttempts ? (
            <div className="py-8 text-center text-xs font-bold text-slate-400 animate-pulse">
              {isHindi ? "प्रयास लोड हो रहे हैं..." : "Loading attempt history..."}
            </div>
          ) : attempts.filter((a) => attemptFilter === "ALL" || a.type === attemptFilter).length === 0 ? (
            <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
              <span className="text-2xl mb-1 block">📝</span>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isHindi ? "कोई प्रयास रिकॉर्ड नहीं मिला।" : "No quiz or mock attempts found yet."}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isHindi ? "क्विज़ हब या मॉक टेस्ट से अभ्यास शुरू करें!" : "Start exploring quizzes or mock tests to track your progress here!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {attempts
                .filter((a) => attemptFilter === "ALL" || a.type === attemptFilter)
                .slice(0, 15)
                .map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-indigo-400/40 hover:shadow-md transition-all gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-sm">
                        {item.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              item.type === "QUIZ_SET"
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/60"
                            }`}
                          >
                            {isHindi ? item.typeLabelHi : item.typeLabel}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">
                            {new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {item.scoreDisplay}
                        </div>
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                          <CheckCircle2 size={11} />
                          <span>{item.isComplete ? (isHindi ? "पूर्ण" : "Completed") : `${item.progress}%`}</span>
                        </div>
                      </div>
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
