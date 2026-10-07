const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e) {}
const { MongoClient, ObjectId } = require('mongodb');

const DEFAULT_DB_URL =
  'mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary';

async function updateCategoryImages() {
  const client = new MongoClient(DEFAULT_DB_URL);
  try {
    await client.connect();
    const db = client.db('quizweb');
    const updates = [
      { id: '6ac4dbd0fc5656868e4ba234', topic: 'Human Body', img: '/cards/human-body.webp' },
      { id: '6ac4dbd0fc5656868e4ba235', topic: 'Amazing Facts', img: '/cards/amazing-facts.webp' },
      { id: '6abffbbfdb5cb6b7292eb79e', topic: 'Famous People', img: '/cards/famous-people.webp' },
      { id: '6a55c0a0247d754e6aa52363', topic: 'India History', img: '/cards/india-history.webp' },
      { id: '6a55c0a1247d754e6aa52365', topic: 'India Geography', img: '/cards/india-geography.webp' },
      { id: '6abffbbbdb5cb6b7292eb796', topic: 'Animals & Nature', img: '/cards/animals-nature.webp' },
      { id: '6abffbbadb5cb6b7292eb790', topic: 'Space & Universe', img: '/cards/space-universe.webp' },
      { id: '6abffbbcdb5cb6b7292eb79b', topic: 'Brain Riddles', img: '/cards/brain-riddles.webp' },
      { id: '6abffbbcdb5cb6b7292eb797', topic: 'Food', img: '/cards/food.webp' },
    ];

    for (const u of updates) {
      const res = await db.collection('Category').updateOne(
        { _id: new ObjectId(u.id) },
        { $set: { image: u.img, image_url: u.img, updatedAt: new Date() } }
      );
      console.log(`Updated ${u.topic} (${u.id}) -> ${u.img} (matched: ${res.matchedCount}, modified: ${res.modifiedCount})`);
    }
    console.log('All 9 category card images updated successfully in database!');
  } catch (err) {
    console.error('Update error:', err);
  } finally {
    await client.close();
  }
}

updateCategoryImages();
