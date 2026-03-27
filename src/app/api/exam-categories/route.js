import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizapp';
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const database = client.db('quizweb');
    const categories = await database.collection('examCategories').find({}).toArray();
    
    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), {
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
    
    // Check if updating by the 'id' field
    if (data.id) {
      // Update existing category
      const { id, _id, ...updateData } = data; // Strip out _id to avoid MongoDB errors
      const result = await database.collection('examCategories').updateOne(
        { id: id },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      
      return new Response(JSON.stringify({ success: true, modifiedCount: result.modifiedCount }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Create new category - generate a unique 'id' if not provided
      const newId = data.name.toLowerCase().replace(/ /g, '-') + '-' + Date.now();
      const newCategory = {
        ...data,
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await database.collection('examCategories').insertOne(newCategory);
      
      return new Response(JSON.stringify({ success: true, insertedId: result.insertedId, id: newId }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Database operation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save category' }), {
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
      return new Response(JSON.stringify({ error: 'Category ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await client.connect();
    const database = client.db('quizweb');
    
    // Check if category has exams
    const examsInCategory = await database.collection('govtExams').countDocuments({ category: id });
    
    if (examsInCategory > 0) {
      return new Response(JSON.stringify({ 
        error: 'Cannot delete category. There are exams in this category.',
        examCount: examsInCategory 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete by the 'id' field
    const result = await database.collection('examCategories').deleteOne({ id: id });
    
    return new Response(JSON.stringify({ success: true, deletedCount: result.deletedCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database operation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete category' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await client.close();
  }
}
