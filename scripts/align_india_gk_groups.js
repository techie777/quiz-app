require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { getDb } = require('../src/lib/mongoDb');
const { ObjectId } = require('mongodb');

// 10 Big Groups definition
const TEN_BIG_GROUPS = [
  {
    topic: "India History",
    topicHi: "भारतीय इतिहास",
    slug: "india-history",
    emoji: "📜",
    description: "Chronicles of ancient civilizations, mighty dynasties, independence struggles, and visionary leaders.",
    descriptionHi: "प्राचीन भारत, सिंधु घाटी, मौर्य-गुप्त काल, स्वतंत्रता संग्राम और आधुनिक भारत का गौरवशाली इतिहास।",
    sortOrder: 1,
    oldTopics: [
      "History and Mystery",
      "Architecture & Mystery",
      "Indian Forts",
      "Tribes & Heritage"
    ]
  },
  {
    topic: "India Geography",
    topicHi: "भारतीय भूगोल",
    slug: "india-geography",
    emoji: "🗺️",
    description: "Himalayas, peninsular rivers, monsoon patterns, soil types, and regional geography.",
    descriptionHi: "भारत की नदियां, पर्वतमालाएं, जलवायु, मिट्टी, राष्ट्रीय उद्यान और प्राकृतिक संपदा।",
    sortOrder: 2,
    oldTopics: [
      "Indian Geography",
      "River & Nature",
      "Mountains & Peaks",
      "Sea",
      "Unique Village"
    ]
  },
  {
    topic: "India Sports",
    topicHi: "भारतीय खेल",
    slug: "india-sports",
    emoji: "🏏",
    description: "Indian Sports, Cricket, Olympic Heroes, Traditional Games & Achievements.",
    descriptionHi: "भारतीय खेल, क्रिकेट, हॉकी, ओलंपिक पदक, पारंपरिक खेल व प्रमुख खिलाड़ी।",
    sortOrder: 3,
    oldTopics: [
      "Sport and Myth"
    ]
  },
  {
    topic: "Technology",
    topicHi: "प्रौद्योगिकी व आईटी",
    slug: "technology",
    emoji: "💻",
    description: "Computing, digital innovations, supercomputers, mathematics & IT revolutions in India.",
    descriptionHi: "कंप्यूटर, सुपरकंप्यूटर, डिजिटल इंडिया, आईटी क्रांति, गणित व भारतीय तकनीकी नवाचार।",
    sortOrder: 4,
    oldTopics: [
      "Inventions & Maths",
      "Computers & Supercomputers"
    ]
  },
  {
    topic: "Science & Discovery",
    topicHi: "विज्ञान और खोज",
    slug: "science--discovery",
    emoji: "🔬",
    description: "Indian scientific heritage, ISRO missions, defense tech, missile programs & legendary scientists.",
    descriptionHi: "भारतीय वैज्ञानिक, इसरो मिशन, चंद्रयान, मिसाइल कार्यक्रम, परमाणु ऊर्जा व वैज्ञानिक खोजें।",
    sortOrder: 5,
    oldTopics: [
      "Science & Discovery",
      "Scientist & Missile",
      "Space & ISRO"
    ]
  },
  {
    topic: "Entertainment",
    topicHi: "मनोरंजन, कला व संस्कृति",
    slug: "entertainment",
    emoji: "🎭",
    description: "Classical and folk dances, Indian musical instruments, fairs, festivals, cinema & rich traditions.",
    descriptionHi: "भारतीय संगीत, वाद्ययंत्र, नृत्य शैलियां, मेले, उत्सव, सिनेमा, रंगमंच व सांस्कृतिक परंपराएं।",
    sortOrder: 6,
    oldTopics: [
      "Music & Instruments",
      "Music & Dance",
      "Festivals & Traditions",
      "Fairs & Markets"
    ]
  },
  {
    topic: "Religion & Spirituality",
    topicHi: "धर्म एवं आध्यात्म",
    slug: "religion-spirituality",
    emoji: "🪔",
    description: "Ancient temples, sacred pilgrim circuits, spiritual philosophy, epics & gurus of Bharat.",
    descriptionHi: "भारत के प्रमुख मंदिर, तीर्थ स्थल, वैदिक दर्शन, उपनिषद, संत-महात्मा व आध्यात्मिक परंपराएं।",
    sortOrder: 7,
    oldTopics: []
  },
  {
    topic: "India Polity",
    topicHi: "भारतीय राजव्यवस्था व संविधान",
    slug: "india-polity",
    emoji: "⚖️",
    description: "Indian Constitution, parliamentary system, judiciary, national symbols, public administration & railways.",
    descriptionHi: "भारतीय संविधान, मौलिक अधिकार, संसद, न्यायपालिका, राष्ट्रीय प्रतीक, डाक सेवाएं व भारतीय रेल।",
    sortOrder: 8,
    oldTopics: [
      "Indian Constitution",
      "Flag & Rules",
      "Currency & Language",
      "Post Office & Records",
      "Indian Railway"
    ]
  },
  {
    topic: "Nature & Animals",
    topicHi: "प्रकृति एवं वन्यजीव",
    slug: "nature-animals",
    emoji: "🌿",
    description: "Rich biodiversity, wildlife sanctuaries, national animal & bird, botanical wonders & forest treasures.",
    descriptionHi: "भारत के वन्यजीव, राष्ट्रीय उद्यान, दुर्लभ पशु-पक्षी, वृक्ष, औषधीय पौधे व प्राकृतिक सौंदर्य।",
    sortOrder: 9,
    oldTopics: [
      "Nature & Wonders",
      "Animals & Wildlife",
      "Animals",
      "Trees & plants",
      "Fruit & Identification"
    ]
  },
  {
    topic: "Others",
    topicHi: "अन्य सामान्य ज्ञान",
    slug: "others",
    emoji: "📦",
    description: "Indian culinary heritage, spices, historic milestones, national awards & miscellaneous trivia.",
    descriptionHi: "भारतीय व्यंजन, मसाले, राष्ट्रीय पुरस्कार, सम्मान, ऐतिहासिक तथ्य व विविध सामान्य ज्ञान।",
    sortOrder: 10,
    oldTopics: [
      "Food & Spices"
    ]
  }
];

