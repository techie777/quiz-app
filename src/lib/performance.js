// Performance optimization utilities

// Lazy loading component
export const lazyLoad = (importFunc, fallback = null) => {
  return lazy(importFunc, { 
    suspense: fallback ? <fallback /> : null 
  });
};

// Image optimization
export const optimizeImage = (src, options = {}) => {
  const {
    width,
    height,
    quality = 75,
    format = 'webp'
  } = options;

  if (!src) return src;

  // If it's an external URL, return as is
  if (src.startsWith('http')) return src;

  // For local images, we could add CDN or optimization logic here
  return src;
};

// Debounce utility for search and other inputs
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0.1
  } = options;

  return new IntersectionObserver(callback, {
    root,
    rootMargin,
    threshold
  });
};

// Preload critical resources
export const preloadResource = (href, as = 'script') => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }
};

// Performance monitoring
export const measurePerformance = (name, fn) => {
  if (typeof window !== 'undefined' && window.performance) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.debug(`[Performance] ${name}: ${end - start}ms`);
    return result;
  }
  return fn();
};

// Cache API responses
export class ResponseCache {
  constructor(maxAge = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Global cache instance
export const globalCache = new ResponseCache();

// Optimize API calls with caching
export const cachedFetch = async (url, options = {}) => {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  const cached = globalCache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Only cache successful responses
    if (response.ok) {
      globalCache.set(cacheKey, data);
    }
    
    return data;
  } catch (error) {
    // Return cached data if available on error
    return cached || null;
  }
};
