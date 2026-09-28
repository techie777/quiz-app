import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "@/styles/CareerGuide.module.css";
import { prisma } from "@/lib/prisma";
import CareerGuideClient from "@/components/CareerGuideClient";
import { cookies } from "next/headers";
import { translations } from "@/locales/language_translations";
import { DEFAULT_MODULES_CONFIG, parseModulesConfig } from "@/lib/modulesConfig";

export const dynamic = "force-dynamic";

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

export default async function CareerGuideIndex() {
  const setting = await prisma.setting.findUnique({ where: { key: "modules" } }).catch(() => null);
  const modules = setting?.value ? parseModulesConfig(setting.value) : DEFAULT_MODULES_CONFIG;
  if (!modules.careerGuide) {
    redirect("/");
  }

  const cookieStore = cookies();
  const lang = cookieStore.get('app-language')?.value || 'en';
  const t = getServerT(lang);

  const categories = await prisma.careerCategory.findMany({
    where: { hidden: false },
    orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  const records = await prisma.careerGuide.findMany({
    where: { hidden: false },
    orderBy: [{ sortOrder: "asc" }],
    select: { slug: true, name: true, category: true, description: true, icon: true, careerCategoryId: true },
  });

  const allCareers = records.map((r) => ({
    id: r.slug,
    name: r.name,
    category: r.category,
    description: r.description,
    icon: r.icon,
    careerCategoryId: r.careerCategoryId,
  }));

  const translationsMap = {
    'career.exploreBtn': t('career.exploreBtn')
  };

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('career.title')}</h1>
        <p className={styles.pageSubtitle}>
          {t('career.subtitle')}
        </p>
      </header>

      <main>
        <CareerGuideClient 
          categories={categories} 
          allCareers={allCareers} 
          translations={translationsMap} 
        />
      </main>
    </div>
  );
}
