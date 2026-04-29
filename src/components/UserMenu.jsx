"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useUI } from "@/context/UIContext";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/styles/Header.module.css";

export default function UserMenu() {
  const { data: session } = useSession();
  const { openOnboarding } = useUI();
  const { t, mounted } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [avatar, setAvatar] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    if (session?.user && !session.user.isAdmin) {
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data.avatar || data.image) {
            setAvatar(data.avatar || data.image);
          }
        })
        .catch(() => {});
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [session]);

  if (!session) return null;

  return (
    <div className={styles.userMenuWrapper} ref={menuRef}>
      <button 
        className={styles.avatarButton} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.avatarCircle}>
          {avatar ? (
            <Image 
              src={avatar} 
              alt="Profile" 
              width={36} 
              height={36} 
              className={styles.avatarImg}
              unoptimized={avatar.startsWith('data:')} // Allow data URLs for immediate local feedback
            />
          ) : (
            <span className={styles.avatarInitial}>
              {session.user.name?.[0]?.toUpperCase() || "U"}
            </span>
          )}
        </div>
        <span className={styles.desktopName}>{session.user.name}</span>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>▾</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={styles.userDropdown}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.dropdownHeader}>
              <p className={styles.dropdownName}>{session.user.name}</p>
              <p className={styles.dropdownEmail}>{session.user.email}</p>
            </div>

            <div className={styles.dropdownDivider} />

            <ul className={styles.dropdownList}>
              {session.user.isAdmin && (
                <li>
                  <Link href="/admin" className={styles.dropdownLink} onClick={() => setIsOpen(false)}>
                    <span className={styles.menuIcon}>🛠️</span> {mounted ? t('nav.userMenu.admin') : 'Admin Dashboard'}
                  </Link>
                </li>
              )}
              
              {!session.user.isAdmin && (
                <>
                  <li>
                    <Link href="/profile" className={styles.dropdownLink} onClick={() => setIsOpen(false)}>
                      <span className={styles.menuIcon}>👤</span> {mounted ? t('nav.userMenu.profile') : 'My Profile'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/my-favourites" className={styles.dropdownLink} onClick={() => setIsOpen(false)}>
                      <span className={styles.menuIcon}>❤️</span> {mounted ? t('nav.userMenu.favorites') : 'My Favourites'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/school-study/dashboard" className={styles.dropdownLink} onClick={() => setIsOpen(false)}>
                      <span className={styles.menuIcon}>📊</span> {mounted ? t('nav.userMenu.learning') : 'Learning Progress'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/leaderboard" className={styles.dropdownLink} onClick={() => setIsOpen(false)}>
                      <span className={styles.menuIcon}>🏆</span> {mounted ? t('nav.userMenu.leaderboard') : 'Global Leaderboard'}
                    </Link>
                  </li>
                  <li>
                    <button 
                      className={styles.dropdownLink} 
                      onClick={() => {
                        setIsOpen(false);
                        openOnboarding();
                      }}
                    >
                      <span className={styles.menuIcon}>🎯</span> {mounted ? t('nav.userMenu.interests') : 'Manage Interests'}
                    </button>
                  </li>
                </>
              )}
            </ul>

            <div className={styles.dropdownDivider} />

            <div className={styles.signOutSection}>
              {!showSignOutConfirm ? (
                <button 
                  className={styles.dropdownSignOut}
                  onClick={() => setShowSignOutConfirm(true)}
                >
                  <span className={styles.menuIcon}>🚪</span> {mounted ? t('nav.userMenu.signOut') : 'Sign Out'}
                </button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={styles.confirmSection}
                >
                  <p className={styles.confirmText}>{mounted ? t('nav.userMenu.confirmSignOut') : 'Are you sure?'}</p>
                  <div className={styles.confirmButtons}>
                    <button 
                      className={styles.confirmBtn}
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      {mounted ? t('nav.userMenu.yes') : 'Yes, Sign Out'}
                    </button>
                    <button 
                      className={styles.cancelBtn}
                      onClick={() => setShowSignOutConfirm(false)}
                    >
                      {mounted ? t('nav.userMenu.cancel') : 'Cancel'}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
