// scripts/verify-all-features.mjs
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

async function run() {
  console.log("=== VERIFYING IMPLEMENTATION ===");
  
  // 1. Verify Taxonomy Hierarchy API & Default Rules
  const baseUrl = "http://localhost:3000";

  try {
    const taxRes = await fetch(`${baseUrl}/api/admin/taxonomy-hierarchy`);
    const taxData = await taxRes.json();
    console.log("1. /api/admin/taxonomy-hierarchy test:");
    console.log("   Success:", taxData.success);
    console.log("   Categories count:", taxData.categories?.length);
    console.log("   Stats:", taxData.stats);
    
    // Check search for "ganga" in taxonomy
    const searchRes = await fetch(`${baseUrl}/api/admin/taxonomy-hierarchy?search=ganga`);
    const searchData = await searchRes.json();
    console.log("2. /api/admin/taxonomy-hierarchy?search=ganga test:");
    console.log("   Matched categories count:", searchData.categories?.length);
    if (searchData.categories?.length > 0) {
      const firstCat = searchData.categories[0];
      console.log("   First matched category:", firstCat.name);
      const sub = firstCat.subcategories?.[0];
      console.log("   First matched subcategory:", sub?.name);
      const top = sub?.topics?.[0];
      console.log("   First matched topic:", top?.name, "Tags:", top?.tags);
      console.log("   First matched set:", top?.sets?.[0]?.title, "Set tags:", top?.sets?.[0]?.tags);
    }

    // 3. Test Dataset Rules API
    const rulesRes = await fetch(`${baseUrl}/api/admin/dataset-rules`);
    const rulesData = await rulesRes.json();
    console.log("3. /api/admin/dataset-rules test:");
    console.log("   Success:", rulesData.success);
    console.log("   Progressive difficulty enabled:", rulesData.rules?.progressiveDifficultyEnabled);
    console.log("   Quiz sets ads enabled:", rulesData.rules?.quizSetsAdsEnabled);
    console.log("   Free sets per window:", rulesData.rules?.freeSetsPerWindow);
    console.log("   Pro features enabled:", rulesData.rules?.proFeaturesEnabled);

    // 4. Test Entitlement Check
    const entRes = await fetch(`${baseUrl}/api/entitlement/check?tier=adults&moduleId=quiz`);
    const entData = await entRes.json();
    console.log("4. /api/entitlement/check test:");
    console.log("   Success:", entData.success);
    console.log("   isLocked (should be false):", entData.isLocked);
    console.log("   canWatchAd (should be false):", entData.canWatchAd);
    console.log("   freeSetsPerWindow:", entData.freeSetsPerWindow);

    // 5. Test Category Page API for India GK
    const catRes = await fetch(`${baseUrl}/api/categories/india-gk?metaOnly=true`);
    const catData = await catRes.json();
    console.log("5. /api/categories/india-gk meta test:");
    console.log("   Topic:", catData.topic);
    console.log("   Emoji in DB:", catData.emoji);
  } catch (err) {
    console.error("Verification error:", err);
  }

  process.exit(0);
}

run().catch(console.error);
