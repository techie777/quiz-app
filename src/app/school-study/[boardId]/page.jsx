import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";
import styles from "@/styles/SchoolStudy.module.css";

export default async function BoardClassesPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.isAdmin) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/school-study/${params.boardId}`)}`);
  }

  await ensureSchoolSeed();

  const board = await prisma.schoolBoard.findUnique({
    where: { id: params.boardId },
    select: { id: true, name: true, hidden: true },
  });
  if (!board || board.hidden) redirect("/school-study");

  const classes = await prisma.schoolClass.findMany({
    where: { boardId: board.id },
    orderBy: { number: "asc" },
    select: { id: true, number: true },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.crumbs}>School study / {board.name}</div>
          <h1 className={styles.title}>Select class</h1>
          <p className={styles.subtitle}>Choose a class to see subjects and chapters.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {classes.map((c) => (
          <Link
            key={c.id}
            href={`/school-study/${board.id}/class/${c.number}`}
            className={`${styles.card} glass-card`}
          >
            <div className={styles.cardTitle}>Class {c.number}</div>
            <div className={styles.cardMeta}>{board.name}</div>
          </Link>
        ))}
      </div>

      {classes.length === 0 && <div className={styles.empty}>No classes available.</div>}
    </div>
  );
}

