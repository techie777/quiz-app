import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const admin = await requireAdmin({ masterOnly: true });
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { id } = params;
  const { action, reviewNote } = await request.json(); // "approve" or "reject"

  const task = await prisma.pendingTask.findUnique({ where: { id } });
  if (!task || task.status !== "pending") {
    return NextResponse.json({ error: "Task not found or already processed" }, { status: 404 });
  }

  if (action === "approve") {
    const payload = safeJsonParse(task.payload, {});
    const at = task.actionType;

    try {
      async function loadCurrentAffairs() {
        const row = await prisma.setting.findUnique({
          where: { key: "currentAffairs" },
          select: { value: true },
        });
        const list = safeJsonParse(row?.value || "[]", []);
        return Array.isArray(list) ? list : [];
      }

      async function saveCurrentAffairs(list) {
        await prisma.setting.upsert({
          where: { key: "currentAffairs" },
          update: { value: JSON.stringify(list) },
          create: { key: "currentAffairs", value: JSON.stringify(list) },
        });
      }

      // Apply the change — support both naming conventions
      if (at === "add_category" || at === "create_category") {
        const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
        const maybeId = typeof payload.id === "string" && payload.id.length === 24 ? payload.id : undefined;
        await prisma.category.create({
          data: {
            ...(maybeId ? { id: maybeId } : {}),
            topic: payload.topic,
            emoji: payload.emoji,
            description: payload.description || "",
            categoryClass:
              payload.categoryClass ||
              `category-${String(payload.topic || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
            hidden: !!payload.hidden,
            image: payload.image || null,
            sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
            parentId: payload.parentId || null,
            showSubCategoriesOnHome: !!payload.showSubCategoriesOnHome,
            storyText: payload.storyText || null,
            storyImage: payload.storyImage || null,
          },
        });
      } else if (at === "edit_category" || at === "update_category") {
        const catId = task.entityId || payload.categoryId;
        const data = { ...payload };
        delete data.categoryId;
        await prisma.category.update({ where: { id: catId }, data });
      } else if (at === "delete_category") {
        const catId = task.entityId || payload.categoryId;
        await prisma.question.deleteMany({ where: { categoryId: catId } });
        await prisma.category.delete({ where: { id: catId } });
      } else if (at === "add_question" || at === "create_question") {
        await prisma.question.create({
          data: {
            text: payload.text,
            options: JSON.stringify(payload.options),
            correctAnswer: payload.correctAnswer,
            difficulty: payload.difficulty || "easy",
            image: payload.image || null,
            categoryId: payload.categoryId,
          },
        });
      } else if (at === "edit_question" || at === "update_question") {
        const qId = task.entityId || payload.questionId;
        const data = { ...payload };
        if (data.options) data.options = JSON.stringify(data.options);
        delete data.categoryId;
        delete data.questionId;
        await prisma.question.update({ where: { id: qId }, data });
      } else if (at === "delete_question") {
        const qId = task.entityId || payload.questionId;
        await prisma.question.delete({ where: { id: qId } });
      } else if (at === "bulk_upload" || at === "bulk_import" || at === "bulk_add_questions") {
        if (payload.categories) {
          console.log("[Approval] Processing bulk_import categories:", payload.categories.length);
          for (const cat of payload.categories) {
            // Use topic for uniqueness if ID is not a valid MongoDB ObjectId or let Prisma handle it
            const catId = (cat.id && cat.id.length === 24) ? cat.id : undefined;
            
            let existing = null;
            if (catId) {
              existing = await prisma.category.findUnique({ where: { id: catId } });
            } else {
              existing = await prisma.category.findFirst({ where: { topic: cat.topic } });
            }

            let targetCatId = existing?.id;

            if (!existing) {
              const ms = await prisma.category.aggregate({ _max: { sortOrder: true } });
              const newCat = await prisma.category.create({
                data: {
                  topic: cat.topic,
                  emoji: cat.emoji || "❓",
                  description: cat.description || "",
                  categoryClass: cat.categoryClass || `category-${cat.topic.toLowerCase().replace(/\s+/g, "-")}`,
                  sortOrder: (ms._max.sortOrder ?? -1) + 1,
                  parentId: cat.parentId || null,
                  showSubCategoriesOnHome: !!cat.showSubCategoriesOnHome,
                  storyText: cat.storyText || null,
                  storyImage: cat.storyImage || null,
                  originalLang: cat.originalLang || "en",
                },
              });
              targetCatId = newCat.id;
              console.log("[Approval] Created new category for bulk:", cat.topic, targetCatId);
            }

            for (const q of cat.questions || []) {
              await prisma.question.create({
                data: { 
                  text: q.text, 
                  options: JSON.stringify(q.options), 
                  correctAnswer: q.correctAnswer, 
                  difficulty: q.difficulty || "easy", 
                  categoryId: targetCatId 
                },
              });
            }
          }
        } else if (payload.questions && payload.categoryId) {
          console.log("[Approval] Processing bulk_add_questions for cat:", payload.categoryId);
          for (const q of payload.questions) {
            await prisma.question.create({
              data: { 
                text: q.text, 
                options: JSON.stringify(q.options), 
                correctAnswer: q.correctAnswer, 
                difficulty: q.difficulty || "easy", 
                categoryId: payload.categoryId 
              },
            });
          }
        }
      } else if (at === "create_current_affair") {
        const list = await loadCurrentAffairs();
        const now = new Date().toISOString();
        const id = `ca_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        list.push({
          id,
          date: payload.date,
          category: payload.category || "",
          heading: payload.heading,
          description: payload.description,
          image: payload.image || "",
          hidden: !!payload.hidden,
          createdAt: now,
          updatedAt: now,
        });
        await saveCurrentAffairs(list);
      } else if (at === "update_current_affair") {
        const list = await loadCurrentAffairs();
        const id = payload.id || task.entityId;
        const idx = list.findIndex((x) => x?.id === id);
        if (idx < 0) throw new Error("Current affair not found");
        const now = new Date().toISOString();
        list[idx] = {
          ...list[idx],
          ...(payload.date !== undefined ? { date: payload.date } : {}),
          ...(payload.category !== undefined ? { category: payload.category } : {}),
          ...(payload.heading !== undefined ? { heading: payload.heading } : {}),
          ...(payload.description !== undefined ? { description: payload.description } : {}),
          ...(payload.image !== undefined ? { image: payload.image } : {}),
          ...(payload.hidden !== undefined ? { hidden: !!payload.hidden } : {}),
          updatedAt: now,
        };
        await saveCurrentAffairs(list);
      } else if (at === "delete_current_affair") {
        const list = await loadCurrentAffairs();
        const id = payload.id || task.entityId;
        const next = list.filter((x) => x?.id !== id);
        await saveCurrentAffairs(next);
      }
    } catch (applyError) {
      console.error("Error applying approved task:", applyError);
      return NextResponse.json({ error: "Failed to apply change: " + applyError.message }, { status: 500 });
    }
  }

  await prisma.pendingTask.update({
    where: { id },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      reviewedBy: admin.admin.username,
      reviewNote: reviewNote || null,
    },
  });

  // Log the action
  await prisma.adminActivityLog.create({
    data: {
      adminId: admin.admin.id,
      action: `${action}_task`,
      details: `${action === "approve" ? "Approved" : "Rejected"} ${task.actionType} by ${task.adminId}`,
    },
  });

  return NextResponse.json({ success: true });
}
