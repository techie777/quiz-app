import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import styles from "@/styles/CareerGuide.module.css";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";
import CareerGuideTOC from "@/components/CareerGuideTOC";
import LanguageToggle from "@/components/LanguageToggle";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params, searchParams }) {
  const guide = await prisma.careerGuide.findUnique({
    where: { slug: params.slug },
    include: { careerCategory: true },
  });

  if (!guide) {
    return { title: 'Career Not Found' };
  }

  const isHi = searchParams?.lang === "hi";
  const name = isHi && guide.nameHi ? guide.nameHi : guide.name;
  const desc = isHi && guide.descriptionHi ? guide.descriptionHi : guide.description;

  const breadcrumb = guide.careerCategory?.pathSlugs?.length
    ? ` | ${guide.careerCategory.pathSlugs.join(" > ")}`
    : "";

  return {
    title: `${name} ${isHi ? "करियर गाइड" : "Career Guide"} | Step-by-Step Roadmap${breadcrumb}`,
    description: desc,
    keywords: `${name}, career guide, roadmap, salary, ${guide.category}`
  };
}

export default async function DynamicCareerGuide({ params, searchParams }) {
  const guide = await prisma.careerGuide.findUnique({
    where: { slug: params.slug },
    include: { sections: { orderBy: { sortOrder: 'asc' } }, careerCategory: true }
  });

  if (!guide || guide.hidden) {
    notFound();
  }

  // Force check searchParams from props and fallback to env/internal query if needed
  const langQuery = searchParams?.lang || (typeof searchParams?.get === 'function' ? searchParams.get('lang') : null);
  const isHi = langQuery === "hi";

  // DIAGNOSTIC (Remove after verification)
  // console.log("SERVER RENDERING:", { langQuery, isHi, url: params.slug });

  const dName = (isHi && guide.nameHi?.trim()) ? guide.nameHi : guide.name;
  const dDesc = (isHi && guide.descriptionHi?.trim()) ? guide.descriptionHi : guide.description;
  const dDiff = (isHi && guide.difficultyHi?.trim()) ? guide.difficultyHi : guide.difficulty;
  const dComp = (isHi && guide.competitionHi?.trim()) ? guide.competitionHi : guide.competition;
  const dSal = (isHi && guide.avgSalaryHi?.trim()) ? guide.avgSalaryHi : guide.avgSalary;
  const dWork = (isHi && guide.workTypeHi?.trim()) ? guide.workTypeHi : guide.workType;

  const tocItems = (guide.sections || []).map((s) => ({
    id: `cg-${String(s.id)}`,
    title: (isHi && s.titleHi?.trim()) ? s.titleHi : s.title,
  }));

  const renderSectionBody = (section) => {
    const type = String(section?.type || "TEXT").toUpperCase();
    const content = (isHi && section?.contentHi?.trim() && section.contentHi !== "[]") ? section.contentHi : (section?.content ?? "");

    if (type === "LIST") {
      const items = safeJsonParse(content, []);
      if (!Array.isArray(items) || items.length === 0) {
        return <div className={styles.careerDesc} style={{ whiteSpace: "pre-wrap" }}>{String(content || "")}</div>;
      }
      return (
        <ul className={styles.cardList}>
          {items.map((it, idx) => (
            <li key={idx}>{String(it)}</li>
          ))}
        </ul>
      );
    }

    if (type === "FAQS") {
      const items = safeJsonParse(content, []);
      if (!Array.isArray(items) || items.length === 0) {
        return <div className={styles.careerDesc} style={{ whiteSpace: "pre-wrap" }}>{String(content || "")}</div>;
      }
      return (
        <div className={styles.faqSection}>
          {items.map((it, idx) => (
            <details key={idx} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>
                <span>{String(it?.question || `FAQ ${idx + 1}`)}</span>
                <span className={styles.faqIcon}>▾</span>
              </summary>
              <div className={styles.faqAnswer} style={{ whiteSpace: "pre-wrap" }}>
                {String(it?.answer || "")}
              </div>
            </details>
          ))}
        </div>
      );
    }

    return (
      <div className={styles.careerDesc} style={{ whiteSpace: "pre-wrap" }}>
        {String(content || "")}
      </div>
    );
  };

  const crumbs = await (async () => {
    const cat = guide.careerCategory;
    const slugs = Array.isArray(cat?.pathSlugs) ? cat.pathSlugs : [];
    const ids = Array.isArray(cat?.pathIds) ? cat.pathIds : [];
    const nodes = ids.length
      ? await prisma.careerCategory.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, depth: true } })
      : [];
    nodes.sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));

    const list = [{ label: isHi ? "करियर गाइड" : "Career Guide", href: "/career-guide" }];
    for (let i = 0; i < slugs.length; i++) {
      const pathKey = slugs.slice(0, i + 1).join("/");
      list.push({ label: nodes[i]?.name || slugs[i], href: `/career-guide/path/${pathKey}` });
    }
    list.push({ label: dName, href: `/career-guide/${guide.slug}` });
    return list;
  })();

  return (
    <div className={styles.container}>
      {/* DEVELOPMENT DEBUG - Can be removed after sync fix verified */}
      <div style={{ padding: '4px 12px', background: isHi ? '#16a34a' : '#4b5563', color: 'white', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', borderRadius: '4px', marginBottom: '8px' }}>
        SERVER_DETECTED_LANG: {langQuery || 'NONE'} | MODE: {isHi ? 'HINDI' : 'ENGLISH'}
      </div>

      {/* Basic Info & Short Description */}
      <section className={styles.hero}>
        <Suspense fallback={<div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.5 }}>...</div>}>
          <LanguageToggle />
        </Suspense>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          {crumbs.map((c, idx) => (
            <span key={c.href}>
              {idx > 0 ? <span className={styles.breadcrumbSep}>›</span> : null}
              <Link className={styles.breadcrumbLink} href={c.href}>
                {c.label}
              </Link>
            </span>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span className={styles.categoryTag}>{guide.category}</span>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 800, 
            padding: '4px 10px', 
            borderRadius: '20px', 
            background: guide.type === 'EXAM' ? 'rgba(79, 70, 229, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
            color: guide.type === 'EXAM' ? '#818cf8' : '#34d399',
            border: `1px solid ${guide.type === 'EXAM' ? '#4f46e5' : '#059669'}`,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {guide.type === 'EXAM' ? (isHi ? 'परीक्षा' : 'Exam') : (isHi ? 'नौकरी' : 'Job')}
          </span>
        </div>
        <h1 className={styles.heroTitle}>
          {guide.icon} {dName}
        </h1>
        <p className={styles.heroDesc}>{dDesc}</p>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{isHi ? "कठिनाई स्तर" : "Difficulty Level"}</div>
            <div className={styles.statValue}>{dDiff}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{isHi ? "प्रतियोगिता" : "Competition"}</div>
            <div className={styles.statValue}>{dComp}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              {guide.type === 'EXAM' 
                ? (isHi ? "अनुदान/वजीफा" : "Grant/Stipend") 
                : (isHi ? "औसत वेतन" : "Average Salary")}
            </div>
            <div className={styles.statValue}>{dSal || "N/A"}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{isHi ? "कार्य प्रकार" : "Work Type"}</div>
            <div className={styles.statValue}>{dWork}</div>
          </div>
        </div>
      </section>

      <div className={styles.layout}>
        <aside className={styles.toc}>
          <CareerGuideTOC items={tocItems} />
        </aside>
        <div className={styles.main}>
          {/* Dynamic Sections */}
          {guide.sections.length > 0 && (
            <section className={styles.section}>
              {guide.sections.map((section) => (
                <div
                  key={section.id}
                  id={`cg-${String(section.id)}`}
                  className={styles.infoCard}
                  style={{ marginBottom: "1.25rem", scrollMarginTop: "140px" }}
                >
                  <h2 className={styles.sectionTitle}>{isHi && section.titleHi ? section.titleHi : section.title}</h2>
                  {renderSectionBody(section)}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>{isHi ? "अपनी यात्रा शुरू करने के लिए तैयार हैं?" : "Ready to begin your journey?"}</h2>
        <div className={styles.ctaActions}>
          <Link href="/daily-current-affairs" className={styles.btnPrimary}>
            {isHi ? "अभी तैयारी शुरू करें 🔥" : "Start Preparation Now 🔥"}
          </Link>
          <Link href="/daily" className={styles.btnSecondary}>
            {isHi ? "फ्री क्विज़ का प्रयास करें 📊" : "Attempt Free Quiz 📊"}
          </Link>
        </div>
      </section>
    </div>
  );
}
