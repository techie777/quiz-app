import React from 'react';

/**
 * Modern Clean Typography Parser.
 * Replaces high-intensity multi-color highlighting with decent, single-color text.
 * Respects the dark/light mode for contrast.
 */
export function highlightFactText(text, isDark = true) {
  if (!text) return text;

  // The user requested removing the multi-color concept entirely. 
  // We now rely on the parent container (Fact Card) to provide the base color 
  // (Black for standard cards, White for image cards).
  
  return text;
}
