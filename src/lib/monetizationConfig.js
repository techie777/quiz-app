// src/lib/monetizationConfig.js
// Central configuration for Pro Plans, Donations, and Ad Moments

export const PRO_PLANS = [
  {
    id: "plan_1m",
    name: "1 Month",
    nameHi: "1 महीना",
    price: 49,
    durationDays: 30,
    tagline: "Monthly flexibility",
    taglineHi: "मासिक लचीलापन",
  },
  {
    id: "plan_3m",
    name: "3 Months",
    nameHi: "3 महीने",
    price: 99,
    durationDays: 90,
    tagline: "Quarterly pass",
    taglineHi: "त्रैमासिक पास",
  },
  {
    id: "plan_6m",
    name: "6 Months",
    nameHi: "6 महीने",
    price: 149,
    durationDays: 180,
    tagline: "Half-yearly savings",
    taglineHi: "छमाही बचत",
  },
  {
    id: "plan_1y",
    name: "1 Year",
    nameHi: "1 साल",
    price: 249,
    durationDays: 365,
    tagline: "Best value - Unlimited everything",
    taglineHi: "सर्वोत्तम मूल्य - सब कुछ असीमित",
    isBestValue: true,
  },
];

export const DONATION_PRESETS = [
  { amount: 19, label: "₹19" },
  { amount: 49, label: "₹49", popular: true },
  { amount: 99, label: "₹99" },
  { amount: 199, label: "₹199" },
];

export const DEFAULT_AD_TOGGLES = {
  start: true,
  mid: true,
  result: true,
  review: true,
  share: true,
  midQuizMinQuestions: 10,
  maxAdMomentsPerSet: 5,
  gateChallengeInvite: false, // Challenge a friend invite links are never gated
  freeSetsPerWindow: 2,
};

export const DEFAULT_APPEAL_TEXT = {
  titleEn: "Help us keep QuizWeb growing",
  titleHi: "QuizWeb को आगे बढ़ाने में हमारा सहयोग करें",
  subtitleEn: "QuizWeb is an independent educational platform. Your contribution helps us keep servers running and high-quality quizzes free for everyone.",
  subtitleHi: "QuizWeb एक स्वतंत्र शैक्षणिक मंच है। आपका सहयोग हमें सर्वर चलाने और सभी के लिए उच्च गुणवत्ता वाले क्विज़ मुफ़्त रखने में मदद करता है।",
};
