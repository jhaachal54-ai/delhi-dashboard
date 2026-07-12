import type { Metadata } from "next";
import { EventsPanel } from "@/components/EventsPanel";
import { PageHead } from "@/components/PageHead";
import { RestaurantsPanel } from "@/components/RestaurantsPanel";

export const metadata: Metadata = {
  title: "Local Events & Restaurants — Delhi City Dashboard",
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
        <div className="col-full" style={{ "--i": 1 } as React.CSSProperties}>
          <RestaurantsPanel />
        </div>
      </div>
    </>
  );
}
