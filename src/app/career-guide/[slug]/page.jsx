import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/CareerGuide.module.css";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateMetadata({ params }) {
  const guide = await prisma.careerGuide.findUnique({
    where: { slug: params.slug }
  });

  if (!guide) {
    return { title: 'Career Not Found' };
  }

  return {
    title: `${guide.name} Career Guide | Step-by-Step Roadmap`,
    description: guide.description,
    keywords: `${guide.name}, career guide, roadmap, salary, ${guide.category}`
  };
}

export default async function DynamicCareerGuide({ params }) {
  const guide = await prisma.careerGuide.findUnique({
    where: { slug: params.slug },
    include: { sections: { orderBy: { sortOrder: 'asc' } } }
  });

  if (!guide || guide.hidden) {
    notFound();
  }

  return (
    <div className={styles.container}>
      {/* Basic Info & Short Description */}
      <section className={styles.hero}>
        <span className={styles.categoryTag}>{guide.category}</span>
        <h1 className={styles.heroTitle}>
          {guide.icon} {guide.name}
        </h1>
        <p className={styles.heroDesc}>{guide.description}</p>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Difficulty Level</div>
            <div className={styles.statValue}>{guide.difficulty}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Competition</div>
            <div className={styles.statValue}>{guide.competition}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Average Salary</div>
            <div className={styles.statValue}>{guide.avgSalary || "N/A"}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Work Type</div>
            <div className={styles.statValue}>{guide.workType}</div>
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      {guide.sections.length > 0 && (
        <section className={styles.section}>
          {guide.sections.map((section) => (
            <div key={section.id} className={styles.infoCard} style={{ marginBottom: "2rem" }}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              {/* If section.type is TEXT, we simply render the content. 
                  In a real app, content might be safely parsed HTML or an array mapped. */}
              <div className={styles.careerDesc} style={{ whiteSpace: "pre-wrap" }}>
                {section.content}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Ready to begin your journey?</h2>
        <div className={styles.ctaActions}>
          <Link href="/daily-current-affairs" className={styles.btnPrimary}>
            Start Preparation Now 🔥
          </Link>
          <Link href="/daily" className={styles.btnSecondary}>
            Attempt Free Quiz 📊
          </Link>
        </div>
      </section>
    </div>
  );
}
