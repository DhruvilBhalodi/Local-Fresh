# Local-Fresh Fruit Spoilage System - Implementation Guide

## Project Overview

Local-Fresh is a machine learning-powered produce management system that predicts optimal fruit purchases and quantities to minimize waste and maximize freshness. The system uses Random Forest models trained on 3 years of Vadodara fruit sales data to predict:

1. **Which fruit** will be in highest demand each day
2. **How much quantity** of each fruit to purchase
3. **Spoilage tracking** based on actual purchase dates and shelf life

## System Architecture

```
Frontend (React + Vite)
    â†“ HTTP API calls
Backend (Python + FastAPI)
    â†“ Model Loading
ML Models (Scikit-learn)
    â†“ Data Input
Weather API + Manual Inputs
```

## Prerequisites

### Frontend Requirements
- Node.js 18+
- npm or yarn
- Vite (already configured)

### Backend Requirements
- Python 3.8+
- pip
- Required packages: fastapi, uvicorn, scikit-learn, pandas, numpy, joblib, requests

## Step 1: Model Preparation

### 1.1 Run the Training Notebook

Execute the `fruit_spoilage_system_v5.ipynb` notebook to generate the trained models:

```bash
cd Models
jupyter notebook fruit_spoilage_system_v5.ipynb
```

Run all cells to train and save the models to `fruit_model/` folder.

### 1.2 Verify Model Files

Ensure the following files exist in `Models/fruit_model/`:
- `clf_which_fruit.pkl` - Classifier for best fruit prediction
- `regressors_how_many_kg.pkl` - Regressors for quantity prediction
- `le_weather.pkl`, `le_day.pkl`, `le_weekend.pkl`, `le_festival.pkl`, `le_fruit.pkl` - Label encoders
- `model_info.json` - Model metadata

## Step 2: Backend Implementation

### 2.1 Create Backend Directory Structure

```
backend/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ __init__.py
â”‚   â”œâ”€â”€ main.py
â”‚   â”œâ”€â”€ models.py
â”‚   â”œâ”€â”€ prediction_service.py
â”‚   â”œâ”€â”€ memory_service.py
â”‚   â””â”€â”€ weather_service.py
â”œâ”€â”€ requirements.txt
â””â”€â”€ run.py
```

### 2.2 Install Backend Dependencies

Create `backend/requirements.txt`:

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.24.3
joblib==1.3.2
requests==2.31.0
python-multipart==0.0.6
pydantic==2.5.0
```

Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

### 2.3 Implement Model Loading (`backend/app/models.py`)

```python
import joblib
import json
import os
from typing import Dict, Any

class ModelManager:
    def __init__(self, model_path: str = "../../Models/fruit_model"):
        self.model_path = model_path
        self.models = {}
        self.encoders = {}
        self.info = {}
        self._load_models()

    def _load_models(self):
        """Load all trained models and encoders"""
        try:
            # Load classifier
            self.models['classifier'] = joblib.load(f"{self.model_path}/clf_which_fruit.pkl")

            # Load regressors
            self.models['regressors'] = joblib.load(f"{self.model_path}/regressors_how_many_kg.pkl")

            # Load encoders
            self.encoders['weather'] = joblib.load(f"{self.model_path}/le_weather.pkl")
            self.encoders['day'] = joblib.load(f"{self.model_path}/le_day.pkl")
            self.encoders['weekend'] = joblib.load(f"{self.model_path}/le_weekend.pkl")
            self.encoders['festival'] = joblib.load(f"{self.model_path}/le_festival.pkl")
            self.encoders['fruit'] = joblib.load(f"{self.model_path}/le_fruit.pkl")

            # Load model info
            with open(f"{self.model_path}/model_info.json", 'r') as f:
                self.info = json.load(f)

            print("All models loaded successfully!")

        except Exception as e:
            print(f"Error loading models: {e}")
            raise

    def get_classifier(self):
        return self.models['classifier']

    def get_regressors(self):
        return self.models['regressors']

    def get_encoder(self, name: str):
        return self.encoders[name]

    def get_info(self):
        return self.info

