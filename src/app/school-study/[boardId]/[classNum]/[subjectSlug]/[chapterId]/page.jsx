import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PracticeClient from "@/app/school-study/practice/[chapterId]/PracticeClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const revalidate = 3600;

export default async function NestedPracticePage({ params }) {
  const { boardId, classNum, subjectSlug, chapterId } = params;
  const session = await getServerSession(authOptions);

  const chapter = await prisma.schoolChapter.findFirst({
    where: {
      id: chapterId,
      subject: {
        slug: subjectSlug,
        class: { number: Number(classNum), board: { slug: boardId } },
      },
    },
    include: {
      questions: true,
      subject: { include: { class: { include: { board: true } } } },
    },
  });

  if (!chapter) notFound();

  return <PracticeClient chapter={chapter} user={session?.user || null} />;
}

