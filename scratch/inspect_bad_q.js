require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.DATABASE_URL);
  await client.connect();
  const db = client.db();

  const qCol = db.collection('Question');
  const sample = await qCol.findOne({ 'options_list.0.text': { $exists: true } });
  console.log("Full keys and types of bad question:", Object.keys(sample).map(k => `${k}: ${typeof sample[k]} (isArray: ${Array.isArray(sample[k])})`));
  console.log(sample);

  await client.close();
}

main().catch(console.error);
