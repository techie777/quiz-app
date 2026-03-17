import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";
import styles from "@/styles/SchoolStudy.module.css";

export default async function SchoolStudyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.isAdmin) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/school-study")}`);
  }

  await ensureSchoolSeed();
  const boards = await prisma.schoolBoard.findMany({
    where: { hidden: false },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>School study</h1>
          <p className={styles.subtitle}>Select a board to start chapter-wise practice.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {boards.map((b) => (
          <Link key={b.id} href={`/school-study/${b.id}`} className={`${styles.card} glass-card`}>
            <div className={styles.cardTitle}>{b.name}</div>
            <div className={styles.cardMeta}>Boards</div>
          </Link>
        ))}
      </div>

      {boards.length === 0 && <div className={styles.empty}>No boards available.</div>}
    </div>
  );
}
