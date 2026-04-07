"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import s from '@/styles/SessionEngine.module.css';

export default function LiveStudyButton() {
  const router = useRouter();

  const handleCreateSession = () => {
    const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    toast.success("Creating live room...");
    router.push(`/live/${sessionId}?is_host=true`);
  };

  return (
    <div className={s.homeLiveCard} onClick={handleCreateSession}>
      <div className={s.liveIcon}>🚀</div>
      <div className="flex-1">
        <span className={s.tagBadge}>Collaborative</span>
        <h4 className={s.cardTitle}>Play Live with Friends</h4>
        <p className={s.cardSubtitle}>Sync quizzes in real-time.</p>
      </div>
      <div className={s.liveBadge}>LIVE</div>
    </div>
  );
}
