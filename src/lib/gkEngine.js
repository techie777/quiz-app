import { DEFAULT_GK_RULES, calculateQuestionHash } from "./gkData.js";

/**
 * Pseudo-random generator with seed for repeatable shuffles
 */
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffleArray(arr, seed = 42) {
  const rng = seededRandom(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Helper to compute top tags from a set's questions
 */
export function extractSetTags(questions, defaultTopicName = "") {
  if (!questions || questions.length === 0) {
    return defaultTopicName ? [defaultTopicName] : [];
  }

  const subTopicCounts = {};
  const topicCounts = {};

  for (const q of questions) {
    if (q.subTopic && q.subTopic.trim()) {
      const st = q.subTopic.trim();
      subTopicCounts[st] = (subTopicCounts[st] || 0) + 1;
    }
    if (q.topicName || q.topicId) {
      const tn = q.topicName || q.topicId;
      topicCounts[tn] = (topicCounts[tn] || 0) + 1;
    }
  }

  // Pick top 3 subTopics
  const topSubTopics = Object.entries(subTopicCounts)
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0])
    .slice(0, 3);

  if (topSubTopics.length > 0) {
    return topSubTopics;
  }

  // Otherwise pick top 3 topics
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0])
    .slice(0, 3);

  return topTopics.length > 0 ? topTopics : [defaultTopicName || "General Knowledge"];
}

/**
 * Builds Topic Sets for a specific topic
 * Rule 3.1: 7 easy + 7 medium + 6 hard/expert (early sets more hard, later more expert)
 * Order inside set: easy -> medium -> hard -> expert
 */
