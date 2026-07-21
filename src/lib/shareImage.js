import toast from "react-hot-toast";

/**
 * Generate a branded, attractive, expert-designed share image for any quiz entity
 * Modes supported: 'question', 'quiz', 'result'
 * Returns a Blob (image/png).
 */
export async function generateCommonShareImage({
  type = "question",
  title = "🧠 QuizWeb",
  subtitle = "CHALLENGE OF THE DAY",
  questionText = "",
  options = [],
  quizTitle = "",
  quizDesc = "",
  score = 0,
  total = 0,
  percentage = 0,
  questionCount = 0,
  difficulty = "Medium",
  quizUrl = "",
}) {
  const W = 1080;
  const H = 1080;
  const PAD = 60;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // === Background: Premium Mesh Vibrant Gradient ===
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0f172a");   // Midnight navy
  bg.addColorStop(0.4, "#312e81"); // Deep indigo
  bg.addColorStop(0.8, "#581c87"); // Royal purple
  bg.addColorStop(1, "#701a75");   // Vibrant fuchsia
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // === Ambient Glowing Orbs ===
  ctx.globalCompositeOperation = "screen";
  const drawOrb = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  drawOrb(W * 0.2, H * 0.2, 500, "rgba(99, 102, 241, 0.4)");
  drawOrb(W * 0.85, H * 0.65, 600, "rgba(236, 72, 153, 0.35)");
  drawOrb(W * 0.5, H * 0.9, 450, "rgba(245, 158, 11, 0.25)");
  ctx.globalCompositeOperation = "source-over";

  // === Header Branding ===
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 48px 'Outfit', 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🧠 QuizWeb", W / 2, 85);

  ctx.font = "700 22px 'Inter', sans-serif";
  ctx.fillStyle = "#38bdf8"; // Sky 400
  ctx.fillText(subtitle.toUpperCase(), W / 2, 125);

  // === Main Glass Card ===
  const cardX = PAD;
  const cardY = 160;
  const cardW = W - PAD * 2;
  
  // Calculate dynamic height for question card based on text length
  let dynamicCardH = 460;
  if (type === "question") {
    ctx.font = "bold 32px 'Inter', sans-serif";
    const textLines = getWrappedTextLines(ctx, questionText || "Can you solve this question?", cardW - 80);
    dynamicCardH = 120 + (textLines.length * 46) + 40; // Base + line heights + bottom padding
    if (dynamicCardH < 220) dynamicCardH = 220; // Minimum height
  } else if (type === "result") {
    dynamicCardH = 520;
  }
  const cardH = dynamicCardH;

  // Outer Glow & Shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;

  // Card Body (White with sleek opacity)
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (type === "question") {
    // === Question Card Content ===
    ctx.fillStyle = "#4f46e5";
    ctx.font = "800 20px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CHALLENGE QUESTION", W / 2, cardY + 50);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 32px 'Inter', sans-serif";
    ctx.textAlign = "center";
    wrapText(ctx, questionText || "Can you solve this question?", W / 2, cardY + 120, cardW - 80, 46);

    // === Options Grid ===
    const labels = ["A", "B", "C", "D"];
    const optStartY = cardY + cardH + 40;
    const optW = (cardW - 30) / 2;
    const optH = 90;
    const gap = 30;

    (options || []).slice(0, 4).forEach((opt, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = cardX + col * (optW + gap);
      const y = optStartY + row * (optH + gap);

      // Option Glass Box
      ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
      roundRect(ctx, x, y, optW, optH, 22);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, optW, optH, 22);
      ctx.stroke();

      // Circle Indicator
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x + 40, y + optH / 2, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#4f46e5";
      ctx.font = "800 20px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(labels[i] || "", x + 40, y + optH / 2 + 7);

      // Option Text
      ctx.font = "600 20px 'Inter', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      const maxTextW = optW - 95;
      const truncated = truncateText(ctx, typeof opt === "string" ? opt : String(opt || ""), maxTextW);
      ctx.fillText(truncated, x + 78, y + optH / 2 + 7);
    });
  } else if (type === "result") {
    // === Result Card Content ===
    ctx.fillStyle = "#f59e0b";
    ctx.font = "800 22px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏆 QUIZ PERFORMANCE REPORT", W / 2, cardY + 60);

    ctx.fillStyle = "#1e293b";
    ctx.font = "800 36px 'Outfit', 'Inter', sans-serif";
    ctx.textAlign = "center";
    const displayTopic = truncateText(ctx, quizTitle || "General Knowledge Quiz", cardW - 80);
    ctx.fillText(displayTopic, W / 2, cardY + 125);

    // Big Circle Score
    const circleX = W / 2;
    const circleY = cardY + 265;
    const circleR = 95;

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = percentage >= 80 ? "#10b981" : percentage >= 50 ? "#f59e0b" : "#6366f1";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "900 48px 'Outfit', 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${percentage}%`, circleX, circleY + 16);

    // Stats Bar
    ctx.fillStyle = "#334155";
    ctx.font = "700 26px 'Inter', sans-serif";
    ctx.fillText(`Score: ${score} / ${total} Correct`, W / 2, cardY + 415);

    ctx.fillStyle = "#64748b";
    ctx.font = "600 20px 'Inter', sans-serif";
    ctx.fillText(
      percentage >= 80 ? "🌟 Exceptional Mastery! Can you beat this score?" : "⚡ Great Challenge! Think you can do better?",
      W / 2,
      cardY + 460
    );
  } else if (type === "quiz") {
    // === Quiz Overview Card Content ===
    ctx.fillStyle = "#4f46e5";
    ctx.font = "800 22px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔥 FEATURED QUIZ CHALLENGE", W / 2, cardY + 65);

    ctx.fillStyle = "#0f172a";
    ctx.font = "800 44px 'Outfit', 'Inter', sans-serif";
    ctx.textAlign = "center";
    wrapText(ctx, quizTitle || "Interactive Quiz", W / 2, cardY + 140, cardW - 80, 52);

    if (quizDesc) {
      ctx.fillStyle = "#475569";
      ctx.font = "500 24px 'Inter', sans-serif";
      ctx.textAlign = "center";
      wrapText(ctx, quizDesc, W / 2, cardY + 245, cardW - 100, 36);
    }

    // Stats Pills
    const pillW = 200;
    const pillH = 60;
    const pillY = cardY + cardH - 100;
    
    // Pill 1: Q Count
    ctx.fillStyle = "#e0e7ff";
    roundRect(ctx, W / 2 - pillW - 15, pillY, pillW, pillH, 30);
    ctx.fill();
    ctx.fillStyle = "#4338ca";
    ctx.font = "700 20px 'Inter', sans-serif";
    ctx.fillText(`📝 ${questionCount || 10} Questions`, W / 2 - pillW / 2 - 15, pillY + 37);

    // Pill 2: Difficulty
    ctx.fillStyle = "#fef3c7";
    roundRect(ctx, W / 2 + 15, pillY, pillW, pillH, 30);
    ctx.fill();
    ctx.fillStyle = "#b45309";
    ctx.font = "700 20px 'Inter', sans-serif";
    ctx.fillText(`⚡ ${difficulty || "All Levels"}`, W / 2 + pillW / 2 + 15, pillY + 37);
  }

  // === Footer Call to Action ===
  const footerY = H - 155;

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 30px 'Outfit', 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Ready to test your knowledge?", W / 2, footerY);

  ctx.font = "600 20px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillText("Join thousands playing live right now:", W / 2, footerY + 36);

  // URL Box
  const urlH = 64;
  const displayUrl = quizUrl || (typeof window !== "undefined" ? window.location.origin : "https://quizweb.in");
  const urlW = Math.min(W - 100, ctx.measureText(displayUrl).width + 90);
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  roundRect(ctx, (W - urlW) / 2, footerY + 56, urlW, urlH, 20);
  ctx.fill();

  ctx.strokeStyle = "rgba(251, 191, 36, 0.6)"; // Amber glow border
  ctx.lineWidth = 2;
  roundRect(ctx, (W - urlW) / 2, footerY + 56, urlW, urlH, 20);
  ctx.stroke();

  ctx.font = "700 26px 'monospace', 'Inter', sans-serif";
  ctx.fillStyle = "#fbbf24"; // Amber 400
  ctx.fillText(displayUrl, W / 2, footerY + 98);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

