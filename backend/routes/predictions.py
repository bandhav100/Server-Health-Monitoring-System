from datetime import datetime, timedelta
from flask import Blueprint, request
from middleware.auth import jwt_required_api
from models.prediction import Prediction
from models.server import Server
from models.metrics_history import MetricsHistory
from models.audit_log import AuditLog
from services.ml_service import MLService
from extensions import db
from utils.response import api_response
from utils.logger import logger


predictions_bp = Blueprint("predictions", __name__)


@predictions_bp.route("/predictions/<int:server_id>", methods=["GET"])
@jwt_required_api
def get_predictions(server_id):
    """Get latest predictions for a server"""
    server = Server.query.get_or_404(server_id)
    
    ml_service = MLService()
    prediction_data = ml_service.get_prediction(server_id)
    
    # Check if we already have a recent prediction
    existing = Prediction.query.filter_by(server_id=server_id).order_by(
        Prediction.created_at.desc()
    ).first()
    
    # Only create new if older than 5 minutes
    if prediction_data.get("source") == "unavailable" and existing:
        prediction = existing
    elif prediction_data.get("source") == "unavailable":
        return api_response(False, "ML service unavailable and no previous prediction exists", None, 503)
    elif not existing or (datetime.utcnow() - existing.created_at).total_seconds() > 300:
        prediction = Prediction(
            server_id=server_id,
            cpu_forecast=prediction_data.get("cpu_forecast"),
            ram_forecast=prediction_data.get("ram_forecast"),
            anomaly_score=prediction_data.get("anomaly_score"),
            health_score=prediction_data.get("health_score"),
            source=prediction_data.get("source", "ml-service")
        )
        db.session.add(prediction)
        db.session.commit()
    else:
        prediction = existing
    
    return api_response(True, "Predictions fetched", prediction.to_dict(), 200)


@predictions_bp.route("/predictions/<int:server_id>/forecast", methods=["GET"])
@jwt_required_api
def get_forecast(server_id):
    """Get detailed forecast for a server"""
    server = Server.query.get_or_404(server_id)
    
    ml_service = MLService()
    forecast = ml_service.get_forecast(server_id)
    
    response = {
        "server_id": server_id,
        "server_name": server.name,
        "cpu_forecast": forecast.get("cpu_forecast", []),
        "ram_forecast": forecast.get("ram_forecast", []),
        "disk_forecast": forecast.get("disk_forecast", []),
        "network_forecast": forecast.get("network_forecast", []),
        "confidence": forecast.get("confidence"),
        "timeframe": "next_6_hours",
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }
    
    return api_response(True, "Forecast fetched", response, 200)


@predictions_bp.route("/predictions/<int:server_id>/anomalies", methods=["GET"])
@jwt_required_api
def get_anomalies(server_id):
    """Get anomaly detection results"""
    server = Server.query.get_or_404(server_id)
    
    ml_service = MLService()
    anomalies = ml_service.detect_anomalies(server_id)
    
    response = {
        "server_id": server_id,
        "server_name": server.name,
        "anomalies": anomalies.get("anomalies", []),
        "anomaly_score": anomalies.get("anomaly_score"),
        "detection_method": anomalies.get("method"),
        "detected_at": datetime.utcnow().isoformat() + "Z"
    }
    
    return api_response(True, "Anomalies fetched", response, 200)


@predictions_bp.route("/predictions/retrain", methods=["POST"])
@jwt_required_api
def retrain_models():
    """Trigger ML model retraining"""
    ml_service = MLService()
    result = ml_service.retrain()
    
    log = AuditLog(
        actor="admin",
        action="models_retrained",
        details="ML models retraining triggered"
    )
    db.session.add(log)
    db.session.commit()
    
    logger.info("ML model retraining initiated")
    return api_response(True, "Model retraining initiated", result, 200)
