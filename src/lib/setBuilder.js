import { getDb } from "./mongoDb";
import { ObjectId } from "mongodb";

/**
 * Step 6: Balanced Auto-Set Building Engine
 * Format per 20-question set:
 * - 7 Easy questions (Level 1)
 * - 7 Medium questions (Level 2)
 * - 6 Hard questions (Level 3)
 * Total: 20 Questions
 *
 * Rules:
 * - Publish a set only when bucket has >= 15 questions.
 * - Sets are frozen: question IDs are locked per set index.
 * - Dynamic shortfall handling: If short on one difficulty, fills from others proportionally.
 */

export const DEFAULT_SET_CONFIG = {
  setSize: 20,
  easyRatio: 7,
  mediumRatio: 7,
  hardRatio: 6,
  minThreshold: 15,
};

/**
 * Fetch current set configuration from DB or return defaults
 */
export async function getSetConfig() {
  try {
    const db = await getDb();
    const configSetting = await db.collection("Setting").findOne({ key: "set_builder_config" });
    if (configSetting?.value) {
      return { ...DEFAULT_SET_CONFIG, ...JSON.parse(configSetting.value) };
    }
  } catch (err) {
    console.error("Error reading set config:", err);
  }
  return DEFAULT_SET_CONFIG;
}

/**
 * Partition questions array into Easy (1), Medium (2), Hard (3) pools
 */
function partitionByDifficulty(questions) {
  const easy = [];
  const medium = [];
  const hard = [];

  for (const q of questions) {
    const level = q.difficulty_level || (q.difficulty === "hard" ? 3 : q.difficulty === "medium" ? 2 : 1);
    if (level === 1) easy.push(q);
    else if (level === 2) medium.push(q);
    else hard.push(q);
  }

  return { easy, medium, hard };
}

/**
 * Build balanced sets of 20 questions (7 Easy, 7 Medium, 6 Hard) from question pools
 */
export function buildBalancedSets(questions, config = DEFAULT_SET_CONFIG) {
  const { setSize = 20, easyRatio = 7, mediumRatio = 7, hardRatio = 6, minThreshold = 15 } = config;

  if (!questions || questions.length < minThreshold) {
    return [];
  }

  const { easy, medium, hard } = partitionByDifficulty(questions);

  let easyPtr = 0;
  let mediumPtr = 0;
  let hardPtr = 0;

  const sets = [];
  let setIndex = 1;

  while (true) {
    const remainingEasy = easy.length - easyPtr;
    const remainingMed = medium.length - mediumPtr;
    const remainingHard = hard.length - hardPtr;
    const totalRemaining = remainingEasy + remainingMed + remainingHard;

    // Check if we can form at least a valid set
    if (totalRemaining < minThreshold) {
      break;
    }

    const currentSetQuestions = [];
    let easyTaken = 0;
    let medTaken = 0;
    let hardTaken = 0;

    // 1. Take up to 7 Easy
    const wantEasy = Math.min(easyRatio, remainingEasy);
    for (let i = 0; i < wantEasy; i++) {
      currentSetQuestions.push(easy[easyPtr++]);
      easyTaken++;
    }

    // 2. Take up to 7 Medium
    const wantMed = Math.min(mediumRatio, remainingMed);
    for (let i = 0; i < wantMed; i++) {
      currentSetQuestions.push(medium[mediumPtr++]);
      medTaken++;
    }

    // 3. Take up to 6 Hard
    const wantHard = Math.min(hardRatio, remainingHard);
    for (let i = 0; i < wantHard; i++) {
      currentSetQuestions.push(hard[hardPtr++]);
      hardTaken++;
    }

    // 4. If current set has < setSize, fill shortfall from remaining available pools
    let shortfall = setSize - currentSetQuestions.length;
    while (shortfall > 0) {
      let filled = false;
      // Try medium first
      if (mediumPtr < medium.length) {
        currentSetQuestions.push(medium[mediumPtr++]);
        medTaken++;
        shortfall--;
        filled = true;
      }
      // Then easy
      if (shortfall > 0 && easyPtr < easy.length) {
        currentSetQuestions.push(easy[easyPtr++]);
        easyTaken++;
        shortfall--;
        filled = true;
      }
      // Then hard
      if (shortfall > 0 && hardPtr < hard.length) {
        currentSetQuestions.push(hard[hardPtr++]);
        hardTaken++;
        shortfall--;
        filled = true;
      }
      if (!filled) break;
    }

    // If set meets minimum threshold (15+ questions), accept it
    if (currentSetQuestions.length >= minThreshold) {
      sets.push({
        setIndex,
        title: `Set ${setIndex}`,
        titleHi: `सेट ${setIndex}`,
        questionIds: currentSetQuestions.map((q) => q._id.toString()),
        questionCount: currentSetQuestions.length,
        difficultyBreakdown: {
          easy: easyTaken,
          medium: medTaken,
          hard: hardTaken,
        },
        isFrozen: true,
        status: "published",
      });
      setIndex++;
    } else {
      break;
    }
  }

  return sets;
}

/**
 * Generate and store frozen sets for a specific topic
 */
export async function generateSetsForTopic(topicId) {
  const db = await getDb();
  const config = await getSetConfig();

  const query = {
    status: "published",
    $or: [
      { topic_id: ObjectId.isValid(topicId) ? new ObjectId(topicId) : topicId },
      { topic_id: String(topicId) },
    ],
  };

  const questions = await db.collection("Question").find(query).toArray();
  const generatedSets = buildBalancedSets(questions, config);

  const now = new Date();
  const topicObjectId = ObjectId.isValid(topicId) ? new ObjectId(topicId) : topicId;

  // Find topic info for category pointer
  const topicDoc = await db.collection("TaxonomyTopic").findOne({ _id: topicObjectId });
  const categoryId = topicDoc?.categoryId || null;

  for (const set of generatedSets) {
    await db.collection("QuizSet").updateOne(
      { topicId: topicObjectId, setIndex: set.setIndex },
      {
        $set: {
          topicId: topicObjectId,
          categoryId: categoryId,
          setIndex: set.setIndex,
          title: set.title,
          titleHi: set.titleHi,
          questionIds: set.questionIds,
          questionCount: set.questionCount,
          difficultyBreakdown: set.difficultyBreakdown,
          isFrozen: true,
          status: "published",
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );
  }

  return generatedSets;
}

/**
 * Generate and store frozen sets for an entire category
 */
export async function generateSetsForCategory(categoryId) {
  const db = await getDb();
  const config = await getSetConfig();
  const catObjectId = ObjectId.isValid(categoryId) ? new ObjectId(categoryId) : categoryId;

  const query = {
    status: "published",
    $or: [
      { category_id: catObjectId },
      { categoryId: catObjectId },
      { category_id: String(categoryId) },
    ],
  };

  const questions = await db.collection("Question").find(query).toArray();
  const generatedSets = buildBalancedSets(questions, config);

  const now = new Date();

  for (const set of generatedSets) {
    await db.collection("QuizSet").updateOne(
      { categoryId: catObjectId, topicId: null, setIndex: set.setIndex },
      {
        $set: {
          categoryId: catObjectId,
          topicId: null,
          setIndex: set.setIndex,
          title: set.title,
          titleHi: set.titleHi,
          questionIds: set.questionIds,
          questionCount: set.questionCount,
          difficultyBreakdown: set.difficultyBreakdown,
          isFrozen: true,
          status: "published",
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );
  }

  return generatedSets;
}
