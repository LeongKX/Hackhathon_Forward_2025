# Quick Start Testing Guide

This guide will help you quickly test all features of the Fleet Management Platform.

## Prerequisites

The development server should be running:

```bash
npm run dev
# Server running at http://localhost:3000
```

## 🧪 Test Plan (5 minutes)

### Step 1: View Home Page (30 seconds)

1. Open http://localhost:3000
2. ✅ Verify: Beautiful landing page with 3 feature cards
3. ✅ Verify: Theme toggle in header (click to test light/dark mode)
4. ✅ Verify: Navigation links work

### Step 2: Test Participants Import (1 minute)

1. Click "Import Participants" or navigate to http://localhost:3000/import
2. Click "Sample CSV" link to download or use `/public/sample.csv`
3. Click "Choose File" and select the sample CSV
4. Click "Import" button
5. ✅ Verify: Success toast appears
6. ✅ Verify: Shows "Imported: 3, Skipped: 0"
7. ✅ Try importing the same file again
8. ✅ Verify: Shows "Imported: 3, Skipped: 0" (upsert behavior)

### Step 3: Test Telemetry Import (1 minute)

1. Navigate to http://localhost:3000/telemetry/import
2. Click "Sample CSV" link or use `/public/telemetry-sample.csv`
3. Click "Choose File" and select the telemetry sample CSV
4. Click "Import" button (may take 1-2 seconds)
5. ✅ Verify: Success toast appears
6. ✅ Verify: Shows "Imported: 20"
7. ✅ Verify: No errors reported

### Step 4: Test Dashboard - Basic View (1 minute)

1. Click "Dashboard" link or navigate to http://localhost:3000/dashboard
2. ✅ Verify: Vehicle dropdown shows 3 vehicles (ABC1234, XYZ5678, DEF9012)
3. ✅ Verify: KPI cards display values:
   - Distance Traveled (should show km)
   - Average Speed (should show km/h)
   - Idle Time (should show minutes)
4. ✅ Verify: Two charts render:
   - Speed Over Time (blue line)
   - Fuel Level Percentage (green line)
5. ✅ Verify: Map displays with route polyline and marker

### Step 5: Test Dashboard - Filters (1.5 minutes)

1. Select different vehicle from dropdown (e.g., XYZ5678)
2. Click "Apply Filters"
3. ✅ Verify: All visualizations update with new data
4. ✅ Verify: Map shows different route

5. Set date/time filters:
   - From: 2025-10-23T08:00
   - To: 2025-10-23T08:15
6. Click "Apply Filters"
7. ✅ Verify: KPIs update with filtered data
8. ✅ Verify: Charts show only data in range
9. ✅ Verify: Map shows shorter route

### Step 6: Test Error Handling (1 minute)

#### Test Invalid Participant CSV

1. Create a test CSV with invalid data:

```csv
name,email,team,score
John Doe,invalid-email,Team A,95
,jane@example.com,Team B,88
Bob,bob@test,Team C,not-a-number
```

2. Import this CSV
3. ✅ Verify: Errors displayed with row numbers
4. ✅ Verify: Valid rows still imported

#### Test Invalid Telemetry CSV

1. Create a test CSV with missing required fields:

```csv
Plate No.,Timestamp,Latitude,Longitude
,2025-10-23T10:00:00Z,1.3521,103.8198
TEST123,invalid-date,1.3521,103.8198
TEST456,2025-10-23T10:00:00Z,,
```

2. Import this CSV
3. ✅ Verify: Errors displayed with specific reasons
4. ✅ Verify: No crash, application remains functional

## 🎨 Visual Tests

### Theme Toggle

1. Click theme toggle in header multiple times
2. ✅ Verify: Smooth transition between light and dark modes
3. ✅ Verify: All text remains readable in both modes
4. ✅ Verify: Charts, maps, and cards adapt to theme

### Responsive Design

1. Resize browser window to mobile width (~400px)
2. ✅ Verify: Navigation collapses appropriately
3. ✅ Verify: Dashboard cards stack vertically
4. ✅ Verify: Charts remain readable
5. ✅ Verify: Forms are usable

### Empty States

1. Navigate to dashboard without importing telemetry
2. ✅ Verify: Helpful message appears
3. ✅ Verify: Link to import page provided

## 🔍 Console Check

Open browser DevTools (F12) and check:

- ✅ No errors in Console tab
- ✅ No hydration errors
- ✅ No 404 errors in Network tab
- ✅ No accessibility warnings

## 📱 Cross-Browser Testing (Optional)

Test in multiple browsers:

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if on macOS)

## 🚀 Production Build Test

```bash
# Build for production
npm run build

# Start production server
npm start

# Test at http://localhost:3000
```

✅ Verify: All features work in production build

## 📊 Performance Check

1. Open DevTools → Lighthouse
2. Run audit for:
   - Performance
   - Accessibility
   - Best Practices
   - SEO

Expected scores:

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

## ✅ Final Checklist

After completing all tests:

- [x] Home page loads and looks good
- [x] Theme toggle works
- [x] Participants import succeeds
- [x] Telemetry import succeeds
- [x] Dashboard displays all vehicles
- [x] Filters update visualizations
- [x] KPIs show correct calculations
- [x] Charts render properly
- [x] Map shows routes and markers
- [x] Error handling works gracefully
- [x] No console errors
- [x] Responsive on mobile
- [x] Build succeeds
- [x] Lint passes
- [x] TypeScript compiles

## 🎯 Success Criteria

**All tests pass = Ready for demo/production! 🎉**

## 🐛 Troubleshooting

### Database Issues

```bash
# Reset database
rm dev.db
npx prisma migrate dev
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
npx prisma generate
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Clear Browser Cache

1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
2. Or clear cache in DevTools

## 📸 Screenshots for Pitch Deck

Recommended screenshots to capture:

1. **Home Page**: Show feature cards and clean design
2. **Participants Import**: Show success message with import summary
3. **Telemetry Import**: Show large import with row count
4. **Dashboard - Overview**: Show KPIs, charts, and map together
5. **Dashboard - Filtered**: Show specific vehicle with date range
6. **Charts Close-up**: Detailed view of speed/fuel charts
7. **Map View**: Route visualization with polyline and marker
8. **Theme Toggle**: Side-by-side light and dark mode
9. **Mobile View**: Responsive design on small screen
10. **Error Handling**: Graceful error display with details

## 🎬 Demo Script (2-minute pitch)

1. **Start**: "Fleet Management Platform - Turn GPS data into insights"
2. **Show Home**: "Clean, modern interface with clear navigation"
3. **Import Data**: "Easy CSV import with smart validation" (demo telemetry)
4. **Dashboard**: "Real-time KPIs and interactive visualizations"
5. **Filter**: "Drill down by vehicle and time range"
6. **Map**: "Visual route tracking with OpenStreetMap"
7. **Theme**: "Built-in dark mode support"
8. **Close**: "Production-ready, type-safe, fully documented"

Total time: ~2 minutes with smooth transitions

---

**Happy Testing! 🚀**
