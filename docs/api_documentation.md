# Local-Fresh API Documentation

## Overview

The Local-Fresh API provides machine learning-powered predictions for optimal fruit purchasing and waste reduction. Built with FastAPI, it serves predictions from trained Random Forest models.

## Base URL
```
http://localhost:8000
```

## Authentication
Currently no authentication required (for development). Add JWT tokens for production.

## Endpoints

### GET /
Health check endpoint.

**Response:**
```json
{
  "message": "Local-Fresh Fruit Prediction API",
  "status": "running"
}
```

### POST /api/predict
Get fruit purchase predictions for today.

**Request Body:**
```json
{
  "use_live_weather": false,
  "custom_weather": {
    "weather_condition": "Sunny",
    "temperature_c": 25,
    "humidity": 65,
    "precipitation_mm": 0
  },
  "date": "2024-01-15T00:00:00",
  "day_of_week": "Monday",
  "is_weekend": "No",
  "festival": "None"
}
```

**Response:**
```json
{
  "date": "2024-01-15T00:00:00",
  "weather": {
    "condition": "Sunny",
    "temperature_c": 25,
    "humidity": 65,
    "precipitation_mm": 0
  },
  "season": "Winter",
  "month_name": "Jan",
  "day_of_week": "Monday",
  "is_weekend": "No",
  "festival": "None",
  "best_fruit": "Bananas",
  "best_fruit_confidence": 87.3,
  "recommendations": {
    "Bananas": 45,
    "Apples": 32,
    "Oranges": 28
  },
  "waste_adjustments": {
    "Bananas": 1.2,
    "Apples": 0.8,
    "Oranges": 0.0
  },
  "shelf_status": {
    "Bananas": ["OK", "3 days left"],
    "Apples": ["  ", "No batch recorded"],
    "Oranges": ["! ", "Expires in 1 day(s)"]
  },
  "alerts": {
    "expired": [],
    "expiring_today": [],
    "expiring_soon": ["Oranges"]
  },
  "auto_cleared": [],
  "total_order_kg": 105
}
```

### POST /api/update-waste
Update waste memory with actual waste amounts.

**Request Body:**
```json
{
  "waste_data": {
    "Bananas": 2.5,
    "Apples": 1.0,
    "Oranges": 0.5
  },
  "date": "2024-01-15T00:00:00"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Waste memory updated"
}
```

### POST /api/record-purchase
Record fresh fruit purchase and start shelf life timer.

**Request Body:**
```json
{
  "fruits": ["Bananas", "Apples", "Oranges"],
  "purchase_date": "2024-01-15T00:00:00"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Purchase recorded for 3 fruits"
}
```

### GET /api/memory-status
Get current memory status for debugging.

**Response:**
```json
{
  "waste_memory": {
    "Bananas": 2.5,
    "Apples": 1.0
  },
  "batch_memory": {
    "Bananas": {
      "purchase_date": "2024-01-15T00:00:00",
      "spoilage_date": "2024-01-20T00:00:00",
      "shelf_life_days": 5
    }
  },
  "prev_qty_memory": {
    "Bananas": 45.0,
    "Apples": 32.0
  }
}
```

### GET /api/weather
Get current weather data.

**Query Parameters:**
- `use_api` (boolean): Use live weather API instead of mock data

**Response:**
```json
{
  "weather_condition": "Sunny",
  "temperature_c": 25,
  "humidity": 65,
  "precipitation_mm": 0,
  "success": true
}
```

### GET /api/model-info
Get model information and statistics.

**Response:**
```json
{
  "clf_accuracy": 89.2,
  "n_estimators": 500,
  "clf_features": ["w_enc", "d_enc", "we_enc", "f_enc", "Month", "Season", "Is_Festival", "Max_Temperature_C", "Humidity_Percentage", "Precipitation_mm", "Rolling_7Day_Avg_Sales", "Price_Per_Kg"],
  "reg_features": ["w_enc", "d_enc", "we_enc", "f_enc", "Month", "Season", "Is_Festival", "Max_Temperature_C", "Humidity_Percentage", "Precipitation_mm", "Rolling_7Day_Avg_Sales", "Price_Per_Kg", "Prev_Waste", "Prev_Qty"],
  "fruit_classes": ["Apples", "Bananas", "Custard Apple", "Grapes", "Guava", "Mangoes", "Oranges", "Papaya", "Pomegranate", "Watermelon"],
  "train_period": "2024-01-01 to 2025-12-31",
  "test_period": "2026-01-01 to 2026-12-31",
  "avg_rolling_sales": {
    "Bananas": 51.2,
    "Apples": 43.8
  },
  "avg_price_per_kg": {
    "Bananas": 35.5,
    "Apples": 85.2
  },
  "avg_daily_qty": {
    "Bananas": 45.3,
    "Apples": 32.1
  },
  "reg_mae": {
    "Bananas": 3.2,
    "Apples": 2.8
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "detail": "Error description"
}
```

Common HTTP status codes:
- `400`: Bad Request
- `500`: Internal Server Error

## Rate Limiting

No rate limiting implemented. Add as needed for production.

## Data Types

### Weather Conditions
- `Sunny`
- `Cloudy`
- `Rainy`

### Days of Week
- `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`

### Weekend Values
- `Yes`
- `No`

### Festival Values
- `None`
- `Diwali`
- `Holi`
- `Christmas`
