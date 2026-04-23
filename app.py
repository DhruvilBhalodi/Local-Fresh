from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling
import joblib
import numpy as np
from datetime import datetime, timedelta, date
import os

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# ─── DB Config ────────────────────────────────────────────────────────────────
dbconfig = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "localfresh"
}

connection_pool = pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=5,
    pool_reset_session=True,
    **dbconfig
)

def get_db():
    return connection_pool.get_connection()

# ─── Create new tables if they don't exist ────────────────────────────────────
def init_tables():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fruit_batches (
            batch_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            fruit_id INT NOT NULL,
            purchase_date DATE NOT NULL,
            spoilage_date DATE NOT NULL,
            quantity_kg FLOAT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (user_id) REFERENCES users(user_id),
            FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS waste_log (
            waste_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            fruit_id INT NOT NULL,
            waste_date DATE NOT NULL,
            waste_kg FLOAT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(user_id),
            FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_predictions (
            user_id INT NOT NULL,
            predict_date DATE NOT NULL,
            prediction_json JSON,
            PRIMARY KEY (user_id, predict_date),
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    conn.commit()
    cursor.close()
    conn.close()

def get_shelf_status(user_id, today_dt):
    shelf_status = {}
    alerts = {"expired": [], "expiring_today": [], "expiring_soon": []}
    if user_id:
        try:
            conn = get_db()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT f.fruit_name, b.spoilage_date, b.quantity_kg
                FROM fruit_batches b
                JOIN fruits f ON b.fruit_id = f.fruit_id
                WHERE b.user_id = %s AND b.is_active = 1
            """, (user_id,))
            batches = cursor.fetchall()
            cursor.close()
            conn.close()

            batch_map = {}
            for row in batches:
                fn = row['fruit_name']
                sd = row['spoilage_date']
                if isinstance(sd, str):
                    sd = datetime.strptime(sd, '%Y-%m-%d').date()
                if fn not in batch_map or sd < batch_map[fn]:
                    batch_map[fn] = sd

            today_date_only = today_dt.date()
            for fn, sd in batch_map.items():
                days_left = (sd - today_date_only).days
                if days_left < 0:
                    shelf_status[fn] = {"flag": "EXPIRED", "message": "Batch expired!"}
                    alerts["expired"].append(fn)
                elif days_left == 0:
                    shelf_status[fn] = {"flag": "EXPIRING_TODAY", "message": "Expires today!"}
                    alerts["expiring_today"].append(fn)
                elif days_left <= 2:
                    shelf_status[fn] = {"flag": "EXPIRING_SOON", "message": f"{days_left} day(s) left"}
                    alerts["expiring_soon"].append(fn)
                else:
                    shelf_status[fn] = {"flag": "OK", "message": f"{days_left} days left"}
        except Exception:
            pass

    for fn in FRUIT_SHELF_LIFE:
        if fn not in shelf_status:
            shelf_status[fn] = {"flag": "NO_BATCH", "message": "No batch recorded"}
            
    return shelf_status, alerts

# ─── Load ML Models at startup ────────────────────────────────────────────────
BASE = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE, 'models')

clf = joblib.load(os.path.join(MODEL_DIR, 'clf_which_fruit.pkl'))
regressors = joblib.load(os.path.join(MODEL_DIR, 'regressors_how_many_kg.pkl'))
le_weather = joblib.load(os.path.join(MODEL_DIR, 'le_weather (1).pkl'))
le_day = joblib.load(os.path.join(MODEL_DIR, 'le_day (1).pkl'))
le_weekend = joblib.load(os.path.join(MODEL_DIR, 'le_weekend (1).pkl'))
le_festival = joblib.load(os.path.join(MODEL_DIR, 'le_festival (1).pkl'))
le_fruit = joblib.load(os.path.join(MODEL_DIR, 'le_fruit (1).pkl'))

# ─── Constants ────────────────────────────────────────────────────────────────
FRUIT_SHELF_LIFE = {
    'Bananas': 5, 'Mangoes': 7, 'Apples': 14, 'Oranges': 10,
    'Grapes': 7, 'Custard Apple': 6, 'Watermelon': 12,
    'Papaya': 5, 'Guava': 8, 'Pomegranate': 10,
}

AVG_ROLLING_SALES = {
    'Bananas': 51.2, 'Apples': 43.8, 'Oranges': 38.5, 'Grapes': 29.1,
    'Mangoes': 47.3, 'Papaya': 22.4, 'Guava': 31.2, 'Pomegranate': 18.6,
    'Watermelon': 35.8, 'Custard Apple': 15.3
}

AVG_PRICE_PER_KG = {
    'Bananas': 35.5, 'Apples': 85.2, 'Oranges': 42.0, 'Grapes': 95.0,
    'Mangoes': 80.0, 'Papaya': 28.0, 'Guava': 35.0, 'Pomegranate': 110.0,
    'Watermelon': 18.0, 'Custard Apple': 60.0
}

AVG_DAILY_QTY = {
    'Bananas': 45.3, 'Apples': 32.1, 'Oranges': 28.7, 'Grapes': 22.4,
    'Mangoes': 38.5, 'Papaya': 18.2, 'Guava': 24.6, 'Pomegranate': 15.8,
    'Watermelon': 30.1, 'Custard Apple': 12.4
}

FRUIT_EMOJIS = {
    'Bananas': '🍌', 'Apples': '🍎', 'Oranges': '🍊', 'Grapes': '🍇',
    'Mangoes': '🥭', 'Papaya': '🧡', 'Guava': '🍐', 'Pomegranate': '❤️',
    'Watermelon': '🍉', 'Custard Apple': '💚'
}

SEASONS = {0: 'Winter', 1: 'Spring', 2: 'Monsoon', 3: 'Autumn'}

# ─── Helpers ──────────────────────────────────────────────────────────────────
def safe_encode(encoder, value):
    try:
        return int(encoder.transform([value])[0])
    except Exception:
        return 0

def get_season(month):
    if month in [12, 1, 2]: return 0   # Winter
    if month in [3, 4, 5]: return 1    # Spring
    if month in [6, 7, 8]: return 2    # Monsoon
    return 3                            # Autumn

def get_mock_weather(month):
    seasonal = {
        12: ('Sunny', 22, 60, 0), 1: ('Sunny', 20, 62, 0), 2: ('Sunny', 23, 58, 0),
        3: ('Sunny', 28, 55, 0), 4: ('Sunny', 32, 50, 0), 5: ('Cloudy', 35, 60, 0),
        6: ('Rainy', 30, 85, 5), 7: ('Rainy', 28, 90, 8), 8: ('Rainy', 27, 88, 6),
        9: ('Cloudy', 28, 80, 2), 10: ('Sunny', 30, 65, 0), 11: ('Sunny', 26, 60, 0)
    }
    w, t, h, p = seasonal.get(month, ('Sunny', 28, 65, 0))
    return {'weather_condition': w, 'temperature_c': t, 'humidity': h, 'precipitation_mm': p}

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    identifier = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT user_id, email, pass, user_name FROM users WHERE email = %s OR user_name = %s",
        (identifier, identifier)
    )
    user_record = cursor.fetchone()
    cursor.close()
    conn.close()

    if user_record and user_record['pass'] == password:
        return jsonify({
            "status": "success",
            "user_name": user_record["user_name"],
            "email": user_record["email"],
            "user_id": user_record["user_id"]
        })
    else:
        return jsonify({"status": "failed", "message": "Invalid email or password"})


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    user_name = data.get('user_name', '').strip()

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT email, user_name FROM users WHERE email = %s OR user_name = %s",
        (email, user_name)
    )
    existing = cursor.fetchone()

    if existing:
        cursor.close()
        conn.close()
        return jsonify({"status": "failed", "message": "Email or username already exists"})

    cursor.execute(
        "INSERT INTO users (email, pass, user_name) VALUES (%s, %s, %s)",
        (email, password, user_name)
    )
    new_id = cursor.lastrowid
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "status": "success",
        "message": "User registered successfully",
        "user_id": new_id,
        "user_name": user_name,
        "email": email
    })


@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        body = request.json or {}
        user_id = body.get('user_id')
        festival = body.get('festival', 'None')
        use_live_weather = body.get('use_live_weather', False)
        custom_weather = body.get('custom_weather', {})

        # ── Date/Time context ──
        today = datetime.now()
        month = today.month
        day_of_week = today.strftime('%A')   # e.g. "Wednesday"
        is_weekend_val = 1 if today.weekday() >= 5 else 0
        is_weekend_str = "Yes" if is_weekend_val else "No"
        season_idx = get_season(month)
        season_name = SEASONS[season_idx]
        is_festival = 0 if festival in ['None', '', None] else 1

        # ── Weather ──
        if use_live_weather or not custom_weather:
            weather = get_mock_weather(month)
        else:
            weather = {
                'weather_condition': custom_weather.get('weather_condition', 'Sunny'),
                'temperature_c': custom_weather.get('temperature_c', 30),
                'humidity': custom_weather.get('humidity', 65),
                'precipitation_mm': custom_weather.get('precipitation_mm', 0)
            }

        w_cond = weather['weather_condition']
        temp = float(weather['temperature_c'])
        humidity = float(weather['humidity'])
        precip = float(weather['precipitation_mm'])

        # ── Encode categoricals ──
        w_e  = safe_encode(le_weather, w_cond)
        d_e  = safe_encode(le_day, day_of_week)
        we_e = safe_encode(le_weekend, 'Yes' if is_weekend_val else 'No')
        f_e  = safe_encode(le_festival, festival if festival else 'None')

        # ── Fetch custom averages and yesterday's records for this user ──
        yesterday = (today - timedelta(days=1)).date()
        prev_waste = {fr: 0.0 for fr in FRUIT_SHELF_LIFE}
        
        user_rolling = {}
        user_avg_qty = {}

        if user_id:
            try:
                conn = get_db()
                cursor = conn.cursor(dictionary=True)
                
                # Fetch 7-day rolling average for this user
                cursor.execute("""
                    SELECT f.fruit_name, AVG(d.quantity_sold) as rolling_avg
                    FROM daily_records d
                    JOIN fruits f ON d.fruit_id = f.fruit_id
                    WHERE d.user_id = %s AND d.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                    GROUP BY f.fruit_name
                """, (user_id,))
                for row in cursor.fetchall():
                    if row['rolling_avg'] is not None:
                        user_rolling[row['fruit_name']] = float(row['rolling_avg'])
                
                # Fetch 30-day average daily quantity for this user
                cursor.execute("""
                    SELECT f.fruit_name, AVG(d.quantity_sold) as avg_qty
                    FROM daily_records d
                    JOIN fruits f ON d.fruit_id = f.fruit_id
                    WHERE d.user_id = %s AND d.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                    GROUP BY f.fruit_name
                """, (user_id,))
                for row in cursor.fetchall():
                    if row['avg_qty'] is not None:
                        user_avg_qty[row['fruit_name']] = float(row['avg_qty'])

                # Fetch yesterday's records
                cursor.execute("""
                    SELECT f.fruit_name, d.waste_quantity, d.quantity_sold
                    FROM daily_records d
                    JOIN fruits f ON d.fruit_id = f.fruit_id
                    WHERE d.user_id = %s AND d.date = %s
                """, (user_id, yesterday))
                rows = cursor.fetchall()
                cursor.close()
                conn.close()
                
                # Default prev_qty based on user's custom 30 day avg else the global const
                prev_qty = {fr: user_avg_qty.get(fr, AVG_DAILY_QTY.get(fr, 20.0)) for fr in FRUIT_SHELF_LIFE}
                
                for row in rows:
                    fn = row['fruit_name']
                    if fn in prev_waste:
                        prev_waste[fn] = float(row['waste_quantity'] or 0)
                        prev_qty[fn]   = float(row['quantity_sold'] or user_avg_qty.get(fn, AVG_DAILY_QTY.get(fn, 20)))
            except Exception:
                prev_qty = {fr: AVG_DAILY_QTY.get(fr, 20.0) for fr in FRUIT_SHELF_LIFE}
        else:
            prev_qty = {fr: AVG_DAILY_QTY.get(fr, 20.0) for fr in FRUIT_SHELF_LIFE}

        # ── Classifier input (12 features) ──
        # [w_enc, d_enc, we_enc, f_enc, Month, Season, Is_Festival,
        #  Max_Temp_C, Humidity_%, Precipitation_mm, Rolling_7Day_Avg, Price_Per_Kg]
        # Use a representative fruit's avg values for the classifier
        user_rolls = list(user_rolling.values())
        avg_rolling_all = np.mean(user_rolls) if len(user_rolls) > 0 else np.mean(list(AVG_ROLLING_SALES.values()))
        avg_price_all   = np.mean(list(AVG_PRICE_PER_KG.values()))

        clf_input = [[
            w_e, d_e, we_e, f_e,
            month, season_idx, is_festival,
            temp, humidity, precip,
            avg_rolling_all, avg_price_all
        ]]

        best_enc = int(clf.predict(clf_input)[0])
        best_fruit = le_fruit.inverse_transform([best_enc])[0]
        proba = clf.predict_proba(clf_input)[0]
        # Guard: best_enc might be out of proba bounds if label count differs
        confidence = round(float(proba[best_enc]) * 100, 1) if best_enc < len(proba) else 0.0

        # ── Regressor predictions per fruit (14 features) ──
        recommendations = {}
        for fruit, reg in regressors.items():
            avg_roll  = user_rolling.get(fruit, AVG_ROLLING_SALES.get(fruit, avg_rolling_all))
            avg_price = AVG_PRICE_PER_KG.get(fruit, avg_price_all)
            pw        = prev_waste.get(fruit, 0.0)
            pq        = prev_qty.get(fruit, user_avg_qty.get(fruit, AVG_DAILY_QTY.get(fruit, 20.0)))

            reg_input = [[
                w_e, d_e, we_e, f_e,
                month, season_idx, is_festival,
                temp, humidity, precip,
                avg_roll, avg_price,
                pw, pq
            ]]
            qty = reg.predict(reg_input)[0]
            recommendations[fruit] = max(0, round(float(qty), 1))

        shelf_status, alerts = get_shelf_status(user_id, today)
        total_order_kg = round(sum(recommendations.values()), 1)
        today_date = today.date()

        result_data = {
            "status": "success",
            "date": today.strftime('%Y-%m-%d'),
            "weather": {
                "condition": w_cond,
                "temperature_c": temp,
                "humidity": humidity,
                "precipitation_mm": precip
            },
            "season": season_name,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend_str,
            "festival": festival or "None",
            "best_fruit": best_fruit,
            "best_fruit_confidence": confidence,
            "best_fruit_emoji": FRUIT_EMOJIS.get(best_fruit, "🍑"),
            "recommendations": recommendations,
            "total_order_kg": total_order_kg
        }
        
        if user_id:
            try:
                import json
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO daily_predictions (user_id, predict_date, prediction_json)
                    VALUES (%s, %s, %s)
                    ON DUPLICATE KEY UPDATE prediction_json = VALUES(prediction_json)
                """, (user_id, today_date, json.dumps(result_data)))
                conn.commit()
                cursor.close()
                conn.close()
            except Exception as e:
                pass

        # Append dynamic properties
        result_data['shelf_status'] = shelf_status
        result_data['alerts'] = alerts

        return jsonify(result_data)

    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e), "trace": traceback.format_exc()}), 500


