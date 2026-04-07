import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import styles from "@/styles/SchoolStudy.module.css";
import Link from "next/link";

export default async function SchoolDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/school-study/dashboard");
  }

  const progress = await prisma.schoolProgress.findMany({
    where: { userId: session.user.id },
    include: {
      chapter: {
        include: {
          subject: true
        }
      }
    }
  });

  const attempts = await prisma.chapterAttempt.findMany({
    where: { userId: session.user.id }
  });

  // Calculate Metrics
  const totalCompleted = progress.filter(p => p.bestScore > 0).length;
  const avgScore = progress.length > 0 
    ? (progress.reduce((acc, p) => acc + (p.bestScore / p.chapter.id.length), 0) / progress.length * 100).toFixed(1) 
    : 0; 
  // Wait, the above avgScore calc is wrong because I don't store maxScore in SchoolProgress easily. 
  // Let's use attempts for more accurate scoring.
  
  const totalCorrect = attempts.reduce((acc, a) => acc + a.score, 0);
  const totalQuestions = attempts.reduce((acc, a) => acc + a.maxScore, 0);
  const realAvgScore = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : 0;
  
  const totalTimeSeconds = attempts.reduce((acc, a) => acc + a.timeSpent, 0);
  const timeSpentFormatted = `${Math.floor(totalTimeSeconds / 60)}m ${totalTimeSeconds % 60}s`;

  // Strengths & Weaknesses (Subject level)
  const subjectStats = progress.reduce((acc, p) => {
    const sName = p.chapter.subject.name;
    acc[sName] = acc[sName] || { correct: 0, total: 0 };
    acc[sName].correct += p.bestScore;
    // We need maxScore. Assuming average 3 for now if not stored, but better to fetch from chapter.
    return acc;
  }, {});

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Learning Dashboard</h1>
          <p className={styles.subtitle}>Track your revision progress and performance.</p>
        </div>
        <Link href="/school-study" className="btn-primary">Continue Practice</Link>
      </div>

      <div className={styles.grid}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700 }}>CHAPTERS COMPLETED</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '10px 0' }}>{totalCompleted}</div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>Keep it up!</div>
        </div>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700 }}>AVERAGE SCORE</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '10px 0' }}>{realAvgScore}%</div>
          <div style={{ fontSize: '0.8rem', color: realAvgScore > 70 ? '#16a34a' : '#f59e0b' }}>
            {realAvgScore > 70 ? "Excellent mastery" : "Requires more revision"}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700 }}>REVISION TIME</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '10px 0' }}>{timeSpentFormatted}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total time focused</div>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2 className={styles.title} style={{ fontSize: '1.4rem' }}>Recent Activity</h2>
        <div className={styles.list} style={{ marginTop: '20px' }}>
          {attempts.slice().reverse().slice(0, 5).map(attempt => (
             <div key={attempt.id} className={`${styles.row} glass-card`}>
                <div className={styles.rowInfo}>
                   <span className={styles.emoji}>📅</span>
                   <div>
                      <span className={styles.name}>Score: {attempt.score}/{attempt.maxScore}</span>
                      <span className={styles.desc}>
                         {new Date(attempt.createdAt).toLocaleDateString()} at {new Date(attempt.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                   </div>
                </div>
                <div className={styles.rowMeta}>
                   <span className={styles.pill}>{((attempt.score/attempt.maxScore)*100).toFixed(0)}%</span>
                </div>
             </div>
          ))}
          {attempts.length === 0 && <p className={styles.empty}>No practice sessions recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
