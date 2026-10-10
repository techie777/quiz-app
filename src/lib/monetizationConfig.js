// src/lib/monetizationConfig.js
// Central configuration for Pro Plans, Donations, and Ad Moments

export const PRO_PLANS = [
  {
    id: "plan_student_11",
    name: "Student Micro-Pass (1 Month)",
    nameHi: "छात्र स्पेशल माइक्रो-पास (1 माह)",
    price: 11,
    durationDays: 30,
    tagline: "Special ₹11/mo introductory pass for students",
    taglineHi: "मात्र ₹11/माह में छात्रों के लिए विशेष प्रो पास",
    badge: "🔥 STUDENT SPECIAL",
    badgeHi: "🔥 छात्र स्पेशल",
  },
  {
    id: "plan_1m",
    name: "1 Month Standard",
    nameHi: "1 महीना स्टैंडर्ड",
    price: 11,
    durationDays: 30,
    tagline: "Monthly flexibility",
    taglineHi: "मासिक लचीलापन",
  },
  {
    id: "plan_3m",
    name: "3 Months (Quarter Pass)",
    nameHi: "3 महीने (त्रैमासिक पास)",
    price: 29,
    durationDays: 90,
    tagline: "Quarterly study & exam prep",
    taglineHi: "3 महीने की निरंतर परीक्षा तैयारी",
    badge: "POPULAR",
    badgeHi: "लोकप्रिय",
  },
  {
    id: "plan_6m",
    name: "6 Months (Semester Pass)",
    nameHi: "6 महीने (सत्र पास)",
    price: 49,
    durationDays: 180,
    tagline: "Half-yearly savings for serious aspirants",
    taglineHi: "गंभीर अभ्यर्थियों के लिए छमाही बचत",
  },
  {
    id: "plan_1y",
    name: "1 Year (Annual VIP Pass)",
    nameHi: "1 वर्ष (वार्षिक VIP पास)",
    price: 99,
    durationDays: 365,
    tagline: "Best value - Full year unlimited mock tests & 4x coins",
    taglineHi: "सर्वोत्तम मूल्य - पूरे 1 साल असीमित मॉक्स व 4x सिक्के",
    isBestValue: true,
    badge: "🌟 BEST VALUE",
    badgeHi: "🌟 सर्वोत्तम मूल्य",
  },
];

export const DONATION_PRESETS = [
  { amount: 19, label: "₹19" },
  { amount: 49, label: "₹49", popular: true },
  { amount: 99, label: "₹99" },
  { amount: 199, label: "₹199" },
];

export const DEFAULT_AD_TOGGLES = {
  adsEnabled: false,          // Master switch for all ads (disabled per user request)
  quizSetsAdsEnabled: false,  // Ads on quiz sets (disabled per user request)
  proFeaturesEnabled: true,   // Pro features master switch (controllable via admin)
  start: false,               // Start gate ad on sets disabled
  mid: false,                 // Mid-quiz ad disabled
  result: false,              // Result screen ad disabled
  review: false,              // Review explanations ad disabled
  share: false,               // Share card ad disabled
  midQuizMinQuestions: 10,
  maxAdMomentsPerSet: 5,
  gateChallengeInvite: false, // Challenge a friend invite links are never gated
  freeSetsPerWindow: 9999,    // When quiz set ads are disabled, all sets are open
};

export const DEFAULT_APPEAL_TEXT = {
  titleEn: "Help us keep QuizWeb growing",
  titleHi: "QuizWeb को आगे बढ़ाने में हमारा सहयोग करें",
  subtitleEn: "QuizWeb is an independent educational platform. Your contribution helps us keep servers running and high-quality quizzes free for everyone.",
  subtitleHi: "QuizWeb एक स्वतंत्र शैक्षणिक मंच है। आपका सहयोग हमें सर्वर चलाने और सभी के लिए उच्च गुणवत्ता वाले क्विज़ मुफ़्त रखने में मदद करता है।",
};
