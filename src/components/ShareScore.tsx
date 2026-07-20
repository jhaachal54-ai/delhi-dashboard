"use client";

import { useState } from "react";
import type { HeadOutScore } from "@/lib/score";

// Renders the current "should I head out?" score as a shareable PNG card,
// drawn on a canvas (no libraries). Uses the Web Share API when available,
// otherwise downloads the file.
function drawCard(s: HeadOutScore): HTMLCanvasElement {
  const S = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  // backdrop + a glow in the score's colour
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, S, S);
  const glow = ctx.createRadialGradient(S / 2, 430, 30, S / 2, 430, 560);
  glow.addColorStop(0, `${s.color}44`);
  glow.addColorStop(1, "#0b102000");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  // wordmark
  ctx.textAlign = "center";
  ctx.fillStyle = "#eef1fb";
  ctx.font = "800 46px Segoe UI, Arial, sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("NETRA", S / 2, 108);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = "#8e98b8";
  ctx.font = "400 22px Segoe UI, Arial, sans-serif";
  ctx.fillText("NCR · Events · Transit · Rain · Air", S / 2, 146);

  // score ring
  const cx = S / 2;
  const cy = 440;
  const r = 165;
  ctx.lineWidth = 26;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#1b2340";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = s.color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * s.score) / 100);
  ctx.stroke();

  // score number
  ctx.fillStyle = s.color;
  ctx.font = "800 168px Segoe UI, Arial, sans-serif";
  ctx.fillText(String(s.score), cx, cy + 52);
  ctx.fillStyle = "#8e98b8";
  ctx.font = "500 30px Segoe UI, Arial, sans-serif";
  ctx.fillText("/ 100", cx, cy + 100);

  // question + verdict
  ctx.fillStyle = "#8e98b8";
  ctx.font = "600 26px Segoe UI, Arial, sans-serif";
  ctx.fillText("SHOULD I HEAD OUT IN DELHI RIGHT NOW?", cx, 700);
  ctx.fillStyle = "#eef1fb";
  ctx.font = "700 46px Segoe UI, Arial, sans-serif";
  // shrink the verdict until it fits the card width
  let size = 46;
  while (ctx.measureText(s.verdict).width > S - 120 && size > 24) {
    size -= 2;
    ctx.font = `700 ${size}px Segoe UI, Arial, sans-serif`;
  }
  ctx.fillText(s.verdict, cx, 764);

  // reason chips
  const chips = s.reasons.slice(0, 3).map((x) => x.text);
  ctx.font = "500 24px Segoe UI, Arial, sans-serif";
  const widths = chips.map((c) => ctx.measureText(c).width + 44);
  const gap = 16;
  let total = widths.reduce((a, b) => a + b, 0) + gap * (chips.length - 1);
  let x = cx - total / 2;
  const y = 850;
  chips.forEach((c, i) => {
    const w = widths[i];
    ctx.fillStyle = "#161d38";
    ctx.beginPath();
    ctx.roundRect(x, y, w, 56, 28);
    ctx.fill();
    ctx.fillStyle = "#c3ccec";
    ctx.textAlign = "center";
    ctx.fillText(c, x + w / 2, y + 37);
    x += w + gap;
  });

  // footer
  ctx.textAlign = "center";
  ctx.fillStyle = "#5f688a";
  ctx.font = "400 22px Segoe UI, Arial, sans-serif";
  const when = new Date().toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
  ctx.fillText(`${when} IST · the eye on Delhi`, cx, 1000);

  return canvas;
}

export function ShareScore({ score }: { score: HeadOutScore }) {
  const [done, setDone] = useState(false);

  const share = async () => {
    try {
      const canvas = drawCard(score);
      const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/png"));
      if (!blob) return;
      const file = new File([blob], "netra-score.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: "NETRA — the eye on Delhi" });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "netra-score.png";
        a.click();
        URL.revokeObjectURL(a.href);
      }
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch {
      /* user cancelled the share sheet, or canvas unavailable */
    }
  };

  return (
    <button className="near-btn share-score" onClick={share} title="Share this score as an image">
      📸 {done ? "Saved ✓" : "Share score"}
    </button>
  );
}
