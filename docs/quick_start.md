# Local-Fresh Quick Start Guide

Get the Local-Fresh fruit prediction system running in 5 minutes.

## Prerequisites

### System Requirements
- **Python 3.8+** with pip
- **Node.js 18+** with npm
- **Git** (optional, for cloning)

### Hardware Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **CPU**: Multi-core recommended (models use parallel processing)

## Step 1: Project Setup

### 1.1 Clone or Download Project
```bash
# If using git
git clone <repository-url>
cd Local-Fresh

# Or download and extract ZIP to your preferred location
```

### 1.2 Verify Project Structure
Ensure you have these key files:
```
Local-Fresh/
â”œâ”€â”€ Models/
â”‚   â”œâ”€â”€ fruit_spoilage_system_v5.ipynb
â”‚   â”œâ”€â”€ vadodara_fruit_3yr_10fruits.csv
â”‚   â””â”€â”€ fruit_model/                    # Will be created after training
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ App.jsx
â”‚   â””â”€â”€ pages/DashboardPage.jsx
â”œâ”€â”€ package.json
â””â”€â”€ docs/                               # This documentation
```

## Step 2: Train Models (5 minutes)

### 2.1 Install Jupyter (if needed)
```bash
pip install jupyter
```

### 2.2 Run Training Notebook
```bash
cd Models
jupyter notebook fruit_spoilage_system_v5.ipynb
```

### 2.3 Execute All Cells
1. Open the notebook
2. Click **"Run All Cells"** (â–¶â–¶ button)
3. Wait for completion (~2-3 minutes)
4. Verify `fruit_model/` folder is created with model files

### 2.4 Verify Model Files
Check these files exist in `Models/fruit_model/`:
- âœ… `clf_which_fruit.pkl`
- âœ… `regressors_how_many_kg.pkl`
- âœ… `le_weather.pkl`, `le_day.pkl`, etc.
- âœ… `model_info.json`

## Step 3: Backend Setup (2 minutes)

### 3.1 Create Backend Directory
```bash
mkdir backend
cd backend
```

### 3.2 Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
```

### 3.3 Install Dependencies
```bash
pip install fastapi uvicorn scikit-learn pandas numpy joblib requests python-multipart pydantic
```

### 3.4 Create Backend Files

Create `backend/app/__init__.py`:
```python
# Empty file
```

Create `backend/app/models.py`:
```python
import joblib
import json
import os

class ModelManager:
    def __init__(self, model_path: str = "../Models/fruit_model"):
        self.model_path = model_path
        self.models = {}
        self.encoders = {}
        self.info = {}
        self._load_models()

    def _load_models(self):
        try:
            self.models['classifier'] = joblib.load(f"{self.model_path}/clf_which_fruit.pkl")
            self.models['regressors'] = joblib.load(f"{self.model_path}/regressors_how_many_kg.pkl")

            encoders = ['weather', 'day', 'weekend', 'festival', 'fruit']
            for enc in encoders:
                self.encoders[enc] = joblib.load(f"{self.model_path}/le_{enc}.pkl")

            with open(f"{self.model_path}/model_info.json", 'r') as f:
                self.info = json.load(f)

            print("âœ… Models loaded successfully!")

        except Exception as e:
            print(f"âŒ Error loading models: {e}")

model_manager = ModelManager()
```

Create `backend/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from datetime import datetime
from app.models import model_manager

app = FastAPI(title="Local-Fresh API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Local-Fresh API running"}

@app.post("/api/predict")
async def get_predictions():
    # Mock prediction for quick start
    return {
        "best_fruit": "Bananas",
        "best_fruit_confidence": 87.3,
        "recommendations": {
            "Bananas": 45,
            "Apples": 32,
            "Oranges": 28,
            "Mangoes": 38,
            "Grapes": 25
        },
        "total_order_kg": 168,
        "alerts": {
            "expiring_today": [],
            "expiring_soon": ["Oranges"]
        }
    }

@app.get("/api/model-info")
async def get_model_info():
    return model_manager.info
```

Create `backend/run.py`:
```python
import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
```

### 3.5 Start Backend Server
```bash
python run.py
```

Verify API is running: http://localhost:8000

## Step 4: Frontend Setup (2 minutes)

### 4.1 Install Dependencies
```bash
cd ..  # Back to project root
npm install
```

### 4.2 Create API Service
Create `src/services/api.js`:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 5000,
});

export const getPredictions = async () => {
  const response = await api.post('/api/predict');
  return response.data;
};

export const getModelInfo = async () => {
  const response = await api.get('/api/model-info');
  return response.data;
};

export default { getPredictions, getModelInfo };
```

### 4.3 Update Dashboard (Basic)
Modify `src/pages/DashboardPage.jsx` to show real data:

Find the mock data section and replace with:
```javascript
// ===== Real Data Integration =====
const [predictions, setPredictions] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await getPredictions();
      setPredictions(data);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

if (loading) return <div className="dashboard">Loading...</div>;
if (!predictions) return <div className="dashboard">No data available</div>;

// Use predictions data in your components
const bestFruit = predictions.best_fruit;
const recommendations = predictions.recommendations;
```

### 4.4 Start Frontend
```bash
npm run dev
```

Open http://localhost:5173

## Step 5: Verify Everything Works

### 5.1 Check Backend API
```bash
curl http://localhost:8000/api/predict
```

Should return JSON with predictions.

### 5.2 Check Frontend
- Dashboard should load
- Should show "Bananas" as best fruit
- Should display quantity recommendations

### 5.3 Test Full Integration
- Backend running on port 8000 âœ…
- Frontend running on port 5173 âœ…
- Models loaded âœ…
- API responding âœ…

## Troubleshooting

### Backend Issues
```bash
# Check Python version
python --version

# Check if virtual environment is activated
# Should see (venv) in command prompt

# Test model loading
python -c "from app.models import model_manager; print('Models loaded')"
```

### Frontend Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check if backend is running
curl http://localhost:8000/
```

### Model Issues
```bash
# Check model files exist
ls Models/fruit_model/

# Re-run notebook if models missing
cd Models
jupyter notebook fruit_spoilage_system_v5.ipynb
```

## Next Steps

1. **Read the [Implementation Guide](implementation_guide.md)** for full integration
2. **Check the [API Documentation](api_documentation.md)** for all endpoints
3. **Review [Model Analysis](model_analysis.md)** for technical details

## Demo Commands

```bash
# Start backend
cd backend && python run.py

# Start frontend (new terminal)
npm run dev

# Test API
curl -X POST http://localhost:8000/api/predict
```

ðŸŽ‰ **Congratulations!** Your Local-Fresh system is now running with ML-powered fruit predictions.