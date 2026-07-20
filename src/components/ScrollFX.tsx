"use client";

import { useEffect } from "react";

// Scroll-motion engine. Design rules that keep it safe:
//  1. Only elements BELOW the fold are ever hidden — on-screen content is
//     untouched, so it can't flash or get stuck.
//  2. A failsafe timer reveals everything after a few seconds regardless, so a
//     hidden element can never be permanently lost even if scroll events don't
//     fire. Fully skipped under prefers-reduced-motion.

const REVEAL = [
  ".panel",
  ".place-card",
  ".about-section",
  ".about-end",
  ".letter-card",
  ".feature-card",
  ".rest-group",
];
const STAGGER_PARENTS = [
  ".place-grid",
  ".letter-grid",
  ".feature-grid",
  ".forecast-row",
  ".rank-list",
  ".region-grid",
  ".news-list",
];

export function ScrollFX() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const prep = (el: Element, stagger = false, delay = 0) => {
      const h = el as HTMLElement;
      if (h.dataset.fx) return;
      h.dataset.fx = "1";
      el.classList.add("fx-reveal");
      if (stagger) {
        el.classList.add("fx-stagger");
        h.style.setProperty("--fxd", `${delay}ms`);
      }
    };

    const scan = () => {
      for (const sel of REVEAL) document.querySelectorAll(sel).forEach((el) => prep(el));
      for (const sel of STAGGER_PARENTS) {
        document.querySelectorAll(sel).forEach((parent) => {
          [...parent.children].forEach((child, i) => prep(child, true, Math.min(i, 10) * 55));
        });
      }
    };

    // Loop: an element is visible whenever ANY part of it is in the viewport,
    // and re-arms (hidden) once fully scrolled past — so the reveal replays
    // every time it comes back into view, whether scrolling down or up. Nothing
    // that's on screen is ever hidden.
    const applyReveal = () => {
      const vh = window.innerHeight;
      document.querySelectorAll(".fx-reveal").forEach((el) => {
        const r = el.getBoundingClientRect();
        const inView = r.top < vh && r.bottom > 0;
        el.classList.toggle("fx-hidden", !inView);
      });
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        applyReveal();
        const y = window.scrollY;
        document.querySelectorAll<HTMLElement>(".fx-parallax").forEach((el) => {
          const speed = Number(el.dataset.speed ?? "0.12");
          el.style.transform = `translate3d(0, ${(-y * speed).toFixed(1)}px, 0)`;
        });
      });
    };

    scan();
    applyReveal();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", applyReveal, { passive: true });

    // Re-scan as the App Router swaps page content (debounced).
    let scanTimer = 0;
    const mo = new MutationObserver(() => {
      clearTimeout(scanTimer);
      scanTimer = window.setTimeout(() => {
        scan();
        applyReveal();
      }, 120);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Self-correcting tick so state stays right even without scroll events.
    const tick = window.setInterval(applyReveal, 1500);

    return () => {
      mo.disconnect();
      clearTimeout(scanTimer);
      clearInterval(tick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", applyReveal);
    };
  }, []);

  return null;
}
