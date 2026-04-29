"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/styles/Profile.module.css";

import { useUI } from "@/context/UIContext";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  const { engineTheme, updateEngineTheme } = useUI();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [nickname, setNickname] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("indigo");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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
        setMsg(t('profile.toasts.updated') || "Profile updated!");
        setProfile(data); 
        updateEngineTheme(selectedTheme);
      } else {
        setMsg(data.error || t('profile.toasts.failed') || "Failed to update profile");
      }
    } catch (error) {
      setMsg(t('profile.toasts.error') || "Connection error. Please try again.");
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
        <h1 className={styles.title}>{t('profile.title')}</h1>
        <div className={styles.avatarSection}>
          <img
            src={avatarPreview || "/default-avatar.svg"}
            alt="Avatar"
            className={styles.avatar}
          />
          <label className={styles.uploadBtn}>
            {t('profile.changePhoto')}
            <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
          </label>
        </div>

        <div className={styles.field}>
          <label>{t('auth.email')}</label>
          <input value={profile.email} disabled className={styles.input} />
        </div>
        <div className={styles.field}>
          <label>{t('profile.nickname')}</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className={styles.input}
            placeholder={t('profile.nicknamePlaceholder')}
          />
        </div>

        <div className={styles.themeSection}>
          <label>{t('profile.theme')}</label>
          <div className="flex items-center gap-2 mb-3">
             <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">{t('profile.livePreview')}</span>
             <p className="text-[10px] text-slate-400 font-medium">{t('profile.themeDesc')}</p>
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
            ❤️ {t('profile.favourites')}
          </Link>
        </div>
      </div>
    </div>
  );
}
