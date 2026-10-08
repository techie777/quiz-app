"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function CategoryBreadcrumbs({
  mainCategory,
  subCategory,
  topic,
  onResetSubCategory,
  onResetTopic,
  className = "",
}) {
  const { isHindi } = useLanguage();

  if (!mainCategory) return null;

  const rawIcon = mainCategory?.icon || "📚";
  const categoryIcon = rawIcon === "IN" ? "🇮🇳" : (rawIcon.length > 2 && !rawIcon.startsWith("http") ? rawIcon : (mainCategory?.slug === "india-gk" ? "🇮🇳" : rawIcon));

  const mainTitle = isHindi && mainCategory.nameHi ? mainCategory.nameHi : mainCategory.name;

  const isIndiaSubCategory = ["india-history", "india-geography", "india-sports", "india-polity"].includes(mainCategory.slug);

  // JSON-LD Breadcrumb Schema for SEO
  const breadcrumbItems = [
    { name: isHindi ? "होम" : "Home", url: "https://quizweb.com/" },
  ];

  if (isIndiaSubCategory) {
    breadcrumbItems.push({
      name: isHindi ? "🇮🇳 भारत सामान्य ज्ञान" : "🇮🇳 India GK",
      url: "https://quizweb.com/category/india-gk",
    });
  }

  breadcrumbItems.push({
    name: `${categoryIcon} ${mainTitle}`.trim(),
    url: `https://quizweb.com/category/${mainCategory.slug}`,
  });

  if (subCategory) {
    breadcrumbItems.push({
      name: subCategory.name || subCategory,
      url: `https://quizweb.com/category/${mainCategory.slug}?sub=${encodeURIComponent(subCategory.slug || subCategory)}`,
    });
  }

  if (topic) {
    breadcrumbItems.push({
      name: topic,
      url: `https://quizweb.com/category/${mainCategory.slug}?topic=${encodeURIComponent(topic)}`,
    });
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <nav aria-label="Breadcrumbs" className={`w-full ${className}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ol className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
        {/* 1. Home */}
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1"
          >
            <Home size={14} className="text-slate-400" />
            <span>{isHindi ? "होम" : "Home"}</span>
          </Link>
        </li>

        {/* Separator */}
        <li className="text-slate-300 dark:text-slate-600 select-none">
          <ChevronRight size={14} />
        </li>

        {/* India GK Parent link if this is an India GK subcategory */}
        {isIndiaSubCategory && (
          <>
            <li className="inline-flex items-center">
              <Link
                href="/category/india-gk"
                className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors py-1"
              >
                <span>🇮🇳</span>
                <span>{isHindi ? "भारत GK" : "India GK"}</span>
              </Link>
            </li>
            <li className="text-slate-300 dark:text-slate-600 select-none">
              <ChevronRight size={14} />
            </li>
          </>
        )}

        {/* 2. Main Category */}
        <li className="inline-flex items-center">
          {subCategory || topic ? (
            <button
              type="button"
              onClick={() => {
                if (onResetSubCategory) onResetSubCategory();
                if (onResetTopic) onResetTopic();
              }}
              className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors py-1 cursor-pointer"
            >
              <span>{categoryIcon}</span>
              <span>{mainTitle}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-black py-1">
              <span>{categoryIcon}</span>
              <span>{mainTitle}</span>
            </span>
          )}
        </li>

        {/* 3. Subcategory (if active) */}
        {subCategory && (
          <>
            <li className="text-slate-300 dark:text-slate-600 select-none">
              <ChevronRight size={14} />
            </li>
            <li className="inline-flex items-center">
              {topic ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onResetTopic) onResetTopic();
                  }}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors py-1 cursor-pointer"
                >
                  {subCategory.name || subCategory}
                </button>
              ) : (
                <span className="text-slate-900 dark:text-white font-black py-1">
                  {subCategory.name || subCategory}
                </span>
              )}
            </li>
          </>
        )}

        {/* 4. Topic (if active) */}
        {topic && (
          <>
            <li className="text-slate-300 dark:text-slate-600 select-none">
              <ChevronRight size={14} />
            </li>
            <li className="inline-flex items-center">
              <span className="text-indigo-600 dark:text-indigo-400 font-black py-1 bg-indigo-50 dark:bg-indigo-950/50 px-2 rounded-md border border-indigo-200/50 dark:border-indigo-800/50">
                {topic}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
