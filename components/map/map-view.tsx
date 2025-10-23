"use client";

import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { type LatLngExpression } from "leaflet";
import { useMemo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

type Point = { lat: number; lon: number };

const COLORS = [
  "#2563eb",
  "#10b981",
  "#a855f7",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
];

function FitToSegments({
  segments,
  trigger,
}: {
  segments: Point[][];
  trigger: number;
}) {
  const map = useMap();
  const bounds = useMemo(() => {
    const all: [number, number][] = [];
    for (const seg of segments) for (const p of seg) all.push([p.lat, p.lon]);
    return all.length ? L.latLngBounds(all) : null;
  }, [segments]);
  // Fit on mount/update or when trigger changes
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [24, 24] });
  }, [bounds, map, trigger]);
  return null;
}

export function MapView({
  segments,
  points,
  height = 360,
  legend,
}: {
  segments?: Array<Array<Point>>;
  points?: Array<Point>; // backward-compat: single line
  height?: number;
  legend?: Array<{ label: string; color: string }>; // optional legend entries
}) {
  // Normalize to segments
  const segs: Point[][] = useMemo(() => {
    if (segments && segments.length) return segments;
    if (points && points.length) return [points];
    return [];
  }, [segments, points]);

  const [fitTrigger, setFitTrigger] = useState(0);

  const first: LatLngExpression =
    segs.length && segs[0].length ? [segs[0][0].lat, segs[0][0].lon] : [0, 0];

  return (
    <div
      style={{ height }}
      className="w-full overflow-hidden rounded-md border relative"
    >
      <MapContainer
        center={first}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {segs.length ? (
          <FitToSegments segments={segs} trigger={fitTrigger} />
        ) : null}
        {segs.map((seg, i) => {
          const latlngs = seg.map((p) => [p.lat, p.lon]) as LatLngExpression[];
          const color = COLORS[i % COLORS.length];
          return (
            <>
              {latlngs.length > 1 && (
                <Polyline
                  key={`route-${i}`}
                  positions={latlngs}
                  pathOptions={{ color, weight: 5, opacity: 0.9 }}
                />
              )}
              {latlngs.length > 0 ? (
                <CircleMarker
                  key={`start-${i}`}
                  center={latlngs[0] as [number, number]}
                  radius={6}
                  pathOptions={{
                    color: "#16a34a",
                    fillColor: "#16a34a",
                    fillOpacity: 1,
                  }}
                >
                  <Tooltip direction="top">Start</Tooltip>
                </CircleMarker>
              ) : null}
              {latlngs.length > 0 ? (
                <CircleMarker
                  key={`end-${i}`}
                  center={latlngs[latlngs.length - 1] as [number, number]}
                  radius={6}
                  pathOptions={{
                    color: "#ef4444",
                    fillColor: "#ef4444",
                    fillOpacity: 1,
                  }}
                >
                  <Tooltip direction="top">End</Tooltip>
                </CircleMarker>
              ) : null}
            </>
          );
        })}
      </MapContainer>

      {/* Fit to route button */}
      {segs.length > 0 && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2 z-[1000] shadow-md"
          onClick={() => setFitTrigger((t) => t + 1)}
        >
          <Maximize2 className="h-4 w-4 mr-1" />
          Fit to route
        </Button>
      )}

      {/* Legend */}
      {legend && legend.length ? (
        <div className="absolute bottom-2 left-2 z-[1000] rounded bg-white/90 p-2 text-xs shadow">
          <div className="font-medium mb-1">Trips</div>
          <ul className="space-y-1">
            {legend.map((l, i) => (
              <li key={i} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded"
                  style={{ backgroundColor: l.color }}
                />
                <span>{l.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
