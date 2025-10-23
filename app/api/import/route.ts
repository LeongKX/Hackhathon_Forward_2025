import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Row = {
  name: string;
  email: string;
  team?: string | null;
  score?: number | null;
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing 'file' in form data" },
        { status: 400 }
      );
    }

    const text = await file.text();
    if (!text.trim()) {
      return NextResponse.json({ error: "Empty CSV file" }, { status: 400 });
    }

    // Lazy import to keep edge bundle small if used elsewhere
    const { parse } = await import("csv-parse/sync");

    const parsed: Record<string, string>[] = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json(
        { error: "No rows found in CSV" },
        { status: 400 }
      );
    }

    // Basic normalization and validation
    const normalized: Row[] = [];
    const errors: Array<{ index: number; error: string }> = [];
    const seenEmails = new Set<string>();

    for (let i = 0; i < parsed.length; i++) {
      const r = parsed[i] as Record<string, string>;
      const name = (r.name ?? r.Name ?? r["full name"] ?? "").toString().trim();
      const email = (r.email ?? r.Email ?? "").toString().trim().toLowerCase();
      const team = (r.team ?? r.Team ?? r["team name"] ?? "").toString().trim();
      const scoreRaw = (r.score ?? r.Score ?? r.points ?? r.Points ?? "")
        .toString()
        .trim();
      const score = scoreRaw ? Number(scoreRaw) : null;

      if (!name) {
        errors.push({ index: i, error: "Missing name" });
        continue;
      }
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        errors.push({ index: i, error: "Invalid email" });
        continue;
      }
      if (scoreRaw && Number.isNaN(Number(scoreRaw))) {
        errors.push({ index: i, error: "Invalid score" });
        continue;
      }
      if (seenEmails.has(email)) {
        // de-dupe within the file
        continue;
      }
      seenEmails.add(email);

      normalized.push({ name, email, team: team || null, score });
    }

    if (normalized.length === 0) {
      return NextResponse.json(
        { error: "No valid rows to import", errors },
        { status: 400 }
      );
    }

    const results = await prisma.$transaction(
      normalized.map((row) =>
        prisma.participant.upsert({
          where: { email: row.email },
          create: row,
          update: {
            name: row.name,
            team: row.team ?? null,
            score: row.score ?? null,
          },
        })
      )
    );

    return NextResponse.json({
      imported: results.length,
      skipped: errors.length,
      errors,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("CSV import error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
