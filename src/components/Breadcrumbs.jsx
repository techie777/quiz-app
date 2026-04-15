"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { useQuiz } from '@/context/QuizContext';
import { useUI } from '@/context/UIContext';
import styles from '@/styles/Breadcrumbs.module.css';

const Breadcrumbs = () => {
  const pathname = usePathname();
  const { quizzes } = useData();
  const { selectedSetIndex, quizId } = useQuiz();
  const uiContext = useUI();
  const isMobileMenuOpen = uiContext?.isMobileMenuOpen || false;  
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handleFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  // Don't show breadcrumbs on the home page, admin routes, or when fullscreen/mobile menu is open
  if (pathname === '/' || pathname?.startsWith('/admin') || pathname?.includes('/mock-tests/paper/') || isMobileMenuOpen || isFullscreen) return null;

  const pathSegments = pathname.split('/').filter((segment) => segment !== '');

  const breadcrumbs = [];
  
  pathSegments.forEach((segment, index) => {
    // Skip "category", "quiz", and "practice" segments to keep breadcrumbs clean
    if (segment === 'category' || segment === 'quiz' || segment === 'practice') return;

    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    let label = segment;
    let finalHref = href;

    // School Study Specific Handling
    if (pathSegments[0] === 'school-study') {
      if (segment === 'school-study') {
        label = 'School Study';
      } else if (segment.length === 24) {
        // It's likely a MongoDB ID (Chapter/Board/Subject)
        // For now, capitalize it or skip linking if we don't have the context
        // Ideally we'd fetch the name, but to fix the "Board not found" we must ensure
        // that we don't link segments that lead to dead ends.
        label = 'Practice Session';
      }
    } else if (segment.length === 24) {
      // Robust lookup for category topic
      const category = quizzes?.find(q => q.id === segment);
      if (category) {
        label = category.topic;
        // If we're on a quiz page or deep in category, ensure the link is correct
        if (pathname.includes('/quiz/')) {
          finalHref = `/category/${segment}`;
        }
      } else {
        // Fallback or while loading
        label = 'Loading...'; 
      }
    } else if (segment === 'govt-jobs-alerts') {
      label = 'Job Alerts';
    } else if (segment === 'current-affairs') {
      label = 'Current Affairs';
    } else if (segment === 'daily-current-affairs') {
      label = 'Daily Current Affairs';
    }

    // Format the label if it's not a category name or specifically handled (capitalize, replace hyphens)
    if (label === segment) {
      label = label.charAt(0).toUpperCase() + label.slice(1).replace(/-/g, ' ');
    }

    breadcrumbs.push({
      label,
      href: finalHref,
    });
  });

  // If we're on a quiz page, add the set info
  if (pathname.startsWith('/quiz/')) {
    const setLabel = selectedSetIndex ? `Set ${selectedSetIndex}` : 'Set 1';
    breadcrumbs.push({
      label: setLabel,
      href: pathname,
    });
  }

  return (
    <nav className={styles.breadcrumbsContainer} aria-label="Breadcrumb">
      <ol className={styles.breadcrumbsList}>
        <li className={styles.breadcrumbItem}>
          <Link href="/" className={styles.breadcrumbLink}>
            <span className={styles.homeIcon}>🏠</span>
            Home
          </Link>
        </li>
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={breadcrumb.href} className={styles.breadcrumbItem}>
              <span className={styles.separator}>&gt;</span>
              {isLast ? (
                <span className={styles.breadcrumbCurrent} aria-current="page">
                  {breadcrumb.label}
                </span>
              ) : (
                <Link href={breadcrumb.href} className={styles.breadcrumbLink}>
                  {breadcrumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
