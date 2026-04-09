import Link from "next/link";
import styles from "@/styles/CareerGuide.module.css";
import { prisma } from "@/lib/prisma";
import CareerGuideDirectoryControls from "@/components/CareerGuideDirectoryControls";

export const revalidate = 3600;

export async function generateMetadata({ searchParams }) {
  const q = (searchParams?.q || "").trim();
  const cat = (searchParams?.cat || "").trim();
  const sort = (searchParams?.sort || "").trim();

  const hasFilters = Boolean(q || cat || sort);
  const title = hasFilters ? "Career Guide Search | QuizWeb" : "Career Guide - Explore Your Future | QuizWeb";
  const description = hasFilters
    ? "Search and filter career guides with roadmaps, salaries, and preparation strategies."
    : "Comprehensive step-by-step career guidance, roadmaps, salaries, and preparation strategies for various competitive exams and government jobs.";

  return {
    title,
    description,
    keywords: "career guide, career roadmap, government jobs, IAS preparation, career options",
    alternates: { canonical: "/career-guide" },
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function CareerGuideIndex({ searchParams }) {
  const q = (searchParams?.q || "").trim();
  const cat = (searchParams?.cat || "").trim(); // category pathKey
  const sort = (searchParams?.sort || "featured").trim();

  const categories = await prisma.careerCategory.findMany({
    where: { hidden: false },
    orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  let categoryIds = null;
  if (cat) {
    const node = await prisma.careerCategory.findUnique({ where: { pathKey: cat } });
    if (node) {
      const descendants = await prisma.careerCategory.findMany({
        where: {
          OR: [{ pathKey: node.pathKey }, { pathKey: { startsWith: `${node.pathKey}/` } }],
          hidden: false,
        },
        select: { id: true },
      });
      categoryIds = descendants.map((d) => d.id);
    } else {
      categoryIds = [];
    }
  }

  const where = {
    hidden: false,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } }, // legacy string
          ],
        }
      : {}),
    ...(categoryIds ? { careerCategoryId: { in: categoryIds } } : {}),
  };

  let orderBy = [{ sortOrder: "asc" }];
  if (sort === "az") orderBy = [{ name: "asc" }];
  if (sort === "za") orderBy = [{ name: "desc" }];
  if (sort === "newest") orderBy = [{ updatedAt: "desc" }];

  const records = await prisma.careerGuide.findMany({
    where,
    orderBy,
    select: { slug: true, name: true, category: true, description: true, icon: true, careerCategoryId: true },
  });

  const allCareers = records.map((r) => ({
    id: r.slug,
    name: r.name,
    category: r.category,
    description: r.description,
    icon: r.icon,
  }));

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Explore Your Dream Career</h1>
        <p className={styles.pageSubtitle}>
          Detailed roadmaps, expert tips, real success stories, and step-by-step guidance to help you achieve your ultimate career goals.
        </p>
      </header>

      <main>
        <CareerGuideDirectoryControls categories={categories} />
        <div className={styles.careersGrid}>
          {allCareers.map((career) => (
            <div key={career.id} className={styles.careerCard}>
              <div className={styles.careerIcon}>{career.icon}</div>
              <div className={styles.careerCategory}>{career.category}</div>
              <h2 className={styles.careerName}>{career.name}</h2>
              <p className={styles.careerDesc}>{career.description}</p>
              
              <Link href={`/career-guide/${career.id}`} className={styles.exploreBtn}>
                Explore Full Guide <span aria-hidden="true">→</span>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
