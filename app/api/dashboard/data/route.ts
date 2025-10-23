import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const plate = searchParams.get("plate");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Get all vehicles
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { plateNo: "asc" },
    });

    if (!plate) {
      return NextResponse.json({ vehicles, telemetry: [] });
    }

    // Find the selected vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { plateNo: plate },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Build query filters
    const where: {
      vehicleId: number;
      timestamp?: { gte?: Date; lte?: Date };
    } = { vehicleId: vehicle.id };
    if (from) {
      where.timestamp = { ...where.timestamp, gte: new Date(from) };
    }
    if (to) {
      where.timestamp = { ...where.timestamp, lte: new Date(to) };
    }

    // Fetch telemetry data (limit to 2000 points for performance)
    const telemetry = await prisma.telemetry.findMany({
      where,
      orderBy: { timestamp: "asc" },
      take: 2000,
    });

    return NextResponse.json({ vehicles, telemetry });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Dashboard data fetch error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