export function buildTopicSets({
  topicId,
  category,
  language,
  topicName,
  questions,
  rules = DEFAULT_GK_RULES,
  allowPartialFinalSet = false,
  seed = 101,
}) {
  const easyPool = shuffleArray(
    questions.filter((q) => (q.difficulty || "").toLowerCase() === "easy"),
    seed
  );
  const mediumPool = shuffleArray(
    questions.filter((q) => (q.difficulty || "").toLowerCase() === "medium"),
    seed + 1
  );
  const hardPool = shuffleArray(
    questions.filter((q) => (q.difficulty || "").toLowerCase() === "hard"),
    seed + 2
  );
  const expertPool = shuffleArray(
    questions.filter((q) => (q.difficulty || "").toLowerCase() === "expert"),
    seed + 3
  );

  const setSize = rules.setSize || 20;
  const targetEasy = rules.topicSetMix?.easy || 7;
  const targetMedium = rules.topicSetMix?.medium || 7;
  const targetHardExpert = rules.topicSetMix?.hardExpert || 6;

  // Max full sets we can form based on available pools
  const maxPossibleSets = Math.min(
    Math.floor(easyPool.length / targetEasy),
    Math.floor(mediumPool.length / targetMedium),
    Math.floor((hardPool.length + expertPool.length) / targetHardExpert)
  );

  let totalSetsToBuild = Math.max(0, maxPossibleSets);

  // If allowPartialFinalSet is enabled and we have at least 10 questions left
  const hasPartial =
    allowPartialFinalSet &&
    (easyPool.length % targetEasy) +
      (mediumPool.length % targetMedium) +
      ((hardPool.length + expertPool.length) % targetHardExpert) >=
      10;

  const sets = [];
  let easyIdx = 0;
  let mediumIdx = 0;
  let hardIdx = 0;
  let expertIdx = 0;

  for (let s = 1; s <= totalSetsToBuild; s++) {
    const isLateSet = totalSetsToBuild > 1 && s > Math.floor(totalSetsToBuild / 2);
    // Early sets: more hard (e.g. 5 hard + 1 expert)
    // Later sets: more expert (e.g. 3 hard + 3 expert or 2 hard + 4 expert)
    let desiredExpert = isLateSet ? Math.min(3, expertPool.length - expertIdx) : Math.min(1, expertPool.length - expertIdx);
    desiredExpert = Math.max(0, desiredExpert);
    const desiredHard = targetHardExpert - desiredExpert;

    const setEasy = easyPool.slice(easyIdx, easyIdx + targetEasy);
    easyIdx += targetEasy;

    const setMedium = mediumPool.slice(mediumIdx, mediumIdx + targetMedium);
    mediumIdx += targetMedium;

    let setHard = hardPool.slice(hardIdx, hardIdx + desiredHard);
    hardIdx += setHard.length;

    let setExpert = expertPool.slice(expertIdx, expertIdx + desiredExpert);
    expertIdx += setExpert.length;

    // If hard pool fell short, fill from expert
    if (setHard.length + setExpert.length < targetHardExpert && expertIdx < expertPool.length) {
      const needed = targetHardExpert - (setHard.length + setExpert.length);
      const extraExpert = expertPool.slice(expertIdx, expertIdx + needed);
      setExpert.push(...extraExpert);
      expertIdx += extraExpert.length;
    }

    // If expert pool fell short, fill from hard
    if (setHard.length + setExpert.length < targetHardExpert && hardIdx < hardPool.length) {
      const needed = targetHardExpert - (setHard.length + setExpert.length);
      const extraHard = hardPool.slice(hardIdx, hardIdx + needed);
      setHard.push(...extraHard);
      hardIdx += extraHard.length;
    }

    // Combine inside set: easy -> medium -> hard -> expert
    const setQuestions = [...setEasy, ...setMedium, ...setHard, ...setExpert];
    const tags = extractSetTags(setQuestions, topicName);

    sets.push({
      id: `gk_${category.replace(/\s+/g, "_").toLowerCase()}_${topicId}_set_${s}`,
      category,
      language,
      scope: "topic",
      topicId,
      number: s,
      questionIds: setQuestions.map((q) => q._id || q.id),
      questions: setQuestions,
      mix: {
        easy: setEasy.length,
        medium: setMedium.length,
        hard: setHard.length,
        expert: setExpert.length,
      },
      phase: null,
      tags,
      locked: false,
      status: "draft",
    });
  }

  const unassigned = {
    easy: easyPool.slice(easyIdx),
    medium: mediumPool.slice(mediumIdx),
    hard: hardPool.slice(hardIdx),
    expert: expertPool.slice(expertIdx),
  };

  return {
    sets,
    unassignedCount: unassigned.easy.length + unassigned.medium.length + unassigned.hard.length + unassigned.expert.length,
    unassigned,
  };
}

/**
 * Builds Play All (Master Path) sets across all active topics
 * Rule 3.2: First 40% = phase 1 (only easy + medium), remaining 60% = phase 2 & 3
 * Mix of topics in admin order + weight rotation (maxPerTopicInMasterSet = 3)
 */
