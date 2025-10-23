Hackathon is a Next.js + shadcn/ui app with Tailwind CSS and a CSV importer that writes into a SQLite database via Prisma.

## Tech

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS v4
- shadcn/ui components
- Prisma ORM with SQLite
- CSV parsing via `csv-parse`
- Charts via Chart.js
- Map via Leaflet (OpenStreetMap tiles)

## Quick start

1. Install dependencies and set up the database:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
```

2. Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000 and click “Go to Importer”, or navigate directly to http://localhost:3000/import.

Try importing the included sample CSV at `/sample.csv`.

For telemetry, go to http://localhost:3000/telemetry/import and try `/telemetry-sample.csv`. View data on the dashboard at http://localhost:3000/dashboard.

## CSV formats

Expected headers (case-insensitive):

- name (required)
- email (required, unique)
- team (optional)
- score (optional number)

Alternative header names for convenience (also accepted): `Name`, `full name`, `Team`, `team name`, `Score`, `points`, `Points`.

Telemetry expected headers (case-insensitive):

- Plate No. (required)
- Timestamp (required, ISO or parseable)
- Latitude (required)
- Longitude (required)
- Speed
- Fuel level percentage
- Fuel level litre
- Engine status (on/off)
- Direction
- Vehicle battery voltage
- Odometer
- Located / Not located

Notes:

- Plate is used to upsert vehicles; telemetry rows are associated by plate.
- Import is chunked in batches of 500 rows for reliability.

## Environment

Copy `.env.example` to `.env` if needed. Default uses SQLite at `file:./dev.db` in the project root.

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm start` – run production server
- `npm run lint` – run ESLint

## Notes

- Prisma client is generated to `lib/generated/prisma` and used via a singleton at `lib/db.ts`.
- Upload size is limited by your reverse proxy; very large CSVs may require streaming imports.
