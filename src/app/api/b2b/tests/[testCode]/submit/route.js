import { NextResponse } from "next/server";
import { getB2bTest, saveB2bTest } from "@/lib/b2bTestStore";

export async function POST(req, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const testCode = resolvedParams?.testCode;
    const body = await req.json();
    const {
      studentId,
      studentName,
      rollNumber,
      answers = [],
      tabSwitches = 0
    } = body;

    const test = await getB2bTest(testCode);
    if (!test) {
      return NextResponse.json({ error: "टेस्ट कोड अमान्य है।" }, { status: 404 });
    }

    const marksCorrect = Number(test.marksCorrect) || 4;
    const marksNegative = Number(test.marksNegative) || 0;
    const testQuestions = test.questions || [];

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const answersMap = new Map();
    (answers || []).forEach((a) => {
      const key = a.questionId || (typeof a.index === "number" ? a.index : null);
      if (key !== null) answersMap.set(String(key), a);
    });

    // Evaluate each question authoritatively on server
    const evaluatedQuestions = testQuestions.map((q, idx) => {
      const studentAns = answersMap.get(String(q.id)) || answersMap.get(String(idx));
      const selected = studentAns?.selectedOption ? String(studentAns.selectedOption).trim().toUpperCase() : null;
      const actualCorrect = String(q.correctAnswer || "A").trim().toUpperCase();

      // Check letter match or option text match
      let isCorrect = false;
      let isAttempted = false;

      if (selected) {
        isAttempted = true;
        if (selected === actualCorrect) {
          isCorrect = true;
        } else {
          // If option text was passed instead of letter
          const optLetter = ["A", "B", "C", "D"].find(
            (letter, lIdx) => q.options?.[lIdx] && q.options[lIdx].trim().toUpperCase() === selected
          );
          if (optLetter === actualCorrect) isCorrect = true;
        }
      }

      let marksEarned = 0;
      let status = "SKIPPED";

      if (!isAttempted) {
        skippedCount += 1;
        status = "SKIPPED";
        marksEarned = 0;
      } else if (isCorrect) {
        correctCount += 1;
        status = "CORRECT";
        marksEarned = marksCorrect;
        totalScore += marksCorrect;
      } else {
        incorrectCount += 1;
        status = "INCORRECT";
        marksEarned = -marksNegative;
        totalScore -= marksNegative;
      }

      return {
        id: q.id,
        index: idx,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || null,
        selectedOption: selected,
        isCorrect,
        status,
        marksEarned
      };
    });

    const totalQuestions = testQuestions.length;
    const totalPossibleMarks = test.totalMarks || (totalQuestions * marksCorrect);
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const percentage = totalPossibleMarks > 0 ? Math.max(0, Math.round((totalScore / totalPossibleMarks) * 100)) : 0;

    const submissionResult = {
      testCode: test.testCode,
      studentId: studentId || `student_${Date.now()}`,
      studentName: studentName || "Student",
      rollNumber: rollNumber || "N/A",
      totalScore,
      totalPossibleMarks,
      percentage,
      accuracy,
      correctCount,
      incorrectCount,
      skippedCount,
      totalQuestions,
      tabSwitches: Number(tabSwitches) || 0,
      submittedAt: new Date().toISOString(),
      evaluatedQuestions
    };

    // Store submission in test record if needed
    test.submissions = test.submissions || [];
    const existingIdx = test.submissions.findIndex((s) => s.studentId === submissionResult.studentId);
    if (existingIdx !== -1) {
      test.submissions[existingIdx] = submissionResult;
    } else {
      test.submissions.push(submissionResult);
    }
    await saveB2bTest(test);

    return NextResponse.json({
      success: true,
      result: submissionResult
    });
  } catch (err) {
    console.error("❌ [API] Failed to evaluate B2B test submission:", err);
    return NextResponse.json({ error: "Failed to evaluate exam submission" }, { status: 500 });
  }
}
