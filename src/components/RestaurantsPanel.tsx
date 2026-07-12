import { METRO_LINES } from "@/lib/metro";
import { PLACES } from "@/lib/places";
import { Panel } from "./Panel";

const LINE_BY_KEY = new Map(METRO_LINES.map((l) => [l.key, l]));

// Curated guide: Delhi's genuinely famous restaurants, grouped by the tourist
// area they belong to, with the nearest metro station for each cluster.
export function RestaurantsPanel() {
  return (
    <Panel
      title="Famous Restaurants"
      icon="🍽️"
      source="Curated Delhi food guide · grouped by area"
    >
      <div className="rest-groups">
        {PLACES.filter((p) => p.restaurants.length > 0).map((p) => (
          <div className="rest-group" key={p.key}>
            <div className="rest-group-head">
              <span>{p.emoji}</span>
              <b>{p.name}</b>
              <span className="rest-group-metro">
                🚇 {p.station}
                <span className="line-dots">
                  {p.lineKeys.map((k) => {
                    const line = LINE_BY_KEY.get(k);
                    return (
                      <i
                        key={k}
                        className="line-dot"
                        style={{ background: line?.color ?? "#888" }}
                        title={line ? `${line.name} Line` : k}
                      />
                    );
                  })}
                </span>
              </span>
            </div>
            {p.restaurants.map((r) => (
              <div className="rest-row" key={r.name}>
                <b>{r.name}</b>
                <span>{r.knownFor}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Panel>
  );
}
