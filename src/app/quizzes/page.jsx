import { prisma } from "@/lib/prisma";
import LandingPageClient from "@/components/LandingPageClient";

// Incremental Static Regeneration: Revalidate the homepage every 1 hour (3600 seconds)
// This is critical for high traffic volume (lacs of users).
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
        subCategories: {
          select: {
            _count: {
              select: { questions: true }
            }
          }
        },
      },
      orderBy: [{ sortOrder: "asc" }, { topic: "asc" }, { id: "asc" }],
      take: 12, // Match the itemsPerPage in client
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
       // Provide minimal questions if necessary, though Home usually just needs basic info
      questions: [],
    }));

    return <LandingPageClient initialCategories={initialCategories} />;
  } catch (error) {
    console.error("Home Page Data Fetch Error:", error);
    // Graceful fallback to client-side only loading if server-side fails
    return <LandingPageClient initialCategories={[]} />;
  }
}
