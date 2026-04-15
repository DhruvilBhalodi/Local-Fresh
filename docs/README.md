# Local-Fresh Documentation

## Project Overview

Local-Fresh is a machine learning-powered produce management system that predicts optimal fruit purchasing quantities and minimizes waste through intelligent spoilage tracking. The system uses Random Forest models trained on 3 years of Vadodara fruit sales data.

## Documentation Structure

### ðŸ“‹ [Implementation Guide](implementation_guide.md)
Complete step-by-step guide for integrating ML models with the React frontend:
- Backend setup with FastAPI
- Model loading and prediction services
- Frontend API integration
- Testing and deployment instructions

### ðŸ”Œ [API Documentation](api_documentation.md)
Detailed API reference for all endpoints:
- Request/response formats
- Authentication details
- Error handling
- Data type specifications

### ðŸ“Š [Model Analysis](model_analysis.md)
Technical details about the ML models:
- Feature engineering
- Training methodology
- Performance metrics
- Model limitations

### ðŸš€ [Quick Start](quick_start.md)
Get up and running in 5 minutes:
- Prerequisites
- Installation steps
- Basic usage examples

## Key Features

- **Smart Predictions**: ML models predict which fruits will sell best each day
- **Quantity Optimization**: Regressors calculate optimal purchase amounts
- **Spoilage Tracking**: Automatic shelf life monitoring with batch management
- **Waste Reduction**: Historical waste patterns inform future predictions
- **Real-time Alerts**: Notifications for expiring inventory
- **Weather Integration**: Seasonal and weather-based predictions

## System Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    HTTP API    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   React Frontend â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚  FastAPI Backend â”‚
â”‚                 â”‚                â”‚                 â”‚
â”‚ - Dashboard     â”‚                â”‚ - Prediction    â”‚
â”‚ - Auth System   â”‚                â”‚   Service       â”‚
â”‚ - Charts        â”‚                â”‚ - Memory Serviceâ”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                â”‚ - Weather API   â”‚
                                   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                            â”‚
                                            â–¼
                                   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                   â”‚   ML Models     â”‚
                                   â”‚                 â”‚
                                   â”‚ - Classifier    â”‚
                                   â”‚ - Regressors    â”‚
                                   â”‚ - Encoders      â”‚
                                   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Technology Stack

### Frontend
- React 19
- Vite
- React Router
- Recharts
- Lucide Icons
- CSS Modules

### Backend
- Python 3.8+
- FastAPI
- Scikit-learn
- Pandas/NumPy
- Joblib
- Uvicorn

### Machine Learning
- Random Forest Classifier (89% accuracy)
- Random Forest Regressors (per fruit)
- Label Encoding for categorical features
- Time-based train/test split

## Getting Started

1. **Read the Quick Start guide** for immediate setup
2. **Follow the Implementation Guide** for complete integration
3. **Check API Documentation** for endpoint details
4. **Review Model Analysis** for technical understanding

## Support

For questions or issues:
1. Check the troubleshooting section in the implementation guide
2. Verify model files are properly trained and saved
3. Ensure all dependencies are installed
4. Check API connectivity between frontend and backend

## Contributing

When making changes:
1. Update models in the `Models/` directory
2. Retrain and save new model files
3. Update API endpoints if needed
4. Test frontend integration
5. Update documentation

## License

This project is part of an academic minor project. See individual component licenses for details.