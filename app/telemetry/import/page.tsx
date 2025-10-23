"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";

type ImportResult = {
  imported: number;
  errors: Array<{ index: number; error: string }>;
};

export default function TelemetryImportPage() {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Choose a CSV file to upload.");
    if (!file.name.toLowerCase().endsWith(".csv"))
      return setError("File must be .csv");

    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/telemetry/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Import failed");
      setResult(data as ImportResult);
      toast.success("Telemetry imported", {
        description: `${data.imported} rows saved`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast.error("Import failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Telemetry CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">CSV file</Label>
              <Input id="file" type="file" accept=".csv" ref={fileRef} />
              <p className="text-xs text-muted-foreground">
                Expected columns: Plate No., Timestamp, Latitude, Longitude,
                Speed, Fuel level percentage, Fuel level litre, Engine status
                (on/off), Direction, Vehicle battery voltage, Odometer, Located
                / Not located
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Importing…" : "Import"}
              </Button>
              <Link className="text-sm underline" href="/dashboard">
                Dashboard
              </Link>
              <a className="text-sm underline" href="/telemetry-sample.csv">
                Sample CSV
              </a>
            </div>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="mt-6 text-sm">
              Imported: <strong>{result.imported}</strong>
              {result.errors?.length ? (
                <div className="mt-2">
                  {result.errors.length} row error(s). Import skipped invalid
                  rows.
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
