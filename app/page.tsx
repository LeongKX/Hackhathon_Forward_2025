import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, TrendingUp, Map } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Fleet Telemetry Platform
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-zinc-600 dark:text-zinc-400">
            Ingest raw GPS/IoT vehicle data, clean out bad fixes, segment it into
            trips, and turn it into actionable fleet insights.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <TrendingUp className="h-10 w-10 mb-2 text-blue-600" />
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Per-vehicle KPIs, speed and fuel charts, and date-range filtering
                scoped to each vehicle&apos;s available data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard">
                <Button className="w-full">Open Dashboard</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <Map className="h-10 w-10 mb-2 text-purple-600" />
              <CardTitle>Trip Segmentation</CardTitle>
              <CardDescription>
                Routes split into trips by time gaps, distance jumps and engine
                state, then rendered on the map with per-trip stats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  View Routes
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <Upload className="h-10 w-10 mb-2 text-green-600" />
              <CardTitle>Telemetry Import</CardTitle>
              <CardDescription>
                Import vehicle GPS and IoT sensor data — speed, fuel, location,
                odometer and more — from CSV.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/telemetry/import">
                <Button className="w-full">Import Telemetry</Button>
              </Link>
              <a href="/telemetry-sample.csv" download className="block">
                <Button variant="outline" className="w-full">
                  Download Sample CSV
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-50 dark:bg-zinc-900 border-2">
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-2">📊 Real-time Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track distance traveled, average speed, and idle time with
                  interactive charts.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🗺️ Route Visualization</h3>
                <p className="text-sm text-muted-foreground">
                  View vehicle routes on OpenStreetMap with per-trip polylines
                  and start/end markers.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🧹 GPS Cleaning</h3>
                <p className="text-sm text-muted-foreground">
                  Bad network fixes — null-island (0,0), unlocated points and
                  teleport glitches — are filtered out automatically.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🔍 Advanced Filtering</h3>
                <p className="text-sm text-muted-foreground">
                  Filter by vehicle and a date range constrained to that
                  vehicle&apos;s available data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
