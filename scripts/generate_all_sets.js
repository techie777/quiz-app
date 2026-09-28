const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

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

function buildBalancedSets(questions) {
  const setSize = 20;
  const easyRatio = 7;
  const mediumRatio = 7;
  const hardRatio = 6;
  const minThreshold = 15;

  if (!questions || questions.length < minThreshold) return [];

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

    if (totalRemaining < minThreshold) break;

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

    // 4. Fill shortfalls from remaining pools
    let shortfall = setSize - currentSetQuestions.length;
    while (shortfall > 0) {
      let filled = false;
      if (mediumPtr < medium.length) {
        currentSetQuestions.push(medium[mediumPtr++]);
        medTaken++;
        shortfall--;
        filled = true;
      }
      if (shortfall > 0 && easyPtr < easy.length) {
        currentSetQuestions.push(easy[easyPtr++]);
        easyTaken++;
        shortfall--;
        filled = true;
      }
      if (shortfall > 0 && hardPtr < hard.length) {
        currentSetQuestions.push(hard[hardPtr++]);
        hardTaken++;
        shortfall--;
        filled = true;
      }
      if (!filled) break;
    }

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

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB for fast bulk auto-set generation...");
    const db = client.db("quizweb");

    await db.collection("QuizSet").createIndex({ topicId: 1, setIndex: 1 });
    await db.collection("QuizSet").createIndex({ categoryId: 1, setIndex: 1 });
    await db.collection("QuizSet").createIndex({ examSlug: 1, setIndex: 1 });
    await db.collection("QuizSet").createIndex({ stateSlug: 1, setIndex: 1 });

    console.log("Fetching all published questions in a single query...");
    const allQuestions = await db.collection("Question").find(
      { status: "published" },
      { projection: { _id: 1, topic_id: 1, categoryId: 1, category_id: 1, difficulty_level: 1, difficulty: 1, exam: 1, state: 1 } }
    ).toArray();
    console.log(`Loaded ${allQuestions.length} published questions.`);

    // Group by topic_id, categoryId, exam, and state
    const topicMap = new Map();
    const catMap = new Map();
    const examMap = new Map();
    const stateMap = new Map();

    for (const q of allQuestions) {
      if (q.topic_id) {
        const tIdStr = q.topic_id.toString();
        if (!topicMap.has(tIdStr)) topicMap.set(tIdStr, []);
        topicMap.get(tIdStr).push(q);
      }
      const cId = q.categoryId || q.category_id;
      if (cId) {
        const cIdStr = cId.toString();
        if (!catMap.has(cIdStr)) catMap.set(cIdStr, []);
        catMap.get(cIdStr).push(q);
      }
      if (Array.isArray(q.exam)) {
        for (const ex of q.exam) {
          const exSlug = ex.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          if (exSlug) {
            if (!examMap.has(exSlug)) examMap.set(exSlug, []);
            examMap.get(exSlug).push(q);
          }
        }
      } else if (typeof q.exam === 'string' && q.exam.trim()) {
        const exSlug = q.exam.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (exSlug) {
          if (!examMap.has(exSlug)) examMap.set(exSlug, []);
          examMap.get(exSlug).push(q);
        }
      }
      if (typeof q.state === 'string' && q.state.trim()) {
        const stSlug = q.state.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-gk';
        if (!stateMap.has(stSlug)) stateMap.set(stSlug, []);
        stateMap.get(stSlug).push(q);
      }
    }

    const now = new Date();
    const bulkOps = [];

    // 1. Generate sets per topic with >= 15 questions
    const topics = await db.collection("TaxonomyTopic").find().toArray();
    let totalTopicSets = 0;

    for (const top of topics) {
      const topQuestions = topicMap.get(top._id.toString()) || [];
      if (topQuestions.length >= 15) {
        const sets = buildBalancedSets(topQuestions);
        for (const s of sets) {
          bulkOps.push({
            updateOne: {
              filter: { topicId: top._id, setIndex: s.setIndex },
              update: {
                $set: {
                  topicId: top._id,
                  categoryId: top.categoryId,
                  setIndex: s.setIndex,
                  title: s.title,
                  titleHi: s.titleHi,
                  questionIds: s.questionIds,
                  questionCount: s.questionCount,
                  difficultyBreakdown: s.difficultyBreakdown,
                  isFrozen: true,
                  status: "published",
                  updatedAt: now,
                },
                $setOnInsert: {
                  createdAt: now,
                },
              },
              upsert: true,
            },
          });
        }
        totalTopicSets += sets.length;
      }
    }

    // 2. Generate sets per category with >= 15 questions
    const categories = await db.collection("Category").find({ hidden: false }).toArray();
    let totalCatSets = 0;

    for (const cat of categories) {
      const catQuestions = catMap.get(cat._id.toString()) || [];
      if (catQuestions.length >= 15) {
        const sets = buildBalancedSets(catQuestions);
        for (const s of sets) {
          bulkOps.push({
            updateOne: {
              filter: { categoryId: cat._id, topicId: null, setIndex: s.setIndex },
              update: {
                $set: {
                  categoryId: cat._id,
                  topicId: null,
                  setIndex: s.setIndex,
                  title: s.title,
                  titleHi: s.titleHi,
                  questionIds: s.questionIds,
                  questionCount: s.questionCount,
                  difficultyBreakdown: s.difficultyBreakdown,
                  isFrozen: true,
                  status: "published",
                  updatedAt: now,
                },
                $setOnInsert: {
                  createdAt: now,
                },
              },
              upsert: true,
            },
          });
        }
        totalCatSets += sets.length;
      }
    }

    // 3. Generate sets per exam with >= 15 questions
    let totalExamSets = 0;
    for (const [examSlug, examQuestions] of examMap.entries()) {
      if (examQuestions.length >= 15) {
        // Cap to 25 sets max per exam so it doesn't inflate
        const sets = buildBalancedSets(examQuestions).slice(0, 25);
        for (const s of sets) {
          bulkOps.push({
            updateOne: {
              filter: { examSlug, setIndex: s.setIndex },
              update: {
                $set: {
                  examSlug,
                  topicId: null,
                  categoryId: null,
                  setIndex: s.setIndex,
                  title: s.title,
                  titleHi: s.titleHi,
                  questionIds: s.questionIds,
                  questionCount: s.questionCount,
                  difficultyBreakdown: s.difficultyBreakdown,
                  isFrozen: true,
                  status: "published",
                  updatedAt: now,
                },
                $setOnInsert: {
                  createdAt: now,
                },
              },
              upsert: true,
            },
          });
        }
        totalExamSets += sets.length;
      }
    }

    // 4. Generate sets per state with >= 15 questions
    let totalStateSets = 0;
    for (const [stateSlug, stateQuestions] of stateMap.entries()) {
      if (stateQuestions.length >= 15) {
        const sets = buildBalancedSets(stateQuestions);
        for (const s of sets) {
          bulkOps.push({
            updateOne: {
              filter: { stateSlug, setIndex: s.setIndex },
              update: {
                $set: {
                  stateSlug,
                  topicId: null,
                  categoryId: null,
                  setIndex: s.setIndex,
                  title: s.title,
                  titleHi: s.titleHi,
                  questionIds: s.questionIds,
                  questionCount: s.questionCount,
                  difficultyBreakdown: s.difficultyBreakdown,
                  isFrozen: true,
                  status: "published",
                  updatedAt: now,
                },
                $setOnInsert: {
                  createdAt: now,
                },
              },
              upsert: true,
            },
          });
        }
        totalStateSets += sets.length;
      }
    }

    console.log(`Generated ${bulkOps.length} sets (${totalTopicSets} topic sets, ${totalCatSets} category sets, ${totalExamSets} exam sets, ${totalStateSets} state sets).`);
    console.log(`Executing bulk upsert operations...`);
    if (bulkOps.length > 0) {
      // Chunk bulkOps by 500 to avoid packet size limits
      for (let i = 0; i < bulkOps.length; i += 500) {
        const chunk = bulkOps.slice(i, i + 500);
        await db.collection("QuizSet").bulkWrite(chunk, { ordered: false });
        console.log(`Upserted chunk ${i + 1} to ${Math.min(i + 500, bulkOps.length)}...`);
      }
    }

    const totalSetsInDB = await db.collection("QuizSet").countDocuments();
    const sampleSet = await db.collection("QuizSet").findOne({ topicId: { $ne: null } });
    console.log(`Total QuizSet records in DB: ${totalSetsInDB}`);
    console.log("Sample Balanced Set:\n", JSON.stringify(sampleSet, null, 2));

  } catch (err) {
    console.error("Set generation error:", err);
  } finally {
    await client.close();
  }
}

run();
