# How to View Your ABA 0048 Vehicle Data

## Quick Steps to Import and View Your Data

### Step 1: Import Your CSV Data

1. **The browser is now open at the Telemetry Import page** (http://localhost:3000/telemetry/import)

2. **Upload your CSV file:**

   - Click "Choose File"
   - Navigate to: `/Users/dominator/Desktop/hack/public/aba0048-sample.csv`
   - Or use your original CSV file (the import now supports your column format)
   - Click "Import"

3. **Wait for confirmation:**
   - You should see a success message
   - It will show "Imported: 31" (or the number of rows in your file)
   - The vehicle "ABA 0048" will be created in the database

### Step 2: View Your Data on the Dashboard

1. **Navigate to the Dashboard:**

   - Click "Dashboard" link in the top navigation
   - Or go to: http://localhost:3000/dashboard

2. **Select Your Vehicle:**

   - In the "Vehicle" dropdown, select "ABA 0048"
   - Click "Apply Filters"

3. **View Your Visualizations:**

   - **KPI Cards** show:

     - Distance Traveled: 0 km (your vehicle was stationary - all readings at same odometer)
     - Average Speed: 0 km/h (vehicle was idle)
     - Idle Time: ~31 minutes (engine off, speed 0)

   - **Charts** display:

     - Speed Over Time: Flat line at 0 (vehicle was parked)
     - Fuel Level Percentage: Slight variation from 43.61% to 43.67%

   - **Map** shows:
     - Location: Coordinates 5.434, 100.595 (appears to be in Malaysia/Thailand area)
     - Single marker (no route since vehicle didn't move)

### Step 3: Filter by Date Range (Optional)

Your data is from **August 1, 2025**, from **00:00:32 to 01:30:32**.

To see specific time periods:

1. Set "From": 2025-08-01T00:00
2. Set "To": 2025-08-01T01:00
3. Click "Apply Filters"

### Your Data Details

**Vehicle:** ABA 0048
**Time Period:** August 1, 2025, 00:00 - 01:30 (1.5 hours)
**Total Records:** 31 data points
**Location:** 5.434°N, 100.595°E (stationary)

**Observations from your data:**

- ✅ Vehicle was parked (Speed = 0 throughout)
- ✅ Engine was OFF (EngineStatus = FALSE)
- ✅ GPS signal was good (GPSLocated = TRUE)
- ✅ Fuel level stable around 43.6% (~126.7 liters)
- ✅ Battery voltage stable at 25.74-25.75V
- ✅ Odometer reading: 207,333.128 km (no movement)
- ✅ Direction: 307° (Northwest)

## Troubleshooting

### If Import Fails

- Check that the CSV has "Plate No." column (or it will default to "ABA 0048")
- Verify timestamps are in format: `2025-08-01T00:00:32`
- Ensure latitude and longitude are present

### If Vehicle Doesn't Appear

- Refresh the dashboard page
- Check that import succeeded (green success toast)
- Verify no errors were reported

### If Map Doesn't Show

- The map should show a single marker at coordinates 5.434, 100.595
- You can zoom in/out using mouse wheel
- The location appears to be in the Malaysia/Thailand region

## Next Steps

### Import More Data

If you have additional CSV files with movement data:

1. Go back to Telemetry Import
2. Upload files with different vehicles or time periods
3. Return to dashboard to compare

### Expected Results with Movement Data

When you have data where the vehicle actually moved:

- Distance will show km traveled (based on odometer delta)
- Average speed will show actual movement
- Map will display a route polyline
- Charts will show speed variations

### Column Names Supported

The system now accepts your exact column format:

- `Plate No.` → Vehicle identifier
- `Timestamp` → Date/time in ISO format
- `Latitude`, `Longitude` → GPS coordinates
- `Speed` → km/h
- `FuelLevelPercentage` → Percentage (0-100)
- `FuelLevelLitre` → Liters
- `EngineStatus` → TRUE/FALSE or ON/OFF
- `Direction` → Degrees (0-360)
- `BatteryVoltage` → Volts
- `Odometer` → Cumulative km
- `GPSLocated` → TRUE/FALSE or Located/Not Located

## Questions?

- Check the main README.md for detailed documentation
- See TESTING_GUIDE.md for full testing procedures
- Visit http://localhost:3000 for the home page

**Your data is ready to view! Open the browser to http://localhost:3000/dashboard** 🚀
