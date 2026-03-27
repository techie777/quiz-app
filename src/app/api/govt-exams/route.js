import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizapp';
const client = new MongoClient(uri);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 0;
    const skip = parseInt(searchParams.get('skip')) || 0;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';

    await client.connect();
    const database = client.db('quizweb');
    const collection = database.collection('govtExams');

    // Build query
    let mongoQuery = {};
    if (search) {
      mongoQuery.$text = { $search: search };
    }
    if (category !== 'all') {
      mongoQuery.category = category;
    }

    const total = await collection.countDocuments(mongoQuery);
    
    let cursor = collection.find(mongoQuery);
    
    // Sort by text relevance if searching, otherwise by startDate
    if (search) {
      cursor = cursor.project({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
    } else {
      cursor = cursor.sort({ startDate: -1 });
    }
    
    if (skip > 0) cursor = cursor.skip(skip);
    if (limit > 0) cursor = cursor.limit(limit);
    
    const exams = await cursor.toArray();
    
    return new Response(JSON.stringify({ exams, total }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch exams' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await client.close();
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    await client.connect();
    const database = client.db('quizweb');
    
    // Check if we are updating an existing exam by its 'id' field
    if (data.id) {
      // Update existing exam
      const { id, _id, ...updateData } = data; // Strip out _id to avoid MongoDB errors
      const result = await database.collection('govtExams').updateOne(
        { id: id },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      
      return new Response(JSON.stringify({ success: true, modifiedCount: result.modifiedCount }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Create new exam - generate a unique 'id' if not provided
      const newId = data.title.toLowerCase().replace(/ /g, '-') + '-' + Date.now();
      const newExam = {
        ...data,
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await database.collection('govtExams').insertOne(newExam);
      
      return new Response(JSON.stringify({ success: true, insertedId: result.insertedId, id: newId }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Database operation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save exam' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await client.close();
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Exam ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await client.connect();
    const database = client.db('quizweb');
    // Delete by the 'id' field instead of MongoDB '_id'
    const result = await database.collection('govtExams').deleteOne({ id: id });
    
    return new Response(JSON.stringify({ success: true, deletedCount: result.deletedCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database operation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete exam' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await client.close();
  }
}
