import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";
import styles from "@/styles/SchoolStudy.module.css";

export default async function ClassSubjectsPage({ params }) {
  const session = await getServerSession(authOptions);
  const callbackUrl = `/school-study/${params.boardId}/class/${params.classNumber}`;
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

  const subjects = await prisma.schoolSubject.findMany({
    where: { classId: schoolClass.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.crumbs}>
            School study / {board.name} / Class {schoolClass.number}
          </div>
          <h1 className={styles.title}>Select subject</h1>
          <p className={styles.subtitle}>Choose a subject to see chapter-wise quizzes.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {subjects.map((s) => (
          <Link
            key={s.id}
            href={`/school-study/${board.id}/class/${schoolClass.number}/${s.slug}`}
            className={`${styles.card} glass-card`}
          >
            <div className={styles.cardTitle}>{s.name}</div>
            <div className={styles.cardMeta}>Class {schoolClass.number}</div>
          </Link>
        ))}
      </div>

      {subjects.length === 0 && <div className={styles.empty}>No subjects available.</div>}
    </div>
  );
}

