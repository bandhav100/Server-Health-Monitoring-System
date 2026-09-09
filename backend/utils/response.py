from datetime import datetime
from flask import jsonify


def api_response(success=True, message="", data=None, status_code=200):
    payload = {
        "success": success,
        "message": message,
        "data": data if data is not None else {},
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "statusCode": status_code,
    }
    return jsonify(payload), status_code
