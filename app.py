from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# ✅ Connection Pool for Stability
dbconfig = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": ""
}
connection_pool = pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=5,
    pool_reset_session=True,
    **dbconfig
)

def get_db_connection():
    return connection_pool.get_connection()

# ✅ LOGIN
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT email, pass, user_name, user_type FROM users WHERE email = %s or user_name = %s",
        (user, user)
    )
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user and user["pass"] == password:
        return jsonify({
            "status": "success",
            "user": user["user_name"],
            "user_type": user["user_type"]
        })
    else:
        return jsonify({
            "status": "failed",
            "message": "Invalid email or password"
        })
    
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json

    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    user_name = data.get('user_name', '').strip()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Check if user already exists
    cursor.execute(
        "SELECT email, user_name FROM users WHERE email = %s OR user_name = %s",
        (email, user_name)
    )
    existing_user = cursor.fetchone()

    if existing_user:
        cursor.close()
        conn.close()
        return jsonify({
            "status": "failed",
            "message": "Email or username already exists"
        })

    # Insert new user
    cursor.execute(
        "INSERT INTO users (email, pass, user_name) VALUES (%s, %s, %s)",
        (email, password, user_name)
    )
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "status": "success",
        "message": "User registered successfully"
    })