import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import styles from "@/styles/CareerGuide.module.css";

export const revalidate = 3600;

async function crumbsFromCategory(cat) {
  const slugs = Array.isArray(cat?.pathSlugs) ? cat.pathSlugs : [];
  const ids = Array.isArray(cat?.pathIds) ? cat.pathIds : [];
  const nodes = ids.length
    ? await prisma.careerCategory.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, depth: true } })
    : [];
  nodes.sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));

  const pieces = [];
  for (let i = 0; i < slugs.length; i++) {
    const pathKey = slugs.slice(0, i + 1).join("/");
    const node = nodes[i];
    pieces.push({ label: node?.name || slugs[i], href: `/career-guide/path/${pathKey}` });
  }
  return pieces;
}

export async function generateMetadata({ params }) {
  const path = (params?.path || []).map(String);
  const pathKey = path.join("/");
  const cat = await prisma.careerCategory.findUnique({ where: { pathKey } });
  if (!cat) return { title: "Category Not Found" };

  const title = `${(Array.isArray(cat.pathSlugs) ? cat.pathSlugs.join(" > ") : cat.name) || cat.name} | Career Guide`;
  return {
    title,
    description: `Explore career guides under ${(Array.isArray(cat.pathSlugs) ? cat.pathSlugs.join(" > ") : cat.name) || cat.name}.`,
    alternates: { canonical: `/career-guide/path/${pathKey}` },
  };
}

export default async function CareerGuideCategoryLanding({ params }) {
  const path = (params?.path || []).map(String);
  const pathKey = path.join("/");

  const category = await prisma.careerCategory.findUnique({ where: { pathKey } });
  if (!category || category.hidden) notFound();

  const subCategories = await prisma.careerCategory.findMany({
    where: { parentId: category.id, hidden: false },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const descendants = await prisma.careerCategory.findMany({
    where: {
      OR: [{ pathKey: category.pathKey }, { pathKey: { startsWith: `${category.pathKey}/` } }],
      hidden: false,
    },
    select: { id: true },
  });
  const ids = descendants.map((d) => d.id);

  const guides = await prisma.careerGuide.findMany({
    where: { hidden: false, careerCategoryId: { in: ids } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { slug: true, name: true, category: true, description: true, icon: true },
  });

  const crumbs = await crumbsFromCategory(category);

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div style={{ marginBottom: 12, fontSize: 13, color: "var(--text-secondary, #64748b)" }}>
          <Link href="/career-guide" style={{ color: "inherit", textDecoration: "none" }}>
            Career Guide
          </Link>{" "}
          {crumbs.map((c) => (
            <span key={c.href}>
              {" "}
              ›{" "}
              <Link href={c.href} style={{ color: "inherit", textDecoration: "none" }}>
                {c.label}
              </Link>
            </span>
          ))}
        </div>
        <h1 className={styles.pageTitle}>{category.name}</h1>
        <p className={styles.pageSubtitle}>
          Browse all guides under{" "}
          {(Array.isArray(category.pathSlugs) ? category.pathSlugs.join(" > ") : category.name) || category.name}.
        </p>
      </header>

      <main>
        {subCategories.length > 0 && (
          <section style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px" }}>Sub-categories</h2>
            <div className={styles.careersGrid}>
              {subCategories.map((c) => (
                <div key={c.id} className={styles.careerCard}>
                  <div className={styles.careerIcon}>📁</div>
                  <div className={styles.careerCategory}>Category</div>
                  <h3 className={styles.careerName}>{c.name}</h3>
                  <p className={styles.careerDesc}>
                    {(Array.isArray(c.pathSlugs) ? c.pathSlugs.join(" > ") : c.name) || c.name}
                  </p>
                  <Link href={`/career-guide/path/${c.pathKey}`} className={styles.exploreBtn}>
                    Explore <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px" }}>Guides</h2>
          {guides.length === 0 ? (
            <p style={{ color: "var(--text-secondary, #64748b)" }}>No guides found in this category yet.</p>
          ) : (
            <div className={styles.careersGrid}>
              {guides.map((g) => (
                <div key={g.slug} className={styles.careerCard}>
                  <div className={styles.careerIcon}>{g.icon || "🧭"}</div>
                  <div className={styles.careerCategory}>{g.category}</div>
                  <h3 className={styles.careerName}>{g.name}</h3>
                  <p className={styles.careerDesc}>{g.description}</p>
                  <Link href={`/career-guide/${g.slug}`} className={styles.exploreBtn}>
                    Explore Full Guide <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

