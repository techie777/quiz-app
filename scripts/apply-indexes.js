const { MongoClient } = require('mongodb');

// MongoDB URI - ensure this matches your .env or local setup
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizapp';
const client = new MongoClient(uri);

async function applyIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('quizweb');
    const collection = db.collection('govtExams');

    console.log('Applying indexes to "govtExams" collection...');

    // 1. Text index for search on title and organization
    await collection.createIndex({
      title: 'text',
      organization: 'text',
      postNames: 'text'
    }, {
      name: 'SearchIndex',
      weights: {
        title: 10,
        organization: 5,
        postNames: 2
      }
    });
    console.log('- Created text index on title, organization, and postNames');

    // 2. Index on startDate for sorting
    await collection.createIndex({ startDate: -1 });
    console.log('- Created index on startDate (descending)');

    // 3. Index on category for filtering
    await collection.createIndex({ category: 1 });
    console.log('- Created index on category');

    // 4. Index on custom id field for fast lookups/updates
    await collection.createIndex({ id: 1 }, { unique: true });
    console.log('- Created unique index on custom id field');

    // 5. Quiz Categories Collection Indexes
    const catCollection = db.collection('Category');
    console.log('Applying indexes to "Category" collection...');
    
    await catCollection.createIndex({
      topic: 'text',
      description: 'text'
    }, {
      name: 'CategorySearchIndex',
      weights: { topic: 10, description: 2 }
    });
    console.log('- Created text index on topic and description');
    
    await catCollection.createIndex({ sortOrder: 1 });
    await catCollection.createIndex({ parentId: 1 });
    await catCollection.createIndex({ updatedAt: -1 });
    console.log('- Created sort and parent indexes');

    // 6. Questions Collection Indexes
    const qCollection = db.collection('Question');
    console.log('Applying indexes to "Question" collection...');
    
    await qCollection.createIndex({ categoryId: 1 });
    await qCollection.createIndex({ difficulty: 1 });
    console.log('- Created category and difficulty indexes');

    console.log('All indexes applied successfully!');

  } catch (error) {
    console.error('Error applying indexes:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

applyIndexes();
