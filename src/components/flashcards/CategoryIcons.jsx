"use client";

import React from "react";
import {
  Shield,
  Compass,
  Car,
  Heart,
  Sparkles,
  BookOpen,
  Landmark,
  Globe,
  Award,
  Layers,
} from "lucide-react";

/**
 * Returns a white Lucide icon component suitable for the 44px indigo category badge.
 */
export function getCategoryBadgeIcon(categoryName = "", size = 20) {
  const norm = (categoryName || "").toLowerCase();
  if (norm.includes("military") || norm.includes("सैन्य")) {
    return <Shield size={size} color="#FFFFFF" strokeWidth={2.2} />;
  }
  if (norm.includes("navig") || norm.includes("नौवहन") || norm.includes("compass")) {
    return <Compass size={size} color="#FFFFFF" strokeWidth={2.2} />;
  }
  if (norm.includes("car") || norm.includes("कार") || norm.includes("transport")) {
    return <Car size={size} color="#FFFFFF" strokeWidth={2.2} />;
  }
  if (norm.includes("body") || norm.includes("शरीर") || norm.includes("health")) {
    return <Heart size={size} color="#FFFFFF" strokeWidth={2.2} />;
  }
  if (norm.includes("animal") || norm.includes("पशु") || norm.includes("जानवर")) {
    return <Layers size={size} color="#FFFFFF" strokeWidth={2.2} />;
  }
  if (norm.includes("history") || norm.includes("इतिहास") || norm.includes("monument")) {
    return <Landmark size={size} color="#FFFFFF" strokeWidth={2.2} />;
  }
  if (norm.includes("geography") || norm.includes("भूगोल") || norm.includes("river")) {
    return <Globe size={size} color="#FFFFFF" strokeWidth={2.2} />;
  }
  if (norm.includes("modern") || norm.includes("आधुनिक")) {
    return <Award size={size} color="#FFFFFF" strokeWidth={2.2} />;
  }

  // Default clean sparkles icon matching mockup
  return <Sparkles size={size} color="#FFFFFF" strokeWidth={2.2} />;
}
