import mysql.connector
from datetime import date

dbconfig = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "localfresh"
}

try:
    conn = mysql.connector.connect(**dbconfig)
    cursor = conn.cursor(dictionary=True)
    
    print(f"Current Date: {date.today()}")
    
    # Check for batches that should be expired
    cursor.execute("""
        SELECT batch_id, fruit_id, quantity_kg, spoilage_date, is_active
        FROM fruit_batches
        WHERE is_active = 1 AND spoilage_date < CURDATE()
    """)
    to_expire = cursor.fetchall()
    print(f"\nBatches pending auto-expiry: {len(to_expire)}")
    for b in to_expire:
        print(b)
        
    # Check for already inactive batches with expired dates
    cursor.execute("""
        SELECT batch_id, fruit_id, quantity_kg, spoilage_date, is_active
        FROM fruit_batches
        WHERE is_active = 0 AND spoilage_date < CURDATE()
    """)
    already_expired = cursor.fetchall()
    print(f"\nBatches already inactive (expired): {len(already_expired)}")
    for b in already_expired:
        print(b)
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
