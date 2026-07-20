/**
 * explanationGenerator.js
 * Automatically generates contextual explanations for quiz questions
 * when explicit database explanations are not provided.
 */

function isHindiText(text) {
  if (!text || typeof text !== "string") return false;
  return /[\u0900-\u097F]/.test(text);
}

export function getDynamicExplanation(question, isHindi = false) {
  if (!question) return "";

  // Check if an explicit explanation already exists in the requested language
  if (isHindi && question.explanationHi && question.explanationHi.trim() !== "") {
    return question.explanationHi;
  }
  if (!isHindi && question.explanation && question.explanation.trim() !== "") {
    return question.explanation;
  }
  if (question.explanation && question.explanation.trim() !== "") {
    return question.explanation;
  }
  if (question.explanationHi && question.explanationHi.trim() !== "") {
    return question.explanationHi;
  }

  const qText = question.text || question.prompt || "";
  const ansText = question.correctAnswer || question.answer || "";

  // If both text and answer are missing, return generic
  if (!qText && !ansText) {
    return isHindi
      ? "यह अवधारणा विषय के प्रमुख तथ्यों और सिद्धांतों पर आधारित है।"
      : "This response aligns directly with verified domain knowledge and core principles.";
  }

  // Check if the question text itself is primarily in Hindi
  const textInHindi = isHindi || isHindiText(qText) || isHindiText(ansText);

  // Clean up question text if it has leading numbers like "1. " or trailing extra spaces
  const cleanQText = qText.replace(/^\d+[\.\)\-]\s*/, "").trim();
  const cleanAnsText = ansText.trim();

  if (textInHindi) {
    if (cleanQText.includes("कहाँ") || cleanQText.includes("निर्माण") || cleanQText.includes("स्थान")) {
      return `${cleanQText.replace(/[?.,!]/g, "").trim()} का मुख्य स्थान '${cleanAnsText}' है, जो इसके जैविक या भौतिक कार्य से सीधे संबंधित है।`;
    }
    if (cleanQText.includes("किसने") || cleanQText.includes("आविष्कार") || cleanQText.includes("खोज")) {
      return `'${cleanAnsText}' को मुख्य रूप से इस खोज/आविष्कार का श्रेय दिया जाता है, जो विषय का महत्वपूर्ण ऐतिहासिक तथ्य है।`;
    }
    if (cleanAnsText && cleanQText) {
      return `इस प्रश्न का सही और तार्किक उत्तर '${cleanAnsText}' है, जो संबंधित विषय के मुख्य वैज्ञानिक और तथ्यात्मक सिद्धांतों पर आधारित है।`;
    }
    return `सही उत्तर '${cleanAnsText}' है, जो इस विषय का प्रामाणिक तथ्य है।`;
  } else {
    if (cleanQText.toLowerCase().includes("where") || cleanQText.toLowerCase().includes("produced") || cleanQText.toLowerCase().includes("location")) {
      return `The primary location associated with this biological/physical process is '${cleanAnsText}'.`;
    }
    if (cleanQText.toLowerCase().includes("who") || cleanQText.toLowerCase().includes("invented") || cleanQText.toLowerCase().includes("discovered")) {
      return `'${cleanAnsText}' is historically credited with this discovery and major contribution to the field.`;
    }
    if (cleanAnsText && cleanQText) {
      return `'${cleanAnsText}' represents the accurate and scientifically verified 1-liner explanation for this topic.`;
    }
    return `The correct answer is '${cleanAnsText}', established by domain facts.`;
  }
}
