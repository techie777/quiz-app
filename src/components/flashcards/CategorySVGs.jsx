"use client";

import React from "react";

/**
 * Flat SVG illustrations for Flashcards with pastel fills (orange/yellow),
 * crisp ink strokes (#1F2430), and technical diagram label bars (#E6E2D6).
 */

export function DiagramBars() {
  return (
    <>
      {/* Left label bars */}
      <rect x="12" y="44" width="22" height="3" rx="1.5" fill="#E6E2D6" />
      <rect x="8" y="52" width="16" height="3" rx="1.5" fill="#E6E2D6" />

      {/* Right label bars */}
      <rect x="126" y="44" width="22" height="3" rx="1.5" fill="#E6E2D6" />
      <rect x="132" y="52" width="18" height="3" rx="1.5" fill="#E6E2D6" />
    </>
  );
}

// 1. Military / Defense: Shield with Star
export function ShieldIllustration() {
  return (
    <svg width="160" height="110" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DiagramBars />
      {/* Soft background halo */}
      <circle cx="80" cy="55" r="38" fill="#FFF2DC" />
      {/* Shield shape */}
      <path
        d="M80 22L108 34V58C108 76 80 88 80 88C80 88 52 76 52 58V34L80 22Z"
        fill="#FFD2A8"
        stroke="#1F2430"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Inner Star */}
      <path
        d="M80 38L83.7 46.5H92.8L85.5 51.8L88.3 60.3L80 55L71.7 60.3L74.5 51.8L67.2 46.5H76.3L80 38Z"
        fill="#FFFFFF"
        stroke="#1F2430"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 2. Animals / Wildlife: Honeycomb Hexagons with question mark
export function HexagonsIllustration() {
  return (
    <svg width="160" height="110" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DiagramBars />
      {/* Soft background halo */}
      <circle cx="80" cy="55" r="38" fill="#FFF8EB" />
      {/* Hexagon 1 (Top Left) */}
      <polygon
        points="68,28 80,35 80,49 68,56 56,49 56,35"
        fill="#FDE68A"
        stroke="#1F2430"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Hexagon 2 (Top Right) */}
      <polygon
        points="92,28 104,35 104,49 92,56 80,49 80,35"
        fill="#FDE047"
        stroke="#1F2430"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Hexagon 3 (Bottom Center) */}
      <polygon
        points="80,49 92,56 92,70 80,77 68,70 68,56"
        fill="#FED7AA"
        stroke="#1F2430"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Question mark / icon in bottom hexagon */}
      <path
        d="M78 59C78 57.5 79 56.5 80.5 56.5C82 56.5 83 57.5 83 59C83 60.2 82 61 80.5 61.5V63M80.5 66H80.52"
        stroke="#1F2430"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 3. Navigation / Geography / Science: Compass
export function CompassIllustration() {
  return (
    <svg width="160" height="110" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DiagramBars />
      <circle cx="80" cy="55" r="38" fill="#EEF2FF" />
      <circle cx="80" cy="55" r="28" fill="#FFFFFF" stroke="#1F2430" strokeWidth="2" />
      {/* Dial markings */}
      <line x1="80" y1="29" x2="80" y2="33" stroke="#1F2430" strokeWidth="2" />
      <line x1="80" y1="77" x2="80" y2="81" stroke="#1F2430" strokeWidth="2" />
      <line x1="54" y1="55" x2="58" y2="55" stroke="#1F2430" strokeWidth="2" />
      <line x1="102" y1="55" x2="106" y2="55" stroke="#1F2430" strokeWidth="2" />
      {/* Compass Needle */}
      <polygon points="80,34 85,55 80,51 75,55" fill="#FF8A7A" stroke="#1F2430" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="80,76 85,55 80,51 75,55" fill="#E2E8F0" stroke="#1F2430" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="80" cy="53" r="2.5" fill="#1F2430" />
    </svg>
  );
}

// 4. Car / Vehicles / Transport: Flat Car
export function CarIllustration() {
  return (
    <svg width="160" height="110" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DiagramBars />
      <circle cx="80" cy="55" r="38" fill="#FEF3C7" />
      {/* Car Body */}
      <path
        d="M52 64L57 48C58 45 61 43 65 43H95C99 43 102 45 103 48L108 64H112C114 64 115 65.5 115 67V72C115 73.5 114 74 112 74H48C46 74 45 73.5 45 72V67C45 65.5 46 64 48 64H52Z"
        fill="#FFD2A8"
        stroke="#1F2430"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Windshield */}
      <path d="M60 48H100L96 60H64L60 48Z" fill="#FFFFFF" stroke="#1F2430" strokeWidth="1.5" />
      {/* Wheels */}
      <circle cx="62" cy="74" r="6" fill="#1F2430" />
      <circle cx="62" cy="74" r="2.5" fill="#FFFFFF" />
      <circle cx="98" cy="74" r="6" fill="#1F2430" />
      <circle cx="98" cy="74" r="2.5" fill="#FFFFFF" />
    </svg>
  );
}

