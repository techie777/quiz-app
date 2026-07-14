import { NextResponse } from "next/server";
import { getDetailedExamContent } from "@/lib/govtExamsData";

export async function GET(request, context) {
  try {
    const params = await context.params;
    const slug = params.slug;

    const examData = getDetailedExamContent(slug);

    return NextResponse.json(examData);
  } catch (error) {
    console.error("Error fetching detailed exam content:", error);
    return NextResponse.json({ error: "Exam details not found" }, { status: 404 });
  }
}
