import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";
import styles from "@/styles/SchoolStudy.module.css";

export default async function SchoolStudyPage() {
  // session is optional for landing page
  const session = await getServerSession(authOptions);
  
  await ensureSchoolSeed();
  const boards = await prisma.schoolBoard.findMany({
    where: { hidden: false },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.crumbs}>
          <Link href="/">Home</Link> / School study
        </div>
        <div>
          <h1 className={styles.title}>School Revision</h1>
          <p className={styles.subtitle}>Chapter-wise practice for Class 6-12.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {boards.map((b) => (
          <Link key={b.id} href={`/school-study/${b.slug}`} className={`${styles.card} glass-card`}>
            <div className={styles.cardTitle}>{b.name}</div>
            <div className={styles.cardMeta}>Academic Board</div>
            <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>➔</div>
          </Link>
        ))}
      </div>

      {boards.length === 0 && <div className={styles.empty}>No boards available.</div>}
    </div>
  );
}
