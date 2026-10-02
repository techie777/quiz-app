const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e){}
const { MongoClient } = require('mongodb');

const DEFAULT_DB_URL =
  'mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary';

async function test() {
  const c = new MongoClient(DEFAULT_DB_URL);
  await c.connect();
  const db = c.db('quizweb');
  const missingAns = await db.collection('Question').countDocuments({
    $or: [{ correctAnswer: { $exists: false } }, { correctAnswer: null }, { correctAnswer: '' }]
  });
  console.log('Questions missing correctAnswer:', missingAns);
  const sample = await db.collection('Question').findOne({ correctAnswer: { $exists: true, $ne: '' } });
  console.log('Sample question:');
  console.log('- text:', sample.text || sample.question);
  console.log('- correctAnswer:', sample.correctAnswer);
  console.log('- correctIndex:', sample.correctIndex);
  console.log('- options:', sample.options);
  await c.close();
}
test();
