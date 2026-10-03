// src/lib/setGenerationRules.js
import { getDifficultyRank, shuffleArrayWithRng, createMulberry32 } from "./prng.js";

/**
 * Split questions into difficulty tiers:
 * Easy (rank 1), Medium (rank 2), Hard (rank 3), Expert (rank 4)
 */
export function bucketQuestionsByDifficulty(questions) {
  const easy = [];
  const medium = [];
  const hard = [];

  for (const q of questions) {
    const rank = getDifficultyRank(q.difficulty);
    if (rank === 1) easy.push(q);
    else if (rank === 2) medium.push(q);
    else hard.push(q); // combines rank 3 & 4 (Hard & Expert)
  }

  return { easy, medium, hard };
}

/**
 * Groups questions by their subcategory or subject name
 */
export function groupQuestionsBySubcategory(questions) {
  const map = new Map();
  for (const q of questions) {
    const key = q.subCategory || q.subjectName || q.category || q.topic || "general";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(q);
  }
  return map;
}

/**
 * RULE 1: Mega Pool (All Subcategories Selected, e.g. 2000 Questions across 10-12 subcategories)
 * Formula:
 * - 20 Questions: 10 Easy, 5 Medium, 5 Hard/Expert
 * - Questions 1 to 5: ALWAYS Easy questions first (to build confidence & engagement)
 * - Questions 6 to 20: Shuffled mix of remaining 5 Easy, 5 Medium, 5 Hard
 * - Subcategory Round-Robin: Each question should belong to unique subcategory (repeats after completing counts)
 */
export function createRule1MegaPoolSet(pool, setIndex = 1, rng = Math.random) {
  const { easy, medium, hard } = bucketQuestionsByDifficulty(pool);

  // Helper to pick tier questions prioritizing round-robin unique subcategories
  function pickTierQuestions(tierPool, count, setIdx) {
    if (tierPool.length === 0) return [];

    // Group tier questions by subcategory
    const subGroups = new Map();
    for (const q of tierPool) {
      const sub = q.subCategory || q.subjectName || q.category || q.topic || "general";
      if (!subGroups.has(sub)) subGroups.set(sub, []);
      subGroups.get(sub).push(q);
    }

    const subKeys = Array.from(subGroups.keys());
    if (subKeys.length === 0) return tierPool.slice(0, count);

    // Deterministically shuffle lists inside each subcategory
    for (const sub of subKeys) {
      subGroups.set(sub, shuffleArrayWithRng(subGroups.get(sub), rng));
    }

    const chosen = [];
    let cycle = 0;
    // Offset starting subcategory by (setIdx - 1) so sets rotate their leading subcategories
    const startSubOffset = (setIdx - 1) % subKeys.length;

    while (chosen.length < count && cycle < 20) {
      let addedInRound = 0;
      for (let i = 0; i < subKeys.length && chosen.length < count; i++) {
        const subIndex = (startSubOffset + i) % subKeys.length;
        const subKey = subKeys[subIndex];
        const list = subGroups.get(subKey) || [];
        if (list.length === 0) continue;

        // Pick distinct question offset per setIndex
        const qIdx = ((setIdx - 1) * Math.max(1, Math.ceil(count / subKeys.length)) + cycle) % list.length;
        const candidate = list[qIdx];
        if (candidate && !chosen.includes(candidate)) {
          chosen.push(candidate);
          addedInRound++;
        }
      }
      cycle++;
      if (addedInRound === 0) break;
    }

    // Fill any shortfall from the general tier pool
    if (chosen.length < count) {
      const remaining = tierPool.filter((q) => !chosen.includes(q));
      chosen.push(...shuffleArrayWithRng(remaining, rng).slice(0, count - chosen.length));
    }

    return chosen;
  }

  // 10 Easy, 5 Medium, 5 Hard
  const chosenEasy = pickTierQuestions(easy, 10, setIndex);
  const chosenMedium = pickTierQuestions(medium, 5, setIndex);
  const chosenHard = pickTierQuestions(hard, 5, setIndex);

  // If pool lacked specific tier, fallback fill from available
  const currentTotal = [...chosenEasy, ...chosenMedium, ...chosenHard];
  const remainingNeeded = Math.min(20, pool.length) - currentTotal.length;
  if (remainingNeeded > 0) {
    const unpicked = pool.filter((q) => !currentTotal.includes(q));
    currentTotal.push(...shuffleArrayWithRng(unpicked, rng).slice(0, remainingNeeded));
  }

  // First show easy questions till 1-5 (User Requirement)
  const first5Easy = chosenEasy.slice(0, 5);
  // Remaining 5 Easy, 5 Medium, 5 Hard are shuffled together for Q6-20
  const remaining15 = [
    ...chosenEasy.slice(5),
    ...chosenMedium,
    ...chosenHard,
  ];
  const shuffledRemaining = shuffleArrayWithRng(remaining15, rng);

  return [...first5Easy, ...shuffledRemaining];
}