export function buildMasterPathSets({
  category,
  language,
  topics, // active topics sorted by order
  allQuestions,
  rules = DEFAULT_GK_RULES,
  pinnedTopicIds = [],
}) {
  const setSize = rules.setSize || 20;
  const ramp = rules.ramp || DEFAULT_GK_RULES.ramp;
  // Group questions by topicId and difficulty
  const questionMapByTopic = {};
  for (const t of topics) {
    questionMapByTopic[t.id] = {
      easy: [],
      medium: [],
      hard: [],
      expert: [],
    };
  }

  for (const q of allQuestions) {
    const tId = q.topicId;
    if (questionMapByTopic[tId]) {
      const diff = (q.difficulty || "medium").toLowerCase();
      if (questionMapByTopic[tId][diff]) {
        questionMapByTopic[tId][diff].push(q);
      }
    }
  }

  const topicsWithQuestions = topics.filter(
    (t) =>
      questionMapByTopic[t.id].easy.length +
        questionMapByTopic[t.id].medium.length +
        questionMapByTopic[t.id].hard.length +
        questionMapByTopic[t.id].expert.length >
      0
  );

  const maxPerTopic = Math.max(
    rules.maxPerTopicInMasterSet || 3,
    Math.ceil(setSize / Math.max(1, topicsWithQuestions.length))
  );

  // Shuffle pools
  for (const tId of Object.keys(questionMapByTopic)) {
    questionMapByTopic[tId].easy = shuffleArray(questionMapByTopic[tId].easy, 501);
    questionMapByTopic[tId].medium = shuffleArray(questionMapByTopic[tId].medium, 502);
    questionMapByTopic[tId].hard = shuffleArray(questionMapByTopic[tId].hard, 503);
    questionMapByTopic[tId].expert = shuffleArray(questionMapByTopic[tId].expert, 504);
  }

  // Total available per difficulty
  const totalAvailable = {
    easy: allQuestions.filter((q) => (q.difficulty || "").toLowerCase() === "easy").length,
    medium: allQuestions.filter((q) => (q.difficulty || "").toLowerCase() === "medium").length,
    hard: allQuestions.filter((q) => (q.difficulty || "").toLowerCase() === "hard").length,
    expert: allQuestions.filter((q) => (q.difficulty || "").toLowerCase() === "expert").length,
  };

  // Estimate total sets N (estimate based on total question count)
  const totalQ = allQuestions.length;
  let totalSetsN = Math.floor(totalQ / setSize);
  if (totalSetsN <= 0) return { sets: [], totalSets: 0, unassignedCount: totalQ };

  const sets = [];
  let topicPointer = 0;

  for (let s = 1; s <= totalSetsN; s++) {
    const progressPct = ((s - 1) / totalSetsN) * 100;
    const phaseConfig =
      ramp.find((r) => progressPct >= r.fromPct && progressPct < r.toPct) || ramp[ramp.length - 1];

    const phaseNumber = phaseConfig.phase || 1;
    const quota = {
      easy: phaseConfig.easy,
      medium: phaseConfig.medium,
      hard: phaseConfig.hard,
      expert: phaseConfig.expert,
    };

    const selectedQ = [];
    const setTopicCounts = {};

    // Helper to pick question of a specific difficulty respecting maxPerTopic and rotation
    const pickQuestions = (diff, count) => {
      let picked = 0;
      let attempts = 0;
      const maxAttempts = topics.length * 2;

      while (picked < count && attempts < maxAttempts) {
        attempts++;
        const currentTopic = topics[topicPointer % topics.length];
        topicPointer++;

        // If pinned block is active for sets 1..10 and topic is not pinned
        if (s <= 10 && pinnedTopicIds.length > 0 && !pinnedTopicIds.includes(currentTopic.id)) {
          continue;
        }

        const topicId = currentTopic.id;
        const currentCountFromTopic = setTopicCounts[topicId] || 0;

        if (currentCountFromTopic >= maxPerTopic) {
          continue;
        }

        const pool = questionMapByTopic[topicId][diff];
        if (pool && pool.length > 0) {
          const q = pool.pop();
          q.topicName = currentTopic.name;
          selectedQ.push(q);
          setTopicCounts[topicId] = currentCountFromTopic + 1;
          picked++;
        }
      }
    };

    // Pick according to phase quota
    pickQuestions("easy", quota.easy);
    pickQuestions("medium", quota.medium);
    pickQuestions("hard", quota.hard);
    pickQuestions("expert", quota.expert);

    // If quotas couldn't be satisfied, try filling with any available
    if (selectedQ.length < setSize) {
      for (const diff of ["medium", "easy", "hard", "expert"]) {
        const remaining = setSize - selectedQ.length;
        if (remaining <= 0) break;
        pickQuestions(diff, remaining);
      }
    }

    if (selectedQ.length < setSize) {
      // Cannot form another full 20-Q set
      break;
    }

    // Order questions inside set: easy -> medium -> hard -> expert
    selectedQ.sort((a, b) => {
      const orderMap = { easy: 1, medium: 2, hard: 3, expert: 4 };
      return (orderMap[a.difficulty] || 2) - (orderMap[b.difficulty] || 2);
    });

    const tags = extractSetTags(selectedQ, category);

    sets.push({
      id: `gk_${category.replace(/\s+/g, "_").toLowerCase()}_master_set_${s}`,
      category,
      language,
      scope: "master",
      topicId: null,
      number: s,
      questionIds: selectedQ.map((q) => q._id || q.id),
      questions: selectedQ,
      mix: {
        easy: selectedQ.filter((q) => (q.difficulty || "").toLowerCase() === "easy").length,
        medium: selectedQ.filter((q) => (q.difficulty || "").toLowerCase() === "medium").length,
        hard: selectedQ.filter((q) => (q.difficulty || "").toLowerCase() === "hard").length,
        expert: selectedQ.filter((q) => (q.difficulty || "").toLowerCase() === "expert").length,
      },
      phase: phaseNumber,
      tags,
      locked: false,
      status: "draft",
    });
  }

  return {
    sets,
    totalSets: sets.length,
    unassignedCount: allQuestions.length - sets.length * setSize,
  };
}