# Global model manager instance
model_manager = ModelManager()
```

### 2.4 Implement Memory Service (`backend/app/memory_service.py`)

```python
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import json
import os

class MemoryService:
    def __init__(self):
        # Fruit shelf life in days
        self.FRUIT_SHELF_LIFE = {
            'Bananas': 5, 'Mangoes': 7, 'Apples': 14, 'Oranges': 10,
            'Grapes': 7, 'Custard Apple': 6, 'Watermelon': 12,
            'Papaya': 5, 'Guava': 8, 'Pomegranate': 10,
        }

        # Initialize memory systems
        self.waste_memory = {fruit: 0.0 for fruit in self.FRUIT_SHELF_LIFE.keys()}
        self.batch_memory = {}  # Will store batch info
        self.prev_qty_memory = {fruit: 50.0 for fruit in self.FRUIT_SHELF_LIFE.keys()}

        # Load from persistent storage if exists
        self._load_memory()

    def _load_memory(self):
        """Load memory from JSON file"""
        try:
            if os.path.exists('memory.json'):
                with open('memory.json', 'r') as f:
                    data = json.load(f)
                    self.waste_memory = data.get('waste_memory', self.waste_memory)
                    self.prev_qty_memory = data.get('prev_qty_memory', self.prev_qty_memory)

                    # Convert batch_memory dates back to datetime
                    batch_data = data.get('batch_memory', {})
                    for fruit, batch in batch_data.items():
                        if batch:
                            self.batch_memory[fruit] = {
                                'purchase_date': datetime.fromisoformat(batch['purchase_date']),
                                'spoilage_date': datetime.fromisoformat(batch['spoilage_date']),
                                'shelf_life_days': batch['shelf_life_days']
                            }
        except Exception as e:
            print(f"Error loading memory: {e}")

    def _save_memory(self):
        """Save memory to JSON file"""
        try:
            data = {
                'waste_memory': self.waste_memory,
                'prev_qty_memory': self.prev_qty_memory,
                'batch_memory': {}
            }

            # Convert datetime to ISO format for JSON
            for fruit, batch in self.batch_memory.items():
                if batch:
                    data['batch_memory'][fruit] = {
                        'purchase_date': batch['purchase_date'].isoformat(),
                        'spoilage_date': batch['spoilage_date'].isoformat(),
                        'shelf_life_days': batch['shelf_life_days']
                    }

            with open('memory.json', 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving memory: {e}")

    def auto_clear_expired_batches(self, today: datetime = None) -> List[str]:
        """Auto-clear expired batches before predictions"""
        if today is None:
            today = datetime.now()

        cleared = []
        for fruit, batch in list(self.batch_memory.items()):
            if batch and batch['spoilage_date'] <= today:
                del self.batch_memory[fruit]
                self.waste_memory[fruit] = 0.0
                cleared.append(fruit)

        if cleared:
            self._save_memory()

        return cleared

    def get_days_remaining(self, fruit: str, today: datetime = None) -> Tuple[Optional[int], str]:
        """Get days remaining for fruit batch"""
        if today is None:
            today = datetime.now()

        if fruit not in self.batch_memory or not self.batch_memory[fruit]:
            return None, 'no_batch'

        delta = self.batch_memory[fruit]['spoilage_date'] - today
        hours = delta.total_seconds() / 3600
        days = delta.days

        if hours <= 0:
            return 0, 'expired'
        elif hours < 24:
            return 0, 'expiring_today'
        elif days <= 2:
            return days, 'expiring_soon'
        else:
            return days, 'fresh'

    def check_batch_expiration(self, today: datetime = None) -> Dict[str, List[str]]:
        """Check expiration status of all batches"""
        if today is None:
            today = datetime.now()

        result = {'expired': [], 'expiring_today': [], 'expiring_soon': [], 'fresh': []}
        for fruit in list(self.batch_memory.keys()):
            _, status = self.get_days_remaining(fruit, today)
            result[status].append(fruit)
        return result

    def update_waste_memory(self, actual_waste_dict: Dict[str, float], today: datetime = None):
        """Update waste memory with actual waste amounts"""
        if today is None:
            today = datetime.now()

        for fruit, waste_kg in actual_waste_dict.items():
            if fruit in self.waste_memory:
                self.waste_memory[fruit] = float(waste_kg)

        self._save_memory()

    def record_fresh_purchase(self, fruits_list: List[str], purchase_date: datetime = None):
        """Record fresh purchase and start shelf life timer"""
        if purchase_date is None:
            purchase_date = datetime.now()

        for fruit in fruits_list:
            shelf_days = self.FRUIT_SHELF_LIFE.get(fruit, 7)
            spoilage_date = purchase_date + timedelta(days=shelf_days)
            self.batch_memory[fruit] = {
                'purchase_date': purchase_date,
                'spoilage_date': spoilage_date,
                'shelf_life_days': shelf_days,
            }
            self.waste_memory[fruit] = 0.0  # Reset waste for fresh batch

        self._save_memory()

    def reset_waste_memory(self):
        """Reset all waste memory to zero"""
        for fruit in self.waste_memory:
            self.waste_memory[fruit] = 0.0
        self._save_memory()

    def get_memory_status(self) -> Dict[str, Any]:
        """Get current memory status for debugging"""
        return {
            'waste_memory': self.waste_memory,
            'batch_memory': {
                fruit: {
                    'purchase_date': batch['purchase_date'].isoformat() if batch else None,
                    'spoilage_date': batch['spoilage_date'].isoformat() if batch else None,
                    'shelf_life_days': batch['shelf_life_days'] if batch else None
                } for fruit, batch in self.batch_memory.items()
            },
            'prev_qty_memory': self.prev_qty_memory
        }

# Global memory service instance
memory_service = MemoryService()
```

### 2.5 Implement Weather Service (`backend/app/weather_service.py`)

```python
import requests
from typing import Dict, Any, Optional
from datetime import datetime

class WeatherService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or "YOUR_OPENWEATHER_API_KEY"  # Get from https://openweathermap.org/api
        self.base_url = "http://api.openweathermap.org/data/2.5/weather"

    def get_weather_data(self, city: str = "Vadodara") -> Dict[str, Any]:
        """Get current weather data for Vadodara"""
        try:
            params = {
                'q': city,
                'appid': self.api_key,
                'units': 'metric'
            }

            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()

            # Map to our format
            weather_mapping = {
                'Clear': 'Sunny',
                'Clouds': 'Cloudy',
                'Rain': 'Rainy',
                'Drizzle': 'Rainy',
                'Thunderstorm': 'Rainy',
                'Snow': 'Cloudy',  # Treat snow as cloudy
                'Mist': 'Cloudy',
                'Fog': 'Cloudy'
            }

            main_weather = data['weather'][0]['main']
            weather_condition = weather_mapping.get(main_weather, 'Cloudy')

            return {
                'weather_condition': weather_condition,
                'temperature_c': round(data['main']['temp']),
                'humidity': data['main']['humidity'],
                'precipitation_mm': data.get('rain', {}).get('1h', 0) * 100,  # Convert to mm if available
                'success': True
            }

        except Exception as e:
            print(f"Weather API error: {e}")
            # Return fallback data
            return {
                'weather_condition': 'Sunny',
                'temperature_c': 25,
                'humidity': 65,
                'precipitation_mm': 0,
                'success': False,
                'error': str(e)
            }

    def get_mock_weather(self, month: int) -> Dict[str, Any]:
        """Return mock weather data based on month for testing"""
        # Seasonal weather patterns for Vadodara
        seasonal_weather = {
            12: {'weather': 'Sunny', 'temp': 22, 'humidity': 60},  # Winter
            1: {'weather': 'Sunny', 'temp': 20, 'humidity': 62},
            2: {'weather': 'Sunny', 'temp': 23, 'humidity': 58},
            3: {'weather': 'Sunny', 'temp': 28, 'humidity': 55},  # Spring
            4: {'weather': 'Sunny', 'temp': 32, 'humidity': 50},
            5: {'weather': 'Cloudy', 'temp': 35, 'humidity': 60},
            6: {'weather': 'Rainy', 'temp': 30, 'humidity': 85},  # Monsoon
            7: {'weather': 'Rainy', 'temp': 28, 'humidity': 90},
            8: {'weather': 'Rainy', 'temp': 27, 'humidity': 88},
            9: {'weather': 'Cloudy', 'temp': 28, 'humidity': 80},  # Autumn
            10: {'weather': 'Sunny', 'temp': 30, 'humidity': 65},
            11: {'weather': 'Sunny', 'temp': 26, 'humidity': 60}
        }

        weather_data = seasonal_weather.get(month, {'weather': 'Sunny', 'temp': 25, 'humidity': 65})

        return {
            'weather_condition': weather_data['weather'],
            'temperature_c': weather_data['temp'],
            'humidity': weather_data['humidity'],
            'precipitation_mm': 5 if weather_data['weather'] == 'Rainy' else 0,
            'success': True,
            'mock': True
        }

# Global weather service instance
weather_service = WeatherService()
```

### 2.6 Implement Prediction Service (`backend/app/prediction_service.py`)

```python
import numpy as np
from datetime import datetime
from typing import Dict, List, Any, Optional
from .models import model_manager
from .memory_service import memory_service
from .weather_service import weather_service

class PredictionService:
    def __init__(self):
        self.model_manager = model_manager
        self.memory_service = memory_service
        self.weather_service = weather_service

        # Season mappings
        self.SEASON_NAMES = {0: 'Winter', 1: 'Spring', 2: 'Monsoon', 3: 'Autumn'}
        self.MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    def safe_enc(self, encoder, value):
        """Safely encode a value, return 0 if not found"""
        try:
            return encoder.transform([value])[0]
        except:
            return 0

    def predict_today(self, weather_data: Dict[str, Any], date: datetime = None,
                     day_of_week: str = None, is_weekend: str = None,
                     festival: str = None) -> Dict[str, Any]:
        """Generate predictions for today"""

        if date is None:
            date = datetime.now()

        # Auto-clear expired batches
        cleared = self.memory_service.auto_clear_expired_batches(date)

        # Extract weather data
        weather = weather_data.get('weather_condition', 'Sunny')
        temperature_c = weather_data.get('temperature_c', 25)
        humidity = weather_data.get('humidity', 65)
        precipitation = weather_data.get('precipitation_mm', 0)

        # Get date components
        month = date.month
        if day_of_week is None:
            day_of_week = date.strftime('%A')
        if is_weekend is None:
            is_weekend = 'Yes' if date.weekday() >= 5 else 'No'
        if festival is None:
            festival = 'None'

        # Calculate season and festival flag
        season = 0 if month in [12, 1, 2] else 1 if month in [3, 4, 5] else 2 if month in [6, 7, 8] else 3
        is_fest = 1 if festival != 'None' else 0

        # Encode inputs
        w_e = self.safe_enc(self.model_manager.get_encoder('weather'), weather)
        d_e = self.safe_enc(self.model_manager.get_encoder('day'), day_of_week)
        we_e = self.safe_enc(self.model_manager.get_encoder('weekend'), is_weekend)
        f_e = self.safe_enc(self.model_manager.get_encoder('festival'), festival)

        # Get model info
        info = self.model_manager.get_info()

        # Classifier prediction
        clf = self.model_manager.get_classifier()
        clf_in = np.array([[w_e, d_e, we_e, f_e, month, season, is_fest,
                           temperature_c, humidity, precipitation,
                           info['avg_rolling_sales'].get('Bananas', 51),
                           info['avg_price_per_kg'].get('Bananas', 35)]])

        best_enc = clf.predict(clf_in)[0]
        best_fruit = self.model_manager.get_encoder('fruit').inverse_transform([best_enc])[0]
        clf_proba = clf.predict_proba(clf_in)[0]

        # Quantity predictions for each fruit
        regressors = self.model_manager.get_regressors()
        qty_recs = {}
        waste_adjs = {}
        shelf_flags = {}

        for fruit, reg in regressors.items():
            rolling = info['avg_rolling_sales'].get(fruit, 50.0)
            price = info['avg_price_per_kg'].get(fruit, 50.0)
            prev_wst = self.memory_service.waste_memory.get(fruit, 0.0)
            prev_qty = self.memory_service.prev_qty_memory.get(fruit,
                info['avg_daily_qty'].get(fruit, 50.0))

            reg_in = np.array([[w_e, d_e, we_e, f_e, month, season, is_fest,
                               temperature_c, humidity, precipitation,
                               rolling, price, prev_wst, prev_qty]])

            raw_qty = float(reg.predict(reg_in)[0])

            # Apply shelf life adjustments
            days_left, status = self.memory_service.get_days_remaining(fruit, date)
            waste_reduction = prev_wst * 0.8

            if status == 'expiring_today':
                adjusted = max(raw_qty * 1.3, raw_qty)
                waste_reduction = 0
                shelf_flags[fruit] = ('!!', 'EXPIRES TODAY - buy fresh')
            elif status == 'expiring_soon':
                adjusted = max(raw_qty * 1.1, raw_qty)
                waste_reduction = 0
                shelf_flags[fruit] = ('! ', f'Expires in {days_left} day(s)')
            elif status == 'no_batch':
                adjusted = max(raw_qty - waste_reduction, raw_qty * 0.2)
                shelf_flags[fruit] = ('  ', 'No batch recorded')
            else:
                adjusted = max(raw_qty - waste_reduction, raw_qty * 0.2)
                shelf_flags[fruit] = ('OK', f'{days_left} days left')

            qty_recs[fruit] = round(adjusted)
            waste_adjs[fruit] = round(waste_reduction, 1)

        # Check expiration status
        expiry_status = self.memory_service.check_batch_expiration(date)

        # Build response
        result = {
            'date': date.isoformat(),
            'weather': {
                'condition': weather,
                'temperature_c': temperature_c,
                'humidity': humidity,
                'precipitation_mm': precipitation
            },
            'season': self.SEASON_NAMES[season],
            'month_name': self.MONTH_NAMES[month],
            'day_of_week': day_of_week,
            'is_weekend': is_weekend,
            'festival': festival,
            'best_fruit': best_fruit,
            'best_fruit_confidence': round(clf_proba[best_enc] * 100, 1),
            'recommendations': qty_recs,
            'waste_adjustments': waste_adjs,
            'shelf_status': shelf_flags,
            'alerts': {
                'expired': expiry_status.get('expired', []),
                'expiring_today': expiry_status.get('expiring_today', []),
                'expiring_soon': expiry_status.get('expiring_soon', [])
            },
            'auto_cleared': cleared,
            'total_order_kg': sum(qty_recs.values())
        }

        return result

    def update_waste(self, waste_data: Dict[str, float], date: datetime = None):
        """Update waste memory with actual waste amounts"""
        self.memory_service.update_waste_memory(waste_data, date)
        return {"status": "success", "message": "Waste memory updated"}

    def record_purchase(self, fruits: List[str], purchase_date: str = None):
        """Record fresh fruit purchase"""
        if purchase_date:
            date = datetime.fromisoformat(purchase_date)
        else:
            date = datetime.now()

        self.memory_service.record_fresh_purchase(fruits, date)
        return {"status": "success", "message": f"Purchase recorded for {len(fruits)} fruits"}

    def get_memory_status(self):
        """Get current memory status"""
        return self.memory_service.get_memory_status()

    def get_weather(self, use_api: bool = False):
        """Get current weather data"""
        if use_api:
            return self.weather_service.get_weather_data()
        else:
            # Use mock weather based on current month
            current_month = datetime.now().month
            return self.weather_service.get_mock_weather(current_month)

# Global prediction service instance
prediction_service = PredictionService()
```

### 2.7 Create Main FastAPI App (`backend/app/main.py`)

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Dict, List, Any, Optional
from .prediction_service import prediction_service

app = FastAPI(title="Local-Fresh API", version="1.0.0")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class PredictionRequest(BaseModel):
    use_live_weather: bool = False
    custom_weather: Optional[Dict[str, Any]] = None
    date: Optional[str] = None
    day_of_week: Optional[str] = None
    is_weekend: Optional[str] = None
    festival: Optional[str] = None

class WasteUpdateRequest(BaseModel):
    waste_data: Dict[str, float]
    date: Optional[str] = None

class PurchaseRequest(BaseModel):
    fruits: List[str]
    purchase_date: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Local-Fresh Fruit Prediction API", "status": "running"}

@app.post("/api/predict")
async def get_predictions(request: PredictionRequest):
    """Get fruit purchase predictions for today"""
    try:
        # Get weather data
        if request.custom_weather:
            weather_data = request.custom_weather
        else:
            weather_data = prediction_service.get_weather(request.use_live_weather)

        # Parse date
        date = None
        if request.date:
            date = datetime.fromisoformat(request.date)

        # Make prediction
        result = prediction_service.predict_today(
            weather_data=weather_data,
            date=date,
            day_of_week=request.day_of_week,
            is_weekend=request.is_weekend,
            festival=request.festival
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/api/update-waste")
async def update_waste(request: WasteUpdateRequest):
    """Update waste memory with actual waste amounts"""
    try:
        date = None
        if request.date:
            date = datetime.fromisoformat(request.date)

        result = prediction_service.update_waste(request.waste_data, date)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Waste update error: {str(e)}")

@app.post("/api/record-purchase")
async def record_purchase(request: PurchaseRequest):
    """Record fresh fruit purchase"""
    try:
        result = prediction_service.record_purchase(request.fruits, request.purchase_date)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Purchase record error: {str(e)}")

@app.get("/api/memory-status")
async def get_memory_status():
    """Get current memory status for debugging"""
    try:
        return prediction_service.get_memory_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Memory status error: {str(e)}")

@app.get("/api/weather")
async def get_weather(use_api: bool = False):
    """Get current weather data"""
    try:
        return prediction_service.get_weather(use_api)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather error: {str(e)}")

@app.get("/api/model-info")
async def get_model_info():
    """Get model information and statistics"""
    try:
        return prediction_service.model_manager.get_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model info error: {str(e)}")
```

### 2.8 Create Run Script (`backend/run.py`)

```python
import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )
```

### 2.9 Create `__init__.py` (`backend/app/__init__.py`)

```python
# Empty init file
```

## Step 3: Frontend Integration

### 3.1 Install Additional Dependencies

Add axios for API calls:

```bash
npm install axios
```

### 3.2 Create API Service (`src/services/api.js`)

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Get predictions
  async getPredictions(options = {}) {
    const response = await this.client.post('/api/predict', options);
    return response.data;
  }

  // Update waste memory
  async updateWaste(wasteData, date = null) {
    const response = await this.client.post('/api/update-waste', {
      waste_data: wasteData,
      date: date
    });
    return response.data;
  }

  // Record fresh purchase
  async recordPurchase(fruits, purchaseDate = null) {
    const response = await this.client.post('/api/record-purchase', {
      fruits: fruits,
      purchase_date: purchaseDate
    });
    return response.data;
  }

  // Get memory status
  async getMemoryStatus() {
    const response = await this.client.get('/api/memory-status');
    return response.data;
  }

  // Get weather data
  async getWeather(useApi = false) {
    const response = await this.client.get(`/api/weather?use_api=${useApi}`);
    return response.data;
  }

  // Get model info
  async getModelInfo() {
    const response = await this.client.get('/api/model-info');
    return response.data;
  }
}

