/**
 * shareHelper.js
 * Native Web Share API with clipboard fallback for Categories, Sets, and Questions.
 */
import toast from "react-hot-toast";

export async function copyToClipboard(text, isHindi = false) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(
      isHindi ? "लिंक कॉपी हो गया!" : "Link copied to clipboard!",
      { icon: "📋" }
    );
    return true;
  } catch {
    toast.error(isHindi ? "कॉपी नहीं हो सका" : "Failed to copy link");
    return false;
  }
}

export async function shareQuestion({ question, isHindi = false, customUrl }) {
  if (!question) return;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://quizweb.in";
  const url = customUrl || (typeof window !== "undefined" ? window.location.href : origin);
  const qText = (isHindi && (question.textHi || question.text_hi))
    ? question.textHi || question.text_hi
    : question.text || question.question || "";

  const rawOptions = (isHindi && question.optionsHi && question.optionsHi.length > 0)
    ? question.optionsHi
    : question.options || question.options_list || [];

  const optionsText = rawOptions
    .slice(0, 4)
    .map((opt, i) => `${["A", "B", "C", "D"][i] || i + 1}) ${opt}`)
    .join("\n");

  const invitation = isHindi
    ? "क्या आप इसका सही जवाब दे सकते हैं? QuizWeb पर खेलें:"
    : "Can you answer this question? Challenge yourself on QuizWeb:";

  const shareText = `❓ ${qText}\n\n${optionsText}\n\n👉 ${invitation}\n${url}`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: isHindi ? "QuizWeb सवाल चुनौती" : "QuizWeb Question Challenge",
        text: shareText,
        url: url,
      });
      return true;
    } catch (err) {
      if (err.name === "AbortError") return false;
      return copyToClipboard(url, isHindi);
    }
  } else {
    return copyToClipboard(url, isHindi);
  }
}

export async function shareCategory({ category, isHindi = false }) {
  if (!category) return;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://quizweb.in";
  const url = `${origin}/category/${category.slug || category.id}`;
  const title = (isHindi && category.topicHi) ? category.topicHi : category.topic || category.name || "Quiz";
  const text = isHindi
    ? `QuizWeb पर "${title}" क्विज़ खेलें और अपना ज्ञान परखें!`
    : `Play the "${title}" quiz on QuizWeb and test your knowledge!`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: `${title} - QuizWeb`,
        text: text,
        url: url,
      });
      return true;
    } catch (err) {
      if (err.name === "AbortError") return false;
      return copyToClipboard(url, isHindi);
    }
  } else {
    return copyToClipboard(url, isHindi);
  }
}

export async function shareQuizResult({ score, total, isHindi = false }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://quizweb.in";
  const pct = Math.round((score / total) * 100);
  const text = isHindi
    ? `मैंने QuizWeb पर ${score}/${total} (${pct}%) स्कोर किया! क्या आप मुझे हरा सकते हैं?`
    : `I scored ${score}/${total} (${pct}%) on QuizWeb! Can you beat my score?`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: "QuizWeb Score Challenge",
        text: text,
        url: origin,
      });
      return true;
    } catch (err) {
      if (err.name === "AbortError") return false;
      return copyToClipboard(origin, isHindi);
    }
  } else {
    return copyToClipboard(origin, isHindi);
  }
}

export async function shareQuiz({ title, url, id, isHindi = false }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://quizweb.in";
  const targetUrl = url || (id ? `${origin}/quiz/${id}` : origin);
  const shareTitle = title || (isHindi ? "QuizWeb क्विज़" : "QuizWeb Quiz");
  const text = isHindi
    ? `QuizWeb पर "${shareTitle}" क्विज़ खेलें!\n${targetUrl}`
    : `Play the "${shareTitle}" quiz on QuizWeb!\n${targetUrl}`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: `${shareTitle} - QuizWeb`,
        text: text,
        url: targetUrl,
      });
      return true;
    } catch (err) {
      if (err.name === "AbortError") return false;
      return copyToClipboard(targetUrl, isHindi);
    }
  } else {
    return copyToClipboard(targetUrl, isHindi);
  }
}

/**
 * Task 3.7 & Rule 5: Challenge a friend with identical seed-based shuffle
 */
export async function shareSetChallenge({ setId, setTitle, seed, score, total, isHindi = false }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://quizweb.in";
  const challengeSeed = seed || Math.floor(100000 + Math.random() * 900000);
  const targetUrl = `${origin}/quiz/${setId}?seed=${challengeSeed}${score !== undefined ? `&challengerScore=${score}` : ""}`;
  
  const text = isHindi
    ? `⚔️ मैंने QuizWeb पर "${setTitle}" क्विज़ में चुनौती दी है! क्या आप मुझे हरा सकते हैं? अभी खेलें:\n${targetUrl}`
    : `⚔️ I challenge you on "${setTitle}" on QuizWeb! Can you beat my score? Play now:\n${targetUrl}`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: `${setTitle} - Quiz Duel`,
        text: text,
        url: targetUrl,
      });
      return true;
    } catch (err) {
      if (err.name === "AbortError") return false;
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, "_blank");
      return true;
    }
  } else {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
    return true;
  }
}


