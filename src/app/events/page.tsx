import type { Metadata } from "next";
import { CurrencyWidget } from "@/components/CurrencyWidget";
import { EventsPanel } from "@/components/EventsPanel";
import { HolidaysStrip } from "@/components/HolidaysStrip";
import { PageHead } from "@/components/PageHead";
import { RestaurantsPanel } from "@/components/RestaurantsPanel";

export const metadata: Metadata = {
  title: "Local Events & Restaurants — NETRA",
  description:
    "What's happening in Delhi right now — live local events plus the city's genuinely famous restaurants, grouped by area.",
};

export default function EventsPage() {
  return (
    <>
      <PageHead page="events" />
      <div className="grid">
        <div className="col-full" style={{ "--i": 0 } as React.CSSProperties}>
          <EventsPanel />
        </div>
        <div className="col-half" style={{ "--i": 1 } as React.CSSProperties}>
          <HolidaysStrip />
        </div>
        <div className="col-half" style={{ "--i": 2 } as React.CSSProperties}>
          <CurrencyWidget />
        </div>
        <div className="col-full" style={{ "--i": 3 } as React.CSSProperties}>
          <RestaurantsPanel />
        </div>
      </div>
    </>
  );
}
