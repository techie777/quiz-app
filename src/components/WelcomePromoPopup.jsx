"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import styles from "@/styles/WelcomePromoPopup.module.css";

export default function WelcomePromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Check if user has already seen the promo this session
    const hasSeen = localStorage.getItem("hasSeenBookPromo");
    if (!hasSeen) {
      // Delay popup for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
        fetchBanners();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        const bannerValue = data?.bookMyCourseHero;
        if (bannerValue) {
          try {
            const parsed = JSON.parse(bannerValue);
            setBanners(Array.isArray(parsed) ? parsed : [bannerValue]);
          } catch {
            setBanners([bannerValue]);
          }
        } else {
          setBanners(["/assets/course-hero.png"]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch promo banners:", err);
    }
  };

  // Auto-slide carousel
  useEffect(() => {
    if (isOpen && banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, banners]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("hasSeenBookPromo", "true");
  };

  const handleAction = () => {
    setIsOpen(false);
    localStorage.setItem("hasSeenBookPromo", "true");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className={styles.popupOverlay}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0 }} 
            className={styles.popupCard}
          >
            <button className={styles.closePopup} onClick={handleClose} aria-label="Close">✕</button>
            
            <div className={styles.popupHeader}>
              <span className={styles.popupTag}>EXCLUSIVE OFFER ⚡</span>
              <h2>स्कूल कोर्स अभी बुक करें!</h2>
              <p>Get official school kits & 1 year of premium digital learning tools.</p>
            </div>

            <div className={styles.popupContent}>
              <div className={styles.popupCarousel}>
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentIndex} 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }} 
                    className={styles.popupSlide}
                  >
                    <Image 
                      src={banners[currentIndex]} 
                      alt="Latest Offer" 
                      width={500} 
                      height={300} 
                      style={{ objectFit: 'cover', borderRadius: '12px' }}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className={styles.popupBenefits}>
                <div className={styles.benefitItem}><span>🎁</span> Free Quiz Pro (1 Year)</div>
                <div className={styles.benefitItem}><span>📝</span> Free Study Tool Access</div>
                <div className={styles.benefitItem}><span>🚚</span> Free Express Delivery</div>
                <div className={styles.benefitItem}><span>💰</span> Best Market Pricing</div>
              </div>
            </div>

            <div className={styles.popupFooter}>
              <Link 
                href="/book-my-course" 
                className={styles.popupOrderBtn} 
                onClick={handleAction}
              >
                BOOK MY COURSE NOW →
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
