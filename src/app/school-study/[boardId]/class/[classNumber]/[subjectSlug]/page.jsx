import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";
import styles from "@/styles/SchoolStudy.module.css";

export default async function SubjectChaptersPage({ params }) {
  const session = await getServerSession(authOptions);
  const callbackUrl = `/school-study/${params.boardId}/class/${params.classNumber}/${params.subjectSlug}`;
  if (!session?.user?.id || session.user.isAdmin) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  await ensureSchoolSeed();

  const classNumber = Number(params.classNumber);
  if (!Number.isFinite(classNumber)) redirect(`/school-study/${params.boardId}`);

  const board = await prisma.schoolBoard.findUnique({
    where: { id: params.boardId },
    select: { id: true, name: true, hidden: true },
  });
  if (!board || board.hidden) redirect("/school-study");

  const schoolClass = await prisma.schoolClass.findUnique({
    where: { boardId_number: { boardId: board.id, number: classNumber } },
    select: { id: true, number: true },
  });
  if (!schoolClass) redirect(`/school-study/${board.id}`);

  const subject = await prisma.schoolSubject.findUnique({
    where: { classId_slug: { classId: schoolClass.id, slug: params.subjectSlug } },
    select: { id: true, name: true, slug: true },
  });
  if (!subject) redirect(`/school-study/${board.id}/class/${schoolClass.number}`);

  const chapters = await prisma.schoolChapter.findMany({
    where: { subjectId: subject.id },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      sortOrder: true,
      _count: { select: { questions: true } },
      progress: {
        where: { userId: session.user.id },
        select: { attempts: true, bestScore: true, lastScore: true, lastAttemptAt: true },
      },
    },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.crumbs}>
            School study / {board.name} / Class {schoolClass.number} / {subject.name}
          </div>
          <h1 className={styles.title}>Chapters</h1>
          <p className={styles.subtitle}>Chapter-wise quizzes with progress tracking.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {chapters.map((c) => {
          const p = c.progress[0] || null;
          const total = c._count.questions;
          const hasAttempt = (p?.attempts || 0) > 0;
          return (
            <Link
              key={c.id}
              href={`/school-study/${board.id}/class/${schoolClass.number}/${subject.slug}/${c.id}`}
              className={`${styles.card} glass-card`}
            >
              <div className={styles.cardTitle}>{c.title}</div>
              <div className={styles.cardMeta}>{total} questions</div>
              <div className={styles.pillRow}>
                {!hasAttempt ? (
                  <span className={`${styles.pill} ${styles.pillWarn}`}>Not started</span>
                ) : (
                  <span className={`${styles.pill} ${styles.pillGood}`}>Best {p.bestScore}/{total}</span>
                )}
                {hasAttempt && <span className={styles.pill}>Attempts {p.attempts}</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {chapters.length === 0 && <div className={styles.empty}>No chapters available.</div>}
    </div>
  );
}