/**
 * Feasibility Check algorithm (Rules tab)
 * Compares required vs available questions per difficulty across topics and phases
 */
export function checkGkFeasibility({ allQuestions, rules = DEFAULT_GK_RULES }) {
  const setSize = rules.setSize || 20;
  const ramp = rules.ramp || DEFAULT_GK_RULES.ramp;

  const available = {
    easy: allQuestions.filter((q) => (q.difficulty || "").toLowerCase() === "easy").length,
    medium: allQuestions.filter((q) => (q.difficulty || "").toLowerCase() === "medium").length,
    hard: allQuestions.filter((q) => (q.difficulty || "").toLowerCase() === "hard").length,
    expert: allQuestions.filter((q) => (q.difficulty || "").toLowerCase() === "expert").length,
    total: allQuestions.length,
  };

  const estimatedSets = Math.floor(available.total / setSize);

  let requiredEasy = 0;
  let requiredMedium = 0;
  let requiredHard = 0;
  let requiredExpert = 0;

  for (let s = 1; s <= estimatedSets; s++) {
    const progressPct = ((s - 1) / estimatedSets) * 100;
    const phaseConfig =
      ramp.find((r) => progressPct >= r.fromPct && progressPct < r.toPct) || ramp[ramp.length - 1];

    requiredEasy += phaseConfig.easy;
    requiredMedium += phaseConfig.medium;
    requiredHard += phaseConfig.hard;
    requiredExpert += phaseConfig.expert;
  }

  const warnings = [];
  if (available.easy < requiredEasy) {
    warnings.push(`Phase 1/2 needs ${requiredEasy} Easy questions, but only ${available.easy} are available.`);
  }
  if (available.medium < requiredMedium) {
    warnings.push(`Needs ${requiredMedium} Medium questions, but only ${available.medium} are available.`);
  }
  if (available.hard < requiredHard) {
    warnings.push(`Phases 2/3 need ${requiredHard} Hard questions, but only ${available.hard} are available.`);
  }
  if (available.expert < requiredExpert) {
    warnings.push(`Challenge Phase needs ${requiredExpert} Expert questions, but only ${available.expert} are available.`);
  }

  return {
    available,
    required: {
      easy: requiredEasy,
      medium: requiredMedium,
      hard: requiredHard,
      expert: requiredExpert,
      total: estimatedSets * setSize,
    },
    estimatedSets,
    feasible: warnings.length === 0,
    warnings,
  };
}

/**
 * Dry run generation for admin Set Builder preview
 */
