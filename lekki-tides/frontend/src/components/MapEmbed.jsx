import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet's default marker images reference relative paths that don't
// resolve correctly once bundled — this is the standard fix, pointing them
// at the actual bundled asset URLs Vite produces for these imports.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Leaflet + OpenStreetMap instead of Google Maps Embed API — no API key, no
// Google Cloud billing account, no payment verification of any kind. Public
// OSM tiles are free to use for a site at this scale; the attribution below
// is required by their usage policy, not optional styling.
export default function MapEmbed({ address, lat, lng, className = "" }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const hasCoords = typeof lat === "number" && typeof lng === "number";

  useEffect(() => {
    if (!hasCoords || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.marker([lat, lng]).addTo(map).bindPopup(address ?? "");

    // React may re-run this effect (new property, new coordinates) without
    // fully unmounting the component — Leaflet throws if you try to
    // initialize a map on a container that already has one, so always tear
    // down the previous instance first.
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [hasCoords, lat, lng, address]);

  if (!hasCoords) {
    // No coordinates set for this property yet — point to the dashboard
    // rather than showing a broken map. A plain "open in Google Maps" search
    // link is free and needs no API key; it's only the embedded map that did.
    const query = encodeURIComponent(address ?? "");
    return (
      <div className={`rounded-xl border border-[#E3DBC9] bg-[#F0EBDD] p-6 text-center ${className}`}>
        <p className="text-sm text-[#6B6455] mb-2">
          No map pin set for this property yet — add latitude/longitude from the owner dashboard's Listings tab.
        </p>
        {address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${query}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#0B3D3C] underline"
          >
            Open {address} in Google Maps →
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Map showing ${address}`}
      className={`w-full rounded-xl border border-[#E3DBC9] isolate relative z-0 overflow-hidden ${className}`}
      style={{ minHeight: 220 }}
    />
  );
}
