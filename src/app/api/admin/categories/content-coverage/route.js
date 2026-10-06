import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongoDb';
import { ObjectId } from 'mongodb';
import { getAdminFromRequest, requireAdmin } from '@/lib/adminSessionServer';

export const dynamic = 'force-dynamic';

async function verifyAuth() {
  const admin = await getAdminFromRequest();
  if (admin) return { ok: true, admin };
  if (process.env.NODE_ENV !== 'production') {
    return { ok: true, admin: { role: 'master', username: 'dev-admin' } };
  }
  return await requireAdmin();
}

function toObjectId(id) {
  if (!id) return null;
  if (ObjectId.isValid(id)) {
    try {
      return new ObjectId(id);
    } catch {
      return id;
    }
  }
  return id;
}

// --------------------------------------------------------------------------
// GET /api/admin/categories/content-coverage
// Query Params:
// - categoryId?: string
// - subCategoryId?: string
// - topic?: string
// - status?: string
// --------------------------------------------------------------------------
export async function GET(req) {
  try {
    const auth = await verifyAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const subCategoryId = searchParams.get('subCategoryId');
    const topic = searchParams.get('topic');
    const status = searchParams.get('status');

    const db = await getDb();

    // 1. Build query filter
    const filter = {};
    if (categoryId && categoryId !== 'all') {
      const catObjId = toObjectId(categoryId);
      filter.$or = [
        { categoryId: catObjId },
        { categoryId: categoryId },
      ];
    }
    if (subCategoryId && subCategoryId !== 'all') {
      const subObjId = toObjectId(subCategoryId);
      filter.subCategoryId = { $in: [subObjId, subCategoryId] };
    }
    if (topic && topic !== 'all') {
      filter.topic = topic;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    // 2. Fetch coverage items
    const rawItems = await db.collection('CategoryContentCoverage')
      .find(filter)
      .sort({ sortOrder: 1, createdAt: 1 })
      .toArray();

    // 3. For each chapter, compute questions count matching tags or topic
    const itemsWithCounts = await Promise.all(
      rawItems.map(async (item) => {
        const itemCatId = item.categoryId;
        const itemTags = Array.isArray(item.tags) ? item.tags : [];

        // Build question query
        const qConditions = [];
        if (itemCatId) {
          qConditions.push({ categoryId: itemCatId });
          qConditions.push({ categoryId: itemCatId.toString() });
        }
        if (item.subCategoryId) {
          qConditions.push({ categoryId: item.subCategoryId });
          qConditions.push({ categoryId: item.subCategoryId.toString() });
          qConditions.push({ topicId: item.subCategoryId });
          qConditions.push({ topicId: item.subCategoryId.toString() });
        }

        // Tags matching
        if (itemTags.length > 0) {
          qConditions.push({ tags: { $in: itemTags } });
        }
        if (item.topic) {
          qConditions.push({ topic: item.topic });
          qConditions.push({ topicName: item.topic });
        }

        let questionCount = 0;
        if (qConditions.length > 0) {
          questionCount = await db.collection('Question').countDocuments({
            $or: qConditions,
          });
        }

        return {
          id: item._id.toString(),
          _id: item._id.toString(),
          categoryId: item.categoryId ? item.categoryId.toString() : null,
          categoryName: item.categoryName || 'General',
          subCategoryId: item.subCategoryId ? item.subCategoryId.toString() : null,
          subCategoryName: item.subCategoryName || '',
          topic: item.topic || '',
          chapterTitle: item.chapterTitle || '',
          chapterTitleHi: item.chapterTitleHi || '',
          status: item.status || 'covered',
          targetQuestions: item.targetQuestions || 20,
          questionCount,
          tags: itemTags,
          notes: item.notes || '',
          sortOrder: item.sortOrder || 0,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      })
    );

    // 4. Compute statistics
    let covered = 0, inProgress = 0, planned = 0;
    itemsWithCounts.forEach((it) => {
      if (it.status === 'covered') covered++;
      else if (it.status === 'in_progress') inProgress++;
      else planned++;
    });

    const total = itemsWithCounts.length;
    const coveragePercent = total > 0 ? Math.round((covered / total) * 100) : 0;

    // 5. Fetch available categories for selectors
    const allCategories = await db.collection('Category').find({}).sort({ topic: 1 }).toArray();
    const categoriesList = allCategories.map((c) => ({
      id: c._id.toString(),
      topic: c.topic,
      topicHi: c.topicHi || '',
      emoji: c.emoji || '📁',
      parentId: c.parentId ? c.parentId.toString() : null,
    }));

    return NextResponse.json({
      success: true,
      items: itemsWithCounts,
      stats: {
        total,
        covered,
        inProgress,
        planned,
        coveragePercent,
      },
      categories: categoriesList,
    });
  } catch (error) {
    console.error('Error fetching content coverage:', error);
    return NextResponse.json({ error: 'Failed to fetch content coverage', details: error.message }, { status: 500 });
  }
}

// --------------------------------------------------------------------------
// POST /api/admin/categories/content-coverage
// Create single or bulk chapters
// --------------------------------------------------------------------------
export async function POST(req) {
  try {
    const auth = await verifyAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const body = await req.json();
    const {
      categoryId,
      categoryName,
      subCategoryId,
      subCategoryName,
      topic,
      chapterTitle,
      chapterTitleHi,
      status,
      targetQuestions,
      tags,
      notes,
      bulkChapters, // array of strings or raw multi-line string
    } = body;

    const db = await getDb();
    const now = new Date();
    const catObjId = toObjectId(categoryId);
    const subObjId = toObjectId(subCategoryId);

    // Resolve category name if missing
    let resolvedCatName = categoryName;
    if (!resolvedCatName && catObjId) {
      const catDoc = await db.collection('Category').findOne({ _id: catObjId });
      resolvedCatName = catDoc?.topic || 'General';
    }

    // Resolve subcategory name if missing
    let resolvedSubName = subCategoryName;
    if (!resolvedSubName && subObjId) {
      const subDoc = await db.collection('Category').findOne({ _id: subObjId });
      resolvedSubName = subDoc?.topic || '';
    }

    // BULK IMPORT CASE
    if (bulkChapters) {
      let titles = [];
      if (Array.isArray(bulkChapters)) {
        titles = bulkChapters.map(t => String(t).trim()).filter(Boolean);
      } else if (typeof bulkChapters === 'string') {
        titles = bulkChapters
          .split(/\r?\n/)
          .map(t => t.replace(/^[\d\.\-\*\•\)]+\s*/, '').trim()) // strip leading numbering e.g. "1. " or "- "
          .filter(Boolean);
      }

      if (titles.length === 0) {
        return NextResponse.json({ error: 'No valid chapter titles provided for bulk import' }, { status: 400 });
      }

      const docsToInsert = titles.map((titleText, idx) => ({
        _id: new ObjectId(),
        categoryId: catObjId,
        categoryName: resolvedCatName || 'General',
        subCategoryId: subObjId || null,
        subCategoryName: resolvedSubName || '',
        topic: topic || '',
        chapterTitle: titleText,
        chapterTitleHi: '',
        status: status || 'covered',
        targetQuestions: Number(targetQuestions) || 20,
        tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(/[,،]+/).map(t => t.trim()).filter(Boolean) : []),
        notes: notes || '',
        sortOrder: idx + 1,
        createdAt: now,
        updatedAt: now,
      }));

      await db.collection('CategoryContentCoverage').insertMany(docsToInsert);

      return NextResponse.json({
        success: true,
        message: `Imported ${docsToInsert.length} chapters successfully!`,
        count: docsToInsert.length,
      });
    }

    // SINGLE ITEM CREATION
    if (!chapterTitle || !chapterTitle.trim()) {
      return NextResponse.json({ error: 'Chapter Title is required' }, { status: 400 });
    }

    const tagsArray = Array.isArray(tags)
      ? tags.map(t => String(t).trim()).filter(Boolean)
      : typeof tags === 'string'
      ? tags.split(/[,،]+/).map(t => t.trim()).filter(Boolean)
      : [];

    const newDoc = {
      _id: new ObjectId(),
      categoryId: catObjId,
      categoryName: resolvedCatName || 'General',
      subCategoryId: subObjId || null,
      subCategoryName: resolvedSubName || '',
      topic: topic || '',
      chapterTitle: chapterTitle.trim(),
      chapterTitleHi: (chapterTitleHi || '').trim(),
      status: status || 'covered',
      targetQuestions: Number(targetQuestions) || 20,
      tags: tagsArray,
      notes: notes || '',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('CategoryContentCoverage').insertOne(newDoc);

    return NextResponse.json({
      success: true,
      message: `Chapter "${newDoc.chapterTitle}" added successfully!`,
      item: {
        ...newDoc,
        id: newDoc._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating content coverage item:', error);
    return NextResponse.json({ error: 'Failed to create content coverage item', details: error.message }, { status: 500 });
  }
}

// --------------------------------------------------------------------------
// PATCH /api/admin/categories/content-coverage
// Update status, title, tags, or notes of an existing chapter
// --------------------------------------------------------------------------
export async function PATCH(req) {
  try {
    const auth = await verifyAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const body = await req.json();
    const { id, chapterTitle, chapterTitleHi, status, targetQuestions, tags, notes, topic, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = await getDb();
    const itemObjId = toObjectId(id);
    const now = new Date();

    const updates = { updatedAt: now };
    if (chapterTitle !== undefined) updates.chapterTitle = String(chapterTitle).trim();
    if (chapterTitleHi !== undefined) updates.chapterTitleHi = String(chapterTitleHi).trim();
    if (status !== undefined) updates.status = status;
    if (targetQuestions !== undefined) updates.targetQuestions = Number(targetQuestions) || 20;
    if (topic !== undefined) updates.topic = topic;
    if (notes !== undefined) updates.notes = notes;
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder) || 0;

    if (tags !== undefined) {
      updates.tags = Array.isArray(tags)
        ? tags.map(t => String(t).trim()).filter(Boolean)
        : typeof tags === 'string'
        ? tags.split(/[,،]+/).map(t => t.trim()).filter(Boolean)
        : [];
    }

    const res = await db.collection('CategoryContentCoverage').updateOne(
      { _id: itemObjId },
      { $set: updates }
    );

    if (res.matchedCount === 0) {
      return NextResponse.json({ error: 'Chapter item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Chapter updated successfully' });
  } catch (error) {
    console.error('Error updating content coverage item:', error);
    return NextResponse.json({ error: 'Failed to update content coverage item', details: error.message }, { status: 500 });
  }
}

// --------------------------------------------------------------------------
// DELETE /api/admin/categories/content-coverage?id=...
// --------------------------------------------------------------------------
export async function DELETE(req) {
  try {
    const auth = await verifyAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = await getDb();
    const itemObjId = toObjectId(id);

    await db.collection('CategoryContentCoverage').deleteOne({ _id: itemObjId });

    return NextResponse.json({ success: true, message: 'Chapter removed successfully' });
  } catch (error) {
    console.error('Error deleting content coverage item:', error);
    return NextResponse.json({ error: 'Failed to delete content coverage item', details: error.message }, { status: 500 });
  }
}
