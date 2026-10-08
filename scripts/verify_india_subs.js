require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { getDb } = require('../src/lib/mongoDb');

(async () => {
  const db = await getDb();
  const indiaGk = await db.collection('Category').findOne({
    $or: [{ slug: 'india-gk' }, { topic: 'India GK' }]
  });
  const subs = await db.collection('Category').find({
    parentId: indiaGk._id,
    hidden: { $ne: true }
  }).sort({ sortOrder: 1 }).toArray();

  console.log(`India GK visible subcategories count: ${subs.length}`);
  subs.forEach((s, idx) => {
    console.log(`${idx + 1}. [${s.emoji || '📁'}] ${s.topic} (${s.topicHi || ''}) - ${s.questionCount || 0} Qs, ${s.setCount || 0} Sets (slug: ${s.slug})`);
  });
  process.exit(0);
})();
