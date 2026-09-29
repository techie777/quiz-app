require('dotenv').config({ path: '.env.local' });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { MongoClient } = require('mongodb');

async function run() {
  const url = process.env.DATABASE_URL;
  console.log("DB URL:", url ? url.substring(0, 25) + '...' : 'none');
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db();
    const cols = await db.listCollections().toArray();
    console.log("Collections:", cols.map(c => c.name));
    
    const catCol = db.collection('Category');
    const totalCats = await catCol.countDocuments({});
    console.log("Total Category docs in Mongo:", totalCats);

    const sampleCats = await catCol.find({}).limit(5).toArray();
    console.log("Sample 5 cats in Mongo:", sampleCats.map(c => ({ id: c._id, topic: c.topic, name: c.name, hidden: c.hidden })));

    const { prisma } = require('../src/lib/prisma.js');
    const prismaCats = await prisma.category.findMany({ where: { hidden: false } });
    console.log("Prisma findMany { hidden: false } count:", prismaCats.length);

    const prismaAllCats = await prisma.category.findMany({});
    console.log("Prisma findMany {} count:", prismaAllCats.length);

    const indiaCount = await db.collection('Question').countDocuments({
      $or: [{ category: 'India GK' }, { categoryId: '69d03ea978a47c2438020859' }, { masterCategory: 'GK' }]
    });
    console.log("India / GK questions count:", indiaCount);

    const topics = await db.collection('gk_topics').find({}).toArray();
    console.log("GK Topics count:", topics.length);
    console.log("Topics:", topics.map(t => ({ id: t.id, name: t.name, cat: t.category })));

    const sets = await db.collection('gk_sets').find({}).toArray();
    console.log("Current gk_sets count:", sets.length);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
run();
