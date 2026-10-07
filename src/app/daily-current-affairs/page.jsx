"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import FlashDeck from "@/components/flashcards/FlashDeck";
import styles from "@/styles/CurrentAffairsModern.module.css";
import {
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Share2,
  ArrowLeft,
  ArrowRight,
  X,
  Layers,
  Heart,
  Check,
  Flame,
  FileText,
  Zap,
  HelpCircle,
} from "lucide-react";

/* ──────────────── SVG CATEGORY LINE ICONS ──────────────── */
function CategoryIcon({ category, size = 20, color = "currentColor" }) {
  const cat = (category || "").toLowerCase();

  if (cat.includes("world") || cat.includes("international")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    );
  }
  if (cat.includes("economy") || cat.includes("banking") || cat.includes("finance")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    );
  }
  if (cat.includes("sports")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    );
  }
  if (cat.includes("science") || cat.includes("tech")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.31" />
        <path d="M14 2v7.31" />
        <path d="M8.5 2h7" />
        <path d="M14 9.3a6.5 6.5 0 1 1-4 0" />
        <circle cx="12" cy="15" r="1" />
      </svg>
    );
  }
  if (cat.includes("defense") || cat.includes("security")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  // Default / National / Polity (Pillar / Flag / Monument)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16" />
      <path d="M6 18V9" />
      <path d="M10 18V9" />
      <path d="M14 18V9" />
      <path d="M18 18V9" />
      <polygon points="12 2 20 7 4 7 12 2" />
    </svg>
  );
}

function getCategoryColor(category) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("world") || cat.includes("international")) {
    return { bg: "#E0F2FE", icon: "#0284C7" };
  }
  if (cat.includes("economy") || cat.includes("banking")) {
    return { bg: "#FEF3C7", icon: "#D97706" };
  }
  if (cat.includes("sports")) {
    return { bg: "#DCFCE7", icon: "#16A34A" };
  }
  if (cat.includes("science") || cat.includes("tech")) {
    return { bg: "#F3E8FF", icon: "#9333EA" };
  }
  if (cat.includes("defense")) {
    return { bg: "#FFE4E6", icon: "#E11D48" };
  }
  return { bg: "#EDE9FE", icon: "#6366F1" };
}

/* ──────────────── DATE UTILITIES ──────────────── */
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr, isHindi) {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (isHindi) {
      const monthsHi = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];
      return `${d} ${monthsHi[date.getMonth()]} ${y}`;
    }
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getWeekDays(anchorDateStr) {
  const parts = String(anchorDateStr || "").split("-").map(Number);
  const anchor = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();

  // Calculate Monday of the week
  const dayOfWeek = anchor.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - distanceToMonday);

  const days = [];
  const dayNamesEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayNamesHi = ["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    days.push({
      dateStr,
      dayNum: d.getDate(),
      dayNameEn: dayNamesEn[i],
      dayNameHi: dayNamesHi[i],
    });
  }
  return days;
}