/**
 * Share a question using Web Share API or WhatsApp
 */
export async function shareQuestion(question, quizId) {
  if (!question) return;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const quizUrl = `${baseUrl}${quizId ? `/category/${quizId}` : "/"}`;

  const optionsText = Array.isArray(question.options)
    ? question.options.map((o, idx) => `${String.fromCharCode(65 + idx)}) ${o}`).join("\n")
    : "";

  const shareMessage = `❓ *QuizWeb Question Challenge*:\n"${question.text}"\n\nOptions:\n${optionsText}\n\nCan you solve this? Try now: ${quizUrl}`;

  toast.success("Preparing share...", { icon: "📲" });

  try {
    const blob = await generateCommonShareImage({
      type: "question",
      subtitle: "QUESTION CHALLENGE",
      questionText: question.text,
      options: question.options || [],
      quizUrl,
    });
    const file = new File([blob], "quiz-question.png", { type: "image/png" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "QuizWeb Question Challenge",
        text: shareMessage,
        files: [file],
      });
      return;
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Share failed:", err);
    }
  }

  // Fallback to WhatsApp
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
  if (typeof window !== "undefined") {
    window.open(waUrl, "_blank");
  }
}

/**
 * Share a quiz challenge card
 */
export async function shareQuiz(quiz) {
  if (!quiz) return;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const quizUrl = `${baseUrl}/category/${quiz.slug || quiz.id}`;
  const shareMessage = `🔥 *Challenge:* Take the "${quiz.topic || "Quiz"}" challenge on QuizWeb!\n\n📝 ${quiz.questionCount || 10} Questions\n⚡ Test your speed & accuracy!\n\nPlay here: ${quizUrl}`;

  toast.success("Preparing share...", { icon: "📲" });

  try {
    const blob = await generateCommonShareImage({
      type: "quiz",
      subtitle: "CHALLENGE YOUR FRIENDS",
      quizTitle: quiz.topic || "Interactive Quiz",
      quizDesc: quiz.description || "Test your knowledge and climb the leaderboard!",
      questionCount: quiz.questionCount || 10,
      difficulty: quiz.difficulty || "All Levels",
      quizUrl,
    });
    const file = new File([blob], "quiz-challenge.png", { type: "image/png" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: `${quiz.topic} - QuizWeb`,
        text: shareMessage,
        files: [file],
      });
      return;
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Share failed:", err);
    }
  }

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
  if (typeof window !== "undefined") {
    window.open(waUrl, "_blank");
  }
}

