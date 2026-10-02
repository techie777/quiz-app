/**
 * src/lib/prng.js
 * Seed-based Pseudo-Random Number Generator (Mulberry32) and deterministic shuffle.
 * Satisfies Rule 5 & Task 3.7: identical shuffle for Challenge mode on all devices.
 */

export function createMulberry32(seed) {
  let s = 0;
  if (typeof seed === "number") {
    s = seed >>> 0;
  } else if (typeof seed === "string") {
    // 32-bit FNV-1a hash
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
    }
    s = h;
  } else {
    s = Math.floor(Math.random() * 0xffffffff) >>> 0;
  }

  return function prng() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffles an array using the provided PRNG (Fisher-Yates)
 */
export function shuffleArrayWithRng(arr, rng = Math.random) {
  if (!arr || !Array.isArray(arr)) return [];
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Deterministically shuffles question options and optionsHi synchronously
 * based on question ID and quiz seed so English and Hindi options match positions.
 */
export function shuffleQuestionOptions(q, rng) {
  if (!q || !Array.isArray(q.options) || q.options.length <= 1) return q;

  const len = q.options.length;
  const indices = Array.from({ length: len }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const newOptions = indices.map((i) => q.options[i]);
  const newOptionsHi =
    Array.isArray(q.optionsHi) && q.optionsHi.length === len
      ? indices.map((i) => q.optionsHi[i])
      : q.optionsHi;

  return {
    ...q,
    options: newOptions,
    optionsHi: newOptionsHi,
  };
}

/**
 * Maps question difficulty to numerical rank:
 * 1 = Easy, 2 = Medium, 3 = Hard, 4 = Expert
 */
export function getDifficultyRank(difficulty) {
  if (!difficulty) return 2;
  const d = String(difficulty).toLowerCase().trim();
  switch (d) {
    case "easy":
    case "आसान":
    case "सरल":
      return 1;
    case "medium":
    case "मध्यम":
      return 2;
    case "hard":
    case "कठिन":
      return 3;
    case "expert":
    case "कठिन+":
    case "विशेषज्ञ":
      return 4;
    default:
      return 2;
  }
}

/**
 * Orders questions with progressive difficulty:
 * First: Easy questions
 * Middle: Medium questions
 * Last: Hard + Expert questions
 * Within each difficulty tier, questions are deterministically shuffled using rng.
 */
export function orderQuestionsProgressiveDifficulty(questions, rng = null) {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const easy = [];
  const medium = [];
  const hard = [];
  const expert = [];

  for (const q of questions) {
    const rank = getDifficultyRank(q.difficulty);
    if (rank === 1) easy.push(q);
    else if (rank === 2) medium.push(q);
    else if (rank === 3) hard.push(q);
    else expert.push(q);
  }

  const sEasy = rng ? shuffleArrayWithRng(easy, rng) : easy;
  const sMedium = rng ? shuffleArrayWithRng(medium, rng) : medium;
  const sHard = rng ? shuffleArrayWithRng(hard, rng) : hard;
  const sExpert = rng ? shuffleArrayWithRng(expert, rng) : expert;

  return [...sEasy, ...sMedium, ...sHard, ...sExpert];
}