export default new ApiService();
```

### 3.3 Update Dashboard to Use Real Data

Modify `src/pages/DashboardPage.jsx` to fetch real data:

```javascript
import { useState, useEffect } from 'react';
// ... existing imports ...
import apiService from '../services/api';

// ... existing code ...

// ===== Dashboard Component =====
export default function DashboardPage() {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch predictions on component mount
  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPredictions({
        use_live_weather: false  // Use mock weather for now
      });
      setPredictions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load predictions');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Transform predictions to dashboard format
  const transformToDashboardData = (data) => {
    if (!data) return null;

    return {
      bestFruit: data.best_fruit,
      confidence: data.best_fruit_confidence,
      recommendations: data.recommendations,
      alerts: [
        ...data.alerts.expiring_today.map(fruit => ({
          type: 'warning',
          icon: AlertTriangle,
          product: fruit,
          message: 'Expires TODAY - buy fresh now!',
          color: '#ef4444'
        })),
        ...data.alerts.expiring_soon.map(fruit => ({
          type: 'warning',
          icon: AlertTriangle,
          product: fruit,
          message: `Expires in ${data.shelf_status[fruit]?.split(' ')[1] || 'few'} days`,
          color: '#f97316'
        }))
      ],
      weather: data.weather,
      totalOrder: data.total_order_kg
    };
  };

  const dashboardData = transformToDashboardData(predictions);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading predictions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">{error}</div>
        <button onClick={fetchPredictions}>Retry</button>
      </div>
    );
  }

  // ... existing JSX but replace mock data with dashboardData ...
