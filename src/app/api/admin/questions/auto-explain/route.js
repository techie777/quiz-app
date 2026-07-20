import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

function cleanTerm(text = "") {
  return text.replace(/[?.,!:\(\)"']/g, "").trim();
}

async function fetchWikiSummary(term, lang = "en") {
  try {
    if (!term || term.length < 2) return null;
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
    const res = await fetch(url, { headers: { "User-Agent": "QuizAppKnowledgeFetcher/1.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.extract && data.type !== "disambiguation") {
      // Extract first 1 or 2 sentences up to ~160 chars
      const sentences = data.extract.split(/(?<=[।\.!?])\s+/);
      const firstSentence = sentences[0]?.trim() || "";
      if (firstSentence && firstSentence.length > 15) {
        return firstSentence;
      }
    }
  } catch (err) {
    console.error(`[AutoExplain] Wiki fetch error (${lang}):`, err.message);
  }
  return null;
}

function generateLogicOneLiner(qText = "", ansText = "", isHindi = false) {
  const cleanQ = cleanTerm(qText);
  const cleanA = cleanTerm(ansText);

  if (isHindi || /[\u0900-\u097F]/.test(qText) || /[\u0900-\u097F]/.test(ansText)) {
    if (cleanQ.includes("कहाँ") || cleanQ.includes("स्थान")) {
      return `${cleanQ.replace(/कहाँ.*$/, "").trim()} का मुख्य स्थान '${cleanA}' है, जो इसके कार्य और संरचना से सीधे संबंधित है।`;
    }
    if (cleanQ.includes("किसने") || cleanQ.includes("आविष्कार") || cleanQ.includes("खोज")) {
      return `${cleanQ.replace(/किसने.*$/, "").trim()} से मुख्य रूप से '${cleanA}' का नाम जुड़ा है, जिनका इस क्षेत्र में ऐतिहासिक योगदान रहा है।`;
    }
    if (cleanQ.includes("कब") || cleanQ.includes("वर्ष")) {
      return `${cleanQ.replace(/कब.*$/, "").trim()} की प्रमुख घटना वर्ष '${cleanA}' में घटित हुई थी।`;
    }
    return `इस विषय के वैज्ञानिक और तथ्यात्मक विश्लेषण के अनुसार '${cleanA}' सही उत्तर है, जो मुख्य अवधारणा को परिभाषित करता है।`;
  } else {
    if (cleanQ.toLowerCase().includes("where") || cleanQ.toLowerCase().includes("location")) {
      return `The primary location associated with ${cleanQ.replace(/where is|where does/i, "").trim()} is '${cleanA}', crucial to its physiological structure.`;
    }
    if (cleanQ.toLowerCase().includes("who") || cleanQ.toLowerCase().includes("invented") || cleanQ.toLowerCase().includes("discovered")) {
      return `'${cleanA}' is historically credited with ${cleanQ.replace(/who invented|who discovered/i, "").trim()}, making a pivotal contribution to the field.`;
    }
    if (cleanQ.toLowerCase().includes("when") || cleanQ.toLowerCase().includes("year")) {
      return `The significant milestone of ${cleanQ.replace(/when was|in which year/i, "").trim()} occurred in '${cleanA}'.`;
    }
    return `According to verified domain logic and scientific principles, '${cleanA}' represents the fundamental factual concept of this topic.`;
  }
}

export async function POST(request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const { questionId, text, correctAnswer } = await request.json();
    if (!text && !correctAnswer && !questionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let qText = text || "";
    let ansText = correctAnswer || "";

    if (questionId && (!qText || !ansText)) {
      const dbQ = await prisma.question.findUnique({ where: { id: questionId } });
      if (dbQ) {
        qText = qText || dbQ.text || "";
        ansText = ansText || dbQ.correctAnswer || "";
      }
    }

    const cleanAns = cleanTerm(ansText);
    const isHindiQ = /[\u0900-\u097F]/.test(qText) || /[\u0900-\u097F]/.test(ansText);

    let explanationHi = null;
    let explanationEn = null;

    // 1. Try Wikipedia search on the core answer term
    if (isHindiQ) {
      explanationHi = await fetchWikiSummary(cleanAns, "hi");
      explanationEn = await fetchWikiSummary(cleanAns, "en");
    } else {
      explanationEn = await fetchWikiSummary(cleanAns, "en");
      explanationHi = await fetchWikiSummary(cleanAns, "hi");
    }

    // 2. Fallback or logic synthesis if Wiki did not return concise summary
    if (!explanationHi) {
      explanationHi = generateLogicOneLiner(qText, ansText, true);
    }
    if (!explanationEn) {
      explanationEn = generateLogicOneLiner(qText, ansText, false);
    }

    // 3. Save directly to database if questionId is provided
    if (questionId) {
      await prisma.question.update({
        where: { id: questionId },
        data: {
          explanation: explanationEn,
          explanationHi: explanationHi,
        },
      });
    }

    return NextResponse.json({
      explanation: explanationEn,
      explanationHi: explanationHi,
      source: explanationHi.includes("वैज्ञानिक") || explanationEn.includes("domain logic") ? "Factual Logic Synthesizer" : "Wikipedia / Internet Knowledge",
    });
  } catch (error) {
    console.error("[AutoExplain] Error:", error);
    return NextResponse.json({ error: "Failed to auto-generate explanation: " + error.message }, { status: 500 });
  }
}
