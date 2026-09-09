try:
    import docker
except ImportError:
    docker = None
from utils.logger import logger


class DockerService:
    @staticmethod
    def _client():
        if docker is None:
            return None
        try:
            return docker.from_env()
        except Exception as exc:
            logger.warning("Docker SDK unavailable: %s", exc)
            return None

    @staticmethod
    def _container_stats(container):
        try:
            stats = container.stats(stream=False)
            cpu_stats = stats.get("cpu_stats", {})
            precpu_stats = stats.get("precpu_stats", {})
            cpu_total = cpu_stats.get("cpu_usage", {}).get("total_usage", 0)
            precpu_total = precpu_stats.get("cpu_usage", {}).get("total_usage", 0)
            system_cpu = cpu_stats.get("system_cpu_usage", 0)
            presystem_cpu = precpu_stats.get("system_cpu_usage", 0)
            cpu_delta = max(cpu_total - precpu_total, 0)
            system_delta = max(system_cpu - presystem_cpu, 1)
            cpu_percent = (cpu_delta / system_delta) * 100 * len(cpu_stats.get("cpu_usage", {}).get("percpu_usage", [0]))
            memory = stats.get("memory_stats", {})
            usage = memory.get("usage", 0)
            limit = memory.get("limit", 1)
            mem_percent = (usage / limit) * 100 if limit else 0
            return round(cpu_percent, 2), round(mem_percent, 2)
        except Exception:
            return 0, 0

    @staticmethod
    def get_containers(hostname=None):
        client = DockerService._client()
        if client is None:
            return []
        try:
            containers = []
            for container in client.containers.list(all=True):
                labels = container.labels or {}
                container_hostname = labels.get("shms.hostname") or labels.get("com.shms.hostname")
                if hostname and container_hostname != hostname:
                    continue
                status = "running" if container.status == "running" else "exited"
                cpu_percent, mem_percent = DockerService._container_stats(container)
                containers.append({
                    "id": container.id[:12],
                    "name": container.name,
                    "status": status,
                    "uptime": container.attrs.get("State", {}).get("Status", status),
                    "image": container.image.tags[0] if container.image.tags else container.image.short_id,
                    "cpu": cpu_percent,
                    "memory": mem_percent,
                    "hostname": container_hostname,
                })
            return containers
        except Exception as exc:
            logger.error("Docker SDK error: %s", exc)
            return []

    @staticmethod
    def start_container(container_id):
        client = DockerService._client()
        if client is None:
            return {"success": False, "message": "Docker daemon unavailable"}
        try:
            container = client.containers.get(container_id)
            container.start()
            logger.info("Container started: %s", container_id)
            return {"success": True, "container_id": container_id}
        except Exception as exc:
            logger.error("Failed to start container: %s", exc)
            return {"success": False, "message": str(exc)}

    @staticmethod
    def stop_container(container_id):
        client = DockerService._client()
        if client is None:
            return {"success": False, "message": "Docker daemon unavailable"}
        try:
            container = client.containers.get(container_id)
            container.stop()
            logger.info("Container stopped: %s", container_id)
            return {"success": True, "container_id": container_id}
        except Exception as exc:
            logger.error("Failed to stop container: %s", exc)
            return {"success": False, "message": str(exc)}

    @staticmethod
    def restart_container(container_id):
        client = DockerService._client()
        if client is None:
            return {"success": False, "message": "Docker daemon unavailable"}
        try:
            container = client.containers.get(container_id)
            container.restart()
            logger.info("Container restarted: %s", container_id)
            return {"success": True, "container_id": container_id}
        except Exception as exc:
            logger.error("Failed to restart container: %s", exc)
            return {"success": False, "message": str(exc)}

    @staticmethod
    def get_logs(container_id, lines=50):
        client = DockerService._client()
        if client is None:
            return []
        try:
            container = client.containers.get(container_id)
            logs = container.logs(tail=lines).decode("utf-8", errors="replace")
            return logs.splitlines()
        except Exception as exc:
            logger.error("Failed to get Docker logs: %s", exc)
            return []
