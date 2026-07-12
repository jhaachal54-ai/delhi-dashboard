import type { Metadata } from "next";
import { PageHead } from "@/components/PageHead";
import { TransitPanel } from "@/components/TransitPanel";
import { MetroPanel } from "@/components/MetroPanel";
import { MetroMap } from "@/components/MetroMap";

export const metadata: Metadata = {
  title: "Transport — Delhi City Dashboard",
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
          <MetroPanel />
        </div>
        <div className="col-full" style={{ "--i": 2 } as React.CSSProperties}>
          <MetroMap />
        </div>
      </div>
    </>
  );
}
