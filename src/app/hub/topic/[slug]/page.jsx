import { notFound } from "next/navigation";
import { getDb } from "@/lib/mongoDb";
import HubSetsClient from "@/components/hub/HubSetsClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quizweb.in";

async function getTopicData(slug) {
  const db = await getDb();
  const topic = await db.collection("TaxonomyTopic").findOne({ slug });
  if (!topic) return null;

  const sets = await db.collection("QuizSet")
    .find({ topicId: topic._id, status: "published" })
    .sort({ setIndex: 1 })
    .toArray();

  return {
    topic: {
      ...topic,
      _id: topic._id.toString(),
      categoryId: topic.categoryId ? topic.categoryId.toString() : null,
    },
    sets: sets.map((s) => ({
      _id: s._id.toString(),
      setIndex: s.setIndex,
      title: s.title,
      titleHi: s.titleHi,
      questionCount: s.questionCount,
      difficultyBreakdown: s.difficultyBreakdown || { easy: 7, medium: 7, hard: 6 },
    })),
  };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getTopicData(slug);
  if (!data) return { title: "Topic Not Found - QuizWeb" };

  const { topic, sets } = data;
  const title = `${topic.name} GK Quiz | ${topic.nameHi || ""} - QuizWeb`;
  const description = `Practice ${topic.name} quizzes online with balanced 20-question sets. Test your general knowledge with instant answers and scoring on QuizWeb.`;
  const canonicalUrl = `${SITE_URL}/hub/topic/${slug}`;
  const isIndexable = (topic.questionCount || sets.length * 20) >= 15;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: isIndexable,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "QuizWeb",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function TopicHubPage({ params }) {
  const { slug } = await params;
  const data = await getTopicData(slug);
  if (!data) notFound();

  const { topic, sets } = data;
  const totalQuestions = topic.questionCount || sets.length * 20;

  // JSON-LD structured data for Quiz type
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": `${topic.name} | ${topic.nameHi || ""}`,
    "description": `Comprehensive quiz practice for ${topic.name}. 20 questions per set with 7 easy, 7 medium, and 6 hard questions.`,
    "numberOfQuestions": totalQuestions,
    "provider": {
      "@type": "Organization",
      "name": "QuizWeb",
      "url": SITE_URL,
    },
    "hasPart": sets.map((s) => ({
      "@type": "Quiz",
      "name": `${topic.name} - ${s.title}`,
      "numberOfQuestions": s.questionCount,
    })),
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HubSetsClient
        sets={sets}
        title={`${topic.name} GK Quiz`}
        titleHi={topic.nameHi ? `${topic.nameHi} सामान्य ज्ञान प्रश्नोत्तरी` : ""}
        description={`Practice verified ${topic.name} questions organized into balanced 20-question sets with instant answers.`}
        descriptionHi={`प्रमाणित ${topic.nameHi || topic.name} के प्रश्नों का अभ्यास करें। प्रत्येक सेट में 7 आसान, 7 मध्यम और 6 कठिन प्रश्न शामिल हैं।`}
        slug={slug}
        type="topic"
        questionCount={totalQuestions}
      />
    </main>
  );
}
