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
        if container.status != "running":
            return 0, 0
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
            percpu = cpu_stats.get("cpu_usage", {}).get("percpu_usage", [0]) or [0]
            cpu_percent = (cpu_delta / system_delta) * 100 * len(percpu)
            memory = stats.get("memory_stats", {})
            usage = memory.get("usage", 0)
            limit = memory.get("limit", 1)
            mem_percent = (usage / limit) * 100 if limit else 0
            return round(max(0.0, min(100.0, cpu_percent)), 2), round(max(0.0, min(100.0, mem_percent)), 2)
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
                if hostname and container_hostname and container_hostname.lower() != hostname.lower():
                    continue

                status = container.status or "unknown"
                uptime = container.attrs.get("State", {}).get("Status", status)
                
                # Resilient image tag resolution
                image_name = None
                try:
                    if container.image and container.image.tags:
                        image_name = container.image.tags[0]
                    elif container.image and container.image.short_id:
                        image_name = container.image.short_id
                except Exception:
                    pass

                if not image_name:
                    image_name = container.attrs.get("Config", {}).get("Image", "unknown")

                # Format ports
                ports_data = container.attrs.get("NetworkSettings", {}).get("Ports") or {}
                ports_list = []
                for c_port, bindings in ports_data.items():
                    if bindings:
                        for b in bindings:
                            h_port = b.get("HostPort")
                            if h_port:
                                ports_list.append(f"{h_port}:{c_port}")
                    else:
                        ports_list.append(c_port)
                ports_str = ", ".join(ports_list) if ports_list else "--"

                cpu_percent, mem_percent = DockerService._container_stats(container)
                containers.append({
                    "id": container.id[:12],
                    "name": container.name,
                    "status": status,
                    "uptime": uptime,
                    "image": image_name,
                    "ports": ports_str,
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
