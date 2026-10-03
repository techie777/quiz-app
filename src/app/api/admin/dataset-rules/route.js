// src/app/api/admin/dataset-rules/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { DEFAULT_ACCESS_SETTINGS, getAccessSettings } from "@/lib/entitlement";
import { DEFAULT_AD_TOGGLES } from "@/lib/monetizationConfig";

export const dynamic = "force-dynamic";

export const DEFAULT_DATASET_RULES = {
  generationMode: "dynamic", // "dynamic" (Smart Balancing) | "static" (Sequential As Prepared)
  megaPoolRoundRobin: true,  // Rule 1: 10 Easy (Q1-5 easy first), 5 Med, 5 Hard, round-robin subcategories
  subCategoryMixing: true,   // Rule 2: Set 1 (10-5-5) -> Set 2+ (7-7-6) with topic mixing
  topicSequentialDifficulty: true, // Rule 3: Curated topic drill-down 7-7-6 progressive difficulty
  bulkCategoryLadder: true,  // Rule 4: 1 set: 10-5-5; Multi sets: Set 1 All Easy, Set 2 10-5-5, Set 3+ 7-7-6
  strictAdminTagsOnly: true, // Do not show tags until specifically entered/tagged by admin
  progressiveDifficultyEnabled: true,
  progressiveTierBreakdown: {
    easyCount: 7,
    mediumCount: 7,
    hardCount: 6,
  },
  standardSetSize: 20,
  kidsSetSize: 10,
  passThresholdPercent: 60,
  allowedTimers: [0, 30, 60, 90],
  defaultTimerSeconds: 0,
  quizSetsAdsEnabled: false,    // Disabled per user request
  adsMasterSwitch: false,       // Master ads disabled
  proFeaturesEnabled: true,     // Pro features master toggle
  freeSetsPerWindow: 9999,      // Unlimited when ads disabled
  windowMode: "rolling24h",
  tagReferenceSearchEnabled: true,
  breadcrumbOrder: ["Home", "Main Category", "Sub Category", "Topic", "Covered Chapters / Reference Tags"],
};

export async function GET() {
  try {
    const db = await getDb();
    
    // Read from app_settings
    const rulesDoc = await db.collection("app_settings").findOne({ key: "dataset_display_rules" });
    const accessDoc = await db.collection("access_settings").findOne({ key: "default" });
    const monetDoc = await db.collection("app_settings").findOne({ key: "monetization_config" });

    const monetValue = monetDoc?.value || {};
    const rulesValue = rulesDoc?.value || {};

    const mergedRules = {
      ...DEFAULT_DATASET_RULES,
      ...rulesValue,
      quizSetsAdsEnabled: monetValue.quizSetsAdsEnabled ?? false,
      adsMasterSwitch: monetValue.adsEnabled ?? false,
      proFeaturesEnabled: monetValue.proFeaturesEnabled ?? true,
      freeSetsPerWindow: (monetValue.quizSetsAdsEnabled === false || monetValue.adsEnabled === false)
        ? 9999
        : (accessDoc?.freeSetsPerWindow || 2),
      windowMode: accessDoc?.windowMode || "rolling24h",
    };

    return NextResponse.json({
      success: true,
      rules: mergedRules,
    });
  } catch (err) {
    console.error("Dataset rules GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { rules } = body;

    const db = await getDb();

    // 1. Update dataset_display_rules in app_settings
    await db.collection("app_settings").updateOne(
      { key: "dataset_display_rules" },
      { $set: { key: "dataset_display_rules", value: rules, updatedAt: new Date() } },
      { upsert: true }
    );

    // 2. Sync monetization_config
    const monetDoc = await db.collection("app_settings").findOne({ key: "monetization_config" });
    const prevMonet = monetDoc?.value || DEFAULT_AD_TOGGLES;
    const updatedMonet = {
      ...prevMonet,
      adsEnabled: Boolean(rules.adsMasterSwitch),
      quizSetsAdsEnabled: Boolean(rules.quizSetsAdsEnabled),
      proFeaturesEnabled: Boolean(rules.proFeaturesEnabled),
    };
    await db.collection("app_settings").updateOne(
      { key: "monetization_config" },
      { $set: { key: "monetization_config", value: updatedMonet, updatedAt: new Date() } },
      { upsert: true }
    );

    // 3. Sync access_settings
    await db.collection("access_settings").updateOne(
      { key: "default" },
      {
        $set: {
          key: "default",
          freeSetsPerWindow: rules.quizSetsAdsEnabled ? (rules.freeSetsPerWindow || 2) : 9999,
          windowMode: rules.windowMode || "rolling24h",
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Dataset display rules and monetization synchronised successfully",
      rules,
    });
  } catch (err) {
    console.error("Dataset rules POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
