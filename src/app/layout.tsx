import type { Metadata } from "next";
import "./globals.css";
import { FeedsProvider } from "@/lib/feeds";
import { LangProvider } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";
import { CommandPalette } from "@/components/CommandPalette";
import { ScrollFX } from "@/components/ScrollFX";
import { ScrollProgress } from "@/components/ScrollProgress";
import { ScrollTop } from "@/components/ScrollTop";
import { SiteHeader } from "@/components/SiteHeader";
import { SwRegister } from "@/components/SwRegister";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "NETRA — NCR events, transit, rain & air, live",
  description:
    "NETRA (नेत्र, 'the eye') is a real-time guide to Delhi: plan your visit with live buses, metro routes, local events, restaurants, air quality and weather from public data feeds.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "NETRA" },
  openGraph: {
    title: "NETRA — the eye on Delhi",
    description:
      "NCR · Events · Transit · Rain · Air — one live view of everything that decides your day in Delhi.",
    siteName: "NETRA",
    type: "website",
    images: [{ url: "/netra-256.png", width: 256, height: 256, alt: "NETRA radar-eye logo" }],
  },
  twitter: {
    card: "summary",
    title: "NETRA — the eye on Delhi",
    description:
      "NCR · Events · Transit · Rain · Air — one live view of everything that decides your day in Delhi.",
    images: ["/netra-256.png"],
  },
};

export const viewport = {
  themeColor: "#070b18",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FeedsProvider>
        <LangProvider>
          <ScrollProgress />
          <div className="wrap">
            <SiteHeader />
            {children}
            <footer className="foot">
              Data: Delhi Open Transit Data · Google Events (RapidAPI) · Open-Meteo · DMRC
              network · curated Delhi guide. Photos via Wikimedia Commons. Refreshes
              automatically.
            </footer>
          </div>
          <BottomNav />
          <ScrollFX />
          <ScrollTop />
          <CommandPalette />
          <SwRegister />
        </LangProvider>
        </FeedsProvider>
      </body>
    </html>
  );
}