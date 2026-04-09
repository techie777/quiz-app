import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateMetaTags } from "@/lib/seo";
import styles from "@/styles/SchoolStudy.module.css";
import LiveStudyButton from "@/components/engine/LiveStudyButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function generateMetadata({ params }) {
  const { boardId, classNum, subjectSlug } = params;
  const subject = await prisma.schoolSubject.findFirst({
    where: { 
      slug: subjectSlug,
      class: {
        board: { slug: boardId },
        number: parseInt(classNum)
      }
    },
    include: { class: { include: { board: true } } }
  });

  if (!subject) return generateMetaTags({ title: "Subject Not Found" });

  return generateMetaTags({
    title: `${subject.name} - Class ${classNum} ${subject.class.board.name} Practice`,
    description: `Master ${subject.name} for Class ${classNum} (${subject.class.board.name}). Practice all chapters with interactive quizzes and detailed revision notes on QuizWeb.`,
    keywords: `${subject.name}, Class ${classNum}, ${subject.class.board.name}, chapters, quizzes, practice`,
    canonical: `/school-study/${boardId}/${classNum}/${subjectSlug}`
  });
}

export default async function SubjectChaptersPage({ params }) {
  const { boardId, classNum, subjectSlug } = params;
  const session = await getServerSession(authOptions);

  const subject = await prisma.schoolSubject.findFirst({
    where: { 
      slug: subjectSlug,
      class: {
        board: { slug: boardId },
        number: parseInt(classNum)
      }
    },
    include: {
      class: {
        include: { board: true }
      },
      chapters: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!subject) return <div className={styles.empty}>Subject not found</div>;

  const progressRows = session?.user?.id
    ? await prisma.schoolProgress.findMany({
        where: { userId: session.user.id, chapter: { subjectId: subject.id } },
        select: { chapterId: true, attempts: true, bestScore: true },
      })
    : [];
  const progressByChapter = new Map(progressRows.map((p) => [p.chapterId, p]));
  const questionCounts = await prisma.schoolQuestion.groupBy({
    by: ["chapterId"],
    where: { chapter: { subjectId: subject.id } },
    _count: { _all: true },
  });
  const qCountByChapter = new Map(questionCounts.map((r) => [r.chapterId, r._count._all]));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.crumbs}>
          <Link href="/school-study">Home</Link>
          <span className={styles.separator}>&gt;</span>
          <Link href={`/school-study/${subject.class.board.slug}`}>{subject.class.board.name}</Link>
          <span className={styles.separator}>&gt;</span>
          <Link href={`/school-study/${subject.class.board.slug}/${classNum}`}>Class {classNum}</Link>
          <span className={styles.separator}>&gt;</span>
          <span className={styles.current}>{subject.name}</span>
        </div>
        <div>
           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
             <div>
               <h1 className={styles.title}>{subject.name} Revision</h1>
               <p className={styles.subtitle}>Complete all chapters to master this subject.</p>
             </div>
             <div className="flex-shrink-0">
                <LiveStudyButton />
             </div>
           </div>
        </div>
      </div>

      <div className={styles.list}>
        {subject.chapters.map((ch, idx) => {
          const totalQ = qCountByChapter.get(ch.id) || 0;
          const p = progressByChapter.get(ch.id) || null;
          const best = p?.bestScore || 0;
          const attempts = p?.attempts || 0;
          const pct = totalQ > 0 ? Math.round((best / totalQ) * 100) : 0;
          const completed = totalQ > 0 && best >= totalQ;
          const status = attempts === 0 ? "Not started" : completed ? "Completed" : "In progress";
          const statusTone = attempts === 0 ? "warn" : completed ? "good" : "info";

          return (
            <Link 
              key={ch.id} 
              href={`/school-study/${subject.class.board.slug}/${classNum}/${subject.slug}/${ch.id}`}
              className={styles.row}
              style={{ textDecoration: 'none' }}
            >
              <div className={styles.rowInfo}>
                <div className={styles.emoji}>
                  {completed ? "✓" : idx + 1}
                </div>
                <div>
                  <div className={styles.name}>{ch.title.includes('Chapter') ? ch.title : `Chapter ${idx + 1}: ${ch.title}`}</div>
                  <div className={styles.desc}>
                    {totalQ} questions • {status} • {pct}% complete
                  </div>
                </div>
              </div>
              <div className={styles.rowMeta}>
                {attempts === 0 ? (
                  <span className={`${styles.pill} ${styles.pillWarn}`}>Not started</span>
                ) : completed ? (
                  <span className={`${styles.pill} ${styles.pillGood}`}>Completed</span>
                ) : (
                  <span className={`${styles.pill} ${styles.pillInfo}`}>In progress</span>
                )}
                <span className={styles.pill} style={{ background: "var(--bg-secondary)" }}>
                  {pct}%
                </span>
                <span className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '12px' }}>Start ➔</span>
              </div>
            </Link>
          );
        })}
      </div>

      {subject.chapters.length === 0 && <div className={styles.empty}>No chapters listed for this subject yet.</div>}
    </div>
  );
}
