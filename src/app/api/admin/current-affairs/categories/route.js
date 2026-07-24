import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SETTING_KEY = "currentAffairsCategories";

const DEFAULT_CATEGORIES = [
  { id: "cat-national", name: "National", emoji: "🇮🇳", hidden: false },
  { id: "cat-international", name: "International", emoji: "🌍", hidden: false },
  { id: "cat-economy", name: "Economy & Banking", emoji: "💰", hidden: false },
  { id: "cat-sports", name: "Sports & Awards", emoji: "🏆", hidden: false },
  { id: "cat-science", name: "Science & Tech", emoji: "🔬", hidden: false },
  { id: "cat-defense", name: "Defense & Security", emoji: "🛡️", hidden: false },
  { id: "cat-state", name: "State GK", emoji: "🏛️", hidden: false },
  { id: "cat-appointments", name: "Appointments", emoji: "👤", hidden: false },
];

async function getStoredCategories() {
  const row = await prisma.setting.findUnique({
    where: { key: SETTING_KEY },
  });

  if (!row) {
    // Initialize default setting
    await prisma.setting.create({
      data: {
        key: SETTING_KEY,
        value: JSON.stringify(DEFAULT_CATEGORIES),
      },
    }).catch(() => {});
    return DEFAULT_CATEGORIES;
  }

  const parsed = safeJsonParse(row.value, DEFAULT_CATEGORIES);
  return Array.isArray(parsed) ? parsed : DEFAULT_CATEGORIES;
}

async function saveStoredCategories(categories) {
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: JSON.stringify(categories) },
    create: { key: SETTING_KEY, value: JSON.stringify(categories) },
  });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const categories = await getStoredCategories();
  
  // Calculate article counts per category
  const allArticles = await prisma.currentAffair.findMany({
    select: { category: true, hidden: true }
  });

  const countMap = {};
  for (const a of allArticles) {
    const catName = a.category || "General";
    countMap[catName] = (countMap[catName] || 0) + 1;
  }

  const enriched = categories.map(c => ({
    ...c,
    count: countMap[c.name] || 0
  }));

  return NextResponse.json({ categories: enriched });
}

export async function POST(request) {
  const admin = await requireAdmin({ masterOnly: true });
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const emoji = String(body.emoji || "📰").trim();
  const hidden = !!body.hidden;

  if (!name) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }

  const categories = await getStoredCategories();
  
  // Check duplicate
  if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: "Category already exists" }, { status: 400 });
  }

  const newCat = {
    id: "cat-" + Date.now(),
    name,
    emoji,
    hidden
  };

  categories.push(newCat);
  await saveStoredCategories(categories);

  return NextResponse.json({ success: true, category: newCat, categories });
}

export async function PUT(request) {
  const admin = await requireAdmin({ masterOnly: true });
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const body = await request.json().catch(() => ({}));
  const { id, name, emoji, hidden, toggleArticlesHidden } = body;

  if (!id) return NextResponse.json({ error: "Category ID is required" }, { status: 400 });

  let categories = await getStoredCategories();
  const index = categories.findIndex(c => c.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const oldName = categories[index].name;
  const newName = name ? String(name).trim() : oldName;
  const newEmoji = emoji !== undefined ? String(emoji).trim() : categories[index].emoji;
  const newHidden = hidden !== undefined ? !!hidden : categories[index].hidden;

  categories[index] = {
    ...categories[index],
    name: newName,
    emoji: newEmoji,
    hidden: newHidden
  };

  await saveStoredCategories(categories);

  // If category name changed, update matching CurrentAffair rows
  if (oldName !== newName) {
    await prisma.currentAffair.updateMany({
      where: { category: oldName },
      data: { category: newName }
    }).catch(err => console.error("Update articles category error:", err));
  }

  // If toggleArticlesHidden flag is passed, update all articles in this category to match hidden status
  if (toggleArticlesHidden !== undefined) {
    await prisma.currentAffair.updateMany({
      where: { category: newName },
      data: { hidden: newHidden }
    }).catch(err => console.error("Toggle category articles hidden error:", err));
  }

  return NextResponse.json({ success: true, category: categories[index], categories });
}

export async function DELETE(request) {
  const admin = await requireAdmin({ masterOnly: true });
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Category ID is required" }, { status: 400 });

  let categories = await getStoredCategories();
  categories = categories.filter(c => c.id !== id);

  await saveStoredCategories(categories);

  return NextResponse.json({ success: true, categories });
}
