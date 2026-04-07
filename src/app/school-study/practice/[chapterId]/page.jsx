import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PracticeClient from "./PracticeClient";

export default async function PracticePage({ params }) {
  const { chapterId } = params;
  const session = await getServerSession(authOptions);

  const chapter = await prisma.schoolChapter.findUnique({
    where: { id: chapterId },
    include: {
      questions: true,
      subject: {
        include: {
          class: {
            include: { board: true }
          }
        }
      }
    }
  });

  if (!chapter) return <div>Chapter not found</div>;

  // Auth Gate: Chapter 1 & 2 (index 0, 1) are free. Others require login.
  if (chapter.sortOrder >= 2 && !session) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/school-study/practice/${chapterId}`)}`);
  }

  return (
    <PracticeClient 
      chapter={chapter} 
      user={session?.user} 
    />
  );
}
