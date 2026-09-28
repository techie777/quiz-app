import { notFound } from "next/navigation";
import { getDb } from "@/lib/mongoDb";
import HubSetsClient from "@/components/hub/HubSetsClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quizweb.in";

const EXAM_META = {
  ssc: {
    name: "SSC Exams (CGL, CHSL, MTS, GD)",
    nameHi: "एसएससी परीक्षाएं (सीजीएल, सीएचएसएल, एमटीएस, जीडी)",
    examFilter: "SSC",
    desc: "Prepare for Staff Selection Commission exams with comprehensive 20-question practice sets covering Indian History, Polity, Geography, and General Awareness.",
    descHi: "कर्मचारी चयन आयोग (SSC) की परीक्षाओं के लिए सामान्य अध्ययन के 20-प्रश्नीय अभ्यास सेटों के साथ पूर्ण तैयारी करें।",
  },
  railway: {
    name: "Railway RRB NTPC & Group D",
    nameHi: "रेलवे भर्ती बोर्ड (RRB NTPC व ग्रुप डी)",
    examFilter: "Railway",
    desc: "Targeted Railway exam preparation sets with balanced difficulty distribution for NTPC, Group D, and ALP examinations.",
    descHi: "रेलवे भर्ती परीक्षाओं (एनटीपीसी, ग्रुप डी) के लिए विशेष रूप से तैयार किए गए संतुलित प्रश्न सेट।",
  },
  upsc: {
    name: "UPSC Civil Services & CDS / NDA",
    nameHi: "यूपीएससी सिविल सेवा व प्रतियोगी परीक्षाएं",
    examFilter: "UPSC",
    desc: "High-yield UPSC Prelims general studies question sets covering Indian Constitution, History, Economy, and Science.",
    descHi: "यूपीएससी प्रारंभिक परीक्षा और सिविल सेवा के लिए उच्च गुणवत्ता वाले सामान्य अध्ययन प्रश्न सेट।",
  },
  state: {
    name: "State PSC & Govt Recruitment Exams",
    nameHi: "राज्य लोक सेवा आयोग व प्रतियोगी परीक्षाएं",
    examFilter: "State",
    desc: "State public service commission and state government exam preparation sets across India.",
    descHi: "विभिन्न राज्यों की प्रशासनिक सेवा एवं सरकारी भर्ती परीक्षाओं के लिए अभ्यास सेट।",
  },
};

async function getExamData(slug) {
  const meta = EXAM_META[slug.toLowerCase()];
  if (!meta) return null;

  const db = await getDb();
  const sets = await db.collection("QuizSet")
    .find({ examSlug: slug.toLowerCase(), status: "published" })
    .sort({ setIndex: 1 })
    .toArray();

  const totalQuestions = await db.collection("Question").countDocuments({
    exam: meta.examFilter,
    status: "published",
  });

  return {
    meta,
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
  const data = await getExamData(slug);
  if (!data) return { title: "Exam Not Found - QuizWeb" };

  const { meta } = data;
  const title = `${meta.name} GK Quiz | ${meta.nameHi} - QuizWeb`;
  const description = meta.desc;
  const canonicalUrl = `${SITE_URL}/hub/exam/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
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

export default async function ExamHubPage({ params }) {
  const { slug } = await params;
  const data = await getExamData(slug);
  if (!data) notFound();

  const { meta, sets, totalQuestions } = data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": `${meta.name} | ${meta.nameHi}`,
    "description": meta.desc,
    "numberOfQuestions": totalQuestions,
    "provider": {
      "@type": "Organization",
      "name": "QuizWeb",
      "url": SITE_URL,
    },
    "hasPart": sets.map((s) => ({
      "@type": "Quiz",
      "name": `${meta.name} - ${s.title}`,
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
        title={`${meta.name} GK Quiz`}
        titleHi={`${meta.nameHi} प्रश्नोत्तरी`}
        description={meta.desc}
        descriptionHi={meta.descHi}
        slug={slug}
        type="exam"
        questionCount={totalQuestions}
      />
    </main>
  );
}