@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"status": "error", "message": "User ID is required"}), 400

    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # 1. KPIs
        cursor.execute("""
            SELECT
                COALESCE(SUM(quantity_sold), 0) as totalSales,
                COALESCE(SUM(waste_quantity), 0) as totalWaste,
                ROUND(
                    COALESCE(SUM(quantity_sold), 0) /
                    NULLIF(COALESCE(SUM(quantity_sold), 0) + COALESCE(SUM(waste_quantity), 0), 0) * 100, 1
                ) as efficiency
            FROM daily_records WHERE user_id = %s
        """, (user_id,))
        kpis = cursor.fetchone()
        if kpis and kpis.get('efficiency') is None:
            kpis['efficiency'] = 0.0

        # 2. Pie chart data
        cursor.execute("""
            SELECT f.fruit_name as name, SUM(d.quantity_sold) as value
            FROM daily_records d
            JOIN fruits f ON d.fruit_id = f.fruit_id
            WHERE d.user_id = %s AND d.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY f.fruit_name
            ORDER BY value DESC
            LIMIT 6
        """, (user_id,))
        pie_data = cursor.fetchall()
        for row in pie_data:
            row['value'] = float(row['value'] or 0)

        # 3. Recent inventory
        cursor.execute("""
            SELECT f.fruit_name as product, SUM(b.quantity_kg) as stock
            FROM fruit_batches b
            JOIN fruits f ON b.fruit_id = f.fruit_id
            WHERE b.user_id = %s AND b.is_active = 1
            GROUP BY f.fruit_name
            ORDER BY stock DESC
        """, (user_id,))
        inventory_raw = cursor.fetchall()
        inventory = []
        for item in inventory_raw:
            inventory.append({
                'product': item['product'],
                'stock': round(float(item['stock'] or 0), 1)
            })

        # 4. Alerts from fruit_batches
        cursor.execute("""
            SELECT f.fruit_name, b.spoilage_date, b.quantity_kg
            FROM fruit_batches b
            JOIN fruits f ON b.fruit_id = f.fruit_id
            WHERE b.user_id = %s AND b.is_active = 1
            AND b.spoilage_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
            ORDER BY b.spoilage_date ASC
        """, (user_id,))
        alert_rows = cursor.fetchall()
        db_alerts = []
        for a in alert_rows:
            sd = a['spoilage_date']
            sd_str = sd.isoformat() if hasattr(sd, 'isoformat') else str(sd)
            db_alerts.append({
                "message": f"⚠️ {a['fruit_name']} ({a['quantity_kg']} kg) expires on {sd_str}",
                "fruit": a['fruit_name'],
                "spoilage_date": sd_str
            })

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "kpis": kpis,
            "pieData": pie_data,
            "inventory": inventory,
            "alerts": db_alerts
        })

    except Exception as e:
        import traceback
        return jsonify({"status": "error", "message": str(e), "trace": traceback.format_exc()}), 500


