import type { Metadata } from "next";
import { HeadOutPanel } from "@/components/HeadOutPanel";
import { NewsPanel } from "@/components/NewsPanel";
import { PlanVisit } from "@/components/PlanVisit";
import { PlacesGrid } from "@/components/PlacesGrid";

export const metadata: Metadata = {
  title: "Home — NETRA",
  description:
    "Should you head out right now? Live score for Delhi plus a trip planner with metro routes, live buses, events and food.",
};

export default function HomePage() {
  return (
    <>
      <HeadOutPanel />
      <div className="grid">
        <div className="col-full" style={{ "--i": 0 } as React.CSSProperties}>
          <PlanVisit />
        </div>
        <div className="col-full" style={{ "--i": 1 } as React.CSSProperties}>
          <NewsPanel />
        </div>
      </div>
      <PlacesGrid />
    </>
  );
}
