import Link from "next/link";
import styles from "@/styles/CareerGuide.module.css";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const metadata = {
  title: "Career Guide - Explore Your Future | QuizWeb",
  description: "Comprehensive step-by-step career guidance, roadmaps, salaries, and preparation strategies for various competitive exams and government jobs.",
  keywords: "career guide, career roadmap, government jobs, IAS preparation, career options"
};

const careers = [
  {
    id: "ias",
    name: "IAS Officer",
    category: "Government Job",
    description: "Indian Administrative Service officers handle administration at district, state, and central levels. Discover the complete roadmap, salary, and strategy to crack the UPSC exam.",
    icon: "🏛️"
  },
  // Future careers will go here
  /*
  {
    id: "ips",
    name: "IPS Officer",
    category: "Government Job",
    description: "Indian Police Service officers ensure law and order. Learn about the physical requirements, training, and complete journey.",
    icon: "👮"
  },
  {
    id: "doctor",
    name: "Medical Doctor (MBBS)",
    category: "Healthcare",
    description: "Complete guide to clearing NEET, surviving medical college, and building a successful career in healthcare.",
    icon: "🩺"
  }
  */
];

export default async function CareerGuideIndex() {
  let dbCareers = [];
  try {
    const records = await prisma.careerGuide.findMany({
      where: { hidden: false },
      orderBy: { sortOrder: 'asc' }
    });
    dbCareers = records.map(r => ({
      id: r.slug,
      name: r.name,
      category: r.category,
      description: r.description,
      icon: r.icon
    }));
  } catch (error) {
    console.error("Failed to fetch dynamic careers:", error);
  }

  // Combine static and dynamic (de-duplicating by ID just in case)
  const allCareers = [...careers];
  dbCareers.forEach(dc => {
    if (!allCareers.find(sc => sc.id === dc.id)) {
      allCareers.push(dc);
    }
  });

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Explore Your Dream Career</h1>
        <p className={styles.pageSubtitle}>
          Detailed roadmaps, expert tips, real success stories, and step-by-step guidance to help you achieve your ultimate career goals.
        </p>
      </header>

      <main>
        <div className={styles.careersGrid}>
          {allCareers.map(career => (
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
