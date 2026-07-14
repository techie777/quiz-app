import React from 'react';
import styles from '@/styles/Forum.module.css';

export default function ForumUserAvatar({ user, size = 40 }) {
  if (!user) return null;

  const isPro = user.isPro;
  const badgeText = user.proBadge || "PRO";

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div 
        className={isPro ? styles.goldenCircle : ""} 
        style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <img
          src={user.image || user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`}
          alt={user.name || "User"}
          width={size}
          height={size}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`;
          }}
        />
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {user.name || "Anonymous"}
          </span>
          {isPro && (
            <span className={styles.proBadge}>{badgeText}</span>
          )}
        </div>
      </div>
    </div>
  );
}
