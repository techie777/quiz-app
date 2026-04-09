import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function joinPathKey(pathSlugs) {
  return (pathSlugs || []).filter(Boolean).join("/");
}

async function computePathFieldsFor(parentId, selfId, selfSlug) {
  if (!parentId) {
    const pathIds = [selfId];
    const pathSlugs = [selfSlug];
    return { pathIds, pathSlugs, pathKey: joinPathKey(pathSlugs), depth: 0 };
  }
  const parent = await prisma.careerCategory.findUnique({
    where: { id: parentId },
    select: { id: true, pathIds: true, pathSlugs: true, depth: true },
  });
  if (!parent) throw new Error("Parent not found");
  const pathIds = [...(parent.pathIds || []), selfId];
  const pathSlugs = [...(parent.pathSlugs || []), selfSlug];
  return { pathIds, pathSlugs, pathKey: joinPathKey(pathSlugs), depth: (parent.depth ?? 0) + 1 };
}

async function ensureUniqueSlug(base, ignoreId) {
  const cleanBase = slugify(base) || "category";
  let slug = cleanBase;
  for (let i = 2; i < 200; i++) {
    const existing = await prisma.careerCategory.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${cleanBase}-${i}`;
  }
  throw new Error("Unable to generate unique slug");
}

async function recomputeSubtree(rootId) {
  const all = await prisma.careerCategory.findMany({
    select: { id: true, parentId: true, slug: true, pathIds: true, pathSlugs: true, pathKey: true, depth: true },
  });

  const byId = new Map(all.map((c) => [c.id, c]));
  const childrenByParent = new Map();
  for (const c of all) {
    const key = c.parentId || "__root__";
    const arr = childrenByParent.get(key) || [];
    arr.push(c.id);
    childrenByParent.set(key, arr);
  }

  const updateBatch = [];

  const dfs = async (id) => {
    const node = byId.get(id);
    if (!node) return;
    const parentId = node.parentId || null;
    const computed = await computePathFieldsFor(parentId, node.id, node.slug);
    updateBatch.push({ id: node.id, ...computed });
    const childIds = childrenByParent.get(node.id) || [];
    for (const childId of childIds) {
      await dfs(childId);
    }
  };

  await dfs(rootId);

  for (const u of updateBatch) {
    await prisma.careerCategory.update({
      where: { id: u.id },
      data: { pathIds: u.pathIds, pathSlugs: u.pathSlugs, pathKey: u.pathKey, depth: u.depth },
    });
  }
}

export async function GET(req) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { searchParams } = new URL(req.url);
  const includeHidden = searchParams.get("includeHidden") === "1";

  const categories = await prisma.careerCategory.findMany({
    where: includeHidden ? {} : { hidden: false },
    orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ success: true, categories });
}

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const parentId = body?.parentId ? String(body.parentId) : null;
    const hidden = Boolean(body?.hidden);
    const sortOrder = Number.isFinite(body?.sortOrder) ? body.sortOrder : 0;

    if (!name) return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });

    const slug = await ensureUniqueSlug(body?.slug || name, null);

    const created = await prisma.careerCategory.create({
      data: {
        name,
        slug,
        hidden,
        sortOrder,
        parentId,
        pathIds: [],
        pathSlugs: [],
        pathKey: "",
        depth: 0,
      },
    });

    const computed = await computePathFieldsFor(parentId, created.id, created.slug);
    const updated = await prisma.careerCategory.update({
      where: { id: created.id },
      data: computed,
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.admin.id,
        action: "create_career_category",
        details: `Created career category ${updated.name} (${updated.slug})`,
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (e) {
    console.error("career-categories POST error:", e);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const body = await req.json();
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ success: false, message: "id is required" }, { status: 400 });

    const existing = await prisma.careerCategory.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    const name = body?.name != null ? String(body.name).trim() : existing.name;
    const hidden = body?.hidden != null ? Boolean(body.hidden) : existing.hidden;
    const sortOrder = body?.sortOrder != null ? Number(body.sortOrder) : existing.sortOrder;
    const nextParentId = body?.parentId === "" ? null : (body?.parentId != null ? String(body.parentId) : existing.parentId);

    if (!name) return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });
    if (nextParentId && nextParentId === id) {
      return NextResponse.json({ success: false, message: "Parent cannot be self" }, { status: 400 });
    }

    const slug = body?.slug != null ? await ensureUniqueSlug(body.slug || name, id) : existing.slug;

    // Prevent cycles: new parent cannot be within this node's subtree.
    if (nextParentId) {
      const parent = await prisma.careerCategory.findUnique({ where: { id: nextParentId }, select: { pathIds: true } });
      if (parent?.pathIds?.includes(id)) {
        return NextResponse.json({ success: false, message: "Invalid parent (cycle)" }, { status: 400 });
      }
    }

    const updated = await prisma.careerCategory.update({
      where: { id },
      data: { name, slug, hidden, sortOrder, parentId: nextParentId },
    });

    await recomputeSubtree(updated.id);

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.admin.id,
        action: "update_career_category",
        details: `Updated career category ${updated.name} (${updated.slug})`,
      },
    });

    const fresh = await prisma.careerCategory.findUnique({ where: { id } });
    return NextResponse.json({ success: true, category: fresh });
  } catch (e) {
    console.error("career-categories PUT error:", e);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "id is required" }, { status: 400 });

    const node = await prisma.careerCategory.findUnique({ where: { id }, select: { id: true, name: true, slug: true } });
    if (!node) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    const hasChildren = await prisma.careerCategory.findFirst({ where: { parentId: id }, select: { id: true } });
    if (hasChildren) {
      return NextResponse.json({ success: false, message: "Category has children. Re-parent or delete children first." }, { status: 409 });
    }

    const inUse = await prisma.careerGuide.findFirst({ where: { careerCategoryId: id }, select: { id: true } });
    if (inUse) {
      return NextResponse.json({ success: false, message: "Category is assigned to a guide. Unassign first." }, { status: 409 });
    }

    await prisma.careerCategory.delete({ where: { id } });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.admin.id,
        action: "delete_career_category",
        details: `Deleted career category ${node.name} (${node.slug})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("career-categories DELETE error:", e);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

