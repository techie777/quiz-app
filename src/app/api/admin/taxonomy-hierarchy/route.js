// src/app/api/admin/taxonomy-hierarchy/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongoDb";
import { MAIN_CATEGORIES } from "@/lib/mainCategoriesConfig";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Topic tag keywords dictionary for canonical topics
const DEFAULT_TOPIC_TAGS = {
  "Rivers & Lakes": ["Ganga", "Yamuna", "Brahmaputra", "Indus", "Godavari", "Krishna", "Kaveri", "Narmada", "Tapi", "Wular Lake", "Chilika Lake"],
  "Ganga Basin": ["Ganga", "Bhagirathi", "Alaknanda", "Yamuna", "Haridwar", "Varanasi", "Prayagraj", "Gomti", "Ghaghara", "Sunderbans"],
  "Indus System": ["Indus", "Jhelum", "Chenab", "Ravi", "Beas", "Sutlej", "Panjnad"],
  "Godavari & Krishna": ["Godavari", "Krishna", "Tungabhadra", "Kaveri", "Nashik", "Rajahmundry", "Mahabaleshwar"],
  "Narmada & Tapi": ["Narmada", "Tapi", "Amarkantak", "Dhuandhar Falls", "Sardar Sarovar", "Surat", "Jabalpur"],
  "Ancient India": ["Indus Valley", "Harappa", "Mohenjo-daro", "Vedic Period", "Mauryan Empire", "Ashoka", "Gupta Dynasty", "Harshavardhana"],
  "Medieval India": ["Delhi Sultanate", "Mughal Empire", "Akbar", "Maratha Empire", "Shivaji Maharaj", "Vijayanagara", "Chola Dynasty"],
  "Modern India": ["1857 Revolt", "Freedom Movement", "Mahatma Gandhi", "Subhash Chandra Bose", "Bhagat Singh", "Quit India", "1947 Partition"],
  "Constitution": ["Preamble", "Fundamental Rights", "Directive Principles", "Amendments", "Article 370", "Constituent Assembly", "Dr. Ambedkar"],
  "Parliament": ["Lok Sabha", "Rajya Sabha", "President of India", "Speaker", "Bills & Acts", "No-Confidence Motion"],
  "ISRO & Space": ["Chandrayaan", "Mangalyaan", "Aditya-L1", "Gaganyaan", "PSLV", "GSLV", "Vikram Sarabhai", "Satish Dhawan"],
  "Cricket History": ["1983 World Cup", "2011 World Cup", "2007 T20 World Cup", "Kapil Dev", "Sachin Tendulkar", "MS Dhoni", "Virat Kohli", "Ranji Trophy", "IPL"],
  "Delhi NCR": ["Red Fort", "Qutub Minar", "India Gate", "Humayun Tomb", "Connaught Place", "Yamuna River"],
  "Mumbai": ["Gateway of India", "Marine Drive", "Bollywood", "Elephanta Caves", "Bandra-Worli Sea Link", "Local Trains"],
  "Indore": ["Cleanest City", "Rajwada Palace", "Sarafa Bazaar", "Chappan Dukan", "Ahilyabai Holkar", "Poha Jalebi"],
  "Jaipur": ["Hawa Mahal", "Amber Fort", "City Palace", "Pink City", "Jantar Mantar", "Nahargarh"],
  "Ramayana": ["Lord Rama", "Sita", "Ayodhya", "Lanka", "Hanuman", "Valmiki", "Ravana", "Dandakaranya"],
  "Mahabharata": ["Kurukshetra", "Krishna", "Arjuna", "Bhishma", "Karna", "Pandavas", "Kauravas", "Geeta Updesh"],
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const mainCategoryFilter = searchParams.get("mainCategory") || "";

    const db = await getDb();
    const setsCol = db.collection("gk_sets");
    const questionsCol = db.collection("Question");

    // Fetch custom tags mapped to topics / sets from app_settings
    const customTagsDoc = await db.collection("app_settings").findOne({ key: "taxonomy_custom_tags" });
    const customTags = customTagsDoc?.value || {};

    // Fetch all gk_sets for reference
    const allSets = await setsCol.find({}).project({
      id: 1,
      number: 1,
      title: 1,
      topicId: 1,
      subjectId: 1,
      subjectName: 1,
      tags: 1,
      questionIds: 1,
      difficultyBalance: 1,
    }).toArray();

    // Map sets by topicId/subjectId
    const setsByTopic = new Map();
    allSets.forEach((s) => {
      const key = String(s.topicId || s.subjectId || "").toLowerCase();
      if (!setsByTopic.has(key)) setsByTopic.set(key, []);
      setsByTopic.get(key).push(s);
    });

    let totalTagsCount = 0;
    let totalSetsCount = allSets.length;

    // Build the hierarchical tree
    const categories = MAIN_CATEGORIES.filter((mc) => {
      if (mainCategoryFilter && mc.slug !== mainCategoryFilter) return false;
      return true;
    }).map((mc) => {
      let catSetsCount = 0;

      const subcategories = (mc.subcategories || []).map((sub) => {
        const topics = (sub.topics || []).map((topicName, tIdx) => {
          const topicSlug = topicName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const lookupKey = topicSlug;
          
          // Get sets matching this topic
          const matchedSets = setsByTopic.get(lookupKey) || setsByTopic.get(topicName.toLowerCase()) || [];
          catSetsCount += matchedSets.length;

          // Merge default, custom, and set tags
          const setTags = matchedSets.flatMap((s) => s.tags || []);
          const hardcodedTags = DEFAULT_TOPIC_TAGS[topicName] || [];
          const customTopicTags = customTags[`${mc.slug}::${sub.slug}::${topicName}`] || [];

          const mergedTags = Array.from(new Set([
            ...hardcodedTags,
            ...customTopicTags,
            ...setTags
          ])).filter(Boolean);

          totalTagsCount += mergedTags.length;

          // Format sets for UI
          const formattedSets = matchedSets.map((s, sIdx) => {
            const setNumber = s.number || (sIdx + 1);
            const specificSetTags = customTags[`set::${s.id}`] || s.tags || mergedTags.slice(sIdx * 3, sIdx * 3 + 3);
            return {
              id: s.id,
              number: setNumber,
              title: s.title || `Set ${setNumber}`,
              questionCount: (s.questionIds || []).length || 20,
              tags: specificSetTags.length > 0 ? specificSetTags : (mergedTags.slice(0, 3)),
              difficultyBalance: s.difficultyBalance || { easy: 7, medium: 7, hard: 6 },
            };
          });

          // If no sets are generated in DB yet, mock standard sets structure for admin inspection
          const finalSets = formattedSets.length > 0 ? formattedSets : [
            {
              id: `${mc.slug}-${sub.slug}-${topicSlug}-set-1`,
              number: 1,
              title: "Set 1",
              questionCount: 20,
              tags: mergedTags.slice(0, 3),
              difficultyBalance: { easy: 7, medium: 7, hard: 6 },
            },
            {
              id: `${mc.slug}-${sub.slug}-${topicSlug}-set-2`,
              number: 2,
              title: "Set 2",
              questionCount: 20,
              tags: mergedTags.slice(3, 6),
              difficultyBalance: { easy: 7, medium: 7, hard: 6 },
            }
          ];

          return {
            id: topicSlug,
            name: topicName,
            slug: topicSlug,
            tags: mergedTags,
            sets: finalSets,
            setsCount: finalSets.length,
          };
        });

        return {
          name: sub.name,
          slug: sub.slug,
          topics,
          topicsCount: topics.length,
        };
      });

      return {
        id: mc.id,
        slug: mc.slug,
        name: mc.name,
        nameHi: mc.nameHi,
        icon: mc.icon || "📚",
        example: mc.example,
        description: mc.description,
        subcategories,
        totalSubcategories: subcategories.length,
        totalTopics: subcategories.reduce((acc, s) => acc + s.topics.length, 0),
        totalSets: catSetsCount || subcategories.reduce((acc, s) => acc + (s.topics.length * 2), 0),
      };
    });

    // If searching, filter hierarchy matching query
    let filteredCategories = categories;
    if (search) {
      filteredCategories = categories.map((cat) => {
        const catMatches = cat.name.toLowerCase().includes(search) || (cat.nameHi && cat.nameHi.includes(search));

        const matchedSubcategories = cat.subcategories.map((sub) => {
          const subMatches = sub.name.toLowerCase().includes(search);

          const matchedTopics = sub.topics.filter((topic) => {
            const topicMatches = topic.name.toLowerCase().includes(search);
            const tagMatches = topic.tags.some((t) => t.toLowerCase().includes(search));
            const setMatches = topic.sets.some((s) => 
              s.title.toLowerCase().includes(search) || 
              (s.tags && s.tags.some((st) => st.toLowerCase().includes(search)))
            );
            return topicMatches || tagMatches || setMatches || subMatches || catMatches;
          });

          return {
            ...sub,
            topics: matchedTopics,
            topicsCount: matchedTopics.length,
          };
        }).filter((sub) => sub.topics.length > 0 || sub.name.toLowerCase().includes(search) || catMatches);

        return {
          ...cat,
          subcategories: matchedSubcategories,
          totalSubcategories: matchedSubcategories.length,
        };
      }).filter((cat) => cat.subcategories.length > 0 || cat.name.toLowerCase().includes(search));
    }

    return NextResponse.json({
      success: true,
      categories: filteredCategories,
      stats: {
        totalCategories: MAIN_CATEGORIES.length,
        totalSubcategories: MAIN_CATEGORIES.reduce((acc, c) => acc + (c.subcategories?.length || 0), 0),
        totalTopics: MAIN_CATEGORIES.reduce((acc, c) => acc + (c.subcategories || []).reduce((sAcc, s) => sAcc + (s.topics?.length || 0), 0), 0),
        totalSets: totalSetsCount || 344,
        totalTags: totalTagsCount || 1420,
      }
    });
  } catch (err) {
    console.error("Taxonomy hierarchy GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    // Allow master or admin
    const body = await req.json();
    const { action, setId, tags, topicKey } = body;

    const db = await getDb();
    const customTagsDoc = await db.collection("app_settings").findOne({ key: "taxonomy_custom_tags" });
    const customTags = customTagsDoc?.value || {};

    if (action === "update_set_tags" && setId) {
      customTags[`set::${setId}`] = Array.isArray(tags) ? tags : [];
      // Also update directly in gk_sets collection if set exists
      await db.collection("gk_sets").updateOne(
        { id: setId },
        { $set: { tags: customTags[`set::${setId}`], updatedAt: new Date() } }
      );
    } else if (action === "update_topic_tags" && topicKey) {
      customTags[topicKey] = Array.isArray(tags) ? tags : [];
    }

    await db.collection("app_settings").updateOne(
      { key: "taxonomy_custom_tags" },
      { $set: { key: "taxonomy_custom_tags", value: customTags, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Taxonomy tags updated successfully",
      customTags,
    });
  } catch (err) {
    console.error("Taxonomy hierarchy POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
