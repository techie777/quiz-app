import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateMetaTags } from "@/lib/seo";
import styles from "@/styles/SchoolStudy.module.css";

export async function generateMetadata({ params }) {
  const { boardId } = params;
  const board = await prisma.schoolBoard.findUnique({
    where: { slug: boardId },
    select: { name: true, slug: true }
  });

  if (!board) return generateMetaTags({ title: "Board Not Found" });

  return generateMetaTags({
    title: `${board.name} Online Study Materials`,
    description: `Access free practice quizzes, revision notes, and test series for ${board.name} classes 6 to 12. Boost your exam results with QuizWeb.`,
    keywords: `${board.name}, school study, practice quizzes, exam prep, free education`,
    canonical: `/school-study/${board.slug}`
  });
}

export default async function BoardClassesPage({ params }) {
  const { boardId } = params;
  
  if (boardId === 'practice') {
     return redirect('/school-study');
  }

  const board = await prisma.schoolBoard.findUnique({
    where: { slug: boardId },
    include: {
      classes: {
        orderBy: { number: "asc" },
      },
    },
  });

  if (!board) return <div className={styles.empty}>Board not found</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.crumbs}>
          <Link href="/school-study">Home</Link>
          <span className={styles.separator}>&gt;</span>
          <span className={styles.current}>{board.name}</span>
        </div>
        <div>
          <h1 className={styles.title}>{board.name} Curriculum</h1>
          <p className={styles.subtitle}>Select your grade level to access study materials.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {board.classes.map((c) => (
          <Link key={c.id} href={`/school-study/${boardId}/${c.number}`} className={styles.card}>
            <div className={styles.cardTitle}>Grade {c.number}</div>
            <div className={styles.cardMeta}>Class Level</div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.subjects?.length || 0} Subjects</span>
               <span style={{ fontSize: '1.2rem' }}>➔</span>
            </div>
          </Link>
        ))}
      </div>

      {board.classes.length === 0 && <div className={styles.empty}>No classes listed for this board yet.</div>}
    </div>
  );
}