```

### 3.4 Add Prediction Display Components

Add components to display the real predictions in the dashboard.

## Step 4: Testing and Deployment

### 4.1 Test Backend

Start the backend server:

```bash
cd backend
python run.py
```

Test API endpoints:

```bash
# Test predictions
curl -X POST http://localhost:8000/api/predict -H "Content-Type: application/json" -d '{}'

# Test with custom weather
curl -X POST http://localhost:8000/api/predict -H "Content-Type: application/json" -d '{"custom_weather": {"weather_condition": "Sunny", "temperature_c": 25, "humidity": 65, "precipitation_mm": 0}}'
```

### 4.2 Test Frontend

Start the frontend:

```bash
npm run dev
```

Navigate to `http://localhost:5173` and check the dashboard.

### 4.3 Production Deployment

#### Backend Deployment
```bash
# Install production server
pip install gunicorn

# Run with gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

#### Frontend Deployment
```bash
npm run build
# Serve the dist/ folder with nginx or any static server
```

## Step 5: Usage Guide

### 5.1 Daily Workflow

1. **Morning**: Check dashboard for today's predictions
2. **Purchase**: Record fresh fruit purchases via API
3. **Evening**: Update waste amounts for the day
4. **Monitor**: Track expiration alerts

### 5.2 API Usage Examples

#### Get Today's Predictions
```javascript
const predictions = await apiService.getPredictions();
console.log(`Best fruit: ${predictions.best_fruit} (${predictions.best_fruit_confidence}%)`);
```

#### Record Fresh Purchase
```javascript
await apiService.recordPurchase(['Bananas', 'Apples'], '2024-01-15');
```

#### Update Waste
```javascript
await apiService.updateWaste({
  'Bananas': 2.5,
  'Apples': 1.0
});
```

### 5.3 Model Maintenance

- Retrain models quarterly with new sales data
- Update shelf life values based on actual observations
- Monitor prediction accuracy and adjust features as needed

## Troubleshooting

### Common Issues

1. **Model loading errors**: Ensure all model files are in `Models/fruit_model/`
2. **CORS errors**: Check CORS configuration in FastAPI
3. **Weather API**: Get API key from OpenWeatherMap for live weather
4. **Memory persistence**: Check `memory.json` file permissions

### Performance Optimization

- Use model quantization for faster inference
- Cache predictions for similar weather conditions
- Implement database for historical data instead of JSON files

## Future Enhancements

1. **Real-time weather integration**
2. **Mobile app development**
3. **Multi-location support**
4. **Advanced analytics dashboard**
5. **Automated reordering system**
6. **Integration with POS systems**

---

This implementation provides a complete ML-powered produce management system. The backend handles all model inference and state management, while the frontend provides an intuitive interface for shop operators.</content>
