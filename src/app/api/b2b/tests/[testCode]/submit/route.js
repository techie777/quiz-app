import { NextResponse } from "next/server";
import { getB2bTest, saveB2bTest } from "@/lib/b2bTestStore";

export async function POST(req, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const testCode = resolvedParams?.testCode;
    const body = await req.json();
    const {
      studentId,
      userId,
      studentName,
      userName,
      rollNumber,
      studentClass,
      answers,
      tabSwitches = 0,
      startedAt,
      completedAt,
      timeTakenSeconds
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

    // Normalize answers to an array of objects
    let normalizedAnswers = [];
    if (Array.isArray(answers)) {
      normalizedAnswers = answers;
    } else if (answers && typeof answers === "object") {
      normalizedAnswers = Object.entries(answers).map(([key, val]) => {
        const isNumeric = !isNaN(Number(key));
        return {
          index: isNumeric ? Number(key) : undefined,
          questionId: isNumeric ? undefined : key,
          selectedOption: typeof val === "object" ? val?.selectedOption : val
        };
      });
    }

    const answersMap = new Map();
    normalizedAnswers.forEach((a) => {
      if (a.questionId) answersMap.set(String(a.questionId), a);
      if (typeof a.index === "number" && !isNaN(a.index)) answersMap.set(String(a.index), a);
    });

    // Evaluate each question authoritatively on server
    const evaluatedQuestions = testQuestions.map((q, idx) => {
      const opts = (q.options && q.options.length > 0)
        ? q.options
        : [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean);

      // 1. Resolve master correct answer letter & text
      const rawCorrect = String(q.correctAnswer || q.correct || "A").trim();
      let correctLetter = "A";
      let correctText = "";

      if (["A", "B", "C", "D"].includes(rawCorrect.toUpperCase())) {
        correctLetter = rawCorrect.toUpperCase();
        const cIdx = ["A", "B", "C", "D"].indexOf(correctLetter);
        correctText = opts[cIdx] || "";
      } else {
        correctText = rawCorrect;
        const foundIdx = opts.findIndex(
          (o) => o && String(o).trim().toLowerCase() === rawCorrect.toLowerCase()
        );
        if (foundIdx >= 0) {
          correctLetter = String.fromCharCode(65 + foundIdx);
        }
      }

      // 2. Resolve student answer letter & text
      const studentAns = answersMap.get(String(q.id)) || answersMap.get(String(idx));
      const rawSelected = studentAns?.selectedOption ? String(studentAns.selectedOption).trim() : null;
      let selectedLetter = null;
      let selectedText = "";

      if (rawSelected && rawSelected !== "SKIP") {
        if (["A", "B", "C", "D"].includes(rawSelected.toUpperCase())) {
          selectedLetter = rawSelected.toUpperCase();
          const sIdx = ["A", "B", "C", "D"].indexOf(selectedLetter);
          selectedText = opts[sIdx] || "";
        } else {
          selectedText = rawSelected;
          const foundIdx = opts.findIndex(
            (o) => o && String(o).trim().toLowerCase() === rawSelected.toLowerCase()
          );
          if (foundIdx >= 0) {
            selectedLetter = String.fromCharCode(65 + foundIdx);
          } else {
            selectedLetter = rawSelected;
          }
        }
      }

      // 3. Precise comparison
      const isAttempted = Boolean(selectedLetter);
      let isCorrect = false;

      if (isAttempted) {
        if (selectedLetter === correctLetter) {
          isCorrect = true;
        } else if (selectedText && correctText && selectedText.toLowerCase() === correctText.toLowerCase()) {
          isCorrect = true;
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
        id: q.id || `q_${idx}`,
        index: idx,
        questionText: q.questionText,
        options: opts,
        correctAnswer: correctLetter,
        correctAnswerText: correctText,
        selectedOption: selectedLetter,
        selectedOptionText: selectedText,
        isCorrect,
        status,
        marksEarned,
        explanation: q.explanation || null
      };
    });

    const totalQuestions = testQuestions.length;
    const totalPossibleMarks = test.totalMarks || (totalQuestions * marksCorrect);
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const percentage = totalPossibleMarks > 0 ? Math.max(0, Math.round((totalScore / totalPossibleMarks) * 100)) : 0;

    // Academic Grade calculation (CBSE / Competitive Exam standard)
    let grade = "E";
    let gradeRemark = "पुनः प्रयास आवश्यक (Needs Improvement)";
    if (percentage >= 91) {
      grade = "A1";
      gradeRemark = "उत्कृष्ट (Outstanding)";
    } else if (percentage >= 81) {
      grade = "A2";
      gradeRemark = "अति उत्तम (Excellent)";
    } else if (percentage >= 71) {
      grade = "B1";
      gradeRemark = "बहुत अच्छा (Very Good)";
    } else if (percentage >= 61) {
      grade = "B2";
      gradeRemark = "अच्छा (Good)";
    } else if (percentage >= 51) {
      grade = "C1";
      gradeRemark = "सामान्य (Average)";
    } else if (percentage >= 41) {
      grade = "C2";
      gradeRemark = "संतोषजनक (Satisfactory)";
    } else if (percentage >= 33) {
      grade = "D";
      gradeRemark = "उत्तीर्ण (Pass)";
    }

    const submissionResult = {
      testCode: test.testCode,
      studentId: studentId || userId || `student_${Date.now()}`,
      userId: studentId || userId || `student_${Date.now()}`,
      studentName: studentName || userName || "Student",
      userName: studentName || userName || "Student",
      rollNumber: rollNumber || "N/A",
      studentClass: studentClass || "N/A",
      totalScore,
      totalPossibleMarks,
      percentage,
      grade,
      gradeRemark,
      accuracy,
      correctCount,
      incorrectCount,
      skippedCount,
      totalQuestions,
      tabSwitches: Number(tabSwitches) || 0,
      timeTakenSeconds: Number(timeTakenSeconds) || 0,
      startedAt: startedAt || null,
      completedAt: completedAt || new Date().toISOString(),
      submittedAt: completedAt || new Date().toISOString(),
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
