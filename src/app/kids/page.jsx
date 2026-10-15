import React from "react";
import KidsPageClient from "./KidsPageClient";

export const metadata = {
  title: "किड्स ज़ोन (उम्र 5–12) - मजेदार क्विज़, पहेलियां और जादुई खेल | QuizWeb Kids",
  description:
    "5 से 12 वर्ष के बच्चों के लिए 100% सुरक्षित और विज्ञापन-मुक्त लर्निंग ज़ोन। जानवर, अंतरिक्ष, कहानियां और दिमागी पहेलियां खेलें, रोज़ स्ट्रीक बनाएं और नए स्टिकर्स अनलॉक करें!",
  keywords: [
    "किड्स ज़ोन",
    "kids quiz in hindi",
    "children educational games",
    "जानवर क्विज़",
    "अंतरिक्ष और रॉकेट क्विज़",
    "दिमागी पहेलियां",
    "बालगीत और संगीत",
    "quizweb kids zone",
    "safe kids quiz india",
  ],
  alternates: {
    canonical: "/kids",
  },
  openGraph: {
    title: "किड्स ज़ोन (उम्र 5–12) - QuizWeb",
    description:
      "बच्चों के लिए 100% सुरक्षित और विज्ञापन-मुक्त क्विज़, जादुई कहानियां, जानवर, अंतरिक्ष और दिमागी पहेलियां।",
    url: "/kids",
    siteName: "QuizWeb",
    locale: "hi_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "किड्स ज़ोन (उम्र 5–12) | QuizWeb Kids",
    description: "मजेदार क्विज़, पहेलियां और जादुई गेम्स बच्चों के लिए। 100% सुरक्षित!",
  },
};

export default function KidsZonePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalApplication",
    name: "QuizWeb Kids Zone (किड्स ज़ोन)",
    url: "https://quizweb.in/kids",
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
      audienceType: "Children aged 5 to 12",
    },
    inLanguage: ["hi", "en"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <KidsPageClient />
    </>
  );
}
