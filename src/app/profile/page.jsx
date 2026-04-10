"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/Profile.module.css";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [nickname, setNickname] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated" && !session?.user?.isAdmin) {
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data) => {
          setProfile(data);
          setNickname(data.nickname || data.name || "");
          setAvatarPreview(data.avatar || data.image || "");
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
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname,
        avatar: avatarPreview !== profile?.image ? avatarPreview : undefined,
      }),
    });
    if (res.ok) setMsg("Profile updated!");
    else setMsg("Failed to update profile");
    setSaving(false);
  };

  if (status === "loading" || !profile) {
    return <div className={styles.page}><p>Loading...</p></div>;
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.card} glass-card`}>
        <h1 className={styles.title}>My Profile</h1>

        <div className={styles.avatarSection}>
          <img
            src={avatarPreview || "/default-avatar.png"}
            alt="Avatar"
            className={styles.avatar}
          />
          <label className={styles.uploadBtn}>
            Change Photo
            <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
          </label>
        </div>

        <div className={styles.field}>
          <label>Email</label>
          <input value={profile.email} disabled className={styles.input} />
        </div>

        <div className={styles.field}>
          <label>Nickname</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className={styles.input}
            placeholder="Enter a nickname"
          />
        </div>

        {msg && <div className={styles.msg}>{msg}</div>}

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <div className={styles.quickLinks}>
          <Link href="/my-favourites" className={styles.quickLink}>
            ❤️ My Favourites / Notes
          </Link>
        </div>
      </div>
    </div>
  );
}