// 5. Human Body / Health / Biology
export function BodyIllustration() {
  return (
    <svg width="160" height="110" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DiagramBars />
      <circle cx="80" cy="55" r="38" fill="#F0FDF4" />
      {/* Head */}
      <circle cx="80" cy="38" r="9" fill="#FFD2A8" stroke="#1F2430" strokeWidth="1.75" />
      {/* Torso & Ribs */}
      <path
        d="M68 53C68 49 73 47 80 47C87 47 92 49 92 53V73C92 75 87 77 80 77C73 77 68 75 68 73V53Z"
        fill="#FFFFFF"
        stroke="#1F2430"
        strokeWidth="1.75"
      />
      <line x1="73" y1="55" x2="87" y2="55" stroke="#1F2430" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="74" y1="61" x2="86" y2="61" stroke="#1F2430" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="75" y1="67" x2="85" y2="67" stroke="#1F2430" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="80" y1="48" x2="80" y2="76" stroke="#1F2430" strokeWidth="1.5" />
    </svg>
  );
}

// 6. Culture / History / Monuments
export function CultureIllustration() {
  return (
    <svg width="160" height="110" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DiagramBars />
      <circle cx="80" cy="55" r="38" fill="#FDF2F8" />
      {/* Dome / Monument */}
      <path
        d="M62 76V58H98V76"
        fill="#FFD2A8"
        stroke="#1F2430"
        strokeWidth="2"
      />
      <path
        d="M62 58C62 44 80 34 80 34C80 34 98 44 98 58H62Z"
        fill="#FDE68A"
        stroke="#1F2430"
        strokeWidth="2"
      />
      {/* Archway */}
      <path
        d="M74 76V66C74 62.5 76.5 60 80 60C83.5 60 86 62.5 86 66V76"
        fill="#FFFFFF"
        stroke="#1F2430"
        strokeWidth="1.75"
      />
      <line x1="56" y1="76" x2="104" y2="76" stroke="#1F2430" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="80" y1="34" x2="80" y2="28" stroke="#1F2430" strokeWidth="1.75" />
    </svg>
  );
}

// 7. Generic / Sparkle Fallback
export function SparkleIllustration() {
  return (
    <svg width="160" height="110" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DiagramBars />
      <circle cx="80" cy="55" r="38" fill="#FFF2DC" />
      {/* Main 4-pointed sparkle */}
      <path
        d="M80 30C80 43 93 55 93 55C93 55 80 67 80 80C80 67 67 55 67 55C67 55 80 43 80 30Z"
        fill="#FCE482"
        stroke="#1F2430"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Small accent sparkles */}
      <path
        d="M102 36C102 40 106 44 106 44C106 44 102 48 102 52C102 48 98 44 98 44C98 44 102 40 102 36Z"
        fill="#FFD2A8"
        stroke="#1F2430"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function CategoryIllustration({ categoryName = "", illustrationKey = "" }) {
  const norm = (illustrationKey || categoryName || "").toLowerCase();

  if (norm.includes("militar") || norm.includes("army") || norm.includes("defense") || norm.includes("shield")) {
    return <ShieldIllustration />;
  }
  if (norm.includes("animal") || norm.includes("wildlife") || norm.includes("nature") || norm.includes("bird") || norm.includes("insect") || norm.includes("bee") || norm.includes("hexagon")) {
    return <HexagonsIllustration />;
  }
  if (norm.includes("navigat") || norm.includes("geograph") || norm.includes("travel") || norm.includes("map") || norm.includes("space") || norm.includes("compass")) {
    return <CompassIllustration />;
  }
  if (norm.includes("car") || norm.includes("vehicle") || norm.includes("transport") || norm.includes("auto")) {
    return <CarIllustration />;
  }
  if (norm.includes("body") || norm.includes("health") || norm.includes("human") || norm.includes("medicin") || norm.includes("biolog")) {
    return <BodyIllustration />;
  }
  if (norm.includes("cultur") || norm.includes("histor") || norm.includes("monument") || norm.includes("india") || norm.includes("art")) {
    return <CultureIllustration />;
  }

  return <SparkleIllustration />;
}
