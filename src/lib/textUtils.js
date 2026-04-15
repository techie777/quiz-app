import React from 'react';

/**
 * High-Intensity Automatic Keyword Highlighting.
 * Optimized for "World Class" engagement and monetization.
 * Targets numbers, quotes, multi-word entities, and Hindi keywords.
 */
export function highlightFactText(text, isDark = true) {
  if (!text) return text;

  // Dictionary for geographic entities (English) - Expanded to be more effective
  const PLACES_EN = [
    "India", "World", "Kolkata", "Gujarat", "Singapore", "Europe", "Asia", "Earth", 
    "Africa", "America", "Japan", "China", "Delhi", "Mumbai", "Italy", "Bologna", 
    "Venus", "Sun", "Mars", "Indus Valley", "Mahabharata", "Everest", "Himalayas"
  ];
  const PLACE_SUFFIXES_EN = ["pur", "abad", "land", "city", "state", "stan", "desh", "nia"];
  
  // Power Words for high-conversion engagement (Neon Cyan/Lime)
  const POWER_WORDS_EN = [
    "First", "Largest", "Fastest", "Smallest", "Longest", "Invention", "World Record", 
    "Amazing", "Only", "Just", "Never", "Secret", "Hidden", "Discovery", "Million", "Billion"
  ];

  // Hindi Hot-Word Dictionary - Expanded for greater visibility
  const PERSONS_HI = ["आर्यभट्ट", "महात्मा गांधी", "गांधी", "सुश्रुत", "भास्कराचार्य", "राजा", "सम्राट", "चाणक्य", "मौर्य"];
  const PLACES_HI = [
    "भारत", "भारतीय", "दिल्ली", "ताजमहल", "नालंदा", "तंजौर", "कुंभ मेला", "एशियाई", "सिंधु घाटी", 
    "महल", "शहर", "इटली", "बोलोग्ना", "विश्व", "पृथ्वी", "अंतरिक्ष", "सूर्य", "चंद्रमा"
  ];
  const POWER_WORDS_HI = ["पहला", "पहली", "सबसे", "आविष्कार", "दुनिया", "सैकड़ों", "प्रमुख", "आश्चर्यजनक", "खोज", "रहस्य"];

  // Regex Patterns
  // 1. Numbers/Stats (\d+(?:\.\d+)?%?)
  // 2. Quoted segments (['"].+?['"])
  // 3. Multi-word Proper Nouns (\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})*\b)
  // 4. Hindi Entities (| separator for dictionary)
  const hiPattern = [...PERSONS_HI, ...PLACES_HI, ...POWER_WORDS_HI].join("|");
  const regex = new RegExp(`(\\d+(?:\\.\\d+)?%?|['"].+?['"]|\\b[A-Z][a-z]{2,}(?:\\s+[A-Z][a-z]{2,})*\\b|${hiPattern})`, "g");
  
  const parts = text.split(regex);
  const commonExclusions = ["This", "That", "There", "When", "They", "Some", "Many", "Once", "Note", "With", "After", "Before", "Here"];

  const highlightStyles = "inline-block px-1 rounded-sm transition-all duration-300 transform hover:scale-105 select-none";
  const shadowStyle = isDark ? "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" : "drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]";

  return parts.map((part, index) => {
    if (!part) return null;

    // Pattern: Numbers/Stats -> Vibrant Amber
    if (/^\d/.test(part)) {
      return (
        <span key={index} className={`${isDark ? 'text-amber-400' : 'text-amber-600'} ${highlightStyles} ${shadowStyle} font-extrabold`}>
          {part}
        </span>
      );
    }

    // Pattern: Quoted segments -> Neon Emerald
    if (/^['"]/.test(part)) {
      return (
        <span key={index} className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'} ${highlightStyles} italic font-bold`}>
          {part}
        </span>
      );
    }

    // Pattern: Power Words (EN) -> Neon Cyan/Lime
    // Check case-insensitively but preserve original casing
    const isPowerWord = POWER_WORDS_EN.some(pw => pw.toLowerCase() === part.toLowerCase());
    if (isPowerWord) {
      return (
        <span key={index} className={`${isDark ? 'text-cyan-400' : 'text-cyan-600'} ${highlightStyles} ${shadowStyle} font-black underline decoration-cyan-500/30`}>
          {part}
        </span>
      );
    }

    // Pattern: Proper Nouns / Key Entities (EN)
    if (/^[A-Z]/.test(part) && !commonExclusions.includes(part)) {
       const isPlace = PLACES_EN.includes(part) || PLACE_SUFFIXES_EN.some(s => part.toLowerCase().endsWith(s));
       
       if (isPlace) {
         // Place -> Deep Sky Blue
         return (
           <span key={index} className={`${isDark ? 'text-sky-400' : 'text-sky-500'} ${highlightStyles} ${shadowStyle} font-bold`}>
             {part}
           </span>
         );
       } else {
         // Person/Entity -> Saturated Rose
         return (
           <span key={index} className={`${isDark ? 'text-rose-500' : 'text-rose-600'} ${highlightStyles} ${shadowStyle} font-bold`}>
             {part}
           </span>
         );
       }
    }

    // Pattern: Hindi Hot-Words
    if (PERSONS_HI.includes(part)) {
      return <span key={index} className={`${isDark ? 'text-rose-500' : 'text-rose-600'} ${highlightStyles} ${shadowStyle} font-bold`}>{part}</span>;
    }
    if (PLACES_HI.includes(part)) {
      return <span key={index} className={`${isDark ? 'text-sky-400' : 'text-sky-500'} ${highlightStyles} ${shadowStyle} font-bold`}>{part}</span>;
    }
    if (POWER_WORDS_HI.includes(part)) {
      return <span key={index} className={`${isDark ? 'text-cyan-400' : 'text-cyan-600'} ${highlightStyles} ${shadowStyle} font-bold`}>{part}</span>;
    }

    return part;
  });
}
