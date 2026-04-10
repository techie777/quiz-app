/**
 * Generate a branded share image for a quiz question using Canvas API.
 * Returns a Blob (image/png).
 */
export async function generateShareImage(question, quizUrl) {
  const W = 1080; // Higher resolution for modern sharing
  const H = 1350; // Instagram Portrait aspect ratio
  const PAD = 60;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // === Background: Vibrant Mesh Gradient ===
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#4f46e5"); // Indigo-600
  bg.addColorStop(0.5, "#7c3aed"); // Violet-600
  bg.addColorStop(1, "#c026d3"); // Fuchsia-600
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Added ambient light circles for "mesh" effect
  ctx.globalCompositeOperation = 'screen';
  const drawLight = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  drawLight(W * 0.2, H * 0.2, 600, 'rgba(99, 102, 241, 0.4)');
  drawLight(W * 0.8, H * 0.7, 700, 'rgba(232, 121, 249, 0.3)');
  ctx.globalCompositeOperation = 'source-over';

  // === Header / Branding ===
  ctx.fillStyle = "#fff";
  ctx.font = "bold 48px 'Outfit', 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🧠 QuizWeb", W / 2, 100);

  ctx.font = "300 24px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("CHALLENGE OF THE DAY", W / 2, 140);

  // === Question Card: Glassmorphism Effect ===
  const cardX = PAD;
  const cardY = 220;
  const cardW = W - PAD * 2;
  const cardH = 380;

  // Outer Glow
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;

  // Card Body (White with slight transparency)
  ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
  roundRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Title in Card
  ctx.fillStyle = "#4f46e5";
  ctx.font = "800 20px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("QUESTION", W / 2, cardY + 50);

  // Question text (wrapped)
  ctx.fillStyle = "#111827";
  ctx.font = "bold 36px 'Inter', sans-serif";
  ctx.textAlign = "center";
  wrapText(ctx, question.text, W / 2, cardY + 120, cardW - 100, 52);

  // === Options ===
  const labels = ["A", "B", "C", "D"];
  const optStartY = cardY + cardH + 60;
  const optW = (cardW - 40) / 2;
  const optH = 100;
  const gap = 40;

  question.options.forEach((opt, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = cardX + col * (optW + gap);
    const y = optStartY + row * (optH + gap);

    // Option background (Glassy)
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    roundRect(ctx, x, y, optW, optH, 20);
    ctx.fill();

    // Option border
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, optW, optH, 20);
    ctx.stroke();

    // Label Indicator
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.beginPath();
    ctx.arc(x + 40, y + optH / 2, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4f46e5";
    ctx.font = "bold 20px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x + 40, y + optH / 2 + 7);

    // Option text
    ctx.font = "600 22px 'Inter', sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    const maxTextW = optW - 100;
    const truncated = truncateText(ctx, opt, maxTextW);
    ctx.fillText(truncated, x + 80, y + optH / 2 + 8);
  });

  // === Footer / CTA ===
  const footerY = H - 160;

  ctx.fillStyle = "#fff";
  ctx.font = "800 32px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Think you can beat this?", W / 2, footerY);

  ctx.font = "500 24px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Join thousands playing now at:", W / 2, footerY + 45);

  // Branded URL area
  const urlH = 80;
  const urlW = ctx.measureText(quizUrl).width + 80;
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  roundRect(ctx, (W - urlW) / 2, footerY + 70, urlW, urlH, 16);
  ctx.fill();

  ctx.font = "bold 28px 'monospace'";
  ctx.fillStyle = "#fbbf24"; // Amber-400
  ctx.fillText(quizUrl, W / 2, footerY + 120);

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
