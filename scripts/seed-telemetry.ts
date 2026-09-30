// Seed Vehicle + Telemetry from a folder of CSVs.
// Plate number is taken from each file's name (e.g. "ABA 3768.csv" -> "ABA 3768").
// Usage: node scripts/seed-telemetry.mjs "/absolute/path/to/csv/folder"
import { readdirSync, createReadStream } from "node:fs";
import { basename, join, extname } from "node:path";
import { parse } from "csv-parse";
import { PrismaClient } from "../lib/generated/prisma/client.ts";

const prisma = new PrismaClient();

const dir = process.argv[2];
if (!dir) {
  console.error('Pass the CSV folder path, e.g. node scripts/seed-telemetry.mjs "/path/to/folder"');
  process.exit(1);
}

const num = (v) => {
  if (v == null) return null;
  const s = String(v).replace(/,/g, "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
};
const bool = (v) => {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (["on", "true", "yes", "1", "located"].includes(s)) return true;
  if (["off", "false", "no", "0", "not located"].includes(s)) return false;
  return null;
};

async function main() {
const files = readdirSync(dir).filter((f) => extname(f).toLowerCase() === ".csv");
console.log(`Found ${files.length} CSV files in ${dir}`);

let grandTotal = 0;
for (const file of files) {
  const plateNo = basename(file, extname(file)).trim();
  const vehicle = await prisma.vehicle.upsert({
    where: { plateNo },
    create: { plateNo },
    update: {},
  });

  const batch = [];
  let inserted = 0;
  let skipped = 0;

  const flush = async () => {
    if (!batch.length) return;
    await prisma.telemetry.createMany({ data: batch.splice(0, batch.length) });
  };

  const parser = createReadStream(join(dir, file)).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true, bom: true })
  );

  for await (const r of parser) {
    const tsStr = (r.Timestamp || r.timestamp || "").toString().trim();
    const lat = num(r.Latitude ?? r.latitude);
    const lon = num(r.Longitude ?? r.longitude);
    const ts = new Date(tsStr);
    if (!tsStr || Number.isNaN(ts.getTime()) || lat == null || lon == null) {
      skipped++;
      continue;
    }
    batch.push({
      vehicleId: vehicle.id,
      timestamp: ts,
      latitude: lat,
      longitude: lon,
      speedKph: num(r.Speed ?? r.speed),
      fuelPercent: num(r.FuelLevelPercentage ?? r.fuelLevelPercentage),
      fuelLitre: num(r.FuelLevelLitre ?? r.fuelLevelLitre),
      engineOn: bool(r.EngineStatus ?? r.engineStatus),
      directionDeg: num(r.Direction ?? r.direction),
      batteryVoltage: num(r.BatteryVoltage ?? r.batteryVoltage),
      odometerKm: num(r.Odometer ?? r.odometer),
      located: bool(r.GPSLocated ?? r.located),
    });
    inserted++;
    if (batch.length >= 5000) await flush();
  }
  await flush();
  grandTotal += inserted;
  console.log(`  ${plateNo}: ${inserted} rows${skipped ? ` (${skipped} skipped)` : ""}`);
}

console.log(`Done. Inserted ${grandTotal} telemetry rows across ${files.length} vehicles.`);
await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
