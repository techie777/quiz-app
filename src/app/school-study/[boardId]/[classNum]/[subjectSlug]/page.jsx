import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateMetaTags } from "@/lib/seo";
import styles from "@/styles/SchoolStudy.module.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LiveStudyButton from "@/components/engine/LiveStudyButton";

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
          const isFree = idx < 2; // Chapter 1 & 2 are free
          const needsLogin = !isFree && !session;
          
          return (
            <Link 
              key={ch.id} 
              href={needsLogin ? `/signin?callbackUrl=${encodeURIComponent(`/school-study/practice/${ch.id}`)}` : `/school-study/practice/${ch.id}`}
              className={styles.row}
              style={{ textDecoration: 'none' }}
            >
              <div className={styles.rowInfo}>
                <div className={styles.emoji}>
                  {idx + 1}
                </div>
                <div>
                  <div className={styles.name}>{ch.title.includes('Chapter') ? ch.title : `Chapter ${idx + 1}: ${ch.title}`}</div>
                  <div className={styles.desc}>Analyze and practice key concepts of this unit.</div>
                </div>
              </div>
              <div className={styles.rowMeta}>
                {isFree ? (
                  <span className={styles.pill} style={{ color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.2)' }}>FREE</span>
                ) : needsLogin ? (
                  <span className={styles.pill} style={{ color: '#4361ee', background: 'rgba(67, 97, 238, 0.1)', border: '1px solid rgba(67, 97, 238, 0.2)' }}>LOCKED</span>
                ) : (
                  <span className={styles.pill} style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>UNLOCKED</span>
                )}
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
