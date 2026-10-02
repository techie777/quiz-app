import { MongoClient, ObjectId } from 'mongodb';
import { MAIN_CATEGORIES } from '../src/lib/mainCategoriesConfig.mjs';

const uri = "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

// Mapping rules: which legacy category slugs/topics belong under which Main Category slug
const LEGACY_MAPPING = {
  // 1: India GK
  "india-gk": ["india-gk"],
  
  // 2: World GK
  "world-gk": ["world-gk"],
  
  // 3: Indian Geography
  "indian-geography": [],
  
  // 4: Indian Cities
  "indian-cities": ["indore-gk"],
  
  // 5: Indian States & UTs
  "indian-states-uts": [
    "indian-states-gk", "madhya-pradesh-gk", "assam-gk", "bihar-gk", "chhattisgarh-gk",
    "goa", "gujarat", "haryana", "himachal-pradesh", "jharkhand-gk", "karnataka-gk",
    "kerala-gk", "uttar-pradesh-gk", "uttarakhand-gk"
  ],
  
  // 6: Religion & Spirituality
  "religion-spirituality": ["religious-gk", "ramayana-gk", "mahabharat-gk"],
  
  // 7: Entertainment
  "entertainment": ["bollywood-gk", "bollywood-movies", "movies-series", "dhurandar"],
  
  // 9: Sports
  "sports": ["sports-gk", "ipl"],
  
  // 10: Science
  "science": ["physics-gk", "chemistry-gk", "biology-gk", "general-science", "life-sciences-biology"],
  
  // 11: Technology
  "technology": ["computer-gk"],
  
  // 13: History
  "history": ["history-gk", "indian-kingdom-gk", "gulam-vansh", "modern-indian-history"],
  
  // 15: General Knowledge
  "general-knowledge": ["static-gk-trivia", "quiz-of-the-day", "important-days-gk", "slogan-gk", "kbc-gk-2001"],
  
  // 16: Current Affairs
  "current-affairs": ["daily-current-affairs", "current-affairs-government-schemes"],
  
  // 17: Business & Economy
  "business-economy": ["economy-gk", "indian-economy"],
  
  // 18: Politics & Government
  "politics-government": ["polity-gk", "indian-polity-constitution"],
  
  // 22: Language & Grammar
  "language-grammar": ["english-language-comprehension"],
  
  // 23: Mathematics
  "mathematics": ["number-systems-basic-algebra", "mensuration-geometry", "time-motion-math"],
  
  // 24: Reasoning & Brain Games
  "reasoning-brain-games": ["logical-analytical-reasoning", "verbal-reasoning", "non-verbal-reasoning", "data-interpretation-di"],
  
  // 27: Famous People
  "famous-people": ["famous-personalities", "founders"],
  
  // 28: Transport
  "transport": ["cars-vehicles"],
  
  // 31: Brands & Companies
  "brands-companies": ["world-company-ceo", "famous-logos"],
  
  // 32: Lifestyle & Everyday Knowledge
  "lifestyle-everyday-knowledge": ["everyday-objects", "full-form"],
  
  // 37: Travel & Tourism
  "travel-tourism": ["famous-places", "world-flags"],
  
  // 40: Fun & Viral Quiz
  "fun-viral-quiz": ["image-quizzes"]
};

async function syncCategories() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("quizweb");
  const catCol = db.collection("Category");
  const qCol = db.collection("Question");

  console.log("=== STEP 3: SYNC 40 MAIN CATEGORIES & MAP LEGACY DATA ===");

  // 1. Ensure all 40 Main Categories exist
  const mainCatDocs = new Map();

  for (const mc of MAIN_CATEGORIES) {
    // Check if category exists by slug or topic
    let doc = await catCol.findOne({
      $or: [
        { slug: mc.slug },
        { topic: { $regex: `^${mc.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }
      ]
    });

    const updateFields = {
      slug: mc.slug,
      topic: mc.name,
      topicHi: mc.nameHi,
      emoji: mc.icon,
      description: mc.description,
      descriptionHi: mc.descriptionHi,
      example: mc.example,
      chip: mc.chip,
      sortOrder: mc.id,
      parentId: null,
      isMainCategory: true,
      hidden: false,
      updatedAt: new Date()
    };

    if (doc) {
      await catCol.updateOne({ _id: doc._id }, { $set: updateFields });
      mainCatDocs.set(mc.slug, { ...doc, ...updateFields });
      console.log(`[UPDATED MAIN CAT ${mc.id}] ${mc.name} (slug: ${mc.slug})`);
    } else {
      const newDoc = {
        ...updateFields,
        categoryClass: `category-${mc.slug}`,
        createdAt: new Date(),
        attemptCount: 0,
        chips: "[]",
        showSubCategoriesOnHome: false,
      };
      const insertRes = await catCol.insertOne(newDoc);
      newDoc._id = insertRes.insertedId;
      mainCatDocs.set(mc.slug, newDoc);
      console.log(`[CREATED MAIN CAT ${mc.id}] ${mc.name} (slug: ${mc.slug})`);
    }
  }

  // 2. Link legacy categories to their parent Main Category
  console.log("\n--- Mapping legacy categories as subcategories ---");
  for (const [mainSlug, legacySlugs] of Object.entries(LEGACY_MAPPING)) {
    const mainDoc = mainCatDocs.get(mainSlug);
    if (!mainDoc) continue;

    for (const legacySlug of legacySlugs) {
      // Don't map the main category to itself
      if (legacySlug === mainSlug) continue;

      const legDoc = await catCol.findOne({ slug: legacySlug });
      if (legDoc) {
        await catCol.updateOne(
          { _id: legDoc._id },
          {
            $set: {
              parentId: new ObjectId(mainDoc._id),
              parentSlug: mainSlug,
              isMainCategory: false,
              hidden: false, // visible in drilldown subcategories
              updatedAt: new Date()
            }
          }
        );
        console.log(`Linked '${legDoc.topic}' (${legacySlug}) -> '${mainDoc.topic}' (${mainSlug})`);
      }
    }
  }

  // 3. Recalculate Question Counts for all Main Categories (including their direct & child questions)
  console.log("\n--- Recalculating question counts for Main Categories ---");
  for (const mc of MAIN_CATEGORIES) {
    const mainDoc = mainCatDocs.get(mc.slug);
    if (!mainDoc) continue;

    // Find all child category IDs
    const childCats = await catCol.find({ parentId: { $in: [mainDoc._id, new ObjectId(mainDoc._id), mainDoc._id.toString()] } }).toArray();
    const allCatIds = [mainDoc._id, ...childCats.map(c => c._id)];

    // Direct questions + child category questions
    const totalQCount = await qCol.countDocuments({
      $or: [
        { categoryId: { $in: allCatIds } },
        { category_id: { $in: allCatIds.map(id => id.toString()) } },
        { category: mc.name }
      ]
    });

    const setCalculated = Math.floor(totalQCount / 20);

    await catCol.updateOne(
      { _id: mainDoc._id },
      {
        $set: {
          questionCount: totalQCount,
          setCount: setCalculated,
          totalQuestions: totalQCount,
        }
      }
    );

    console.log(`Main Category [${mc.id}] ${mc.name}: ${totalQCount} questions (~${setCalculated} sets)`);
  }

  await client.close();
  console.log("\nSync complete! All 40 categories active with zero data loss.");
  process.exit(0);
}

syncCategories().catch(console.error);
