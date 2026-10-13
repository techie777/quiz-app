import { NextResponse } from "next/server";
import { getB2bTest } from "@/lib/b2bTestStore";

export async function GET(req, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const testCode = resolvedParams?.testCode;
    const test = await getB2bTest(testCode);

    if (!test) {
      return NextResponse.json({ error: "टेस्ट कोड अमान्य है या समाप्त हो चुका है।" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const role = (searchParams.get("role") || "").toLowerCase();

    // 🛡️ ANTI-CHEAT ZERO TRUST: If requested by student, scrub correct answers!
    if (role === "student" || role === "guest") {
      const sanitizedQuestions = (test.questions || []).map((q) => ({
        id: q.id,
        index: q.index,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks,
        negativeMarks: q.negativeMarks
        // correctAnswer and explanation STRIPPED
      }));

      return NextResponse.json({
        ...test,
        questions: sanitizedQuestions
      });
    }

    return NextResponse.json(test);
  } catch (err) {
    console.error("❌ [API] Failed to fetch B2B test:", err);
    return NextResponse.json({ error: "Failed to fetch test details" }, { status: 500 });
  }
}
