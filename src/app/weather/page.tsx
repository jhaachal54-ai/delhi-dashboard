import type { Metadata } from "next";
import { AirPanel } from "@/components/AirPanel";
import { HourlyPanel } from "@/components/HourlyPanel";
import { PageHead } from "@/components/PageHead";
import { RegionsPanel } from "@/components/RegionsPanel";
import { WeatherPanel } from "@/components/WeatherPanel";
import { TrendPanel } from "@/components/TrendPanel";

export const metadata: Metadata = {
  title: "Weather — Delhi City Dashboard",
  description: "Live Delhi weather, air quality and the 7-day AQI & temperature trend.",
};

export default function WeatherPage() {
  return (
    <>
      <PageHead page="weather" />
      <div className="grid">
        <div className="col-half" style={{ "--i": 0 } as React.CSSProperties}>
          <WeatherPanel />
        </div>
        <div className="col-half" style={{ "--i": 1 } as React.CSSProperties}>
          <AirPanel />
        </div>
        <div className="col-full" style={{ "--i": 2 } as React.CSSProperties}>
          <HourlyPanel />
        </div>
        <div className="col-full" style={{ "--i": 3 } as React.CSSProperties}>
          <RegionsPanel />
        </div>
        <div className="col-full" style={{ "--i": 4 } as React.CSSProperties}>
          <TrendPanel />
        </div>
      </div>
    </>
  );
}
