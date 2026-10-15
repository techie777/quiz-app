import React from "react";
import SchoolStudyClient from "./SchoolStudyClient";

export const metadata = {
  title: "स्टूडेंट्स हब (कक्षा 6–12) - NCERT स्कूल पाठ्यक्रम अभ्यास | QuizWeb",
  description:
    "कक्षा 6 से 12 तक के विद्यार्थियों के लिए NCERT आधारित अध्याय-वार अभ्यास, दैनिक टेस्ट, क्विज़ और ओलंपियाड तैयारी। विज्ञान, गणित, सामाजिक विज्ञान और व्याकरण।",
  keywords: [
    "स्कूल अध्ययन",
    "कक्षा 9 विज्ञान",
    "कक्षा 10 गणित",
    "NCERT quiz",
    "school study quizweb",
    "विद्यार्थी हब",
    "कक्षा 6 से 12 क्विज",
  ],
  alternates: {
    canonical: "/school-study",
  },
  openGraph: {
    title: "स्टूडेंट्स हब (कक्षा 6–12) - QuizWeb",
    description: "कक्षा 6 से 12 के विद्यार्थियों के लिए अध्याय-वार वस्तुनिष्ठ प्रश्न, दैनिक टेस्ट और लीडरबोर्ड।",
    url: "/school-study",
    siteName: "QuizWeb",
    locale: "hi_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "स्टूडेंट्स हब (कक्षा 6–12) | QuizWeb School",
    description: "NCERT पाठ्यक्रम के अनुसार अध्याय-वार अभ्यास और दैनिक टेस्ट।",
  },
};

export default function SchoolStudyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalApplication",
    name: "QuizWeb Student Hub (स्टूडेंट्स हब: कक्षा 6–12)",
    url: "https://quizweb.in/school-study",
    applicationCategory: "EducationalGame",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType: "Secondary and High School Students Grade 6-12",
    },
    inLanguage: ["hi", "en"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SchoolStudyClient />
    </>
  );
}