/**
 * RULE 2: Individual Subcategory with Multiple Topics (e.g. Sports GK > Cricket, 200 Questions)
 * Formula:
 * - Set 1: Starts with Easy questions, 10 Easy, 5 Medium, 5 Hard (Q1-5 easy first)
 * - Set 2 onwards: 7 Easy, 7 Medium, 6 Hard/Expert
 * - Shuffles and mixes topics within that subcategory for high engagement
 */
export function createRule2SubCategoryMixSet(pool, setIndex, rng = Math.random) {
  const { easy, medium, hard } = bucketQuestionsByDifficulty(pool);

  if (setIndex === 1) {
    // Set 1: 10 Easy, 5 Medium, 5 Hard (Q1-5 easy first)
    const pickedEasy = shuffleArrayWithRng(easy, rng).slice(0, 10);
    const pickedMedium = shuffleArrayWithRng(medium, rng).slice(0, 5);
    const pickedHard = shuffleArrayWithRng(hard, rng).slice(0, 5);

    const first5Easy = pickedEasy.slice(0, 5);
    const rest = shuffleArrayWithRng([...pickedEasy.slice(5), ...pickedMedium, ...pickedHard], rng);
    const result = [...first5Easy, ...rest];

    if (result.length < 20 && pool.length >= 20) {
      const restPool = pool.filter((q) => !result.includes(q));
      result.push(...shuffleArrayWithRng(restPool, rng).slice(0, 20 - result.length));
    }
    return result;
  }

  // Set 2 onwards: 7 Easy, 7 Medium, 6 Hard/Expert
  const shuffledEasy = shuffleArrayWithRng(easy, rng);
  const shuffledMedium = shuffleArrayWithRng(medium, rng);
  const shuffledHard = shuffleArrayWithRng(hard, rng);

  const easyOffset = ((setIndex - 2) * 7 + 10) % Math.max(1, shuffledEasy.length);
  const medOffset = ((setIndex - 2) * 7 + 5) % Math.max(1, shuffledMedium.length);
  const hardOffset = ((setIndex - 2) * 6 + 5) % Math.max(1, shuffledHard.length);

  const pickedEasy = [
    ...shuffledEasy.slice(easyOffset, easyOffset + 7),
    ...shuffledEasy.slice(0, Math.max(0, 7 - (shuffledEasy.length - easyOffset))),
  ].slice(0, 7);

  const pickedMedium = [
    ...shuffledMedium.slice(medOffset, medOffset + 7),
    ...shuffledMedium.slice(0, Math.max(0, 7 - (shuffledMedium.length - medOffset))),
  ].slice(0, 7);

  const pickedHard = [
    ...shuffledHard.slice(hardOffset, hardOffset + 6),
    ...shuffledHard.slice(0, Math.max(0, 6 - (shuffledHard.length - hardOffset))),
  ].slice(0, 6);

  // Progressive arrangement: easy ➔ medium ➔ hard
  const result = [...pickedEasy, ...pickedMedium, ...pickedHard];
  if (result.length < 20 && pool.length >= 20) {
    const restPool = pool.filter((q) => !result.includes(q));
    result.push(...shuffleArrayWithRng(restPool, rng).slice(0, 20 - result.length));
  }
  return result;
}

/**
 * RULE 3: Specific Topic Selected (Pure Curated Drill-Down)
 * Formula:
 * - Pure progressive difficulty: 7 Easy, 7 Medium, 6 Hard/Expert
 * - Strictly ordered: Qs 1-7 easy, Qs 8-14 medium, Qs 15-20 hard/expert
 * - No random category jumps
 */
