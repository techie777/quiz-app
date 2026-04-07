import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateMetaTags } from "@/lib/seo";
import styles from "@/styles/SchoolStudy.module.css";

export async function generateMetadata({ params }) {
  const { boardId, classNum } = params;
  const schoolClass = await prisma.schoolClass.findFirst({
    where: { 
      board: { slug: boardId }, 
      number: parseInt(classNum) 
    },
    include: { board: true }
  });

  if (!schoolClass) return generateMetaTags({ title: "Class Not Found" });

  return generateMetaTags({
    title: `Class ${classNum} ${schoolClass.board.name} Practice & Revision`,
    description: `Complete subject-wise revision for Class ${classNum} (${schoolClass.board.name}). Access chapter-wise quizzes and study materials to excel in your exams.`,
    keywords: `Class ${classNum}, ${schoolClass.board.name}, subjects, revision, quizzes`,
    canonical: `/school-study/${boardId}/${classNum}`
  });
}

export default async function ClassSubjectsPage({ params }) {
  const { boardId, classNum } = params;

  const schoolClass = await prisma.schoolClass.findFirst({
    where: { 
      board: { slug: boardId }, 
      number: parseInt(classNum) 
    },
    include: {
      board: true,
      subjects: {
        include: { _count: { select: { chapters: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!schoolClass) return <div className={styles.empty}>Class not found</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.crumbs}>
          <Link href="/school-study">Home</Link>
          <span className={styles.separator}>&gt;</span>
          <Link href={`/school-study/${boardId}`}>{schoolClass.board.name}</Link>
          <span className={styles.separator}>&gt;</span>
          <span className={styles.current}>Class {classNum}</span>
        </div>
        <div>
          <h1 className={styles.title}>All Subjects</h1>
          <p className={styles.subtitle}>Select a subject for Grade {classNum} practice.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {schoolClass.subjects.map((s) => (
          <Link key={s.id} href={`/school-study/${boardId}/${classNum}/${s.slug}`} className={styles.card}>
            <div className={styles.cardTitle}>{s.name}</div>
            <div className={styles.cardMeta}>Course Subject</div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.chapters?.length || 0} Chapters</span>
               <span style={{ fontSize: '1.2rem' }}>➔</span>
            </div>
          </Link>
        ))}
      </div>

      {schoolClass.subjects.length === 0 && <div className={styles.empty}>No subjects listed for this class yet.</div>}
    </div>
  );
}