export function generateGkSetsDryRun({
  category,
  language = "en",
  topics,
  questions,
  existingSets = [],
  rules = DEFAULT_GK_RULES,
  regenerateUnlockedOnly = true,
  allowPartialFinalSet = false,
  pinnedTopicIds = [],
  type = "all",
}) {
  const lockedTopicSetIds = new Set(
    existingSets.filter((s) => s.scope === "topic" && s.locked).map((s) => s.id)
  );
  const lockedMasterSetIds = new Set(
    existingSets.filter((s) => s.scope === "master" && s.locked).map((s) => s.id)
  );

  let topicSets = [];
  let masterSets = [];
  let leftovers = { easy: 0, medium: 0, hard: 0, expert: 0, total: 0 };

  // 1. Generate Topic Sets
  if (type === "all" || type === "topic") {
    for (const t of topics) {
      const topicQuestions = questions.filter((q) => q.topicId === t.id);
      const res = buildTopicSets({
        topicId: t.id,
        category,
        language,
        topicName: t.name,
        questions: topicQuestions,
        rules,
        allowPartialFinalSet,
      });

      for (const s of res.sets) {
        if (regenerateUnlockedOnly && lockedTopicSetIds.has(s.id)) {
          // Keep existing locked set
          const existing = existingSets.find((es) => es.id === s.id);
          topicSets.push(existing || s);
        } else {
          topicSets.push(s);
        }
      }

      leftovers.easy += res.unassigned.easy.length;
      leftovers.medium += res.unassigned.medium.length;
      leftovers.hard += res.unassigned.hard.length;
      leftovers.expert += res.unassigned.expert.length;
    }
  }

  // 2. Generate Master Path Sets
  if (type === "all" || type === "master") {
    const res = buildMasterPathSets({
      category,
      language,
      topics,
      allQuestions: questions,
      rules,
      pinnedTopicIds,
    });

    for (const s of res.sets) {
      if (regenerateUnlockedOnly && lockedMasterSetIds.has(s.id)) {
        const existing = existingSets.find((es) => es.id === s.id);
        masterSets.push(existing || s);
      } else {
        masterSets.push(s);
      }
    }
  }

  leftovers.total =
    leftovers.easy + leftovers.medium + leftovers.hard + leftovers.expert;

  return {
    topicSets,
    masterSets,
    leftovers,
  };
}

/**
 * Saves generated sets to the database (with unlocked set protection)
 */
export async function saveGeneratedSets({
  db,
  generatedTopicSets,
  generatedMasterSets,
  topicSets,
  masterSets,
  category,
  language = "en",
  regenerateUnlockedOnly = true,
  type = "all",
}) {
  const finalTopicSets = generatedTopicSets || topicSets || [];
  const finalMasterSets = generatedMasterSets || masterSets || [];
  const setsCol = db.collection("gk_sets");
  const topicsCol = db.collection("gk_topics");

  const deleteFilter = { category, language };
  if (regenerateUnlockedOnly) {
    deleteFilter.locked = { $ne: true };
  }
  if (type === "topic") deleteFilter.scope = "topic";
  if (type === "master") deleteFilter.scope = "master";

  await setsCol.deleteMany(deleteFilter);

  const docsToInsert = [];
  const now = new Date();

  if (type === "all" || type === "topic") {
    for (const s of finalTopicSets) {
      if (regenerateUnlockedOnly && s.locked) continue;
      docsToInsert.push({
        ...s,
        _id: undefined,
        status: "published",
        locked: true,
        version: s.version || 1,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (type === "all" || type === "master") {
    for (const s of finalMasterSets) {
      if (regenerateUnlockedOnly && s.locked) continue;
      docsToInsert.push({
        ...s,
        _id: undefined,
        status: "published",
        locked: true,
        version: s.version || 1,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  let insertedCount = 0;
  if (docsToInsert.length > 0) {
    const res = await setsCol.insertMany(docsToInsert);
    insertedCount = res.insertedCount;
  }

  // Update setsCount on topics
  const topics = await topicsCol.find({ category }).toArray();
  for (const t of topics) {
    const count = await setsCol.countDocuments({
      category,
      scope: "topic",
      topicId: t.id,
    });
    await topicsCol.updateOne({ id: t.id }, { $set: { setsCount: count } });
  }

  return {
    savedTopicSetsCount: finalTopicSets.length,
    savedMasterSetsCount: finalMasterSets.length,
    insertedCount,
  };
}
