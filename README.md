# Fleet Management Platform

A data-driven web application for fleet operators to ingest raw GPS/IoT CSV files and turn them into actionable insights with real-time dashboard, interactive charts, and route visualization.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [CSV Formats](#csv-formats)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Usage Guide](#usage-guide)
- [Acceptance Criteria](#acceptance-criteria)
- [Fuel Efficiency Calculation](#fuel-efficiency-calculation)
- [Traffic Congestion Detection](#traffic-congestion-detection)

## ✨ Features

### CSV Import

- **Participants Import**: Bulk upload participant data with automatic email validation and deduplication
- **Telemetry Import**: Import vehicle GPS/IoT data with support for 50k+ rows via chunked transactions
- **Smart Parsing**: Accepts common column aliases and handles mixed/dirty data gracefully
- **Error Reporting**: Detailed row-by-row error reporting with success summaries

### Analytics Dashboard

- **KPIs**: Real-time metrics including distance traveled, average speed, idle time, and **intelligent fuel efficiency**
- **Advanced Fuel Analytics**: Robust fuel consumption calculation with:
  - Automatic tank capacity inference from fuel signals
  - Refuel event detection and exclusion
  - Rolling median smoothing for noise reduction
  - Dual-source support (litres or percentage with auto-conversion)
  - GPS distance fallback when odometer unavailable
  - Reliability checks and informative diagnostics
- **Traffic Congestion Detection**: Real-time traffic jam visualization with:
  - Fleet-level H3 spatial aggregation for accurate hotspot detection
  - Color-coded severity bands (red: ≤7.5 km/h, orange: 7.5-15 km/h)
  - 14-day baseline comparison with congestion index calculation
  - Configurable time windows (15/30/60 minutes)
  - Density guards (minimum samples/vehicles) to reduce noise
  - Interactive tooltips with detailed congestion metrics
  - Adjustable H3 resolution (300m or 150m cells)
- **Interactive Charts**: Speed and fuel level visualization over time using Chart.js
- **Route Mapping**: Vehicle route visualization on OpenStreetMap with polylines and markers
- **Advanced Filtering**: Filter by vehicle and date range with instant updates

### User Experience

- **Light/Dark Theme**: Seamless theme switching with system preference detection
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Accessibility**: WCAG-compliant UI components from shadcn/ui
- **Real-time Feedback**: Toast notifications and loading states for all operations

## 🛠 Tech Stack

| Category           | Technology                              |
| ------------------ | --------------------------------------- |
| **Framework**      | Next.js 16 (App Router, TypeScript)     |
| **Styling**        | Tailwind CSS 4                          |
| **Components**     | shadcn/ui (Radix UI primitives)         |
| **Database**       | Prisma ORM + SQLite (PostgreSQL-ready)  |
| **CSV Processing** | csv-parse                               |
| **Charts**         | Chart.js + react-chartjs-2              |
| **Maps**           | Leaflet + react-leaflet (OpenStreetMap) |
| **Theme**          | next-themes                             |
| **Icons**          | Lucide React                            |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

```bash
cd /path/to/project
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
# Create .env file
echo "DATABASE_URL=\"file:./dev.db\"" > .env
```

4. **Initialize the database**

```bash
npx prisma migrate dev
```

5. **Generate Prisma Client**

```bash
npx prisma generate
```

6. **Run the development server**

```bash
npm run dev
```

7. **Open in browser**

```
http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

### Lint & Type Check

```bash
npm run lint
npx tsc --noEmit
```

## 📄 CSV Formats

### Participants CSV

Import hackathon participants or team members.

**Required Headers** (accepts aliases):

- `name` / `Name` / `full name`
- `email` / `Email`
- `team` / `Team` / `team name` (optional)
- `score` / `Score` / `points` / `Points` (optional)

**Example:**

```csv
name,email,team,score
Ada Lovelace,ada@example.com,Team Alpha,95
Grace Hopper,grace@example.com,Team Beta,88
Linus Torvalds,linus@example.com,Team Kernel,100
```

**Validation Rules:**

- Name is required
- Email must be valid format
- Email must be unique (duplicates skipped)
- Score must be numeric (if provided)

**Sample File:** `/public/sample.csv`

### Telemetry CSV

Import vehicle GPS and IoT sensor data.

**Required Headers** (case-insensitive):

- `Plate No.` - Vehicle plate number
- `Timestamp` - ISO 8601 format (UTC preferred)
- `Latitude` - GPS latitude coordinate
- `Longitude` - GPS longitude coordinate

**Optional Headers:**

- `Speed` - Vehicle speed (km/h)
- `Fuel level percentage` - Fuel percentage (0-100)
- `Fuel level litre` - Fuel volume (liters)
- `Engine status (on/off)` - Engine state (on/off, true/false, 1/0)
- `Direction` - Heading in degrees (0-360)
- `Vehicle battery voltage` - Battery voltage (V)
- `Odometer` - Cumulative distance (km)
- `Located / Not located` - GPS fix status (located/not located)

**Example:**

```csv
Plate No.,Timestamp,Latitude,Longitude,Speed,Fuel level percentage,Fuel level litre,Engine status (on/off),Direction,Vehicle battery voltage,Odometer,Located / Not located
ABC1234,2025-10-23T08:00:00Z,1.3521,103.8198,45,75.5,22.5,on,90,12.8,15420,located
ABC1234,2025-10-23T08:05:00Z,1.3545,103.8210,52,75.2,22.4,on,92,12.8,15424.5,located
XYZ5678,2025-10-23T08:00:00Z,1.2900,103.8500,60,82.0,28.5,on,180,13.0,28750,located
```

**Data Normalization:**

- Numbers: Commas removed, empty values → null
- Booleans: on/off, true/false, yes/no, 1/0, located/not located
- Timestamps: Parsed via JavaScript Date (ISO 8601 preferred)

**Validation Rules:**

- Plate number is required
- Timestamp must be valid
- Coordinates are required
- Invalid numeric fields converted to null (row not rejected)

**Performance:**

- Chunked inserts (500 rows/transaction)
- Supports files up to 50k+ rows
- Vehicles created/updated automatically by plate

**Sample File:** `/public/telemetry-sample.csv`

## 🔌 API Documentation

### POST `/api/import`

Import participants from CSV file.

**Request:**

```http
POST /api/import
Content-Type: multipart/form-data

file: <CSV file>
```

**Response (200 OK):**

```json
{
  "imported": 10,
  "skipped": 2,
  "errors": [
    { "index": 3, "error": "Invalid email" },
    { "index": 7, "error": "Duplicate email in file" }
  ]
}
```

**Error Response (400/500):**

```json
{
  "error": "No valid rows to import"
}
```

---

### POST `/api/telemetry/import`

Import vehicle telemetry from CSV file.

**Request:**

```http
POST /api/telemetry/import
Content-Type: multipart/form-data

file: <CSV file>
```

**Response (200 OK):**

```json
{
  "imported": 250,
  "errors": [
    { "index": 12, "error": "Missing coordinates" },
    { "index": 45, "error": "Invalid timestamp" }
  ]
}
```

**Error Response (400/500):**

```json
{
  "error": "Empty CSV file"
}
```

---

### GET `/api/dashboard/data`

Fetch vehicles and filtered telemetry data for dashboard.

**Query Parameters:**

- `plate` (string, optional) - Vehicle plate number
- `from` (ISO date string, optional) - Start date
- `to` (ISO date string, optional) - End date

**Example:**

```http
GET /api/dashboard/data?plate=ABC1234&from=2025-10-23T08:00:00Z&to=2025-10-23T12:00:00Z
```

**Response (200 OK):**

```json
{
  "vehicles": [
    { "id": 1, "plateNo": "ABC1234", "createdAt": "...", "updatedAt": "..." }
  ],
  "telemetry": [
    {
      "id": 1,
      "vehicleId": 1,
      "timestamp": "2025-10-23T08:00:00Z",
      "latitude": 1.3521,
      "longitude": 103.8198,
      "speedKph": 45,
      "fuelPercent": 75.5,
      "engineOn": true,
      "odometerKm": 15420
    }
  ]
}
```

## 📁 Project Structure

```
hack/
├── app/
│   ├── api/
│   │   ├── import/
│   │   │   └── route.ts           # Participants import endpoint
│   │   ├── telemetry/
│   │   │   └── import/
│   │   │       └── route.ts       # Telemetry import endpoint
│   │   └── dashboard/
│   │       └── data/
│   │           └── route.ts       # Dashboard data endpoint
│   ├── dashboard/
│   │   └── page.tsx               # Analytics dashboard
│   ├── import/
│   │   └── page.tsx               # Participants import UI
│   ├── telemetry/
│   │   └── import/
│   │       └── page.tsx           # Telemetry import UI
│   ├── layout.tsx                 # Root layout with nav
│   ├── page.tsx                   # Home page
│   └── globals.css                # Global styles
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── charts/
│   │   └── time-series.tsx        # Chart.js wrapper
│   ├── map/
│   │   ├── map-view.tsx           # Leaflet map component
│   │   └── map-ssr-bridge.tsx    # SSR wrapper for map
│   ├── theme-provider.tsx         # Theme context
│   └── theme-toggle.tsx           # Theme switcher
├── lib/
│   ├── db.ts                      # Prisma client singleton
│   ├── utils.ts                   # Utility functions
│   └── generated/
│       └── prisma/                # Generated Prisma client
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Migration history
├── public/
│   ├── sample.csv                 # Sample participants CSV
│   └── telemetry-sample.csv       # Sample telemetry CSV
├── package.json
├── tsconfig.json
└── README.md
```

## 📖 Usage Guide

### 1. Import Participants

1. Navigate to **Participants Import** from home page or nav
2. Click "Choose File" and select a participants CSV
3. Click "Import" button
4. View import summary with imported/skipped counts
5. Check error details if any rows were skipped

### 2. Import Telemetry Data

1. Navigate to **Telemetry Import** from home page or nav
2. Download sample CSV if needed to see format
3. Click "Choose File" and select a telemetry CSV
4. Click "Import" button (may take a few seconds for large files)
5. View import summary with count and errors

### 3. View Dashboard

1. Navigate to **Dashboard** from home page or nav
2. Select a vehicle from the dropdown
3. Optionally set date range filters
4. Click "Apply Filters" to update
5. View KPIs: distance, average speed, idle time
6. Analyze charts: speed and fuel over time
7. Explore route on interactive map

### 4. Switch Theme

Click the sun/moon icon in the header to toggle between light and dark modes.

## ✅ Acceptance Criteria

All requirements have been implemented and tested:

### Participants Import

- ✅ CSV upload with name, email, team, score
- ✅ Accepts common column aliases
- ✅ Email uniqueness validation (file + DB)
- ✅ Import summary with counts and errors
- ✅ Data persisted to Participant table

### Telemetry Import

- ✅ CSV upload with required and optional columns
- ✅ Case-insensitive column matching
- ✅ Number normalization (commas, nulls)
- ✅ Boolean normalization (multiple formats)
- ✅ Timestamp parsing and validation
- ✅ Vehicle upsert by plate
- ✅ Chunked inserts (500/transaction)
- ✅ Error details with row numbers

### Dashboard

- ✅ Vehicle selector dropdown
- ✅ Date range filters (from/to)
- ✅ Distance traveled KPI (odometer delta)
- ✅ Average speed KPI
- ✅ Idle time KPI (speed < 1, engine on)
- ✅ Speed over time line chart
- ✅ Fuel percentage line chart
- ✅ Route polyline on map
- ✅ Latest position marker
- ✅ Query limit (2000 points)

### UX & Non-Functional

- ✅ Home page with clear navigation
- ✅ File chooser with CSV validation
- ✅ Status messages and toast notifications
- ✅ Sample CSV links
- ✅ Light/dark theme support
- ✅ Accessible UI components
- ✅ Server-side CSV parsing
- ✅ Error resilience (partial imports succeed)

### Technical

- ✅ Next.js App Router with TypeScript
- ✅ Prisma with SQLite (Postgres-ready)
- ✅ Proper indexes on database
- ✅ Type-safe API handlers

## 🔧 Environment Variables

```bash
# Database connection
DATABASE_URL="file:./dev.db"

# For PostgreSQL production:
# DATABASE_URL="postgresql://user:password@localhost:5432/fleetdb"
```

## 🗄️ Database Schema

```prisma
model Participant {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  team      String?
  score     Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Vehicle {
  id        Int         @id @default(autoincrement())
  plateNo   String      @unique
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  telemetry Telemetry[]
}

model Telemetry {
  id             Int       @id @default(autoincrement())
  vehicleId      Int
  vehicle        Vehicle   @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  timestamp      DateTime
  latitude       Float
  longitude      Float
  speedKph       Float?
  fuelPercent    Float?
  fuelLitre      Float?
  engineOn       Boolean?
  directionDeg   Float?
  batteryVoltage Float?
  odometerKm     Float?
  located        Boolean?

  @@index([vehicleId, timestamp])
  @@index([timestamp])
}
```

## 🚦 Traffic Congestion Detection

### Overview

The platform includes an advanced traffic congestion detection system that identifies and visualizes traffic jams across your fleet in real-time using H3 spatial aggregation.

### How It Works

1. **Spatial Aggregation**: GPS points from all vehicles are grouped into H3 hexagonal cells (configurable resolution: ~300m or ~150m)
2. **Speed Analysis**: For each cell, the system computes median speed from all vehicles within the time window
3. **Density Filtering**: Only cells with sufficient data (default: 20+ samples, 2+ vehicles) are considered to reduce noise
4. **Severity Classification**:
   - **Red**: Median speed ≤ 7.5 km/h (severe congestion)
   - **Orange**: Median speed 7.5-15 km/h (moderate congestion)
   - **Green**: Median speed > 15 km/h (normal flow - not displayed)
5. **Baseline Comparison**: Historical median speed (same hour-of-week, last 14 days) provides context via congestion index

### Usage

1. **Enable Congestion View**: In the dashboard filters, toggle "Show Congestion Heatmap"
2. **Choose Time Window**: Select 15, 30, or 60 minutes (default: 30)
3. **Adjust Resolution** (Advanced):
   - Resolution 9: ~300m cells, faster, good overview
   - Resolution 10: ~150m cells, more detail, slightly slower
4. **Interpret Map**:
   - Color-coded polygons overlay the route map
   - Hover over tiles for detailed metrics
   - Darker/more opaque = more sample data (higher confidence)

### API Endpoint

```
GET /api/traffic/congestion
```

**Query Parameters:**

- `from`: ISO timestamp (default: now - 30 minutes)
- `to`: ISO timestamp (default: now)
- `res`: H3 resolution (default: 9)
- `speedThresholdKph`: Orange/green boundary (default: 15)
- `minSamples`: Minimum samples per cell (default: 20)
- `minVehicles`: Minimum vehicles per cell (default: 2)

**Response:** GeoJSON FeatureCollection with Polygon features

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[101.68, 3.14], ...]]
      },
      "properties": {
        "cell": "8928308280fffff",
        "res": 9,
        "samples": 47,
        "vehicles": 3,
        "medianSpeedKph": 11.2,
        "baselineSpeedKph": 32.5,
        "congestionIndex": 0.66,
        "severityBand": "orange",
        "windowStart": "2025-10-23T02:30:00.000Z",
        "windowEnd": "2025-10-23T03:00:00.000Z"
      }
    }
  ]
}
```

### Performance

- **Caching**: API responses cached for 60 seconds per query key
- **Baseline Cache**: Historical data cached for 10 minutes per cell/hour-of-week
- **Target Latency**: 1-2 seconds for 30-minute window at resolution 9
- **Optimization**: Only orange/red tiles returned to minimize payload size

### Technical Details

- **Library**: Uses [h3-js](https://github.com/uber/h3-js) for spatial indexing
- **Speed Fusion**: Prefers reported speedKph; falls back to haversine-based estimation when missing
- **Engine Gating**: Only considers points where engineOn=true to exclude parked vehicles
- **Privacy**: Aggregated only; no vehicle IDs exposed in API responses

### Future Enhancements

- Per-route slow segment overlay for vehicle-level detail
- Historical congestion playback and analysis
- Predictive congestion alerts based on patterns
- Road network map-matching for precision

---

## 🚧 Assumptions & Design Decisions

- **Timezone**: Timestamps are UTC ISO 8601 format; parsed via JavaScript Date
- **GPS Precision**: Decimal degrees are adequate for city-scale visualization
- **Odometer**: Values are cumulative in kilometers; distance KPI requires odometer data
- **Idle Calculation**: Approximate 1 minute per sample where speed < 1 km/h and engine is on
- **Database**: SQLite for demo; can switch to PostgreSQL by updating DATABASE_URL
- **Query Limits**: Dashboard limited to 2000 telemetry points for performance
- **CSV Size**: File size limit configurable; tested up to 50k rows

## 📝 License

MIT

## 🤝 Contributing

This is a hackathon project. For production use, consider:

- Adding authentication/authorization
- Implementing pagination for large datasets
- Adding data aggregation for performance
- Setting up monitoring and logging
- Implementing rate limiting on API endpoints
- Adding comprehensive test coverage

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
# Hackhathon_Forward_2025
