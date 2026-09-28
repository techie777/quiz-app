import { notFound } from "next/navigation";
import { getDb } from "@/lib/mongoDb";
import HubSetsClient from "@/components/hub/HubSetsClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quizweb.in";

const STATE_NAMES = {
  "rajasthan-gk": { en: "Rajasthan", hi: "राजस्थान" },
  "uttar-pradesh-gk": { en: "Uttar Pradesh", hi: "उत्तर प्रदेश" },
  "bihar-gk": { en: "Bihar", hi: "बिहार" },
  "madhya-pradesh-gk": { en: "Madhya Pradesh", hi: "मध्य प्रदेश" },
  "haryana-gk": { en: "Haryana", hi: "हरियाणा" },
  "gujarat-gk": { en: "Gujarat", hi: "गुजरात" },
  "jharkhand-gk": { en: "Jharkhand", hi: "झारखंड" },
  "karnataka-gk": { en: "Karnataka", hi: "कर्नाटक" },
  "kerala-gk": { en: "Kerala", hi: "केरल" },
  "himachal-pradesh-gk": { en: "Himachal Pradesh", hi: "हिमाचल प्रदेश" },
  "uttarakhand-gk": { en: "Uttarakhand", hi: "उत्तराखंड" },
  "goa-gk": { en: "Goa", hi: "गोवा" },
};

function getStateInfo(slug) {
  const normalized = slug.toLowerCase();
  if (STATE_NAMES[normalized]) {
    return STATE_NAMES[normalized];
  }
  // Fallback parsing
  const clean = normalized.replace(/-gk$/, "").replace(/-/g, " ");
  const capitalized = clean.replace(/\b\w/g, (c) => c.toUpperCase());
  return { en: capitalized, hi: capitalized };
}

async function getStateData(slug) {
  const db = await getDb();
  const normalized = slug.toLowerCase();
  const stateInfo = getStateInfo(normalized);

  const sets = await db.collection("QuizSet")
    .find({ stateSlug: normalized, status: "published" })
    .sort({ setIndex: 1 })
    .toArray();

  const totalQuestions = await db.collection("Question").countDocuments({
    state: stateInfo.en,
    status: "published",
  });

  return {
    stateInfo,
    totalQuestions: totalQuestions || sets.length * 20,
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
  const data = await getStateData(slug);
  const { stateInfo, sets, totalQuestions } = data;

  const title = `${stateInfo.en} GK Quiz | ${stateInfo.hi} सामान्य ज्ञान - QuizWeb`;
  const description = `Practice ${stateInfo.en} general knowledge quizzes online with 20-question balanced sets. Prepare for state exams with verified questions on QuizWeb.`;
  const canonicalUrl = `${SITE_URL}/hub/state/${slug}`;
  const isIndexable = (totalQuestions || sets.length * 20) >= 15;

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

export default async function StateHubPage({ params }) {
  const { slug } = await params;
  const data = await getStateData(slug);
  const { stateInfo, sets, totalQuestions } = data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": `${stateInfo.en} GK Quiz | ${stateInfo.hi} सामान्य ज्ञान`,
    "description": `Comprehensive state general knowledge quiz for ${stateInfo.en}. Balanced 20-question sets.`,
    "numberOfQuestions": totalQuestions,
    "provider": {
      "@type": "Organization",
      "name": "QuizWeb",
      "url": SITE_URL,
    },
    "hasPart": sets.map((s) => ({
      "@type": "Quiz",
      "name": `${stateInfo.en} GK - ${s.title}`,
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
        title={`${stateInfo.en} GK Quiz`}
        titleHi={`${stateInfo.hi} सामान्य ज्ञान प्रश्नोत्तरी`}
        description={`Master ${stateInfo.en} history, geography, economy, and heritage with verified 20-question practice sets.`}
        descriptionHi={`${stateInfo.hi} के इतिहास, भूगोल, संस्कृति व राज्य सामान्य ज्ञान के महत्वपूर्ण प्रश्नों का अभ्यास करें।`}
        slug={slug}
        type="state"
        questionCount={totalQuestions}
      />
    </main>
  );
}