export function createRule3SpecificTopicSet(pool, setIndex, rng = null) {
  const { easy, medium, hard } = bucketQuestionsByDifficulty(pool);

  // Calculate slice offset for setIndex
  const easyOffset = ((setIndex - 1) * 7) % Math.max(1, easy.length);
  const medOffset = ((setIndex - 1) * 7) % Math.max(1, medium.length);
  const hardOffset = ((setIndex - 1) * 6) % Math.max(1, hard.length);

  const setEasy = [
    ...easy.slice(easyOffset, easyOffset + 7),
    ...easy.slice(0, Math.max(0, 7 - (easy.length - easyOffset))),
  ].slice(0, 7);

  const setMed = [
    ...medium.slice(medOffset, medOffset + 7),
    ...medium.slice(0, Math.max(0, 7 - (medium.length - medOffset))),
  ].slice(0, 7);

  const setHard = [
    ...hard.slice(hardOffset, hardOffset + 6),
    ...hard.slice(0, Math.max(0, 6 - (hard.length - hardOffset))),
  ].slice(0, 6);

  const combined = [...setEasy, ...setMed, ...setHard];
  if (combined.length < 20 && pool.length >= 20) {
    const remaining = pool.filter((q) => !combined.includes(q));
    combined.push(...remaining.slice(0, 20 - combined.length));
  }

  // Strict order: Easy first ➔ Medium ➔ Hard
  return combined.sort((a, b) => getDifficultyRank(a.difficulty) - getDifficultyRank(b.difficulty));
}

/**
 * RULE 4: Single Quiz Category Selected from Home / Bulk Upload
 * Formula:
 * - If 1 set: 10 Easy, 5 Medium, 5 Hard (easy first)
 * - If Multiple sets:
 *   - Set 1: All Easy questions (20 Easy) to onboard & build mastery
 *   - Set 2: 10 Easy, 5 Medium, 5 Hard/Expert (easy first)
 *   - Set 3+: 7 Easy, 7 Medium, 6 Hard/Expert
 * - Always show easy questions first in order.
 */
export function createRule4BulkCategorySet(pool, setIndex, totalSets = 1, rng = Math.random) {
  const { easy, medium, hard } = bucketQuestionsByDifficulty(pool);

  if (totalSets === 1) {
    // 1 set rule: 10 Easy, 5 Medium, 5 Hard (Q1-5 easy first)
    const pickedEasy = shuffleArrayWithRng(easy, rng).slice(0, 10);
    const pickedMed = shuffleArrayWithRng(medium, rng).slice(0, 5);
    const pickedHard = shuffleArrayWithRng(hard, rng).slice(0, 5);

    const first5 = pickedEasy.slice(0, 5);
    const rest = shuffleArrayWithRng([...pickedEasy.slice(5), ...pickedMed, ...pickedHard], rng);
    return [...first5, ...rest];
  }

  // Multiple set rule:
  const shuffledEasy = shuffleArrayWithRng(easy, rng);
  const shuffledMed = shuffleArrayWithRng(medium, rng);
  const shuffledHard = shuffleArrayWithRng(hard, rng);

  if (setIndex === 1) {
    // Set 1: All Easy questions (up to 20 easy)
    if (shuffledEasy.length >= 20) {
      return shuffledEasy.slice(0, 20);
    }
    // If not enough easy, fill with easiest medium
    const res = [...shuffledEasy];
    res.push(...shuffledMed.slice(0, 20 - res.length));
    return res.slice(0, 20);
  }

  if (setIndex === 2) {
    // Set 2: 10 Easy, 5 Medium, 5 Hard/Expert (easy first)
    const easyOffset = Math.min(20, shuffledEasy.length);
    const pickedEasy = shuffledEasy.slice(easyOffset, easyOffset + 10);
    const pickedMed = shuffledMed.slice(0, 5);
    const pickedHard = shuffledHard.slice(0, 5);

    const first5 = pickedEasy.slice(0, 5);
    const rest = shuffleArrayWithRng([...pickedEasy.slice(5), ...pickedMed, ...pickedHard], rng);
    return [...first5, ...rest];
  }

  // Set 3 onwards: 7 Easy, 7 Medium, 6 Hard/Expert (strict progressive order: easy -> medium -> hard)
  const easyOffset = (30 + (setIndex - 3) * 7) % Math.max(1, shuffledEasy.length);
  const medOffset = (5 + (setIndex - 3) * 7) % Math.max(1, shuffledMed.length);
  const hardOffset = (5 + (setIndex - 3) * 6) % Math.max(1, shuffledHard.length);

  const pickedEasy = [
    ...shuffledEasy.slice(easyOffset, easyOffset + 7),
    ...shuffledEasy.slice(0, Math.max(0, 7 - (shuffledEasy.length - easyOffset))),
  ].slice(0, 7);

  const pickedMed = [
    ...shuffledMed.slice(medOffset, medOffset + 7),
    ...shuffledMed.slice(0, Math.max(0, 7 - (shuffledMed.length - medOffset))),
  ].slice(0, 7);

  const pickedHard = [
    ...shuffledHard.slice(hardOffset, hardOffset + 6),
    ...shuffledHard.slice(0, Math.max(0, 6 - (shuffledHard.length - hardOffset))),
  ].slice(0, 6);

  const res = [...pickedEasy, ...pickedMed, ...pickedHard];
  return res.sort((a, b) => getDifficultyRank(a.difficulty) - getDifficultyRank(b.difficulty));
}

