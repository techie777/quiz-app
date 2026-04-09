import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function PracticePage({ params }) {
  const { chapterId } = params;

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

  // Compatibility route: redirect old URL to canonical nested route.
  redirect(`/school-study/${chapter.subject.class.board.slug}/${chapter.subject.class.number}/${chapter.subject.slug}/${chapter.id}`);
}
