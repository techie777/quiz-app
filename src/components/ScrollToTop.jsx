"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  // Show button when page is scrolled down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Do not display floating scroll button during live sessions, arena wizard, or active quiz play
  if (
    pathname?.startsWith('/live') ||
    pathname?.startsWith('/quiz/') ||
    pathname?.startsWith('/arena') ||
    pathname?.startsWith('/admin')
  ) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Determine if mobile BottomNavBar is present so we float safely above it
  const isExcluded = pathname?.startsWith('/arena') || pathname?.startsWith('/admin');
  const hasBottomNav = !isExcluded;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="Scroll to top"
      className={`fixed right-4 sm:right-6 z-[55] w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all duration-300 active:scale-90 ${
        hasBottomNav ? "bottom-[calc(76px+env(safe-area-inset-bottom,0px))] sm:bottom-6" : "bottom-6"
      } ${
        isVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp size={20} strokeWidth={2.5} />
    </button>
  );
}
