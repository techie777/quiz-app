const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.DATABASE_URL;

const CATEGORY_GROUPS = {
  core: ["india-gk", "world-gk", "general-knowledge", "current-affairs"],
  india: ["indian-geography", "indian-cities", "indian-states-uts", "religion-spirituality", "heritage-monuments", "art-culture"],
  learn: ["science", "mathematics", "reasoning-brain-games", "history", "geography", "language-grammar", "literature", "technology", "space-astronomy"],
  fun: ["entertainment", "music", "sports", "gaming", "theatre-performing-arts", "famous-people", "awards-achievements", "kids-family-quiz", "fun-viral-quiz"],
  world: ["business-economy", "politics-government", "environment-nature", "food-cuisine", "transport", "defence-military", "brands-companies", "lifestyle-everyday-knowledge", "animals-wildlife", "plants-agriculture", "inventions-discoveries", "travel-tourism"],
};

const CATEGORY_SLUG_TO_FILE = {
  "india-gk": "india-gk.webp",
  "world-gk": "world-gk.webp",
  "indian-geography": "indian-geography.webp",
  "indian-cities": "indian-cities.webp",
  "indian-states-uts": "indian-states.webp",
  "religion-spirituality": "religion.webp",
  "heritage-monuments": "heritage.webp",
  "art-culture": "art-culture.webp",
  "science": "science.webp",
  "mathematics": "mathematics.webp",
  "reasoning-brain-games": "reasoning.webp",
  "history": "history.webp",
  "geography": "geography.webp",
  "technology": "technology.webp",
  "space-astronomy": "space.webp",
  "language-grammar": "language.webp",
  "literature": "literature.webp",
  "entertainment": "entertainment.webp",
  "music": "music.webp",
  "sports": "sports.webp",
  "gaming": "gaming.webp",
  "theatre-performing-arts": "theatre.webp",
  "famous-people": "famous-people.webp",
  "awards-achievements": "awards.webp",
  "kids-family-quiz": "kids-family.webp",
  "fun-viral-quiz": "fun-viral.webp",
  "business-economy": "business.webp",
  "politics-government": "politics.webp",
  "environment-nature": "environment.webp",
  "food-cuisine": "food.webp",
  "transport": "transport.webp",
  "defence-military": "defence.webp",
  "brands-companies": "brands.webp",
  "lifestyle-everyday-knowledge": "lifestyle.webp",
  "animals-wildlife": "animals.webp",
  "plants-agriculture": "plants.webp",
  "inventions-discoveries": "inventions.webp",
  "travel-tourism": "travel.webp",
  "general-knowledge": "general-knowledge.webp",
  "current-affairs": "current-affairs.webp",
};

function getGroup(slug) {
  for (const [grp, slugs] of Object.entries(CATEGORY_GROUPS)) {
    if (slugs.includes(slug)) return grp;
  }
  return "core";
}

async function run() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db();
    const categoriesCol = db.collection("Category");
    const questionsCol = db.collection("Question");

    const categories = await categoriesCol.find({ parentId: null }).toArray();
    console.log(`Found ${categories.length} top-level categories`);

    for (const cat of categories) {
      const slug = cat.slug;
      const group = getGroup(slug);
      const filename = CATEGORY_SLUG_TO_FILE[slug] || `${slug}.webp`;
      const imageUrl = `/cards/${filename}`;

      // Check subcategories
      const subCats = await categoriesCol.find({ parentId: cat._id }).toArray();
      const subCatIds = subCats.map(s => s._id);

      // Question count: direct + subcategories
      const directCount = await questionsCol.countDocuments({ categoryId: cat._id });
      const subCount = subCatIds.length > 0 ? await questionsCol.countDocuments({ categoryId: { $in: subCatIds } }) : 0;
      const totalQuestions = directCount + subCount;

      // Status derived from current coming-soon logic: live if has questions or is live, otherwise coming_soon
      const status = totalQuestions > 0 ? "live" : "coming_soon";
      const sortOrder = typeof cat.sortOrder === "number" ? cat.sortOrder : 0;

      await categoriesCol.updateOne(
        { _id: cat._id },
        {
          $set: {
            group: group,
            status: status,
            sort_order: sortOrder,
            image_url: imageUrl,
          }
        }
      );

      console.log(`Updated [${slug}]: group=${group}, status=${status}, sort_order=${sortOrder}, image_url=${imageUrl}, totalQ=${totalQuestions}`);
    }

    console.log("Category migration completed successfully!");
  } finally {
    await client.close();
  }
}

run().catch(console.error);
