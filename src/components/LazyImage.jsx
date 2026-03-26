"use client";

import { useState, useRef, useEffect } from "react";
import styles from "@/styles/LazyImage.module.css";

export default function LazyImage({ src, alt, fallback, className, ...props }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px"
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError || !src) {
    return (
      <div className={`${styles.fallback} ${className}`} {...props}>
        {fallback}
      </div>
    );
  }

  return (
    <div ref={imgRef} className={styles.container}>
      {!isLoaded && (
        <div className={`${styles.skeleton} ${className}`}>
          <div className={styles.shimmer}></div>
        </div>
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? styles.loaded : styles.loading}`}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
}
