import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

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
      // Apply the change — support both naming conventions
      if (at === "add_category" || at === "create_category") {
        const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
        await prisma.category.create({
          data: {
            id: payload.id,
            topic: payload.topic,
            emoji: payload.emoji,
            description: payload.description || "",
            categoryClass: payload.categoryClass || `category-${payload.id}`,
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
            id: payload.id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
          for (const cat of payload.categories) {
            const exists = await prisma.category.findUnique({ where: { id: cat.id } });
            if (!exists) {
              const ms = await prisma.category.aggregate({ _max: { sortOrder: true } });
              await prisma.category.create({
                data: {
                  id: cat.id,
                  topic: cat.topic,
                  emoji: cat.emoji,
                  description: cat.description || "",
                  categoryClass: cat.categoryClass || "",
                  sortOrder: (ms._max.sortOrder ?? -1) + 1,
                  parentId: cat.parentId || null,
                  showSubCategoriesOnHome: !!cat.showSubCategoriesOnHome,
                  storyText: cat.storyText || null,
                  storyImage: cat.storyImage || null,
                  originalLang: cat.originalLang || "en",
                },
              });
            }
            for (const q of cat.questions || []) {
              const qExists = await prisma.question.findUnique({ where: { id: q.id } });
              if (!qExists) {
                await prisma.question.create({
                  data: { id: q.id, text: q.text, options: JSON.stringify(q.options), correctAnswer: q.correctAnswer, difficulty: q.difficulty || "easy", categoryId: cat.id },
                });
              }
            }
          }
        } else if (payload.questions && payload.categoryId) {
          for (const q of payload.questions) {
            await prisma.question.create({
              data: { id: q.id, text: q.text, options: JSON.stringify(q.options), correctAnswer: q.correctAnswer, difficulty: q.difficulty || "easy", categoryId: payload.categoryId },
            });
          }
        }
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
      reviewedBy: session.user.username,
      reviewNote: reviewNote || null,
    },
  });

  // Log the action
  await prisma.adminActivityLog.create({
    data: {
      adminId: session.user.adminId,
      action: `${action}_task`,
      details: `${action === "approve" ? "Approved" : "Rejected"} ${task.actionType} by ${task.adminId}`,
    },
  });

  return NextResponse.json({ success: true });
}
