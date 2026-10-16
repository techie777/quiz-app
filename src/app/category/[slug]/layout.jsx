export async function generateMetadata({ params }) {
  const slug = params?.slug ? String(params.slug).toLowerCase() : "gk";
  const titleSlug = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${titleSlug} Quizzes & Practice Sets | QuizWeb`,
    description: `Practice free ${titleSlug} quizzes and comprehensive practice sets. Test your knowledge with instant answers, detailed explanations, and 1v1 battle rooms on QuizWeb.`,
    alternates: {
      canonical: `/category/${slug}`,
    },
    openGraph: {
      title: `${titleSlug} Quizzes & Practice Sets | QuizWeb`,
      description: `Practice ${titleSlug} quizzes with timer challenges, detailed solutions, and live leaderboards on QuizWeb.`,
      url: `/category/${slug}`,
      siteName: "QuizWeb",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${titleSlug} Quizzes & Practice Sets | QuizWeb`,
      description: `Practice ${titleSlug} quizzes with timer challenges and live leaderboards on QuizWeb.`,
    },
  };
}

export default function CategorySlugLayout({ children }) {
  return children;
}
