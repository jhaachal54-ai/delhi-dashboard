import { HeadOutPanel } from "@/components/HeadOutPanel";
import { PlanVisit } from "@/components/PlanVisit";
import { PlacesGrid } from "@/components/PlacesGrid";

export default function HomePage() {
  return (
    <>
      <HeadOutPanel />
      <div className="grid">
        <div className="col-full" style={{ "--i": 0 } as React.CSSProperties}>
          <PlanVisit />
        </div>
      </div>
      <PlacesGrid />
    </>
  );
}
