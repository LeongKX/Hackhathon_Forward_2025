// Utility functions for geo computations and trip segmentation
// Kept framework-agnostic so it can be used in server or client code.

export type TelemetryLike = {
  timestamp: Date;
  latitude: number;
  longitude: number;
  speedKph?: number | null;
  engineOn?: boolean | null;
  odometerKm?: number | null;
};

export type SimplePoint = { lat: number; lon: number; ts: number };

export type Segment = {
  points: SimplePoint[];
};

export type SegmentStats = {
  startTs: number;
  endTs: number;
  durationMin: number;
  distanceKm: number;
  avgSpeedKph: number | null;
};

export type SegmentOptions = {
  timeGapMin?: number; // gap in minutes to split segments, default 30
  distGapKm?: number; // sudden jump distance in km to split segments, default 5
  useEngineState?: boolean; // use engine on/off to split, default true
  minSegmentSize?: number; // discard segments with fewer points, default 2
  maxPointsPerSegment?: number; // optional stride downsampling cap
};

export function isValidLatLon(lat?: number | null, lon?: number | null) {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
) {
  const R = 6371; // Earth radius km
  const dLat = deg2rad(b.lat - a.lat);
  const dLon = deg2rad(b.lon - a.lon);
  const la1 = deg2rad(a.lat);
  const la2 = deg2rad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}

export function dedupeConsecutive(points: SimplePoint[]): SimplePoint[] {
  if (points.length <= 1) return points;
  const out: SimplePoint[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const prev = out[out.length - 1];
    if (p.lat !== prev.lat || p.lon !== prev.lon) out.push(p);
  }
  return out;
}

export function simplifyStride<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const keep: T[] = [];
  const step = Math.ceil(arr.length / maxPoints);
  for (let i = 0; i < arr.length; i += step) keep.push(arr[i]);
  if (keep[keep.length - 1] !== arr[arr.length - 1])
    keep.push(arr[arr.length - 1]);
  return keep;
}

export function segmentTelemetry(
  rows: TelemetryLike[],
  opts: SegmentOptions = {}
): { segments: Segment[]; stats: SegmentStats[] } {
  const timeGapMin = opts.timeGapMin ?? 30;
  const distGapKm = opts.distGapKm ?? 5;
  const useEngineState = opts.useEngineState ?? true;
  const minSegmentSize = opts.minSegmentSize ?? 2;
  const maxPointsPerSegment = opts.maxPointsPerSegment ?? 2000;

  // Normalize and filter invalid points
  const pts: SimplePoint[] = [];
  for (const r of rows) {
    if (!isValidLatLon(r.latitude, r.longitude)) continue;
    const ts =
      r.timestamp instanceof Date
        ? r.timestamp.getTime()
        : new Date(r.timestamp).getTime();
    if (!Number.isFinite(ts)) continue;
    pts.push({ lat: r.latitude, lon: r.longitude, ts });
  }
  if (pts.length === 0) return { segments: [], stats: [] };

  const segments: Segment[] = [];
  const stats: SegmentStats[] = [];

  let current: SimplePoint[] = [];
  let lastEngineOn: boolean | null | undefined = rows[0]?.engineOn;

  const endCurrent = () => {
    if (current.length >= minSegmentSize) {
      // Optional downsampling per segment
      const simplified = simplifyStride(current, maxPointsPerSegment);
      segments.push({ points: simplified });
      stats.push(computeStats(simplified, rows));
    }
    current = [];
  };

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (current.length === 0) {
      current.push(p);
      continue;
    }
    const prev = current[current.length - 1];
    const dtMin = Math.abs(p.ts - prev.ts) / (60 * 1000);
    const dk = haversineKm(prev, p);

    let split = dtMin > timeGapMin || dk > distGapKm;

    if (!split && useEngineState) {
      const rCur = rows[i];
      const eng = rCur?.engineOn;
      if (lastEngineOn != null && eng != null && eng !== lastEngineOn) {
        // Split when engine state toggles (off to on or on to off)
        split = true;
      }
      lastEngineOn = eng;
    }

    if (split) {
      endCurrent();
      current.push(p);
    } else {
      current.push(p);
    }
  }
  endCurrent();

  // Dedupe consecutive identical coords inside each segment
  for (let i = 0; i < segments.length; i++) {
    const cleaned = dedupeConsecutive(segments[i].points);
    segments[i] = { points: cleaned };
    stats[i] = computeStats(cleaned, rows);
  }

  return { segments, stats };
}

function computeStats(
  points: SimplePoint[],
  rows: TelemetryLike[]
): SegmentStats {
  if (points.length === 0) {
    return {
      startTs: 0,
      endTs: 0,
      durationMin: 0,
      distanceKm: 0,
      avgSpeedKph: null,
    };
  }
  const startTs = points[0].ts;
  const endTs = points[points.length - 1].ts;
  const durationMin = Math.max(0, (endTs - startTs) / (60 * 1000));

  // Compute distance: prefer odometer delta if plausible, else haversine sum
  let distanceKm = 0;
  let useOdo = false;
  // Map points to nearest row indices by timestamp (assumes same order)
  const idxByTs = new Map<number, number>();
  for (let i = 0; i < rows.length; i++)
    idxByTs.set(rows[i].timestamp.getTime(), i);
  const firstIdx = idxByTs.get(points[0].ts);
  const lastIdx = idxByTs.get(points[points.length - 1].ts);
  if (
    firstIdx != null &&
    lastIdx != null &&
    rows[lastIdx].odometerKm != null &&
    rows[firstIdx].odometerKm != null
  ) {
    const diff = (rows[lastIdx].odometerKm! -
      rows[firstIdx].odometerKm!) as number;
    if (Number.isFinite(diff) && diff >= 0) {
      distanceKm = diff;
      useOdo = true;
    }
  }
  if (!useOdo) {
    for (let i = 1; i < points.length; i++)
      distanceKm += haversineKm(points[i - 1], points[i]);
  }

  // Avg speed from rows within range when available
  let sum = 0;
  let cnt = 0;
  for (const r of rows) {
    const ts = r.timestamp.getTime();
    if (ts >= startTs && ts <= endTs && r.speedKph != null) {
      sum += r.speedKph;
      cnt++;
    }
  }
  const avgSpeedKph = cnt ? sum / cnt : null;

  return { startTs, endTs, durationMin, distanceKm, avgSpeedKph };
}
