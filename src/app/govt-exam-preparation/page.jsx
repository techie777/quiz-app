import { prisma } from "@/lib/prisma";
import LandingPageClient from "@/components/LandingPageClient";

export const revalidate = 3600;

export const metadata = {
  title: "Govt Exam Preparation | Digital Book & Quiz Portal",
  description: "Interactive digital book reading and quiz practice mode for competitive Government exams (SSC, Banking, UPSC, Railway, State PSC).",
};

export default async function GovtExamPreparationPage() {
  try {
    const categoriesRaw = await prisma.category.findMany({
      where: {
        hidden: false,
      },
      include: {
        _count: {
          select: { questions: true },
        },
        questions: {
          take: 3,
          select: {
            id: true,
            text: true,
            textHi: true,
            options: true,
            optionsHi: true,
            explanation: true,
            explanationHi: true,
            correctAnswer: true,
          },
        },
        subCategories: {
          select: {
            _count: {
              select: { questions: true },
            },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { topic: "asc" }],
    });

    const safeJsonParse = (json, fallback = []) => {
      if (!json) return fallback;
      if (typeof json !== "string") return json;
      try {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : fallback;
      } catch {
        return fallback;
      }
    };

    const initialCategories = categoriesRaw.map((cat) => ({
      id: cat.id,
      topic: cat.topic,
      topicHi: cat.topicHi,
      emoji: cat.emoji,
      description: cat.description,
      descriptionHi: cat.descriptionHi,
      categoryClass: cat.categoryClass,
      hidden: cat.hidden,
      image: cat.image,
      storyText: cat.storyText,
      storyImage: cat.storyImage,
      originalLang: cat.originalLang,
      isTrending: cat.isTrending,
      chips: safeJsonParse(cat.chips) || [],
      sortOrder: cat.sortOrder,
      parentId: cat.parentId,
      showSubCategoriesOnHome: cat.showSubCategoriesOnHome,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
      questionCount:
        (cat._count?.questions || 0) +
        (cat.subCategories?.reduce(
          (acc, sub) => acc + (sub._count?.questions || 0),
          0
        ) || 0),
      questions: (cat.questions || []).map((q) => ({
        ...q,
        options: safeJsonParse(q.options) || [],
        optionsHi: safeJsonParse(q.optionsHi) || [],
      })),
    }));

    return (
      <LandingPageClient
        initialCategories={initialCategories}
        defaultAudienceTab="govt"
        defaultExamMode="read"
      />
    );
  } catch (error) {
    console.error("Govt Exam Prep Page Fetch Error:", error);
    return (
      <LandingPageClient
        initialCategories={[]}
        defaultAudienceTab="govt"
        defaultExamMode="read"
      />
    );
  }
}
