import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import SamanyaGyanClient from "@/components/quiz/SamanyaGyanClient";

export const metadata = {
  title: "सामान्य ज्ञान (General Knowledge) - लाइव क्विज़ व डिजिटल रीड मोड | QuizWeb",
  description:
    "भारत, विश्व, इतिहास, भूगोल, राजव्यवस्था, विज्ञान और 40+ विषयों पर आधारित सामान्य ज्ञान (GK) वस्तुनिष्ठ प्रश्न, लाइव क्विज़ व डिजिटल रीड मोड।",
  keywords: [
    "सामान्य ज्ञान",
    "General Knowledge",
    "India GK",
    "World GK",
    "GK Quiz in Hindi",
    "सामान्य ज्ञान प्रश्नोत्तरी",
    "quizweb samanya gyan",
  ],
  alternates: {
    canonical: "/quizzes",
  },
  openGraph: {
    title: "सामान्य ज्ञान (General Knowledge) - QuizWeb",
    description: "40+ लाइव श्रेणियां, 10,000+ वस्तुनिष्ठ प्रश्न, लाइव क्विज़ व डिजिटल रीड मोड।",
    url: "/quizzes",
    siteName: "QuizWeb",
    locale: "hi_IN",
    type: "website",
  },
};

// Incremental Static Regeneration: Revalidate every 1 hour (3600 seconds)
export const revalidate = 3600;

export default async function Page() {
  try {
    // Fetch initial categories for the home page (mimics the default API request)
    // We only fetch top-level, non-hidden categories for the initial view.
    const categoriesRaw = await prisma.category.findMany({
      where: {
        hidden: false,
        OR: [
          { parentId: null },
          { parentId: { isSet: false } },
          { showSubCategoriesOnHome: true }
        ]
      },
      include: {
        _count: {
          select: { questions: true }
        },
        questions: {
          take: 1,
          select: {
            id: true,
            text: true,
            textHi: true,
            options: true,
            optionsHi: true,
          }
        },
        subCategories: {
          select: {
            _count: {
              select: { questions: true }
            }
          }
        },
      },
      orderBy: [{ sortOrder: "asc" }, { topic: "asc" }, { id: "asc" }],
    });

    // Helper to safe parse JSON
    const safeJsonParse = (json, fallback = []) => {
      if (!json) return fallback;
      if (typeof json !== 'string') return json;
      try {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : fallback;
      } catch {
        return fallback;
      }
    };

    // Normalize categories for the client (must match the API structure)
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
      questionCount: (cat._count?.questions || 0) + (cat.subCategories?.reduce((acc, sub) => acc + (sub._count?.questions || 0), 0) || 0),
      questions: (cat.questions || []).map(q => ({
        ...q,
        options: safeJsonParse(q.options) || [],
        optionsHi: safeJsonParse(q.optionsHi) || []
      })),
    }));

    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8 text-slate-500">लोड हो रहा है...</div>}>
        <SamanyaGyanClient initialCategories={initialCategories} />
      </Suspense>
    );
  } catch (error) {
    console.error("Home Page Data Fetch Error:", error);
    // Graceful fallback to client-side only loading if server-side fails
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8 text-slate-500">लोड हो रहा है...</div>}>
        <SamanyaGyanClient initialCategories={[]} />
      </Suspense>
    );
  }
}
