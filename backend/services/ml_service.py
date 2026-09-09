import requests
from datetime import datetime, timedelta
from config import Config
from models.metrics_history import MetricsHistory
from models.prediction import Prediction
from utils.logger import logger


class MLService:
    def __init__(self, base_url=None):
        self.base_url = (base_url or Config.ML_SERVICE_URL).rstrip("/")

    def get_prediction(self, server_id):
        """Get a prediction from the configured ML service."""
        try:
            response = requests.get(f"{self.base_url}/predict/{server_id}", timeout=5)
            if response.status_code == 200:
                data = response.json()
                data["source"] = "ml-service"
                return data
        except requests.RequestException as e:
            logger.warning("ML service unavailable: %s", e)

        return {"source": "unavailable"}

    def get_forecast(self, server_id):
        """Get detailed forecast"""
        try:
            response = requests.get(f"{self.base_url}/forecast/{server_id}", timeout=5)
            if response.status_code == 200:
                return response.json()
        except requests.RequestException:
            logger.warning("ML service unavailable for forecast")
        
        return {"cpu_forecast": [], "ram_forecast": [], "disk_forecast": [], "network_forecast": [], "confidence": None, "source": "unavailable"}

    def detect_anomalies(self, server_id):
        """Detect anomalies"""
        try:
            response = requests.get(f"{self.base_url}/anomalies/{server_id}", timeout=5)
            if response.status_code == 200:
                return response.json()
        except requests.RequestException:
            logger.warning("ML service unavailable for anomaly detection")
        
        return {"anomalies": [], "anomaly_score": None, "method": "unavailable"}

    def retrain(self):
        """Trigger model retraining"""
        try:
            response = requests.post(f"{self.base_url}/retrain", timeout=10)
            if response.status_code == 200:
                return response.json()
        except requests.RequestException as e:
            logger.warning("ML service retrain failed: %s", e)
        
        return {"status": "unavailable", "message": "ML service unavailable"}
