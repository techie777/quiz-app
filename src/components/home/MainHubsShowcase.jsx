"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Briefcase,
  Compass,
  ShieldCheck,
  Newspaper,
  Crown,
  Coins,
  Trophy,
  GraduationCap,
  Zap,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const MAIN_APP_HUBS = [
  {
    id: "mock-tests",
    href: "/mock-tests",
    icon: FileText,
    emoji: "📝",
    title: "Mock Tests Hub",
    titleHi: "मॉक टेस्ट हब",
    badge: "Exam Simulation",
    badgeHi: "परीक्षा सिमुलेशन",
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    description: "UPSC, SSC, Railway & State Exam Full Papers with All-India Rank & instant solutions.",
    descriptionHi: "UPSC, SSC, रेलवे व राज्य परीक्षाओं के पूर्ण प्रश्न-पत्र, ऑल इंडिया रैंक व विस्तृत हल।",
    bgGradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
    hoverBorder: "hover:border-indigo-400 dark:hover:border-indigo-600",
  },
  {
    id: "govt-jobs",
    href: "/govt-jobs-alerts",
    icon: Briefcase,
    emoji: "💼",
    title: "Govt Job Alerts",
    titleHi: "सरकारी नौकरी अलर्ट्स",
    badge: "Live Updates",
    badgeHi: "ताज़ा भर्तियां",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    description: "Latest central & state vacancies, exam calendars, admit cards & official application links.",
    descriptionHi: "केंद्र व राज्यों की नवीनतम भर्तियां, एडमिट कार्ड, परीक्षा तिथियां और आधिकारिक आवेदन लिंक।",
    bgGradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-600",
  },
  {
    id: "current-affairs",
    href: "/daily-current-affairs",
    icon: Newspaper,
    emoji: "📰",
    title: "Daily Current Affairs",
    titleHi: "दैनिक समसामयिकी",
    badge: "Daily Quiz",
    badgeHi: "रोज़ाना ताज़ा",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    description: "Today's top national, economy & international news feed paired with a 5-question daily challenge.",
    descriptionHi: "आज की राष्ट्रीय व अंतर्राष्ट्रीय मुख्य घटनाएं और 5 प्रश्नों की त्वरित समसामयिक क्विज़।",
    bgGradient: "from-blue-500/10 via-sky-500/5 to-transparent",
    hoverBorder: "hover:border-blue-400 dark:hover:border-blue-600",
  },
  {
    id: "pro-pass",
    href: "/pro",
    icon: Crown,
    emoji: "👑",
    title: "Pro VIP Membership",
    titleHi: "प्रो VIP मेंबरशिप",
    badge: "₹11 / Month",
    badgeHi: "₹11 / माह",
    badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    description: "Earn 4x coins on quizzes, unlock unlimited full mock tests, ad-free experience & VIP badge.",
    descriptionHi: "प्रत्येक सही उत्तर पर 4x सिक्के, असीमित मॉक टेस्ट, विज्ञापन-मुक्त अभ्यास व VIP बैज।",
    bgGradient: "from-amber-500/15 via-orange-500/5 to-transparent",
    hoverBorder: "hover:border-amber-400 dark:hover:border-amber-600",
  },
  {
    id: "wallet",
    href: "/wallet",
    icon: Coins,
    emoji: "🪙",
    title: "Coin Wallet & Store",
    titleHi: "सिक्का वॉलेट व वाउचर्स",
    badge: "Real Vouchers",
    badgeHi: "असली वाउचर्स",
    badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    description: "Track your coin balance, daily check-in streak, and redeem Amazon Pay & Flipkart vouchers.",
    descriptionHi: "सिक्का बैलेंस देखें, दैनिक स्ट्रीक बोनस लें और Amazon Pay व Flipkart वाउचर्स रिडीम करें।",
    bgGradient: "from-orange-500/10 via-amber-500/5 to-transparent",
    hoverBorder: "hover:border-orange-400 dark:hover:border-orange-600",
  },
  {
    id: "rewards",
    href: "/rewards",
    icon: Trophy,
    emoji: "🏆",
    title: "Rewards & Badges Hub",
    titleHi: "रिवॉर्ड्स व उपलब्धि हब",
    badge: "Achievements",
    badgeHi: "7 माइलस्टोन्स",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    description: "Unlock Speed Demon & Century badges, collect stars and complete your fun sticker album.",
    descriptionHi: "रफ़्तार किंग व शतक वीर जैसे बैज अनलॉक करें, स्टार्स जुटाएं और स्टिकर एल्बम पूरा करें।",
    bgGradient: "from-purple-500/10 via-pink-500/5 to-transparent",
    hoverBorder: "hover:border-purple-400 dark:hover:border-purple-600",
  },
  {
    id: "career-guide",
    href: "/career-guide",
    icon: Compass,
    emoji: "🧭",
    title: "Career Guide",
    titleHi: "करियर गाइडेंस",
    badge: "Roadmaps",
    badgeHi: "मार्गदर्शन",
    badgeColor: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800",
    description: "Expert career paths after 10th & 12th, top college degrees, entrance exams & salary benchmarks.",
    descriptionHi: "10वीं व 12वीं के बाद सही करियर चुनाव, डिग्रियां, प्रवेश परीक्षाएं और सैलरी रोडमैप।",
    bgGradient: "from-fuchsia-500/10 via-purple-500/5 to-transparent",
    hoverBorder: "hover:border-fuchsia-400 dark:hover:border-fuchsia-600",
  },
  {
    id: "parent-zone",
    href: "/parent",
    icon: ShieldCheck,
    emoji: "👨‍👩‍👧",
    title: "Parent Zone & Control",
    titleHi: "पैरेंट ज़ोन व प्रोग्रेस रिपोर्ट",
    badge: "Safe Mode",
    badgeHi: "सुरक्षित मोड",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    description: "PIN-protected screen time limits, quiz quotas, subject curation & WhatsApp weekly report cards.",
    descriptionHi: "पिन-संरक्षित स्क्रीन टाइम लॉक, क्विज़ कोटा और WhatsApp पर साप्ताहिक प्रगति रिपोर्ट कार्ड।",
    bgGradient: "from-rose-500/10 via-pink-500/5 to-transparent",
    hoverBorder: "hover:border-rose-400 dark:hover:border-rose-600",
  },
  {
    id: "school-study",
    href: "/school-study",
    icon: GraduationCap,
    emoji: "🎓",
    title: "School Study Hub",
    titleHi: "स्कूल बोर्ड स्टडी हब",
    badge: "Class 6-12",
    badgeHi: "कक्षा 6-12",
    badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800",
    description: "NCERT & State Board chapter-wise revision sets for Math, Science, Social Studies & English.",
    descriptionHi: "गणित, विज्ञान, सामाजिक विज्ञान व व्याकरण के अध्याय-वार अभ्यास सेट व बोर्ड तैयारी।",
    bgGradient: "from-sky-500/10 via-cyan-500/5 to-transparent",
    hoverBorder: "hover:border-sky-400 dark:hover:border-sky-600",
  },
  {
    id: "true-false",
    href: "/true-false",
    icon: Zap,
    emoji: "⚡",
    title: "True / False Speed Run",
    titleHi: "ट्रू / फॉल्स स्पीड रन",
    badge: "Rapid Fire",
    badgeHi: "रैपिड गेम",
    badgeColor: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700",
    description: "Rapid-fire yes/no decision challenges. Test lightning-fast instincts and reflex knowledge.",
    descriptionHi: "बिजली जैसी तेज़ गति वाली सही/गलत चुनौती। अपनी त्वरित निर्णय क्षमता परखें।",
    bgGradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
    hoverBorder: "hover:border-yellow-400 dark:hover:border-yellow-600",
  },
  {
    id: "gk-book",
    href: "/gk-book",
    icon: BookOpen,
    emoji: "📖",
    title: "Digital GK Books",
    titleHi: "डिजिटल GK पुस्तकें",
    badge: "Reader",
    badgeHi: "किताबें",
    badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800",
    description: "Interactive flip-book reader with chapter notes, historical timelines and end-of-unit tests.",
    descriptionHi: "भारत व विश्व GK की ई-बुक्स, अध्याय-वार नोट्स और टाइमलाइन्स पढ़ने का डिजिटल अनुभव।",
    bgGradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
    hoverBorder: "hover:border-teal-400 dark:hover:border-teal-600",
  },
  {
    id: "sawal-jawab",
    href: "/sawal-jawab",
    icon: MessageSquare,
    emoji: "💬",
    title: "Sawal-Jawab Community",
    titleHi: "सवाल-जवाब कम्युनिटी",
    badge: "Q&A Forum",
    badgeHi: "चर्चा मंच",
    badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
    description: "Ask difficult questions, verify answers with peers, and share preparation tips.",
    descriptionHi: "कठिन प्रश्नों पर चर्चा करें, साथियों से सवाल पूछें और परीक्षा टिप्स साझा करें।",
    bgGradient: "from-cyan-500/10 via-blue-500/5 to-transparent",
    hoverBorder: "hover:border-cyan-400 dark:hover:border-cyan-600",
  },
];

