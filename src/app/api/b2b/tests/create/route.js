import { NextResponse } from "next/server";
import { saveB2bTest, generateTestCode } from "@/lib/b2bTestStore";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      testTitle,
      instituteName,
      subject,
      batchName,
      timingType = "TOTAL_EXAM_TIMER", // "TOTAL_EXAM_TIMER" | "PER_QUESTION_TIMER"
      durationMinutes = 20,
      perQuestionSeconds = 45,
      marksCorrect = 4,
      marksNegative = 1,
      shuffleQuestions = true,
      shuffleOptions = true,
      requireRollNumber = true,
      tabSwitchLimit = 3,
      allowStudentChat = false,
      questions = []
    } = body;

    if (!testTitle || !testTitle.trim()) {
      return NextResponse.json({ error: "टेस्ट का नाम (Test Title) आवश्यक है।" }, { status: 400 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "कम से कम 1 प्रश्न जोड़ना अनिवार्य है।" }, { status: 400 });
    }

    // Sanitize and format questions
    const sanitizedQuestions = questions.map((q, idx) => {
      const qText = q.questionText || q.question || q.text || `Question ${idx + 1}`;
      const optA = q.optionA || q.options?.[0] || "";
      const optB = q.optionB || q.options?.[1] || "";
      const optC = q.optionC || q.options?.[2] || "";
      const optD = q.optionD || q.options?.[3] || "";
      
      let correct = String(q.correctAnswer || q.correct || "A").trim().toUpperCase();
      if (!["A", "B", "C", "D"].includes(correct)) {
        // If option text was given as correct answer, map to letter
        if (correct === optA.trim().toUpperCase()) correct = "A";
        else if (correct === optB.trim().toUpperCase()) correct = "B";
        else if (correct === optC.trim().toUpperCase()) correct = "C";
        else if (correct === optD.trim().toUpperCase()) correct = "D";
        else correct = "A";
      }

      const qMarks = Number(q.marks) || Number(marksCorrect) || 4;
      const qNeg = typeof q.negativeMarks !== "undefined" ? Number(q.negativeMarks) : Number(marksNegative) || 0;

      return {
        id: `q_${idx + 1}_${Date.now()}`,
        index: idx,
        questionText: qText,
        options: [optA, optB, optC, optD].filter(Boolean),
        correctAnswer: correct,
        marks: qMarks,
        negativeMarks: qNeg,
        explanation: q.explanation || null
      };
    });

    const prefix = (instituteName || "TEST").replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "EXAM";
    const testCode = generateTestCode(prefix);

    const testRecord = {
      testCode,
      testTitle: testTitle.trim(),
      instituteName: (instituteName || "Coaching Institute").trim(),
      subject: (subject || "General").trim(),
      batchName: (batchName || "Batch 1").trim(),
      timingType,
      durationMinutes: Number(durationMinutes) || 20,
      perQuestionSeconds: Number(perQuestionSeconds) || 45,
      marksCorrect: Number(marksCorrect) || 4,
      marksNegative: Number(marksNegative) || 0,
      shuffleQuestions: Boolean(shuffleQuestions),
      shuffleOptions: Boolean(shuffleOptions),
      requireRollNumber: Boolean(requireRollNumber),
      tabSwitchLimit: Number(tabSwitchLimit) || 3,
      allowStudentChat: Boolean(allowStudentChat),
      questionsCount: sanitizedQuestions.length,
      totalMarks: sanitizedQuestions.reduce((acc, q) => acc + q.marks, 0),
      questions: sanitizedQuestions
    };

    const saved = await saveB2bTest(testRecord);

    const origin = req.nextUrl?.origin || "http://localhost:3000";
    const studentUrl = `${origin}/t/${saved.testCode}`;
    const hostWarRoomUrl = `${origin}/live/${saved.testCode}?is_host=true&b2b=true`;

    return NextResponse.json({
      success: true,
      testCode: saved.testCode,
      studentUrl,
      hostWarRoomUrl,
      test: saved
    });
  } catch (err) {
    console.error("❌ [API] Failed to create B2B test:", err);
    return NextResponse.json({ error: "Failed to create live test room" }, { status: 500 });
  }
}
