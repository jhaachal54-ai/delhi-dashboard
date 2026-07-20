import { foodThumb } from "@/lib/thumbs";
import type { Restaurant } from "@/lib/places";

// One restaurant line with a thumbnail. Real photos aren't available via any
// free API for local eateries, so we render a deterministic gradient tile with
// the restaurant's initial — consistent and clearly intentional.
export function RestaurantRow({ r, area }: { r: Restaurant; area: string }) {
  return (
    <div className="rest-row">
      <span
        className="rest-thumb"
        style={{ backgroundImage: `url("${foodThumb(r.name, r.knownFor)}")` }}
        aria-hidden="true"
      />
      <div className="rest-text">
        <b>
          {r.name}{" "}
          <a
            className="maps-link"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${area} Delhi`)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Google Maps"
          >
            📍 map ↗
          </a>
        </b>
        <span>{r.knownFor}</span>
      </div>
    </div>
  );
}