export default function MainHubsShowcase({ isHindi = false }) {
  return (
    <section className="my-8 sm:my-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4 sm:mb-6 px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider mb-2 border border-indigo-200/60 dark:border-indigo-800/60">
            <Sparkles size={13} />
            <span>{isHindi ? "संपूर्ण अध्ययन व खेल केंद्र" : "All-in-One Learning Ecosystem"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>🌟</span>
            <span>{isHindi ? "मुख्य हब व विशेष सुविधाएं" : "Explore QuizWeb Hubs & Features"}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {isHindi
              ? "मॉक टेस्ट, सरकारी भर्तियां, दैनिक करंट अफेयर्स, करियर गाइडेंस, पैरेंट ज़ोन और रिवॉर्ड्स स्टोर तक 1-क्लिक पहुंच।"
              : "Direct access to full exam mock tests, job alerts, daily current affairs, career guides, parent zone and rewards."}
          </p>
        </div>
      </div>

      {/* Quick Horizontal 1-Tap Hub Pills Ribbon */}
      <div className="relative mb-5">
        <div
          className="flex gap-2 overflow-x-auto py-1 no-scrollbar -mx-1 px-1"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {MAIN_APP_HUBS.map((hub) => (
            <Link
              key={`pill-${hub.id}`}
              href={hub.href}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
            >
              <span>{hub.emoji}</span>
              <span>{isHindi ? hub.titleHi : hub.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Hubs Responsive Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {MAIN_APP_HUBS.map((hub) => {
          const IconComponent = hub.icon;

          return (
            <Link
              key={hub.id}
              href={hub.href}
              className={`group relative p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md hover:shadow-xl ${hub.hoverBorder} hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden`}
            >
              {/* Subtle Ambient Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${hub.bgGradient} opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`}
              />

              <div className="relative z-10">
                {/* Top Row: Icon container + Badge */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/60 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0 select-none">
                    <span>{hub.emoji}</span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${hub.badgeColor}`}
                  >
                    {isHindi ? hub.badgeHi : hub.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1.5 flex items-center justify-between">
                  <span>{isHindi ? hub.titleHi : hub.title}</span>
                  <ArrowRight
                    size={15}
                    className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-600 dark:text-indigo-400 shrink-0"
                  />
                </h3>

                {/* Description */}
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {isHindi ? hub.descriptionHi : hub.description}
                </p>
              </div>

              {/* Bottom Subtle Action Bar */}
              <div className="relative z-10 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <span>{isHindi ? "एक्सप्लोर करें" : "Explore Hub"}</span>
                <span className="text-xs">→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
