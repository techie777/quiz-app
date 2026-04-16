/**
 * Image Fetcher Utility
 * Handles multi-source image discovery for Fun Facts.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'was', 'were', 'are', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'and', 'but', 'or',
  'yet', 'so', 'it', 'its', 'they', 'them', 'their', 'this', 'that', 'these',
  'those', 'from', 'as', 'into', 'like', 'through', 'after', 'over', 'between',
  'out', 'against', 'during', 'without', 'before', 'under', 'around', 'about',
  'who', 'whom', 'which', 'what', 'whose', 'has', 'have', 'had', 'just', 'more'
]);

/**
 * Extracts high-value keywords from a description string.
 */
export function extractKeywords(description) {
  if (!description) return "";
  
  // Clean text and split into words using Unicode-aware regex
  const words = description
    .replace(/[^\p{L}\p{N}\s]/gu, '') // remove punctuation, keeping Unicode letters/numbers
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word));
    
  // Return first 3-4 keywords joined by space
  return words.slice(0, 4).join(" ");
}

/**
 * Main Auto Fetch Logic
 * Rotates through sources based on the 'depth' (click count).
 */
export async function getSmartImage(description, depth = 0, categoryName = "") {
  const keywords = extractKeywords(description) || categoryName || "abstract";
  const sources = [
    { name: 'pexels', fetcher: fetchPexels },
    { name: 'pixabay', fetcher: fetchPixabay },
    { name: 'unsplash', fetcher: fetchUnsplash },
    { name: 'pollinations', fetcher: fetchPollinations }
  ];

  // Rotate source based on depth
  const sourceIndex = depth % sources.length;
  const source = sources[sourceIndex];
  
  console.log(`[SmartFetch] Attempting ${source.name} for: "${keywords}" (Depth: ${depth})`);

  try {
    const url = await source.fetcher(keywords, depth);
    if (url) return url;
    
    // If specific source fails or has no key, fallback to Pollinations with depth-based seed
    console.log(`[SmartFetch] ${source.name} failed or not configured, falling back to Pollinations.`);
    return fetchPollinations(keywords, depth);
  } catch (error) {
    console.warn(`[SmartFetch] Error in ${source.name}:`, error);
    return fetchPollinations(keywords, depth);
  }
}

async function fetchPexels(query, depth) {
  const apiKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
  if (!apiKey) return null;
  
  const page = Math.floor(depth / 4) + 1;
  const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&page=${page}`, {
    headers: { Authorization: apiKey }
  });
  const data = await res.json();
  return data.photos?.[0]?.src?.large || null;
}

async function fetchPixabay(query, depth) {
  const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
  if (!apiKey) return null;
  
  const page = Math.floor(depth / 4) + 1;
  const res = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3&page=${page}`);
  const data = await res.json();
  return data.hits?.[0]?.largeImageURL || null;
}

async function fetchUnsplash(query, depth) {
  const apiKey = process.env.NEXT_PUBLIC_UNSPLASH_API_KEY;
  if (!apiKey) return null;
  
  const page = Math.floor(depth / 4) + 1;
  const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&page=${page}`, {
    headers: { Authorization: `Client-ID ${apiKey}` }
  });
  const data = await res.json();
  return data.results?.[0]?.urls?.regular || null;
}

function fetchPollinations(query, depth) {
  const seed = Math.floor(Math.random() * 1000000) + depth;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(query + " realistic photography landscape")}?width=1080&height=1080&nologo=true&seed=${seed}`;
}
