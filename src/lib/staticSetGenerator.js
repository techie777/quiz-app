// src/lib/staticSetGenerator.js
import { ObjectId } from "mongodb";

/**
 * Checks difficulty distribution for a 20-question set.
 * Standard ratio is 7 Easy + 7 Medium + 6 Hard/Expert.
 */
export function checkSetDifficultyMix(questions) {
  let easy = 0;
  let medium = 0;
  let hardExpert = 0;

  for (const q of questions) {
    const diff = String(q.difficulty || "").toLowerCase().trim();
    if (diff === "easy" || diff === "सरल" || diff === "1") {
      easy++;
    } else if (diff === "medium" || diff === "मध्यम" || diff === "2") {
      medium++;
    } else {
      // hard, expert, 3, 4
      hardExpert++;
    }
  }

  const isExact776 = easy === 7 && medium === 7 && hardExpert === 6;
  const warning = isExact776
    ? null
    : `Set mix has ${easy} easy, ${medium} medium, ${hardExpert} hard/expert (expected 7/7/6).`;

  return {
    easy,
    medium,
    hardExpert,
    isExact776,
    warning,
  };
}

/**
 * Generates static sets in sheet order (20 questions per set)
 * with pending remainder handling and append-only set numbers.
 *
 * @param {Object} options
 * @param {Array} options.questions - Array of question objects in sheet order
 * @param {Array} options.existingRemainder - Questions from previous incomplete batch
 * @param {number} options.startingSetNumber - Highest existing set number + 1
 * @param {string} options.subjectId - Subject ID
 * @param {string} options.subjectName - Subject Name
 * @param {string} options.topicId - Topic ID
 * @param {string} options.topicName - Topic Name
 * @param {string} options.category - Category (e.g. India GK)
 * @param {string} options.masterCategory - Master Category (e.g. GK)
 * @param {string} options.language - "hi" | "en"
 * @param {string} options.batchId - Import Batch ID
 */
export function buildStaticSetsInSheetOrder({
  questions = [],
  existingRemainder = [],
  startingSetNumber = 1,
  subjectId,
  subjectName,
  topicId,
  topicName,
  category = "India GK",
  categoryId = null,
  masterCategory = "GK",
  language = "en",
  batchId,
}) {
  // 1. Combine existing remainder (from previous upload) with new questions in exact upload order
  const combinedStream = [...existingRemainder, ...questions];

  const fullSets = [];
  const warnings = [];
  let currentSetNum = startingSetNumber;

  const totalFullSets = Math.floor(combinedStream.length / 20);

  for (let i = 0; i < totalFullSets; i++) {
    const sliceStart = i * 20;
    const sliceEnd = sliceStart + 20;
    const setQuestions = combinedStream.slice(sliceStart, sliceEnd);

    const mixStats = checkSetDifficultyMix(setQuestions);
    if (mixStats.warning) {
      warnings.push(`Set ${currentSetNum}: ${mixStats.warning}`);
    }

    const setId = `set_${subjectId}_${language}_${currentSetNum}`;

    fullSets.push({
      id: setId,
      subjectId,
      subjectName,
      topicId,
      topicName,
      category,
      categoryId,
      masterCategory,
      language,
      number: currentSetNum,
      title: `${subjectName} - Set ${currentSetNum}`,
      questionIds: setQuestions.map((q) => String(q._id || q.id)),
      questions: setQuestions.map((q, idx) => ({
        id: String(q._id || q.id),
        text: q.text,
        text_en: q.text_en || q.text,
        text_hi: q.text_hi || q.textHi,
        options: q.options,
        options_list: q.options_list,
        correctAnswer: q.correctAnswer,
        correctIndex: q.correctIndex !== undefined ? q.correctIndex : q.correct_index,
        difficulty: q.difficulty,
        explanation: q.explanation,
        explanation_en: q.explanation_en,
        explanation_hi: q.explanation_hi,
        position: idx + 1, // original sheet position inside set
      })),
      mix: {
        easy: mixStats.easy,
        medium: mixStats.medium,
        hardExpert: mixStats.hardExpert,
      },
      mixWarning: mixStats.warning,
      badge: "Standard", // Admin can toggle to "Easy set", "Challenge set"
      status: "published",
      scope: "subject",
      importBatchId: batchId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    currentSetNum++;
  }

  // Pending remainder questions (< 20)
  const remainderQuestions = combinedStream.slice(totalFullSets * 20);

  return {
    sets: fullSets,
    remainder: remainderQuestions,
    warnings,
    totalCreatedSets: fullSets.length,
    totalQuestionsAssigned: fullSets.length * 20,
    remainderCount: remainderQuestions.length,
  };
}

/**
 * Execute set generation and save to MongoDB
 */
export async function saveGeneratedStaticSets({
  db,
  subjectId,
  subjectName,
  topicId,
  topicName,
  category,
  categoryId,
  masterCategory,
  language,
  newQuestions,
  batchId,
}) {
  const setsCol = db.collection("gk_sets");
  const remaindersCol = db.collection("gk_remainders");
  const subjectsCol = db.collection("gk_subjects");

  // 1. Fetch pending remainder for this subject + language
  const existingRemDoc = await remaindersCol.findOne({ subjectId, language });
  const existingRemainder = existingRemDoc?.questions || [];

  // 2. Determine next permanent set number
  const highestSetDoc = await setsCol
    .find({ subjectId, language })
    .sort({ number: -1 })
    .limit(1)
    .toArray();
  const startingSetNumber = highestSetDoc.length > 0 ? (highestSetDoc[0].number || 0) + 1 : 1;

  // 3. Build sets
  const buildResult = buildStaticSetsInSheetOrder({
    questions: newQuestions,
    existingRemainder,
    startingSetNumber,
    subjectId,
    subjectName,
    topicId,
    topicName,
    category,
    categoryId,
    masterCategory,
    language,
    batchId,
  });

  // 4. Save newly created sets
  if (buildResult.sets.length > 0) {
    const bulkOps = buildResult.sets.map((setDoc) => ({
      updateOne: {
        filter: { id: setDoc.id },
        update: { $set: setDoc },
        upsert: true,
      },
    }));
    await setsCol.bulkWrite(bulkOps);
  }

  // 5. Update or clear remainder
  if (buildResult.remainder.length > 0) {
    await remaindersCol.updateOne(
      { subjectId, language },
      {
        $set: {
          subjectId,
          language,
          count: buildResult.remainder.length,
          questions: buildResult.remainder,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  } else {
    await remaindersCol.deleteOne({ subjectId, language });
  }

  // 6. Update subject counts in gk_subjects
  const totalSubjectSets = await setsCol.countDocuments({ subjectId, status: "published" });
  const totalSubjectQuestions = await db.collection("Question").countDocuments({ subjectId, status: "published" });

  await subjectsCol.updateOne(
    { id: subjectId },
    {
      $set: {
        setCount: totalSubjectSets,
        questionCount: totalSubjectQuestions,
        updatedAt: new Date(),
      },
    }
  );

  return buildResult;
}
