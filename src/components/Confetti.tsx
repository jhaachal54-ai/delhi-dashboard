"use client";

import { useEffect, useRef } from "react";

// A one-shot confetti burst (canvas, no library). Mounted only when it should
// fire; respects reduced-motion.
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = 320);
    const colors = ["#6ea8fe", "#7ce0c3", "#f5c518", "#e8467c", "#b98cff"];
    const parts = Array.from({ length: 100 }, () => ({
      x: Math.random() * W,
      y: -20 - Math.random() * H,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      r: 3 + Math.random() * 4,
      c: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * 6,
    }));
    let raf = 0;
    let t = 0;
    const draw = () => {
      t++;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        p.rot += 0.1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
        ctx.restore();
      }
      if (t < 170) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, W, H);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="confetti-canvas" aria-hidden="true" />;
}