@app.route('/api/record-purchase', methods=['POST'])
def record_purchase():
    try:
        body = request.json or {}
        user_id = body.get('user_id')
        fruits = body.get('fruits', [])
        quantities = body.get('quantities', {})

        if not user_id or not fruits:
            return jsonify({"status": "error", "message": "user_id and fruits are required"}), 400

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # Get fruit IDs and expiry days
        cursor.execute("SELECT fruit_id, fruit_name, expiry_days FROM fruits")
        all_fruits = {row['fruit_name']: row for row in cursor.fetchall()}

        today = date.today()
        recorded = 0

        for fruit_name in fruits:
            if fruit_name not in all_fruits:
                continue
            fruit_info = all_fruits[fruit_name]
            fruit_id = fruit_info['fruit_id']
            expiry_days = fruit_info['expiry_days']
            qty = float(quantities.get(fruit_name, 0))
            if qty <= 0:
                continue

            spoilage_date = today + timedelta(days=expiry_days)
            cursor.execute("""
                INSERT INTO fruit_batches (user_id, fruit_id, purchase_date, spoilage_date, quantity_kg, is_active)
                VALUES (%s, %s, %s, %s, %s, TRUE)
            """, (user_id, fruit_id, today, spoilage_date, qty))
            recorded += 1

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "recorded": recorded})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/update-waste', methods=['POST'])
def update_waste():
    try:
        body = request.json or {}
        user_id = body.get('user_id')
        waste_data = body.get('waste_data', {})
        waste_date_str = body.get('date', date.today().isoformat())

        if not user_id:
            return jsonify({"status": "error", "message": "user_id is required"}), 400

        try:
            waste_date = datetime.strptime(waste_date_str, '%Y-%m-%d').date()
        except ValueError:
            waste_date = date.today()

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # Get fruit ID map
        cursor.execute("SELECT fruit_id, fruit_name FROM fruits")
        fruit_map = {row['fruit_name']: row['fruit_id'] for row in cursor.fetchall()}

        # Verify stock first
        cursor.execute("""
            SELECT f.fruit_name, SUM(b.quantity_kg) as stock
            FROM fruit_batches b
            JOIN fruits f ON b.fruit_id = f.fruit_id
            WHERE b.user_id = %s AND b.is_active = 1
            GROUP BY f.fruit_name
        """, (user_id,))
        active_stock = {row['fruit_name']: float(row['stock'] or 0) for row in cursor.fetchall()}

        for fruit_name, qty_str in waste_data.items():
            qty_waste = float(qty_str)
            if qty_waste > 0:
                available = active_stock.get(fruit_name, 0.0)
                if qty_waste > available:
                    cursor.close()
                    conn.close()
                    return jsonify({"status": "error", "message": f"Cannot log {qty_waste} kg waste for {fruit_name}. Only {available} kg in stock."}), 400

        inserted = 0
        for fruit_name, waste_kg_str in waste_data.items():
            waste_kg = float(waste_kg_str)
            if fruit_name not in fruit_map or waste_kg <= 0:
                continue
            
            fid = fruit_map[fruit_name]
            cursor.execute("""
                INSERT INTO waste_log (user_id, fruit_id, waste_date, waste_kg)
                VALUES (%s, %s, %s, %s)
            """, (user_id, fid, waste_date, waste_kg))
            
            # Deduct from fruit_batches shelf stock
            cursor.execute("""
                SELECT batch_id, quantity_kg FROM fruit_batches 
                WHERE user_id = %s AND fruit_id = %s AND is_active = 1
                ORDER BY spoilage_date ASC
            """, (user_id, fid))
            
            batches = cursor.fetchall()
            remaining_to_deduct = waste_kg
            for b in batches:
                if remaining_to_deduct <= 0:
                    break
                deduct = min(b['quantity_kg'], remaining_to_deduct)
                new_qty = b['quantity_kg'] - deduct
                remaining_to_deduct -= deduct
                
                if new_qty <= 0:
                    cursor.execute("UPDATE fruit_batches SET quantity_kg = 0, is_active = 0 WHERE batch_id = %s", (b['batch_id'],))
                else:
                    cursor.execute("UPDATE fruit_batches SET quantity_kg = %s WHERE batch_id = %s", (new_qty, b['batch_id']))

            # Update daily_records so the ML model can see this waste
            cursor.execute("""
                SELECT record_id FROM daily_records 
                WHERE user_id = %s AND fruit_id = %s AND date = %s
            """, (user_id, fid, waste_date))
            
            existing = cursor.fetchone()
            if existing:
                cursor.execute("""
                    UPDATE daily_records 
                    SET waste_quantity = waste_quantity + %s
                    WHERE record_id = %s
                """, (waste_kg, existing['record_id']))
            else:
                cursor.execute("""
                    INSERT INTO daily_records (user_id, fruit_id, date, quantity_sold, waste_quantity, starting_inventory, restock_quantity, end_of_day_stock) 
                    VALUES (%s, %s, %s, 0, %s, 0, 0, 0)
                """, (user_id, fid, waste_date, waste_kg))

            inserted += 1

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "logged": inserted})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/update-sales', methods=['POST'])
def update_sales():
    try:
        body = request.json or {}
        user_id = body.get('user_id')
        sales_data = body.get('sales_data', {})
        sales_date_str = body.get('date', date.today().isoformat())

        if not user_id:
            return jsonify({"status": "error", "message": "user_id is required"}), 400

        try:
            sales_date = datetime.strptime(sales_date_str, '%Y-%m-%d').date()
        except ValueError:
            sales_date = date.today()

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # Get fruit ID map
        cursor.execute("SELECT fruit_id, fruit_name FROM fruits")
        fruit_map = {row['fruit_name']: row['fruit_id'] for row in cursor.fetchall()}

        # Verify stock first
        cursor.execute("""
            SELECT f.fruit_name, SUM(b.quantity_kg) as stock
            FROM fruit_batches b
            JOIN fruits f ON b.fruit_id = f.fruit_id
            WHERE b.user_id = %s AND b.is_active = 1
            GROUP BY f.fruit_name
        """, (user_id,))
        active_stock = {row['fruit_name']: float(row['stock'] or 0) for row in cursor.fetchall()}

        for fruit_name, qty_str in sales_data.items():
            qty_sold = float(qty_str)
            if qty_sold > 0:
                available = active_stock.get(fruit_name, 0.0)
                if qty_sold > available:
                    cursor.close()
                    conn.close()
                    return jsonify({"status": "error", "message": f"Cannot log {qty_sold} kg sales for {fruit_name}. Only {available} kg in stock."}), 400

        # Insert or update daily_records
        inserted = 0
        for fruit_name, qty_sold_str in sales_data.items():
            qty_sold = float(qty_sold_str)
            if fruit_name not in fruit_map or qty_sold <= 0:
                continue
            
            fid = fruit_map[fruit_name]
            
            # Check if record exists for this date and fruit
            cursor.execute("""
                SELECT record_id FROM daily_records 
                WHERE user_id = %s AND fruit_id = %s AND date = %s
            """, (user_id, fid, sales_date))
            
            existing = cursor.fetchone()
            
            if existing:
                cursor.execute("""
                    UPDATE daily_records 
                    SET quantity_sold = quantity_sold + %s
                    WHERE record_id = %s
                """, (qty_sold, existing['record_id']))
            else:
                cursor.execute("""
                    INSERT INTO daily_records (user_id, fruit_id, date, quantity_sold, waste_quantity, starting_inventory, restock_quantity, end_of_day_stock) 
                    VALUES (%s, %s, %s, %s, 0, 0, 0, 0)
                """, (user_id, fid, sales_date, qty_sold))
                
            # Also deduct from fruit_batches shelf stock to keep the pieChart and alert system accurate
            # We can deduct the oldest batch first
            cursor.execute("""
                SELECT batch_id, quantity_kg FROM fruit_batches 
                WHERE user_id = %s AND fruit_id = %s AND is_active = 1
                ORDER BY spoilage_date ASC
            """, (user_id, fid))
            
            batches = cursor.fetchall()
            remaining_to_deduct = qty_sold
            for b in batches:
                if remaining_to_deduct <= 0:
                    break
                deduct = min(b['quantity_kg'], remaining_to_deduct)
                new_qty = b['quantity_kg'] - deduct
                remaining_to_deduct -= deduct
                
                if new_qty <= 0:
                    cursor.execute("UPDATE fruit_batches SET quantity_kg = 0, is_active = 0 WHERE batch_id = %s", (b['batch_id'],))
                else:
                    cursor.execute("UPDATE fruit_batches SET quantity_kg = %s WHERE batch_id = %s", (new_qty, b['batch_id']))
            
            inserted += 1

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "logged": inserted})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/waste-history', methods=['GET'])
def waste_history():
    """Returns last 7 days waste by fruit for bar chart."""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"status": "error", "message": "user_id required"}), 400
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT f.fruit_name, w.waste_date, SUM(w.waste_kg) as total_waste
            FROM waste_log w
            JOIN fruits f ON w.fruit_id = f.fruit_id
            WHERE w.user_id = %s
              AND w.waste_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY f.fruit_name, w.waste_date
            ORDER BY w.waste_date ASC
        """, (user_id,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        result = []
        for row in rows:
            result.append({
                "fruit": row['fruit_name'],
                "date": row['waste_date'].isoformat() if hasattr(row['waste_date'], 'isoformat') else str(row['waste_date']),
                "waste_kg": float(row['total_waste'] or 0)
            })
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/sales-history', methods=['GET'])
def sales_history():
    """Returns last 7 days sales by fruit for bar chart."""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"status": "error", "message": "user_id required"}), 400
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT f.fruit_name, d.date, SUM(d.quantity_sold) as total_sales
            FROM daily_records d
            JOIN fruits f ON d.fruit_id = f.fruit_id
            WHERE d.user_id = %s
              AND d.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY f.fruit_name, d.date
            ORDER BY d.date ASC
        """, (user_id,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        result = []
        for row in rows:
            result.append({
                "fruit": row['fruit_name'],
                "date": row['date'].isoformat() if hasattr(row['date'], 'isoformat') else str(row['date']),
                "sales_kg": float(row['total_sales'] or 0)
            })
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ─── Bootstrap ────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_tables()
    app.run(host='0.0.0.0', port=5000, debug=True)