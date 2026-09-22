from flask import Blueprint, request
from middleware.auth import jwt_required_api
from services.docker_service import DockerService
from models.audit_log import AuditLog
from extensions import db
from utils.response import api_response
from utils.logger import logger
from models.server import Server


docker_bp = Blueprint("docker", __name__)


@docker_bp.route("/docker/containers", methods=["GET"])
@jwt_required_api
def list_containers():
    """List containers associated with the selected discovered server."""
    server_id = request.args.get("server_id", type=int)
    server = Server.query.get_or_404(server_id) if server_id else None
    containers = DockerService.get_containers(server.name if server else None)
    return api_response(True, "Docker containers fetched", containers, 200)


@docker_bp.route("/docker/start/<container_id>", methods=["POST"])
@jwt_required_api
def start_container(container_id):
    """Start a Docker container"""
    result = DockerService.start_container(container_id)
    
    if result.get("success"):
        log = AuditLog(
            actor="admin",
            action="docker_container_started",
            details=f"Container {container_id} started"
        )
        db.session.add(log)
        db.session.commit()
        logger.info("Container started: %s", container_id)
        return api_response(True, "Container started", result, 200)
    else:
        return api_response(False, result.get("message", "Failed to start container"), None, 500)


@docker_bp.route("/docker/stop/<container_id>", methods=["POST"])
@jwt_required_api
def stop_container(container_id):
    """Stop a Docker container"""
    result = DockerService.stop_container(container_id)
    
    if result.get("success"):
        log = AuditLog(
            actor="admin",
            action="docker_container_stopped",
            details=f"Container {container_id} stopped"
        )
        db.session.add(log)
        db.session.commit()
        logger.info("Container stopped: %s", container_id)
        return api_response(True, "Container stopped", result, 200)
    else:
        return api_response(False, result.get("message", "Failed to stop container"), None, 500)


@docker_bp.route("/docker/restart/<container_id>", methods=["POST"])
@jwt_required_api
def restart_container(container_id):
    """Restart a Docker container"""
    result = DockerService.restart_container(container_id)
    
    if result.get("success"):
        log = AuditLog(
            actor="admin",
            action="docker_container_restarted",
            details=f"Container {container_id} restarted"
        )
        db.session.add(log)
        db.session.commit()
        logger.info("Container restarted: %s", container_id)
        return api_response(True, "Container restarted", result, 200)
    else:
        return api_response(False, result.get("message", "Failed to restart container"), None, 500)


@docker_bp.route("/docker/logs/<container_id>", methods=["GET"])
@jwt_required_api
def get_container_logs(container_id):
    """Get logs from a Docker container"""
    lines = request.args.get('lines', 50, type=int)
    logs = DockerService.get_logs(container_id, lines)
    
    return api_response(True, "Container logs fetched", {"logs": logs}, 200)
