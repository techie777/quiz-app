import Link from "next/link";
import styles from "@/styles/CareerGuide.module.css";
import { prisma } from "@/lib/prisma";
import CareerGuideDirectoryControls from "@/components/CareerGuideDirectoryControls";
import { cookies } from "next/headers";
import { translations } from "@/locales/language_translations";

export const revalidate = 3600;

function getServerT(lang) {
  return (path) => {
    const keys = path.split('.');
    let result = translations[lang] || translations['en'];
    for (const key of keys) {
      if (result && result[key]) result = result[key];
      else return path;
    }
    return result;
  };
}

export async function generateMetadata({ searchParams }) {
  const cookieStore = cookies();
  const lang = cookieStore.get('app-language')?.value || 'en';
  const t = getServerT(lang);

  const q = (searchParams?.q || "").trim();
  const cat = (searchParams?.cat || "").trim();
  const sort = (searchParams?.sort || "").trim();

  const hasFilters = Boolean(q || cat || sort);
  const title = hasFilters ? `${lang === 'hi' ? 'करियर गाइड खोज' : 'Career Guide Search'} | QuizWeb` : `${t('career.title')} | QuizWeb`;
  const description = t('career.subtitle');

  return {
    title,
    description,
    keywords: "career guide, career roadmap, government jobs, IAS preparation, career options",
    alternates: { canonical: "/career-guide" },
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function CareerGuideIndex({ searchParams }) {
  const cookieStore = cookies();
  const lang = cookieStore.get('app-language')?.value || 'en';
  const t = getServerT(lang);

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
        <h1 className={styles.pageTitle}>{t('career.title')}</h1>
        <p className={styles.pageSubtitle}>
          {t('career.subtitle')}
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
                {t('career.exploreBtn')} <span aria-hidden="true">→</span>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
