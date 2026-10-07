import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongoDb';
import { ObjectId } from 'mongodb';
import { getAdminFromRequest, requireAdmin } from '@/lib/adminSessionServer';
import { MAIN_CATEGORIES } from '@/lib/mainCategoriesConfig';

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
// GET /api/admin/categories/subcategories?parentId=...
// Returns:
// 1. Currently linked subcategories for this parent
// 2. All available categories that can be linked
// 3. Recommended subcategories from canonical config (if any)
// --------------------------------------------------------------------------
export async function GET(req) {
  try {
    const auth = await verifyAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json({ error: 'parentId is required' }, { status: 400 });
    }

    const db = await getDb();
    const parentObjId = toObjectId(parentId);

    // 1. Fetch parent category details
    const parentCat = await db.collection('Category').findOne({
      $or: [
        { _id: parentObjId },
        { id: parentId },
        { slug: parentId },
      ]
    });

    if (!parentCat) {
      return NextResponse.json({ error: 'Parent category not found' }, { status: 404 });
    }

    const actualParentId = parentCat._id;

    // 2. Find currently linked subcategories
    const linked = await db.collection('Category').find({
      $or: [
        { parentId: actualParentId },
        { parentId: actualParentId.toString() },
        { parentId: parentId },
      ]
    }).sort({ sortOrder: 1, sort_order: 1, topic: 1 }).toArray();

    // 3. Find all available categories (not this parent, and currently without this parent)
    const linkedIds = new Set(linked.map(c => c._id.toString()));
    linkedIds.add(actualParentId.toString());

    const allCats = await db.collection('Category').find({}).sort({ topic: 1 }).toArray();

    // Available categories that are either top-level or from other parents
    const available = allCats
      .filter(c => !linkedIds.has(c._id.toString()))
      .map(c => ({
        id: c._id.toString(),
        _id: c._id.toString(),
        topic: c.topic,
        topicHi: c.topicHi || '',
        emoji: c.emoji || '📁',
        slug: c.slug,
        parentId: c.parentId ? c.parentId.toString() : null,
        parentName: c.parentId ? allCats.find(p => p._id.toString() === c.parentId.toString())?.topic : null,
      }));

    // 4. Find recommended subcategories from MAIN_CATEGORIES
    let recommended = [];
    const mainConfig = MAIN_CATEGORIES.find(
      mc => mc.slug === parentCat.slug || mc.name.toLowerCase() === parentCat.topic.toLowerCase()
    );
    if (mainConfig?.subcategories) {
      recommended = mainConfig.subcategories.map(sub => {
        const existingMatch = allCats.find(
          c => c.topic.toLowerCase() === sub.name.toLowerCase() || c.slug === sub.slug
        );
        const isLinked = existingMatch && linkedIds.has(existingMatch._id.toString());
        return {
          name: sub.name,
          slug: sub.slug,
          topics: sub.topics || [],
          existingId: existingMatch ? existingMatch._id.toString() : null,
          isLinked: !!isLinked,
        };
      });
    }

    // 5. Compute question count for each linked subcategory
    const linkedWithCounts = await Promise.all(
      linked.map(async (sc) => {
        const scId = sc._id;
        const qCount = await db.collection('Question').countDocuments({
          $or: [
            { categoryId: scId },
            { categoryId: scId.toString() },
            { category_id: scId },
            { category_id: scId.toString() },
            { topicId: scId },
            { topicId: scId.toString() },
          ]
        });

        return {
          id: scId.toString(),
          _id: scId.toString(),
          topic: sc.topic,
          topicHi: sc.topicHi || '',
          emoji: sc.emoji || '📁',
          slug: sc.slug,
          questionCount: qCount,
          hidden: !!sc.hidden,
          sortOrder: sc.sortOrder ?? sc.sort_order ?? 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      parent: {
        id: actualParentId.toString(),
        topic: parentCat.topic,
        topicHi: parentCat.topicHi || '',
        slug: parentCat.slug,
        emoji: parentCat.emoji || '📁',
      },
      linkedSubCategories: linkedWithCounts,
      availableCategories: available,
      recommendedSubCategories: recommended,
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json({ error: 'Failed to fetch subcategories', details: error.message }, { status: 500 });
  }
}

// --------------------------------------------------------------------------
// POST /api/admin/categories/subcategories
// Body:
// - parentId: string (required)
// - action: 'link' | 'unlink' | 'set_linked' | 'create_and_link' | 'quick_link_recommended'
// - subCategoryId?: string
// - subCategoryIds?: string[]
// - newCategory?: { topic, topicHi, emoji }
// --------------------------------------------------------------------------
export async function POST(req) {
  try {
    const auth = await verifyAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const body = await req.json();
    const { parentId, action, subCategoryId, subCategoryIds, newCategory } = body;

    if (!parentId) {
      return NextResponse.json({ error: 'parentId is required' }, { status: 400 });
    }

    const db = await getDb();
    const parentObjId = toObjectId(parentId);
    const parentCat = await db.collection('Category').findOne({
      $or: [{ _id: parentObjId }, { id: parentId }, { slug: parentId }]
    });

    if (!parentCat) {
      return NextResponse.json({ error: 'Parent category not found' }, { status: 404 });
    }

    const targetParentId = parentCat._id;
    const now = new Date();

    // ACTION 1: Link one or multiple existing categories
    if (action === 'link') {
      const ids = Array.isArray(subCategoryIds) ? subCategoryIds : (subCategoryId ? [subCategoryId] : []);
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No categories specified to link' }, { status: 400 });
      }

      const objIds = ids.map(toObjectId).filter(Boolean);
      await db.collection('Category').updateMany(
        { _id: { $in: objIds } },
        { $set: { parentId: targetParentId, updatedAt: now } }
      );
    }

    // ACTION 2: Unlink (deselect) one or multiple categories
    else if (action === 'unlink') {
      const ids = Array.isArray(subCategoryIds) ? subCategoryIds : (subCategoryId ? [subCategoryId] : []);
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No categories specified to unlink' }, { status: 400 });
      }

      const objIds = ids.map(toObjectId).filter(Boolean);
      await db.collection('Category').updateMany(
        { _id: { $in: objIds } },
        { $set: { parentId: null, updatedAt: now } }
      );
    }

    // ACTION 3: Set exact list of linked subcategories (links list, unlinks others)
    else if (action === 'set_linked') {
      const ids = Array.isArray(subCategoryIds) ? subCategoryIds : [];
      const objIds = ids.map(toObjectId).filter(Boolean);

      // Unlink any currently linked that are NOT in the new list
      await db.collection('Category').updateMany(
        {
          $or: [{ parentId: targetParentId }, { parentId: targetParentId.toString() }],
          _id: { $nin: objIds }
        },
        { $set: { parentId: null, updatedAt: now } }
      );

      // Link all in the list
      if (objIds.length > 0) {
        await db.collection('Category').updateMany(
          { _id: { $in: objIds } },
          { $set: { parentId: targetParentId, updatedAt: now } }
        );
      }
    }

    // ACTION 4: Create a new category and link directly as subcategory
    else if (action === 'create_and_link') {
      if (!newCategory || !newCategory.topic?.trim()) {
        return NextResponse.json({ error: 'Topic is required for new category' }, { status: 400 });
      }

      const topicStr = newCategory.topic.trim();
      const topicHiStr = newCategory.topicHi?.trim() || '';
      const emojiStr = newCategory.emoji?.trim() || '📁';
      const baseSlug = topicStr.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      // Check unique slug
      let slug = baseSlug || 'sub-category';
      let suffix = 1;
      while (await db.collection('Category').findOne({ slug })) {
        slug = `${baseSlug}-${suffix++}`;
      }

      const newDoc = {
        _id: new ObjectId(),
        topic: topicStr,
        topicHi: topicHiStr,
        slug,
        emoji: emojiStr,
        description: `Sub-category of ${parentCat.topic}`,
        descriptionHi: `उप-विषय: ${parentCat.topicHi || parentCat.topic}`,
        categoryClass: `category-${slug}`,
        parentId: targetParentId,
        hidden: false,
        image: null,
        sortOrder: 10,
        sort_order: 10,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('Category').insertOne(newDoc);
    }

    // ACTION 5: Quick-link all recommended subcategories from MAIN_CATEGORIES
    else if (action === 'quick_link_recommended') {
      const mainConfig = MAIN_CATEGORIES.find(
        mc => mc.slug === parentCat.slug || mc.name.toLowerCase() === parentCat.topic.toLowerCase()
      );

      if (!mainConfig?.subcategories || mainConfig.subcategories.length === 0) {
        return NextResponse.json({ error: 'No recommended subcategories found for this category' }, { status: 400 });
      }

      for (const sub of mainConfig.subcategories) {
        // Find if category already exists in DB
        let catDoc = await db.collection('Category').findOne({
          $or: [
            { topic: { $regex: new RegExp(`^${sub.name.trim()}$`, 'i') } },
            { slug: sub.slug }
          ]
        });

        if (catDoc) {
          // Link existing
          await db.collection('Category').updateOne(
            { _id: catDoc._id },
            { $set: { parentId: targetParentId, updatedAt: now } }
          );
        } else {
          // Create and link
          let slug = sub.slug;
          let suffix = 1;
          while (await db.collection('Category').findOne({ slug })) {
            slug = `${sub.slug}-${suffix++}`;
          }

          await db.collection('Category').insertOne({
            _id: new ObjectId(),
            topic: sub.name,
            topicHi: '',
            slug,
            emoji: '📁',
            description: `Subcategory of ${parentCat.topic}`,
            descriptionHi: '',
            categoryClass: `category-${slug}`,
            parentId: targetParentId,
            chips: JSON.stringify(sub.topics || []),
            hidden: false,
            image: null,
            sortOrder: 1,
            sort_order: 1,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Touch parent category updatedAt
    await db.collection('Category').updateOne(
      { _id: targetParentId },
      { $set: { updatedAt: now } }
    );

    // Invalidate all server caches so updates reflect immediately
    if (globalThis.__CATEGORY_CACHE__) globalThis.__CATEGORY_CACHE__.clear();
    if (globalThis.__ADMIN_SETS_CACHE__) globalThis.__ADMIN_SETS_CACHE__.clear();

    // Fetch updated linked subcategories
    const updatedLinked = await db.collection('Category').find({
      $or: [
        { parentId: targetParentId },
        { parentId: targetParentId.toString() },
      ]
    }).sort({ topic: 1 }).toArray();

    return NextResponse.json({
      success: true,
      message: 'Sub-categories updated successfully!',
      linkedCount: updatedLinked.length,
      linkedSubCategories: updatedLinked.map(s => ({
        id: s._id.toString(),
        _id: s._id.toString(),
        topic: s.topic,
        topicHi: s.topicHi,
        emoji: s.emoji || '📁',
        slug: s.slug,
      }))
    });
  } catch (error) {
    console.error('Error updating subcategories:', error);
    return NextResponse.json({ error: 'Failed to update subcategories', details: error.message }, { status: 500 });
  }
}
