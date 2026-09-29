require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.DATABASE_URL);
  await client.connect();
  const db = client.db();

  console.log("=== 1. Checking Category collection for India / GK / Ancient ===");
  const allCats = await db.collection('Category').find({}).toArray();
  const relevantCats = allCats.filter(c => 
    /gk|india|world|ancient/i.test(c.topic || '') || 
    /gk|india|world|ancient/i.test(c.slug || '')
  );
  console.log(relevantCats.map(c => ({
    id: c._id.toString(),
    topic: c.topic,
    topicHi: c.topicHi,
    slug: c.slug,
    parentId: c.parentId,
    hidden: c.hidden,
    categoryClass: c.categoryClass,
    sortOrder: c.sortOrder
  })));

  console.log("\n=== 2. Checking gk_topics collection ===");
  const gkTopics = await db.collection('gk_topics').find({}).toArray();
  console.log(`Total gk_topics: ${gkTopics.length}`);
  console.log("Unique categories in gk_topics:", Array.from(new Set(gkTopics.map(t => t.category))));
  console.log("First 8 gk_topics:", gkTopics.slice(0, 8).map(t => ({
    id: t.id,
    name: t.name,
    nameHi: t.nameHi,
    category: t.category,
    questionCount: t.questionCount,
    active: t.active
  })));

  console.log("\n=== 3. Checking TaxonomyCategory & TaxonomyTopic collection ===");
  const taxCats = await db.collection('TaxonomyCategory').find({}).toArray();
  console.log("TaxonomyCategory:", taxCats.map(t => ({ id: t._id.toString(), name: t.name, slug: t.slug })));

  await client.close();
}

main().catch(console.error);
