import type { Metadata } from "next";
import { AirPanel } from "@/components/AirPanel";
import { ForecastPanel } from "@/components/ForecastPanel";
import { GoldenHour } from "@/components/GoldenHour";
import { HourlyPanel } from "@/components/HourlyPanel";
import { PageHead } from "@/components/PageHead";
import { RegionLeaderboard } from "@/components/RegionLeaderboard";
import { RegionsPanel } from "@/components/RegionsPanel";
import { WeatherPanel } from "@/components/WeatherPanel";
import { TrendPanel } from "@/components/TrendPanel";

export const metadata: Metadata = {
  title: "Weather — NETRA",
  description: "Live Delhi weather, air quality and the 7-day AQI & temperature trend.",
};

export default function WeatherPage() {
  return (
    <>
      <PageHead page="weather" />
      <div className="grid">
        <div id="weather" className="col-half" style={{ "--i": 0 } as React.CSSProperties}>
          <WeatherPanel />
        </div>
        <div id="air" className="col-half" style={{ "--i": 1 } as React.CSSProperties}>
          <AirPanel />
        </div>
        <div id="hourly" className="col-full" style={{ "--i": 2 } as React.CSSProperties}>
          <HourlyPanel />
        </div>
        <div className="col-full" style={{ "--i": 2 } as React.CSSProperties}>
          <GoldenHour />
        </div>
        <div id="forecast" className="col-full" style={{ "--i": 3 } as React.CSSProperties}>
          <ForecastPanel />
        </div>
        <div id="regions" className="col-full" style={{ "--i": 4 } as React.CSSProperties}>
          <RegionsPanel />
        </div>
        <div id="leaderboard" className="col-full" style={{ "--i": 5 } as React.CSSProperties}>
          <RegionLeaderboard />
        </div>
        <div id="trend" className="col-full" style={{ "--i": 6 } as React.CSSProperties}>
          <TrendPanel />
        </div>
      </div>
    </>
  );
}
