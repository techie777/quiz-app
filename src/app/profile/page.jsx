"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  Crown,
  Trophy,
  ArrowRight,
  History,
  CheckCircle2,
  Clock,
  Sparkles,
  Camera,
  Check,
  LogOut,
  AlertCircle,
  HelpCircle,
  Heart,
  Sun,
  Moon,
  ChevronDown,
  Layers,
  Award,
  Zap,
} from "lucide-react";
import styles from "@/styles/Profile.module.css";
import { useTier } from "@/context/TierContext";
import { useUI } from "@/context/UIContext";
import { useTheme } from "next-themes";
import { useMonetization } from "@/context/MonetizationContext";

export default function ProfilePage() {
  const { t, isHindi, language, confirmLanguageSelection } = useLanguage();
  const { tier } = useTier();
  const { isPro } = useMonetization();
  const { data: session, status } = useSession();
  const { engineTheme, updateEngineTheme, openTutorial } = useUI();
  const { theme, setTheme } = useTheme();
  const [mountedTheme, setMountedTheme] = useState(false);
  const router = useRouter();

  // Profile Form State
  const [profile, setProfile] = useState(null);
  const [nickname, setNickname] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(engineTheme || "indigo");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success"); // "success" | "error"

  // UI Interactive States
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [visibleAttemptsCount, setVisibleAttemptsCount] = useState(10);

  // History & Orders State
  const [attempts, setAttempts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [attemptFilter, setAttemptFilter] = useState("ALL"); // ALL | QUIZ_SET | MOCK_EXAM

  const isGuest = status === "unauthenticated";

  // 8 High Quality Preset Avatars
  const defaultAvatars = [
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%236366f1"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">🦊</text></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23f43f5e"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">🐼</text></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2310b981"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">🐸</text></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23f59e0b"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">🦁</text></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%238b5cf6"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">🦉</text></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ec4899"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">🦄</text></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230ea5e9"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">🚀</text></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23eab308"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">⚡</text></svg>`,
  ];

  const themes = [
    { id: "indigo", name: isHindi ? "क्लासिक इंडिगो" : "Classic Indigo", color: "#6366f1" },
    { id: "midnight", name: isHindi ? "मिडनाइट ऑरोरा" : "Midnight Aurora", color: "#a855f7" },
    { id: "sunset", name: isHindi ? "सनसेट फ्लेयर" : "Sunset Flare", color: "#f43f5e" },
    { id: "emerald", name: isHindi ? "एमराल्ड साइबर" : "Emerald Cyber", color: "#10b981" },
  ];

  useEffect(() => {
    setMountedTheme(true);
  }, []);

  // Fetch User Profile
  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isAdmin) {
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) {
            setProfile(data);
            setNickname(data.nickname || data.name || session?.user?.name || "");
            setAvatarPreview(data.avatar || data.image || session?.user?.image || "");
            const themeToSet = data.engineTheme || engineTheme || "indigo";
            setSelectedTheme(themeToSet);
            if (data.engineTheme) updateEngineTheme(data.engineTheme);
          }
        })
        .catch((err) => console.error("Failed to load profile:", err));
    } else if (status === "unauthenticated") {
      setNickname(isHindi ? "अतिथि उपयोगकर्ता" : "Guest Explorer");
      setAvatarPreview("/default-avatar.svg");
    }
  }, [status, session, engineTheme, isHindi]);

  // Fetch Attempt History and Orders
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

    if (status === "authenticated") {
      fetch("/api/user/orders")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.subscriptions) {
            setOrders(data.subscriptions);
          }
        })
        .catch(() => {});
    }
  }, [session, status]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
      setMsg("");
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = (url) => {
    setAvatarPreview(url);
    setMsg("");
  };

  const handleSave = async () => {
    if (isGuest) {
      signIn("google");
      return;
    }

    setSaving(true);
    setMsg("");

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
        setMsgType("success");
        setMsg(isHindi ? "प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!" : "Profile updated successfully!");
        setProfile(data);
        updateEngineTheme(selectedTheme);
        setTimeout(() => setMsg(""), 4000);
      } else {
        setMsgType("error");
        setMsg(data.error || (isHindi ? "प्रोफ़ाइल अपडेट करने में त्रुटि।" : "Failed to update profile"));
      }
    } catch (error) {
      setMsgType("error");
      setMsg(isHindi ? "कनेक्शन त्रुटि। कृपया पुनः प्रयास करें।" : "Connection error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    updateEngineTheme(themeId);
  };

  // Calculations for Stats
  const completedCount = attempts.filter((a) => a.isComplete).length;
  const totalScore = attempts.reduce((acc, a) => acc + (Number(a.score) || 0), 0);
  const completionRate = attempts.length > 0 ? Math.round((completedCount / attempts.length) * 100) : 0;
  const isDark = mountedTheme && theme === "dark";

  // Check if dirty (changes waiting to save)
  const originalNickname = profile?.nickname || profile?.name || session?.user?.name || "";
  const originalAvatar = profile?.avatar || profile?.image || session?.user?.image || "";
  const originalEngineTheme = profile?.engineTheme || "indigo";
  const hasChanges =
    !isGuest &&
    (nickname !== originalNickname ||
      avatarPreview !== originalAvatar ||
      selectedTheme !== originalEngineTheme);

  // Filtered Attempts
  const filteredAttempts = attempts.filter((a) => attemptFilter === "ALL" || a.type === attemptFilter);
  const visibleAttempts = filteredAttempts.slice(0, visibleAttemptsCount);

  // Loading Screen
  if (status === "loading") {
    return (
      <div className={styles.profilePage}>
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-500">
            {isHindi ? "प्रोफ़ाइल लोड हो रही है..." : "Loading profile..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      {/* 1. HERO IDENTITY CARD */}
      <div className={styles.heroCard}>
        <div className={styles.heroBackgroundDecoration} />

        <div className={styles.heroContent}>
          <div className={styles.identityRow}>
            {/* Avatar with Camera Overlay */}
            <div className={styles.avatarWrapper}>
              <img
                src={avatarPreview || "/default-avatar.svg"}
                alt="Avatar"
                className={styles.avatarImg}
              />
              {!isGuest && (
                <label className={styles.avatarCameraBadge} title={isHindi ? "फ़ोटो बदलें" : "Upload photo"}>
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                </label>
              )}
            </div>

            {/* User Meta Information */}
            <div className={styles.userInfo}>
              <div className={styles.badgeRow}>
                <span className={styles.tierBadge}>
                  {tier === "students"
                    ? (isHindi ? "विद्यार्थी / Student" : "Student Tier")
                    : tier === "kids"
                    ? (isHindi ? "किड्स / Kids" : "Kids Tier")
                    : (isHindi ? "एक्सप्लोरर / Explorer" : "General Explorer")}
                </span>

                {isPro && (
                  <span className={styles.proBadge}>
                    <Crown size={13} />
                    PRO
                  </span>
                )}
              </div>

              {/* Nickname Input & Save */}
              <div className={styles.nicknameRow}>
                {!isGuest ? (
                  <>
                    <input
                      id="profile-nickname-input"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={isHindi ? "अपना नाम लिखें" : "Enter your nickname"}
                      className={styles.nicknameInput}
                      maxLength={32}
                    />
                    {hasChanges && (
                      <button
                        id="save-profile-btn"
                        className={styles.saveNicknameBtn}
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{isHindi ? "सेव..." : "Saving..."}</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            <span>{isHindi ? "सेव करें" : "Save"}</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <span className={styles.nicknameInput} style={{ border: "none", padding: 0 }}>
                    {isHindi ? "अतिथि उपयोगकर्ता" : "Guest Explorer"}
                  </span>
                )}
              </div>

              {/* Email / Sign In Prompt */}
              {!isGuest ? (
                <div className={styles.userEmail}>
                  <span>✉️</span>
                  <span>{profile?.email || session?.user?.email || "Signed in"}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-medium">
                  {isHindi
                    ? "क्विज़ रिकॉर्ड्स व रैंकिंग सुरक्षित रखने के लिए साइन इन करें"
                    : "Sign in to save test attempts, track streaks & rank on leaderboard"}
                </div>
              )}

              {/* Avatar Preset Drawer Toggle */}
              {!isGuest && (
                <button
                  type="button"
                  className={styles.avatarPresetToggleBtn}
                  onClick={() => setShowPresetPicker(!showPresetPicker)}
                >
                  <span>🎭</span>
                  <span>{showPresetPicker ? (isHindi ? "अवतार बंद करें" : "Hide Avatars") : (isHindi ? "कूल अवतार चुनें" : "Choose Avatar Preset")}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${showPresetPicker ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Expandable Avatar Presets */}
          {showPresetPicker && !isGuest && (
            <div className={styles.avatarPresetsContainer}>
              <div className={styles.presetGridTitle}>
                {isHindi ? "डिफ़ॉल्ट अवतार चुनें" : "Select a fun default avatar"}
              </div>
              <div className={styles.avatarPresetsGrid}>
                {defaultAvatars.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Avatar preset ${idx + 1}`}
                    onClick={() => handleSelectPresetAvatar(url)}
                    className={`${styles.presetAvatarItem} ${avatarPreview === url ? styles.active : ""}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Feedback Toast */}
          {msg && (
            <div
              className={`${styles.statusMessage} ${
                msgType === "success" ? styles.statusSuccess : styles.statusError
              }`}
            >
              {msgType === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{msg}</span>
            </div>
          )}

          {/* Guest Sign In Callout */}
          {isGuest && (
            <div className="pt-2">
              <button
                id="profile-guest-signin-btn"
                className={styles.signInGoogleBtn}
                onClick={() => signIn("google")}
              >
                <span>🔑</span>
                <span>{isHindi ? "Google से साइन इन करें" : "Sign in with Google"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. PERFORMANCE & PROGRESS STATS GRID */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🎯</span>
          <div className={styles.statValue}>{attempts.length}</div>
          <div className={styles.statLabel}>{isHindi ? "कुल प्रयास" : "Total Quizzes"}</div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>✅</span>
          <div className={styles.statValue}>{completedCount}</div>
          <div className={styles.statLabel}>{isHindi ? "सफलतापूर्वक पूर्ण" : "Completed"}</div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>⚡</span>
          <div className={styles.statValue}>{totalScore}</div>
          <div className={styles.statLabel}>{isHindi ? "कुल अंक (XP)" : "Total XP"}</div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📈</span>
          <div className={styles.statValue}>{completionRate}%</div>
          <div className={styles.statLabel}>{isHindi ? "पूर्णता दर" : "Completion"}</div>
        </div>
      </div>

      {/* 3. SETTINGS & APPEARANCE HUB */}
      <div className={styles.glassCard}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionTitle}>
              <span>⚙️</span>
              <span>{isHindi ? "प्राथमिकताएं व सेटिंग्स" : "Preferences & Appearance"}</span>
            </div>
            <div className={styles.sectionSubtitle}>
              {isHindi ? "भाषा, डार्क मोड और क्विज़ इंजन थीम कस्टमाइज़ करें" : "Customize language, dark mode & engine appearance"}
            </div>
          </div>
        </div>

        <div className={styles.settingsGrid}>
          {/* Language Selection */}
          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>{isHindi ? "भाषा / Language" : "Language / भाषा"}</span>
            <div className={styles.segmentedControl}>
              <button
                type="button"
                id="profile-lang-en-btn"
                className={`${styles.segmentedBtn} ${language === "en" ? styles.active : ""}`}
                onClick={() => confirmLanguageSelection("en")}
              >
                <span>English</span>
                {language === "en" && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
              </button>
              <button
                type="button"
                id="profile-lang-hi-btn"
                className={`${styles.segmentedBtn} ${language === "hi" ? styles.active : ""}`}
                onClick={() => confirmLanguageSelection("hi")}
              >
                <span>हिन्दी</span>
                {language === "hi" && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
              </button>
            </div>
          </div>

          {/* Theme Mode Toggle (Light / Dark) */}
          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>{isHindi ? "डिस्प्ले मोड" : "Display Theme"}</span>
            <div className={styles.segmentedControl}>
              <button
                type="button"
                id="profile-theme-light-btn"
                className={`${styles.segmentedBtn} ${!isDark ? styles.active : ""}`}
                onClick={() => setTheme("light")}
              >
                <Sun size={15} className="text-amber-500" />
                <span>{isHindi ? "लाइट" : "Light"}</span>
                {!isDark && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
              </button>
              <button
                type="button"
                id="profile-theme-dark-btn"
                className={`${styles.segmentedBtn} ${isDark ? styles.active : ""}`}
                onClick={() => setTheme("dark")}
              >
                <Moon size={15} className="text-indigo-400" />
                <span>{isHindi ? "डार्क" : "Dark"}</span>
                {isDark && <Check size={14} className="text-indigo-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Engine Theme & Live Mockup */}
        <div className={styles.themeSection}>
          <div className="flex items-center justify-between mb-2">
            <span className={styles.settingLabel}>{isHindi ? "क्विज़ इंजन थीम" : "Quiz Engine Theme"}</span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
              {isHindi ? "लाइव प्रीव्यू" : "Live Preview"}
            </span>
          </div>

          {/* Mini Player Theme Preview */}
          <div
            className={styles.previewContainer}
            style={{
              background:
                selectedTheme === "midnight"
                  ? "#0f172a"
                  : selectedTheme === "sunset"
                  ? "#fff1f2"
                  : selectedTheme === "emerald"
                  ? "#ecfdf5"
                  : "#f8fafc",
            }}
          >
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
                <div
                  className={`${styles.previewOption} ${styles.previewOptionSelected}`}
                  style={{ color: themes.find((t) => t.id === selectedTheme)?.color }}
                />
                <div className={styles.previewOption} />
                <div className={styles.previewOption} />
              </div>
            </div>
          </div>

          {/* Theme Option Swatches */}
          <div className={styles.themeGrid}>
            {themes.map((t) => (
              <div
                key={t.id}
                id={`engine-theme-${t.id}`}
                className={`${styles.themeOption} ${selectedTheme === t.id ? styles.active : ""}`}
                onClick={() => handleThemeSelect(t.id)}
              >
                <div className={styles.themeSwatch} style={{ backgroundColor: t.color }} />
                <span className={styles.themeName}>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. LEARNING & COMMUNITY ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Leaderboard Teaser Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-slate-800/80 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-col justify-between gap-4 text-left">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
              🏆
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {isHindi ? "ग्लोबल लीडरबोर्ड व 1v1 बैटल" : "Global Leaderboard & 1v1 Arena"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isHindi
                  ? "टॉप रैंकर्स के साथ अपनी रैंक देखें और दोस्तों को लाइव क्विज़ में चुनौती दें।"
                  : "Compare your XP with top scorers and challenge friends to live quiz duels."}
              </p>
            </div>
          </div>
          <Link
            href="/leaderboard"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <span>{isHindi ? "लीडरबोर्ड देखें" : "View Leaderboard"}</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Tutorial & Favourites Hub */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-4 text-left">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md shrink-0">
              ✨
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {isHindi ? "क्विज़वेब ऑनबोर्डिंग टूर" : "How QuizWeb Works"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isHindi
                  ? "मॉक टेस्ट्स, ई-बुक रीडर और लाइव एरिना के सभी फीचर्स का 5-स्टेप गाइड देखें।"
                  : "Explore the 5-step interactive tour covering Mock Tests, Book Reader & Arena."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openTutorial}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all shadow-2xs"
            >
              <Sparkles size={13} />
              <span>{isHindi ? "गाइड टूर देखें" : "Take Tour"}</span>
            </button>
            <Link
              href="/my-favourites"
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all shadow-2xs"
            >
              <Heart size={13} />
              <span>{isHindi ? "पसंदीदा" : "Favourites"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 5. UNIFIED ATTEMPT HISTORY SECTION */}
      <div className={styles.glassCard}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionTitle}>
              <History size={18} className="text-indigo-600 dark:text-indigo-400" />
              <span>{isHindi ? "प्रयास इतिहास व प्रगति" : "Attempt History & Progress"}</span>
            </div>
            <div className={styles.sectionSubtitle}>
              {isHindi
                ? "आपके द्वारा हल किए गए सामान्य क्विज़ सेट्स और सरकारी परीक्षा मॉक टेस्ट्स"
                : "All your general quiz sets and full-length exam mock tests in one place"}
            </div>
          </div>

          {/* Filter Pills */}
          <div className={styles.filterTabs}>
            <button
              type="button"
              onClick={() => {
                setAttemptFilter("ALL");
                setVisibleAttemptsCount(10);
              }}
              className={`${styles.filterTabBtn} ${attemptFilter === "ALL" ? styles.active : ""}`}
            >
              {isHindi ? "सभी" : "All"} ({attempts.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setAttemptFilter("QUIZ_SET");
                setVisibleAttemptsCount(10);
              }}
              className={`${styles.filterTabBtn} ${attemptFilter === "QUIZ_SET" ? styles.active : ""}`}
            >
              🎯 {isHindi ? "क्विज़" : "Quizzes"} ({attempts.filter((a) => a.type === "QUIZ_SET").length})
            </button>
            <button
              type="button"
              onClick={() => {
                setAttemptFilter("MOCK_EXAM");
                setVisibleAttemptsCount(10);
              }}
              className={`${styles.filterTabBtn} ${attemptFilter === "MOCK_EXAM" ? styles.active : ""}`}
            >
              🏛️ {isHindi ? "मॉक टेस्ट" : "Mocks"} ({attempts.filter((a) => a.type === "MOCK_EXAM").length})
            </button>
          </div>
        </div>

        {/* History List */}
        {loadingAttempts ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
            {isHindi ? "प्रयास लोड हो रहे हैं..." : "Loading attempt history..."}
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <div className={styles.emptyTitle}>
              {isHindi ? "कोई प्रयास रिकॉर्ड नहीं मिला" : "No attempt history found yet"}
            </div>
            <div className={styles.emptySubtitle}>
              {isHindi
                ? "क्विज़ हब या मॉक टेस्ट से अभ्यास शुरू करें!"
                : "Start practicing quizzes or full mock tests to track your detailed growth here!"}
            </div>
            <Link
              href="/quizzes"
              className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-500 transition-all"
            >
              {isHindi ? "क्विज़ शुरू करें →" : "Start a Quiz →"}
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.attemptList}>
              {visibleAttempts.map((item) => (
                <Link key={item.id} href={item.href || "#"} className={styles.attemptItem}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={styles.attemptEmoji}>{item.emoji || "🎯"}</div>
                    <div className={styles.attemptInfo}>
                      <div className={styles.attemptMeta}>
                        <span
                          className={`${styles.attemptBadge} ${
                            item.type === "QUIZ_SET" ? styles.attemptBadgeQuiz : styles.attemptBadgeMock
                          }`}
                        >
                          {isHindi ? item.typeLabelHi || "क्विज़" : item.typeLabel || "Quiz"}
                        </span>
                        <span className={styles.attemptDate}>
                          {item.date
                            ? new Date(item.date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                      <div className={styles.attemptTitle}>{item.title}</div>
                    </div>
                  </div>

                  <div className={styles.attemptRight}>
                    <div className={styles.attemptScore}>
                      <div className={styles.scoreValue}>{item.scoreDisplay || `${item.score || 0} Pts`}</div>
                      <div className={styles.statusComplete}>
                        <CheckCircle2 size={11} />
                        <span>{item.isComplete ? (isHindi ? "पूर्ण" : "Done") : `${item.progress || 0}%`}</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination / Load More */}
            {filteredAttempts.length > visibleAttemptsCount && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setVisibleAttemptsCount((prev) => prev + 10)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  {isHindi
                    ? `और देखें (${filteredAttempts.length - visibleAttemptsCount} शेष)`
                    : `Show More (${filteredAttempts.length - visibleAttemptsCount} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 6. PRO MEMBERSHIP & ORDERS */}
      <div className={styles.glassCard}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionTitle}>
              <span>👑</span>
              <span>{isHindi ? "प्रो सदस्यता व ऑर्डर रसीदें" : "Pro Membership & Orders"}</span>
            </div>
            <div className={styles.sectionSubtitle}>
              {isHindi ? "आपकी सक्रिय सदस्यता और भुगतान रसीदें" : "Your active passes and payment receipts"}
            </div>
          </div>
          <Link
            href="/pro"
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 transition-colors shrink-0"
          >
            {isPro ? (isHindi ? "प्लान प्रबंधित करें" : "Manage Plans") : (isHindi ? "गो प्रो (विज्ञापन मुक्त)" : "Get Pro Pass")}
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {isHindi
                ? "कोई सक्रिय प्रो प्लान या पूर्व भुगतान नहीं मिला।"
                : "No active Pro pass or past orders found."}
            </p>
            <Link
              href="/pro"
              className="inline-block mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {isHindi ? "सभी 4 मॉड्यूल के लिए प्रो प्लान देखें →" : "View Pro Plans for all modules →"}
            </Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map((o) => (
              <div key={o._id || o.id} className={styles.orderCard}>
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                    <span>{o.planName || "QuizWeb Pro Pass"}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-black uppercase">
                      {o.status || "Active"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(o.createdAt || o.startDate).toLocaleDateString()} • Ref:{" "}
                    {String(o.orderId || o.paymentId).slice(0, 16)}
                  </div>
                </div>
                <div className="text-right font-black text-slate-900 dark:text-white text-sm">
                  ₹{o.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. SIGN OUT ACTION (AUTHENTICATED ONLY) */}
      {!isGuest && (
        <div className="pt-2">
          <button
            id="profile-signout-trigger-btn"
            type="button"
            className={styles.signOutTriggerBtn}
            onClick={() => setShowSignOutModal(true)}
          >
            <LogOut size={16} />
            <span>{isHindi ? "खाता साइन आउट करें" : "Sign Out of Account"}</span>
          </button>
        </div>
      )}

      {/* SAFE SIGN-OUT CONFIRMATION MODAL */}
      {showSignOutModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSignOutModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIconWrapper}>
              <LogOut size={26} />
            </div>
            <div className={styles.modalTitle}>
              {isHindi ? "साइन आउट करना चाहते हैं?" : "Sign out of QuizWeb?"}
            </div>
            <div className={styles.modalDesc}>
              {isHindi
                ? "आपका वर्तमान सत्र समाप्त हो जाएगा। अगली बार अभ्यास जारी रखने के लिए पुनः साइन इन करना होगा।"
                : "Your active session will be closed. You will need to sign in again to access personal progress."}
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                id="cancel-signout-btn"
                className={styles.modalCancelBtn}
                onClick={() => setShowSignOutModal(false)}
              >
                {isHindi ? "रद्द करें" : "Cancel"}
              </button>
              <button
                type="button"
                id="confirm-signout-btn"
                className={styles.modalConfirmBtn}
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                {isHindi ? "हाँ, साइन आउट करें" : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
