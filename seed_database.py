import csv
import mysql.connector
from mysql.connector import Error
import os

# ✅ 1. Configuration
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "localfresh"
}

# ✅ 2. Fruit Data
FRUIT_EXPIRY_MAP = {
    'Bananas': 4, 'Apples': 15, 'Oranges': 10, 'Grapes': 5, 'Papaya': 3,
    'Guava': 4, 'Pomegranate': 20, 'Mangoes': 5, 'Watermelon': 7, 'Custard Apple': 2
}

def seed_data():
    conn = None
    csv_filename = "C:\\Users\\dhruv\\Desktop\\Minor Project\\Local-Fresh\\localfresh_multi_user_data.csv"
    
    if not os.path.exists(csv_filename):
        print(f"❌ Error: '{csv_filename}' not found.")
        return

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        print("🚀 Connected to MySQL successfully.")

        # --- STEP 1: Sync Fruits Table ---
        print("📦 Syncing fruits table...")
        for name, days in FRUIT_EXPIRY_MAP.items():
            cursor.execute("""
                INSERT INTO fruits (fruit_name, expiry_days) 
                VALUES (%s, %s) 
                ON DUPLICATE KEY UPDATE expiry_days = VALUES(expiry_days)
            """, (name, days))
        conn.commit()

        # --- STEP 2: Create Mapping ---
        cursor.execute("SELECT fruit_id, fruit_name FROM fruits")
        fruit_map = {name: fid for (fid, name) in cursor.fetchall()}

        # --- STEP 3: Read CSV ---
        print(f"📖 Reading {csv_filename}...")
        data_to_insert = []
        
        with open(csv_filename, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                item_name = row['Item_Name']
                fid = fruit_map.get(item_name)
                
                if fid is not None:
                    holiday = row['Festival_or_Holiday'] if row['Festival_or_Holiday'] else None
                    
                    # ✅ Correctly appending EVERY row to the list inside the loop
                    data_to_insert.append((
                        int(row['user_id']),      # 1
                        row['Date'],             # 2
                        fid,                     # 3
                        int(row['Quantity_Sold']), 
                        int(row['Waste_Quantity']),
                        int(row['Starting_Inventory']), 
                        int(row['Restock_Quantity']), 
                        int(row['End_of_Day_Stock']), 
                        row['Weather_Condition'], 
                        float(row['Max_Temperature_C']), 
                        float(row['Humidity_Percentage']), 
                        float(row['Precipitation_mm']), 
                        holiday                  # 13
                    ))

        # --- STEP 4: Bulk Insert ---
        if data_to_insert:
            print(f"⚡ Importing {len(data_to_insert)} records...")
            
            # Clear old records to avoid duplicates during testing
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
            cursor.execute("TRUNCATE TABLE daily_records;")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
            
            insert_query = """
            INSERT INTO daily_records (
                user_id, date, fruit_id, quantity_sold, waste_quantity, 
                starting_inventory, restock_quantity, end_of_day_stock, 
                weather_condition, max_temp_c, humidity_percentage, 
                precipitation_mm, festival_or_holiday
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.executemany(insert_query, data_to_insert)
            conn.commit()
            print(f"🎉 SUCCESS! {cursor.rowcount} records inserted.")
        else:
            print("⚠️ No data found to import.")

    except Error as e:
        print(f"❌ MySQL Error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            print("🔌 Connection closed.")

if __name__ == "__main__":
    seed_data()