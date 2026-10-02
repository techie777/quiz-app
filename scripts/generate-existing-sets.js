const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const { MongoClient } = require("mongodb");

const DEFAULT_DB_URL =
  "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

function checkSetDifficultyMix(questions) {
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
      hardExpert++;
    }
  }

  const isExact776 = easy === 7 && medium === 7 && hardExpert === 6;
  const warning = isExact776
    ? null
    : `Set mix has ${easy} easy, ${medium} medium, ${hardExpert} hard/expert (expected 7/7/6).`;

  return { easy, medium, hardExpert, isExact776, warning };
}

async function main() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(DEFAULT_DB_URL);
  await client.connect();
  const db = client.db("quizweb");

  const qCol = db.collection("Question");
  const subjectsCol = db.collection("gk_subjects");
  const setsCol = db.collection("gk_sets");
  const remaindersCol = db.collection("gk_remainders");

  const subjects = await subjectsCol.find({}).toArray();
  console.log(`Found ${subjects.length} subjects to process.`);

  let totalSetsCreated = 0;

  for (const subj of subjects) {
    for (const lang of ["en", "hi"]) {
      // Find questions for this subject and language
      const langFilter =
        lang === "hi"
          ? { $or: [{ language: "hi" }, { textHi: { $exists: true, $ne: "" } }] }
          : { $or: [{ language: { $in: ["en", null, undefined] } }, { text: { $exists: true, $ne: "" } }] };

      const questions = await qCol
        .find({
          subjectId: subj.id,
          status: { $ne: "hidden" },
          ...langFilter,
        })
        .sort({ sourceRow: 1, _id: 1 })
        .toArray();

      if (questions.length < 20) {
        if (questions.length > 0) {
          await remaindersCol.updateOne(
            { subjectId: subj.id, language: lang },
            {
              $set: {
                subjectId: subj.id,
                language: lang,
                questions,
                count: questions.length,
                updatedAt: new Date(),
              },
            },
            { upsert: true }
          );
        }
        continue;
      }

      // Check existing sets count
      const existingCount = await setsCol.countDocuments({ subjectId: subj.id, language: lang });
      if (existingCount > 0) {
        // Sets already exist, don't duplicate
        continue;
      }

      const totalFullSets = Math.floor(questions.length / 20);
      const setsToInsert = [];

      for (let i = 0; i < totalFullSets; i++) {
        const setQuestions = questions.slice(i * 20, (i + 1) * 20);
        const setNum = i + 1;
        const mix = checkSetDifficultyMix(setQuestions);

        setsToInsert.push({
          id: `set_${subj.id}_${lang}_${setNum}`,
          subjectId: subj.id,
          subjectName: subj.name,
          topicId: subj.topicId,
          topicName: subj.topicName,
          category: subj.category || "India GK",
          masterCategory: subj.masterCategory || "GK",
          language: lang,
          number: setNum,
          title: `${subj.name} - Set ${setNum}`,
          questionIds: setQuestions.map((q) => String(q._id)),
          questions: setQuestions.map((q, idx) => ({
            id: String(q._id),
            text: q.text,
            text_en: q.text,
            text_hi: q.textHi,
            options: q.options,
            options_list: q.options,
            correctAnswer: q.correctAnswer,
            correctIndex: q.correctIndex,
            difficulty: q.difficulty,
            explanation: q.explanation,
            explanation_en: q.explanation,
            explanation_hi: q.explanationHi,
            position: idx + 1,
          })),
          mix: {
            easy: mix.easy,
            medium: mix.medium,
            hardExpert: mix.hardExpert,
          },
          mixWarning: mix.warning,
          badge: "Standard",
          status: "published",
          scope: "subject",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      if (setsToInsert.length > 0) {
        await setsCol.insertMany(setsToInsert);
        totalSetsCreated += setsToInsert.length;
        console.log(`Created ${setsToInsert.length} sets for ${subj.name} (${lang})`);
      }

      const remainderQs = questions.slice(totalFullSets * 20);
      if (remainderQs.length > 0) {
        await remaindersCol.updateOne(
          { subjectId: subj.id, language: lang },
          {
            $set: {
              subjectId: subj.id,
              language: lang,
              questions: remainderQs,
              count: remainderQs.length,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
    }
  }

  console.log(`Total new sets created: ${totalSetsCreated}`);

  // Re-sync subject counts
  for (const s of subjects) {
    const qCount = await qCol.countDocuments({
      subjectId: s.id,
      status: { $ne: "hidden" },
    });
    const setCount = await setsCol.countDocuments({
      subjectId: s.id,
      status: "published",
    });

    await subjectsCol.updateOne(
      { _id: s._id },
      {
        $set: {
          questionCount: qCount,
          setCount: setCount,
          updatedAt: new Date(),
        },
      }
    );
  }

  const finalSetCount = await setsCol.countDocuments({ status: "published" });
  console.log(`Final published sets count in database: ${finalSetCount}`);

  await client.close();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error generating sets:", err);
  process.exit(1);
});
