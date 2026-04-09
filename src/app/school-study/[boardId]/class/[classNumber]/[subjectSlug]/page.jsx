import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";

export default async function SubjectChaptersPage({ params }) {
  await ensureSchoolSeed();

  const classNumber = Number(params.classNumber);
  if (!Number.isFinite(classNumber)) redirect(`/school-study/${params.boardId}`);

  const board = await prisma.schoolBoard.findUnique({
    where: { id: params.boardId },
    select: { id: true, name: true, slug: true, hidden: true },
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

  // Legacy route with explicit "class" segment. Redirect to canonical route without "class".
  redirect(`/school-study/${board.slug}/${classNumber}/${subject.slug}`);
}