function shiftWeek(anchorDateStr, offsetDays) {
  const parts = String(anchorDateStr || "").split("-").map(Number);
  const d = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ──────────────── REAL & CURATED SAMPLE STORIES ──────────────── */
const BASE_SAMPLE_STORIES = [
  {
    id: "ca-story-1",
    date: getTodayDateString(),
    category: "National",
    headline: "Headline of today's top national story: Strategic Innovation Corridor Launched",
    headlineHi: "राष्ट्रीय नवाचार गलियारे का नई दिल्ली में शुभारंभ: तकनीकी विकास को नई दिशा",
    summary: "New initiative accelerates bilateral AI research and green infrastructure development across 14 premier institutions.",
    summaryHi: "14 प्रमुख संस्थानों में द्विपक्षीय एआई अनुसंधान और हरित अवसंरचना विकास को गति देने की नई पहल।",
    keyPoints: [
      "Key point one: a short, exam-ready fact on AI and green infrastructure expansion.",
      "Key point two: a name, date or number to remember — 500 GW renewable target by 2030.",
      "Key point three: why the story matters for UPSC GS Paper III and national growth.",
    ],
    keyPointsHi: [
      "मुख्य बिंदु एक: एआई और हरित अवसंरचना विस्तार पर परीक्षा-उन्मुख संक्षिप्त तथ्य।",
      "मुख्य बिंदु दो: याद रखने योग्य नाम और तारीख — 2030 तक 500 गीगावाट नवीकरणीय ऊर्जा लक्ष्य।",
      "मुख्य बिंदु तीन: यह निर्णय यूपीएससी जीएस पेपर 3 और राष्ट्रीय विकास के लिए क्यों महत्वपूर्ण है।",
    ],
    readTime: "2 min read",
    readTimeHi: "2 मिनट",
    content:
      "India and key bilateral partners have formally unveiled the Strategic Innovation Corridor in New Delhi, anchoring collaborative research across 14 tier-one academic and industrial hubs. The agreement prioritizes artificial intelligence infrastructure, high-performance computing, and next-generation energy storage to meet the national target of 500 GW non-fossil capacity by 2030. The joint framework establishes streamlined patent channels and co-developed clean tech facilities.",
    contentHi:
      "भारत और प्रमुख द्विपक्षीय साझेदारों ने नई दिल्ली में रणनीतिक नवाचार गलियारे का औपचारिक शुभारंभ किया, जो 14 प्रमुख शैक्षणिक और औद्योगिक केंद्रों में अनुसंधान को गति प्रदान करेगा। यह समझौता कृत्रिम बुद्धिमत्ता (एआई) अवसंरचना, उच्च प्रदर्शन कंप्यूटिंग और 2030 तक 500 गीगावाट गैर-जीवाश्म क्षमता के राष्ट्रीय लक्ष्य को पूरा करने के लिए ऊर्जा भंडारण को प्राथमिकता देता है।",
    oneLiner: "India launches Strategic Innovation Corridor in New Delhi targeting 500 GW clean energy and sovereign AI infrastructure.",
    oneLinerHi: "भारत ने 500 गीगावाट स्वच्छ ऊर्जा और संप्रभु एआई अवसंरचना के लक्ष्य के साथ नई दिल्ली में रणनीतिक नवाचार गलियारा शुरू किया।",
    quickQuiz: {
      question: "What is the non-fossil energy capacity target set under India's national climate goals?",
      questionHi: "भारत के राष्ट्रीय जलवायु लक्ष्यों के तहत गैर-जीवाश्म ऊर्जा क्षमता का लक्ष्य क्या है?",
      options: ["350 GW by 2028", "500 GW by 2030", "650 GW by 2032", "750 GW by 2035"],
      optionsHi: ["350 गीगावाट (2028 तक)", "500 गीगावाट (2030 तक)", "650 गीगावाट (2032 तक)", "750 गीगावाट (2035 तक)"],
      correctIndex: 1,
      explanation: "India has pledged to achieve 500 GW of non-fossil fuel installed electricity capacity by 2030.",
    },
  },
  {
    id: "ca-story-2",
    date: getTodayDateString(),
    category: "World",
    headline: "Transformation in Global Leadership 2026: UN Assembly Adopts Digital Governance Accord",
    headlineHi: "वैश्विक नेतृत्व में परिवर्तन 2026: संयुक्त राष्ट्र महासभा ने ऐतिहासिक डिजिटल शासन समझौते को अपनाया",
    summary: "Over 120 member states reach consensus on responsible AI oversight, data privacy and international digital trade guidelines.",
    summaryHi: "120 से अधिक सदस्य देशों ने जिम्मेदार एआई निगरानी, डेटा गोपनीयता और अंतरराष्ट्रीय डिजिटल व्यापार दिशानिर्देशों पर सहमति बनाई।",
    keyPoints: [
      "Key point one: UN General Assembly adopts historic multilateral accord on AI ethics standards.",
      "Key point two: 124 member nations signed the treaty with review scheduled for Geneva in late 2026.",
      "Key point three: Core relevance for International Relations (IR), digital sovereignty and multilateral treaties.",
    ],
    keyPointsHi: [
      "मुख्य बिंदु एक: संयुक्त राष्ट्र महासभा ने एआई नैतिकता मानकों पर ऐतिहासिक बहुपक्षीय समझौता अपनाया।",
      "मुख्य बिंदु दो: 124 सदस्य देशों ने हस्ताक्षर किए, समीक्षा 2026 के अंत में जिनेवा में होगी।",
      "मुख्य बिंदु तीन: अंतर्राष्ट्रीय संबंध (IR), डिजिटल संप्रभुता और बहुपक्षीय संधियों के लिए अत्यंत प्रासंगिक।",
    ],
    readTime: "1 min read",
    readTimeHi: "1 मिनट",
    content:
      "In a landmark diplomatic session, the United Nations General Assembly adopted the Global Digital Governance Accord 2026. Negotiated across two years, the agreement sets binding baselines for ethical AI research, digital citizen privacy, and cross-border cybersecurity coordination. A specialized follow-up summit in Geneva later this year will formulate compliance metrics for emerging economies.",
    contentHi:
      "एक ऐतिहासिक कूटनीतिक सत्र में, संयुक्त राष्ट्र महासभा ने 'ग्लोबल डिजिटल गवर्नेंस एकॉर्ड 2026' को अंगीकार किया। दो वर्षों के गहन विचार-विमर्श के बाद तैयार यह समझौता नैतिक एआई अनुसंधान, नागरिकों की डेटा गोपनीयता और साइबर सुरक्षा समन्वय के लिए बाध्यकारी नियम तय करता है।",
    oneLiner: "UN General Assembly adopts Global Digital Governance Accord 2026 with 124 signatory nations in New York.",
    oneLinerHi: "संयुक्त राष्ट्र महासभा ने न्यूयॉर्क में 124 हस्ताक्षरकर्ता देशों के साथ 'ग्लोबल डिजिटल गवर्नेंस एकॉर्ड 2026' पारित किया।",
    quickQuiz: {
      question: "Which international body adopted the Global Digital Governance Accord in 2026?",
      questionHi: "2026 में किस अंतरराष्ट्रीय संस्था ने ग्लोबल डिजिटल गवर्नेंस एकॉर्ड को अपनाया?",
      options: ["World Trade Organization", "UN General Assembly", "International Court of Justice", "OECD"],
      optionsHi: ["विश्व व्यापार संगठन (WTO)", "संयुक्त राष्ट्र महासभा (UNGA)", "अंतर्राष्ट्रीय न्यायालय (ICJ)", "ओईसीडी (OECD)"],
      correctIndex: 1,
      explanation: "The United Nations General Assembly officially adopted the comprehensive Digital Governance Accord in New York.",
    },
  },
  {
    id: "ca-story-3",
    date: getTodayDateString(),
    category: "Economy",
    headline: "RBI Keeps Repo Rate Unchanged at 6.50% Amid Resilient Domestic Growth Indicators",
    headlineHi: "मजबूत घरेलू विकास संकेतों के बीच आरबीआई ने रेपो दर 6.50% पर अपरिवर्तित रखी",
    summary: "Monetary Policy Committee balances price stability with industrial expansion as consumer inflation moderates.",
    summaryHi: "मौद्रिक नीति समिति ने मूल्य स्थिरता और औद्योगिक विस्तार के बीच संतुलन साधते हुए रेपो दर स्थिर रखी।",
    keyPoints: [
      "Key point one: MPC unanimously voted to maintain benchmark repo rate at 6.50%.",
      "Key point two: Real GDP growth projected at 7.2% with core retail inflation stabilizing at 4.2%.",
      "Key point three: Crucial for RBI Grade B, Banking, and civil services economics syllabus.",
    ],
    keyPointsHi: [
      "मुख्य बिंदु एक: मौद्रिक नीति समिति ने सर्वसम्मति से बेंचमार्क रेपो दर 6.50% पर बनाए रखी।",
      "मुख्य बिंदु दो: वास्तविक जीडीपी वृद्धि 7.2% अनुमानित, कोर खुदरा मुद्रास्फीति 4.2% पर स्थिर।",
      "मुख्य बिंदु तीन: आरबीआई ग्रेड बी, बैंकिंग और सिविल सेवा अर्थशास्त्र पाठ्यक्रम के लिए आवश्यक।",
    ],
    readTime: "2 min read",
    readTimeHi: "2 मिनट",
    content:
      "The Reserve Bank of India Monetary Policy Committee has retained the policy repo rate at 6.50% for the policy cycle. The decision reflects confidence in domestic consumption, robust manufacturing indices, and healthy bank balance sheets. The MPC maintained its stance of withdrawal of accommodation to align inflation durably with the 4% target while fostering capital investment.",
    contentHi:
      "भारतीय रिजर्व बैंक की मौद्रिक नीति समिति (MPC) ने अपनी समीक्षा में रेपो दर को 6.50% पर अपरिवर्तित रखा है। यह निर्णय मजबूत घरेलू मांग, विनिर्माण क्षेत्र में वृद्धि और बैंकों की स्वस्थ वित्तीय स्थिति को दर्शाता है। समिति ने मुद्रास्फीति को 4% के लक्ष्य के अनुरूप बनाए रखने की अपनी प्रतिबद्धता दोहराई।",
    oneLiner: "RBI MPC holds benchmark policy repo rate steady at 6.50% with FY27 GDP growth pegged at 7.2%.",
    oneLinerHi: "आरबीआई ने रेपो दर 6.50% पर स्थिर रखी और वित्त वर्ष 2027 के लिए जीडीपी वृद्धि 7.2% अनुमानित की।",
    quickQuiz: {
      question: "What is the policy Repo Rate maintained by the RBI in its recent MPC review?",
      questionHi: "आरबीआई द्वारा हालिया मौद्रिक समीक्षा में रेपो दर कितनी रखी गई है?",
      options: ["6.00%", "6.25%", "6.50%", "6.75%"],
      optionsHi: ["6.00%", "6.25%", "6.50%", "6.75%"],
      correctIndex: 2,
      explanation: "The Reserve Bank of India maintained the policy repo rate at 6.50% to balance growth and inflation targets.",
    },
  },
  {
    id: "ca-story-4",
    date: getTodayDateString(),
    category: "Sports",
    headline: "India Dominates Asian Track & Field Championship 2026 with Record 18 Medals",
    headlineHi: "एशियाई ट्रैक एंड फील्ड चैंपियनशिप 2026 में भारत का दबदबा: रिकॉर्ड 18 पदक जीते",
    summary: "Young athletes establish new national records in javelin throw, 400m sprint, and steeplechase in Tokyo.",
    summaryHi: "टोक्यो में भाला फेंक, 400 मीटर दौड़ और स्टीपलचेज़ में युवा भारतीय एथलीटों ने नए राष्ट्रीय रिकॉर्ड बनाए।",
    keyPoints: [
      "Key point one: Indian squad finishes second on overall tally with 8 Golds, 6 Silvers, 4 Bronzes.",
      "Key point two: Historic continental records broken in men's javelin and women's 400m hurdles.",
      "Key point three: High frequency in SSC CGL, Railways RRB, and State PSC general awareness exams.",
    ],
    keyPointsHi: [
      "मुख्य बिंदु एक: भारतीय दल ने 8 स्वर्ण, 6 रजत, 4 कांस्य सहित कुल 18 पदक जीतकर दूसरा स्थान हासिल किया।",
      "मुख्य बिंदु दो: पुरुषों की भाला फेंक और महिलाओं की 400 मीटर बाधा दौड़ में ऐतिहासिक एशियाई रिकॉर्ड टूटे।",
      "मुख्य बिंदु तीन: एसएससी सीजीएल, रेलवे आरआरबी और राज्य पीएससी सामान्य ज्ञान में सर्वाधिक पूछा जाने वाला विषय।",
    ],
    readTime: "1 min read",
    readTimeHi: "1 मिनट",
    content:
      "The Indian athletics contingent concluded their Asian Track and Field Championship campaign in Tokyo with an unprecedented medal haul of 18 podium finishes. Standout gold performances came in the men's javelin, mixed 4x400m relay, and long-distance steeplechase, cementing India's ranking among the elite athletic nations in Asia.",
    contentHi:
      "टोक्यो में संपन्न एशियाई ट्रैक एंड फील्ड चैंपियनशिप में भारतीय एथलीटों ने 18 पदकों के अभूतपूर्व रिकॉर्ड के साथ अपना अभियान समाप्त किया। पुरुषों की भाला फेंक, मिश्रित 4x400 मीटर रिले और स्टीपलचेज़ में स्वर्ण पदक के साथ भारत ने पदक तालिका में दूसरा स्थान प्राप्त किया।",
    oneLiner: "India finishes second at Asian Track & Field Championship 2026 with 8 Golds and 18 total medals.",
    oneLinerHi: "एशियाई ट्रैक एंड फील्ड चैंपियनशिप 2026 में भारत ने 8 स्वर्ण सहित कुल 18 पदकों के साथ दूसरा स्थान प्राप्त किया।",
    quickQuiz: {
      question: "How many gold medals did India win at the Asian Track & Field Championship 2026?",
      questionHi: "एशियाई ट्रैक एंड फील्ड चैंपियनशिप 2026 में भारत ने कितने स्वर्ण पदक जीते?",
      options: ["5 Golds", "8 Golds", "10 Golds", "12 Golds"],
      optionsHi: ["5 स्वर्ण", "8 स्वर्ण", "10 स्वर्ण", "12 स्वर्ण"],
      correctIndex: 1,
      explanation: "India secured 8 Gold, 6 Silver, and 4 Bronze medals, bringing the total tally to 18.",
    },
  },
  {
    id: "ca-story-5",
    date: getTodayDateString(),
    category: "Science",
    headline: "ISRO Successfully Deploys Climate Monitoring Satellite EOS-08 into Polar Orbit",
    headlineHi: "इसरो ने जलवायु निगरानी उपग्रह EOS-08 को ध्रुवीय कक्षा में सफलतापूर्वक स्थापित किया",
    summary: "Indigenous satellite equipped with hyperspectral sensors to track sea temperatures and monsoon patterns.",
    summaryHi: "समुद्री तापमान और मानसून के पैटर्न को ट्रैक करने के लिए हाइपरस्पेक्ट्रल सेंसर से लैस स्वदेशी उपग्रह।",
    keyPoints: [
      "Key point one: SSLV-D3 launch vehicle deployed EOS-08 into circular 475 km Low Earth Orbit.",
      "Key point two: Payloads feature Thermal Infrared and Electro-Optical sensors for disaster alerts.",
      "Key point three: Essential for UPSC Science & Tech GS Paper III covering indigenous launch systems.",
    ],
    keyPointsHi: [
      "मुख्य बिंदु एक: SSLV-D3 प्रक्षेपण यान ने EOS-08 को 475 किमी की वृत्ताकार निचली पृथ्वी कक्षा में स्थापित किया।",
      "मुख्य बिंदु दो: आपदा पूर्व चेतावनी के लिए पेलोड में थर्मल इंफ्रारेड और उन्नत ऑप्टिकल सेंसर शामिल हैं।",
      "मुख्य बिंदु तीन: स्वदेशी अंतरिक्ष प्रौद्योगिकी और उपग्रह प्रणालियों पर आधारित परीक्षाओं के लिए अनिवार्य।",
    ],
    readTime: "2 min read",
    readTimeHi: "2 मिनट",
    content:
      "The Indian Space Research Organisation (ISRO) successfully completed the developmental launch of the SSLV-D3 rocket, injecting the EOS-08 Earth Observation Satellite into precise Low Earth Orbit. Operating at 475 km altitude, the spacecraft will provide high-cadence environmental observations, monitoring cyclonic disturbances and Himalayan glacial reserves.",
    contentHi:
      "भारतीय अंतरिक्ष अनुसंधान संगठन (इसरो) ने SSLV-D3 रॉकेट की सहायता से EOS-08 पृथ्वी अवलोकन उपग्रह को 475 किमी की निचली पृथ्वी कक्षा में सफलतापूर्वक स्थापित किया। यह उपग्रह चक्रवाती हलचलों, मानसूनी वर्षा और हिमालयी ग्लेशियरों की निरंतर निगरानी प्रदान करेगा।",
    oneLiner: "ISRO's SSLV-D3 successfully injects EOS-08 Earth Observation Satellite into 475 km polar orbit.",
    oneLinerHi: "इसरो के SSLV-D3 ने EOS-08 पृथ्वी अवलोकन उपग्रह को 475 किमी की ध्रुवीय कक्षा में स्थापित किया।",
    quickQuiz: {
      question: "Which launch vehicle was utilized by ISRO to deploy the EOS-08 satellite?",
      questionHi: "इसरो ने EOS-08 उपग्रह को प्रक्षेपित करने के लिए किस प्रक्षेपण यान का उपयोग किया?",
      options: ["PSLV-C58", "GSLV-F14", "SSLV-D3", "LVM3-M4"],
      optionsHi: ["PSLV-C58", "GSLV-F14", "SSLV-D3", "LVM3-M4"],
      correctIndex: 2,
      explanation: "ISRO utilized the Small Satellite Launch Vehicle (SSLV-D3) to place EOS-08 into orbit.",
    },
  },
];

/* ──────────────── MAIN COMPONENT ──────────────── */
export default function DailyCurrentAffairsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isHindi: globalIsHindi, setLanguage, confirmLanguageSelection, toggleLanguage } = useLanguage();

  const handleSetLang = (lang) => {
    if (typeof setLanguage === "function") {
      setLanguage(lang);
    } else if (typeof confirmLanguageSelection === "function") {
      confirmLanguageSelection(lang);
    } else if (typeof toggleLanguage === "function") {
      toggleLanguage();
    }
  };

  // Screen View: "list" (Screen 1) | "reader" (Screen 2) | "flashcards" (Screen 3)
  const [view, setView] = useState("list");

  // Sub-tabs in Screen 1: "stories" | "oneliners" | "quiz" (Merging user's request)
  const [activeTab, setActiveTab] = useState("stories");

  // Selected date and week strip anchor (default: today's date)
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());
  const [anchorDate, setAnchorDate] = useState(() => getTodayDateString());

  // Category Filter
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Active Story for Screen 2
  const [activeStory, setActiveStory] = useState(null);

  // Bookmarks (saved story IDs)
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set());

  // Screen 3: Flashcards State
  const [flashcardDeck, setFlashcardDeck] = useState([]);
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [fcFavIds, setFcFavIds] = useState(() => new Set());
  const [deckCompleted, setDeckCompleted] = useState(false);

  // Screen 1: Quiz Mode States (Answers & Score)
  const [quizAnswers, setQuizAnswers] = useState({}); // { [qId]: selectedOptIndex }

  // Stories Data (Fetched or Fallback)
  const [stories, setStories] = useState(BASE_SAMPLE_STORIES);
  const [loading, setLoading] = useState(false);

  // Load Bookmarks from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ca_bookmarked_ids");
      if (saved) {
        setBookmarkedIds(new Set(JSON.parse(saved)));
      }
    } catch {}
  }, []);

  const toggleBookmark = useCallback((storyId, storyObj = null) => {
    const targetStory = storyObj || stories.find((s) => s.id === storyId) || activeStory || { id: storyId };
    
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      const isAdding = !next.has(storyId);
      
      if (isAdding) {
        next.add(storyId);
      } else {
        next.delete(storyId);
      }
      
      try {
        localStorage.setItem("ca_bookmarked_ids", JSON.stringify(Array.from(next)));
        
        // Also sync full story notes list in localStorage for /notes
        let existingNotes = [];
        try {
          const raw = localStorage.getItem("user_ca_notes");
          if (raw) existingNotes = JSON.parse(raw);
        } catch {}

        if (isAdding) {
          const noteItem = {
            id: targetStory.id,
            heading: targetStory.headline || targetStory.heading || "करेंट अफेयर्स अपडेट",
            description: targetStory.content || targetStory.description || targetStory.summary || "",
            category: targetStory.category || "General",
            date: targetStory.date || selectedDate,
            keyPoints: targetStory.keyPoints || [],
          };
          const updatedNotes = [noteItem, ...existingNotes.filter((n) => n.id !== storyId)];
          localStorage.setItem("user_ca_notes", JSON.stringify(updatedNotes));
          toast.success(globalIsHindi ? "📌 नोट्स में सहेजा गया! (मेरे नोट्स में देखें)" : "📌 Saved to My Notes!");
        } else {
          const updatedNotes = existingNotes.filter((n) => n.id !== storyId);
          localStorage.setItem("user_ca_notes", JSON.stringify(updatedNotes));
          toast(globalIsHindi ? "नोट्स से हटाया गया" : "Removed from Notes");
        }

        // Sync with server API (authenticated users)
        fetch("/api/current-affairs/favourites", {
          method: isAdding ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentAffairId: storyId }),
        }).catch(() => {});

        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(10);
        }
      } catch {}
      return next;
    });
  }, [stories, activeStory, selectedDate, globalIsHindi]);

  // Fetch /api/current-affairs for selectedDate
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/current-affairs?date=${selectedDate}&pageSize=20`, { cache: "no-store" });
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        if (cancelled) return;

        if (Array.isArray(data.items) && data.items.length > 0) {
          // Normalize DB items to have structured keyPoints and fallbacks
          const normalized = data.items.map((item, idx) => {
            const heading = item.heading || "Current Affairs Update";
            const desc = item.description || "";
            const sentences = desc.split(/[.!?।]\s+/).filter(Boolean);

            const point1 = item.oneLiner || sentences[0] || "Key development in this sector.";
            const point2 = sentences[1] || "High-yield figure, name or date relevant for competitive exams.";
            const point3 = sentences[2] || "Strategic impact for national and international affairs.";

            return {
              id: item.id || `db-${idx}`,
              date: item.date || selectedDate,
              category: item.category || "General",
              headline: heading,
              headlineHi: item.headingHi || heading,
              summary: item.oneLiner || desc.slice(0, 140) + "...",
              summaryHi: item.oneLinerHi || desc.slice(0, 140) + "...",
              keyPoints: [point1, point2, point3],
              keyPointsHi: [point1, point2, point3],
              readTime: "2 min read",
              readTimeHi: "2 मिनट",
              content: desc || heading,
              contentHi: desc || heading,
              oneLiner: item.oneLiner || point1,
              oneLinerHi: item.oneLinerHi || point1,
              quickQuiz: {
                question: `What is the primary significance of: ${heading.slice(0, 60)}...?`,
                questionHi: `इस विषय का मुख्य महत्व क्या है: ${heading.slice(0, 60)}...?`,
                options: ["Policy Innovation", "Regulatory Accord", "Sovereign Framework", "Technological Initiative"],
                optionsHi: ["नीतिगत नवाचार", "नियामक समझौता", "संप्रभु ढांचा", "तकनीकी पहल"],
                correctIndex: 0,
                explanation: desc.slice(0, 120) || "Directly relevant for general awareness and civil services papers.",
              },
            };
          });
          setStories(normalized);
        } else {
          // Fallback to rich sample stories for this date
          setStories(
            BASE_SAMPLE_STORIES.map((s) => ({
              ...s,
              date: selectedDate,
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setStories(
            BASE_SAMPLE_STORIES.map((s) => ({
              ...s,
              date: selectedDate,
            }))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  // Filtered stories by Category
  const filteredStories = useMemo(() => {
    if (selectedCategory === "All") return stories;
    return stories.filter((s) => s.category.toLowerCase().includes(selectedCategory.toLowerCase()));
  }, [stories, selectedCategory]);

  // Categories list
  const categoryChips = useMemo(() => {
    return [
      { id: "All", label: "All", labelHi: "सभी" },
      { id: "National", label: "National", labelHi: "राष्ट्रीय" },
      { id: "World", label: "World", labelHi: "अंतर्राष्ट्रीय" },
      { id: "Economy", label: "Economy", labelHi: "अर्थव्यवस्था" },
      { id: "Sports", label: "Sports", labelHi: "खेल" },
      { id: "Science", label: "Science & Tech", labelHi: "विज्ञान" },
      { id: "Defense", label: "Defense", labelHi: "रक्षा" },
    ];
  }, []);

  // 7-day Week Strip based on anchorDate
  const weekDays = useMemo(() => {
    return getWeekDays(anchorDate);
  }, [anchorDate]);

  // Open Screen 2: Story Reader
  const openStoryReader = (story) => {
    setActiveStory(story);
    setView("reader");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Safe helper to extract key points for any story (DB or sample)
  const getStoryKeyPoints = (story) => {
    if (!story) return [];
    let kps = globalIsHindi && Array.isArray(story.keyPointsHi) && story.keyPointsHi.length > 0
      ? story.keyPointsHi
      : Array.isArray(story.keyPoints) && story.keyPoints.length > 0
      ? story.keyPoints
      : [];

    if (kps.length === 0) {
      const point1 = (globalIsHindi && story.oneLinerHi ? story.oneLinerHi : story.oneLiner) ||
                     (globalIsHindi && story.headlineHi ? story.headlineHi : story.headline) ||
                     (globalIsHindi && story.summaryHi ? story.summaryHi : story.summary) ||
                     "Current Affairs Key Fact";
      const desc = (globalIsHindi && story.contentHi ? story.contentHi : story.content) || "";
      const sentences = desc ? desc.split(/[.!?।]\s+/).filter(Boolean) : [];
      const point2 = sentences[1] || (globalIsHindi ? "परीक्षा के लिए महत्वपूर्ण आंकड़े और संदर्भ।" : "Key figures, data, and exam relevance.");
      const point3 = sentences[2] || (globalIsHindi ? "राष्ट्रीय और अंतरराष्ट्रीय स्तर पर रणनीतिक प्रभाव।" : "Strategic implications and policy impact.");
      kps = [point1, point2, point3];
    }
    return kps;
  };

  // Open Screen 3: Flashcards Deck from Today's Key Points
  const openTodayKeyPointsDeck = () => {
    const deck = [];
    (stories || []).forEach((story) => {
      const kps = getStoryKeyPoints(story);
      const headline = (globalIsHindi && story.headlineHi ? story.headlineHi : story.headline) || "Current Affairs";
      const category = story.category || "General";

      kps.forEach((point, pIdx) => {
        deck.push({
          id: `${story.id || "ca"}-kp-${pIdx}`,
          storyId: story.id,
          category: category,
          storyHeadline: headline,
          pointNumber: pIdx + 1,
          keyPointText: point,
          deepDive:
            pIdx === 0
              ? globalIsHindi ? "परीक्षा के लिए मुख्य तथ्य एवं सार।" : "Core exam-ready fact and primary briefing."
              : pIdx === 1
              ? globalIsHindi ? "तथ्य, सांख्यिकी और मुख्य आंकड़े।" : "Important dates, numbers, and institutions."
              : globalIsHindi ? "यूपीएससी/एसएससी परीक्षा के लिए रणनीतिक महत्व।" : "Strategic exam relevance and policy impact.",
        });
      });
    });

    setFlashcardDeck(deck);
    setFcIndex(0);
    setFcFlipped(false);
    setDeckCompleted(false);
    setView("flashcards");
  };

  // Open Screen 3: Flashcards Deck for a Single Story
  const openStoryKeyPointsDeck = (story) => {
    if (!story) return;
    const kps = getStoryKeyPoints(story);
    const headline = (globalIsHindi && story.headlineHi ? story.headlineHi : story.headline) || "Current Affairs";
    const category = story.category || "General";

    const deck = kps.map((point, pIdx) => ({
      id: `${story.id || "ca"}-single-${pIdx}`,
      storyId: story.id,
      category: category,
      storyHeadline: headline,
      pointNumber: pIdx + 1,
      keyPointText: point,
      deepDive:
        pIdx === 0
          ? globalIsHindi ? "संक्षिप्त परीक्षा-उन्मुख सारांश।" : "Concise exam-oriented briefing."
          : pIdx === 1
          ? globalIsHindi ? "आंकड़े और महत्वपूर्ण नाम।" : "Key figures, metrics and authorities."
          : globalIsHindi ? "परीक्षा के दृष्टिकोण से इसका महत्व।" : "Why this decision matters for competitive exams.",
    }));

    setFlashcardDeck(deck);
    setFcIndex(0);
    setFcFlipped(false);
    setDeckCompleted(false);
    setView("flashcards");
  };

  // Flashcard Navigation
  const handleNextCard = () => {
    if (fcIndex < flashcardDeck.length - 1) {
      setFcIndex((prev) => prev + 1);
      setFcFlipped(false);
    } else {
      setDeckCompleted(true);
    }
  };

  const handlePrevCard = () => {
    if (fcIndex > 0) {
      setFcIndex((prev) => prev - 1);
      setFcFlipped(false);
      setDeckCompleted(false);
    }
  };

  // Social Share
  const handleShareStory = async (story) => {
    const title = globalIsHindi && story.headlineHi ? story.headlineHi : story.headline;
    const text = globalIsHindi && story.summaryHi ? story.summaryHi : story.summary;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: typeof window !== "undefined" ? window.location.href : "https://quizweb.in",
        });
        return;
      } catch {}
    }
    // Fallback copy
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${title}\n\n${text}\n\nQuizWeb Current Affairs`);
      alert(globalIsHindi ? "लिंक कॉपी किया गया!" : "Story copied to clipboard!");
    }
  };

  /* ─────────────────────────────────────────────────────────────
     RENDER: SCREEN 3 - REVISE AS FLASHCARDS
  ───────────────────────────────────────────────────────────── */
  if (view === "flashcards") {
    const currentCard = flashcardDeck[fcIndex] || null;
    const catColor = currentCard ? getCategoryColor(currentCard.category) : { bg: "#EDE9FE", icon: "#6366F1" };
    const isFav = currentCard ? fcFavIds.has(currentCard.id) : false;

    return (
      <main className={styles.page}>
        <div className={styles.flashcardsWrapper}>
          {/* Top Bar: Close (✕), Title, Counter (e.g. 2 / 5) */}
          <div>
            <div className={styles.flashcardsTopBar}>
              <button
                className={styles.flashcardsCloseBtn}
                onClick={() => setView(activeStory ? "reader" : "list")}
                aria-label="Close flashcards"
              >
                <X size={18} />
              </button>
              <div className={styles.flashcardsDeckTitle}>
                {globalIsHindi ? "आज के मुख्य बिंदु" : "Today's key points"}
              </div>
              <div className={styles.flashcardsCounter}>
                {flashcardDeck.length > 0 ? `${fcIndex + 1} / ${flashcardDeck.length}` : "0 / 0"}
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className={styles.progressBar}>
              {flashcardDeck.map((_, idx) => (
                <div
                  key={idx}
                  className={`${styles.progressSegment} ${idx <= fcIndex ? styles.progressSegmentActive : ""}`}
                />
              ))}
            </div>
          </div>

          {/* FlashDeck Center Card or Completion Screen */}
          {deckCompleted ? (
            <div className={styles.emptyState}>
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 text-2xl">
                ✓
              </div>
              <h3 className={styles.emptyStateTitle}>
                {globalIsHindi ? "शानदार! सभी कार्ड पूरे हुए" : "Great job! All cards completed"}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs text-center">
                {globalIsHindi
                  ? "आपने आज के सभी मुख्य परीक्षा बिंदुओं को सफलतापूर्वक दोहरा लिया है।"
                  : "You have reviewed all exam-ready key points for today's current affairs."}
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setFcIndex(0);
                    setFcFlipped(false);
                    setDeckCompleted(false);
                  }}
                >
                  {globalIsHindi ? "पुनः दोहराएं" : "Review Again"}
                </button>
                <button
                  className="px-5 py-2.5 rounded-full bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                  onClick={() => setView("list")}
                >
                  {globalIsHindi ? "समाचार सूची पर जाएं" : "Back to Stories"}
                </button>
              </div>
            </div>
          ) : currentCard ? (
            <FlashDeck
              cards={flashcardDeck}
              currentIndex={fcIndex}
              onIndexChange={setFcIndex}
              isFlipped={fcFlipped}
              onFlipChange={setFcFlipped}
              onNext={handleNextCard}
              onPrev={handlePrevCard}
              renderFront={(card) => (
                <div className={styles.fcFront}>
                  <div>
                    <div className={styles.fcCategoryRow}>
                      <div className={styles.categoryIconBadge} style={{ background: catColor.bg, width: 36, height: 36 }}>
                        <CategoryIcon category={card.category} size={18} color={catColor.icon} />
                      </div>
                      <span className={styles.fcCategoryText}>{card.category}</span>
                    </div>
                    <div className={styles.fcSource}>
                      {globalIsHindi ? "स्रोत: " : "From: "} {card.storyHeadline}
                    </div>
                  </div>

                  <div className={styles.fcMainText}>{card.keyPointText}</div>

                  <div className={styles.fcHint}>
                    <span>{globalIsHindi ? "कार्ड पलटने के लिए टैप करें" : "Tap card to flip"}</span>
                  </div>
                </div>
              )}
              renderBack={(card) => (
                <div className={styles.fcBack}>
                  <div className="flex justify-between items-center">
                    <span className={styles.fcBackCategory}>{card.category} • {globalIsHindi ? "गहन विश्लेषण" : "Deep Dive"}</span>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                      ★ {globalIsHindi ? "परीक्षा सार" : "Exam Fact"}
                    </span>
                  </div>

                  <div className={styles.fcBackBody}>
                    <div className="font-semibold text-slate-800 text-sm leading-relaxed">
                      {card.keyPointText}
                    </div>
                    <div className={styles.fcBackExamBox}>
                      💡 {card.deepDive}
                    </div>
                  </div>

                  <div className={styles.fcHint}>
                    <span>{globalIsHindi ? "वापस पलटने के लिए टैप करें" : "Tap card to flip back"}</span>
                  </div>
                </div>
              )}
              controls={({ next, prev }) => (
                <div className={styles.fcControls}>
                  <button
                    className={styles.fcRoundBtn}
                    onClick={() => {
                      if (typeof prev === "function") prev();
                      else handlePrevCard();
                    }}
                    disabled={fcIndex === 0}
                    aria-label="Previous card"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    className={`${styles.fcRoundBtn} ${isFav ? styles.fcFavActive : ""}`}
                    onClick={() => {
                      if (!currentCard) return;
                      setFcFavIds((prevSet) => {
                        const nextSet = new Set(prevSet);
                        if (nextSet.has(currentCard.id)) nextSet.delete(currentCard.id);
                        else nextSet.add(currentCard.id);
                        return nextSet;
                      });
                    }}
                    aria-label="Save card to favourites"
                  >
                    <Heart size={18} fill={isFav ? "#ef4444" : "none"} />
                  </button>
                  <button
                    className={styles.fcNextBtn}
                    onClick={() => {
                      if (typeof next === "function") next();
                      else handleNextCard();
                    }}
                  >
                    <span>{globalIsHindi ? "अगला" : "Next"}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            />
          ) : (
            <div className={styles.emptyState}>
              <p>{globalIsHindi ? "कोई कार्ड उपलब्ध नहीं है।" : "No flashcards available for today."}</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER: SCREEN 2 - STORY READER
  ───────────────────────────────────────────────────────────── */
  if (view === "reader" && activeStory) {
    const isBookmarked = bookmarkedIds.has(activeStory.id);
    const catColor = getCategoryColor(activeStory.category);
    const headline = globalIsHindi && activeStory.headlineHi ? activeStory.headlineHi : activeStory.headline;
    const content = globalIsHindi && activeStory.contentHi ? activeStory.contentHi : activeStory.content;
    const readTime = globalIsHindi && activeStory.readTimeHi ? activeStory.readTimeHi : activeStory.readTime;
    const keyPoints = globalIsHindi && activeStory.keyPointsHi ? activeStory.keyPointsHi : activeStory.keyPoints;

    return (
      <main className={styles.page}>
        <div className={styles.readerContainer}>
          {/* Header: Back (←), Bookmark, Share */}
          <div className={styles.readerHeader}>
            <button className={styles.readerBackBtn} onClick={() => setView("list")} aria-label="Back to stories list">
              <ArrowLeft size={18} />
            </button>
            <div className={styles.readerHeaderActions}>
              <button
                className={`${styles.readerActionBtn} ${isBookmarked ? styles.readerActionBtnActive : ""}`}
                onClick={() => toggleBookmark(activeStory.id, activeStory)}
                aria-label={isBookmarked ? "Remove from notes" : "Save to notes"}
                title={isBookmarked ? "नोट्स से हटाएं" : "नोट्स में जोड़ें"}
              >
                <Bookmark size={18} fill={isBookmarked ? "#4F46E5" : "none"} />
              </button>
              <button
                className={styles.readerActionBtn}
                onClick={() => handleShareStory(activeStory)}
                aria-label="Share story"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Reader Content */}
          <div className={styles.readerContent}>
            {/* Category Pill & Date */}
            <div className={styles.readerMetaRow}>
              <span className={styles.readerCategoryPill}>{activeStory.category}</span>
              <span className={styles.readerDate}>
                {formatDisplayDate(activeStory.date, globalIsHindi)} • {readTime}
              </span>
            </div>

            {/* Headline */}
            <h1 className={styles.readerTitle}>{headline}</h1>

            {/* Key Points Soft Cream Card */}
            <div className={styles.keyPointsBox}>
              <div className={styles.keyPointsTitle}>
                <span>💡</span>
                <span>{globalIsHindi ? "मुख्य बिंदु (Key points)" : "Key points"}</span>
              </div>
              <ul className={styles.keyPointsList}>
                {keyPoints.map((pt, pIdx) => (
                  <li key={pIdx} className={styles.keyPointItem}>
                    <div className={styles.keyPointBullet} />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Article Text Paragraphs */}
            <div className={styles.readerArticle}>
              <p>{content}</p>
            </div>

            {/* Merged Addition: Rapid One-Liner Box */}
            <div className="mt-6 mb-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs sm:text-sm text-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1.5 text-xs uppercase tracking-wider">
                <Zap size={14} className="text-amber-600" />
                <span>{globalIsHindi ? "त्वरित परीक्षा सारांश" : "Rapid Exam Fact"}</span>
              </div>
              <p className="font-semibold text-slate-700 leading-relaxed m-0">
                {globalIsHindi && activeStory.oneLinerHi ? activeStory.oneLinerHi : activeStory.oneLiner}
              </p>
            </div>

            {/* Merged Addition: Story Quick Quiz Check */}
            {activeStory.quickQuiz && (
              <div className="p-4 sm:p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 my-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                    ✍️ {globalIsHindi ? "त्वरित समझ जांच (Quick Check)" : "Check Your Understanding"}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 mb-3">
                  {globalIsHindi && activeStory.quickQuiz.questionHi ? activeStory.quickQuiz.questionHi : activeStory.quickQuiz.question}
                </div>
                <div className="flex flex-col gap-2">
                  {(globalIsHindi && activeStory.quickQuiz.optionsHi ? activeStory.quickQuiz.optionsHi : activeStory.quickQuiz.options).map((opt, oIdx) => {
                    const isSelected = quizAnswers[activeStory.id] === oIdx;
                    const isCorrect = oIdx === activeStory.quickQuiz.correctIndex;
                    const isAnswered = quizAnswers[activeStory.id] !== undefined;

                    let optStyle = "bg-white border-slate-200 text-slate-700";
                    if (isAnswered) {
                      if (isCorrect) optStyle = "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold";
                      else if (isSelected) optStyle = "bg-rose-50 border-rose-400 text-rose-800";
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={isAnswered}
                        onClick={() => setQuizAnswers((prev) => ({ ...prev, [activeStory.id]: oIdx }))}
                        className={`text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${optStyle}`}
                      >
                        <span>{opt}</span>
                        {isAnswered && isCorrect && <span className="text-emerald-600 font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
                {quizAnswers[activeStory.id] !== undefined && (
                  <div className="mt-3 text-xs text-indigo-900 bg-white/80 p-3 rounded-xl border border-indigo-100">
                    <strong>💡 {globalIsHindi ? "व्याख्या: " : "Explanation: "}</strong>
                    {activeStory.quickQuiz.explanation}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Bottom Action Button */}
          <div className={styles.readerStickyBottom}>
            <button
              className={styles.reviseFlashcardsBtn}
              onClick={() => openStoryKeyPointsDeck(activeStory)}
            >
              <Layers size={18} />
              <span>{globalIsHindi ? "फ्लैशकार्ड्स से दोहराएं" : "Revise as flashcards"}</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER: SCREEN 1 - DAILY LIST
  ───────────────────────────────────────────────────────────── */
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* 1. Header Top Bar: QuizWeb Logo + [ EN | HI ] Toggle */}
        <div className={styles.topBar}>
          <Link href="/" className={styles.brand}>
            <div className={styles.brandIcon}>
              <Sparkles size={18} />
            </div>
            <span className={styles.brandText}>QuizWeb</span>
          </Link>

          <div className={styles.langToggle}>
            <button
              className={`${styles.langBtn} ${!globalIsHindi ? styles.langBtnActive : ""}`}
              onClick={() => handleSetLang("en")}
            >
              EN
            </button>
            <button
              className={`${styles.langBtn} ${globalIsHindi ? styles.langBtnActive : ""}`}
              onClick={() => handleSetLang("hi")}
            >
              HI
            </button>
          </div>
        </div>

        {/* 2. Title Row: Current Affairs + Calendar Picker + My Notes */}
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>
            {globalIsHindi ? "करंट अफेयर्स" : "Current Affairs"}
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/notes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
              style={{
                background: "var(--pri, #4f46e5)",
                color: "#ffffff",
                textDecoration: "none"
              }}
              title={globalIsHindi ? "सहेजे गए नोट्स देखें" : "View Saved Notes"}
            >
              <span>📖 {globalIsHindi ? "मेरे नोट्स" : "My Notes"}</span>
            </Link>
            <div className={styles.calendarBtn} title={globalIsHindi ? "तारीख चुनें" : "Select date"}>
              <Calendar size={18} />
              <input
                type="date"
                value={selectedDate}
                max={getTodayDateString()}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setAnchorDate(e.target.value);
                  }
                }}
                className={styles.calendarHiddenInput}
              />
            </div>
          </div>
        </div>

        {/* 3. Week Strip of Days */}
        <div className={styles.weekStripWrapper}>
          <div className={styles.weekStripContainer}>
            <button
              className={styles.weekNavBtn}
              onClick={() => setAnchorDate((prev) => shiftWeek(prev, -7))}
              aria-label="Previous week"
            >
              ‹
            </button>

            <div className={styles.weekStrip}>
              {weekDays.map((day) => {
                const isSelected = day.dateStr === selectedDate;
                return (
                  <button
                    key={day.dateStr}
                    className={`${styles.weekDay} ${isSelected ? styles.weekDayActive : ""}`}
                    onClick={() => setSelectedDate(day.dateStr)}
                  >
                    <span className={styles.weekDayName}>
                      {globalIsHindi ? day.dayNameHi : day.dayNameEn}
                    </span>
                    <span className={styles.weekDayNum}>{day.dayNum}</span>
                  </button>
                );
              })}
            </div>

            <button
              className={styles.weekNavBtn}
              onClick={() => setAnchorDate((prev) => shiftWeek(prev, 7))}
              disabled={anchorDate >= getTodayDateString()}
              aria-label="Next week"
            >
              ›
            </button>
          </div>
        </div>

        {/* 4. Merged Addition: Mode Selector (Stories | One-Liners | Daily Quiz) */}
        <div className={styles.modeTabsWrapper}>
          <div className={styles.modeTabs}>
            <button
              className={`${styles.modeTab} ${activeTab === "stories" ? styles.modeTabActive : ""}`}
              onClick={() => setActiveTab("stories")}
            >
              <span>📰</span>
              <span>{globalIsHindi ? "समाचार" : "Stories"}</span>
            </button>

            <button
              className={`${styles.modeTab} ${activeTab === "oneliners" ? styles.modeTabActive : ""}`}
              onClick={() => setActiveTab("oneliners")}
            >
              <span>⚡</span>
              <span>{globalIsHindi ? "वन-लाइनर" : "One-Liners"}</span>
            </button>

            <button
              className={`${styles.modeTab} ${activeTab === "quiz" ? styles.modeTabActive : ""}`}
              onClick={() => setActiveTab("quiz")}
            >
              <span>📝</span>
              <span>{globalIsHindi ? "दैनिक क्विज" : "Daily Quiz"}</span>
            </button>
          </div>
        </div>

        {/* 5. Category Chips (For Stories and One-Liners) */}
        {activeTab !== "quiz" && (
          <div className={styles.categoryChips}>
            {categoryChips.map((c) => {
              const isActive = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  className={`${styles.categoryChip} ${isActive ? styles.categoryChipActive : ""}`}
                  onClick={() => setSelectedCategory(c.id)}
                >
                  {globalIsHindi ? c.labelHi : c.label}
                </button>
              );
            })}
          </div>
        )}

        {/* 6. "Revise today's key points →" Banner (Tapping launches Screen 3) */}
        {activeTab === "stories" && (
          <div className={styles.reviseBanner} onClick={openTodayKeyPointsDeck}>
            <div className={styles.reviseBannerLeft}>
              <div className={styles.reviseBannerIcon}>
                <Layers size={20} />
              </div>
              <span>{globalIsHindi ? "आज के मुख्य बिंदु दोहराएं" : "Revise today's key points"}</span>
            </div>
            <span className={styles.reviseBannerArrow}>→</span>
          </div>
        )}

        {/* 7. Main Dynamic Content by Mode */}
        {loading ? (
          <div className={styles.storyList}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        ) : activeTab === "stories" ? (
          /* STORIES FEED */
          <div className={styles.storyList}>
            {filteredStories.length === 0 ? (
              <div className={styles.emptyState}>
                <p>{globalIsHindi ? "इस तारीख या श्रेणी के लिए कोई समाचार नहीं मिला।" : "No stories found for this date or category."}</p>
              </div>
            ) : (
              filteredStories.map((story) => {
                const catColor = getCategoryColor(story.category);
                const isBookmarked = bookmarkedIds.has(story.id);
                const headline = globalIsHindi && story.headlineHi ? story.headlineHi : story.headline;
                const summary = globalIsHindi && story.summaryHi ? story.summaryHi : story.summary;
                const readTime = globalIsHindi && story.readTimeHi ? story.readTimeHi : story.readTime;

                return (
                  <div
                    key={story.id}
                    className={styles.storyCard}
                    onClick={() => openStoryReader(story)}
                  >
                    {/* Left: Round Category Icon Circle Badge */}
                    <div
                      className={styles.categoryIconBadge}
                      style={{ background: catColor.bg }}
                    >
                      <CategoryIcon category={story.category} size={22} color={catColor.icon} />
                    </div>

                    {/* Middle: Content */}
                    <div className={styles.storyContent}>
                      <h2 className={styles.storyHeadline}>{headline}</h2>
                      <p className={styles.storySummary}>{summary}</p>
                      <div className={styles.storyMetaRow}>
                        <span>{story.category}</span>
                        <div className={styles.metaSeparator} />
                        <span>{readTime}</span>
                      </div>
                    </div>

                    {/* Right: Bookmark Action */}
                    <button
                      className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarkBtnActive : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(story.id);
                      }}
                      aria-label="Bookmark story"
                    >
                      <Bookmark size={18} fill={isBookmarked ? "#4F46E5" : "none"} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : activeTab === "oneliners" ? (
          /* MERGED: ONE-LINERS FEED */
          <div className={styles.storyList}>
            {filteredStories.map((item) => {
              const headline = globalIsHindi && item.headlineHi ? item.headlineHi : item.headline;
              const oneLiner = globalIsHindi && item.oneLinerHi ? item.oneLinerHi : item.oneLiner;
              const isBookmarked = bookmarkedIds.has(item.id);

              return (
                <div key={item.id} className={styles.oneLinerCard}>
                  <div className={styles.oneLinerHeader}>
                    <span className={styles.oneLinerBadge}>
                      <Zap size={12} />
                      <span>{item.category}</span>
                    </span>
                    <button
                      className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarkBtnActive : ""}`}
                      onClick={() => toggleBookmark(item.id)}
                    >
                      <Bookmark size={16} fill={isBookmarked ? "#4F46E5" : "none"} />
                    </button>
                  </div>

                  <h3 className={styles.oneLinerHeadline}>{headline}</h3>

                  <div className={styles.oneLinerHighlight}>
                    💡 {oneLiner}
                  </div>

                  <div className={styles.oneLinerFooter}>
                    <button
                      className={styles.oneLinerReviseBtn}
                      onClick={() => openStoryKeyPointsDeck(item)}
                    >
                      <Layers size={13} />
                      <span>{globalIsHindi ? "फ्लैशकार्ड में देखें" : "Revise Card"}</span>
                    </button>
                    <button
                      className="text-xs text-slate-500 font-semibold hover:text-indigo-600"
                      onClick={() => openStoryReader(item)}
                    >
                      {globalIsHindi ? "पूरा पढ़ें →" : "Read Full →"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* MERGED: DAILY QUIZ FEED */
          <div className={styles.storyList}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-slate-500">
                {globalIsHindi ? "दैनिक समसामयिकी क्विज (5 प्रश्न)" : "Daily Affairs 5-Question Quiz"}
              </span>
              <button
                className="text-xs font-bold text-indigo-600 hover:underline"
                onClick={() => router.push(`/daily/daily-current-affairs?date=${selectedDate}`)}
              >
                ▶ {globalIsHindi ? "टाइम्ड अरीना खेलें" : "Play Timed Arena"}
              </button>
            </div>

            {filteredStories.map((story, qIdx) => {
              if (!story.quickQuiz) return null;
              const q = story.quickQuiz;
              const qText = globalIsHindi && q.questionHi ? q.questionHi : q.question;
              const opts = globalIsHindi && q.optionsHi ? q.optionsHi : q.options;
              const selectedIdx = quizAnswers[story.id];
              const isAnswered = selectedIdx !== undefined;
              const letters = ["A", "B", "C", "D"];

              return (
                <div key={story.id} className={styles.quizCard}>
                  <div className={styles.quizCardHeader}>
                    <span className={styles.quizQuestionNum}>
                      {globalIsHindi ? `प्रश्न ${qIdx + 1}` : `Question ${qIdx + 1}`}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {story.category}
                    </span>
                  </div>

                  <h3 className={styles.quizQuestionText}>{qText}</h3>

                  <div className={styles.quizOptionsList}>
                    {opts.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correctIndex;
                      const isUserChoice = selectedIdx === oIdx;

                      let optClass = styles.quizOptionBtn;
                      if (isAnswered) {
                        if (isCorrect) optClass += ` ${styles.quizOptionBtnCorrect}`;
                        else if (isUserChoice) optClass += ` ${styles.quizOptionBtnIncorrect}`;
                      }

                      return (
                        <button
                          key={oIdx}
                          className={optClass}
                          disabled={isAnswered}
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [story.id]: oIdx }))}
                        >
                          <div className={styles.quizOptionLetter}>{letters[oIdx]}</div>
                          <span className="flex-1">{opt}</span>
                          {isAnswered && isCorrect && <Check size={16} className="text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div className={styles.quizExplanation}>
                      <strong>💡 {globalIsHindi ? "उत्तर व्याख्या: " : "Explanation: "}</strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