async function alignGroups() {
  const db = await getDb();
  const catCol = db.collection('Category');
  const qCol = db.collection('Question');
  const setCol = db.collection('QuizSet');

  console.log('=== Starting India GK 10 Big Groups Alignment ===\n');

  // 1. Find India GK parent category
  const indiaGk = await catCol.findOne({
    $or: [{ slug: 'india-gk' }, { topic: 'India GK' }]
  });

  if (!indiaGk) {
    console.error('Error: India GK category not found in DB!');
    process.exit(1);
  }

  const indiaGkId = indiaGk._id;
  console.log(`India GK Parent ID: ${indiaGkId.toString()} (${indiaGk.topic})`);

  // Map to hold target SubCategory ObjectIds
  const targetSubCategoryMap = new Map();

  // 2. Ensure each of the 10 big groups exists and is linked to India GK (parentId: indiaGkId)
  for (const grp of TEN_BIG_GROUPS) {
    let subDoc = await catCol.findOne({
      $or: [
        { slug: grp.slug },
        { topic: { $regex: `^${grp.topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: 'i' } }
      ]
    });

    if (subDoc) {
      console.log(`Found existing doc for "${grp.topic}": ${subDoc._id.toString()}`);
      // Link as subcategory of India GK
      await catCol.updateOne(
        { _id: subDoc._id },
        {
          $set: {
            parentId: indiaGkId,
            topic: grp.topic,
            topicHi: grp.topicHi || subDoc.topicHi || '',
            emoji: grp.emoji || subDoc.emoji || '📁',
            description: grp.description || subDoc.description || '',
            descriptionHi: grp.descriptionHi || subDoc.descriptionHi || '',
            sortOrder: grp.sortOrder,
            sort_order: grp.sortOrder,
            hidden: false,
            updatedAt: new Date()
          }
        }
      );
      targetSubCategoryMap.set(grp.topic, subDoc._id);
    } else {
      console.log(`Creating new subcategory doc for "${grp.topic}"...`);
      const newDoc = {
        topic: grp.topic,
        topicHi: grp.topicHi,
        slug: grp.slug,
        emoji: grp.emoji,
        description: grp.description,
        descriptionHi: grp.descriptionHi,
        categoryClass: `category-${grp.slug}`,
        hidden: false,
        originalLang: "en",
        isTrending: false,
        chips: "[]",
        sortOrder: grp.sortOrder,
        sort_order: grp.sortOrder,
        showSubCategoriesOnHome: true,
        attemptCount: 0,
        parentId: indiaGkId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const res = await catCol.insertOne(newDoc);
      targetSubCategoryMap.set(grp.topic, res.insertedId);
      console.log(`Created "${grp.topic}" with ID: ${res.insertedId.toString()}`);
    }
  }

  console.log('\n--- 10 Big Groups Established Under India GK ---');
  for (const [name, id] of targetSubCategoryMap.entries()) {
    console.log(`  ${name} -> ${id.toString()}`);
  }

  // 3. Migrate questions and sets from the 30 old topics into the 10 groups
  console.log('\n--- Migrating Questions & Sets ---');

  for (const grp of TEN_BIG_GROUPS) {
    const targetSubCatId = targetSubCategoryMap.get(grp.topic);
    const targetSubCatName = grp.topic;

    for (const oldTopicName of grp.oldTopics) {
      console.log(`\nProcessing old topic: "${oldTopicName}" -> Group: "${targetSubCatName}"`);

      // Find old category document if any
      const oldCat = await catCol.findOne({
        $or: [
          { topic: { $regex: `^${oldTopicName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: 'i' } },
          { slug: oldTopicName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
        ]
      });

      const oldCatId = oldCat?._id;

      // Update Questions for this old topic
      const qFilter = {
        $or: [
          ...(oldCatId ? [{ categoryId: oldCatId }, { categoryId: oldCatId.toString() }] : []),
          { subCategory: oldTopicName },
          { topic: oldTopicName },
          { topicName: oldTopicName }
        ]
      };

      const qUpdateRes = await qCol.updateMany(qFilter, {
        $set: {
          categoryId: targetSubCatId,
          subCategory: targetSubCatName,
          subCategoryName: targetSubCatName,
          categoryName: "India GK",
          topic: oldTopicName,
          topicName: oldTopicName,
          updatedAt: new Date()
        }
      });
      console.log(`  Updated ${qUpdateRes.modifiedCount} questions for "${oldTopicName}"`);

      // Update QuizSets for this old topic
      const setFilter = {
        $or: [
          ...(oldCatId ? [{ topicId: oldCatId }, { topicId: oldCatId.toString() }, { categoryId: oldCatId }, { categoryId: oldCatId.toString() }] : []),
          { subCategoryName: oldTopicName },
          { title: { $regex: oldTopicName, $options: 'i' } }
        ]
      };

      const setUpdateRes = await setCol.updateMany(setFilter, {
        $set: {
          categoryId: indiaGkId,
          topicId: targetSubCatId,
          subCategoryId: targetSubCatId,
          subCategoryName: targetSubCatName,
          title: `Set: ${oldTopicName}`,
          titleHi: `सेट: ${oldTopicName}`,
          updatedAt: new Date()
        }
      });
      console.log(`  Updated ${setUpdateRes.modifiedCount} sets for "${oldTopicName}"`);

      // If old category is NOT one of the 10 big groups, unlink its parentId from India GK
      if (oldCat && oldCat._id.toString() !== targetSubCatId.toString()) {
        await catCol.updateOne(
          { _id: oldCat._id },
          {
            $set: {
              parentId: targetSubCatId, // child of the big group
              hidden: true,             // hidden from top-level list
              categoryClass: "topic",
              updatedAt: new Date()
            }
          }
        );
        console.log(`  Old category doc "${oldCat.topic}" nested under "${targetSubCatName}" & hidden from direct list`);
      }
    }
  }

  // 4. Update set indices for each big group
  console.log('\n--- Re-indexing Sets under each Big Group ---');
  for (const grp of TEN_BIG_GROUPS) {
    const targetSubCatId = targetSubCategoryMap.get(grp.topic);
    const sets = await setCol.find({
      $or: [
        { topicId: targetSubCatId },
        { subCategoryId: targetSubCatId }
      ]
    }).sort({ createdAt: 1, _id: 1 }).toArray();

    console.log(`Group "${grp.topic}": ${sets.length} sets found`);
    for (let idx = 0; idx < sets.length; idx++) {
      const s = sets[idx];
      const newIndex = idx + 1;
      const cleanTitle = s.title.startsWith('Set:') ? s.title : `Set ${newIndex}: ${s.title.replace(/^Set \d+:?\s*/i, '')}`;
      await setCol.updateOne(
        { _id: s._id },
        {
          $set: {
            setIndex: newIndex,
            title: cleanTitle,
            setCount: sets.length
          }
        }
      );
    }

    // Update questionCount & setCount on the subcategory document
    const totalQCount = await qCol.countDocuments({
      $or: [
        { categoryId: targetSubCatId },
        { subCategory: grp.topic }
      ]
    });

    await catCol.updateOne(
      { _id: targetSubCatId },
      {
        $set: {
          questionCount: totalQCount,
          setCount: sets.length
        }
      }
    );
    console.log(`  Set questionCount on "${grp.topic}": ${totalQCount} Qs, ${sets.length} Sets`);
  }

  // 5. Update India GK parent totals
  const allSubCatIds = Array.from(targetSubCategoryMap.values());
  const indiaTotalQs = await qCol.countDocuments({
    $or: [
      { categoryId: indiaGkId },
      { categoryId: { $in: allSubCatIds } },
      { categoryName: "India GK" }
    ]
  });
  const indiaTotalSets = await setCol.countDocuments({
    $or: [
      { categoryId: indiaGkId },
      { topicId: { $in: allSubCatIds } }
    ]
  });

  await catCol.updateOne(
    { _id: indiaGkId },
    {
      $set: {
        questionCount: indiaTotalQs,
        setCount: indiaTotalSets
      }
    }
  );

  console.log(`\n=== India GK Parent Updated: ${indiaTotalQs} Questions, ${indiaTotalSets} Sets ===`);
  console.log('=== Migration Complete Successfully! ===\n');
  process.exit(0);
}

alignGroups().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
