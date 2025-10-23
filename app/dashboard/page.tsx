import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeSeries } from "@/components/charts/time-series";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FleetMap } from "@/components/map/map-ssr-bridge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Gauge, Clock } from "lucide-react";
import { segmentTelemetry, haversineKm } from "@/lib/geo";

export const dynamic = "force-dynamic";

function fmt(n: number | null | undefined, unit = "") {
  if (n == null) return "-";
  return `${n.toFixed(1)}${unit}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const plate = sp.plate;
  const from = sp.from ? new Date(sp.from) : undefined;
  const to = sp.to ? new Date(sp.to) : undefined;

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { plateNo: "asc" },
  });

  if (vehicles.length === 0) {
    return (
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Fleet Dashboard</h1>
        <Alert>
          <AlertDescription>
            No vehicles found. Please{" "}
            <Link href="/telemetry/import" className="font-medium underline">
              import telemetry data
            </Link>{" "}
            to get started.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const selected = plate || vehicles[0]?.plateNo;

  const where: {
    vehicleId?: number;
    timestamp?: { gte?: Date; lte?: Date };
  } = {};
  if (selected) {
    const v = await prisma.vehicle.findUnique({ where: { plateNo: selected } });
    if (v) where.vehicleId = v.id;
  }
  if (from) where.timestamp = { ...(where.timestamp ?? {}), gte: from };
  if (to) where.timestamp = { ...(where.timestamp ?? {}), lte: to };

  const data = selected
    ? await prisma.telemetry.findMany({
        where,
        orderBy: { timestamp: "asc" },
        take: 2000,
      })
    : [];

  const labels = data.map((d) => d.timestamp.toISOString().slice(11, 19));
  const speeds = data.map((d) => d.speedKph ?? 0);
  const fuels = data.map((d) => d.fuelPercent ?? 0);
  // Segment telemetry into trips to avoid connecting far-away datasets
  const { segments: rawSegments, stats: segStats } = segmentTelemetry(data, {
    timeGapMin: 30,
    distGapKm: 5,
    useEngineState: true,
    maxPointsPerSegment: 2000,
  });
  const segments = rawSegments.map((s) =>
    s.points.map((p) => ({ lat: p.lat, lon: p.lon }))
  );
  const legend = segStats.map((s, i) => ({
    label: `Trip ${i + 1} · ${new Date(s.startTs)
      .toISOString()
      .slice(11, 16)}–${new Date(s.endTs)
      .toISOString()
      .slice(11, 16)} · ${s.distanceKm.toFixed(1)} km`,
    color: ["#2563eb", "#10b981", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4"][
      i % 6
    ],
  }));

  const last = data[data.length - 1];
  const first = data[0];
  const distance =
    last && first && last.odometerKm != null && first.odometerKm != null
      ? Math.max(0, last.odometerKm - first.odometerKm)
      : null;
  const avgSpeed = data.length
    ? speeds.reduce((a, b) => a + b, 0) / data.length
    : null;
  const idleMins =
    data.filter((d) => (d.speedKph ?? 0) < 1 && d.engineOn === true).length * 1; // rough per-sample minute

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Fleet Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your fleet in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/telemetry/import">
            <Button variant="outline">Import Data</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vehicle</label>
              <select
                name="plate"
                defaultValue={selected ?? ""}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.plateNo}>
                    {v.plateNo}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">From</label>
              <input
                type="datetime-local"
                name="from"
                defaultValue={from?.toISOString().slice(0, 16)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To</label>
              <input
                type="datetime-local"
                name="to"
                defaultValue={to?.toISOString().slice(0, 16)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Apply Filters
              </Button>
            </div>
          </form>
          <div className="mt-3 text-xs text-muted-foreground border-t pt-3">
            <strong>Trip segmentation:</strong> Routes are split by time gap ≥
            30 min OR distance jump ≥ 5 km; engine state used when present.
          </div>
        </CardContent>
      </Card>

      {data.length === 0 ? (
        <Alert>
          <AlertDescription>
            No telemetry data found for the selected filters. Try adjusting the
            date range or select a different vehicle.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Distance Traveled
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fmt(distance, " km")}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on odometer readings
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Speed
                </CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fmt(avgSpeed, " km/h")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.length} data points analyzed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Idle Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fmt(idleMins, " min")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Engine on, speed &lt; 1 km/h
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Speed Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-60">
                      Loading chart…
                    </div>
                  }
                >
                  <TimeSeries
                    labels={labels}
                    series={speeds}
                    label="Speed (km/h)"
                    height={280}
                  />
                </Suspense>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Fuel Level Percentage</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-60">
                      Loading chart…
                    </div>
                  }
                >
                  <TimeSeries
                    labels={labels}
                    series={fuels}
                    label="Fuel %"
                    color="#16a34a"
                    height={280}
                  />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Route Map</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-96">
                    Loading map…
                  </div>
                }
              >
                <FleetMap segments={segments} legend={legend} height={450} />
              </Suspense>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
