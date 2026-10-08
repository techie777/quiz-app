require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { getDb } = require('../src/lib/mongoDb');

(async () => {
  const db = await getDb();
  const catCol = db.collection('Category');
  const qCol = db.collection('Question');
  const setCol = db.collection('QuizSet');

  const indiaGk = await catCol.findOne({
    $or: [{ slug: 'india-gk' }, { topic: 'India GK' }]
  });

  const tenBigSlugs = [
    "india-history",
    "india-geography",
    "india-sports",
    "technology",
    "science--discovery",
    "entertainment",
    "religion-spirituality",
    "india-polity",
    "nature-animals",
    "others"
  ];

  const tenBigTopics = [
    "India History",
    "India Geography",
    "India Sports",
    "Technology",
    "Science & Discovery",
    "Entertainment",
    "Religion & Spirituality",
    "India Polity",
    "Nature & Animals",
    "Others"
  ];

  const natureAnimalsDoc = await catCol.findOne({
    $or: [{ slug: 'nature-animals' }, { topic: 'Nature & Animals' }]
  });

  // Specifically fix Animals & Wildlife
  const awDoc = await catCol.findOne({ slug: 'animals--wildlife' });
  if (awDoc && natureAnimalsDoc) {
    await catCol.updateOne(
      { _id: awDoc._id },
      {
        $set: {
          parentId: natureAnimalsDoc._id,
          hidden: true,
          categoryClass: "topic",
          updatedAt: new Date()
        }
      }
    );
    console.log('Fixed Animals & Wildlife parentId and hidden: true');

    // Also update any questions and sets
    await qCol.updateMany(
      { $or: [{ categoryId: awDoc._id }, { categoryId: awDoc._id.toString() }, { subCategory: 'Animals & Wildlife' }, { topic: 'Animals & Wildlife' }] },
      {
        $set: {
          categoryId: natureAnimalsDoc._id,
          subCategory: 'Nature & Animals',
          subCategoryName: 'Nature & Animals',
          topic: 'Animals & Wildlife',
          topicName: 'Animals & Wildlife',
          categoryName: 'India GK'
        }
      }
    );

    await setCol.updateMany(
      { $or: [{ topicId: awDoc._id }, { topicId: awDoc._id.toString() }, { subCategoryName: 'Animals & Wildlife' }, { title: { $regex: 'Animals & Wildlife', $options: 'i' } }] },
      {
        $set: {
          categoryId: indiaGk._id,
          topicId: natureAnimalsDoc._id,
          subCategoryId: natureAnimalsDoc._id,
          subCategoryName: 'Nature & Animals'
        }
      }
    );
  }

  // Ensure ONLY the 10 big groups have parentId == indiaGk._id AND hidden == false
  const allIndiaSubDocs = await catCol.find({
    parentId: indiaGk._id
  }).toArray();

  for (const doc of allIndiaSubDocs) {
    const isBig = tenBigTopics.some(t => t.toLowerCase() === doc.topic.toLowerCase()) || tenBigSlugs.includes(doc.slug);
    if (!isBig) {
      console.log(`Hiding non-big subcategory from direct list: "${doc.topic}"`);
      await catCol.updateOne(
        { _id: doc._id },
        {
          $set: {
            hidden: true,
            categoryClass: "topic"
          }
        }
      );
    }
  }

  // Refresh counts on Nature & Animals and other groups
  for (const topicName of tenBigTopics) {
    const doc = await catCol.findOne({
      parentId: indiaGk._id,
      topic: { $regex: `^${topicName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: 'i' }
    });
    if (doc) {
      const qCount = await qCol.countDocuments({
        $or: [
          { categoryId: doc._id },
          { subCategory: doc.topic },
          { subCategoryName: doc.topic }
        ]
      });
      const sCount = await setCol.countDocuments({
        $or: [
          { topicId: doc._id },
          { subCategoryId: doc._id }
        ]
      });
      await catCol.updateOne(
        { _id: doc._id },
        { $set: { questionCount: qCount, setCount: sCount } }
      );
    }
  }

  console.log('Cleanup complete!');
  process.exit(0);
})();
