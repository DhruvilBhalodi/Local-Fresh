# -*- coding: utf-8 -*-
"""
Local-Fresh  --  Full System Diagnostic
Run: python db_diagnostic.py
"""
import sys, os

# force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def ok(msg):   print(f"  [OK]   {msg}")
def fail(msg): print(f"  [FAIL] {msg}")
def warn(msg): print(f"  [WARN] {msg}")
def head(msg): print(f"\n{'='*55}\n  {msg}\n{'='*55}")

errors = []

# ==============================================================
# 1.  DB CONNECTION
# ==============================================================
head("1 . MySQL Connection")
conn = None
users = []
try:
    import mysql.connector
    conn = mysql.connector.connect(
        host="localhost", user="root", password="root", database="localfresh"
    )
    ok("Connected to MySQL  (host=localhost, db=localfresh, user=root)")
except Exception as e:
    fail(f"Cannot connect to MySQL: {e}")
    errors.append("DB_CONNECT")

# ==============================================================
# 2.  TABLE EXISTENCE & ROW COUNTS
# ==============================================================
head("2 . Tables & Row Counts")

REQUIRED_TABLES = [
    "users",
    "fruits",
    "daily_records",
    "fruit_batches",
    "waste_log",
    "daily_predictions",
]

table_rows = {}
if conn:
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SHOW TABLES")
    existing = {list(r.values())[0].lower() for r in cursor.fetchall()}

    for tbl in REQUIRED_TABLES:
        if tbl in existing:
            cursor.execute(f"SELECT COUNT(*) as cnt FROM `{tbl}`")
            cnt = cursor.fetchone()['cnt']
            table_rows[tbl] = cnt
            ok(f"{tbl:<22} -> {cnt:>6} rows")
        else:
            fail(f"{tbl:<22} -> TABLE MISSING")
            errors.append(f"TABLE_{tbl.upper()}")

# ==============================================================
# 3.  SCHEMA COLUMNS CHECK
# ==============================================================
head("3 . Schema Columns Check")

EXPECTED_COLS = {
    "users":             ["user_id", "email", "pass", "user_name"],
    "fruits":            ["fruit_id", "fruit_name", "expiry_days"],
    "daily_records":     ["record_id", "user_id", "fruit_id", "date",
                          "quantity_sold", "waste_quantity",
                          "weather_condition", "max_temp_c",
                          "humidity_percentage", "precipitation_mm"],
    "fruit_batches":     ["batch_id", "user_id", "fruit_id",
                          "purchase_date", "spoilage_date",
                          "quantity_kg", "is_active"],
    "waste_log":         ["waste_id", "user_id", "fruit_id",
                          "waste_date", "waste_kg"],
    "daily_predictions": ["user_id", "predict_date", "prediction_json"],
}

if conn:
    for tbl, expected in EXPECTED_COLS.items():
        if tbl not in table_rows:
            warn(f"{tbl}: skipped (table missing)")
            continue
        cursor.execute(f"SHOW COLUMNS FROM `{tbl}`")
        actual = {r['Field'] for r in cursor.fetchall()}
        missing = [c for c in expected if c not in actual]
        if missing:
            fail(f"{tbl}: missing columns -> {missing}")
            errors.append(f"COLS_{tbl.upper()}")
        else:
            ok(f"{tbl}: all {len(expected)} expected columns present")

# ==============================================================
# 4.  SEED / REFERENCE DATA
# ==============================================================
head("4 . Seed / Reference Data")

if conn:
    cursor.execute("SELECT fruit_name, expiry_days FROM fruits ORDER BY fruit_id")
    fruits = cursor.fetchall()
    if fruits:
        ok(f"fruits table has {len(fruits)} entries:")
        for f in fruits:
            print(f"         {f['fruit_name']:<20}  expiry_days={f['expiry_days']}")
    else:
        fail("fruits table is EMPTY -- predictions will fail")
        errors.append("EMPTY_FRUITS")

    cursor.execute("SELECT user_id, user_name, email FROM users")
    users = cursor.fetchall()
    if users:
        ok(f"users table has {len(users)} registered user(s):")
        for u in users:
            print(f"         #{u['user_id']}  {u['user_name']:<20}  {u['email']}")
    else:
        warn("users table is EMPTY -- no one can log in yet")