/**
 * Share quiz results
 */
export async function shareResult({ score, total, percentage, topic, quizId }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const quizUrl = `${baseUrl}${quizId ? `/category/${quizId}` : "/"}`;
  const shareMessage = `🏆 I just scored ${score}/${total} (${percentage}%) on the "${topic || "QuizWeb"}" quiz!\n\nCan you beat my score? Challenge me now: ${quizUrl}`;

  toast.success("Preparing result card...", { icon: "🏆" });

  try {
    const blob = await generateCommonShareImage({
      type: "result",
      subtitle: "QUIZ CHAMPION REPORT",
      quizTitle: topic || "General Knowledge Quiz",
      score,
      total,
      percentage,
      quizUrl,
    });
    const file = new File([blob], "quiz-result.png", { type: "image/png" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: `My Quiz Result - ${topic}`,
        text: shareMessage,
        files: [file],
      });
      return;
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Share failed:", err);
    }
  }

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
  if (typeof window !== "undefined") {
    window.open(waUrl, "_blank");
  }
}

// === Canvas Helpers ===

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line + (line ? " " : "") + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

function truncateText(ctx, text, maxWidth) {
  const str = String(text || "");
  if (ctx.measureText(str).width <= maxWidth) return str;
  let t = str;
  while (t.length > 0 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

function getWrappedTextLines(ctx, text, maxWidth) {
  const words = String(text || "").split(" ");
  let lines = [];
  let line = "";
  for (const word of words) {
    const testLine = line + (line ? " " : "") + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  return lines;
}
