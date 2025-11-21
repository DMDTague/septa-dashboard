import pandas as pd
from pathlib import Path

# Folder with all your SEPTA CSVs
DATA_DIR = Path.home() / "Desktop" / "SeptaCsv"

csv_files = {
    # Ridership by mode/route
    "average_daily_ridership_by_mode": "Average_Daily_Ridership_By_Mode.csv",
    "average_daily_ridership_by_route": "Average_Daily_Ridership_By_Route.csv",

    # Bus geography
    "bus_by_census_tract": "Bus_Ridership_by_Census_Tract.csv",
    "bus_by_county": "Bus_Ridership_by_County.csv",
    "bus_by_municipality": "Bus_Ridership_by_Municipality.csv",
    "bus_by_city_council": "Bus_Ridership_by_Philadelphia_City_Council_District.csv",
    "bus_by_city_ward": "Bus_Ridership_by_Philadelphia_City_Ward.csv",

    # Financials
    "detail_of_expenses": "Detail_of_Expenses.csv",
    "detail_of_expenses_by_company": "Detail_of_Expenses_by_Company.csv",
    "proj_fy23_fy28": "FY_23_to_FY_28_Financial_Projections.csv",
    "proj_fy24_fy29": "FY_24_to_FY_29_Financial_Projections.csv",

    # Seasonal stop summaries – Bus
    "fall_2014_bus_stops": "Fall_2014_Stop_Summary_(Bus).csv",
    "fall_2015_bus_stops": "Fall_2015_Stop_Summary_(Bus).csv",
    "fall_2016_bus_stops": "Fall_2016_Stop_Summary_(Bus).csv",
    "fall_2017_bus_stops": "Fall_2017_Stop_Summary_(Bus).csv",
    "fall_2018_bus_stops": "Fall_2018_Stop_Summary_(Bus).csv",
    "fall_2019_bus_stops": "Fall_2019_Stop_Summary_(Bus).csv",
    "fall_2021_bus_stops": "Fall_2021_Stop_Summary_(Bus).csv",
    "fall_2022_bus_stops": "Fall_2022_Stop_Summary_(Bus).csv",
    "fall_2023_bus_stops": "Fall_2023_Stop_Summary_(Bus).csv",

    # Seasonal stop summaries – Trolley
    "fall_2023_trolley_stops": "Fall_2023_Stop_Summary_(Trolley).csv",
    "spring_2024_bus_stops": "Spring_2024_Stop_Summary_(Bus).csv",
    "spring_2024_trolley_stops": "Spring_2024_Stop_Summary_(Trolley).csv",
    "summer_2025_bus_stops": "Summer_2025_Stop_Summary_(Bus).csv",

    # Rail + high-speed
    "highspeed_lines": "Highspeed_Lines.csv",
    "highspeed_stations": "Highspeed_Stations.csv",
    "regional_rail_lines": "Regional_Rail_Lines.csv",
    "regional_rail_station_summary": "Regional_Rail_Station_Summary.csv",
    "regional_rail_stations": "Regional_Rail_Stations.csv",

    # Network
    "transit_routes_spring_2024": "Transit_Routes_(Spring_2024).csv",
    "transit_stops_spring_2025": "Transit_Stops_(Spring_2025).csv",

    # Trolley network
    "trolley_lines": "Trolley_Lines.csv",
    "trolley_stations": "Trolley_Stations.csv",
}

dfs = {}
for key, filename in csv_files.items():
    path = DATA_DIR / filename
    try:
        df = pd.read_csv(path)
        dfs[key] = df
    except Exception as e:
        print(f"ERROR reading {filename}: {e}")

print(f"\nLoaded {len(dfs)}/{len(csv_files)} tables.\n")

for name, df in dfs.items():
    print(f"{name:35s}  shape={df.shape}")

print("\n=== Peek: average_daily_ridership_by_mode ===")
df_mode = dfs.get("average_daily_ridership_by_mode")
if df_mode is not None:
    print(df_mode.head())
else:
    print("Table not loaded.")