# ==============================================================
# 5.  ML MODEL FILES
# ==============================================================
head("5 . ML Model Files")

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, 'models')

EXPECTED_MODELS = [
    'clf_which_fruit.pkl',
    'regressors_how_many_kg.pkl',
    'le_weather (1).pkl',
    'le_day (1).pkl',
    'le_weekend (1).pkl',
    'le_festival (1).pkl',
    'le_fruit (1).pkl',
]

if not os.path.isdir(MODEL_DIR):
    fail(f"models/ directory not found at {MODEL_DIR}")
    errors.append("MISSING_MODEL_DIR")
else:
    for mf in EXPECTED_MODELS:
        path = os.path.join(MODEL_DIR, mf)
        if os.path.exists(path):
            size_kb = os.path.getsize(path) / 1024
            ok(f"{mf:<38}  {size_kb:.1f} KB")
        else:
            fail(f"{mf} -- FILE MISSING")
            errors.append(f"MODEL_{mf}")

    try:
        import joblib, numpy as np
        clf        = joblib.load(os.path.join(MODEL_DIR, 'clf_which_fruit.pkl'))
        regs       = joblib.load(os.path.join(MODEL_DIR, 'regressors_how_many_kg.pkl'))
        le_weather = joblib.load(os.path.join(MODEL_DIR, 'le_weather (1).pkl'))
        le_fruit   = joblib.load(os.path.join(MODEL_DIR, 'le_fruit (1).pkl'))

        w_enc = int(le_weather.transform(['Sunny'])[0])
        dummy = [[w_enc, 0, 0, 0, 5, 1, 0, 35.0, 50.0, 0.0, 40.0, 60.0]]
        best_enc   = int(clf.predict(dummy)[0])
        best_fruit = le_fruit.inverse_transform([best_enc])[0]
        ok(f"Classifier smoke-test passed  ->  best_fruit = '{best_fruit}'")
        ok(f"Regressors loaded for {len(regs)} fruits: {list(regs.keys())}")
    except Exception as e:
        fail(f"Failed to load / run models: {e}")
        errors.append("MODEL_LOAD_ERROR")

# ==============================================================
# 6.  LIVE WEATHER API
# ==============================================================
head("6 . OpenWeatherMap Live Weather (Vadodara)")
try:
    import requests as req
    resp = req.get(
        "https://api.openweathermap.org/data/2.5/weather",
        params={
            'q':     'Vadodara,IN',
            'appid': 'aed7af0dfac764c8966b3af33535f01d',
            'units': 'metric'
        },
        timeout=6
    )
    resp.raise_for_status()
    data = resp.json()
    temp   = data['main']['temp']
    humid  = data['main']['humidity']
    desc   = data['weather'][0]['description'].title()
    owm_id = data['weather'][0]['id']
    rain   = data.get('rain', {}).get('1h', 0.0)
    ok(f"API reachable -> {desc}, {temp}C, humidity={humid}%, rain_1h={rain}mm  (OWM id={owm_id})")
except Exception as e:
    warn(f"Weather API call failed (will use seasonal fallback): {e}")

# ==============================================================
# 7.  FLASK ENDPOINT PING  (requires server running)
# ==============================================================
head("7 . Flask API Health Check  (http://localhost:5000)")
try:
    import requests as req
    uid = users[0]['user_id'] if users else 1
    r = req.get(f"http://localhost:5000/api/dashboard?user_id={uid}", timeout=4)
    j = r.json()
    if j.get('status') == 'success':
        ok(f"/api/dashboard responded OK for user_id={uid}")
        ok(f"  KPIs: totalSales={j['kpis']['totalSales']}  totalWaste={j['kpis']['totalWaste']}  efficiency={j['kpis']['efficiency']}%")
        ok(f"  pieData entries={len(j['pieData'])}   inventory rows={len(j['inventory'])}")
    else:
        warn(f"/api/dashboard returned: {j}")
except Exception as e:
    warn(f"Flask server not reachable: {e}  (Start app.py first)")

# ==============================================================
# SUMMARY
# ==============================================================
head("SUMMARY")
if not errors:
    print("  ALL CHECKS PASSED -- system is healthy!\n")
else:
    print(f"  {len(errors)} issue(s) found:")
    for e in errors:
        print(f"      - {e}")
    print()

if conn:
    cursor.close()
    conn.close()
