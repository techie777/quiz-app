"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { useQuiz } from '@/context/QuizContext';
import styles from '@/styles/Breadcrumbs.module.css';

const Breadcrumbs = () => {
  const pathname = usePathname();
  const { quizzes } = useData();
  const { selectedSetIndex, quizId } = useQuiz();
  
  // Don't show breadcrumbs on the home page
  if (pathname === '/') return null;

  const pathSegments = pathname.split('/').filter((segment) => segment !== '');

  const breadcrumbs = [];
  
  pathSegments.forEach((segment, index) => {
    // Skip "category" and "quiz" segments to keep breadcrumbs clean
    if (segment === 'category' || segment === 'quiz') return;

    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    let label = segment;
    let finalHref = href;

    // Try to find category topic if the segment is a category ID
    if (segment.length === 24) {
      const category = quizzes?.find(q => q.id === segment);
      if (category) {
        label = category.topic;
        // If we're on a quiz page, the category link should go to the category sets page
        if (pathname.startsWith('/quiz/')) {
          finalHref = `/category/${segment}`;
        }
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
