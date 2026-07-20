import type { Metadata } from "next";
import { AboutContent } from "@/components/AboutContent";

export const metadata: Metadata = {
  title: "NETRA — the eye on Delhi",
  description:
    "Why NETRA? नेत्र is Sanskrit for 'the eye' — and an acronym for NCR, Events, Transit, Rain & Air. One live view of everything that decides your day in Delhi.",
};

export default function AboutPage() {
  return <AboutContent />;
}
