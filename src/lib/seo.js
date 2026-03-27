// SEO optimization utilities

// Generate structured data for pages
export const generateStructuredData = (type, data) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": type,
    ...data
  };

  return JSON.stringify(structuredData);
};

// Quiz structured data
export const generateQuizStructuredData = (quiz) => {
  return generateStructuredData("Quiz", {
    name: quiz.topic || quiz.title,
    description: quiz.description || `Test your knowledge with ${quiz.topic} quiz`,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/quiz/${quiz.id}`,
    numberOfQuestions: quiz.questions?.length || 0,
    educationalLevel: quiz.difficulty || "beginner",
    about: {
      "@type": "Thing",
      name: quiz.topic
    },
    author: {
      "@type": "Organization",
      name: "QuizWeb",
      url: process.env.NEXT_PUBLIC_SITE_URL
    },
    publisher: {
      "@type": "Organization",
      name: "QuizWeb",
      url: process.env.NEXT_PUBLIC_SITE_URL
    },
    dateModified: quiz.updatedAt || new Date().toISOString(),
    datePublished: quiz.createdAt || new Date().toISOString()
  });
};

// Category structured data
export const generateCategoryStructuredData = (category) => {
  return generateStructuredData("CollectionPage", {
    name: category.topic,
    description: category.description || `Explore ${category.topic} quizzes and test your knowledge`,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/category/${category.id}`,
    numberOfItems: category.questionCount || 0,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: category.questionCount || 0,
      itemListElement: category.questions?.map((q, index) => ({
        "@type": "Question",
        position: index + 1,
        name: q.text
      })) || []
    }
  });
};

// Breadcrumb structured data
export const generateBreadcrumbStructuredData = (breadcrumbs) => {
  return generateStructuredData("BreadcrumbList", {
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  });
};

// Organization structured data
export const generateOrganizationStructuredData = () => {
  return generateStructuredData("Organization", {
    name: "QuizWeb",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
      width: 512,
      height: 512
    },
    description: "Free online quizzes and educational platform for learning and knowledge testing",
    sameAs: [
      // Add social media URLs here
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"]
    }
  });
};

// Website structured data
export const generateWebsiteStructuredData = () => {
  return generateStructuredData("WebSite", {
    name: "QuizWeb",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    description: "Free online quizzes and educational games across Science, Math, History, Sports, and more!",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    publisher: {
      "@type": "Organization",
      name: "QuizWeb"
    }
  });
};

// Generate meta tags for pages
export const generateMetaTags = (meta) => {
  const {
    title,
    description,
    keywords,
    canonical,
    ogImage,
    ogType = 'website',
    noIndex = false,
    locale = 'en_US'
  } = meta;

  return {
    title: title || "QuizWeb - Free Online Quizzes & Educational Games",
    description: description || "Challenge yourself with thousands of free quizzes across Science, Math, History, Sports, and more!",
    keywords: keywords || "online quizzes, educational games, science quiz, math test, history questions, geography challenge, sports trivia, entertainment quiz, current affairs, general knowledge, learning platform, free quizzes",
    canonical: canonical || process.env.NEXT_PUBLIC_SITE_URL,
    openGraph: {
      title: title || "QuizWeb - Free Online Quizzes & Educational Games",
      description: description || "Test your knowledge with thousands of free quizzes across Science, Math, History, Sports, and more!",
      url: canonical || process.env.NEXT_PUBLIC_SITE_URL,
      siteName: 'QuizWeb',
      images: ogImage ? [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title || 'QuizWeb - Free Online Quizzes',
      }] : [{
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'QuizWeb - Free Online Quizzes',
      }],
      locale: locale,
      type: ogType,
    },
    twitter: {
      card: 'summary_large_image',
      title: title || "QuizWeb - Free Online Quizzes & Educational Games",
      description: description || "Test your knowledge with thousands of free quizzes across Science, Math, History, Sports, and more!",
      images: ogImage ? [ogImage] : ['/twitter-image.jpg'],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: canonical || '/',
      languages: {
        'en': canonical || '/en',
        'hi': (canonical || '').replace('/en', '/hi') || '/hi',
      },
    },
  };
};

// Generate page-specific structured data
export const generatePageStructuredData = (pageType, data) => {
  switch (pageType) {
    case 'quiz':
      return generateQuizStructuredData(data);
    case 'category':
      return generateCategoryStructuredData(data);
    case 'home':
      return generateWebsiteStructuredData();
    case 'about':
      return generateOrganizationStructuredData();
    default:
      return null;
  }
};

// Generate hreflang tags for multilingual SEO
export const generateHreflangTags = (currentPage, alternatePages = {}) => {
  const hreflangTags = [
    {
      rel: 'alternate',
      hrefLang: 'x-default',
      href: `${process.env.NEXT_PUBLIC_SITE_URL}${currentPage}`
    },
    {
      rel: 'alternate',
      hrefLang: 'en',
      href: `${process.env.NEXT_PUBLIC_SITE_URL}/en${currentPage}`
    },
    {
      rel: 'alternate',
      hrefLang: 'hi',
      href: `${process.env.NEXT_PUBLIC_SITE_URL}/hi${currentPage}`
    }
  ];

  // Add any custom alternate pages
  Object.entries(alternatePages).forEach(([lang, href]) => {
    hreflangTags.push({
      rel: 'alternate',
      hrefLang: lang,
      href: `${process.env.NEXT_PUBLIC_SITE_URL}${href}`
    });
  });

  return hreflangTags;
};

// Generate JSON-LD script for structured data
export const StructuredDataScript = ({ data }) => {
  if (!data) return null;
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: data }}
    />
  );
};
