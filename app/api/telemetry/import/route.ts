import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type TelemetryRow = {
  plate?: string;
  plateNo?: string;
  Plate?: string;
  "Plate No."?: string;
  timestamp?: string;
  Timestamp?: string;
  latitude?: string;
  Latitude?: string;
  longitude?: string;
  Longitude?: string;
  speed?: string;
  Speed?: string;
  fuelLevelPercentage?: string;
  FuelLevelPercentage?: string;
  "Fuel level percentage"?: string;
  fuelLevelLitre?: string;
  FuelLevelLitre?: string;
  "Fuel level litre"?: string;
  engineStatus?: string;
  EngineStatus?: string;
  "Engine status (on/off)"?: string;
  direction?: string;
  Direction?: string;
  batteryVoltage?: string;
  BatteryVoltage?: string;
  "Vehicle battery voltage"?: string;
  odometer?: string;
  Odometer?: string;
  located?: string;
  GPSLocated?: string;
  "Located / Not located"?: string;
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const csv = await file.text();
    if (!csv.trim())
      return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

    const { parse } = await import("csv-parse/sync");
    const rows = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as TelemetryRow[];
    if (!rows.length)
      return NextResponse.json({ error: "No rows" }, { status: 400 });

    // Normalize helper
    const toNumber = (v?: string) => {
      if (v == null) return null;
      const s = String(v).replace(/,/g, "").trim();
      if (s === "") return null;
      const n = Number(s);
      return Number.isNaN(n) ? null : n;
    };
    const toBool = (v?: string) => {
      if (v == null) return null;
      const s = String(v).trim().toLowerCase();
      if (["on", "true", "yes", "1", "located"].includes(s)) return true;
      if (["off", "false", "no", "0", "not located"].includes(s)) return false;
      return null;
    };

    // Collect per-plate batches
    type Normal = {
      plateNo: string;
      timestamp: Date;
      latitude: number;
      longitude: number;
      speedKph: number | null;
      fuelPercent: number | null;
      fuelLitre: number | null;
      engineOn: boolean | null;
      directionDeg: number | null;
      batteryVoltage: number | null;
      odometerKm: number | null;
      located: boolean | null;
    };

    const normals: Normal[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const plateNo = (
        r["Plate No."] ||
        r.plateNo ||
        r.plate ||
        r.Plate ||
        "ABA 0048"
      )
        .toString()
        .trim();
      const tsStr = (r.Timestamp || r.timestamp || "").toString().trim();
      const lat = toNumber((r.Latitude || r.latitude) as string);
      const lon = toNumber((r.Longitude || r.longitude) as string);
      if (!plateNo) {
        errors.push({ index: i, error: "Missing plate number" });
        continue;
      }
      if (!tsStr) {
        errors.push({ index: i, error: "Missing timestamp" });
        continue;
      }
      const ts = new Date(tsStr);
      if (Number.isNaN(ts.getTime())) {
        errors.push({ index: i, error: "Invalid timestamp" });
        continue;
      }
      if (lat == null || lon == null) {
        errors.push({ index: i, error: "Missing coordinates" });
        continue;
      }

      normals.push({
        plateNo,
        timestamp: ts,
        latitude: lat,
        longitude: lon,
        speedKph: toNumber((r.Speed || r.speed) as string),
        fuelPercent: toNumber(
          (r["Fuel level percentage"] ||
            r.FuelLevelPercentage ||
            r.fuelLevelPercentage) as string
        ),
        fuelLitre: toNumber(
          (r["Fuel level litre"] ||
            r.FuelLevelLitre ||
            r.fuelLevelLitre) as string
        ),
        engineOn: toBool(
          (r["Engine status (on/off)"] ||
            r.EngineStatus ||
            r.engineStatus) as string
        ),
        directionDeg: toNumber((r.Direction || r.direction) as string),
        batteryVoltage: toNumber(
          (r["Vehicle battery voltage"] ||
            r.BatteryVoltage ||
            r.batteryVoltage) as string
        ),
        odometerKm: toNumber((r.Odometer || r.odometer) as string),
        located: toBool(
          (r["Located / Not located"] || r.GPSLocated || r.located) as string
        ),
      });
    }

    if (normals.length === 0) {
      return NextResponse.json(
        { error: "No valid rows", errors },
        { status: 400 }
      );
    }

    // Upsert vehicles, then insert telemetry in chunks
    const plates = Array.from(new Set(normals.map((n) => n.plateNo)));
    const vehicles = await prisma.$transaction(
      plates.map((plate) =>
        prisma.vehicle.upsert({
          where: { plateNo: plate },
          create: { plateNo: plate },
          update: {},
        })
      )
    );
    const vehicleMap = new Map(vehicles.map((v) => [v.plateNo, v.id] as const));

    const chunkSize = 500;
    let inserted = 0;
    for (let i = 0; i < normals.length; i += chunkSize) {
      const chunk = normals.slice(i, i + chunkSize);
      await prisma.$transaction(
        chunk.map((n) =>
          prisma.telemetry.create({
            data: {
              vehicleId: vehicleMap.get(n.plateNo)!,
              timestamp: n.timestamp,
              latitude: n.latitude,
              longitude: n.longitude,
              speedKph: n.speedKph,
              fuelPercent: n.fuelPercent,
              fuelLitre: n.fuelLitre,
              engineOn: n.engineOn,
              directionDeg: n.directionDeg,
              batteryVoltage: n.batteryVoltage,
              odometerKm: n.odometerKm,
              located: n.located,
            },
          })
        )
      );
      inserted += chunk.length;
    }

    return NextResponse.json({ imported: inserted, errors });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Telemetry import error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
