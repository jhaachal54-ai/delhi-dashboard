import type { Metadata } from "next";
import "./globals.css";
import { FeedsProvider } from "@/lib/feeds";
import { LangProvider } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";
import { SiteHeader } from "@/components/SiteHeader";
import { SwRegister } from "@/components/SwRegister";

export const metadata: Metadata = {
  title: "Delhi City Dashboard — live transit, events, air & weather",
  description:
    "A real-time guide to Delhi: plan your visit with live buses, metro routes, local events, restaurants, air quality and weather from public data feeds.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "DelhiDash" },
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
          <SwRegister />
        </LangProvider>
        </FeedsProvider>
      </body>
    </html>
  );
}