/**
 * MASTER ROUTER: Generates smart quiz sets applying the appropriate rule based on browsing context:
 * - Case A: All Subcategories active (Mega Pool) ➔ Rule 1
 * - Case B: Subcategory active, no topic selected ➔ Rule 2
 * - Case C: Topic active ➔ Rule 3
 * - Case D: Bulk category / Single category ➔ Rule 4
 */
export function generateSmartQuizSets({
  questions = [],
  category = null,
  selectedSubCategory = null,
  selectedTopic = null,
  effectiveSetSize = 20,
  rulesMode = "dynamic", // "dynamic" | "static"
}) {
  if (!Array.isArray(questions) || questions.length === 0 || effectiveSetSize <= 0) {
    return [];
  }

  const totalQuestions = questions.length;
  const numSets = Math.ceil(totalQuestions / effectiveSetSize);
  const sets = [];

  // Determine which rule applies
  let activeRuleName = "Rule 1 (Mega Pool Round-Robin)";
  let ruleType = "rule1";

  if (rulesMode === "static") {
    activeRuleName = "Static Sequential Order (Easy ➔ Medium ➔ Hard)";
    ruleType = "static";
  } else if (selectedTopic) {
    activeRuleName = "Rule 3 (Specific Topic 7-7-6 Curated)";
    ruleType = "rule3";
  } else if (selectedSubCategory) {
    activeRuleName = "Rule 2 (Subcategory Mixing: 10-5-5 ➔ 7-7-6)";
    ruleType = "rule2";
  } else if (!category?.subCategories || category.subCategories.length <= 1) {
    activeRuleName = "Rule 4 (Bulk Category Ladder)";
    ruleType = "rule4";
  } else {
    activeRuleName = "Rule 1 (Mega Pool 10-5-5 Round-Robin)";
    ruleType = "rule1";
  }

  for (let setIdx = 1; setIdx <= numSets; setIdx++) {
    const rng = createMulberry32(setIdx * 7919 + totalQuestions);
    let setQuestions = [];

    switch (ruleType) {
      case "static": {
        const start = (setIdx - 1) * effectiveSetSize;
        const slice = questions.slice(start, start + effectiveSetSize);
        setQuestions = slice.sort((a, b) => getDifficultyRank(a.difficulty) - getDifficultyRank(b.difficulty));
        break;
      }
      case "rule3": {
        setQuestions = createRule3SpecificTopicSet(questions, setIdx, rng);
        break;
      }
      case "rule2": {
        setQuestions = createRule2SubCategoryMixSet(questions, setIdx, rng);
        break;
      }
      case "rule4": {
        setQuestions = createRule4BulkCategorySet(questions, setIdx, numSets, rng);
        break;
      }
      case "rule1":
      default: {
        setQuestions = createRule1MegaPoolSet(questions, setIdx, rng);
        break;
      }
    }

    // Ensure set is padded or trimmed to effectiveSetSize
    if (setQuestions.length < effectiveSetSize && questions.length >= effectiveSetSize) {
      const missing = effectiveSetSize - setQuestions.length;
      const unpicked = questions.filter((q) => !setQuestions.includes(q));
      setQuestions.push(...unpicked.slice(0, missing));
    } else if (setQuestions.length > effectiveSetSize) {
      setQuestions = setQuestions.slice(0, effectiveSetSize);
    }

    // Compute tier counts for metadata badge
    const tierCounts = { easy: 0, medium: 0, hard: 0 };
    for (const q of setQuestions) {
      const r = getDifficultyRank(q.difficulty);
      if (r === 1) tierCounts.easy++;
      else if (r === 2) tierCounts.medium++;
      else tierCounts.hard++;
    }

    // Extract actual tags present in set questions
    const actualSetTags = Array.from(
      new Set(setQuestions.flatMap((q) => (Array.isArray(q.tags) ? q.tags : [])).filter(Boolean))
    ).slice(0, 3);

    sets.push({
      index: setIdx,
      id: `${category?.slug || category?.id || "quiz"}-set-${setIdx}`,
      title: `Set ${setIdx}`,
      questions: setQuestions,
      ruleApplied: activeRuleName,
      difficultyBalance: tierCounts,
      tags: actualSetTags,
    });
  }

  return sets;
}
