// src/lib/categoryCardImages.js

/**
 * 40 Card Image WebP Mapping
 * Maps category slugs to the exact 40 WebP files deposited in /public/cards/
 */
export const CATEGORY_SLUG_TO_FILE = {
  "india-gk": "india-gk.webp",
  "world-gk": "world-gk.webp",
  "indian-geography": "indian-geography.webp",
  "indian-cities": "indian-cities.webp",
  "indian-states-uts": "indian-states.webp",
  "religion-spirituality": "religion.webp",
  "heritage-monuments": "heritage.webp",
  "art-culture": "art-culture.webp",
  "science": "science.webp",
  "mathematics": "mathematics.webp",
  "reasoning-brain-games": "reasoning.webp",
  "history": "history.webp",
  "geography": "geography.webp",
  "technology": "technology.webp",
  "space-astronomy": "space.webp",
  "language-grammar": "language.webp",
  "literature": "literature.webp",
  "entertainment": "entertainment.webp",
  "music": "music.webp",
  "sports": "sports.webp",
  "gaming": "gaming.webp",
  "theatre-performing-arts": "theatre.webp",
  "famous-people": "famous-people.webp",
  "awards-achievements": "awards.webp",
  "kids-family-quiz": "kids-family.webp",
  "fun-viral-quiz": "fun-viral.webp",
  "business-economy": "business.webp",
  "politics-government": "politics.webp",
  "environment-nature": "environment.webp",
  "food-cuisine": "food.webp",
  "transport": "transport.webp",
  "defence-military": "defence.webp",
  "brands-companies": "brands.webp",
  "lifestyle-everyday-knowledge": "lifestyle.webp",
  "animals-wildlife": "animals.webp",
  "plants-agriculture": "plants.webp",
  "inventions-discoveries": "inventions.webp",
  "travel-tourism": "travel.webp",
  "general-knowledge": "general-knowledge.webp",
  "current-affairs": "current-affairs.webp",
  "human-body": "human-body.webp",
  "amazing-facts": "amazing-facts.webp",
  "india-history": "india-history.webp",
  "indian-history": "india-history.webp",
  "india-geography": "india-geography.webp",
  "animals-nature": "animals-nature.webp",
  "space-universe": "space-universe.webp",
  "brain-riddles": "brain-riddles.webp",
  "food": "food.webp",
  "indian-kingdoms": "history.webp",
  "money-business": "business.webp",
  "india-sports": "india-sports.webp",
  "indian-sports": "india-sports.webp",
  "technology": "technology.webp",
  "science--discovery": "science--discovery.webp",
  "economy--others": "economy--others.webp",
  "economy-others": "economy--others.webp",
  "biology-gk-1": "biology-gk-1.webp",
  "biology-gk": "biology-gk.webp",
  "nature-animals": "nature-animals.webp",
  "nature-wonders": "nature-wonders.webp",
  "india-culture": "india-culture.webp",
  "indian-culture": "india-culture.webp",
  "india-polity": "india-polity.webp",
  "indian-polity": "india-polity.webp",
  "indian-railway": "indian-railway.webp",
  "currency-language": "currency-language.webp",
  "unique-village": "unique-village.webp",
  "world-geography": "world-geography.webp",
  "others": "others.webp",
};

/**
 * Canonical Slug Aliases Map
 * Maps short or legacy database slugs to canonical category slugs
 */
export const SLUG_ALIASES = {
  "sports": "india-sports",
  "sports-gk": "india-sports",
  "indian-sports": "india-sports",
  "politics": "india-polity",
  "politics-government": "india-polity",
  "polity": "india-polity",
  "indian-polity": "india-polity",
  "indian-states": "indian-states-uts",
  "indian-states-gk": "indian-states-uts",
  "religion": "religion-spirituality",
  "religious-gk": "religion-spirituality",
  "heritage": "heritage-monuments",
  "space": "space-astronomy",
  "space-universe": "space-astronomy",
  "language": "language-grammar",
  "business": "business-economy",
  "money-business": "business-economy",
  "environment": "environment-nature",
  "food": "food-cuisine",
  "defence": "defence-military",
  "brands": "brands-companies",
  "lifestyle": "lifestyle-everyday-knowledge",
  "animals": "nature-animals",
  "animals-wildlife": "nature-animals",
  "animals-nature": "nature-animals",
  "nature-wonders": "nature-animals",
  "plants": "plants-agriculture",
  "inventions": "inventions-discoveries",
  "travel": "travel-tourism",
  "theatre": "theatre-performing-arts",
  "kids-family": "kids-family-quiz",
  "fun-viral": "fun-viral-quiz",
  "reasoning": "reasoning-brain-games",
  "brain-riddles": "reasoning-brain-games",
  "awards": "awards-achievements",
  "indian-history": "india-history",
  "history-gk": "india-history",
  "indian-kingdom-gk": "indian-kingdoms",
  "biology-gk": "biology-gk-1",
  "general-science": "science--discovery",
  "science": "science--discovery",
  "economy-others": "economy--others",
  "indian-culture": "india-culture",
};

/**
 * Category Groups Mapping
 * core | india | learn | fun | world
 */
export const CATEGORY_GROUPS = {
  core: [
    "india-gk",
    "world-gk",
    "general-knowledge",
    "current-affairs",
  ],
  india: [
    "india-gk",
    "india-history",
    "india-geography",
    "india-sports",
    "technology",
    "science--discovery",
    "entertainment",
    "economy--others",
    "biology-gk-1",
    "nature-animals",
    "india-culture",
    "india-polity",
    "others",
    "indian-geography",
    "indian-cities",
    "indian-states-uts",
    "religion-spirituality",
    "heritage-monuments",
    "art-culture",
  ],
  learn: [
    "science",
    "technology",
    "india-history",
    "india-geography",
    "india-polity",
    "mathematics",
    "reasoning-brain-games",
    "history",
    "geography",
    "language-grammar",
    "literature",
    "space-astronomy",
  ],
  fun: [
    "india-sports",
    "sports",
    "entertainment",
    "music",
    "gaming",
    "theatre-performing-arts",
    "famous-people",
    "awards-achievements",
    "kids-family-quiz",
    "fun-viral-quiz",
  ],
  world: [
    "world-gk",
    "business-economy",
    "politics-government",
    "environment-nature",
    "food-cuisine",
    "transport",
    "defence-military",
    "brands-companies",
    "lifestyle-everyday-knowledge",
    "animals-wildlife",
    "plants-agriculture",
    "inventions-discoveries",
    "travel-tourism",
  ],
};

/**
 * Helper to get the assigned group for a category slug
 */
export function getCategoryGroup(slug) {
  if (!slug) return "core";
  const clean = slug.toLowerCase().trim();
  for (const [group, slugs] of Object.entries(CATEGORY_GROUPS)) {
    if (slugs.includes(clean)) return group;
  }
  return "core";
}

/**
 * Helper to get the image path for a category
 */
export function getCategoryCardImageUrl(category) {
  if (!category) return null;
  if (category.image_url) return category.image_url;
  if (category.imageUrl) return category.imageUrl;
  if (category.image && category.image.startsWith("/")) return category.image;
  
  const slug = (category.slug || "").toLowerCase().trim();
  const filename = CATEGORY_SLUG_TO_FILE[slug] || `${slug}.webp`;
  return `/cards/${filename}`;
}

/**
 * Color hue generator from slug for soft gradient fallback tile
 */
export function getCategoryGradientHue(str) {
  if (!str) return 240;
  return [...str].reduce((acc, char) => acc + char.charCodeAt(0), 0) * 7 % 360;
}
