import type { Metadata } from "next";
import { BusAnalytics } from "@/components/BusAnalytics";
import { FlightsPanel } from "@/components/FlightsPanel";
import { PageHead } from "@/components/PageHead";
import { TrainsPanel } from "@/components/TrainsPanel";
import { TransitPanel } from "@/components/TransitPanel";
import { MetroPanel } from "@/components/MetroPanel";
import { MetroMap } from "@/components/MetroMap";

export const metadata: Metadata = {
  title: "Transport — NETRA",
  description:
    "Live DTC/DIMTS bus positions across Delhi and the full Delhi Metro network with operating status.",
};

export default function TransportPage() {
  return (
    <>
      <PageHead page="transport" />
      <div className="grid">
        <div className="col-full" style={{ "--i": 0 } as React.CSSProperties}>
          <TransitPanel />
        </div>
        <div className="col-full" style={{ "--i": 1 } as React.CSSProperties}>
          <BusAnalytics />
        </div>
        <div className="col-full" style={{ "--i": 2 } as React.CSSProperties}>
          <MetroPanel />
        </div>
        <div className="col-full" style={{ "--i": 3 } as React.CSSProperties}>
          <MetroMap />
        </div>
        <div className="col-half" style={{ "--i": 4 } as React.CSSProperties}>
          <FlightsPanel />
        </div>
        <div className="col-half" style={{ "--i": 5 } as React.CSSProperties}>
          <TrainsPanel />
        </div>
      </div>
    </>
  );
}
