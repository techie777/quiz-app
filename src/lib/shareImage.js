/**
 * Generate a branded share image for a quiz question using Canvas API.
 * Returns a Blob (image/png).
 */
export async function generateShareImage(question, quizUrl) {
  const W = 720;
  const H = 960;
  const PAD = 40;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // === Background gradient ===
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#4361ee");
  bg.addColorStop(1, "#7c3aed");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle pattern overlay
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 30 + Math.random() * 60;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // === Header / Branding ===
  ctx.fillStyle = "#fff";
  ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🧠 QuizWeb", W / 2, 60);

  ctx.font = "16px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Can you answer this?", W / 2, 90);

  // === Question Card ===
  const cardX = PAD;
  const cardY = 120;
  const cardW = W - PAD * 2;
  const cardH = 260;

  // Card background
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  roundRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.fill();

  // Question text (wrapped)
  ctx.fillStyle = "#1a1a2e";
  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  wrapText(ctx, question.text, W / 2, cardY + 60, cardW - 48, 32);

  // === Options ===
  const labels = ["A", "B", "C", "D"];
  const optStartY = cardY + cardH + 30;
  const optW = (cardW - 20) / 2;
  const optH = 70;
  const gap = 20;

  question.options.forEach((opt, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = cardX + col * (optW + gap);
    const y = optStartY + row * (optH + gap);

    // Option background
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    roundRect(ctx, x, y, optW, optH, 12);
    ctx.fill();

    // Option border
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, optW, optH, 12);
    ctx.stroke();

    // Label circle
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(x + 28, y + optH / 2, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x + 28, y + optH / 2 + 5);

    // Option text
    ctx.font = "16px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    const maxTextW = optW - 60;
    const truncated = truncateText(ctx, opt, maxTextW);
    ctx.fillText(truncated, x + 52, y + optH / 2 + 5);
  });

  // === Footer ===
  const footerY = H - 100;

  // Divider line
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, footerY);
  ctx.lineTo(W - PAD, footerY);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🎯 Think you know the answer?", W / 2, footerY + 35);

  ctx.font = "15px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("Play now at:", W / 2, footerY + 60);

  ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillStyle = "#fbbf24";
  ctx.fillText(quizUrl, W / 2, footerY + 82);

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

/**
 * Share a question using Web Share API or download fallback.
 */
export async function shareQuestion(question, quizId) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const quizUrl = `${baseUrl}/category/${quizId}`;

  try {
    const blob = await generateShareImage(question, quizUrl);
    const file = new File([blob], "quiz-question.png", { type: "image/png" });

    // Try Web Share API first (mobile + modern browsers)
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "QuizWeb Challenge",
        text: `Can you answer this? "${question.text}" — Play now!`,
        url: quizUrl,
        files: [file],
      });
      return;
    }

    // Fallback: download the image
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz-question.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Share failed:", err);
    }
  }
}

// === Canvas helpers ===

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
  const words = text.split(" ");
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
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}
