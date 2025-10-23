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
  skipped: number;
  errors: Array<{ index: number; error: string }>;
};

export default function ImportPage() {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a CSV file to upload.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("File must be a .csv");
      return;
    }

    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Import failed");
      }
      setResult(data as ImportResult);
      toast.success("CSV imported", {
        description: `${data.imported} records saved`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(err);
      setError(message);
      toast.error("Import failed", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Participants CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">CSV file</Label>
              <Input id="file" type="file" accept=".csv" ref={fileRef} />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Importing…" : "Import"}
              </Button>
              <Link className="text-sm underline" href="/">
                Home
              </Link>
              <a className="text-sm underline" href="/sample.csv">
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
            <div className="mt-6 space-y-2 text-sm">
              <div>
                Imported: <strong>{result.imported}</strong>
              </div>
              <div>
                Skipped: <strong>{result.skipped}</strong>
              </div>
              {result.errors?.length ? (
                <details className="mt-2">
                  <summary>{result.errors.length} row error(s)</summary>
                  <ul className="list-inside list-disc pl-4">
                    {result.errors.slice(0, 10).map((e, idx) => (
                      <li key={idx}>
                        Row {e.index + 2}: {e.error}
                      </li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>…and {result.errors.length - 10} more</li>
                    )}
                  </ul>
                </details>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
