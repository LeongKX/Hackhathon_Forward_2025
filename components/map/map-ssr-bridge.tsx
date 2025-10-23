"use client";

import dynamic from "next/dynamic";

const MapNoSSR = dynamic(() => import("./map-view").then((m) => m.MapView), {
  ssr: false,
});

export function FleetMap(props: {
  segments?: Array<Array<{ lat: number; lon: number }>>;
  points?: Array<{ lat: number; lon: number }>;
  legend?: Array<{ label: string; color: string }>;
  height?: number;
}) {
  return <MapNoSSR {...props} />;
}
